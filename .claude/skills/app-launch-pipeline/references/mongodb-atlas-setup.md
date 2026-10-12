# MongoDB Atlas Setup

## Sequence

1. **New Atlas Project per app** -- not a shared cluster with other apps. Standing preference: full isolation (separate credentials, separate network rules, no shared blast radius). Free tier (M0) is limited to one per *project*, not per account, so a new project sidesteps that limit cleanly and keeps things clean either way.
2. Build a Database → **M0 Free tier** (watch for a paid "Flex" tier sometimes shown as visually prominent/default -- don't pick that by accident).
3. Name the cluster something identifiable (`<appname>-prod`), pick a region near the deploy target.
4. **Let Atlas auto-generate the database user's password.** A self-typed password can contain characters (`@ : / ?`) that break the connection string URL if not properly encoded. Copy/save it the moment it's shown -- it is not shown again.
5. **Network Access → add `0.0.0.0/0` explicitly.** This is the single most-missed step. Atlas's "Automate security setup" during cluster creation typically only allows the browser's *current* IP -- which silently blocks every cloud host (DigitalOcean, Render, Railway, etc.) since their outbound IPs aren't fixed and aren't the one that was auto-added.
   - Do NOT use the "temporary, auto-delete in N hours" toggle for this entry -- that's for one-off debugging, not a production access rule. A temporary entry deleting itself in production is a silent, delayed outage.
6. **Verify this list directly if anything downstream fails** -- don't assume a save took effect. This was the actual root cause of a persistent TLS handshake error tonight, discovered only by going back and looking at the real list rather than continuing to theorize about driver versions.
7. Connect → Drivers → copy the connection string (`mongodb+srv://user:password@cluster.../`). Check the app's actual code for whether it expects the database name embedded in the URL path or as a separate env var (e.g. `DB_NAME`) -- don't assume; grep for `os.environ["DB_NAME"]` or equivalent.

## Known failure: TLSV1_ALERT_INTERNAL_ERROR

```
pymongo.errors.ServerSelectionTimeoutError: SSL handshake failed: ...
[SSL: TLSV1_ALERT_INTERNAL_ERROR] tlsv1 alert internal error
```

Two distinct possible causes -- check both, in this order, verifying rather than assuming:

1. **Network Access list missing `0.0.0.0/0`.** Atlas's shared-tier proxy layer, for at least some configurations, returns this exact TLS-level alert for a disallowed connecting IP instead of a plain connection timeout -- which makes it look like a driver/TLS negotiation bug rather than an access-list problem. **Go look at the actual IP Access List directly** before spending more time on driver theories.
2. **Outdated pinned driver version** (pymongo/motor). Atlas periodically tightens its supported TLS configuration; a multi-year-old pinned driver version can lose the ability to negotiate a handshake at all. Upgrade to current stable (check PyPI for the actual current version rather than assuming a specific number -- these change).

If the error persists identically after fixing #2, that's a strong signal it was actually #1 all along (confirmed in the real launch this skill is based on -- upgrading the driver alone did not fix it; the missing network rule was the actual cause).

## Password/secret rotation note

If a real Atlas password is ever exposed in a screenshot or chat transcript (even briefly, even in a "private" conversation), rotate it: Atlas → Database Access → find the user → Edit → Edit Password → Autogenerate. Don't screenshot the result the second time.
