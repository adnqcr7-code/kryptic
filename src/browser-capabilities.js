export const BROWSER_CAPABILITIES = [
  { name: 'inspect_page', description: 'Read the active page title, URL, selected text, bounded readable text, and viewport metadata.', approval: 'explicit_request', safe: true },
  { name: 'scroll_page', description: 'Scroll the active page up or down by a bounded amount.', approval: 'explicit_request', safe: true },
  { name: 'show_working_overlay', description: 'Show the blue Kryptic working indicator without taking control of the page.', approval: 'implicit_after_browser_task', safe: true },
  { name: 'request_takeover', description: 'Ask the user to take control of the browser; Kryptic pauses browser actions until hand-back.', approval: 'user_click_required', safe: true },
  { name: 'handback', description: 'Return browser control to Kryptic after the user explicitly hands it back.', approval: 'user_click_required', safe: true }
];

export function browserCapabilityContext({ bridgeAvailable = false, userHasControl = false } = {}) {
  return {
    available: bridgeAvailable,
    userHasControl,
    capabilities: BROWSER_CAPABILITIES,
    rules: [
      'Use browser tools only when the task requires information or work on a webpage.',
      'Inspect before acting and keep page reads bounded.',
      'Never silently take control; request_takeover must surface a user-visible handoff.',
      'When userHasControl is true, pause browser actions and wait for handback.',
      'Do not enter credentials, bypass CAPTCHAs, submit forms, or click arbitrary controls without a future explicit approval policy.',
      'If the bridge is unavailable, explain that browser control is unavailable instead of pretending it worked.'
    ]
  };
}
