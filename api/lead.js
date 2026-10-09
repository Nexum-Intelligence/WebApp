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

const DAYS = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday" };
const SLOTS = ["08:00–10:00", "10:00–12:00", "12:00–14:00", "14:00–16:00", "16:00–18:00"];
const clip = (v, n) => (v == null || v === "" ? null : String(v).slice(0, n));

// Call request from the contact form: only known days/slots, sorted, deduplicated.
export function normalizeAvailability(a) {
  if (!a || typeof a !== "object") return null;
  const days = Object.keys(DAYS).filter((d) => Array.isArray(a.days) && a.days.includes(d));
  const slots = SLOTS.filter((s) => Array.isArray(a.slots) && a.slots.includes(s));
  const timezone = /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(String(a.timezone || "")) ? String(a.timezone).slice(0, 64) : null;
  return { days, slots, timezone };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { contact = {}, score = null, level = null, dimensions = null, answers = null, lang = null, source = "readiness-test", request = {}, availability = null } = body;
    const slotsWanted = source === "contact" ? normalizeAvailability(availability) : null;

    if (!contact.email || !contact.name) {
      res.status(400).json({ error: "Missing name or email" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(contact.email))) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }
    if (source === "contact" && (!slotsWanted.days.length || !slotsWanted.slots.length)) {
      res.status(400).json({ error: "Choose at least one day and one time slot" });
      return;
    }

    const record = {
      name: clip(contact.name, 120),
      email: clip(contact.email, 200),
      company: clip(contact.company, 160),
      phone: clip(contact.phone, 40),
      website: clip(contact.website, 200),
      industry: clip(contact.industry, 120),
      challenge: clip(contact.challenge, 4000),
      consent: !!contact.consent,
      score,
      level,
      dimensions,
      answers,
      lang: clip(lang, 8),
      source: clip(source, 40),
      ...(slotsWanted ? {
        topic: clip(request.topic, 120),
        budget: clip(request.budget, 60),
        preferred_days: slotsWanted.days,
        preferred_slots: slotsWanted.slots,
        timezone: slotsWanted.timezone,
      } : {}),
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
        const esc = (s) => String(s == null ? "-" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        const html = slotsWanted ? `
          <h2>New call request — ${esc(record.topic)}</h2>
          <p><b>${esc(record.name)}</b> · ${esc(record.company)}<br>
          ✉ ${esc(record.email)} &nbsp; ☎ ${esc(record.phone)}</p>
          <p><b>Preferred days:</b> ${slotsWanted.days.map((d) => DAYS[d]).join(", ")}<br>
          <b>Preferred times:</b> ${slotsWanted.slots.join(", ")} (${esc(slotsWanted.timezone || "timezone unknown")})</p>
          <p><b>Budget:</b> ${esc(record.budget)}</p>
          <p><b>Project details:</b><br>${esc(record.challenge)}</p>
          <hr><p style="color:#888;font-size:12px">lang: ${esc(lang)} · source: contact</p>` : `
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
            subject: slotsWanted ? `📞 Call request: ${record.company || record.name}` : `🔥 Readiness Lead: ${record.company || record.name} — ${score}%`,
            html,
          }),
        });
        out.emailed = r.ok;
        if (!r.ok) out.emailError = await r.text();
      } catch (e) {
        out.emailError = String(e);
      }
    }

    // A configured channel that failed everywhere must not look like success.
    const tried = (SUPA_URL && SUPA_KEY) || (RESEND && SALES);
    if (tried && !out.stored && !out.emailed) {
      console.error("[lead] not delivered", out.storeError, out.emailError);
      res.status(502).json({ ok: false, error: "Request could not be delivered" });
      return;
    }
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
