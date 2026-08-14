# Kryptic roadmap

Kryptic is being developed as a local-first engineering agent. The roadmap is ordered by evidence and user value, not by the number of integrations.

| Horizon | Focus | Evidence required |
| --- | --- | --- |
| Current v1.0.1 | Safe CLI, first-run onboarding, chat, offline demo, verification, rollback, repair, browser permission boundary, provider adapters | 42 regression tests and 11 deterministic benchmark cases passing |
| Next | More realistic coding fixtures, comparative harness adapters, streaming/tool-call normalization, and clean-checkout telemetry that stays local by default | Repeated task runs from clean snapshots with raw evidence |
| After next | Stronger OS/container isolation, cross-platform command adapters, and expanded browser capabilities | Adversarial safety suite on Windows, Linux, and macOS or documented platform limits |
| Later | Durable project memory, verified skill packs, subagent delegation, and optional team workflows | Provenance, rollback, bounded budgets, and independent fixture coverage |

## How to influence the roadmap

The highest-value contribution is a reproducible failure: a small repository, task description, expected behavior, observed evidence, and a proposed acceptance test. Use the issue templates, or submit a pull request that adds a fixture and regression test. Feature requests without a measurable acceptance condition may be deferred until their safety and evaluation path is clear.

Kryptic will not claim to be better than another agent from anecdotes. Comparative claims require the same task, repository snapshot, model settings, and verification rules for every agent being compared.
