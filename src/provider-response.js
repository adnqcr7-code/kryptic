import { ProviderError } from './provider-errors.js';

export function normalizeUsage(protocol, usage) {
  if (!usage || typeof usage !== 'object') return null;
  const inputTokens = Number(usage.prompt_tokens ?? usage.input_tokens ?? usage.promptTokenCount ?? 0);
  const outputTokens = Number(usage.completion_tokens ?? usage.output_tokens ?? usage.candidatesTokenCount ?? 0);
  const totalTokens = Number(usage.total_tokens ?? usage.totalTokenCount ?? (inputTokens + outputTokens));
  return {
    inputTokens: Number.isFinite(inputTokens) ? inputTokens : 0,
    outputTokens: Number.isFinite(outputTokens) ? outputTokens : 0,
    totalTokens: Number.isFinite(totalTokens) ? totalTokens : 0,
    provider: protocol
  };
}

export function normalizeProviderResponse(protocol, providerId, model, data) {
  const text = protocol === 'openai'
    ? data.choices?.[0]?.message?.content || ''
    : protocol === 'anthropic'
      ? data.content?.find((part) => part.type === 'text')?.text || ''
      : data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text || '';
  if (!String(text).trim()) throw new ProviderError(`${providerId} returned an empty model response.`, { provider: providerId, kind: 'response', retryable: false });
  const rawUsage = data.usage || data.usageMetadata || null;
  return { provider: providerId, model, text: String(text), usage: normalizeUsage(protocol, rawUsage), rawUsage, raw: data };
}
