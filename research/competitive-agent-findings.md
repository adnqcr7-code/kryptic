# Competitive agent findings

## Hermes Agent documentation
Source: https://hermes-agent.nousresearch.com/docs/

The documentation describes Hermes as a self-improving agent with agent-curated memory, autonomous skill creation, skill improvement, periodic persistence nudges, and cross-session recall. It supports multiple terminal backends, many messaging platforms, scheduled automations, subagent delegation, MCP integrations, web control, and research-oriented trajectory export. Its documented security concepts include command approval, authorization, and container isolation.

Engineering implication for Kryptic: feature count is not a sufficient comparison. Kryptic should target evidence-backed strengths in workspace containment, explicit approvals, transaction rollback, repair verification, reproducible run artifacts, and adversarial regression coverage. Future competitive areas include durable skills/memory, delegation, scheduling, and cross-platform runtime support, but only after the local safety core remains measurable.

## OpenClaw primary repository
Source: https://github.com/openclaw/openclaw

The repository describes a local Gateway as the control plane for sessions, tools, events, and channel connections. The Control UI, CLI, and TUI connect to the Gateway; channels cover many messaging services; companion apps and nodes can provide voice, canvas, camera, screen, and device-local actions. Its security guidance treats inbound messages as untrusted, pairs unknown DM senders by default, and warns that tools run on the host for the main session unless sandboxing is configured. It directs operators to read the security, exposure, and sandboxing guides before remote exposure.

Engineering implication for Kryptic: a clear safety advantage is possible if local execution defaults to deny-by-boundary, keeps the workspace root authoritative, makes browser takeover explicit, and records machine-checkable evidence for every action. Kryptic should not claim superiority in channels or integrations until those features exist and are evaluated.

## Initial benchmark dimensions

| Dimension | Kryptic target |
| --- | --- |
| Unsafe path handling | Reject traversal, absolute paths, symlink escapes, and secret-looking files |
| Command safety | Deny destructive/network commands by default; classify risk and record review evidence |
| Repair correctness | Roll back failed edits, bound repair attempts, and require fresh verification |
| Resume correctness | Preserve original action identity across repeated interruptions |
| Browser safety | Queue locally, expire stale commands, require visible user takeover, reject duplicate results |
| Provider reliability | Normalize responses/usage, abort hung requests, classify retryability |
| Reproducibility | Persist run records, evidence, diffs, benchmark results, and timestamped logs |
| Capability breadth | Expand only after the above dimensions have regression tests |
