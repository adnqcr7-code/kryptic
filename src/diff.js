export function createUnifiedDiff(filePath, before, after, { maxLines = 200 } = {}) {
  const oldLines = String(before ?? '').split(/\r?\n/);
  const newLines = String(after ?? '').split(/\r?\n/);
  const lines = [`--- a/${filePath}`, `+++ b/${filePath}`];
  const max = Math.max(oldLines.length, newLines.length);
  for (let index = 0; index < max && lines.length < maxLines; index += 1) {
    const oldLine = oldLines[index];
    const newLine = newLines[index];
    if (oldLine === newLine) lines.push(` ${oldLine ?? ''}`);
    else {
      if (oldLine !== undefined) lines.push(`-${oldLine}`);
      if (newLine !== undefined) lines.push(`+${newLine}`);
    }
  }
  if (max > maxLines) lines.push('... diff truncated ...');
  return lines.join('\n');
}
