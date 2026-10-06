// Vercel Serverless Function — pull data from a connected source.
//
// POST /api/connector-sync { connector: "stripe" }   → imports paid charges as income
// POST /api/connector-sync { connector: "hubspot" }  → imports contacts as customers
// POST /api/connector-sync { connector: "gsheets", sheetUrl? } → { headers, rows } for the
//        import dialog (the browser maps columns and imports via /api/records bulk)
//
// Credentials are read server-side from the tenant's `connectors` record and never
// returned. Imported rows carry `externalId`, so repeated syncs don't duplicate.

import { resolveTenant } from "../lib/auth.js";
import { setActor } from "../lib/actor.js";
import { readBody, fail, rest, kickEmbed, enc } from "../lib/http.js";
import { parseCsv } from "../src/csv.js";

const MAX_PAGES = 10; // 1000 objects per sync

async function connectorConfig(email, key) {
  const r = await rest(`company_records?email=eq.${enc(email)}&kind=eq.connectors&select=id,data`);
  if (!r.ok) return null;
  const row = r.data.find((x) => (x.data || {}).connectorKey === key);
  return row ? { id: row.id, data: row.data, config: (row.data && row.data.config) || {} } : null;
}

async function existingIds(email, kind, source) {
  const r = await rest(`company_records?email=eq.${enc(email)}&kind=eq.${kind}&data->>source=eq.${source}&select=data->>externalId&limit=50000`);
  return new Set(r.ok ? r.data.map((x) => x.externalId) : []);
}

export function sheetCsvUrl(url) {
  let u;
  try { u = new URL(url); } catch (e) { return null; }
  if (u.protocol !== "https:" || u.hostname !== "docs.google.com") return null;
  const m = u.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
  if (!m) return null;
  const gid = u.searchParams.get("gid") || (u.hash.match(/gid=(\d+)/) || [])[1] || "0";
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${encodeURIComponent(gid)}`;
}

export async function fetchStripeCharges(key, since) {
  const out = [];
  let after = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const qs = new URLSearchParams({ limit: "100" });
    if (since) qs.set("created[gt]", String(since));
    if (after) qs.set("starting_after", after);
    const r = await fetch(`https://api.stripe.com/v1/charges?${qs}`, { headers: { Authorization: `Bearer ${key}` } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error((d.error && d.error.message) || `Stripe ${r.status}`), { status: r.status });
    for (const c of d.data || []) {
      if (!c.paid || c.status !== "succeeded") continue;
      const net = (c.amount - (c.amount_refunded || 0)) / 100;
      if (net <= 0) continue;
      out.push({
        type: "Income", category: "Stripe", amount: net, currency: String(c.currency || "eur").toUpperCase(),
        date: new Date(c.created * 1000).toISOString().slice(0, 10),
        description: c.description || (c.billing_details && c.billing_details.name) || "Stripe payment",
        customerEmail: (c.billing_details && c.billing_details.email) || c.receipt_email || undefined,
        externalId: c.id, source: "stripe",
      });
    }
    if (!d.has_more || !(d.data || []).length) break;
    after = d.data[d.data.length - 1].id;
  }
  return out;
}

export async function fetchHubspotContacts(token) {
  const out = [];
  let after = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const qs = new URLSearchParams({ limit: "100", properties: "firstname,lastname,email,company,phone,lifecyclestage" });
    if (after) qs.set("after", after);
    const r = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.message || `HubSpot ${r.status}`), { status: r.status });
    for (const c of d.results || []) {
      const p = c.properties || {};
      const name = [p.firstname, p.lastname].filter(Boolean).join(" ") || p.email || p.company;
      if (!name) continue;
      const stage = p.lifecyclestage === "customer" ? "Customer" : p.lifecyclestage === "opportunity" ? "Opportunity" : "Lead";
      out.push({ name, email: p.email || undefined, company: p.company || undefined, phone: p.phone || undefined, stage, externalId: c.id, source: "hubspot" });
    }
    after = d.paging && d.paging.next && d.paging.next.after;
    if (!after) break;
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return fail(res, 405, "Method not allowed"); }
  const body = readBody(req);
  const t = await resolveTenant(req, body.email);
  if (!t.email) return fail(res, t.status, t.error);
  setActor(t.actor);
  if (t.demo) return fail(res, 409, "Syncing needs a connected database.");
  const email = t.email;

  try {
    const conn = await connectorConfig(email, body.connector);

    if (body.connector === "gsheets") {
      const csvUrl = sheetCsvUrl(body.sheetUrl || (conn && conn.config.sheetUrl));
      if (!csvUrl) return fail(res, 400, "Use a Google Sheets link (docs.google.com/spreadsheets/d/…), shared as “anyone with the link”.");
      const r = await fetch(csvUrl, { redirect: "follow" });
      const text = await r.text();
      if (!r.ok || /^\s*<(!doctype|html)/i.test(text)) return fail(res, 400, "The sheet isn't readable — share it as “anyone with the link can view”.");
      if (text.length > 5_000_000) return fail(res, 400, "Sheet too large (max 5 MB)");
      const parsed = parseCsv(text);
      return res.status(200).json({ ok: true, headers: parsed.headers, rows: parsed.rows.slice(0, 1000), total: parsed.rows.length });
    }

    if (!conn) return fail(res, 404, "Connect this source first.");
    const secret = conn.config.apiKey;
    if (!secret) return fail(res, 400, "The connector has no key yet.");

    let kind, items;
    if (body.connector === "stripe") {
      const since = conn.data.lastSyncUnix || null;
      kind = "transactions"; items = await fetchStripeCharges(secret, since);
    } else if (body.connector === "hubspot") {
      kind = "customers"; items = await fetchHubspotContacts(secret);
    } else {
      return fail(res, 400, "This connector has no automatic sync yet — use the CSV import.");
    }

    const seen = await existingIds(email, kind, body.connector);
    const fresh = items.filter((x) => !seen.has(x.externalId));
    if (fresh.length) {
      const ins = await rest("company_records", { method: "POST", body: fresh.map((data) => ({ email, kind, data })), prefer: "return=minimal" });
      if (!ins.ok) return fail(res, 502, "Import failed");
    }
    const stamp = { ...conn.data, lastSync: new Date().toISOString(), lastSyncUnix: Math.floor(Date.now() / 1000), lastSyncCount: fresh.length };
    await rest(`company_records?id=eq.${enc(conn.id)}`, { method: "PATCH", body: { data: stamp }, prefer: "return=minimal" });
    if (fresh.length) await kickEmbed();
    return res.status(200).json({ ok: true, imported: fresh.length, skipped: items.length - fresh.length, kind });
  } catch (e) {
    if (e && (e.status === 401 || e.status === 403)) return fail(res, 400, "The source rejected the key — please check it.");
    console.error("[connector-sync]", e);
    return fail(res, 502, "Sync failed — please try again later.");
  }
}
