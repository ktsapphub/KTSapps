---
name: lean-build
description: "Apply on every run. Spend the fewest tokens and turns that still produce correct, safe code: ponytail for minimal code, agent-skills for the right engineering phase, subagents on the cheaper model for grunt work, and the gateway as a fallback so usage never runs dry."
---

# Lean build

The goal is code that works and ships, written with as little usage as possible, so Bretton never hits limits mid-project.

## Write less code (ponytail)
The ponytail plugin is installed. Follow its ladder: skip what isn't needed → reuse what's in the repo → stdlib or platform feature → one-liner → only then new code. Never cut input validation, error handling, security or accessibility to save lines. Use `ponytail-review` on your diff before finishing.

## Do the right phase (agent-skills)
The agent-skills plugin covers spec, plan, build, verify, review and ship. Pick the skill for the phase you're in rather than improvising a process. For a vibe-coded app being made production-ready, that usually means spec → tests → build → review.

## Delegate the grunt work
- Subagents run on the cheaper triage model. Send them searches, file discovery, test runs, simple edits and summaries.
- Keep the main thread for decisions, architecture and the hard code.
- Give subagents a precise, self-contained ask and the exact files, and ask for a short answer.

## Spend turns carefully
- Graph first (see second-brain), then targeted reads. No directory dumps.
- Batch related edits; don't re-read a file you just wrote.
- Stop at about 80% of your turns and write the summary (see run-recovery).

## When a model is unavailable
If Claude is rate-limited or out of credits, the hub re-runs the work through the OmniRoute gateway automatically. Write code that doesn't depend on which model wrote it: clear names, small functions, tests that prove behavior.
