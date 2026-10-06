// Vercel Serverless Function — Stripe webhook → `subscriptions`.
//
// Stripe → Developers → Webhooks → endpoint https://<site>/api/stripe-webhook with events
//   checkout.session.completed, invoice.paid, customer.subscription.updated,
//   customer.subscription.deleted
// Env: STRIPE_WEBHOOK_SECRET (whsec_…), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createHmac, timingSafeEqual } from "node:crypto";
import { rest, enc } from "../lib/http.js";
import { packageByKeyStrict } from "../lib/plans.js";

// The signature covers the exact raw body. On Vercel req.body is parsed lazily, so the
// stream is read first and req.body is never touched there.
export const config = { api: { bodyParser: false } };

async function rawBody(req) {
  if (req && typeof req.on === "function" && req.readable) {
    const chunks = [];
    for await (const c of req) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
    return Buffer.concat(chunks).toString("utf8");
  }
  if (typeof req.rawBody === "string") return req.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  return typeof req.body === "string" ? req.body : "";
}

// Stripe-Signature: t=<ts>,v1=<hex>[,v1=…]; signed payload = `${t}.${body}`
export function verifyStripeSignature(payload, header, secret, toleranceSec = 300, now = Date.now()) {
  if (!header || !secret) return false;
  const parts = {};
  const v1 = [];
  for (const p of String(header).split(",")) {
    const [k, v] = p.split("=");
    if (k === "t") parts.t = v;
    if (k === "v1") v1.push(v);
  }
  if (!parts.t || !v1.length) return false;
  if (Math.abs(now / 1000 - Number(parts.t)) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${payload}`).digest("hex");
  return v1.some((sig) => sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected)));
}

async function upsert(row) {
  return rest("subscriptions?on_conflict=email", { method: "POST", body: { ...row, updated_at: new Date().toISOString() }, prefer: "resolution=merge-duplicates,return=minimal" });
}

export async function handleEvent(event) {
  const o = (event.data && event.data.object) || {};
  const meta = o.metadata || {};
  const toTs = (s) => (s ? new Date(s * 1000).toISOString() : null);

  if (event.type === "checkout.session.completed") {
    if (o.payment_status && o.payment_status !== "paid" && o.mode === "payment") return { ignored: "unpaid" };
    const email = String(meta.email || o.client_reference_id || o.customer_email || "").toLowerCase();
    const pkg = packageByKeyStrict(meta.package_key);
    if (!email || !pkg) return { ignored: "no email/package" };
    const yearly = o.mode === "subscription";
    // yearly: period end comes with invoice.paid; one-time purchase has no end
    const r = await upsert({ email, package_key: pkg.key, status: "active", interval: yearly ? "year" : "once",
      current_period_end: yearly ? new Date(Date.now() + 366 * 864e5).toISOString() : null,
      stripe_customer: o.customer || null, stripe_subscription: o.subscription || null });
    return { ok: r.ok, email };
  }

  if (event.type === "invoice.paid" && o.subscription) {
    const line = ((o.lines && o.lines.data) || [])[0] || {};
    const end = line.period && line.period.end;
    const r = await rest(`subscriptions?stripe_subscription=eq.${enc(o.subscription)}`, { method: "PATCH", body: { status: "active", current_period_end: toTs(end), updated_at: new Date().toISOString() }, prefer: "return=minimal" });
    return { ok: r.ok };
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const status = event.type === "customer.subscription.deleted" ? "canceled"
      : o.status === "active" || o.status === "trialing" ? "active" : o.status === "past_due" ? "past_due" : "canceled";
    const r = await rest(`subscriptions?stripe_subscription=eq.${enc(o.id)}`, { method: "PATCH", body: { status, current_period_end: toTs(o.current_period_end), updated_at: new Date().toISOString() }, prefer: "return=minimal" });
    return { ok: r.ok };
  }

  return { ignored: event.type };
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); res.status(405).json({ error: "Method not allowed" }); return; }
  const payload = await rawBody(req);
  const sig = req.headers && (req.headers["stripe-signature"] || req.headers["Stripe-Signature"]);
  if (!verifyStripeSignature(payload, sig, process.env.STRIPE_WEBHOOK_SECRET)) {
    res.status(400).json({ error: "Invalid signature" });
    return;
  }
  try {
    const out = await handleEvent(JSON.parse(payload));
    res.status(200).json({ received: true, ...out });
  } catch (e) {
    console.error("[stripe-webhook]", e);
    res.status(500).json({ error: "Webhook handling failed" });
  }
}
