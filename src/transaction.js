import fs from 'node:fs/promises';
import path from 'node:path';

function snapshotFile(workspace, runId) {
  if (!/^[A-Za-z0-9_-]+$/.test(runId)) throw new Error('Invalid run ID.');
  return path.join(workspace.workspaceRoot, '.kryptic', 'transactions', `${runId}.json`);
}

async function readSnapshot(workspace, runId) {
  try { return JSON.parse(await fs.readFile(snapshotFile(workspace, runId), 'utf8')); } catch { return { runId, files: [] }; }
}

export async function snapshotBeforeEdit(workspace, runId, relativePath) {
  const snapshot = await readSnapshot(workspace, runId);
  if (snapshot.files.some((item) => item.path === relativePath)) return snapshot;
  let existed = true;
  let content = null;
  try { content = await workspace.readFile(relativePath); } catch (error) {
    if (!/ENOENT|not found/i.test(error.code || error.message)) throw error;
    existed = false;
  }
  snapshot.files.push({ path: relativePath, existed, content });
  await fs.mkdir(path.dirname(snapshotFile(workspace, runId)), { recursive: true });
  await fs.writeFile(snapshotFile(workspace, runId), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  return snapshot;
}

export async function rollbackRun(workspace, runId) {
  const snapshot = await readSnapshot(workspace, runId);
  for (const item of [...snapshot.files].reverse()) {
    const absolute = workspace.safeMutationPath ? await workspace.safeMutationPath(item.path) : workspace.resolveInside(item.path);
    if (item.existed) await workspace.writeFile(item.path, item.content);
    else await fs.rm(absolute, { force: true });
  }
  return { runId, restored: snapshot.files.map((item) => item.path) };
}

export async function readTransaction(workspace, runId) {
  return readSnapshot(workspace, runId);
}
