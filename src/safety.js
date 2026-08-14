const BLOCKED_PATTERNS = [
  /(^|\s)(rm|rmdir|del|erase|format|sudo|shutdown|reboot)(\s|$)/i,
  /(^|\s)(curl|wget|nc|netcat)(\s|$)/i,
  /(^|\s)(git\s+reset|git\s+clean|git\s+push|git\s+rebase)(\s|$)/i,
  /(^|\s)(powershell|pwsh|cmd\.exe)(\s|$)/i,
  /[;&|`]\s*(rm|del|format|sudo|curl|wget)\b/i
];

const APPROVED_PREFIXES = [/^node\b/i, /^npm\b/i, /^npx\b/i, /^pnpm\b/i, /^yarn\b/i, /^python(?:3)?\b/i, /^pytest\b/i, /^go\s+(test|vet|build)\b/i, /^cargo\s+(test|check|build)\b/i, /^git\s+(status|diff|log)\b/i];

function hasUnquotedShellMetacharacter(command) {
  let quote = null;
  let escaped = false;
  for (const char of command) {
    if (escaped) { escaped = false; continue; }
    if (char === '\\' && quote === '"') { escaped = true; continue; }
    if ((char === '"' || char === "'") && (!quote || quote === char)) { quote = quote ? null : char; continue; }
    if (!quote && /[;&|`$()<>]/.test(char)) return true;
  }
  return Boolean(quote);
}

export function reviewCommand(command) {
  if (typeof command !== 'string' || !command.trim()) return { level: 'high', reason: 'Command is empty.' };
  if (hasUnquotedShellMetacharacter(command)) return { level: 'high', reason: 'Unquoted shell metacharacters or unclosed quotes are not permitted; use one direct development command.' };
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(command))) return { level: 'high', reason: 'Command matches a blocked or destructive pattern.' };
  if (!APPROVED_PREFIXES.some((pattern) => pattern.test(command.trim()))) return { level: 'medium', reason: 'Command is outside the default development command allowlist.' };
  return { level: 'low', reason: 'Command matches the default development command allowlist.' };
}

export function assertCommandAllowed(command, { allowMedium = false } = {}) {
  const review = reviewCommand(command);
  if (review.level === 'high' || (review.level === 'medium' && !allowMedium)) {
    throw new Error(`Command blocked: ${review.reason} ${command}`);
  }
  return review;
}
