import fs from 'node:fs/promises';
import path from 'node:path';

const ALLOWED_ORIGINS = new Set(['owner', 'agent', 'untrusted', 'system']);

export async function appendMemory(workspace, { text, origin = 'agent', sessionKind = 'interactive', source = 'unknown' }) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Memory text must be non-empty.');
  if (!ALLOWED_ORIGINS.has(origin)) throw new Error(`Invalid memory origin: ${origin}`);
  const memoryDir = path.join(workspace.workspaceRoot, '.kryptic', 'memory');
  await fs.mkdir(memoryDir, { recursive: true });
  const filePath = path.join(memoryDir, 'episodic.md');
  const entry = `\n## ${new Date().toISOString()}\n\n- Origin: ${origin}\n- Session: ${sessionKind}\n- Source: ${source}\n\n${text.trim()}\n`;
  await fs.appendFile(filePath, entry, 'utf8');
  return { path: path.join('.kryptic', 'memory', 'episodic.md'), origin, sessionKind };
}

export async function searchMemory(workspace, query, limit = 5) {
  const filePath = path.join(workspace.workspaceRoot, '.kryptic', 'memory', 'episodic.md');
  let content;
  try { content = await fs.readFile(filePath, 'utf8'); } catch { return []; }
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return content.split(/\n(?=## )/).filter(Boolean)
    .map((entry) => ({ entry, score: terms.reduce((score, term) => score + (entry.toLowerCase().includes(term) ? 1 : 0), 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry.trim());
}
