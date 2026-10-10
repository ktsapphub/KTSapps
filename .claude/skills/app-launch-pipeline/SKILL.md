---
name: app-launch-pipeline
description: Runbook for taking a vibe-coded app (built with Emergent, Lovable, Bolt, Replit, v0, etc.) from a GitHub repo to a live, secured, custom-domain production deployment on DigitalOcean App Platform with MongoDB Atlas and Cloudflare. Use this skill whenever the user wants to deploy, launch, or go live with an app; set up CI/CD, branch protection, or GitHub Actions for a repo; connect a custom domain through Cloudflare or Namecheap; provision a MongoDB Atlas database; or debug a deployment that's failing, crash-looping, returning 400/404/500/502 errors, or has a database connection failing with a TLS/SSL handshake error. Also trigger this for anything about repo visibility (public vs private), leaked secrets/API keys, GitHub token scoping, or setting up a repeatable pipeline across multiple apps. If the app still has vendor lock-in from its origin platform, use the `deployasst` skill FIRST, then use this skill for everything after the code is clean.
---

# App Launch Pipeline

A proven, step-by-step runbook for taking a vibecoded app from "code exists in a repo" to "live on a real domain, secured, monitored." Built from a real end-to-end launch (Big Valid → bigvalid.ktsapps.com) where every failure mode below was actually hit and fixed, not theorized.

**Core operating principle carried through every step:** verify the actual state in the dashboard/UI directly rather than trusting that a save, a config, or an assumption took effect. More time was lost tonight to unverified assumptions (a domain typo, an empty env var page, a stale build cache) than to genuinely hard problems. When something doesn't work and the cause isn't obvious, the fix is almost always to go *look at the actual current state* of the specific thing in question — not to guess a new theory.

## Credential handling (applies to every step below)

- Never type real secrets, passwords, or API keys into chat. Generate/copy them directly into the target field (GitHub, DigitalOcean, Atlas, etc.).
- GitHub tokens: fine-grained, scoped to **one repo only**, shortest reasonable expiration, minimum permissions for the task (see `references/github-token-scopes.md`). Delete/revoke the moment the task is done.
- If a real secret ever does land in chat (screenshot or text) — even if the repo is private — treat it as burned and rotate it. Don't reuse it.
- Every app/project gets its own isolated database (own Atlas project + cluster), not a shared one. This is a standing infra preference, not a one-off.

## The full pipeline, in order

1. **Vendor lock-in audit** — use the `deployasst` skill. Don't proceed to CI/CD setup on a repo that's still secretly dependent on its origin platform.
2. **GitHub hygiene** — CI pipeline, branch protection, repo visibility. See `references/github-cicd-setup.md`.
3. **Database provisioning** — MongoDB Atlas (or equivalent), isolated per app. See `references/mongodb-atlas-setup.md`.
4. **App hosting** — DigitalOcean App Platform (or equivalent PaaS). See `references/digitalocean-deploy.md`.
5. **Domain + DNS** — Cloudflare in front of the registrar. See `references/cloudflare-domain-setup.md`.
6. **Verify end-to-end** — test the actual login/core-feature flow on the real domain, not just "the build succeeded."

Every stage below has a "known failure patterns" list — read the relevant one *before* debugging from scratch, since most failures are one of these, not something new.

---

## Stage 1: Vendor lock-in audit

Run this before anything else. A clean CI/CD pipeline built on top of a repo that's still phoning home to its origin platform (Emergent, Lovable, etc.) just wastes effort. Use the `deployasst` skill for the full methodology. In short:

- Grep for the origin platform's name/domain across the whole repo (case-insensitive).
- Check for: private packages that only resolve on the platform's own build servers, runtime service proxies (storage/auth/LLM calls silently routed through the platform instead of the user's own APIs), cron jobs or webhooks phoning the platform's API, hardcoded preview-domain values (especially in CORS config), and any committed secrets (run gitleaks or equivalent locally — don't wait for CI to catch it).
- Classify findings as: simple swap (do it), needs user input (ask), or flagged for future dev (don't block launch on it, but say so explicitly).
- **Replace with the best-performing option, not just whatever unblocks the build** — e.g., replacing a vendor's LLM gateway with a direct API call to a fast, cheap model (Haiku-class) for lightweight lookups, not just any working substitute.

---

## Stage 2: GitHub CI/CD + branch protection

See `references/github-cicd-setup.md` for the exact workflow YAML and branch protection settings. Summary of the sequence:

1. Add `.github/workflows/ci.yml` (tests + secret scan) directly to `main` — this is the *one* time a direct push to `main` is correct, since a status check can't be required until it's run once.
2. Create `staging` branch from that same point.
3. Add `.github/workflows/visibility-gate.yml` — a required check that fails any PR into `main` while the repo is still public, with an explicit message telling the user how to fix it. Don't try to auto-flip visibility with an elevated token — GitHub deliberately makes that a manual, confirmed action, and the pipeline should respect that boundary, not route around it.
4. Turn on branch protection: `main` requires PR + 1 approval + status checks; `staging` requires status checks only (no approval, since that's where QA tests things still in progress).
5. From here on, all changes go through PRs, reviewed by the user, merged deliberately.

**Known failure patterns — check `references/known-failures.md#github-cicd` before debugging from scratch:**
- gitleaks failing on *every* PR with a git error, not a real secret found → shallow clone (`fetch-depth: 1` default) can't resolve a commit's parent. Fix: `fetch-depth: 0` on that job's checkout step.
- A previously-working check suddenly failing with `403 Resource not accessible by integration` right after making the repo private → the default `GITHUB_TOKEN` needs explicit `permissions: pull-requests: read` (and `contents: read`) added to the workflow file once the repo is no longer public.
- Pushing to `.github/workflows/*` fails with "refusing to allow a Personal Access Token... without workflow scope" → the token needs the **Workflows** permission specifically, separate from Contents.
- A repo with no committed lockfile (`yarn.lock`/`package-lock.json`) → generate and commit one before wiring up CI; `--frozen-lockfile` will fail otherwise, and builds are non-reproducible without it.

---

## Stage 3: MongoDB Atlas

See `references/mongodb-atlas-setup.md`. Summary:

1. New Atlas **project** per app (not a shared cluster with other apps) — free M0 tier is one-per-project, and isolation is the point anyway.
2. Create the M0 cluster, let Atlas auto-generate the DB user password (never hand-type one — special characters break connection strings), save it immediately (shown once).
3. **Network Access → add `0.0.0.0/0`, NOT the "temporary" toggle.** This is the single most common miss — Atlas's automated setup only allows the browser's current IP by default, which silently blocks every cloud host. Verify this list directly rather than assume a setting saved correctly.
4. Get the connection string; check the app's actual code for whether the database name needs to be embedded in the URL or passed as a separate env var (e.g., `DB_NAME`) — don't assume.

**Known failure patterns:**
- `pymongo.errors.ServerSelectionTimeoutError: SSL handshake failed: TLSV1_ALERT_INTERNAL_ERROR` against Atlas → check TWO separate possible causes before picking one: (a) an old pinned driver version (pymongo/motor) losing TLS compatibility with Atlas's current config — upgrade to current stable; (b) the Network Access list is missing `0.0.0.0/0` entirely — Atlas's shared-tier proxy layer returns this exact TLS alert instead of a plain timeout when the connecting IP isn't allowed. **Verify the Network Access list directly** before assuming it's a driver problem — this was the actual root cause after the driver upgrade alone didn't fix it.

---

## Stage 4: DigitalOcean App Platform (or equivalent PaaS)

See `references/digitalocean-deploy.md`. Summary:

1. Create App → connect the GitHub repo → **"Only select repositories"** scope, never "All repositories."
2. For a monorepo (separate frontend/backend folders), set Source Directories explicitly for each component during setup rather than trusting auto-detection.
3. **Set the Run Command explicitly** for the backend — don't trust the buildpack's guess. `python server.py` (running a file directly) silently exits immediately if the file has no blocking server-start call at the bottom — this produces a "zero exit code" failure that's easy to misread as a health-check timing issue.
4. **Pin the language/runtime version explicitly** (e.g., a `.python-version` file). Buildpacks default to the newest available version if unspecified, which is often untested against the app's actual pinned dependencies (compiled-extension packages especially) and may not match what CI tests against.
5. Frontend built with Create React App / similar: env vars the frontend needs (e.g., `REACT_APP_BACKEND_URL`) must be scoped **Build Time**, not Run Time — a static site has no running process to read a runtime variable from; the value gets permanently baked into the compiled JS during the one build step.
6. A Static Site component needs an explicit **Catchall Document** set to `index.html`, or refreshing on any client-side route (e.g., `/login`) 404s.
7. Component routing rules: verify explicitly which domain routes to which component — don't assume the frontend "just works" at the root domain; the default `/` rule may route to the backend instead.

**Known failure patterns — see `references/known-failures.md#digitalocean` for full detail:**
- Container "exited with a non-zero exit code" but Build Logs show success → the crash is in Deploy/Runtime logs, not Build logs. Always check the right log tab.
- "The job was not acquired by Runner... Internal server error" on a GitHub Actions run → this can be a genuine, transient GitHub infrastructure hiccup, not your config. Check githubstatus.com; if nothing's reported, just re-run.
- A build claims to run but nothing actually changes → check for "Your previous build was reused" in the log; the platform's cache skipped a real rebuild. Force a rebuild with cache cleared specifically when a config/env change should have triggered new build output but the log shows a cache hit instead.
- Custom domain stuck on "Configuring," can't issue a certificate → if DNS is proxied through Cloudflare (orange cloud), the platform's cert-issuance challenge can't complete. Temporarily switch that record to "DNS only" (gray cloud) in Cloudflare, wait for the platform to confirm Active, then switch back to Proxied.
- An env var was "added" per instructions but the bug persists after multiple fix attempts → **go back and verify it's actually listed in the dashboard** before trying anything else. It may never have saved, or may have been added to the wrong component (e.g., backend instead of frontend) in a multi-component app.

---

## Stage 5: Cloudflare + domain

See `references/cloudflare-domain-setup.md`. Summary:

1. Nameserver migration is domain-wide, not per-subdomain — check existing DNS records (especially MX/email) BEFORE switching nameservers, so nothing breaks in the gap.
2. After switching, do one decisive test: confirm the existing/previous site on that domain still loads correctly before adding anything new.
3. New subdomains for a fresh app: add as CNAME records pointing to the PaaS's given target, Proxied.
4. If a subdomain's SSL cert won't issue (see DigitalOcean failure pattern above), that's a Cloudflare-proxy-vs-cert-issuance timing issue, not a DNS mistake — temporarily unproxy, verify Active, reproxy.
5. After any bulk change (rebuild, cache-sensitive fix), **purge Cloudflare's cache** — Cloudflare can keep serving a stale `index.html` (and the JS bundle filename it references) even after the origin has genuinely rebuilt.

---

## Stage 6: End-to-end verification

Don't call it done because the build succeeded or the health check passed. Test the actual feature:

- Hit the backend's real API root directly first (isolates "is the backend even reachable" from "does the whole app work").
- Then test the frontend loading on the real domain.
- Then test the core authenticated flow (login, etc.) specifically — this is where the last-mile bugs tend to hide (missing seed data/admin account, missing signing secret, frontend/backend URL mismatch).

**Known failure patterns:**
- Login request hits a URL containing the literal string `undefined` → a frontend env var (like `REACT_APP_BACKEND_URL`) is missing or wasn't actually saved on the right component — verify directly in the dashboard rather than re-triggering more rebuilds blind.
- Login returns a clean 401 for a specific test account → that's actually correct behavior if the account was never seeded; check whether the app has a `seed_admin`-style bootstrap that reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars, and whether those were actually set.
- Login crashes with a 500 whose traceback shows `KeyError` on some `os.environ["X"]` → a required secret env var (JWT signing secret, etc.) was never set. Check the actual startup/auth code for every `os.environ[...]` access, not just the ones already known about.

---

## Also worth flagging as post-launch backlog (not launch blockers)

- Branded 404/500/502 error pages instead of generic platform defaults, at both the frontend-route level and the platform level.
- Caching AI-enrichment or other expensive per-row lookups so repeated data doesn't re-trigger the same external API calls.
- Turning any purely-synchronous "process everything in the request" endpoint into a background job once real traffic volume shows up (users waiting on a slow upload response is the first thing to break at scale).
- If the app's test suite is integration-style (hits a live, pre-seeded server over HTTP) rather than isolated unit/integration tests, that's a real gap worth fixing eventually — but it's fine to mark that CI job `continue-on-error: true` for now rather than block launch on rebuilding the whole test suite.
