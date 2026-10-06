// Small shared helpers for the /api functions: body parsing, PostgREST calls,
// error responses and the embedding kick.

import { supabaseConfig } from "./auth.js";

export function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; }
  }
  return req.body;
}

export function fail(res, status, error) {
  res.status(status).json({ ok: false, error });
}

// PostgREST request with the service role. Returns { ok, status, data }.
export async function rest(path, { method = "GET", body, prefer } = {}) {
  const { url, key } = supabaseConfig();
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(`${url}/rest/v1/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!r.ok) console.error(`[rest] ${method} ${path.split("?")[0]} → ${r.status}`, typeof data === "string" ? data.slice(0, 300) : data);
  return { ok: r.ok, status: r.status, data };
}

// Ask the `embed` Edge Function to process new knowledge right away. Best effort:
// pg_cron picks up anything missed within a minute.
export async function kickEmbed() {
  const { url, key } = supabaseConfig();
  if (!url || !key || process.env.NEXUM_EMBED_KICK === "0") return;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 1500);
  try {
    await fetch(`${url}/functions/v1/embed`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: "{}", signal: ctl.signal });
  } catch (e) {
    // ignored — cron fallback
  } finally {
    clearTimeout(t);
  }
}

export const enc = encodeURIComponent;
