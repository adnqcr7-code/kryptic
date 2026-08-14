import { appendRunEvent } from './run-log.js';
import { applyExactPatch } from './patch.js';
import { runCommand } from './executor.js';
import { snapshotBeforeEdit } from './transaction.js';
import { createUnifiedDiff } from './diff.js';
import { verifyWorkspace } from './verification-tool.js';
import { createBrowserClient } from './browser-client.js';

export async function executeAction(workspace, runId, action, { approve = async () => false, allowMedium = false, transactional = true, browserClient = null } = {}) {
  await appendRunEvent(workspace, runId, { kind: 'action_proposed', action: { ...action, content: action.content ? '[omitted]' : undefined, oldText: action.oldText ? '[omitted]' : undefined, newText: action.newText ? '[omitted]' : undefined } });
  if (action.type === 'read_file') {
    const content = await workspace.readFile(action.path);
    await appendRunEvent(workspace, runId, { kind: 'action_completed', type: action.type, path: action.path });
    return { type: action.type, path: action.path, content };
  }
  if (action.type.startsWith('browser_')) {
    const browser = browserClient || createBrowserClient({ baseUrl: process.env.KRYPTIC_BROWSER_BRIDGE_URL || 'http://127.0.0.1:8765' });
    const result = action.type === 'browser_inspect_page' ? await browser.inspectPage()
      : action.type === 'browser_scroll_page' ? await browser.scrollPage(action.direction || 'down', action.amount || .8)
        : action.type === 'browser_show_working' ? await browser.showWorkingOverlay(action.text || 'Kryptic is working')
          : action.type === 'browser_request_takeover' ? await browser.requestTakeover()
            : action.type === 'browser_handback' ? await browser.handback()
              : null;
    if (!result) throw new Error(`Unsupported browser action: ${action.type}`);
    await appendRunEvent(workspace, runId, { kind: 'browser_action_completed', type: action.type, result });
    return result;
  }
  if (action.type === 'verify_workspace') {
    const result = await verifyWorkspace(workspace, { command: action.command || null, timeoutMs: action.timeoutMs || 120000 });
    await appendRunEvent(workspace, runId, { kind: 'verification_completed', result });
    return result;
  }
  if (action.type === 'inspect_diff') {
    const result = await runCommand(workspace, 'git diff --', { allowMedium: false });
    await appendRunEvent(workspace, runId, { kind: 'action_completed', type: action.type, result });
    return result;
  }
  if (action.type === 'write_file') {
    let before = '';
    try { before = await workspace.readFile(action.path); } catch {}
    const preview = createUnifiedDiff(action.path, before, action.content);
    if (!(await approve({ type: action.type, path: action.path, preview }))) throw new Error(`Approval required for writing ${action.path}.`);
    if (transactional) await snapshotBeforeEdit(workspace, runId, action.path);
    const result = await workspace.writeFile(action.path, action.content);
    await appendRunEvent(workspace, runId, { kind: 'action_completed', type: action.type, result });
    return result;
  }
  if (action.type === 'apply_patch') {
    const before = await workspace.readFile(action.path);
    const matches = before.split(action.oldText).length - 1;
    const preview = matches === 1 ? createUnifiedDiff(action.path, before, before.replace(action.oldText, () => action.newText)) : `Patch preview unavailable: expected one anchor, found ${matches}.`;
    if (!(await approve({ type: action.type, path: action.path, preview }))) throw new Error(`Approval required for patching ${action.path}.`);
    if (transactional) await snapshotBeforeEdit(workspace, runId, action.path);
    const result = await applyExactPatch(workspace, action);
    await appendRunEvent(workspace, runId, { kind: 'action_completed', type: action.type, result });
    return result;
  }
  if (action.type === 'run_command') {
    const result = await runCommand(workspace, action.command, { allowMedium: allowMedium || Boolean(action.approved) });
    await appendRunEvent(workspace, runId, { kind: 'action_completed', type: action.type, result: { ...result, stdout: result.stdout.slice(0, 10000), stderr: result.stderr.slice(0, 10000) } });
    return result;
  }
  throw new Error(`Unsupported action type: ${action.type}`);
}
