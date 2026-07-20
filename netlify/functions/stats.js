import { handleStatsRequest } from "../../lib/umami.mjs";

export default async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await request.json().catch(() => ({}));
  const { status, payload } = await handleStatsRequest(body, process.env);
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
};

export const config = { path: "/api/stats" };
