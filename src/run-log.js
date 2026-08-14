import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

function runFile(workspace, runId) {
  if (!/^[A-Za-z0-9_-]+$/.test(runId)) throw new Error('Invalid run ID.');
  return path.join(workspace.workspaceRoot, '.kryptic', 'runs', `${runId}.json`);
}

export async function createRun(workspace, request, metadata = {}) {
  const runId = `${new Date().toISOString().replaceAll(/[-:.]/g, '').slice(0, 15)}-${crypto.randomBytes(3).toString('hex')}`;
  const runDir = path.join(workspace.workspaceRoot, '.kryptic', 'runs');
  await fs.mkdir(runDir, { recursive: true });
  const run = { runId, status: 'created', startedAt: new Date().toISOString(), request, metadata, events: [] };
  await fs.writeFile(runFile(workspace, runId), `${JSON.stringify(run, null, 2)}\n`, 'utf8');
  return { ...run, path: path.join('.kryptic', 'runs', `${runId}.json`) };
}

export async function readRun(workspace, runId) {
  return JSON.parse(await fs.readFile(runFile(workspace, runId), 'utf8'));
}

export async function appendRunEvent(workspace, runId, event) {
  const run = await readRun(workspace, runId);
  run.events.push({ at: new Date().toISOString(), ...event });
  await fs.writeFile(runFile(workspace, runId), `${JSON.stringify(run, null, 2)}\n`, 'utf8');
  return run;
}

export async function updateRunStatus(workspace, runId, status, details = {}) {
  const allowed = new Set(['created', 'planning', 'executing', 'blocked', 'failed', 'completed', 'interrupted']);
  if (!allowed.has(status)) throw new Error(`Invalid run status: ${status}`);
  const run = await readRun(workspace, runId);
  run.status = status;
  run.updatedAt = new Date().toISOString();
  run.statusDetails = details;
  run.events.push({ at: run.updatedAt, kind: 'status', status, details });
  await fs.writeFile(runFile(workspace, runId), `${JSON.stringify(run, null, 2)}\n`, 'utf8');
  return run;
}

export async function listRuns(workspace) {
  const runDir = path.join(workspace.workspaceRoot, '.kryptic', 'runs');
  let names;
  try { names = await fs.readdir(runDir); } catch { return []; }
  const runs = [];
  for (const name of names.filter((item) => item.endsWith('.json')).sort()) {
    try { runs.push(await readRun(workspace, name.slice(0, -5))); } catch {}
  }
  return runs.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
}
