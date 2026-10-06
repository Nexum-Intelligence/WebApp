// Vercel Serverless Function — plan & checkout.
//
// GET   /api/billing                              → current plan { package_key, status, suites, billing }
// POST  /api/billing { packageKey, interval }     → { url } Stripe Checkout (interval: once | year)
// PATCH /api/billing { email, packageKey, status, periodEnd }  (x-nexum-key only)
//        → owner sets a plan manually (offline invoice, trial, comp)
//
// Env: STRIPE_SECRET_KEY (enables billing), PUBLIC_SITE_URL (redirects, default request origin).

import { resolveTenant } from "../lib/auth.js";
import { setActor } from "../lib/actor.js";
import { readBody, fail, rest } from "../lib/http.js";
import { planFor, billingEnabled, packageByKeyStrict, priceCents } from "../lib/plans.js";

function form(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v && typeof v === "object") form(v, key, out);
    else if (v !== undefined && v !== null) out.append(key, String(v));
  }
  return out;
}

export function checkoutParams({ email, pkg, interval, site }) {
  const amount = priceCents(interval === "year" ? pkg.priceYear : pkg.priceOnce);
  const price = { currency: "eur", unit_amount: amount, product_data: { name: `NEXUM ${pkg.name}${interval === "year" ? " (yearly)" : ""}` } };
  if (interval === "year") price.recurring = { interval: "year" };
  const meta = { email, package_key: pkg.key, interval };
  return {
    mode: interval === "year" ? "subscription" : "payment",
    customer_email: email,
    client_reference_id: email,
    success_url: `${site}/platform?checkout=success`,
    cancel_url: `${site}/platform?checkout=cancel`,
    allow_promotion_codes: "true",
    line_items: { 0: { quantity: 1, price_data: price } },
    metadata: meta,
    ...(interval === "year" ? { subscription_data: { metadata: meta } } : { payment_intent_data: { metadata: meta } }),
  };
}

export default async function handler(req, res) {
  const body = req.method === "GET" ? {} : readBody(req);
  const t = await resolveTenant(req, (req.query && req.query.email) || body.email);
  if (!t.email) return fail(res, t.status, t.error);
  setActor(t.actor);

  try {
    if (req.method === "GET") {
      if (t.demo) return res.status(200).json({ package_key: "enterprise-plus", status: "beta", billing: false });
      return res.status(200).json(await planFor(t.email));
    }

    if (req.method === "PATCH") {
      if (!t.internal) return fail(res, 403, "Only the owner can set plans manually");
      const pkg = packageByKeyStrict(body.packageKey);
      if (!pkg) return fail(res, 400, "Unknown package");
      const row = { email: t.email, package_key: pkg.key, status: body.status || "active", interval: "manual", current_period_end: body.periodEnd || null, updated_at: new Date().toISOString() };
      const r = await rest("subscriptions?on_conflict=email", { method: "POST", body: row, prefer: "resolution=merge-duplicates,return=minimal" });
      if (!r.ok) return fail(res, 502, "Could not save plan");
      return res.status(200).json({ ok: true });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST, PATCH");
      return fail(res, 405, "Method not allowed");
    }

    if (!billingEnabled()) return fail(res, 409, "Billing is not enabled yet — all modules are unlocked during the beta.");
    const pkg = packageByKeyStrict(body.packageKey);
    const interval = body.interval === "year" ? "year" : "once";
    if (!pkg) return fail(res, 400, "Unknown package");
    const site = process.env.PUBLIC_SITE_URL || `https://${(req.headers && req.headers.host) || "www.nexum-intelligence.com"}`;

    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form(checkoutParams({ email: t.email, pkg, interval, site })).toString(),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.url) {
      console.error("[billing] stripe", r.status, d && d.error);
      return fail(res, 502, "Checkout could not be started");
    }
    return res.status(200).json({ ok: true, url: d.url });
  } catch (e) {
    console.error("[billing]", e);
    return fail(res, 500, "Server error");
  }
}
