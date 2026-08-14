import { validateActions } from './actions.js';

function candidateJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  return first >= 0 && last > first ? text.slice(first, last + 1) : text.trim();
}

export function parseAgentResponse(text) {
  if (typeof text !== 'string' || text.length > 2 * 1024 * 1024) throw new Error('Model response is missing or exceeds the 2 MiB limit. Kryptic will not execute it.');
  let value;
  try {
    value = JSON.parse(candidateJson(text));
  } catch {
    throw new Error('Model response was not valid JSON. Kryptic will not execute it.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Agent response must be a JSON object.');
  if (typeof value.plan !== 'string' || !value.plan.trim() || value.plan.length > 20000) throw new Error('Agent response must include a non-empty plan under 20,000 characters.');
  if (!Array.isArray(value.actions)) throw new Error('Agent response must include an actions array.');
  if (value.acceptanceCriteria !== undefined && (!Array.isArray(value.acceptanceCriteria) || value.acceptanceCriteria.some((item) => typeof item !== 'string' || item.length > 2000))) throw new Error('Acceptance criteria must be short strings.');
  const issues = validateActions(value.actions);
  if (issues.length) throw new Error(`Invalid agent actions: ${issues.join(' ')}`);
  return { plan: value.plan.trim(), actions: value.actions, acceptanceCriteria: Array.isArray(value.acceptanceCriteria) ? value.acceptanceCriteria : [] };
}
