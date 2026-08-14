import { runDeterministicBenchmark } from './benchmark-runner.js';

export async function runOfflineDemo({ output = console.log } = {}) {
  output('Kryptic offline demo');
  output('No provider key, Docker daemon, browser, or network access is required.');
  output('');
  output('1. Inspecting workspace boundary and command policy...');
  output('2. Applying an approved edit inside a transaction...');
  output('3. Running verification and forcing a controlled failure...');
  output('4. Rolling back the failed edit...');
  output('5. Resuming an interrupted run without losing action indexes...');
  output('6. Repairing a small failing Node.js fixture and verifying it...');
  output('');
  const result = await runDeterministicBenchmark();
  for (const item of result.cases) {
    output(`${item.passed ? 'PASS' : 'FAIL'}  ${item.name}`);
  }
  output('');
  output(`${result.passed}/${result.total} offline checks passed.`);
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runOfflineDemo().catch((error) => {
    console.error(`Offline demo failed: ${error.message}`);
    process.exitCode = 1;
  });
}
