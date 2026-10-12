---
name: "post-launch-roadmap"
description: "After an item is deployed and live, produce a short prioritized shortlist of the highest-leverage next improvements (UI/UX, performance, security, reliability, etc.), each with impact/effort and any required connection, API, or service called out, to give the next development round clear direction. Use when a project just went live or the user asks \"what's next / roadmap / how do we improve this\"."
---

# Post-Launch Improvement Roadmap

Runs after an item is deployed and live. Produces a **short, prioritized shortlist** of the next improvements worth making — grounded in what was actually built and who it's for — so the next development round starts with clear direction. Any improvement that depends on a new **connection, API, or service** is flagged explicitly.

This is a focused shortlist, not an exhaustive backlog. Aim for the highest-leverage items for *this specific item*, tied to its use case. Default to roughly 5–8 items unless the user asks for more.

## Step 1 — Ground in the actual item (don't skip)

Before proposing anything, establish:
- **What it does** and **who it's for** (the use case). Personal tool vs public product vs client work changes what matters.
- **What was actually built** — the stack, the features shipped, and known shortcuts or TODOs left during the build.
- **How it's deployed** — host, domain, database, current scale/traffic expectations.
- Where possible, look at the real code/deploy (not assumptions) to spot concrete gaps.

If any of this is unknown, ask a couple of quick questions rather than guessing.

## Step 2 — Assess across dimensions

Consider each lens, but only surface what genuinely matters for this item — don't pad:

- **UI/UX** — friction points, empty/loading/error states, mobile/responsive gaps, onboarding, clarity, visual polish, accessibility (a11y).
- **Performance** — load time, bundle size, query/N+1 issues, caching, image optimization, cold starts.
- **Security** — auth hardening, input validation gaps, rate limiting, secrets handling, dependency vulnerabilities, permissions. (Describe the risk and fix; never write exploit instructions.)
- **Reliability & observability** — error monitoring, logging, uptime checks, backups, graceful degradation.
- **Data & analytics** — usage tracking, event instrumentation, dashboards to learn what users do.
- **Scalability & cost** — what breaks under load, and where spend will grow.
- **Growth / monetization** — SEO/discoverability, sharing, email capture, billing, referral loops (where relevant to the use case).

## Step 3 — Prioritize

For each shortlisted item, give:
- **What** — the improvement, in one line.
- **Why it matters** — the user or business impact, tied to the use case.
- **Impact vs effort** — a rough read (e.g. High impact / Low effort), so quick wins are obvious.
- **Priority** — Now / Next / Later.

Lead with quick wins (high impact, low effort) and anything that's a genuine risk (security, data loss). Order the list so the top of it is what to do first.

## Step 4 — Call out dependencies (required)

For every item that needs something external to implement, name it explicitly so prerequisites are clear before work starts. Examples of what to flag:
- **A connection/integration** — e.g. "needs the Supabase connector", "needs Stripe connected for billing".
- **A third-party API/service** — e.g. "error monitoring needs a Sentry account", "transactional email needs a provider like Resend or Postmark", "search needs Algolia or a Postgres full-text setup", "SMS needs Twilio".
- **An infra/config change** — e.g. "needs a Cloudflare caching rule", "needs a DigitalOcean Managed DB", "needs a CDN/object store like R2 or Spaces".
- **An account/credential MDJ must provide** — call out that it's MDJ's to set up, and roughly what it costs if notable.

If an item has no external dependency, say "no new dependencies" so the buildable-now items are obvious.

## Step 5 — Output

Deliver a clean roadmap the next round can act on:
- A short intro line naming the item and its use case.
- The prioritized shortlist (Now / Next / Later), each entry with the fields from Step 3 and any dependency from Step 4.
- A one-line **"start here"** recommendation — the single best next thing to pick up.

Keep it skimmable. Offer to save it as a `ROADMAP.md` in the project and/or hand it to the **architect** to plan the next development round. If the item is being sold, also flag improvements that would justify a price increase or a new paid tier for the **packaging-agent**.

