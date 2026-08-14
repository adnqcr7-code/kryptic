import path from 'node:path';
import { discoverTestCommand } from './verification.js';
import { searchWorkspace } from './search.js';

const LANGUAGE_BY_EXT = new Map([
  ['.js', 'JavaScript'], ['.ts', 'TypeScript'], ['.py', 'Python'], ['.go', 'Go'], ['.rs', 'Rust'], ['.java', 'Java'], ['.rb', 'Ruby'], ['.cs', 'C#'], ['.cpp', 'C++'], ['.c', 'C']
]);

export async function inspectRepository(workspace) {
  const files = await workspace.listFiles('.', { recursive: true });
  const languages = new Set();
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    if (LANGUAGE_BY_EXT.has(extension)) languages.add(LANGUAGE_BY_EXT.get(extension));
  }
  const instructionFiles = [];
  for (const candidate of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'README.md', 'CONTRIBUTING.md']) {
    try { instructionFiles.push({ path: candidate, content: (await workspace.readFile(candidate)).slice(0, 8000) }); } catch {}
  }
  const manifests = [];
  for (const candidate of ['package.json', 'pyproject.toml', 'go.mod', 'Cargo.toml']) {
    try { manifests.push({ path: candidate, content: (await workspace.readFile(candidate)).slice(0, 8000) }); } catch {}
  }
  const markerSearches = await Promise.all(['TODO', 'FIXME', 'HACK'].map((marker) => searchWorkspace(workspace, marker, { maxResults: 25 })));
  const markers = markerSearches.flatMap((search) => search.results).slice(0, 25);
  return { workspace: workspace.workspaceRoot, fileCount: files.length, files, languages: [...languages].sort(), instructionFiles, manifests, testCommand: await discoverTestCommand(workspace), markers };
}
