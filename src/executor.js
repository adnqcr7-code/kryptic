import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { assertCommandAllowed, reviewCommand } from './safety.js';

const execFileAsync = promisify(execFile);

function parseDirectCommand(command) {
  const tokens = [];
  const pattern = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^']*)'|([^\s]+)/g;
  let match;
  let lastIndex = 0;
  while ((match = pattern.exec(command)) !== null) {
    if (command.slice(lastIndex, match.index).trim()) throw new Error('Command must use simple direct arguments without shell syntax.');
    tokens.push(match[1] ?? match[2] ?? match[3]);
    lastIndex = pattern.lastIndex;
  }
  if (command.slice(lastIndex).trim() || !tokens.length) throw new Error('Command must use simple direct arguments without shell syntax.');
  return tokens;
}

function executableForPlatform(file) {
  return process.platform === 'win32' && ['npm', 'npx', 'pnpm', 'yarn'].includes(file.toLowerCase()) ? `${file}.cmd` : file;
}

export async function runCommand(workspace, command, options = {}) {
  const review = reviewCommand(command);
  assertCommandAllowed(command, options);
  const [file, ...args] = parseDirectCommand(command);
  const startedAt = Date.now();
  try {
    const result = await execFileAsync(executableForPlatform(file), args, {
      cwd: workspace.workspaceRoot,
      timeout: options.timeoutMs || 120000,
      maxBuffer: options.maxBuffer || 2 * 1024 * 1024,
      windowsHide: true,
      shell: false
    });
    return { command, review, exitCode: 0, stdout: result.stdout, stderr: result.stderr, durationMs: Date.now() - startedAt };
  } catch (error) {
    return { command, review, exitCode: Number.isInteger(Number(error.code)) ? Number(error.code) : 1, stdout: error.stdout || '', stderr: error.stderr || error.message, durationMs: Date.now() - startedAt };
  }
}
