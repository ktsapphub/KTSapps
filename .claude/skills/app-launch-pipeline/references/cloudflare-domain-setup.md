# Cloudflare + Domain Setup

## Migrating a live domain from a registrar's default DNS to Cloudflare

1. **Before touching anything**, check the registrar's current DNS records (Advanced DNS / Host Records) for the domain. Nameserver switching is domain-wide, not per-subdomain -- there's no way to move just one subdomain to Cloudflare while leaving the rest on the registrar's DNS. Note especially any MX/email records; these are the ones that break silently and are easy to forget.
2. Sign up for Cloudflare, add the domain as a site, let it auto-scan existing DNS records.
3. **Verify the scan actually caught everything** by comparing against the list from step 1 -- don't assume the automatic import is complete. Watch for a subtlety: a registrar's ALIAS-record-at-root workaround (common for pointing a bare domain at a platform like Netlify) may get imported as a static A record snapshot instead of being preserved as a proper CNAME-at-root (Cloudflare supports CNAME at the apex, which most DNS providers can't do -- that's exactly why the registrar needed the ALIAS workaround in the first place). If so, delete the imported A records and manually add a CNAME at `@` pointing to the same target, to avoid the record silently going stale if the target's IPs ever change.
4. Only after confirming the DNS record set is complete and correct: update the nameservers at the registrar to Cloudflare's two assigned values.
5. Wait for Cloudflare to report the site as Active (can take minutes to hours).
6. **One decisive test**: load the existing/previous site on that domain in a browser and confirm it renders exactly as before. This proves the migration didn't break what was already live, before adding anything new on top of it.

## Adding a new subdomain for a freshly deployed app

- Add as a CNAME record: Name = the subdomain part only (Cloudflare appends the root domain automatically), Content = the exact target given by the hosting platform, Proxy status = Proxied.
- If two subdomains need to talk to each other with cookies (e.g. a frontend and its API on `app.example.com` / `api.app.example.com`), keep them both under the same root registrable domain -- this keeps them "same-site" for cookie/CORS purposes even with `SameSite=Lax`. Splitting them across genuinely different domains (not just subdomains) breaks session cookies unless explicitly engineered around.

## SSL certificate stuck / can't issue

See `digitalocean-deploy.md`'s section on this -- it's a Cloudflare-proxy-vs-origin-cert-issuance timing conflict, not a DNS correctness problem. Temporarily un-proxy (DNS only / gray cloud), let the origin platform issue its cert, confirm Active, re-proxy.

## Stale content after a rebuild

Cloudflare caches aggressively at its edge, including `index.html` and the filenames it references. A React app's build process generates new, uniquely-named JS bundle files specifically to defeat this kind of caching -- but if Cloudflare cached the *page* pointing at the old filename, the browser keeps being told to fetch a bundle that predates any fix, regardless of how many times the origin is rebuilt or the browser is hard-refreshed.

Fix: Cloudflare → Caching → Configuration → **Purge Cache → Purge Everything**, after any fix where the browser is still showing clearly-stale behavior despite a confirmed-successful origin rebuild.
