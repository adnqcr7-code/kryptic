const $ = (id) => document.getElementById(id);
const output = $('output');

function show(value) { output.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2); }
function send(message) { return chrome.runtime.sendMessage(message); }

$('inspect').addEventListener('click', async () => {
  show('Inspecting the current page…');
  const response = await send({ type: 'inspect_active_tab' });
  if (!response?.ok) return show(`Inspection failed: ${response?.error || 'unknown error'}`);
  const page = response.page?.page || response.page;
  $('page-title').textContent = page.title || '(untitled)';
  $('page-url').textContent = page.url || '';
  show({ title: page.title, url: page.url, selection: page.selection, textPreview: page.text?.slice(0, 1200), viewport: page.viewport });
});

$('working').addEventListener('click', async () => {
  const response = await send({ type: 'set_working', text: 'Kryptic is reading the page' });
  show(response?.ok ? 'Working overlay enabled. Kryptic may inspect or scroll, but cannot silently take control.' : response?.error || 'Unable to enable overlay.');
});

$('takeover').addEventListener('click', async () => {
  const response = await send({ type: 'request_takeover' });
  if (response?.ok) { $('takeover').disabled = true; $('handback').disabled = false; }
  show(response?.ok ? 'You have control. Kryptic is paused until you hand control back.' : response?.error || 'Take over failed.');
});

$('handback').addEventListener('click', async () => {
  const response = await send({ type: 'handback' });
  if (response?.ok) { $('takeover').disabled = false; $('handback').disabled = true; }
  show(response?.ok ? 'Control handed back. Kryptic may continue.' : response?.error || 'Hand-back failed.');
});

for (const [id, direction] of [['scroll-up', 'up'], ['scroll-down', 'down']]) {
  $(id).addEventListener('click', async () => {
    const response = await send({ type: 'scroll_page', direction, amount: .8 });
    show(response?.ok ? `Scrolled ${direction}.` : response?.reason || response?.error || 'Scroll failed.');
  });
}

fetch('http://127.0.0.1:8765/health').then((response) => {
  $('bridge').textContent = response.ok ? 'Bridge: connected' : 'Bridge: unavailable';
}).catch(() => { $('bridge').textContent = 'Bridge: unavailable'; });
