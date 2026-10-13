---
name: run-recovery
description: "Apply on every Mission Control agent run. Keeps runs from failing at the steps that usually break (running out of turns, blocked shell commands, half-finished ports, missing summaries) and makes any failure easy for the hub to diagnose and retry."
---

# Run recovery

The hub retries failed runs on its own and explains failures to Bretton in plain words. Help it by working in a way that either finishes or fails cleanly.

## Budget your turns
- Your turn limit is in the run settings. Plan the work in phases sized to fit, and spend at most about 15% of turns exploring.
- Read `.claude/HANDOFF.md` and the files it points to before anything else. Don't read whole directories.
- At about 80% of your turns, stop starting new work. Finish the current change, write `.hub/summary.md`, and list what's left under `## Next run`.

## When a command is blocked
- If a shell command is denied, don't retry it in a different form. Use the file tools instead: `Write`/`Edit` to change files, `Glob`/`Grep` to find things.
- To remove a file you can't `rm`, note it under `## Next run` with the exact path.
- List every denied command under `## Blocked commands` in `.hub/summary.md` so the hub can widen permissions.

## Finish what the task promises
- A Cloudflare port isn't done without `wrangler.jsonc`, `worker/index.js` (if there's an API) and `.hub/launch.json`. The hub closes and re-runs a port PR that's missing its wrangler config.
- Never end a run with only cosmetic changes when the task asked for more. If you can't finish, say exactly what's missing and why.

## Always leave a summary
`.hub/summary.md` must exist when you stop, even on a partial run:
```
## What changed
## Checks
- ✓ / ✗ each check you ran
## Blocked commands
## Needs approval
## Next run
```
`## Needs approval` lists gated actions you prepared but didn't do (merge, prod deploy, DNS, secrets, billing, publishing), each with the exact command or click. Never pause a run to ask; no one is watching live.

## When you were resumed
If the prompt has a `# Resume` section, the previous attempt's branch is already merged into yours. Read HANDOFF, run `git log --oneline -5`, verify the steps marked ALREADY DONE, then do only what's left.
Keep `.claude/HANDOFF.md` current so the next run (or a retry) starts where you left off.
