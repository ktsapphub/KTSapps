# Commit and PR Conventions

## Commit message format

```
<type>: <short description, imperative mood>

<optional body -- explain WHY, not just what, if it's not obvious from the diff>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

Good: `fix: pin backend Python version to 3.11`
Bad: `fix bug`, `updates`, `wip`

## PR description template

```markdown
## What this does
[1-3 sentences]

## Why
[Root cause if this is a fix, motivation if this is a feature]

## What was checked / tested
[What you actually verified, not just "should work"]

## New config/env vars needed (if any)
[List them -- this is what saves the next person from a silent missing-env-var failure]

## Not touched / explicitly out of scope
[Anything adjacent that was deliberately left alone, so a reviewer doesn't wonder why]
```

## The one habit that matters most

The Coder agent's job ends at "open the PR." It never merges its own work, even when branch protection would technically allow it. Merging to `main` is always a deliberate human action -- that's not a workflow inefficiency, it's the actual safety mechanism the whole pipeline is built around.
