# Kryptic

[![CI](https://github.com/adnqcr7-code/kryptic/actions/workflows/ci.yml/badge.svg)](https://github.com/adnqcr7-code/kryptic/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-42%2F42%20passing-0b84f3)](https://github.com/adnqcr7-code/kryptic/actions)
[![Benchmark](https://img.shields.io/badge/benchmark-11%2F11%20passing-00a6a6)](benchmark.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933)](https://nodejs.org/)

Kryptic v1 is a local-first AI engineering agent CLI. It prioritizes a reliable workspace boundary, focused repository inspection, provider separation, direct command execution, bounded repair, verified skills, and evidence-based tests before any hosted interface is added. It runs on your own computer, uses your own provider keys, and does not require a hosted Kryptic account.

## Quick start

The fastest path for a fresh checkout is:

```bash
git clone https://github.com/adnqcr7-code/kryptic.git
cd kryptic
npm run v1:test
node src/cli.js start
```

The first interactive start asks for a provider, stores the key outside the workspace, checks local prerequisites, and opens chat. Run the complete local v1 release check with one command:

```bash
npm run v1:test
```

For everyday use, the concise commands are:

```bash
node src/cli.js chat
node src/cli.js setup
node src/cli.js "inspect the repository and improve the tests"
node src/cli.js fix "repair the failing test and verify it"
node src/cli.js test
node src/cli.js doctor
node src/cli.js history
npm run demo
```

See [`DEMO.md`](DEMO.md) for the five-minute walkthrough and offline demo. See [`ROADMAP.md`](ROADMAP.md) for measurable next milestones. See [`V1-AGENT-TEST.md`](V1-AGENT-TEST.md) for the agent-test contract and acceptance criteria. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for safe contribution expectations and [`SECURITY.md`](SECURITY.md) for the prototype’s threat-model boundaries.

## Current status

The project is an early local prototype. It currently provides:

| Capability | Status |
| --- | --- |
| Local CLI help | Available |
| Provider status for Google, OpenAI, and Claude | Available |
| Workspace inspection | Available |
| Focused repository search | Available |
| Recursive repository context inspection | Available |
| Path traversal protection | Available |
| Secret-looking file protection | Available |
| Guarded command policy | Available |
| Provider-backed planning | Available when a provider key is configured |
| Bounded structured `run` command | Available when a provider key is configured |
| Exact-match patching and approval-gated edits | Available |
| Run-history audit records | Available |
| Provenance-aware local memory | Available |
| Offline demo without an API key | Available |
| Deterministic safety benchmark | Available |
| Interactive approvals | Available in TTY mode |
| Resumable run statuses and audit events | Available |
| Bounded plan–act–verify–repair loop | Available foundation |
| Transactional rollback and diff previews | Available |
| Interrupted-run resume | Available via `resume` |
| Strict response-size and criteria limits | Available |
| Linked `verify_workspace` agent tool | Available |
| Structured verification evidence and failure classification | Available |
| Autonomous long-horizon coding loop | In progress |

## Requirements

Node.js 20 or newer is required. No npm dependencies are currently needed.

## Usage

```bash
node src/cli.js --help
node src/cli.js providers
node src/cli.js inspect .
node src/cli.js search "TODO" --workspace .
node src/cli.js skills --workspace .
node src/cli.js skills "test repair" --workspace .
node src/cli.js ask "Explain this repository and plan a small test improvement" --provider openai --workspace .
node src/cli.js run "Inspect the repository and propose a safe test improvement" --provider openai --workspace .
node src/cli.js run "Fix the failing test and verify the repair" --provider openai --workspace . --approve --repair
node src/cli.js benchmark
node src/cli.js resume <run-id> plan.json --interactive --workspace .
npm test
```

Provider credentials are read from environment variables and are never written by Kryptic into the repository. The supported variables are `GEMINI_API_KEY`, `OPENAI_API_KEY`, and `ANTHROPIC_API_KEY`. Model overrides are `KRYPTIC_GOOGLE_MODEL`, `KRYPTIC_OPENAI_MODEL`, and `KRYPTIC_CLAUDE_MODEL`.

## Safety defaults

Kryptic resolves paths against the selected workspace and rejects traversal outside it. It refuses secret-looking files such as `.env`, private-key files, and package-manager credential files. The command policy blocks destructive file operations, network-download commands, shell escapes, risky git operations, and unapproved commands. The policy is intentionally conservative and will expand only when tests justify the change.

## Planned next milestone

The `--repair` run mode now connects provider-generated replacement plans to the bounded repair loop while preserving schema validation, approvals, rollback, and evidence-based success criteria. Verified procedural skills can be promoted only from `status: verified` evidence and discovered with `skills`. The model must never be allowed to invent a successful test result; verification comes from the local executor.

## Get involved

The most useful early contribution is a reproducible issue or a small fixture that reveals a safety, repair, provider, browser, or cross-platform failure. Please use the [bug template](.github/ISSUE_TEMPLATE/bug_report.md) or [feature template](.github/ISSUE_TEMPLATE/feature_request.md). Testers can use the [feedback form](FEEDBACK.md) to report onboarding friction and structured evidence. Do not coordinate votes or post API keys. The [Show HN draft](SHOW-HN-DRAFT.md) explains the current scope and open benchmark questions.

## Source material

The older [Kairos repository](https://github.com/adnqcr7-code/kairos) is kept in a separate reference directory during development. Kryptic will reuse sound local-first and safety patterns without copying the entire Kairos control plane.

