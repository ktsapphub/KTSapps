import { handleStatsRequest } from "../../lib/umami.mjs";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { status, payload } = await handleStatsRequest(body, env);
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}
