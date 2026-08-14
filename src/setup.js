import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { providerStatus, listProviders } from './providers.js';
import { discoverTestCommand } from './verification.js';
import { listSkills } from './skills.js';
import { dependencyStatus } from './dependencies.js';

function commandCheck(command, args = ['--version']) {
  try {
    const output = execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 5000 }).trim();
    return { status: 'ready', version: output.split('\n')[0].slice(0, 200) };
  } catch (error) {
    if (error.code === 'ENOENT') return { status: 'missing', version: null };
    return { status: 'unavailable', version: String(error.stderr || error.message).split('\n')[0].slice(0, 200) };
  }
}

function dockerCheck() {
  const installed = commandCheck('docker');
  if (installed.status === 'missing') return { status: 'missing', installed: false, running: false, message: 'Docker is not installed.' };
  try {
    execFileSync('docker', ['info'], { encoding: 'utf8', stdio: 'ignore', timeout: 5000 });
    return { status: 'ready', installed: true, running: true, message: 'Docker is installed and running.' };
  } catch {
    return { status: 'stopped', installed: true, running: false, message: 'Docker is installed but the daemon is not reachable.' };
  }
}

export async function runSetupChecks(workspace) {
  const workspaceRoot = workspace.workspaceRoot;
  const providers = listProviders().map((provider) => ({ ...provider, keyConfigured: provider.configured }));
  const configuredProviders = providers.filter((provider) => provider.configured).map((provider) => provider.id);
  let workspaceSafe = true;
  try { workspace.resolveInside('.'); } catch { workspaceSafe = false; }
  const testCommand = await discoverTestCommand(workspace);
  const dependencies = await dependencyStatus(workspace);
  const browserBridge = process.env.KRYPTIC_BROWSER_BRIDGE_URL
    ? { status: 'configured', url: process.env.KRYPTIC_BROWSER_BRIDGE_URL }
    : { status: 'not_configured', url: null };
  const skills = await listSkills(workspace);
  const checks = {
    node: commandCheck('node'),
    npm: commandCheck('npm'),
    docker: dockerCheck(),
    workspace: { status: workspaceSafe ? 'ready' : 'failed', root: workspaceRoot },
    providers: { status: configuredProviders.length ? 'ready' : 'not_configured', configured: configuredProviders, available: providers.map(({ id, label, model, configured }) => ({ id, label, model, configured })) },
    browserBridge,
    tests: { status: testCommand ? 'ready' : 'not_configured', command: testCommand },
    dependencies,
    skills: { status: 'ready', count: skills.length }
  };
  const blocking = [checks.node, checks.npm, checks.workspace].some((check) => check.status === 'missing' || check.status === 'failed');
  const warnings = [];
  if (!configuredProviders.length) warnings.push('No model provider API key is configured. Chat and model-backed runs will not work yet.');
  if (checks.docker.status !== 'ready') warnings.push(checks.docker.message);
  if (!testCommand) warnings.push('No supported project test contract was discovered.');
  if (dependencies.status === 'needs_install') warnings.push(`${dependencies.declared} npm dependencies are declared but not installed.`);
  if (browserBridge.status !== 'configured') warnings.push('Browser bridge is not configured; browser capabilities remain unavailable.');
  return { version: '1.0.0', status: blocking ? 'blocked' : warnings.length ? 'needs_attention' : 'ready', safety: 'fail-closed', workspace: workspaceRoot, checks, warnings, next: warnings.length ? 'Fix the warnings above, then run setup again.' : 'Kryptic is ready for chat and bounded runs.' };
}
