// Vercel Serverless Function — generic operational records (CRM, POS, finance …).
//
// GET    /api/records?kind=customers[&limit=500]      → { records }
// POST   /api/records { kind, data }                   → { ok, record }
// PATCH  /api/records { id, data }                     → { ok, record }
// DELETE /api/records?id=…                             → { ok }
//
// One Supabase table `company_records` holds every collection (kind = table key).
// The tenant is the verified caller (lib/auth.js). Connector secrets are masked
// in every response and kept when a masked value is sent back.

import { resolveTenant } from "../lib/auth.js";
import { setActor } from "../lib/actor.js";
import { readBody, fail, rest, kickEmbed, enc } from "../lib/http.js";

const KIND = /^[a-z][a-z0-9_-]{1,39}$/;
const SECRET = /(key|token|secret|password)/i;
const MASK = "••••";

export function maskSecrets(value) {
  if (Array.isArray(value)) return value.map(maskSecrets);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET.test(k) && typeof v === "string" && v ? `${MASK}${v.slice(-4)}` : maskSecrets(v);
    }
    return out;
  }
  return value;
}

// Replace masked strings in `next` with the stored originals from `prev`.
export function unmaskSecrets(next, prev) {
  if (Array.isArray(next)) return next.map((v, i) => unmaskSecrets(v, Array.isArray(prev) ? prev[i] : undefined));
  if (next && typeof next === "object") {
    const out = {};
    for (const [k, v] of Object.entries(next)) out[k] = unmaskSecrets(v, prev && typeof prev === "object" ? prev[k] : undefined);
    return out;
  }
  if (typeof next === "string" && next.startsWith(MASK)) return typeof prev === "string" ? prev : "";
  return next;
}

const view = (row) => (row && row.kind === "connectors" ? { ...row, data: maskSecrets(row.data) } : row);

export default async function handler(req, res) {
  const q = req.query || {};
  const body = req.method === "GET" || req.method === "DELETE" ? {} : readBody(req);
  const t = await resolveTenant(req, q.email || body.email);
  if (!t.email) return fail(res, t.status, t.error);
  setActor(t.actor);
  const email = t.email;

  try {
    if (req.method === "GET") {
      const kind = q.kind;
      if (!KIND.test(kind || "")) return fail(res, 400, "Missing or invalid kind");
      if (t.demo) return res.status(200).json({ records: [] });
      const limit = Math.min(Math.max(parseInt(q.limit, 10) || 500, 1), 1000);
      const r = await rest(`company_records?email=eq.${enc(email)}&kind=eq.${enc(kind)}&order=created_at.desc&limit=${limit}&select=id,created_at,updated_at,kind,data`);
      if (!r.ok) return fail(res, 502, "Could not load records");
      return res.status(200).json({ records: r.data.map(view) });
    }

    if (req.method === "POST" && Array.isArray(body.items)) {
      // bulk import (CSV / Sheets): up to 1000 rows of one kind
      const { kind, items } = body;
      if (!KIND.test(kind || "") || kind === "connectors") return fail(res, 400, "Missing or invalid kind");
      if (!items.length || items.length > 1000) return fail(res, 400, "Import 1–1000 rows at a time");
      if (items.some((d) => !d || typeof d !== "object" || Array.isArray(d))) return fail(res, 400, "Every row must be an object");
      if (t.demo) return res.status(200).json({ ok: true, stored: false, count: items.length });
      const r = await rest("company_records", { method: "POST", body: items.map((data) => ({ email, kind, data })), prefer: "return=minimal" });
      if (!r.ok) return fail(res, 502, "Import failed");
      await kickEmbed();
      return res.status(200).json({ ok: true, stored: true, count: items.length });
    }

    if (req.method === "POST") {
      const { kind, data = {} } = body;
      if (!KIND.test(kind || "")) return fail(res, 400, "Missing or invalid kind");
      if (!data || typeof data !== "object" || Array.isArray(data)) return fail(res, 400, "data must be an object");
      if (t.demo) return res.status(200).json({ ok: true, stored: false, record: { id: `local-${Date.now()}`, created_at: new Date().toISOString(), kind, data } });
      const r = await rest("company_records", { method: "POST", body: { email, kind, data }, prefer: "return=representation" });
      if (!r.ok) return fail(res, 502, "Could not save record");
      if (kind !== "connectors") await kickEmbed();
      return res.status(200).json({ ok: true, stored: true, record: view(r.data[0]) });
    }

    if (req.method === "PATCH") {
      const { id, data = {} } = body;
      if (!id) return fail(res, 400, "Missing id");
      if (!data || typeof data !== "object" || Array.isArray(data)) return fail(res, 400, "data must be an object");
      if (t.demo || String(id).startsWith("local-")) return res.status(200).json({ ok: true, stored: false });
      const base = `company_records?id=eq.${enc(id)}&email=eq.${enc(email)}`;
      let next = data;
      const cur = await rest(`${base}&select=kind,data`);
      if (!cur.ok) return fail(res, 502, "Could not load record");
      if (!cur.data.length) return fail(res, 404, "Record not found");
      if (cur.data[0].kind === "connectors") next = unmaskSecrets(data, cur.data[0].data);
      const r = await rest(base, { method: "PATCH", body: { data: next }, prefer: "return=representation" });
      if (!r.ok) return fail(res, 502, "Could not update record");
      if (cur.data[0].kind !== "connectors") await kickEmbed();
      return res.status(200).json({ ok: true, stored: true, record: view(r.data[0]) });
    }

    if (req.method === "DELETE") {
      const id = q.id;
      if (!id) return fail(res, 400, "Missing id");
      if (t.demo || String(id).startsWith("local-")) return res.status(200).json({ ok: true, stored: false });
      const r = await rest(`company_records?id=eq.${enc(id)}&email=eq.${enc(email)}`, { method: "DELETE", prefer: "return=minimal" });
      if (!r.ok) return fail(res, 502, "Could not delete record");
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return fail(res, 405, "Method not allowed");
  } catch (e) {
    console.error("[records]", e);
    return fail(res, 500, "Server error");
  }
}
