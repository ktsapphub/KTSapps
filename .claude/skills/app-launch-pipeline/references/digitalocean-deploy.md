# DigitalOcean App Platform Deploy

## Setup sequence

1. Create → App → GitHub → **"Only select repositories"** (never "All repositories") → pick the one repo, branch `main`.
2. For a monorepo, set **Source directories** explicitly (e.g., `backend, frontend`) rather than trusting auto-detection to find both components correctly on the first pass.
3. Confirm the detected component types are correct: backend as **Web Service**, a React/static frontend as **Static Site** (NOT Web Service -- a Static Site is free; a Web Service bills continuously even for a build that's just serving static files). If a component was created with the wrong type, some DO versions don't allow changing type in place -- add a new component with the correct type, confirm it works, THEN delete the old one (never delete-then-recreate, to avoid a downtime gap if the new one has a config mistake).
4. **Set the Run Command explicitly** for the backend -- don't trust the buildpack's auto-detected default.
   - Failure pattern: buildpack defaults to `python server.py` (running the file directly). If the file has no blocking server-start call at the bottom (`if __name__ == "__main__": uvicorn.run(...)`), this just executes top-level code and exits immediately with exit code 0. This shows up as "container exited early with a zero exit code" / failed health checks -- looks like a health-check timing bug but is actually just the wrong command. Explicit fix: `uvicorn <module>:<app> --host 0.0.0.0 --port <port>`.
5. **Pin the runtime version explicitly.** A repo with no `.python-version` (or equivalent) file lets the buildpack default to its newest available version, which may be untested against the app's actual pinned dependencies (especially packages with compiled extensions) and may not match what CI tests against. Add the pin file, matching whatever CI already uses.
6. Env vars:
   - Backend secrets (DB connection string, API keys, JWT signing secret): scope **Run Time**, **Encrypted**.
   - Backend non-secret config (DB name, CORS origin): scope **Run Time**, not encrypted (nothing gained by encrypting a value that's already public elsewhere, like a domain name).
   - **Frontend (Static Site) build-time values** (e.g., `REACT_APP_BACKEND_URL`): scope **Build Time**, not Run Time. A static site has no running server process after the build -- there is nothing to ever read a "Run Time" variable from. The value must exist at the moment `yarn build` runs, since Create React App bakes `REACT_APP_*` vars permanently into the compiled JS at that point.
   - **After adding any env var, go back and look at the component's settings page again to confirm it's actually listed** -- don't just trust that clicking Save worked, especially across multiple components in the same app. A variable intended for the frontend accidentally saved only to the backend (or never saved at all) is a real, repeatable failure mode.
7. A Static Site needs an explicit **Catchall Document** set to `index.html`, or refreshing the browser on any client-side route (e.g. `/login`, `/dashboard`) returns a platform-level 404 instead of the React app's router handling it.
8. **Component routing rules**: verify explicitly which domain routes to which component. The default `/` rule may route to the backend (not the frontend) even for a newly-added custom domain -- don't assume a domain "just works" once it's Active; test it.

## Reading the right log

There isn't one "the log" -- three separate tabs show different things, and picking the wrong one wastes real time:
- **Build logs**: package installation, compilation. A crash here means the code/dependencies don't build. Success here says nothing about whether the app actually runs.
- **Deploy logs**: what happens when the built container/site actually starts up. A Python traceback from an unhandled exception at startup shows here.
- **Runtime logs**: ongoing output from an already-running process. Empty/no-content here usually means the process never stayed up long enough to log anything -- itself a clue (check Deploy logs instead).

"Deployment failed... container exited with a non-zero exit code" or "...zero exit code" → always check **Deploy logs**, not Build logs, even though Build logs are what's shown by default after a failure.

## Custom domain + SSL certificate stuck on "Configuring"

If the domain's DNS is proxied through Cloudflare (orange cloud), the platform's automatic certificate-issuance challenge can be blocked by the proxy sitting in front of the verification traffic. Fix:
1. In Cloudflare, temporarily switch that record to **DNS only** (gray cloud).
2. Wait a minute or two, then refresh the domain's status in the platform's dashboard -- don't just wait passively, trigger the refresh.
3. Once it shows Active/certificate issued, switch back to **Proxied** in Cloudflare. No downside once the cert exists.

If a domain has been stuck for an unusually long time, double check the domain name was entered correctly (a missing `.com` or wrong subdomain will stall forever since it's checking a hostname that doesn't match anything real in DNS) before assuming it's a propagation delay.

## Build cache

- If a build succeeds but the runtime behavior clearly doesn't reflect the latest code/config change, check the build log for a line like "Your previous build was reused" -- the platform's cache skipped a real rebuild. Force a rebuild **with cache cleared**.
- Don't clear cache reflexively for every failure -- only when there's direct evidence (a cache-reuse log line, or a change that provably should have altered the build output but didn't) that the cache specifically is the problem. Clearing cache when the real issue is a runtime crash just wastes a slower rebuild for nothing.

## GitHub Actions transient runner failures

"The job was not acquired by Runner of type hosted... Internal server error" is sometimes a genuine, transient GitHub infrastructure hiccup unrelated to any config. Check githubstatus.com for an active incident; if nothing's reported, just re-run the failed job -- it commonly clears on the second attempt.
