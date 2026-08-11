// Vercel Serverless Function — Platform module runs.
//
// POST  /api/module-run   → inserts a row into Supabase `module_runs`.
//                            That INSERT is the trigger line that starts the
//                            agentic workflow in n8n (Supabase DB webhook → n8n).
// GET   /api/module-run?email=you@company.com → lists that user's runs.
//
// Env vars (Vercel → Settings → Environment Variables):
//   SUPABASE_URL                https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   service_role key (server-side only!)
//
// If env vars are missing the endpoint degrades gracefully so the UI still works.

import { buildContext } from "../lib/context.js";

function supa() {
  return { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
}

export default async function handler(req, res) {
  const { url: SUPA_URL, key: SUPA_KEY } = supa();

  // ---- List a user's runs -------------------------------------------------
  if (req.method === "GET") {
    const email = (req.query && req.query.email) || "";
    if (!email) { res.status(400).json({ error: "Missing email" }); return; }
    if (!SUPA_URL || !SUPA_KEY) { res.status(200).json({ runs: [] }); return; }
    try {
      const q =
        `${SUPA_URL}/rest/v1/module_runs?email=eq.${encodeURIComponent(email)}` +
        `&order=created_at.desc&select=id,created_at,module_key,module_name,suite_key,package_key,status`;
      const r = await fetch(q, {
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
      });
      const runs = r.ok ? await r.json() : [];
      res.status(200).json({ runs });
    } catch (e) {
      res.status(200).json({ runs: [], error: String(e) });
    }
    return;
  }

  // ---- Edit a run's result (user adjusts the artifact) --------------------
  if (req.method === "PATCH") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const { id, email, result } = body;
      if (!id || !email) { res.status(400).json({ error: "Missing id or email" }); return; }
      if (!SUPA_URL || !SUPA_KEY) { res.status(200).json({ ok: true, stored: false }); return; }
      const r = await fetch(`${SUPA_URL}/rest/v1/module_runs?id=eq.${encodeURIComponent(id)}&email=eq.${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, Prefer: "return=minimal" },
        body: JSON.stringify({ result }),
      });
      res.status(200).json({ ok: r.ok });
    } catch (e) { res.status(500).json({ error: String(e) }); }
    return;
  }

  // ---- Start a module run (the n8n trigger line) --------------------------
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, PATCH");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const {
      email = null, name = null, company = null,
      packageKey = null, suiteKey = null,
      moduleKey = null, moduleName = null,
      inputs = {}, lang = null, source = "platform",
    } = body;

    if (!email || !moduleKey) {
      res.status(400).json({ error: "Missing email or moduleKey" });
      return;
    }

    const record = {
      email, name, company,
      package_key: packageKey,
      suite_key: suiteKey,
      module_key: moduleKey,
      module_name: moduleName,
      inputs,
      status: "queued",
      lang,
      source,
    };

    // Attach the tenant's live structured business context so the agent (n8n)
    // reasons over real data (finance, sales, inventory, CRM, …), not just inputs.
    try { const ctx = await buildContext(email); record.inputs = { ...(record.inputs || {}), _context: ctx.text }; } catch (e) {}

    if (!SUPA_URL || !SUPA_KEY) {
      // No backend configured yet — pretend-accept so the frontend flow works.
      res.status(200).json({ ok: true, stored: false, run: { ...record, id: `local-${Date.now()}`, created_at: new Date().toISOString() } });
      return;
    }

    const r = await fetch(`${SUPA_URL}/rest/v1/module_runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(record),
    });

    if (!r.ok) {
      const storeError = await r.text();
      res.status(200).json({ ok: false, stored: false, storeError });
      return;
    }

    const rows = await r.json();
    res.status(200).json({ ok: true, stored: true, run: Array.isArray(rows) ? rows[0] : rows });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
