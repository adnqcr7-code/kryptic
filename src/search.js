import fs from 'node:fs/promises';
import path from 'node:path';

const IGNORED_NAMES = new Set(['.git', 'node_modules', '.venv', 'venv', 'dist', 'build', '.next', '.kryptic']);

export async function searchWorkspace(workspace, query, { maxResults = 50, maxBytes = 2 * 1024 * 1024 } = {}) {
  if (typeof query !== 'string' || !query.trim()) throw new Error('Search query must be non-empty.');
  const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const results = [];
  let scannedBytes = 0;

  async function walk(relativeDir) {
    if (results.length >= maxResults || scannedBytes >= maxBytes) return;
    const absoluteDir = workspace.resolveInside(relativeDir);
    let entries;
    try { entries = await fs.readdir(absoluteDir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (results.length >= maxResults || scannedBytes >= maxBytes || IGNORED_NAMES.has(entry.name)) continue;
      const relativePath = path.posix.join(relativeDir === '.' ? '' : relativeDir.replaceAll('\\', '/'), entry.name) || entry.name;
      const absolutePath = workspace.resolveInside(relativePath);
      if (entry.isDirectory()) { await walk(relativePath); continue; }
      if (!entry.isFile() || workspace.isSecret(relativePath)) continue;
      let stat;
      try { stat = await fs.stat(absolutePath); } catch { continue; }
      if (stat.size > 512 * 1024) continue;
      let content;
      try { content = await workspace.readFile(relativePath); } catch { continue; }
      scannedBytes += Buffer.byteLength(content);
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (results.length >= maxResults) return;
        if (pattern.test(line)) results.push({ path: relativePath, line: index + 1, text: line.slice(0, 500) });
      });
    }
  }
  await walk('.');
  return { query, results, scannedBytes, truncated: results.length >= maxResults || scannedBytes >= maxBytes };
}
