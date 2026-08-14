export async function applyExactPatch(workspace, { path, oldText, newText }) {
  const current = await workspace.readFile(path);
  const matches = current.split(oldText).length - 1;
  if (matches === 0) throw new Error(`Patch anchor was not found in ${path}.`);
  if (matches > 1) throw new Error(`Patch anchor is ambiguous in ${path}; found ${matches} matches.`);
  const next = current.replace(oldText, () => newText);
  const result = await workspace.writeFile(path, next);
  return { ...result, replacements: 1, changed: current !== next };
}
