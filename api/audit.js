// Vercel Serverless Function — the tenant's change history.
// GET /api/audit[?limit=100] → { entries: [{ at, actor, table_name, op, kind, changed }] }

import { resolveTenant } from "../lib/auth.js";
import { setActor } from "../lib/actor.js";
import { fail, rest, enc } from "../lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return fail(res, 405, "Method not allowed"); }
  const t = await resolveTenant(req, req.query && req.query.email);
  if (!t.email) return fail(res, t.status, t.error);
  setActor(t.actor);
  if (t.demo) return res.status(200).json({ entries: [] });
  const limit = Math.min(Math.max(parseInt((req.query || {}).limit, 10) || 100, 1), 500);
  const r = await rest(`audit_log?email=eq.${enc(t.email)}&order=at.desc&limit=${limit}&select=id,at,actor,table_name,op,kind,changed`);
  if (!r.ok) return fail(res, 502, "Could not load history");
  return res.status(200).json({ entries: r.data });
}
