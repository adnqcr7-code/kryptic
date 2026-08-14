import fs from 'node:fs/promises';

export async function discoverTestCommand(workspace) {
  try {
    const packageJson = JSON.parse(await workspace.readFile('package.json'));
    if (packageJson.scripts?.test) return 'npm test';
  } catch {}
  try {
    await workspace.readFile('pyproject.toml');
    return 'pytest';
  } catch {}
  try {
    await workspace.readFile('go.mod');
    return 'go test ./...';
  } catch {}
  try {
    await workspace.readFile('Cargo.toml');
    return 'cargo test';
  } catch {}
  return null;
}

export async function verifyCommandResult(result) {
  return {
    passed: result?.exitCode === 0,
    exitCode: result?.exitCode ?? 1,
    stdout: String(result?.stdout || '').slice(0, 10000),
    stderr: String(result?.stderr || '').slice(0, 10000)
  };
}
