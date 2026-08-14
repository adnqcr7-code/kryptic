# Show HN draft

## Proposed title

Show HN: Kryptic – a local-first AI engineering agent with verification and rollback

## Proposed URL

https://github.com/adnqcr7-code/kryptic

## Proposed body

I built Kryptic, a local-first AI engineering agent for coding work. The goal is to make the execution loop more inspectable and less willing to claim success than a typical chat wrapper.

The current release is a Node.js CLI that can inspect a workspace, plan bounded actions, require approval for edits, execute guarded development commands, run discovered tests, capture structured evidence, roll back failed edits, resume interrupted runs, and perform bounded provider-driven repair. It supports Google Gemini, OpenAI, and Anthropic Claude adapters, plus an optional Chrome extension and local browser bridge with explicit takeover and hand-back states.

The most important design choice is that verification is an execution result, not model prose. Kryptic currently has 42 isolated regression tests and 11 deterministic benchmark cases covering workspace boundaries, secret-file refusal, symlink escapes, literal patch handling, command-policy bypass attempts, transactional rollback, resume integrity, browser bridge authentication/origin handling, provider timeouts, and a small coding-repair fixture.

Try it locally:

```bash
git clone https://github.com/adnqcr7-code/kryptic.git
cd kryptic
npm run v1:test
node src/cli.js setup
node src/cli.js chat
```

On first interactive setup, Kryptic asks for a provider and accepts the API key without echoing it. The key is stored in a protected user-level secrets file rather than the repository. Docker and the browser bridge are optional for the current CLI workflow.

This is not a claim that Kryptic is already a general replacement for Hermes, OpenClaw, or Manus. Long-horizon coding performance, streaming/tool-call normalization, stronger sandboxing, and broader cross-platform evaluation remain open work. I’m sharing it because the safety-and-verification boundary is the part I want experienced engineers to challenge first.

I’d especially appreciate feedback on the direct-command execution model, browser bridge threat model, repair-loop evaluation design, and what a fair head-to-head benchmark should include.

## Posting notes

Submit only after confirming that the repository is accessible and the commands work from a clean checkout. Do not ask people to upvote or coordinate comments. Respond personally to technical questions and describe limitations plainly.

References:

[1]: https://news.ycombinator.com/showhn.html "Hacker News Show HN Guidelines"
[2]: https://news.ycombinator.com/newsguidelines.html "Hacker News Guidelines"
