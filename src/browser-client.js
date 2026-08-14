const DEFAULT_BRIDGE = 'http://127.0.0.1:8765';

export function createBrowserClient({ baseUrl = DEFAULT_BRIDGE, pollMs = 100, timeoutMs = 15000, token = process.env.KRYPTIC_BROWSER_BRIDGE_TOKEN || null } = {}) {
  async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(token ? { 'x-kryptic-bridge-token': token } : {}), ...(options.headers || {}) } });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || `Browser bridge failed (${response.status}).`);
    return data;
  }
  async function command(name, args = {}) {
    const queued = await request('/command', { method: 'POST', body: JSON.stringify({ name, args }) });
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const result = await request(`/command-result/${encodeURIComponent(queued.commandId)}`);
      if (result.status === 'completed') return result.result;
      if (result.status === 'failed') throw new Error(result.error || 'Browser command failed.');
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
    throw new Error(`Browser command timed out: ${name}`);
  }
  return {
    health: () => request('/health'),
    inspectPage: () => command('inspect_page'),
    scrollPage: (direction, amount = .8) => command('scroll_page', { direction, amount }),
    showWorkingOverlay: (text) => command('set_working', { text }),
    requestTakeover: () => command('takeover_request'),
    handback: () => command('handback')
  };
}
