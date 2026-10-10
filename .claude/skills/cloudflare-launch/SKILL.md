---
name: cloudflare-launch
description: "Use when taking any of Bretton's repos live (or to staging) on a ktsapps.com subdomain. The proven path: one Cloudflare Worker serves the built frontend as static assets plus the API under /api, deployed by the repo's Mission Control Deploy workflow, with a staging environment, secrets as Worker secrets, and a .hub/launch.json manifest the hub uses to finish setup. Covers porting vibe-coded apps (Emergent, Lovable, Bolt, Replit) off their origin platform."
---

# Cloudflare launch (ktsapps.com)

Default hosting for Bretton's web apps. It's the path Scene Sifter took to go live (scenesifter.ktsapps.com): one Worker, one domain, no separate backend host. Only pick something else when the app needs something Workers can't run, such as long-running processes or a native binary. If so, say why in the PR.

## Target shape
```
wrangler.jsonc            one Worker: static assets + /api
worker/index.js           API routes (fetch handler), no framework needed
frontend/…                existing app; its build output is the assets dir
.hub/launch.json          what the hub needs to finish (secrets, checks)
```

`wrangler.jsonc` template (fill `<slug>`, `<build>`, `<out>`):
```jsonc
{
  "name": "<slug>",
  "main": "worker/index.js",
  "compatibility_date": "2025-09-01",
  "build": { "command": "<build>" },            // e.g. cd frontend && npx --yes yarn@1.22.22 install --non-interactive && CI=false npx --yes yarn@1.22.22 build
  "assets": { "directory": "<out>", "binding": "ASSETS", "not_found_handling": "single-page-application", "run_worker_first": ["/api/*"] },
  "routes": [{ "pattern": "<slug>.ktsapps.com", "custom_domain": true }],
  "observability": { "enabled": true },
  "env": { "staging": { "name": "<slug>-staging", "routes": [{ "pattern": "<slug>-staging.ktsapps.com", "custom_domain": true }] } }
}
```
- Slug: lowercase repo name with hyphens removed, matching existing apps (bigvalid, scenesifter).
- Static-only apps can drop `main` and `run_worker_first`.
- ktsapps.com is in the same Cloudflare account, so `custom_domain: true` creates DNS and TLS on deploy. Never hand-edit DNS.

## Steps
1. **Audit vendor ties first** (see `deployasst`). Grep for the origin platform's name. Remove editor/debug scripts, the platform's analytics keys (PostHog and similar keys from the generator send the user's traffic to the vendor), cron/webhook files that phone the vendor, private packages (e.g. `emergentintegrations`), and `.gitconfig` vendor identity.
2. **Backend**: if it's Python or Node and serverless-friendly, port it to `worker/index.js`. Keep the same routes, request and response shapes, and status codes. Unused DB connections go. A DB the app really uses → D1 (SQL) or KV, or keep Atlas/Supabase via HTTPS. One isolated database per app and per environment, never shared.
3. **Parity tests**: run the old and new code on the same fixtures and diff the outputs (fields, CSV bytes). Put the fixtures under `tests/fixtures/`. Report the result in Checks.
4. **Frontend**: call the API on the same origin (`process.env.X || ""`), so there's no CORS or backend URL.
5. **Workers limits**: free plan allows 50 subrequests and 10 ms CPU per request. Cap fan-out (e.g. link checks to 40) and make it configurable via `vars`. Big parsing is fine. Note it if a feature needs the paid plan.
6. **Secrets**: never in code. List each one in `.hub/launch.json`; the hub collects the value and sets it on the Worker.
7. **Local check**: `npx wrangler dev`. Hit `/`, a deep link, every `/api` route, and one error path. Build the frontend.
8. Write `README.md` (what it is, how it runs, config table) and `.claude/HANDOFF.md`.

## `.hub/launch.json`
```json
{
  "slug": "scenesifter",
  "production": "https://scenesifter.ktsapps.com",
  "staging": "https://scenesifter-staging.ktsapps.com",
  "secrets": [
    { "name": "TICKETMASTER_API_KEY", "purpose": "Event search", "where": "developer.ticketmaster.com → My Apps → Consumer Key", "required": true }
  ],
  "checks": [
    { "path": "/", "expect": 200 },
    { "path": "/api/", "expect": 200, "contains": "\"ticketmaster\":true" }
  ]
}
```
The hub reads this after merge. It asks Bretton for each missing secret in the Launch tab, sets it on the Worker, then runs `checks` against production. When every check passes, the project shows as Live.

## Deploy
The repo's `Mission Control Deploy` workflow (installed by the hub) runs `wrangler deploy` on push to `main` (production) and `wrangler deploy --env staging` on push to `staging`. Cloudflare credentials are repo secrets set by the hub. Don't add another deploy workflow.

## Done means
- PR with the port, `wrangler.jsonc`, `.hub/launch.json`, README, HANDOFF.
- Checks list: parity ✓, local wrangler dev ✓, frontend build ✓, vendor ties removed ✓, secrets listed ✓.
- Nothing deployed to production from the agent run. Merge (Bretton's click in the hub) triggers the deploy.
