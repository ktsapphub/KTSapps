---
name: second-brain
description: "Apply on every run. Use the graphify code knowledge graph as the project's second brain: read graphify-out/GRAPH_REPORT.md first, query the graph instead of reading files, and record what you learn so the next run starts smarter."
---

# Second brain (graphify)

Every agent run builds a fresh knowledge graph of the repo before you start (tree-sitter, local, no API cost). It lives in `graphify-out/`, and the hub keeps a copy of the report in project memory as the code map.

## Start here, every time
1. Read `.claude/HANDOFF.md` (what happened last run).
2. Read `graphify-out/GRAPH_REPORT.md`: the main areas (communities), the most connected files (god nodes) and suggested questions.
3. Find code through the graph, not by opening folders:
   - `graphify query "where is auth handled" --budget 1500`
   - `graphify explain "createRun"` for a symbol and its neighbors
   - `graphify path "worker.js" "github.js"` to see how two parts connect
   - `graphify affected "saveRun"` before changing something widely used
   - `graphify god-nodes --top 10` to see the architectural hubs
4. Open only the files the graph points to.

## While you work
- After big structural changes, run `graphify update .` so later steps see the new shape.
- If `graphify-out/` is missing (graphify failed to install), fall back to HANDOFF and targeted `Grep`. Don't read the whole repo.

## Leave it better
- Record what you learned that the graph can't show (why a module exists, gotchas, decisions) in `.claude/HANDOFF.md` under `## Key file map` and `## Gotchas`.
- Don't commit `graphify-out/`. It's cached by the workflow and rebuilt each run.
