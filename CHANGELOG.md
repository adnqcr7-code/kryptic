# Changelog

## Unreleased — adoption and credibility

### Added

Added a no-key offline demo at `npm run demo`, a five-minute walkthrough in `DEMO.md`, a measurable roadmap, a comparative benchmark task specification, and a strict result validator. The CI workflow now runs the regression suite, deterministic benchmark, offline demo, and v1 release gate. The README links the adoption path, roadmap, contribution guidance, and security boundaries.

### Verified

The offline demo exercises the real workspace, command-policy, rollback, resume, and coding-fixture paths and currently reports 11/11 checks passing. Comparative task definitions are published without fabricated competitor results; cross-agent claims remain pending repeated clean-snapshot runs under identical conditions.

## 1.0.1-security-hardening — 2026-08-14

### Fixed

Fixed literal patch replacement corruption in both file application and approval previews by using function-based replacement. Replaced shell-mediated command execution with direct argv execution using `shell: false`, rejected unquoted shell operators, and preserved quoted direct arguments such as `node -e`. Added browser bridge origin validation, non-wildcard CORS, optional timing-safe shared-token authentication, and authenticated browser-client/extension hooks. Added repository prompt-injection warnings and final workspace mutation-path revalidation for rollback deletions.

### Verified

Security validation passes 42/42 isolated tests, 11/11 deterministic benchmark cases, all source/extension/release-script syntax checks, extension manifest validation, and the v1 release gate. Coverage includes dollar-sign patch payloads, shell chaining/substitution/redirection attempts, untrusted browser origins, missing/wrong bridge tokens, direct quoted commands, and rollback behavior.

## 1.0.0 — Kryptic v1 — 2026-08-14

### Added

Kryptic v1 introduces a concise command surface with task shorthand, interactive `chat`, guided `setup`, `fix`, `test`, `doctor`, `history`, `skills`, `version`, and one-command `v1:test` release validation. The package exposes a local `kryptic` executable entry, defaults to the current workspace and configured provider, keeps edits approval-gated, and reports structured verification evidence. Added `V1-AGENT-TEST.md` with the agent-test contract and acceptance criteria. Setup diagnostics check Node, npm, Docker availability, provider configuration without exposing keys, workspace safety, browser bridge configuration, dependency state, test discovery, and verified skills. Interactive chat is TTY-only, bounded to 20 turns, and supports `/help`, `/status`, `/reset`, and `/quit`. First-run onboarding asks for a provider, accepts the API key without echoing it, saves it in a protected user-level secrets file, safely prepares declared npm dependencies with install scripts disabled, and then launches setup/chat.

### Verified

The v1 release check passes the command smoke tests, deterministic safety/coding benchmark, and complete regression suite. Current evidence: 40/40 isolated tests passing, 11/11 benchmark cases passing, all source, extension, and release-script JavaScript syntax checks passing, and the extension manifest validating successfully. The release check requires zero model API calls.


## 0.2.1-reliability-v4 — 2026-08-14

### Added

Repeated interrupted-run resumes now preserve original action indexes, preventing later resumes from replaying or skipping the wrong steps. The browser bridge now cleans stale state before reads, reports queued-command health, records completion timestamps, rejects duplicate command results, and correctly reports ephemeral ports. Provider requests now support abortable timeouts, retry-safe network failure classification, and normalized usage fields across Google Gemini, OpenAI, and Anthropic responses. The deterministic benchmark now includes transactional rollback and resume-index integrity cases.

### Verified

The latest local validation passes 36/36 isolated tests, 8/8 deterministic benchmark cases, all source and extension JavaScript syntax checks, and extension manifest JSON validation. No model API call was required.

## 0.1.0-local-foundation — 2026-08-13

### Added

Kryptic now includes a local Node.js CLI, provider status and request adapters for Google Gemini, OpenAI, and Anthropic Claude, workspace-root containment, secret-looking file protection, symlink escape defense, guarded command execution, exact-match patches, bounded structured action validation, strict JSON response parsing, approval-gated file changes, local JSON run records, provenance-aware episodic memory, a deterministic safety benchmark, and documentation for installation and evaluation.

### Verified

The latest local run passes 11/11 isolated tests, 6/6 deterministic benchmark cases, and source syntax checks. The tests cover traversal, symlinks, secret files, file operations, command policy, action schemas, exact patches, approval and audit records, malformed model output, memory provenance, and provider configuration.

### Deliberate non-goals

This release does not claim long-horizon autonomous coding, SWE-bench performance, hosted deployment, browser control, messaging integrations, subagent swarms, scheduled tasks, or production-grade sandbox isolation. Those capabilities require separate design and evaluation work.

## 0.1.1-local-reliability — 2026-08-14

### Added

Focused recursive repository search, richer repository inspection, literal marker detection, interactive terminal approvals, normalized provider failure classes, bounded retries, resumable run statuses, recent-run listing, a bounded plan–act–verify loop, repair context generation, automatic test-command discovery, and CLI integration of the verification loop.

### Verified

The latest local suite passes 17/17 tests, including adversarial symlink protection, provider error classification, non-interactive approval denial, run-state transitions, failed-command evidence, repository inspection, and automatic verification discovery. The deterministic benchmark remains 6/6.

### Known limitations

Automatic repair-model turns, streaming provider normalization, diff previews, transactional rollback, and realistic fixture-repository coding benchmarks remain future work.

## 0.1.2-repair-foundation — 2026-08-14

### Added

Provider-independent bounded repair orchestration now validates replacement action plans, records repair proposals, restores failed edits through transaction snapshots, and stops after a strict attempt limit. Response parsing, action schemas, diff previews, resumable runs, and provider response normalization were hardened in the same reliability pass.

### Verified

The latest local validation passes 24/24 tests, 6/6 deterministic benchmark cases, and all source syntax checks. No model API call was required.

## 0.2.0-browser-capability — 2026-08-14

### Added

Browser access is now a first-class Kryptic capability. The agent prompt advertises webpage inspection, bounded scrolling, working-overlay display, pending takeover requests, and hand-back. Browser actions route through a local command queue and the Chrome extension returns structured results. Takeover is explicitly pending until the user clicks the visible Take over button.

### Verified

The extension and browser bridge pass syntax and manifest checks. The full Kryptic regression suite passes 30/30 tests, and the deterministic benchmark remains passing. Packaged as `Kryptic-browser-capability-v2.zip`.
