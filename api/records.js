// Vercel Serverless Function — operational admin records (CRM / POS / Finance / Marketing).
//
// GET    /api/records?email=..&kind=customers          → { records: [...] }
// POST   /api/records  { email, kind, data }            → insert, returns row
// PATCH  /api/records  { id, email, data }              → update row
// DELETE /api/records?id=..&email=..                    → delete row
//
// One Supabase table `company_records` holds every collection (kind = table key).
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Degrades gracefully if unset.

function supa() {
  return { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
}
function headers(key, extra) {
  return Object.assign({ "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` }, extra || {});
}

export default async function handler(req, res) {
  const { url: URL, key: KEY } = supa();
  const q = req.query || {};

  try {
    if (req.method === "GET") {
      const { email, kind } = q;
      if (!email || !kind) { res.status(400).json({ error: "Missing email or kind" }); return; }
      if (!URL || !KEY) { res.status(200).json({ records: [] }); return; }
      const url = `${URL}/rest/v1/company_records?email=eq.${encodeURIComponent(email)}&kind=eq.${encodeURIComponent(kind)}&order=created_at.desc&select=id,created_at,kind,data`;
      const r = await fetch(url, { headers: headers(KEY) });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ records: rows });
      return;
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    if (req.method === "POST") {
      const { email, kind, data = {} } = body;
      if (!email || !kind) { res.status(400).json({ error: "Missing email or kind" }); return; }
      if (!URL || !KEY) { res.status(200).json({ ok: true, stored: false, record: { id: `local-${Date.now()}`, created_at: new Date().toISOString(), kind, data } }); return; }
      const r = await fetch(`${URL}/rest/v1/company_records`, {
        method: "POST", headers: headers(KEY, { Prefer: "return=representation" }),
        body: JSON.stringify({ email, kind, data }),
      });
      if (!r.ok) { res.status(200).json({ ok: false, stored: false, storeError: await r.text() }); return; }
      const rows = await r.json();
      res.status(200).json({ ok: true, stored: true, record: Array.isArray(rows) ? rows[0] : rows });
      return;
    }

    if (req.method === "PATCH") {
      const { id, email, data = {} } = body;
      if (!id || !email) { res.status(400).json({ error: "Missing id or email" }); return; }
      if (!URL || !KEY) { res.status(200).json({ ok: true, stored: false }); return; }
      const url = `${URL}/rest/v1/company_records?id=eq.${encodeURIComponent(id)}&email=eq.${encodeURIComponent(email)}`;
      const r = await fetch(url, { method: "PATCH", headers: headers(KEY, { Prefer: "return=minimal" }), body: JSON.stringify({ data }) });
      res.status(200).json({ ok: r.ok, stored: r.ok });
      return;
    }

    if (req.method === "DELETE") {
      const { id, email } = q;
      if (!id || !email) { res.status(400).json({ error: "Missing id or email" }); return; }
      if (!URL || !KEY) { res.status(200).json({ ok: true, stored: false }); return; }
      const url = `${URL}/rest/v1/company_records?id=eq.${encodeURIComponent(id)}&email=eq.${encodeURIComponent(email)}`;
      const r = await fetch(url, { method: "DELETE", headers: headers(KEY, { Prefer: "return=minimal" }) });
      res.status(200).json({ ok: r.ok });
      return;
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
