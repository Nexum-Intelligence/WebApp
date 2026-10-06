// Vercel Serverless Function — bookings that touch several records at once.
// Each runs as one database transaction (see supabase/migrations/*_ops_billing.sql).
//
// POST /api/ops { action: "sale", productId, qty }  → { sale, lowStock }
// POST /api/ops { action: "receive", purchaseId }   → { purchase, inventory }

import { resolveTenant } from "../lib/auth.js";
import { setActor } from "../lib/actor.js";
import { readBody, fail, rest, kickEmbed } from "../lib/http.js";

const KNOWN = { "invalid quantity": 400, "product not found": 404, "purchase not found": 404, "already received": 409 };

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return fail(res, 405, "Method not allowed"); }
  const body = readBody(req);
  const t = await resolveTenant(req, body.email);
  if (!t.email) return fail(res, t.status, t.error);
  setActor(t.actor);
  if (t.demo) return fail(res, 409, "Bookings need a connected database.");

  let fn, args;
  if (body.action === "sale") {
    const qty = Number(body.qty);
    if (!body.productId || !(qty > 0)) return fail(res, 400, "Choose a product and a quantity");
    fn = "nexum_record_sale"; args = { p_email: t.email, p_product_id: body.productId, p_qty: qty };
  } else if (body.action === "receive") {
    if (!body.purchaseId) return fail(res, 400, "Missing purchaseId");
    fn = "nexum_receive_purchase"; args = { p_email: t.email, p_purchase_id: body.purchaseId };
  } else {
    return fail(res, 400, "Unknown action");
  }

  try {
    const r = await rest(`rpc/${fn}`, { method: "POST", body: args });
    if (!r.ok) {
      const msg = (r.data && r.data.message) || "";
      if (KNOWN[msg]) return fail(res, KNOWN[msg], msg.charAt(0).toUpperCase() + msg.slice(1));
      if (r.status === 400 && /uuid/i.test(msg)) return fail(res, 404, "Not found");
      return fail(res, 502, "Booking failed");
    }
    await kickEmbed();
    return res.status(200).json({ ok: true, ...r.data });
  } catch (e) {
    console.error("[ops]", e);
    return fail(res, 500, "Server error");
  }
}
