import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const KEY_ENV = { google: 'GEMINI_API_KEY', openai: 'OPENAI_API_KEY', claude: 'ANTHROPIC_API_KEY' };

function configDirectory() {
  if (process.env.KRYPTIC_CONFIG_DIR) return path.resolve(process.env.KRYPTIC_CONFIG_DIR);
  if (process.platform === 'win32') return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Kryptic');
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'kryptic');
}

function secretsPath() { return path.join(configDirectory(), 'secrets.json'); }

async function restrictPermissions(file) {
  if (process.platform !== 'win32') {
    try { await fs.chmod(file, 0o600); } catch {}
  } else {
    try {
      const { execFile } = await import('node:child_process');
      await new Promise((resolve) => execFile('icacls', [file, '/inheritance:r', '/grant:r', `${process.env.USERNAME}:F`], () => resolve()));
    } catch {}
  }
}

export function providerEnv(providerId) {
  if (!KEY_ENV[providerId]) throw new Error(`Unsupported provider: ${providerId}`);
  return KEY_ENV[providerId];
}

export async function loadSavedSecrets() {
  let saved = {};
  try { saved = JSON.parse(await fs.readFile(secretsPath(), 'utf8')); } catch { return { loaded: false, path: secretsPath() }; }
  for (const [providerId, envName] of Object.entries(KEY_ENV)) {
    if (!process.env[envName] && typeof saved[providerId] === 'string' && saved[providerId]) process.env[envName] = saved[providerId];
  }
  return { loaded: true, path: secretsPath(), providers: Object.keys(saved).filter((id) => KEY_ENV[id]) };
}

export async function saveProviderSecret(providerId, apiKey) {
  const envName = providerEnv(providerId);
  if (typeof apiKey !== 'string' || apiKey.trim().length < 8) throw new Error('API key is too short or empty.');
  const directory = configDirectory();
  await fs.mkdir(directory, { recursive: true });
  let saved = {};
  try { saved = JSON.parse(await fs.readFile(secretsPath(), 'utf8')); } catch {}
  saved[providerId] = apiKey.trim();
  const file = secretsPath();
  await fs.writeFile(file, `${JSON.stringify(saved, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await restrictPermissions(file);
  process.env[envName] = apiKey.trim();
  return { providerId, envName, path: file, persisted: true };
}

export function secretsLocation() { return secretsPath(); }
