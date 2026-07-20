import { handleStatsRequest } from "../lib/umami.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { status, payload } = await handleStatsRequest(req.body || {}, process.env);
  res.setHeader("cache-control", "no-store");
  return res.status(status).json(payload);
}
