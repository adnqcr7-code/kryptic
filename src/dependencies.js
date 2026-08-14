import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';

export async function dependencyStatus(workspace) {
  let manifest;
  try { manifest = JSON.parse(await fs.readFile(path.join(workspace.workspaceRoot, 'package.json'), 'utf8')); } catch { return { status: 'not_applicable', packageManager: null, declared: 0, installed: true }; }
  const declared = Object.keys({ ...(manifest.dependencies || {}), ...(manifest.devDependencies || {}) });
  if (!declared.length) return { status: 'ready', packageManager: 'npm', declared: 0, installed: true, message: 'No external npm dependencies are required.' };
  try { await fs.access(path.join(workspace.workspaceRoot, 'node_modules')); return { status: 'ready', packageManager: 'npm', declared: declared.length, installed: true }; }
  catch { return { status: 'needs_install', packageManager: 'npm', declared: declared.length, installed: false }; }
}

export async function prepareDependencies(workspace) {
  const status = await dependencyStatus(workspace);
  if (status.status !== 'needs_install') return status;
  await new Promise((resolve, reject) => execFile(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: workspace.workspaceRoot, timeout: 180000, windowsHide: true }, (error, stdout, stderr) => error ? reject(new Error(`Dependency installation failed: ${String(stderr || error.message).slice(0, 500)}`)) : resolve({ stdout, stderr })));
  return { ...(await dependencyStatus(workspace)), installedNow: true };
}
