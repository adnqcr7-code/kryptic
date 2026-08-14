import { executeAction } from './action-executor.js';
import { updateRunStatus, appendRunEvent } from './run-log.js';
import { rollbackRun } from './transaction.js';

export async function executePlan(workspace, runId, actions, { approve = async () => false, allowMedium = false, maxActions = 12, verify = async () => ({ passed: true, output: '' }), rollbackOnFailure = true, actionIndexMap = null } = {}) {
  if (!Array.isArray(actions) || actions.length > maxActions) throw new Error(`Plan exceeds the action limit of ${maxActions}.`);
  await updateRunStatus(workspace, runId, 'executing', { actionCount: actions.length });
  const results = [];
  for (let localIndex = 0; localIndex < actions.length; localIndex += 1) {
    const index = Array.isArray(actionIndexMap) ? actionIndexMap[localIndex] : localIndex;
    const action = actions[localIndex];
    try {
      const result = await executeAction(workspace, runId, action, { approve, allowMedium });
      const ok = result.status ? result.status === 'verified' : result.exitCode === undefined || result.exitCode === 0;
      results.push({ index, action: action.type, ok, result });
      await appendRunEvent(workspace, runId, { kind: 'step_completed', index, action: action.type });
      if (result.exitCode !== undefined && result.exitCode !== 0) {
        const failure = { index, action, result, repairContext: buildRepairContext(action, result) };
        const rollback = rollbackOnFailure ? await rollbackRun(workspace, runId) : null;
        failure.rollback = rollback;
        await updateRunStatus(workspace, runId, 'failed', { ...failure.repairContext, rollback });
        return { status: 'failed', results, failure, rollback };
      }
    } catch (error) {
      const failure = { index, action, error: error.message, repairContext: buildRepairContext(action, { stderr: error.message }) };
      const blocked = error.message.includes('Approval required');
      const rollback = !blocked && rollbackOnFailure ? await rollbackRun(workspace, runId) : null;
      failure.rollback = rollback;
      await updateRunStatus(workspace, runId, blocked ? 'blocked' : 'failed', { ...failure.repairContext, rollback });
      return { status: blocked ? 'blocked' : 'failed', results, failure, rollback };
    }
  }
  const verification = await verify(results);
  await appendRunEvent(workspace, runId, { kind: 'verification', verification });
  const status = verification.passed ? 'completed' : 'failed';
  await updateRunStatus(workspace, runId, status, { verification });
  return { status, results, verification, ...(verification.passed ? {} : { repairContext: buildRepairContext({ type: 'verification' }, verification) }) };
}

export function buildRepairContext(action, result) {
  return {
    failedAction: action?.type || 'unknown',
    command: action?.command || null,
    path: action?.path || null,
    exitCode: result?.exitCode ?? null,
    stderr: String(result?.stderr || result?.error || '').slice(0, 10000),
    stdout: String(result?.stdout || '').slice(0, 10000),
    instruction: 'Use this evidence to propose the smallest repair. Do not claim success until verification runs again.'
  };
}
