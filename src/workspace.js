import fs from 'node:fs/promises';
import path from 'node:path';

const IGNORED_NAMES = new Set(['.git', 'node_modules', '.venv', 'venv', 'dist', 'build', '.next']);
const SECRET_NAMES = new Set(['.env', '.env.local', '.env.production', '.npmrc', '.pypirc']);

export function createWorkspace(root) {
  const workspaceRoot = path.resolve(root);

  function resolveInside(relativePath) {
    if (typeof relativePath !== 'string' || !relativePath.trim()) throw new Error('A non-empty relative path is required.');
    const candidate = path.resolve(workspaceRoot, relativePath);
    if (candidate !== workspaceRoot && !candidate.startsWith(`${workspaceRoot}${path.sep}`)) {
      throw new Error(`Path escapes the workspace: ${relativePath}`);
    }
    return candidate;
  }

  function isSecret(relativePath) {
    const normalized = relativePath.replaceAll('\\', '/');
    return normalized.split('/').some((segment) => SECRET_NAMES.has(segment) || segment.endsWith('.pem') || segment.endsWith('.key'));
  }

  async function listFiles(relativeDir = '.', { recursive = false } = {}) {
    const absoluteDir = resolveInside(relativeDir);
    const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
    const results = [];
    for (const entry of entries.filter((item) => !IGNORED_NAMES.has(item.name)).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = path.posix.join(relativeDir === '.' ? '' : relativeDir.replaceAll('\\', '/'), entry.name) || entry.name;
      if (recursive && entry.isDirectory()) results.push(...await listFiles(child, { recursive: true }));
      else results.push(child);
    }
    return results.sort();
  }

  async function safeExistingPath(relativePath) {
    const absolutePath = resolveInside(relativePath);
    const realRoot = await fs.realpath(workspaceRoot);
    const realPath = await fs.realpath(absolutePath);
    if (realPath !== realRoot && !realPath.startsWith(`${realRoot}${path.sep}`)) throw new Error(`Symlink escapes the workspace: ${relativePath}`);
    return realPath;
  }

  async function readFile(relativePath) {
    if (isSecret(relativePath)) throw new Error(`Refusing to read a secret-looking file: ${relativePath}`);
    return fs.readFile(await safeExistingPath(relativePath), 'utf8');
  }

  async function safeMutationPath(relativePath) {
    const absolutePath = resolveInside(relativePath);
    const realRoot = await fs.realpath(workspaceRoot);
    const realParent = await fs.realpath(path.dirname(absolutePath));
    if (realParent !== realRoot && !realParent.startsWith(`${realRoot}${path.sep}`)) throw new Error(`Symlink parent escapes the workspace: ${relativePath}`);
    try {
      const realPath = await fs.realpath(absolutePath);
      if (realPath !== realRoot && !realPath.startsWith(`${realRoot}${path.sep}`)) throw new Error(`Symlink escapes the workspace: ${relativePath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    return absolutePath;
  }

  async function writeFile(relativePath, content) {
    if (isSecret(relativePath)) throw new Error(`Refusing to write a secret-looking file: ${relativePath}`);
    const absolutePath = resolveInside(relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    const realRoot = await fs.realpath(workspaceRoot);
    const realParent = await fs.realpath(path.dirname(absolutePath));
    if (realParent !== realRoot && !realParent.startsWith(`${realRoot}${path.sep}`)) throw new Error(`Symlink parent escapes the workspace: ${relativePath}`);
    await fs.writeFile(absolutePath, content, 'utf8');
    return { path: relativePath, bytes: Buffer.byteLength(content) };
  }

  return { workspaceRoot, resolveInside, isSecret, listFiles, readFile, writeFile, safeExistingPath, safeMutationPath };
}
