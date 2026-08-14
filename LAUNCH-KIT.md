# Kryptic launch kit

This kit is designed to increase legitimate discovery without spam, vote coordination, fake engagement, or unsolicited private messages. Kryptic is a technical open-source project, so the best growth loop is a reproducible checkout, clear evidence, useful technical discussion, and personal responses from the maintainer.

## Canonical links

| Asset | Link |
| --- | --- |
| Repository | https://github.com/adnqcr7-code/kryptic |
| Hacker News post | https://news.ycombinator.com/item?id=49298059 |
| CI | https://github.com/adnqcr7-code/kryptic/actions |
| Agent-test guide | https://github.com/adnqcr7-code/kryptic/blob/master/V1-AGENT-TEST.md |
| Security policy | https://github.com/adnqcr7-code/kryptic/blob/master/SECURITY.md |
| Benchmark | https://github.com/adnqcr7-code/kryptic/blob/master/benchmark.md |

## One-minute trial

```bash
git clone https://github.com/adnqcr7-code/kryptic.git
cd kryptic
npm run v1:test
node src/cli.js setup
node src/cli.js chat
```

The first interactive setup asks for a provider and stores the API key outside the workspace. The release check does not require a model API call.

## Reddit draft — use only where the subreddit permits project sharing

**Title:** I built a local-first coding agent that treats verification as evidence, not model prose

**Body:**

I built Kryptic, a Node.js CLI for local coding tasks. I’m sharing it for technical feedback, not asking for votes. It plans bounded actions, requires approval for edits, runs direct development commands without a shell, discovers and runs project tests, records structured evidence, rolls back failed edits, resumes interrupted runs, and can request a bounded repair proposal from Google, OpenAI, or Claude.

The current repository includes 42 regression tests and 11 deterministic benchmark cases. The areas I most want challenged are the browser-bridge threat model, direct-command execution, repair-loop evaluation, and cross-platform behavior.

Repository and one-minute test: https://github.com/adnqcr7-code/kryptic

I’m the author and will answer questions. Please check the rules of the specific subreddit before posting; if project links are not welcome there, I will participate without posting the link.

## Indie Hackers draft

**Title:** Kryptic: a local-first AI engineering agent built around verification and rollback

I’m building Kryptic as a local-first alternative to hosted coding agents. The current v1 is intentionally a CLI: users bring their own Gemini, OpenAI, or Claude key, run it on their own machine, and keep workspace state local.

The differentiator I’m testing is the engineering loop. Kryptic separates plan, act, verify, and repair; requires approval for edits; uses transactional rollback; keeps run evidence; and refuses to claim a test passed without local verification. It also has first-run onboarding, interactive chat, a Chrome extension bridge with explicit takeover, and a deterministic fixture-based benchmark.

Current evidence is 42/42 regression tests and 11/11 benchmark cases. I’m looking for engineers who can try the checkout, break the safety boundaries, and suggest realistic coding fixtures.

Repository: https://github.com/adnqcr7-code/kryptic

## Dev.to article outline

**Title:** What I learned building a local-first coding agent around verification instead of confidence

Start with the problem: coding agents can produce persuasive prose even when their edits or tests are wrong. Explain the decision to keep v1 local and CLI-first. Then show the plan–act–verify–repair loop, exact-match patching, direct argv execution, transactional rollback, first-run secret storage, browser takeover, and benchmark fixtures. Include the actual commands and test evidence. End with limitations: Kryptic is not yet a general replacement for Hermes, OpenClaw, or Manus; long-horizon coding, streaming/tool calls, stronger sandboxing, and broader evaluation remain open work.

Repository: https://github.com/adnqcr7-code/kryptic

## Organic discovery plan

First, keep the GitHub README and CI green, respond to every substantive issue, and turn real failures into small fixtures. Second, publish technical notes only when they contain reproducible evidence, such as a command-policy bypass that was found and fixed. Third, participate in relevant communities before sharing the project, disclose authorship, follow each community’s rules, and do not cross-post the same copy blindly. Fourth, let users and contributors discover and share the project voluntarily rather than asking for votes. Fifth, measure useful signals—clean-checkout success, issue quality, benchmark additions, repeat users, and merged contributions—instead of raw impressions.

## Guardrails

Do not buy votes, coordinate upvotes, use sockpuppets, send unsolicited bulk messages, disguise authorship, or claim superiority that has not been measured. Hacker News requires a real runnable project and prohibits soliciting votes. Reddit’s self-promotion guidance likewise emphasizes community participation, transparency, and no vote manipulation. Platform rules change, so check the current rules immediately before posting.

References:

[1]: https://news.ycombinator.com/showhn.html "Hacker News Show HN Guidelines"
[2]: https://news.ycombinator.com/newsguidelines.html "Hacker News Guidelines"
[3]: https://www.reddit.com/r/reddit.com/wiki/selfpromotion/ "Reddit Self-Promotion Guidance"
