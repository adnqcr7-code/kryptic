# Security policy

Kryptic is a local-first prototype and should not be treated as a complete sandbox. The command policy is a conservative guardrail, not a replacement for OS isolation, containers, or least-privilege execution.

## Reporting a vulnerability

Please do not publish credentials, exploit details, or sensitive workspace contents in a public issue. Open a private GitHub security advisory if enabled on the repository, or contact the maintainer through the GitHub account before disclosing details publicly. Include the affected version or commit, reproduction steps using synthetic data, expected behavior, observed behavior, and any suggested mitigation.

## Current boundaries

Kryptic rejects workspace traversal, secret-looking files, symlink escapes, null-byte paths, unsafe commands, untrusted browser origins, and unauthenticated browser-bridge requests when a bridge token is configured. It uses direct process execution with `shell: false`, but users should still run it in a disposable workspace or container when handling untrusted repositories. Provider API keys are stored outside the workspace by first-run onboarding and are never intended to appear in logs or prompts.
