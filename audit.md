# Kryptic implementation audit

## Working pieces

Kryptic has a Node.js CLI, provider status and request adapters, workspace containment, secret-file blocking, command-risk review, exact-match patches, bounded action validation, run records, approval callbacks, README documentation, and eight passing tests.

## Priority gaps

The current `ask` command is still planning-only. It does not yet parse a model response into validated actions or execute a complete coding task. The next priority is a structured response contract that separates plan, actions, verification, and final summary.

The provider adapters currently support basic text requests but do not normalize provider tool-call formats, streaming, retries, rate limits, or usage metadata. Those should be added behind the adapter interface without leaking vendor-specific details into the orchestrator.

The action executor has approval callbacks, but there is no interactive CLI approval prompt, no transaction-level rollback, no patch preview, and no resumable interrupted run. These are needed before allowing autonomous edits.

The workspace scanner currently lists only one directory level and does not yet implement focused text search, line ranges, binary-file detection, or repository instruction discovery beyond a small candidate list.

The run record is JSON-based and local, which is appropriate for the MVP, but it needs explicit statuses, timestamps for every state transition, error classification, provider/model metadata, and a final verification summary.

The test suite is good for primitive safety behavior but does not yet exercise a realistic coding benchmark. It needs fixture repositories, end-to-end action sequences, interruption recovery, malformed model output, provider failures, and adversarial content in files.

## Design rule

Do not add feature breadth until the plan-to-action-to-verify loop is correct, observable, bounded, and recoverable.
