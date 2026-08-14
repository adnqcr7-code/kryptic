const BRIDGE_URL = 'http://127.0.0.1:8765';
// Optional: set this to the same local-only token as KRYPTIC_BROWSER_BRIDGE_TOKEN when token auth is enabled.
const BRIDGE_TOKEN = '';
function bridgeHeaders() { return { 'content-type': 'application/json', ...(BRIDGE_TOKEN ? { 'x-kryptic-bridge-token': BRIDGE_TOKEN } : {}) }; }

const tabs = new Map();

async function activeTab() {
  const result = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return result[0];
}

async function sendToTab(message) {
  const tab = await activeTab();
  if (!tab?.id) throw new Error('No active tab is available.');
  return chrome.tabs.sendMessage(tab.id, message);
}

async function bridgeEvent(event) {
  try {
    await fetch(`${BRIDGE_URL}/event`, { method: 'POST', headers: bridgeHeaders(), body: JSON.stringify(event) });
    return true;
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const tabId = sender.tab?.id || (await activeTab())?.id;
    if (message.type === 'inspect_active_tab') {
      const page = await sendToTab({ type: 'inspect_page' });
      sendResponse({ ok: true, page });
      return;
    }
    if (message.type === 'set_working') {
      const result = await sendToTab({ type: 'set_working', text: message.text });
      sendResponse(result);
      return;
    }
    if (message.type === 'request_takeover') {
      const result = await sendToTab({ type: 'takeover_request' });
      await bridgeEvent({ type: 'takeover_requested', tabId, url: sender.tab?.url || null });
      sendResponse(result);
      return;
    }
    if (message.type === 'handback') {
      const result = await sendToTab({ type: 'handback' });
      await bridgeEvent({ type: 'takeover_ended', tabId });
      sendResponse(result);
      return;
    }
    if (message.type === 'scroll_page') {
      const result = await sendToTab({ type: 'scroll_page', direction: message.direction, amount: message.amount });
      sendResponse(result);
      return;
    }
    if (message.type === 'takeover_started' || message.type === 'takeover_ended' || message.type === 'content_ready') {
      tabs.set(tabId, { ...message, at: new Date().toISOString() });
      await bridgeEvent({ ...message, tabId, url: sender.tab?.url || null });
      sendResponse({ ok: true });
      return;
    }
    sendResponse({ ok: false, error: 'Unknown extension message.' });
  })().catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

async function pollCommands() {
  try {
    const response = await fetch(`${BRIDGE_URL}/commands`);
    const data = await response.json();
    for (const command of data.commands || []) {
      try {
        let result;
        if (command.name === 'inspect_page') result = await sendToTab({ type: 'inspect_page' });
        else if (command.name === 'scroll_page') result = await sendToTab({ type: 'scroll_page', direction: command.args.direction, amount: command.args.amount });
        else if (command.name === 'set_working') result = await sendToTab({ type: 'set_working', text: command.args.text });
        else if (command.name === 'takeover_request') result = await sendToTab({ type: 'takeover_request' });
        else if (command.name === 'handback') result = await sendToTab({ type: 'handback' });
        await fetch(`${BRIDGE_URL}/command-result`, { method: 'POST', headers: bridgeHeaders(), body: JSON.stringify({ commandId: command.commandId, result }) });
      } catch (error) {
        await fetch(`${BRIDGE_URL}/command-result`, { method: 'POST', headers: bridgeHeaders(), body: JSON.stringify({ commandId: command.commandId, error: error.message }) });
      }
    }
  } catch {}
}
setInterval(pollCommands, 500);

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-takeover') {
    try { await sendToTab({ type: 'takeover_request' }); } catch {}
  }
});
