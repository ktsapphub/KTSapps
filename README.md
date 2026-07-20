# KTSapps

The landing page for **ktsapps.com**, plus a browser admin panel for editing it and a private analytics dashboard.

Three moving parts:

| Part | Lives at | What it does |
|---|---|---|
| The site | `ktsapps.com` | Static HTML built by Eleventy from JSON in `src/_data/` |
| The admin | `ktsapps.com/admin` | Sveltia CMS. Edits write JSON back to this repo as commits |
| The dashboard | `ktsapps.com/stats` | Password-gated. Reads your Umami analytics through a serverless proxy |

Nothing here needs a database. Content is git. That means every edit is versioned, revertable, and you can always fix things by editing a JSON file directly.

---

## How it fits together

```
You edit at /admin
      ↓  commit to GitHub
GitHub webhook
      ↓  triggers a build
Host runs `npm run build`  →  Eleventy renders src/_data/*.json into _site/
      ↓
ktsapps.com serves static HTML
```

Typical edit-to-live time is 30–60 seconds.

---

## Local setup

```bash
npm install
npm run dev      # http://localhost:8080
```

`npm run build` writes the finished site to `_site/`.

The files you'll actually touch:

```
src/_data/site.json       Global settings, section on/off switches, marquee, analytics IDs
src/_data/hero.json       Headline area
src/_data/projects.json   The six project cards
src/_data/about.json      Manifesto + pillars
src/_data/contact.json    Email + social links
src/assets/css/site.css   All styling
src/assets/js/site.js     All motion
```

---

## Step 1 — Push to GitHub

```bash
git init && git add . && git commit -m "KTSapps site"
gh repo create ktsapps-site --private --source=. --push
```

The repo is `ktsapphub/KTSapps` and `public/admin/config.yml` already points at it.

---

## Step 2 — Deploy

You said hosting wasn't decided. All three work; pick on this basis:

- **Cloudflare Pages** — best if your subdomain apps also live on Cloudflare and you want one DNS panel. Functions in `functions/` work as-is.
- **Netlify** — least friction for the CMS, because Netlify Identity can handle admin login for you. `netlify.toml` is already configured.
- **Vercel** — pick this if the subdomain apps are Next.js. `vercel.json` is already configured.

Every host needs the same two settings:

```
Build command:      npm run build
Publish directory:  _site
```

Then point `ktsapps.com` at the deployment and let the host issue the certificate.

---

## Step 3 — Turn on the admin panel

The CMS needs permission to commit to your repo. Two routes:

**Netlify** (simplest) — enable **Identity** and **Git Gateway** in site settings, invite yourself, then in `config.yml` replace the whole `backend:` block with:

```yaml
backend:
  name: git-gateway
  branch: main
```

**Any other host** — deploy the small OAuth relay [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth) as a Cloudflare Worker (about five minutes, free), create a GitHub OAuth App pointing at it, and set `base_url` in `config.yml` to the Worker URL.

Then visit `ktsapps.com/admin`, sign in with GitHub, and you get form fields for everything: hero copy, each project card, images, demo clips, the scrolling band, and toggles to show or hide whole sections.

**Adding a project** is `Projects → Projects list → +`. Drag to reorder. Deleting removes the card. No HTML involved.

---

## Step 4 — Analytics (Umami Cloud)

**Already wired up.** Your Umami Cloud account is configured in `src/_data/site.json`:

```
Script:     https://cloud.umami.is/script.js
Website ID: e95cf66f-d447-4b22-af77-41752a1daf44
```

That renders the exact tag Umami gave you. Umami is cookie-free, so **no consent banner is required**.

Tracking starts on your first deploy. Custom events are already wired: `open-project` (tagged with the project name), `email-click`, and `social-click` — so you'll see which subdomain apps people actually click through to, not just that they visited.

Both values are editable in `/admin → Site & sections → Analytics`, along with a master on/off switch. If you ever move to self-hosted Umami, change the script URL there and the env vars below; nothing else needs to change.

---

## Step 5 — The private dashboard

First create an API key: in Umami, click your profile in the side nav → **Settings** → **API keys** → **Create key**. Reveal it with the eye icon and copy it.

Then set these environment variables in your host's dashboard:

| Variable | Value |
|---|---|
| `UMAMI_API_KEY` | the key you just created |
| `UMAMI_WEBSITE_ID` | `e95cf66f-d447-4b22-af77-41752a1daf44` |
| `STATS_PASSWORD` | whatever you want to type at `/stats` |
| `UMAMI_API_URL` | *only* if your Umami account is in the EU region — set `https://api.umami.is/v1/eu` |

**The API host is not the script host.** The tracking script comes from `cloud.umami.is`, but the data API lives at `api.umami.is/v1`. The code defaults to the right one automatically; it's noted here because it's the first thing to check if the dashboard returns 404s.

*Self-hosted instead?* Leave `UMAMI_API_KEY` empty and set `UMAMI_HOST`, `UMAMI_USERNAME` and `UMAMI_PASSWORD`. The fetcher detects which mode you're in and switches between API-key and bearer-token auth on its own.

**Rate limit:** Cloud allows 50 API calls per 15 seconds. One dashboard load makes six, so you'd have to reload roughly eight times in fifteen seconds to hit it.

Then open `ktsapps.com/stats`. You get visitors, pageviews, visits, bounce rate and average visit length — each with a change-vs-previous-period figure — plus top pages, referrers, countries, devices and custom events, over 24h / 7d / 30d / 12mo.

**Why the proxy exists:** Umami's API key is a secret. If the page called Umami directly, that key would sit in your JavaScript for anyone to read, and they could query — or in some setups modify — your analytics. `lib/umami.mjs` runs server-side, so the key never leaves the host. Three adapters are included (`functions/api/stats.js` for Cloudflare, `netlify/functions/stats.js`, `api/stats.js` for Vercel); your host uses whichever matches and ignores the rest.

**On the password:** it's a single shared secret compared in constant time, which is appropriate for a personal dashboard. It is not rate-limited. If you want it properly hardened, add your host's built-in access control on top — Cloudflare Access and Netlify's password protection are both free and put a real auth layer in front of the route.

---

## Adding project images and clips

Upload through `/admin` and it handles paths for you. Or drop files in `public/assets/uploads/` and reference them as `/assets/uploads/filename.jpg`.

- **Cover image** — 16:10, roughly 1200×750. Leave it empty and the card falls back to generated artwork built from the project's accent colour and monogram, which looks deliberate rather than broken.
- **Demo clip** — muted, looping MP4, ideally under 3MB so the flip stays instant. Leave it empty and you get a tidy "Clip coming soon" panel.

---

## Things worth knowing

**The stat numbers on the cards are hand-entered.** Downloads, impressions and revenue come from `projects.json`, not from Umami. Umami measures traffic to *this* page, not installs of your apps, so there's no honest automatic mapping. Update them in `/admin` when you have real figures. Leave revenue empty and the card shows "Not for commercial sale".

**Section toggles are real.** Switching off *About* in the CMS removes the section, its nav link, and its markup from the built HTML. Nothing is hidden with CSS.

**Accent colours drive more than you'd expect.** Each project's colour sets the hover glow, the card border, the generated cover art and the button highlight, via one CSS variable. Changing it in the CMS restyles the whole card coherently.

**Motion respects `prefers-reduced-motion` throughout.** Card flips become crossfades, counters jump to their final values, and the page stays fully usable.

---

## Reference

- Eleventy — <https://www.11ty.dev/docs/>
- Sveltia CMS — <https://github.com/sveltia/sveltia-cms>
- Umami API — <https://umami.is/docs/api>
