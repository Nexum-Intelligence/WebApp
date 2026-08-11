// Vercel Serverless Function — structured business context for the agents.
//
// GET /api/context?email=you@company.com
//   → { context: "<formatted text block>", data: { ...profile + KPIs } }
//
// n8n calls this and renders `context` into the agent prompt (GYB-style), so the
// agents reason over the tenant's live business data (finance, sales, inventory,
// CRM, staff, …) instead of just the static profile.

import { buildContext } from "../lib/context.js";

export default async function handler(req, res) {
  const email = (req.query && req.query.email) || "";
  if (!email) { res.status(400).json({ error: "Missing email" }); return; }
  try {
    const ctx = await buildContext(email);
    res.status(200).json({ context: ctx.text, data: ctx.data });
  } catch (e) {
    res.status(200).json({ context: "", data: {}, error: String(e) });
  }
}
