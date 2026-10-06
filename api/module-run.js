// Vercel Serverless Function — platform module runs (the agent job queue).
//
// POST  /api/module-run { moduleKey, moduleName, suiteKey, packageKey, inputs, lang }
//         → inserts a `module_runs` row (status queued) with a snapshot of the
//           tenant's business context. The Claude automation picks it up via
//           nexum_claim_next() (see supabase/migrations, claude-desktop/).
// GET   /api/module-run            → { runs } (latest 100)
// PATCH /api/module-run { id, answers }  → answers the agent's questions, re-queues
// PATCH /api/module-run { id, result }   → saves the owner's edit of a finished result

import { buildContext } from "../lib/context.js";
import { resolveTenant } from "../lib/auth.js";
import { readBody, fail, rest, kickEmbed, enc } from "../lib/http.js";

const COLS = "id,created_at,updated_at,module_key,module_name,suite_key,package_key,status,result,summary,questions,error,started_at,finished_at";

export default async function handler(req, res) {
  const body = req.method === "GET" ? {} : readBody(req);
  const t = await resolveTenant(req, (req.query && req.query.email) || body.email);
  if (!t.email) return fail(res, t.status, t.error);
  const email = t.email;

  try {
    if (req.method === "GET") {
      if (t.demo) return res.status(200).json({ runs: [] });
      const r = await rest(`module_runs?email=eq.${enc(email)}&order=created_at.desc&limit=100&select=${COLS}`);
      if (!r.ok) return fail(res, 502, "Could not load runs");
      return res.status(200).json({ runs: r.data });
    }

    if (req.method === "PATCH") {
      const { id, result, answers } = body;
      if (!id) return fail(res, 400, "Missing id");
      if (t.demo || String(id).startsWith("local-")) return res.status(200).json({ ok: true, stored: false });
      const base = `module_runs?id=eq.${enc(id)}&email=eq.${enc(email)}`;

      if (answers) {
        if (typeof answers !== "object" || Array.isArray(answers)) return fail(res, 400, "answers must be an object");
        const cur = await rest(`${base}&select=inputs,status`);
        if (!cur.ok) return fail(res, 502, "Could not load run");
        if (!cur.data.length) return fail(res, 404, "Run not found");
        if (cur.data[0].status !== "needs_input") return fail(res, 409, "This run is not waiting for answers");
        const inputs = { ...(cur.data[0].inputs || {}), answers };
        // status filter makes the transition atomic
        const r = await rest(`${base}&status=eq.needs_input`, { method: "PATCH", body: { inputs, status: "queued", started_at: null, attempts: 0 }, prefer: `return=representation` });
        if (!r.ok) return fail(res, 502, "Could not save answers");
        if (!r.data.length) return fail(res, 409, "This run is not waiting for answers");
        return res.status(200).json({ ok: true, run: pick(r.data[0]) });
      }

      if (typeof result !== "string") return fail(res, 400, "Missing result");
      const r = await rest(`${base}&status=eq.done`, { method: "PATCH", body: { result: { markdown: result, format: "md", edited: true } }, prefer: "return=representation" });
      if (!r.ok) return fail(res, 502, "Could not save result");
      if (!r.data.length) return fail(res, 409, "Only finished results can be edited");
      await kickEmbed();
      return res.status(200).json({ ok: true, run: pick(r.data[0]) });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST, PATCH");
      return fail(res, 405, "Method not allowed");
    }

    const {
      name = null, company = null, packageKey = null, suiteKey = null,
      moduleKey = null, moduleName = null, inputs = {}, lang = null, source = "platform", industry = null,
    } = body;
    if (!moduleKey || !/^[a-z0-9-]{2,60}$/.test(moduleKey)) return fail(res, 400, "Missing or invalid moduleKey");
    if (!inputs || typeof inputs !== "object" || Array.isArray(inputs)) return fail(res, 400, "inputs must be an object");

    // the profile is read server-side from company_profiles; never trust a client copy
    const { _company, _context, answers, ...cleanInputs } = inputs;
    const record = {
      email, name, company, package_key: packageKey, suite_key: suiteKey,
      module_key: moduleKey, module_name: moduleName, inputs: cleanInputs,
      status: "queued", lang, source,
    };

    if (t.demo) {
      return res.status(200).json({ ok: true, stored: false, run: { ...record, id: `local-${Date.now()}`, created_at: new Date().toISOString() } });
    }

    // Snapshot of live KPIs so the agent reasons over real numbers.
    try {
      const ctx = await buildContext(email);
      // industry chosen at sign-up, until the profile says otherwise
      const ind = typeof industry === "string" ? industry.slice(0, 40) : "";
      if (ind && !ctx.data.company.industry) {
        ctx.data.company.industry = ind;
        ctx.text = `INDUSTRY (from sign-up): ${ind}
${ctx.text}`;
      }
      record.context = { text: ctx.text, data: ctx.data };
    } catch (e) {
      console.error("[module-run] context", e);
    }

    const r = await rest("module_runs", { method: "POST", body: record, prefer: "return=representation" });
    if (!r.ok) return fail(res, 502, "Could not start the module");
    await kickEmbed();
    return res.status(200).json({ ok: true, stored: true, run: pick(r.data[0]) });
  } catch (e) {
    console.error("[module-run]", e);
    return fail(res, 500, "Server error");
  }
}

function pick(row) {
  const out = {};
  for (const k of COLS.split(",")) out[k] = row[k] === undefined ? null : row[k];
  return out;
}
