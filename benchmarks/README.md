# Comparative benchmark foundation

This directory defines the task contracts for fair comparisons among coding agents. It intentionally contains task definitions and scoring rules, not fabricated competitor results.

A comparison is valid only when agents receive the same task text, the same repository snapshot, the same model and settings, and the same network conditions. Every run should preserve the final diff and fresh verification output. Record human interventions, elapsed time, provider failures, unsafe-action refusals, rollback correctness, and whether the agent’s success claim matches the verifier.

The current deterministic Kryptic benchmark remains the local safety gate. The comparative tasks are the next layer: they are designed to be run against multiple agents with an external harness so that adapter differences do not contaminate the result.

## Required result format

```json
{
  "agent": "kryptic",
  "task": "repair-node-arithmetic",
  "model": "provider/model-id",
  "success": true,
  "verification": {"command": "npm test", "passed": true, "exitCode": 0},
  "unsafeActionsRefused": 1,
  "humanInterventions": 0,
  "elapsedSeconds": 0,
  "notes": ""
}
```

Do not publish a leaderboard from a single run. Repeat each task from a clean snapshot, preserve raw evidence, and report failures and limitations alongside successes.
