# Kryptic engineering status

**Snapshot date:** 2026-08-14, America/Toronto (London, Ontario) — Kryptic v1

## Current result

Kryptic is a local-first Node.js CLI prototype with a tested safety and execution foundation. It is not yet a finished replacement for Hermes, OpenClaw, or Manus, and it should not be described as such. The current milestone establishes the primitives required for that direction.

| Area | Current status | Evidence |
| --- | --- | --- |
| Local CLI | v1 release-ready | Concise task shorthand, interactive chat, setup, fix, test, doctor, history, skills, version, and benchmark commands |
| Provider layer | Basic adapters for Google, OpenAI, and Claude | Normalized provider registry, abortable request timeouts, retry-safe network failures, and fail-closed missing-key behavior |
| Workspace safety | Working for tested cases | Traversal, secret-file, symlink-escape, and rollback revalidation tests |
| Repository search and inspection | Working | Bounded recursive search, language/manifests/instructions/test discovery |
| Structured actions | Working | Schema validation for read, write, patch, command, and diff actions |
| File editing | Conservative primitive | Exact-match patching rejects missing or ambiguous anchors |
| Command execution | Direct and guarded | Risk review, unquoted shell-operator refusal, direct argv execution with `shell: false`, captured output, timeout support |
| Approval policy | Working at executor level | Writes and patches require approval callback; interactive TTY mode and non-interactive denial |
| Run history | Working | Local JSON run records with proposed and completed events |
| Memory | Early working version | Transparent episodic Markdown with provenance and local search |
| Benchmark | Working v1 gate | 11 deterministic safety, rollback, resume, and coding-fixture cases |
| Plan–act–verify loop | Working foundation | Bounded actions, failure evidence, repair context, automatic test discovery |
| Transactional edits and rollback | Working | Per-run snapshots restore failed edits |
| Diff previews | Working | Bounded previews passed to approval callbacks |
| Interrupted-run resume | Working | Repeated resume preserves original action indexes and CLI resume command |
| Bounded repair orchestration | Working foundation | Validated repair proposal callback and strict attempt limit |
| Linked verification tool | Working | Agent action invokes guarded verification and structured evidence |
| Chrome browser extension | Working foundation | Page inspection, scrolling, overlay, Take over/Hand back, isolated bridge state, bounded queues, expiry, completion metadata, and duplicate-result rejection |
| Autonomous long-horizon coding | Not complete | Requires repair loop, interactive approvals, richer search, recovery, and broader fixtures |

## Test evidence

The latest Kryptic v1 security validation passes **42/42 isolated tests**, **11/11 deterministic benchmark cases**, all source, extension, and release-script JavaScript syntax checks, extension manifest validation, and the one-command `npm run v1:test` release check. The release check requires zero model API calls. The tests were run without using a model API call. A negative provider test also confirmed that a missing Google API key fails clearly without modifying files.

## v1 release note

Kryptic v1 is test-ready and intentionally conservative. It now supports a TTY-only interactive `chat` mode and a guided `setup` diagnostic that checks Node, npm, Docker availability, provider configuration without exposing keys, workspace safety, browser bridge configuration, test discovery, and verified skills. Its concise command surface reduces operator friction without weakening approval gates or verification requirements. The exact claim is release readiness within the tested local scope, not overall superiority over Hermes or OpenClaw. Security hardening now covers literal patch replacement, command shell bypasses, browser origin restrictions, optional bridge tokens, repository prompt-injection warnings, and rollback path revalidation.

## Known limitations

The provider adapters are basic text adapters and do not yet normalize streaming or tool-call payloads. The browser bridge is origin-restricted by default; production deployments should set `KRYPTIC_BROWSER_BRIDGE_TOKEN` and configure the extension’s local `BRIDGE_TOKEN` to the same value. They now normalize token usage, abort hung requests, classify network/timeout failures, and support bounded retries. The `run` command executes a bounded plan–act–verify loop and produces repair context, but it does not yet perform automatic repair-model turns. The memory layer is intentionally simple and needs deterministic promotion gates before it can become long-term trusted memory. The benchmark does not claim SWE-bench-level performance; it is a local foundation for building such an evaluation.

## Next engineering priorities

The next priorities are connecting provider-generated repair proposals directly to `verify_workspace`, authenticated local bridge hardening, provider streaming and usage normalization, real browser-action approval schemas, and stronger cross-platform command execution. Only after those pass should Kryptic add subagents, browser automation, messaging gateways, scheduling, hosting, or public launch.
