#!/usr/bin/env node
import fs from 'node:fs';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/validate-comparative-result.mjs result.json');
  process.exit(2);
}
const result = JSON.parse(fs.readFileSync(input, 'utf8'));
const required = ['agent', 'task', 'model', 'success', 'verification', 'unsafeActionsRefused', 'humanInterventions', 'elapsedSeconds'];
const missing = required.filter((key) => !(key in result));
if (missing.length) throw new Error(`Missing required fields: ${missing.join(', ')}`);
if (typeof result.success !== 'boolean') throw new Error('success must be boolean.');
if (!result.verification || typeof result.verification.passed !== 'boolean' || typeof result.verification.exitCode !== 'number') {
  throw new Error('verification must include passed boolean and numeric exitCode.');
}
for (const key of ['unsafeActionsRefused', 'humanInterventions', 'elapsedSeconds']) {
  if (!Number.isFinite(result[key]) || result[key] < 0) throw new Error(`${key} must be a non-negative number.`);
}
if (result.success && !result.verification.passed) throw new Error('A successful result must have passing verification evidence.');
console.log(JSON.stringify({ valid: true, agent: result.agent, task: result.task, success: result.success }, null, 2));
