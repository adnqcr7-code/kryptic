export class ProviderError extends Error {
  constructor(message, { provider, status, kind = 'unknown', retryable = false, requestId = null } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.provider = provider;
    this.status = status;
    this.kind = kind;
    this.retryable = retryable;
    this.requestId = requestId;
  }
}

export function classifyProviderFailure(provider, status, raw) {
  const lower = String(raw).toLowerCase();
  const kind = status === 401 || status === 403 ? 'authentication' : status === 429 ? 'rate_limit' : status >= 500 ? 'upstream' : lower.includes('timeout') ? 'timeout' : 'request';
  return new ProviderError(`${provider} request failed (${status}): ${String(raw).slice(0, 500)}`, { provider, status, kind, retryable: ['rate_limit', 'upstream', 'timeout'].includes(kind) });
}
