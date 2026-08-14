# Kryptic five-minute walkthrough

This walkthrough is designed for a clean checkout. The offline path does not contact a model provider and does not require an API key.

## 1. Verify the checkout

```bash
git clone https://github.com/adnqcr7-code/kryptic.git
cd kryptic
npm run v1:test
```

The release check validates the CLI surface, setup diagnostics, offline demo, regression suite, and deterministic benchmark. It should finish with all checks passing.

## 2. Run the offline demo

```bash
npm run demo
```

The demo exercises real Kryptic code paths: workspace-boundary rejection, secret-file refusal, command-policy refusal, approval-gated editing, transactional rollback after a controlled failure, interrupted-run resume, and repair of a small failing Node.js fixture. It does not pretend to be a provider conversation; it is a deterministic smoke test of the engineering core.

## 3. Configure a provider

```bash
node src/cli.js setup
```

Choose Google Gemini, OpenAI, or Anthropic Claude when prompted. The API key is entered without terminal echo and stored outside the workspace in the platform’s user-level Kryptic configuration directory. Setup reports missing Docker or browser-bridge capabilities without blocking the basic CLI workflow.

## 4. Start chat

```bash
node src/cli.js chat
```

Use `/help` for chat commands. Start with a read-only request such as “summarize this repository and identify one test improvement.” Before any edit, Kryptic should show an approval prompt unless you explicitly choose an approved mode.

## 5. Try a verified coding task

```bash
node src/cli.js fix "inspect the failing tests, make the smallest safe repair, and verify it"
```

Use a disposable repository for experiments. Kryptic’s command policy and workspace boundary are safety guardrails, not a complete operating-system sandbox.

## What to report

When filing feedback, include the Kryptic version, operating system, Node version, provider mode, exact command, and structured evidence. Do not include API keys, private workspace files, or personal data. A useful report describes what happened, what you expected, and the smallest reproduction.
