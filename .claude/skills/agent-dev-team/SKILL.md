---
name: "agent-dev-team"
description: "Defines a repeatable, autonomous multi-agent development team (Orchestrator, Spec Writer, Architect, Coder, Security, QA, Release, Docs) that runs as an iterative build→review→test→fix loop to take virtually any project from idea to live. Documents each agent's area of responsibility, why/goal/outcome, entry/exit criteria, and model, plus a RACI and escalation policy. Minimizes token cost via per-role model assignments and keeps consequential actions (credentials, merges to main, repo visibility, releases, app store submission) as deliberate human gates. Use when setting up a project's dev workflow in Cowork or Claude Code, delegating to a role, deciding which model to use, running the iterate-until-done loop, or asking \"who should build/review/deploy this.\" Pairs with operating-defaults, app-launch-pipeline, deployasst, ship-mobile-app, and the design skills."
---

# Agent Dev Team

A repeatable, **autonomous-by-default** team that runs as an **iterative loop** — build → review → test → fix → repeat — to take any project from idea to live. An **Orchestrator** runs the loop: it routes work, enforces the iteration cap, and escalates to the human only at genuine decision points. Work flows forward on passing exit criteria and loops back on failure. Roles communicate through **project files** (the shared memory), not conversation history, so any stage or session resumes without re-deriving context.

Always apply `operating-defaults` alongside this: reuse before building, hold a high design bar, and produce a preview (URL for web, install/test-track link for mobile) at every stage. A fuller human-facing SOP/CONOPS can mirror this skill; this skill is the operative source of truth.

## Roles & areas of responsibility

Each role is bounded by what it **owns** and is **not responsible for**, with **entry/exit** criteria and a **model** chosen to minimize token cost. If quality dips, trace it to the role whose exit criteria weren't met.

### Orchestrator / Team Lead — Sonnet
- **Owns:** sequencing stages, routing failures to the right role, enforcing the iteration cap, deciding when to escalate, keeping `PROJECT.md` current, ensuring each role has its inputs.
- **Not responsible for:** doing the specialist work — it delegates.
- **Entry:** new request or a completed stage awaiting routing. **Exit:** shipped, or a clean escalation with a decision needed.

### Product/Spec Writer — Sonnet
- **Why:** ambiguity is the most expensive bug, cheapest to kill before code. **Owns:** problem, users, scope, testable acceptance criteria. **Not:** technical design.
- **Outcome:** `spec.md`. **Entry:** new request. **Exit:** numbered, checkable acceptance criteria + open questions listed.

### Architect — Opus
- **Why:** architecture mistakes propagate and are expensive to reverse. **Owns:** stack, data model, interfaces, build order, ADRs; enforces reuse over new deps. **Not:** production code or small reversible choices.
- **Outcome:** `architecture.md` + ADRs (`references/adr-format.md`). **Entry:** spec passed. **Exit:** plan covers every criterion; hard-to-reverse choices have ADRs. Used sparingly — once per feature.

### Coder — Sonnet
- **Why:** most iteration and token spend is here. **Owns:** implementation on `feature/<name>`, own tests, a working preview, opening the PR. **Not:** merging its own PR, security sign-off, prod deploy. **Never touches `main`.**
- **Outcome:** branch + preview + open PR (`references/commit-and-pr-format.md`). **Entry:** architecture ready, or a Security/QA failure report. **Exit:** PR open, preview live, self-tests pass, PR description complete.

### Security — Sonnet (Haiku for repetitive scans)
- **Why:** regressions are cheap pre-merge, costly after. **Owns:** secret scan (diff + full history on first pass), dependency-vuln scan, OWASP-category review. **Not:** functional correctness or fixing code (routes to Coder).
- **Outcome:** pass/fail report (`references/security-review-checklist.md`). **Entry:** PR opened/updated. **Exit:** report issued — pass → QA, fail → Coder.

### QA — Sonnet
- **Why:** "compiles" isn't "works." **Owns:** testing the preview against **each** acceptance criterion, filing reproducible bugs. **Not:** security review or the ship decision.
- **Outcome:** criterion-by-criterion report. **Entry:** Security passed. **Exit:** all pass → merge gate, any fail → Coder with repro.

### Release / DevOps — Haiku
- **Why:** deploy mechanics are deterministic. **Owns:** preview/staging/prod environments, CI/CD, env/config wiring (values entered by human), version bumps, **staging** the release. **Not:** triggering the release, entering secret values, store submission (human gates).
- **Outcome:** live preview/staging URL or test-track build + staged release. **Entry:** human merged to `main`. **Exit:** environment healthy, preview published, release staged. Mechanics: `app-launch-pipeline`, `deployasst`, `ship-mobile-app`.

### Docs — Haiku
- **Why:** undocumented state is why sessions restart. **Owns:** `CHANGELOG.md`, `README.md`, `PROJECT.md`. **Not:** decisions — it records.
- **Outcome:** docs equal to what shipped. **Entry:** anything shipped/decided. **Exit:** `PROJECT.md` shows current phase, blockers, preview location.

## The loop & escalation

```
        ┌───────────── loop back on failure ─────────────┐
Spec ─▶ Architecture ─▶ Coder (branch+preview+PR) ─▶ Security ─▶ QA ─▶ [HUMAN: merge] ─▶ Release ─▶ Docs ─▶ done
                              ▲          ▲               │        │                                         │
                              └── fail ──┴───────────────┴────────┘                new scope/regressions ──┘ (back to Spec)
```

- **Autonomous inner loop:** Coder ⇄ Security ⇄ QA repeats without a human.
- **Iteration cap:** 3–5 full passes; on cap without green, Orchestrator escalates with what's failing, what was tried, and the decision needed. Never loop forever.
- **Failure routing:** Security/QA failures go to Coder with concrete detail — back to Spec/Architecture only if a spec/design gap is revealed.
- **Ambiguity rule:** outcome-changing ambiguity → ask the human once, record in `PROJECT.md`, proceed.

## RACI (condensed)

Human is **Accountable** at the gates; Orchestrator is Accountable elsewhere. Spec→R:Spec Writer; Architecture→R:Architect; Build→R:Coder; Security→R:Security; QA→R:QA; **Merge to `main`→R/A:Human**; Deploy/stage→R:Release; **Trigger release/store submit→R/A:Human**; Docs→R:Docs.

## Human gates — never automated

Agents may fully prepare each; the final action stays the human's: entering real credentials/keys/passwords; approving/merging to `main`; flipping repo visibility or any one-way security toggle; generating/revoking tokens; App/Play Store submission (account-holder 2FA by design); any purchase or financial transaction.

## Shared memory (artifacts)

`PROJECT.md` (phase/blockers/preview location), `spec.md`, `architecture.md` + ADRs, the PR, Security report, QA report, `CHANGELOG.md`/`README.md`. Every role reads these on entry, updates on exit. Persist standing rules as saved skills; persist project state as files in the connected folder (this environment has no writable auto-memory store).

## Optimization signals

First-pass yield (PRs passing Security+QA without loop-back), loop cycles to green, escaped-defect rate, unnecessary human interrupts, time-to-preview, deploy success rate, doc staleness, token spend per role (rebalance models if mismatched).

## References & paired skills

- `references/commit-and-pr-format.md`, `references/adr-format.md`, `references/security-review-checklist.md`
- Deploy/mobile mechanics: `app-launch-pipeline`, `deployasst`, `ship-mobile-app`
- Design bar: `ui-ux-pro-max`, `theme-factory`, `apple-design`, `emil-design-eng`
- Post-launch prioritization: `post-launch-roadmap`
- Command formatting to the human: `separate-cli-commands`

