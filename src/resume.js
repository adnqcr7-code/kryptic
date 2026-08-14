import { readRun, updateRunStatus, appendRunEvent } from './run-log.js';
import { executePlan } from './loop.js';

export async function resumePlan(workspace, runId, actions, options = {}) {
  const run = await readRun(workspace, runId);
  const completed = new Set(run.events.filter((event) => event.kind === 'step_completed').map((event) => event.index));
  const remainingEntries = actions.map((action, index) => ({ action, index })).filter(({ index }) => !completed.has(index));
  const remaining = remainingEntries.map(({ action }) => action);
  const actionIndexMap = remainingEntries.map(({ index }) => index);
  await appendRunEvent(workspace, runId, { kind: 'resume_requested', completed: [...completed], remaining: remaining.length, actionIndexMap });
  if (!remaining.length) {
    await updateRunStatus(workspace, runId, 'completed', { resumed: false, reason: 'All steps already completed.' });
    return { status: 'completed', resumed: false, remaining: [] };
  }
  const result = await executePlan(workspace, runId, remaining, { ...options, actionIndexMap });
  return { ...result, resumed: true, remaining: remaining.length };
}
