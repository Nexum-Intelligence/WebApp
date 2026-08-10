// Vercel Serverless Function — receives a readiness-test lead,
// stores it in Supabase and emails it to the sales team (Resend).
//
// Configure these Environment Variables in Vercel (Project → Settings → Environment Variables):
//   SUPABASE_URL                e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   Supabase → Project Settings → API → service_role key (server-side only!)
//   RESEND_API_KEY              Resend → API Keys
//   SALES_EMAIL                 where leads should be emailed, e.g. vertrieb@nexumintelligence.com
//   LEAD_FROM_EMAIL             verified sender, e.g. "NEXUM Readiness <noreply@nexumintelligence.com>"
//
// Any channel whose env vars are missing is skipped gracefully, so the test
// always works even before the backend is fully configured.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { contact = {}, score = null, level = null, dimensions = null, answers = null, lang = null, source = "readiness-test" } = body;

    if (!contact.email || !contact.name) {
      res.status(400).json({ error: "Missing name or email" });
      return;
    }

    const record = {
      name: contact.name,
      email: contact.email,
      company: contact.company || null,
      phone: contact.phone || null,
      website: contact.website || null,
      industry: contact.industry || null,
      challenge: contact.challenge || null,
      consent: !!contact.consent,
      score,
      level,
      dimensions,
      answers,
      lang,
      source,
    };

    const out = { ok: true, stored: false, emailed: false };

    // 1) Store in Supabase (REST API, no SDK needed)
    const SUPA_URL = process.env.SUPABASE_URL;
    const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (SUPA_URL && SUPA_KEY) {
      try {
        const r = await fetch(`${SUPA_URL}/rest/v1/leads`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPA_KEY,
            Authorization: `Bearer ${SUPA_KEY}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify(record),
        });
        out.stored = r.ok;
        if (!r.ok) out.storeError = await r.text();
      } catch (e) {
        out.storeError = String(e);
      }
    }

    // 2) Email the lead to the sales team (Resend)
    const RESEND = process.env.RESEND_API_KEY;
    const SALES = process.env.SALES_EMAIL;
    const FROM = process.env.LEAD_FROM_EMAIL || "NEXUM Readiness <onboarding@resend.dev>";
    if (RESEND && SALES) {
      try {
        const dimLines = Array.isArray(dimensions)
          ? dimensions.map((d) => `${d.label}: ${d.pct}%`).join("<br>")
          : "";
        const esc = (s) => String(s == null ? "-" : s).replace(/</g, "&lt;");
        const html = `
          <h2>New Readiness Lead — ${esc(score)}% (${esc(level)})</h2>
          <p><b>${esc(record.name)}</b> · ${esc(record.company)}<br>
          ✉ ${esc(record.email)} &nbsp; ☎ ${esc(record.phone)}<br>
          🌐 ${esc(record.website)} &nbsp; · &nbsp; Branche: ${esc(record.industry)}</p>
          <p><b>Score:</b> ${esc(score)}% — ${esc(level)}</p>
          <p>${dimLines}</p>
          <p><b>Challenge / goal:</b><br>${esc(record.challenge)}</p>
          <hr><p style="color:#888;font-size:12px">lang: ${esc(lang)} · source: ${esc(source)}</p>`;
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND}` },
          body: JSON.stringify({
            from: FROM,
            to: [SALES],
            reply_to: record.email,
            subject: `🔥 Readiness Lead: ${record.company || record.name} — ${score}%`,
            html,
          }),
        });
        out.emailed = r.ok;
        if (!r.ok) out.emailError = await r.text();
      } catch (e) {
        out.emailError = String(e);
      }
    }

    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
