// Server-side tenant resolution for every /api function.
//
// Who may act for which tenant (email):
//   1. A signed-in user: the email from their verified Supabase access token.
//      Any email the client sends is ignored.
//   2. Server-to-server callers (automations, scripts) that send
//      `x-nexum-key: <NEXUM_INTERNAL_KEY>`: the explicitly provided email.
//   3. Demo mode (Supabase not configured on the server): the provided email —
//      nothing is stored in that mode, so nothing can leak.
// Everything else is rejected with 401.

import { timingSafeEqual } from "node:crypto";

export function supabaseConfig() {
  return { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
}

function header(req, name) {
  const h = (req && req.headers) || {};
  return h[name] || h[name.toLowerCase()] || h[name.replace(/(^|-)\w/g, (m) => m.toUpperCase())] || "";
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// Verify the caller's Supabase access token and return their email (or null).
export async function authedEmail(req) {
  const { url } = supabaseConfig();
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const auth = header(req, "authorization");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !url || !key) return null;
  // one retry on network errors, so a transient hiccup doesn't look like a logout
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
      if (!r.ok) return null;
      const u = await r.json();
      return (u && u.email && String(u.email).toLowerCase()) || null;
    } catch (e) {
      if (attempt === 1) return null;
    }
  }
  return null;
}

// → { email } on success, or { status, error } to send back.
export async function resolveTenant(req, claimedEmail) {
  const { url, key } = supabaseConfig();
  const claimed = claimedEmail ? String(claimedEmail).trim().toLowerCase() : "";

  if (!url || !key) {
    return claimed ? { email: claimed, demo: true } : { status: 400, error: "Missing email" };
  }

  const internal = process.env.NEXUM_INTERNAL_KEY;
  const given = header(req, "x-nexum-key");
  if (internal && given && safeEqual(given, internal)) {
    if (!claimed) return { status: 400, error: "Missing email" };
    return { email: claimed, internal: true, actor: `internal:${claimed}` };
  }

  const email = await authedEmail(req);
  if (email) return { email, actor: email };
  return { status: 401, error: "Please sign in again." };
}
