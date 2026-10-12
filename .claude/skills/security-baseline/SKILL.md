---
name: security-baseline
description: "Use on every code change, deploy, or review in any of Bretton's projects. Cybersecurity baseline: secrets handling, auth, input validation, dependency and supply-chain risk, headers/CORS, rate limits, data isolation per environment, and the pre-ship gate. Load before writing auth, API, payment, upload, or infrastructure code, and before opening any PR."
---

# Security Baseline

Apply to every change. A clean result is earned, not assumed. Findings are tagged **BLOCKER**, **MAJOR** or **MINOR**; any BLOCKER stops the ship.

## 1. Secrets
- Never commit secrets, keys, tokens, `.env`, service-account JSON, `.p8`, or keystores. Read from env vars; keep a `.env.example` with names only.
- Before every commit, scan the diff for key patterns (`sk-`, `ghp_`, `github_pat_`, `AKIA`, `-----BEGIN`, `AIza`, `xox`). If found: BLOCKER, remove and tell Bretton to rotate.
- Recommend `gitleaks` in CI where missing.
- Never print secret values in logs, PR bodies, or summaries.

## 2. Environments and data
- Production, staging, and demo each have their own database and keys. Never point staging/demo at the production DB. Payments and email use test/sandbox keys outside production.
- Protected environments are never reconfigured, reset, or reseeded.
- No real customer PII in fixtures, seeds, screenshots, or logs.

## 3. AuthN / AuthZ
- Every non-public route checks the session server-side. Authorization by object ownership, never by client-supplied IDs alone (IDOR).
- Passwords: bcrypt/argon2 only. Sessions: HttpOnly, Secure, SameSite=Lax+. Rotate session on login.
- Admin panels behind auth plus a role check; no default credentials.

## 4. Input and output
- Validate and type-check all input at the boundary (zod/joi/pydantic or equivalent). Parameterized queries only; no string-built SQL/NoSQL queries.
- Escape output; no `dangerouslySetInnerHTML`/`innerHTML` with user data. Sanitize uploaded filenames, restrict MIME types and size, store outside the web root.
- Server-side fetches to user-supplied URLs: allowlist hosts (SSRF).

## 5. Transport, headers, CORS
- HTTPS only. Set HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, a CSP where feasible, `frame-ancestors` to prevent clickjacking.
- CORS: explicit origins, never `*` with credentials.

## 6. Abuse controls
- Rate-limit auth, signup, password reset, contact forms, AI/LLM endpoints, and any paid third-party calls (Google Places, Gemini, OpenAI). Cap request body size.
- Bot protection on public forms (Turnstile/hCaptcha) when spam is plausible.

## 7. Dependencies and supply chain
- Prefer maintained, popular packages. Run `npm audit --omit=dev` / `pip-audit`; HIGH/CRITICAL in reachable code = MAJOR or BLOCKER.
- Pin versions via lockfile; commit the lockfile. No `curl | sh` installers in CI.
- GitHub Actions: least-privilege `permissions:`, pin third-party actions to a major version or SHA, never echo secrets.

## 8. Mobile
- No secrets in the app bundle (they are extractable). Call your own backend.
- Certificate/keystore and store credentials live only in EAS/CI secrets.

## 9. Pre-ship gate (run before any PR that can reach production)
Report as a checklist in the summary:
- [ ] No secrets in diff
- [ ] Auth/authz on new routes
- [ ] Input validated, queries parameterized
- [ ] Rate limits on new public/paid endpoints
- [ ] Headers/CORS unchanged or tightened
- [ ] Deps audit clean (or findings listed)
- [ ] Staging uses its own DB/keys

End with either `NO BLOCKERS` or the numbered BLOCKER list.
