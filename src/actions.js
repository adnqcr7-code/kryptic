import { reviewCommand } from './safety.js';
import path from 'node:path';

const REQUIRED = {
  read_file: ['path'],
  write_file: ['path', 'content'],
  apply_patch: ['path', 'oldText', 'newText'],
  run_command: ['command'],
  inspect_diff: [],
  verify_workspace: [],
  browser_inspect_page: [],
  browser_scroll_page: [],
  browser_show_working: [],
  browser_request_takeover: [],
  browser_handback: []
};

export function validateActions(actions, { maxActions = 12 } = {}) {
  const issues = [];
  if (!Array.isArray(actions) || actions.length === 0) return ['Actions must be a non-empty array.'];
  if (actions.length > maxActions) issues.push(`Too many actions: ${actions.length}; limit is ${maxActions}.`);
  const writes = new Set();
  actions.forEach((action, index) => {
    if (!action || typeof action !== 'object' || typeof action.type !== 'string') {
      issues.push(`Action ${index} must contain a type.`);
      return;
    }
    if (!REQUIRED[action.type]) {
      issues.push(`Action ${index} has unknown type: ${action.type}.`);
      return;
    }
    for (const field of REQUIRED[action.type]) {
      if (typeof action[field] !== 'string' || !action[field].trim()) issues.push(`Action ${index} is missing ${field}.`);
    }
    if (typeof action.path === 'string' && (path.isAbsolute(action.path) || action.path.includes('\u0000'))) issues.push(`Action ${index} has an unsafe path.`);
    if (typeof action.command === 'string' && action.command.length > 2000) issues.push(`Action ${index} command is too long.`);
    for (const field of ['content', 'oldText', 'newText']) if (typeof action[field] === 'string' && Buffer.byteLength(action[field]) > 1024 * 1024) issues.push(`Action ${index} ${field} is too large.`);
    if (action.type === 'run_command') {
      const review = reviewCommand(action.command);
      if (review.level === 'high') issues.push(`Action ${index} contains a blocked command.`);
    }
    if (action.type === 'write_file' || action.type === 'apply_patch') {
      if (writes.has(action.path)) issues.push(`Action ${index} writes the same path more than once: ${action.path}`);
      writes.add(action.path);
    }
    if (action.type === 'apply_patch' && action.oldText === action.newText) issues.push(`Action ${index} does not change its file.`);
  });
  return issues;
}
