(() => {
  const state = { mode: 'idle', lastRequestId: null };
  let root;

  function ensureOverlay() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'kryptic-overlay-root';
    root.innerHTML = '<div id="kryptic-wave"></div><div id="kryptic-status" hidden><span class="kryptic-dot"></span><span id="kryptic-status-text">Kryptic is working</span><button id="kryptic-takeover" type="button">Take over</button></div>';
    document.documentElement.appendChild(root);
    root.querySelector('#kryptic-takeover').addEventListener('click', () => {
      if (state.mode === 'takeover') handBack();
      else if (state.mode === 'takeover_pending') takeOver();
      else requestTakeover();
    });
    return root;
  }

  function setState(mode, text) {
    state.mode = mode;
    const overlay = ensureOverlay();
    overlay.className = mode === 'takeover' || mode === 'takeover_pending' ? 'kryptic-takeover' : mode === 'working' ? 'kryptic-working' : '';
    const status = overlay.querySelector('#kryptic-status');
    const label = overlay.querySelector('#kryptic-status-text');
    const button = overlay.querySelector('#kryptic-takeover');
    status.hidden = mode === 'idle';
    label.textContent = text || (mode === 'takeover' ? 'You have control' : mode === 'takeover_pending' ? 'Kryptic requests control' : 'Kryptic is working');
    button.textContent = mode === 'takeover' ? 'Hand back' : 'Take over';
  }

  function requestTakeover() {
    setState('takeover_pending', 'Kryptic requests control');
    window.postMessage({ source: 'kryptic-extension', type: 'takeover_requested' }, '*');
    chrome.runtime.sendMessage({ type: 'takeover_requested' });
  }

  function takeOver() {
    setState('takeover', 'You have control');
    window.postMessage({ source: 'kryptic-extension', type: 'takeover_started' }, '*');
    chrome.runtime.sendMessage({ type: 'takeover_started' });
  }

  function handBack() {
    setState('working', 'Kryptic resumed');
    window.postMessage({ source: 'kryptic-extension', type: 'takeover_ended' }, '*');
    chrome.runtime.sendMessage({ type: 'takeover_ended' });
  }

  function inspectPage() {
    const selection = window.getSelection()?.toString() || '';
    const article = document.querySelector('article, main, [role="main"]');
    const target = article || document.body;
    return {
      url: location.href,
      title: document.title,
      selection: selection.slice(0, 4000),
      text: (target.innerText || '').replace(/\s+/g, ' ').slice(0, 30000),
      viewport: { width: window.innerWidth, height: window.innerHeight, scrollY: window.scrollY, scrollHeight: document.documentElement.scrollHeight }
    };
  }

  function scrollPage(direction = 'down', amount = 0.8) {
    if (state.mode === 'takeover') return { ok: false, reason: 'user_has_control' };
    const pixels = Math.max(100, Math.min(window.innerHeight * 2, window.innerHeight * amount));
    window.scrollBy({ top: direction === 'up' ? -pixels : pixels, behavior: 'smooth' });
    return { ok: true, direction, pixels, scrollY: window.scrollY };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'inspect_page') {
      sendResponse({ ok: true, page: inspectPage() });
      return true;
    }
    if (message.type === 'set_working') {
      setState('working', message.text || 'Kryptic is working');
      sendResponse({ ok: true });
      return true;
    }
    if (message.type === 'takeover_request') {
      requestTakeover();
      sendResponse({ ok: true, mode: state.mode });
      return true;
    }
    if (message.type === 'handback') {
      handBack();
      sendResponse({ ok: true, mode: state.mode });
      return true;
    }
    if (message.type === 'scroll_page') {
      sendResponse(scrollPage(message.direction, message.amount));
      return true;
    }
    return false;
  });

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.source !== 'kryptic-page') return;
    if (event.data.type === 'takeover') takeOver();
  });

  chrome.runtime.sendMessage({ type: 'content_ready', url: location.href });
})();
