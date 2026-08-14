import { validateActions } from './actions.js';
import { executePlan } from './loop.js';
import { appendRunEvent, updateRunStatus } from './run-log.js';

export async function repairUntilVerified(workspace, runId, initialActions, { proposeRepair, approve = async () => false, allowMedium = false, verify = async () => ({ passed: true }), maxAttempts = 2 } = {}) {
  let actions = initialActions;
  const attempts = [];
  for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
    const issues = validateActions(actions);
    if (issues.length) {
      const failure = { attempt, issues };
      attempts.push(failure);
      await appendRunEvent(workspace, runId, { kind: 'repair_rejected', failure });
      return { status: 'failed', attempts, failure };
    }
    const result = await executePlan(workspace, runId, actions, { approve, allowMedium, verify, rollbackOnFailure: true });
    attempts.push({ attempt, status: result.status, repairContext: result.repairContext || result.failure?.repairContext || null });
    if (result.status === 'completed') return { status: 'completed', attempts, result };
    if (attempt >= maxAttempts || !proposeRepair) {
      await updateRunStatus(workspace, runId, 'failed', { attempts, reason: 'Repair attempt limit reached.' });
      return { status: 'failed', attempts, result };
    }
    actions = await proposeRepair({ attempt: attempt + 1, failure: result.failure || result, previousActions: actions });
    await appendRunEvent(workspace, runId, { kind: 'repair_proposed', attempt: attempt + 1, actionCount: Array.isArray(actions) ? actions.length : null });
  }
  return { status: 'failed', attempts, reason: 'Unreachable repair state.' };
}
