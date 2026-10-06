// Vercel Serverless Function — Company profile store.
//
// GET  /api/company             → { data: {...sections}, updated_at }
// POST /api/company { name, company, data } → upserts the profile.
//
// The company profile is the shared business context every module/agent reads.
// Stored in Supabase table `company_profiles` (one row per email). Sections sent
// by the client replace the stored sections of the same name; sections the
// client does not send (e.g. written by the research agent) are kept.

import { resolveTenant } from "../lib/auth.js";
import { readBody, fail, rest, kickEmbed, enc } from "../lib/http.js";

export default async function handler(req, res) {
  const body = req.method === "POST" ? readBody(req) : {};
  const t = await resolveTenant(req, (req.query && req.query.email) || body.email);
  if (!t.email) return fail(res, t.status, t.error);
  const email = t.email;

  try {
    if (req.method === "GET") {
      if (t.demo) return res.status(200).json({ data: {} });
      const r = await rest(`company_profiles?email=eq.${enc(email)}&select=data,updated_at&limit=1`);
      if (!r.ok) return fail(res, 502, "Could not load profile");
      const row = r.data[0] || {};
      return res.status(200).json({ data: row.data || {}, updated_at: row.updated_at || null });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return fail(res, 405, "Method not allowed");
    }

    const { name = null, company = null, data = {} } = body;
    if (!data || typeof data !== "object" || Array.isArray(data)) return fail(res, 400, "data must be an object");
    if (t.demo) return res.status(200).json({ ok: true, stored: false });

    const cur = await rest(`company_profiles?email=eq.${enc(email)}&select=data&limit=1`);
    if (!cur.ok) return fail(res, 502, "Could not load profile");
    const merged = { ...((cur.data[0] && cur.data[0].data) || {}), ...data };

    const r = await rest("company_profiles?on_conflict=email", {
      method: "POST",
      body: { email, name, company, data: merged, updated_at: new Date().toISOString() },
      prefer: "resolution=merge-duplicates,return=minimal",
    });
    if (!r.ok) return fail(res, 502, "Could not save profile");
    await kickEmbed();
    return res.status(200).json({ ok: true, stored: true, data: merged });
  } catch (e) {
    console.error("[company]", e);
    return fail(res, 500, "Server error");
  }
}
