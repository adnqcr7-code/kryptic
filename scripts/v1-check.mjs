#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const root = process.cwd();
const cli = ['src/cli.js'];
function run(args, options = {}) {
  return execFileSync(process.execPath, [...cli, ...args], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
}
function json(args) { return JSON.parse(run(args)); }

const version = run(['version']).trim();
if (version !== 'Kryptic v1.0.1') throw new Error(`Unexpected version output: ${version}`);
const help = run(['--help']);
for (const required of ['kryptic "task"', 'kryptic chat', 'kryptic setup', 'kryptic fix', 'kryptic test', 'kryptic doctor', 'kryptic history', 'kryptic demo']) {
  if (!help.includes(required)) throw new Error(`Help is missing: ${required}`);
}
const setup = json(['setup', '--workspace', root]);
if (!['ready', 'needs_attention', 'blocked'].includes(setup.status)) throw new Error(`Invalid setup status: ${setup.status}`);
const doctor = json(['doctor', '--workspace', root]);
if (doctor.version !== '1.0.1' || doctor.safety !== 'fail-closed') throw new Error('Doctor did not report v1 safety defaults.');
const demo = run(['demo']);
if (!demo.includes('offline checks passed') || !demo.includes('coding fixture repair')) throw new Error('Offline demo did not complete its verified flow.');
const benchmark = json(['benchmark']);
if (benchmark.passed !== benchmark.total || benchmark.total < 11) throw new Error(`Benchmark failed: ${benchmark.passed}/${benchmark.total}`);
execFileSync('npm', ['test'], { cwd: root, stdio: 'inherit' });
console.log(JSON.stringify({ release: 'Kryptic v1', version, tests: 'passed', benchmark: `${benchmark.passed}/${benchmark.total}`, apiCalls: 0 }, null, 2));
