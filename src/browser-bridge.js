import http from 'node:http';
import crypto from 'node:crypto';

function allowedOrigin(origin) {
  return !origin || origin === 'null' || origin.startsWith('chrome-extension://') || origin.startsWith('http://127.0.0.1:') || origin.startsWith('http://localhost:');
}

function json(response, status, body, origin = '') {
  const headers = { 'content-type': 'application/json', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,x-kryptic-bridge-token' };
  if (origin && allowedOrigin(origin)) headers['access-control-allow-origin'] = origin;
  response.writeHead(status, headers);
  response.end(JSON.stringify(body));
}

function tokenMatches(expected, supplied) {
  if (!expected) return true;
  if (typeof supplied !== 'string') return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createBrowserBridge({ port = 8765, host = '127.0.0.1', onEvent = async () => ({ accepted: true }), maxEvents = 100, maxCommands = 50, commandTtlMs = 30000, token = process.env.KRYPTIC_BROWSER_BRIDGE_TOKEN || null } = {}) {
  const events = [];
  const commands = new Map();
  const subscribers = new Set();
  const cleanup = () => {
    const now = Date.now();
    for (const [id, command] of commands) if (command.status === 'queued' && now - command.createdAt > commandTtlMs) Object.assign(command, { status: 'failed', error: 'Browser command expired before the extension acknowledged it.', completedAt: now });
    while (events.length > maxEvents) events.shift();
    while (commands.size > maxCommands) {
      const oldest = commands.keys().next().value;
      if (oldest) commands.delete(oldest); else break;
    }
  };
  const cleanupTimer = setInterval(cleanup, Math.min(commandTtlMs, 5000));
  const server = http.createServer(async (request, response) => {
    const origin = request.headers.origin || '';
    if (!allowedOrigin(origin)) return json(response, 403, { ok: false, error: 'Origin is not allowed.' }, origin);
    if (request.method === 'OPTIONS') return json(response, 204, {}, origin);
    if (request.url === '/health' && request.method === 'GET') { cleanup(); return json(response, 200, { ok: true, service: 'kryptic-browser-bridge', queuedEvents: events.length, queuedCommands: [...commands.values()].filter((item) => item.status === 'queued').length, authentication: token ? 'required' : 'origin-restricted' }, origin); }
    if (!tokenMatches(token, request.headers['x-kryptic-bridge-token'])) return json(response, 401, { ok: false, error: 'Bridge authentication required.' }, origin);
    if (request.url === '/events' && request.method === 'GET') { cleanup(); return json(response, 200, { events: events.slice(-100) }, origin); }
    if (request.url === '/commands' && request.method === 'GET') { cleanup(); return json(response, 200, { commands: [...commands.values()].filter((item) => item.status === 'queued') }, origin); }
    if (request.url.startsWith('/command-result/') && request.method === 'GET') {
      cleanup();
      const command = commands.get(decodeURIComponent(request.url.split('/').pop()));
      return command ? json(response, 200, command, origin) : json(response, 404, { ok: false, error: 'Unknown command.' }, origin);
    }
    if (request.url === '/command-result' && request.method === 'POST') {
      let raw = '';
      request.on('data', (chunk) => { if (raw.length < 100000) raw += chunk; });
      request.on('end', () => {
        try {
          const update = JSON.parse(raw || '{}');
          const command = commands.get(update.commandId);
          if (!command) return json(response, 404, { ok: false, error: 'Unknown command.' }, origin);
          if (command.status !== 'queued') return json(response, 409, { ok: false, error: 'Command is no longer awaiting a result.' }, origin);
          Object.assign(command, { status: update.error ? 'failed' : 'completed', result: update.result, error: update.error, completedAt: Date.now() });
          cleanup();
          return json(response, 200, { ok: true }, origin);
        } catch (error) { return json(response, 400, { ok: false, error: error.message }, origin); }
      });
      return;
    }
    if (request.url === '/command' && request.method === 'POST') {
      let raw = '';
      request.on('data', (chunk) => { if (raw.length < 100000) raw += chunk; });
      request.on('end', () => {
        try {
          const value = JSON.parse(raw || '{}');
          if (!['inspect_page', 'scroll_page', 'set_working', 'takeover_request', 'handback'].includes(value.name)) return json(response, 400, { ok: false, error: 'Unsupported browser command.' }, origin);
          const commandId = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
          cleanup();
          if (commands.size >= maxCommands) return json(response, 429, { ok: false, error: 'Browser command queue is full.' }, origin);
          commands.set(commandId, { commandId, name: value.name, args: value.args || {}, status: 'queued', createdAt: Date.now() });
          return json(response, 200, { ok: true, commandId }, origin);
        } catch (error) { return json(response, 400, { ok: false, error: error.message }, origin); }
      });
      return;
    }
    if (request.url === '/event' && request.method === 'POST') {
      let raw = '';
      request.on('data', (chunk) => { if (raw.length < 100000) raw += chunk; });
      request.on('end', async () => {
        try {
          const event = JSON.parse(raw || '{}');
          const result = await onEvent(event);
          events.push({ at: new Date().toISOString(), event, result });
          cleanup();
          for (const subscriber of subscribers) subscriber({ event, result });
          return json(response, 200, { ok: true, result }, origin);
        } catch (error) { return json(response, 400, { ok: false, error: error.message }, origin); }
      });
      return;
    }
    return json(response, 404, { ok: false, error: 'Not found.' }, origin);
  });
  return {
    server,
    events,
    commands,
    authToken: token,
    subscribe(callback) { subscribers.add(callback); return () => subscribers.delete(callback); },
    listen() { return new Promise((resolve) => server.listen(port, host, () => resolve({ port: server.address().port, host, authenticated: Boolean(token) }))); },
    close() { clearInterval(cleanupTimer); return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
  };
}

if (process.argv[1]?.endsWith('browser-bridge.js')) {
  const bridge = createBrowserBridge({ onEvent: async (event) => ({ accepted: event.type !== 'unknown' }) });
  bridge.listen().then(({ port, authenticated }) => console.log(`Kryptic browser bridge listening on 127.0.0.1:${port} (${authenticated ? 'token auth enabled' : 'origin restricted; set KRYPTIC_BROWSER_BRIDGE_TOKEN for token auth'})`));
}
