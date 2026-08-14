# Kairos reuse notes for Kryptic

## Reusable patterns

Kairos uses a provider-definition registry with a provider ID, label, protocol, required environment variables, defaults, secret keys, model variable, and status reporting. Kryptic should keep this pattern but start with only Google Gemini, OpenAI, and Anthropic Claude.

Kairos validates action plans before execution. It checks required parameters, rejects unknown action types, limits plan size, detects repeated writes, reviews commands for risk, and requires coding goals to include both a write action and a run or test action. Kryptic should reuse the contract and strengthen it with explicit workspace-root validation and approval states.

Kairos separates planning, parsing, validation, execution, prompts, safety, workspace tools, test running, and logging. Kryptic should preserve this separation in a smaller CLI-oriented module layout.

Kairos keeps the provider-specific protocol inside the brain/provider layer. Kryptic should use the same boundary so the orchestrator never needs to know whether a model uses OpenAI-compatible, Gemini, or Anthropic request formats.

Kairos treats Docker, WSL, and host execution as distinct environments and communicates the execution boundary to the agent. Kryptic should start with local host execution inside a workspace boundary, then add Docker isolation as an optional hardening mode rather than making Docker a day-one dependency.

Kairos includes circuit-breaker and fallback concepts. Kryptic should not silently switch providers because that can change behavior and cost; any fallback must be opt-in and recorded in the run log.

## Do not copy yet

Kryptic should not copy Kairos’s broad browser control plane, dozens of provider integrations, full MCP management, crawler/data subsystems, or large skill library into the first milestone. These features increase failure surface before the core coding loop is validated.
