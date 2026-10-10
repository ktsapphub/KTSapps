# Security Review Checklist (stack-agnostic)

Run this before code moves from a feature branch toward `staging`/`main`. Applies regardless of language/framework -- adapt the specific tool commands to the actual stack (e.g. `pip-audit` for Python, `npm audit` for Node).

## Pass 1: automated scan

- Secret scanning across the full diff AND full git history if this is the first scan on an existing repo (a secret removed from the latest commit is still exposed if it's in an earlier one)
- Dependency vulnerability scan (`pip-audit`, `npm audit`, `cargo audit`, etc. -- whatever fits the stack)
- Grep for common secret-shaped strings as a backstop even after a scanner runs: `api[_-]?key`, `password`, `secret`, `token` combined with a `=` or `:` and a long alphanumeric string

## Pass 2: OWASP-category review, by category

**Injection (SQL, NoSQL, command)**
- Are all queries parameterized (never raw string interpolation into a query)?
- Is any `subprocess`/`exec`/`eval`-style call ever fed user input directly?

**Broken authentication**
- Are passwords hashed with a proper algorithm (bcrypt, argon2, scrypt) -- never plaintext, never a fast general-purpose hash (MD5/SHA256 alone)?
- Is the session/JWT signing secret actually set as a real secret (not a default/hardcoded fallback)? This is a specific, easy-to-miss failure mode -- check every place the code reads that secret from the environment and confirm each one has no insecure fallback value.
- Is there a genuine rate limit or lockout on login attempts?

**Sensitive data exposure**
- Is HTTPS enforced everywhere (no mixed content, no plain-HTTP fallback)?
- Is anything sensitive ever written to logs (passwords, tokens, full card numbers)?
- Are secrets pulled from environment variables / a secrets manager, never hardcoded?

**Broken access control**
- Does every route that should require auth actually check it? (Don't assume -- verify each endpoint explicitly, including ones added late or edited since the original review.)
- Are object references checked for ownership (`GET /api/orders/123` -- does the code verify order 123 belongs to the requesting user, not just that *some* valid user is logged in)?
- Is CORS configured to a specific origin, not `*` combined with credentials (browsers reject that combination anyway, but it's a sign of a copy-pasted default that was never actually thought through)?

**Security misconfiguration**
- Debug mode off in production?
- Default/example credentials changed or removed entirely?
- Error responses generic to the client (no stack traces, no internal paths) even though full detail is fine in server-side logs?

**XSS**
- Is user-generated content ever inserted as raw HTML rather than escaped text?

**Vulnerable dependencies**
- Any dependency with a known CVE at a severity worth blocking on?
- Any dependency pinned to a multi-year-old version with no clear reason? (This has caused real production issues -- an old pinned database driver can lose TLS compatibility with a cloud provider that's since tightened its supported configuration. Age alone is a reason to check, not just known CVEs.)

**Logging & monitoring**
- Are security-relevant events (failed logins, permission denials) actually logged somewhere reviewable?

## Report format

```markdown
# Security Review: [PR / branch name]
Reviewed: [date]

## Summary
Critical: X | High: Y | Medium: Z | Low: W
Risk level: HIGH / MEDIUM / LOW

## Critical (block merge)
### [Issue]
Location: `file:line`
Issue: [what's wrong]
Impact: [what happens if exploited]
Fix: [concrete remediation]

## High (fix before this reaches production, doesn't have to block this specific PR)
[same format]

## Medium / Low
[same format, shorter]

## Checklist
- [ ] No hardcoded secrets (current diff AND git history)
- [ ] No default/fallback secrets in auth-critical code paths
- [ ] Dependencies free of known CVEs at blocking severity
- [ ] No dependency pinned suspiciously old without a documented reason
- [ ] Auth checked on every route that needs it
- [ ] Object-level authorization checked, not just "is logged in"
- [ ] CORS scoped to real origins
- [ ] No sensitive data in logs

Recommendation: BLOCK / APPROVE WITH FOLLOW-UP / APPROVE
```

## Common false positives -- verify context before flagging

- Example/placeholder values in a committed `.env.example` file (not a real secret)
- Test fixtures with obviously-fake credentials, clearly marked as such
- A public-by-design API key (e.g., a frontend Maps API key meant to be visible, restricted by domain/referrer rather than by secrecy)
