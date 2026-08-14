import { discoverTestCommand } from './verification.js';
import { runCommand } from './executor.js';

function classifyEvidence(result) {
  if (result.exitCode === 0) return 'passed';
  const text = `${result.stdout}\n${result.stderr}`.toLowerCase();
  if (result.durationMs >= result.timeoutMs || text.includes('timed out') || text.includes('timeout')) return 'timeout';
  if (/syntaxerror|parse error|unexpected token/.test(text)) return 'syntax';
  if (/test|assert|expect|failed|failure/.test(text)) return 'test_failure';
  if (/module not found|cannot find module|no such file|not recognized/.test(text)) return 'environment';
  return 'command_failure';
}

export async function verifyWorkspace(workspace, { command = null, timeoutMs = 120000, maxBuffer = 2 * 1024 * 1024 } = {}) {
  const selectedCommand = command || await discoverTestCommand(workspace);
  if (!selectedCommand) return { status: 'not_configured', passed: false, command: null, classification: 'missing_test_contract', evidence: 'No supported test contract was found.' };
  const result = await runCommand(workspace, selectedCommand, { timeoutMs, maxBuffer });
  const classification = classifyEvidence({ ...result, timeoutMs });
  return { status: result.exitCode === 0 ? 'verified' : 'failed', passed: result.exitCode === 0, command: selectedCommand, classification, exitCode: result.exitCode, durationMs: result.durationMs, stdout: String(result.stdout).slice(0, 20000), stderr: String(result.stderr).slice(0, 20000), review: result.review };
}

export function verificationToolDefinition() {
  return { name: 'verify_workspace', description: 'Run the project’s discovered or explicitly supplied test command and return structured evidence. Never infer success without execution.', input: { command: 'optional string', timeoutMs: 'optional integer' }, output: 'VerificationEvidence' };
}
