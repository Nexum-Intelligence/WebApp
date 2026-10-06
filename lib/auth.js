// Server-side: verify the caller's Supabase access token and return their email.
// The serverless functions prefer this verified email over any client-provided
// email, which is what enforces tenant isolation once auth is enabled.
//
// Requests without a valid token (e.g. n8n server-to-server) return null, and
// the caller then falls back to the trusted, explicitly-provided email.

export async function authedEmail(req) {
  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const header = (req.headers && (req.headers.authorization || req.headers.Authorization)) || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !URL || !KEY) return null;
  try {
    const r = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    const u = await r.json();
    return (u && u.email) || null;
  } catch (e) {
    return null;
  }
}
