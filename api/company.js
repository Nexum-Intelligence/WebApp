// Vercel Serverless Function — Company profile store.
//
// GET  /api/company?email=you@company.com → { data: {...sections} }
// POST /api/company  { email, name, company, data } → upserts the profile.
//
// The company profile is the shared business context every module/agent reads.
// Stored in Supabase table `company_profiles` (one row per email).
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (same project as the rest).
// Degrades gracefully when unset so the frontend still works.

export default async function handler(req, res) {
  const SUPA_URL = process.env.SUPABASE_URL;
  const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (req.method === "GET") {
    const email = (req.query && req.query.email) || "";
    if (!email) { res.status(400).json({ error: "Missing email" }); return; }
    if (!SUPA_URL || !SUPA_KEY) { res.status(200).json({ data: {} }); return; }
    try {
      const q = `${SUPA_URL}/rest/v1/company_profiles?email=eq.${encodeURIComponent(email)}&select=data&limit=1`;
      const r = await fetch(q, { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ data: (rows[0] && rows[0].data) || {} });
    } catch (e) {
      res.status(200).json({ data: {}, error: String(e) });
    }
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { email = null, name = null, company = null, data = {} } = body;
    if (!email) { res.status(400).json({ error: "Missing email" }); return; }

    if (!SUPA_URL || !SUPA_KEY) { res.status(200).json({ ok: true, stored: false }); return; }

    // Upsert on the unique `email` column (on_conflict=email).
    const r = await fetch(`${SUPA_URL}/rest/v1/company_profiles?on_conflict=email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ email, name, company, data, updated_at: new Date().toISOString() }),
    });

    if (!r.ok) { res.status(200).json({ ok: false, stored: false, storeError: await r.text() }); return; }
    res.status(200).json({ ok: true, stored: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
