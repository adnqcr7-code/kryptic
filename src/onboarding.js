import readline from 'node:readline/promises';
import process from 'node:process';
import { listProviders } from './providers.js';
import { saveProviderSecret, loadSavedSecrets, secretsLocation } from './secrets.js';
import { runSetupChecks } from './setup.js';
import { prepareDependencies } from './dependencies.js';

const PROVIDERS = ['google', 'openai', 'claude'];

function promptInterface() {
  return readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
}

async function hiddenQuestion(prompt) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('First-run setup requires an interactive terminal. Set the provider API environment variable and retry in non-interactive mode.');
  process.stdout.write(prompt);
  return new Promise((resolve, reject) => {
    let value = '';
    const onData = (chunk) => {
      const text = chunk.toString();
      for (const char of text) {
        if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.off('data', onData);
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u0003') { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off('data', onData); reject(new Error('Setup cancelled.')); return; }
        if (char === '\u007f') { value = value.slice(0, -1); continue; }
        value += char;
      }
    };
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}

export async function firstRunSetup(workspace, { launch = false, chooseProvider = null, readKey = null, output = process.stdout } = {}) {
  await loadSavedSecrets();
  const available = listProviders();
  const configured = available.find((provider) => provider.configured);
  if (configured && !chooseProvider) return { status: 'already_configured', provider: configured.id, secretsPath: secretsLocation() };
  const rl = promptInterface();
  try {
    output.write('Kryptic first-run setup\n\n');
    output.write('Choose a provider:\n1) Google Gemini\n2) OpenAI\n3) Anthropic Claude\n');
    const selection = chooseProvider ? await chooseProvider(available) : await rl.question('Provider [1-3]: ');
    const providerId = typeof selection === 'string' && PROVIDERS.includes(selection) ? selection : PROVIDERS[Number(selection) - 1];
    if (!providerId) throw new Error('Choose Google, OpenAI, or Anthropic Claude.');
    const envConfigured = listProviders().find((provider) => provider.id === providerId)?.configured;
    if (!envConfigured) {
      rl.close();
      const apiKey = readKey ? await readKey(providerId) : await hiddenQuestion(`Paste your ${providerId} API key (input hidden): `);
      await saveProviderSecret(providerId, apiKey);
    }
    const dependencies = await prepareDependencies(workspace);
    const checks = await runSetupChecks(workspace);
    output.write(`Saved provider configuration in a protected user-level file: ${secretsLocation()}\n`);
    output.write(`Dependencies: ${dependencies.status}${dependencies.installedNow ? ' (installed)' : ''}\\n`);
    output.write(`Setup status: ${checks.status}\\n`);
    if (launch) output.write('Starting Kryptic chat...\n');
    return { status: 'configured', provider: providerId, checks, secretsPath: secretsLocation() };
  } finally {
    rl.close();
  }
}
