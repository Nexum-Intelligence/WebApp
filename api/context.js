// Vercel Serverless Function — structured business context for the agents.
//
// GET /api/context → { context: "<formatted text block>", data: { ...profile + KPIs } }
//
// Used by the Overview KPIs. Server-to-server callers send x-nexum-key + ?email=.

import { buildContext } from "../lib/context.js";
import { resolveTenant } from "../lib/auth.js";
import { setActor } from "../lib/actor.js";
import { fail } from "../lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return fail(res, 405, "Method not allowed");
  }
  const t = await resolveTenant(req, req.query && req.query.email);
  if (!t.email) return fail(res, t.status, t.error);
  setActor(t.actor);
  try {
    const ctx = await buildContext(t.email);
    return res.status(200).json({ context: ctx.text, data: ctx.data });
  } catch (e) {
    console.error("[context]", e);
    return fail(res, 500, "Could not build context");
  }
}
