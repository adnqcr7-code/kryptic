# Kryptic engineering target

## Positioning

Kryptic should not claim to be “better” through feature count. It should aim to be better for local software engineering through measurable reliability, transparent execution, provider independence, cost awareness, recovery, and safety.

## Capabilities to learn from comparable systems

| System or research | Valuable idea for Kryptic | Kryptic boundary |
| --- | --- | --- |
| Hermes | Persistent learning loop, skills that improve from experience, multiple terminal backends, model/provider switching, parallel subagents, strong CLI workflow, and diagnostics | Start with local CLI, explicit run records, curated skills, and one main agent. Add subagents only after benchmark evidence. |
| OpenClaw | Human-editable memory files, SQLite indexing, tiered memory, provenance, deterministic promotion gates, and failure-isolated background memory work | Begin with plain local Markdown memory and provenance metadata. Do not allow untrusted tool output to become durable trusted memory. |
| Kairos | Provider registry, action validation, command review, secret masking, local-first control, and modular separation | Reuse the smallest coding-focused subset rather than copying its broad web control plane. |
| SWE-agent | Agent-computer interface designed for repository navigation, edits, tests, and environment feedback | Make tools ergonomic and narrow. Measure patch correctness, not just natural-language quality. |
| Claw-SWE-Bench | Harness design materially affects results; accuracy must be reported with cost, latency, cache, model, task set, and budget | Kryptic’s benchmark must disclose harness, provider, model, iteration budget, runtime, cost when known, and final patch/test outcome. |

## Kryptic acceptance criteria

Kryptic is not ready to call engineering-grade until it can complete a local benchmark with a reproducible run record, produce a correct patch, run the relevant tests, explain failures honestly, refuse unsafe requests, and recover from an interrupted or failed step.

The minimum benchmark should include a new-file task, a single-file bug fix, a multi-file feature, a refactor with regression protection, a generated artifact, a failing-test repair, an ambiguous request that should trigger clarification, a path-traversal attempt, a secret-file access attempt, and a blocked destructive command.

Every benchmark result should record completion status, patch validity, test result, tool-call count, repair cycles, wall-clock duration, provider and model, token usage when available, human approvals, and any generated files. The result should be evaluated from the workspace and tests, not from the agent’s final prose.

## Architecture decisions

Kryptic will use one primary orchestrator, a narrow tool registry, a local workspace boundary, structured action validation, exact-match patches, guarded commands, append-only run events, human-readable memory files, and provider adapters. Future subagents, scheduled tasks, messaging gateways, browser tools, and hosted sandboxes are optional extensions, not foundations.

## Sources

[1] Hermes Agent documentation: https://hermes-agent.nousresearch.com/docs/
[2] Hermes Agent repository: https://github.com/NousResearch/hermes-agent
[3] OpenClaw memory architecture: https://docs.openclaw.ai/concepts/memory-architecture
[4] Claw-SWE-Bench: https://arxiv.org/html/2606.12344v1
[5] SWE-agent paper: https://proceedings.neurips.cc/paper_files/paper/2024/hash/5a7c947568c1b1328ccc5230172e1e7c-Abstract-Conference.html
[6] Kairos repository: https://github.com/adnqcr7-code/kairos
