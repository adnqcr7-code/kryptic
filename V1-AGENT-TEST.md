# Kryptic v1 agent-test guide

Kryptic v1 is designed to be tested from the project root with a single release check and a small command surface. It defaults to the current directory as the workspace and uses `KRYPTIC_PROVIDER` when set, otherwise Google Gemini. On a first interactive `setup`, `start`, or `chat`, Kryptic asks the user to choose Google Gemini, OpenAI, or Anthropic Claude, accepts the key without echoing it, stores it in a protected user-level secrets file, verifies or installs declared npm dependencies with install scripts disabled, and then runs setup checks. Provider keys are never written into the project.

## First run

```bash
npm run v1:test
```

This runs the v1 command smoke checks, the deterministic safety and coding benchmark, the complete regression suite, and reports that no model API call was needed for the release check.

## Minimal command surface

| Command | Purpose |
| --- | --- |
| `node src/cli.js chat` | Start an interactive provider-backed conversation. Use `/help`, `/status`, `/reset`, and `/quit`. |
| `node src/cli.js setup` | First-run onboarding when needed, then check Node/npm, Docker, provider keys, workspace safety, browser bridge, dependencies, tests, and skills. |
| `node src/cli.js start` | Run first-run onboarding if needed and launch interactive chat. |
| `node src/cli.js "task"` | Ask Kryptic to plan and execute a bounded task safely. |
| `node src/cli.js fix "task"` | Run the task with bounded provider-driven repair enabled. |
| `node src/cli.js test` | Execute the project’s discovered test contract and return structured evidence. |
| `node src/cli.js doctor` | Report version, provider configuration, test discovery, skills, and fail-closed safety mode. |
| `node src/cli.js history` | Show recent audited runs. |
| `node src/cli.js skills` | List verified procedural skills. |
| `node src/cli.js skills "query"` | Search verified procedural skills. |
| `node src/cli.js inspect` | Inspect the current workspace. |
| `node src/cli.js search "text"` | Search bounded repository text. |
| `node src/cli.js benchmark` | Run the deterministic benchmark. |

The long form remains available as `node src/cli.js run "task"`. Add `--provider openai` or `--provider claude` to choose another configured provider. Add `--approve` only when the test intentionally authorizes file edits. Add `--interactive` to review actions in a terminal.

## Expected safety behavior

Kryptic must reject traversal, absolute paths, symlink escapes, null-byte paths, secret-looking files, destructive commands, and network-download commands. It must not claim a successful test without a fresh local verification result. Failed edits should roll back when the run is transactional, and repeated resume operations must preserve original action identity.

## Agent-test acceptance criteria

Interactive chat requires a TTY and refuses non-interactive input instead of hanging. API keys are stored outside the workspace under the platform user configuration directory (`%APPDATA%\\Kryptic\\secrets.json` on Windows or `$XDG_CONFIG_HOME/kryptic/secrets.json` on Linux/macOS) with restrictive permissions. Setup is idempotent and does not silently replace an existing configured provider. Setup must never print API keys; it reports only provider IDs, models, and boolean configuration status. A v1 test should record the exact command, workspace, provider identifier, run ID, final status, verification command, exit code, rollback evidence when applicable, and the full benchmark result. A successful test is not merely a natural-language response; it requires a passing verification result and an auditable run record.
