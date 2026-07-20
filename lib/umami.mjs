/* ============================================================
   Umami dashboard fetcher — shared by all three host adapters.

   Runs SERVER-SIDE only. The API key never reaches the browser;
   the page calls this, this calls Umami.

   Works with both:
     Umami Cloud  → https://api.umami.is/v1  + x-umami-api-key header
     Self-hosted  → https://your-host/api    + Bearer token from /api/auth/login
   ============================================================ */

const RANGES = {
  "24h":  864e5,
  "7d":   6048e5,
  "30d":  2592e6,
  "12mo": 31536e6
};

const CLOUD_API = "https://api.umami.is/v1";

/* Cloud and self-hosted mount the API at different paths, so the base is
   resolved once here rather than assumed at each call site. Cloud's tracking
   script lives on cloud.umami.is but its API lives on api.umami.is — an easy
   thing to get wrong, hence this being explicit. */
function apiBase(env) {
  if (env.UMAMI_API_URL) return env.UMAMI_API_URL.replace(/\/$/, "");
  if (env.UMAMI_API_KEY) return CLOUD_API;
  if (env.UMAMI_HOST)    return `${env.UMAMI_HOST.replace(/\/$/, "")}/api`;
  throw new Error("Set UMAMI_API_KEY (Cloud) or UMAMI_HOST (self-hosted).");
}

async function authHeaders(env) {
  // Umami Cloud: a single API key header, no login round-trip.
  if (env.UMAMI_API_KEY) return { "x-umami-api-key": env.UMAMI_API_KEY };

  // Self-hosted: exchange username/password for a bearer token.
  const res = await fetch(`${env.UMAMI_HOST.replace(/\/$/, "")}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: env.UMAMI_USERNAME, password: env.UMAMI_PASSWORD })
  });
  if (!res.ok) throw new Error(`Umami login failed (${res.status})`);
  const { token } = await res.json();
  return { authorization: `Bearer ${token}` };
}

/* /stats returns flat totals plus a `comparison` block for the previous
   period. Older self-hosted builds returned { value, prev } per metric,
   so both shapes are unwrapped here. */
function readStat(stats, key) {
  const raw = stats?.[key];
  if (raw && typeof raw === "object") {
    return { value: raw.value ?? 0, prev: raw.prev ?? 0 };
  }
  return { value: raw ?? 0, prev: stats?.comparison?.[key] ?? 0 };
}

function pct(cur, prev) {
  if (!prev) return cur ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

export async function fetchDashboard(env, rangeKey = "7d") {
  const span = RANGES[rangeKey] || RANGES["7d"];
  const endAt = Date.now();
  const startAt = endAt - span;

  const headers = { accept: "application/json", ...(await authHeaders(env)) };
  const base = `${apiBase(env)}/websites/${env.UMAMI_WEBSITE_ID}`;
  const qs = `startAt=${startAt}&endAt=${endAt}`;

  const get = async (path) => {
    const res = await fetch(`${base}${path}`, { headers });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Umami ${path.split("?")[0]} → ${res.status}${detail ? " " + detail.slice(0, 120) : ""}`
      );
    }
    return res.json();
  };

  /* Six parallel calls. Cloud allows 50 requests per 15s, so one dashboard
     load costs about 12% of the budget — comfortable even on fast reloads.
     Metric panels degrade to empty rather than failing the whole page. */
  const soft = (p) => p.catch(() => []);

  const [stats, paths, referrers, countries, devices, events] = await Promise.all([
    get(`/stats?${qs}`),
    soft(get(`/metrics?${qs}&type=path&limit=8`)),
    soft(get(`/metrics?${qs}&type=referrer&limit=8`)),
    soft(get(`/metrics?${qs}&type=country&limit=8`)),
    soft(get(`/metrics?${qs}&type=device&limit=5`)),
    soft(get(`/metrics?${qs}&type=event&limit=8`))
  ]);

  const visitors  = readStat(stats, "visitors");
  const pageviews = readStat(stats, "pageviews");
  const visits    = readStat(stats, "visits");
  const bounces   = readStat(stats, "bounces");
  const totaltime = readStat(stats, "totaltime");

  return {
    range: rangeKey,
    generatedAt: new Date().toISOString(),
    kpis: {
      visitors:   { value: visitors.value,  delta: pct(visitors.value,  visitors.prev)  },
      pageviews:  { value: pageviews.value, delta: pct(pageviews.value, pageviews.prev) },
      visits:     { value: visits.value,    delta: pct(visits.value,    visits.prev)    },
      bounceRate: { value: visits.value ? Math.round((bounces.value / visits.value) * 100) : 0, suffix: "%" },
      avgTime:    { value: visits.value ? Math.round(totaltime.value / visits.value) : 0, suffix: "s" }
    },
    panels: { urls: paths, referrers, countries, devices, events }
  };
}

/* Constant-time comparison so a wrong password doesn't leak its
   correctness through response timing. */
export function passwordOk(supplied, expected) {
  if (!expected) return false;
  const a = String(supplied || ""), b = String(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function handleStatsRequest(body, env) {
  if (!passwordOk(body?.password, env.STATS_PASSWORD)) {
    return { status: 401, payload: { error: "Wrong password." } };
  }
  if (!env.UMAMI_WEBSITE_ID) {
    return { status: 500, payload: { error: "UMAMI_WEBSITE_ID is not set on the host." } };
  }
  try {
    return { status: 200, payload: await fetchDashboard(env, body?.range) };
  } catch (err) {
    return { status: 502, payload: { error: String(err.message || err) } };
  }
}
