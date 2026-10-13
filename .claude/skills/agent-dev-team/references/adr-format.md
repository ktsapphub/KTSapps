# Architecture Decision Record (ADR) Format

Use for decisions that are genuinely expensive to reverse later -- database choice, hosting platform, auth approach, major third-party service dependency. Skip this ceremony for small, easily-reversible choices; it's not worth an ADR for every function signature.

```markdown
# ADR-00X: [Decision title]

## Context
[What problem is being solved, what constraints exist]

## Decision
[What was chosen]

## Alternatives considered
- **Option A**: [what it is] -- rejected because [reason]
- **Option B**: [what it is] -- rejected because [reason]

## Consequences
### Positive
- [benefit]

### Negative / tradeoffs accepted
- [cost, limitation, or risk being knowingly accepted]

## Status
Proposed / Accepted / Superseded by ADR-00Y

## Date
YYYY-MM-DD
```

## When to actually write one

Worth it: choosing a database, choosing a hosting platform, choosing between build-your-own-auth vs. a managed auth provider, any decision that would require real migration effort to reverse.

Not worth it: naming conventions, which specific UI library component to use, most refactoring choices that are easy to undo.
