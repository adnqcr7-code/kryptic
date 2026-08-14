import readline from 'node:readline/promises';
import process from 'node:process';

export function createApprovalProvider({ interactive = false, input = process.stdin, output = process.stdout } = {}) {
  if (!interactive || !input.isTTY || !output.isTTY) return async () => false;
  const rl = readline.createInterface({ input, output });
  return async ({ type, path, command }) => {
    const target = path || command || '';
    const answer = await rl.question(`Approve ${type} ${target}? [y/N] `);
    return /^y(?:es)?$/i.test(answer.trim());
  };
}

export async function closeApprovalProvider(provider) {
  if (typeof provider.close === 'function') await provider.close();
}
