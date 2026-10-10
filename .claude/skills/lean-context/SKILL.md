---
name: lean-context
description: "Use at the start and end of every agent run in Bretton's repos. Memory and token-efficiency protocol: read the project handoff and knowledge graph first, open only the files they point to, keep diffs small, reuse existing code, and write a compact handoff so the next run starts warm instead of from scratch."
---

# Lean Context (memory + usage)

Goal: best output for the fewest tokens, and no run starts from zero.

## Start of run
1. Read `.claude/HANDOFF.md` and `CLAUDE.md` if present. They are the project memory.
2. If `graphify-out/` (knowledge graph) exists, use it to find the relevant files. Otherwise use `git grep`/Glob on specific names. Never read the whole repo or dump large files.
3. Open only files you will change or must understand. Read large files by range.
4. Skills live in `.claude/skills/`. Their descriptions tell you when to load each one. Load a skill's body only when the task needs it; open its `references/` only for the specific sub-task.

## During the run
- Reuse before building: existing components, utilities, skills, prior decisions in HANDOFF. Do not add a dependency when a few lines will do.
- Smallest diff that meets the acceptance criteria. No drive-by refactors.
- Prefer one targeted test run over full suites when iterating; run the full relevant suite once at the end.
- Use subagents (Task) for independent parallel stages; give each a narrow brief, not the whole context.

## Caveman mode for internal writing
- HANDOFF, summary, subagent briefs, plans and notes: drop articles, filler and pleasantries. Fragments OK. Keep every fact, path, number, command, URL, decision.
- Subagent brief = goal + files + done-check. Never paste the whole context.
- Don't echo file contents or long logs back. Quote the 3 lines that matter.
- Deliverables are the exception: website copy, UI text, docs, decks, dashboards and emails ship complete and polished.

## End of run (required)
1. Rewrite `.claude/HANDOFF.md` (max 150 lines):
   - Current state (what works, what's deployed where)
   - What changed this run (files, why)
   - Open issues / known failures
   - Next steps (ordered)
   - Key file map (path → purpose), only for files that matter
   Remove stale lines; this file must stay short.
2. In `.hub/summary.md`, include `## Skills used` listing the skills you actually loaded (names only), and `## Checks` with each done-check as ✓/✗.
