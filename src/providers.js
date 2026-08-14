import { classifyProviderFailure, ProviderError } from './provider-errors.js';
import { normalizeProviderResponse } from './provider-response.js';

const PROVIDERS = {
  google: {
    label: 'Google Gemini',
    keyEnv: 'GEMINI_API_KEY',
    modelEnv: 'KRYPTIC_GOOGLE_MODEL',
    defaultModel: 'gemini-2.0-flash',
    protocol: 'google'
  },
  openai: {
    label: 'OpenAI',
    keyEnv: 'OPENAI_API_KEY',
    modelEnv: 'KRYPTIC_OPENAI_MODEL',
    defaultModel: 'gpt-4o-mini',
    protocol: 'openai'
  },
  claude: {
    label: 'Anthropic Claude',
    keyEnv: 'ANTHROPIC_API_KEY',
    modelEnv: 'KRYPTIC_CLAUDE_MODEL',
    defaultModel: 'claude-3-5-haiku-latest',
    protocol: 'anthropic'
  }
};

export function providerDefinition(id) {
  const provider = PROVIDERS[id];
  if (!provider) throw new Error(`Unknown provider: ${id}. Choose google, openai, or claude.`);
  return provider;
}

export function providerStatus(id) {
  const provider = providerDefinition(id);
  const key = process.env[provider.keyEnv] || '';
  return { id, label: provider.label, model: process.env[provider.modelEnv] || provider.defaultModel, configured: Boolean(key), keyEnv: provider.keyEnv };
}

function openAiRequest(model, messages, tools) {
  return { model, messages, ...(tools?.length ? { tools } : {}) };
}

function googleRequest(messages) {
  const contents = messages.filter((message) => message.role !== 'system').map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }]
  }));
  const system = messages.find((message) => message.role === 'system');
  return { ...(system ? { systemInstruction: { parts: [{ text: system.content }] } } : {}), contents };
}

function anthropicRequest(model, messages, tools) {
  const system = messages.find((message) => message.role === 'system')?.content;
  return { model, max_tokens: 4096, ...(system ? { system } : {}), messages: messages.filter((message) => message.role !== 'system'), ...(tools?.length ? { tools } : {}) };
}

export async function chat({ providerId, messages, tools = [], maxRetries = 0, timeoutMs = 30000 }) {
  const provider = providerDefinition(providerId);
  const status = providerStatus(providerId);
  if (!status.configured) throw new Error(`${provider.label} is not configured. Set ${provider.keyEnv}.`);
  const model = status.model;
  let url;
  let headers = { 'content-type': 'application/json' };
  let body;
  if (provider.protocol === 'openai') {
    url = 'https://api.openai.com/v1/chat/completions';
    headers.authorization = `Bearer ${process.env[provider.keyEnv]}`;
    body = openAiRequest(model, messages, tools);
  } else if (provider.protocol === 'anthropic') {
    url = 'https://api.anthropic.com/v1/messages';
    headers['x-api-key'] = process.env[provider.keyEnv];
    headers['anthropic-version'] = '2023-06-01';
    body = anthropicRequest(model, messages, tools);
  } else {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    headers['x-goog-api-key'] = process.env[provider.keyEnv];
    body = googleRequest(messages);
  }
  let response;
  let raw;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
        raw = await response.text();
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      const kind = error?.name === 'AbortError' ? 'timeout' : 'network';
      const failure = new ProviderError(`${provider.label} network request failed: ${error.message}`, { provider: providerId, kind, retryable: true });
      if (attempt < maxRetries) continue;
      throw failure;
    }
    if (response.ok) break;
    const failure = classifyProviderFailure(provider.label, response.status, raw);
    if (!failure.retryable || attempt >= maxRetries) throw failure;
  }
  let data;
  try { data = JSON.parse(raw); } catch { throw new ProviderError(`${provider.label} returned invalid JSON.`, { provider: providerId, kind: 'response', retryable: false }); }
  return normalizeProviderResponse(provider.protocol, providerId, model, data);
}

export function listProviders() {
  return Object.keys(PROVIDERS).map(providerStatus);
}
