# Contributing to Kryptic

Kryptic is a local-first engineering agent. Contributions should improve measurable reliability, safety, usability, or evidence quality rather than add broad claims without tests.

## Before opening a change

Run `npm run v1:test`, which performs the deterministic release check without model API calls. For focused work, also run `npm test`, `npm run benchmark`, and the relevant syntax checks. Changes that affect command execution, filesystem boundaries, browser control, provider handling, or repair behavior must include a regression test and must document the safety boundary.

## Design expectations

Keep execution bounded and auditable. Do not treat model output, repository instruction files, browser pages, or command output as trusted authority. Never add a path or command bypass merely to make a fixture pass. Prefer direct process execution, exact-match edits, fresh verification evidence, transactional rollback, and fail-closed behavior.

## Pull requests

Explain the problem, the smallest safe change, the tests run, and any known limitations. Include benchmark output when changing a benchmarked capability. Do not include API keys, personal secrets, `.kryptic` run state, generated archives, or copied private repositories.

## Local workflow

```bash
git clone https://github.com/adnqcr7-code/kryptic.git
cd kryptic
npm run v1:test
node src/cli.js setup
node src/cli.js chat
```
