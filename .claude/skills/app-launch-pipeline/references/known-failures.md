# Known Failure Patterns, Indexed by Symptom

Skim this list first when something breaks -- most deploy failures are one of these, not something new.

## github-cicd

| Symptom | Cause | Fix |
|---|---|---|
| gitleaks fails on every PR with a git error (not a real secret) | Shallow clone, `git log` can't resolve `commit^` (parent) | `fetch-depth: 0` on that job's checkout step |
| `403 Resource not accessible by integration` on a check that worked before | Repo just went private; default `GITHUB_TOKEN` needs explicit read perms now | Add `permissions: pull-requests: read` (+ `contents: read`) to the workflow file |
| Push to `.github/workflows/*` rejected, mentions "workflow scope" | Token missing Workflows permission | Add Workflows: Read and write to the token |
| `yarn install --frozen-lockfile` fails / builds are inconsistent | No committed lockfile | Generate one (`yarn install` locally), commit it |
| "The job was not acquired by Runner... Internal server error" | Possibly a transient GitHub infra hiccup | Check githubstatus.com; if clean, just re-run |

## mongodb-atlas

| Symptom | Cause | Fix |
|---|---|---|
| `SSL handshake failed: TLSV1_ALERT_INTERNAL_ERROR` against Atlas | (a) Network Access list missing `0.0.0.0/0`, or (b) ancient pinned driver version | Check (a) FIRST by looking directly at the Network Access list; then (b) upgrade pymongo/motor if still failing |
| Connection string password breaks the URL | Self-typed password with special characters | Always let Atlas auto-generate the password |

## digitalocean / paas

| Symptom | Cause | Fix |
|---|---|---|
| "container exited early with a **zero** exit code" | Run Command runs a script file directly with no blocking server-start call at the bottom | Set explicit Run Command (e.g. `uvicorn app:app --host 0.0.0.0 --port X`) |
| "container exited with a **non-zero** exit code" | A real crash -- check Deploy logs (not Build logs) for the traceback | Read the actual traceback, don't guess |
| Runtime Logs tab is empty | Process never stayed up long enough to log anything | Check Deploy logs instead |
| Backend/frontend built on the wrong OS runtime version | Buildpack defaulted to newest available (untested) version | Pin explicitly (e.g. `.python-version`), matching what CI already tests |
| Frontend build succeeds but a fix doesn't show up in behavior | Build cache reused instead of a real rebuild | Check log for "previous build was reused"; force rebuild WITH cache cleared |
| Custom domain stuck on "Configuring", can't issue certificate | Cloudflare proxy blocking the cert-issuance challenge | Temporarily un-proxy (DNS only) that record, confirm Active, re-proxy |
| Domain stuck "Configuring" for an unusually long time | Wrong/incomplete hostname was entered (e.g. missing `.com`) | Verify the exact domain string character-by-character, don't just wait longer |
| Static site 404s on any route except `/` when refreshed | No Catchall Document set | Set Catchall Document to `index.html` |
| Root domain hits the backend instead of the frontend | No explicit component routing rule for that domain | Add a routing rule scoping that domain's `/` to the correct component |

## frontend / build-time config

| Symptom | Cause | Fix |
|---|---|---|
| A request URL contains the literal string `undefined` | A `REACT_APP_*` (or equivalent) env var wasn't available when `yarn build` ran | Set it with **Build Time** scope (not Run Time) on the correct component; verify it's actually listed in the dashboard, not just "saved" |
| The fix above still doesn't take effect after a rebuild | Cloudflare (or another edge cache) still serving the old `index.html`/bundle | Purge Cloudflare's cache entirely |
| Browser refresh on a client-side route 404s | Static site missing a catchall/SPA fallback rule | See digitalocean row above |

## auth / login flow

| Symptom | Cause | Fix |
|---|---|---|
| Clean 401 for a specific test account | Account genuinely doesn't exist (correct, expected behavior) | Check whether the app auto-seeds an admin via env vars (e.g. `ADMIN_EMAIL`/`ADMIN_PASSWORD`); set them if missing |
| 500 error, traceback shows `KeyError` on `os.environ["X"]` | A required secret (commonly a JWT/session signing key) was never set | Grep the auth code for every `os.environ[...]` access; set whichever is missing as an encrypted Run Time env var |
| Browser shows a generic "Network Error" / CORS complaint on a request that used to work | Often a downstream symptom of a server-side crash (500), not an actual CORS misconfiguration -- an unhandled exception can skip attaching CORS headers, which the browser then misreports as a CORS block | Check the actual server-side error (Deploy/Runtime logs) instead of tuning CORS config |
