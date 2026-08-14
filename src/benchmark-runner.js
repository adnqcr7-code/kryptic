import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorkspace } from './workspace.js';
import { reviewCommand } from './safety.js';
import { validateActions } from './actions.js';
import { createRun, readRun } from './run-log.js';
import { executePlan } from './loop.js';
import { resumePlan } from './resume.js';

export async function runDeterministicBenchmark() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-benchmark-'));
  const workspace = createWorkspace(root);
  const cases = [];
  const record = (name, passed, detail) => cases.push({ name, passed, detail });
  try { workspace.resolveInside('../escape'); record('path traversal refusal', false, 'Traversal was accepted.'); } catch { record('path traversal refusal', true, 'Traversal rejected.'); }
  try { await workspace.readFile('.env'); record('secret-file refusal', false, 'Secret read was accepted.'); } catch { record('secret-file refusal', true, 'Secret read rejected.'); }
  record('destructive-command refusal', reviewCommand('rm -rf .').level === 'high', 'Risk policy reviewed rm -rf.');
  record('network-command refusal', reviewCommand('curl https://example.com').level === 'high', 'Risk policy reviewed curl.');
  record('valid action acceptance', validateActions([{ type: 'read_file', path: 'README.md' }]).length === 0, 'Read action schema accepted.');
  record('invalid action rejection', validateActions([{ type: 'run_command', command: 'rm -rf .' }]).length > 0, 'Blocked command rejected in action validation.');
  record('absolute-path refusal', validateActions([{ type: 'read_file', path: '/etc/passwd' }]).length > 0, 'Absolute path rejected in action validation.');
  record('null-byte refusal', validateActions([{ type: 'read_file', path: `safe${String.fromCharCode(0)}escape` }]).length > 0, 'Null-byte path rejected in action validation.');
  await workspace.writeFile('fixture.txt', 'before');
  const rollbackRun = await createRun(workspace, 'benchmark rollback', { provider: 'offline' });
  const rollbackResult = await executePlan(workspace, rollbackRun.runId, [
    { type: 'write_file', path: 'fixture.txt', content: 'after' },
    { type: 'run_command', command: 'node -e "process.exit(9)"' }
  ], { approve: async () => true });
  record('transactional rollback', rollbackResult.status === 'failed' && await workspace.readFile('fixture.txt') === 'before', 'Failed edit was rolled back before completion.');
  const resumeRun = await createRun(workspace, 'benchmark resume', { provider: 'offline' });
  const resumeActions = [
    { type: 'read_file', path: 'fixture.txt' },
    { type: 'read_file', path: 'fixture.txt' },
    { type: 'read_file', path: 'fixture.txt' }
  ];
  await executePlan(workspace, resumeRun.runId, resumeActions.slice(0, 1), { verify: async () => ({ passed: false }), rollbackOnFailure: false });
  await resumePlan(workspace, resumeRun.runId, resumeActions, { verify: async () => ({ passed: true }), rollbackOnFailure: false });
  const resumeRecord = await readRun(workspace, resumeRun.runId);
  const indexes = resumeRecord.events.filter((event) => event.kind === 'step_completed').map((event) => event.index);
  record('resume index integrity', indexes.join(',') === '0,1,2', 'Repeated resume retained original action indexes.');
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kryptic-repair-fixture-'));
  await fs.cp(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/repair-node'), fixtureRoot, { recursive: true });
  const fixtureWorkspace = createWorkspace(fixtureRoot);
  const fixtureRun = await createRun(fixtureWorkspace, 'repair add implementation', { provider: 'offline' });
  const fixtureResult = await executePlan(fixtureWorkspace, fixtureRun.runId, [
    { type: 'apply_patch', path: 'src/math.js', oldText: 'return a - b;', newText: 'return a + b;' },
    { type: 'verify_workspace' }
  ], { approve: async () => true, verify: async (results) => ({ passed: results.every((item) => item.ok), output: 'fixture verification' }) });
  record('coding fixture repair', fixtureResult.status === 'completed', 'A minimal source repair passed the fixture test contract.');
  await fs.rm(root, { recursive: true, force: true });
  await fs.rm(fixtureRoot, { recursive: true, force: true });
  return { root, passed: cases.filter((item) => item.passed).length, total: cases.length, cases };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDeterministicBenchmark().then((result) => console.log(JSON.stringify(result, null, 2)));
}
