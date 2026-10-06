// End-to-end: atomic bookings, plans + Stripe webhook, bulk import, connector sync, audit.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { startStack, call, sql, SERVICE_KEY } from "./harness.mjs";

let stack, records, ops, moduleRun, billing, webhook, sync, audit;
const realFetch = globalThis.fetch;

before(async () => {
  stack = await startStack(54332);
  Object.assign(process.env, {
    SUPABASE_URL: stack.url, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY, SUPABASE_ANON_KEY: "anon",
    NEXUM_INTERNAL_KEY: "internal-test-key", STRIPE_WEBHOOK_SECRET: "whsec_test",
  });
  delete process.env.STRIPE_SECRET_KEY;
  sql("truncate company_profiles, company_records, module_runs, agent_messages, knowledge_chunks, subscriptions, audit_log");
  records = (await import("../../api/records.js")).default;
  ops = (await import("../../api/ops.js")).default;
  moduleRun = (await import("../../api/module-run.js")).default;
  billing = (await import("../../api/billing.js")).default;
  webhook = (await import("../../api/stripe-webhook.js")).default;
  sync = (await import("../../api/connector-sync.js")).default;
  audit = (await import("../../api/audit.js")).default;
});
after(async () => { globalThis.fetch = realFetch; await stack.stop(); });

const post = (h, body, token = "tok-a") => call(h, { method: "POST", token, body });

test("POS sale and goods receipt are atomic and tenant-scoped", async () => {
  const inv = await post(records, { kind: "inventory", data: { name: "Bohnen", unitCost: 0.02, stock: 100, reorder: 60 } });
  const prod = await post(records, { kind: "products", data: { name: "Espresso", price: 2.5, recipe: [{ itemId: inv.body.record.id, qty: 9 }] } });
  const sale = await post(ops, { action: "sale", productId: prod.body.record.id, qty: 5 });
  assert.equal(sale.statusCode, 200);
  assert.equal(sale.body.sale.data.revenue, 12.5);
  assert.equal(sale.body.lowStock[0].name, "Bohnen");
  assert.equal(sql(`select data->>'stock' from company_records where id = '${inv.body.record.id}'`), "55");
  assert.equal(sql("select count(*) from company_records where kind = 'transactions' and data->>'category' = 'Sales'"), "1");

  const foreign = await post(ops, { action: "sale", productId: prod.body.record.id, qty: 1 }, "tok-b");
  assert.equal(foreign.statusCode, 404, "other tenant cannot sell my product");
  assert.equal((await post(ops, { action: "sale", productId: prod.body.record.id, qty: 0 })).statusCode, 400);

  const po = await post(records, { kind: "purchases", data: { itemId: inv.body.record.id, itemName: "Bohnen", qty: 1000, unitCost: 0.03, status: "Ordered" } });
  const rec = await post(ops, { action: "receive", purchaseId: po.body.record.id });
  assert.equal(rec.statusCode, 200);
  assert.equal(rec.body.inventory.data.stock, 1055);
  assert.equal((await post(ops, { action: "receive", purchaseId: po.body.record.id })).statusCode, 409, "only once");
});

test("audit log records the signed-in user as actor", async () => {
  const r = await call(audit, { token: "tok-a" });
  assert.equal(r.statusCode, 200);
  assert.ok(r.body.entries.length > 0);
  assert.ok(r.body.entries.some((e) => e.actor === "a@x.de" && e.kind === "inventory" && e.op === "update"), "stock change by a@x.de");
  assert.equal((await call(audit, { token: "tok-b" })).body.entries.length, 0);
});

test("bulk import", async () => {
  const r = await post(records, { kind: "customers", items: [{ name: "A" }, { name: "B" }, { name: "C" }] });
  assert.equal(r.body.count, 3);
  assert.equal(sql("select count(*) from company_records where kind = 'customers' and email = 'a@x.de'"), "3");
  assert.equal((await post(records, { kind: "connectors", items: [{}] })).statusCode, 400, "no bulk connectors");
  assert.equal((await post(records, { kind: "customers", items: Array(1001).fill({ name: "x" }) })).statusCode, 400);
});

test("plans: beta unlocks everything; with billing, no plan → 402 until the webhook activates one", async () => {
  assert.equal((await call(billing, { token: "tok-a" })).body.status, "beta");

  process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
  try {
    let plan = await call(billing, { token: "tok-a" });
    assert.equal(plan.body.package_key, "none");
    assert.equal((await post(moduleRun, { moduleKey: "go-to-market", moduleName: "GTM" })).statusCode, 402);
    assert.equal((await post(moduleRun, { moduleKey: "daily-tasks", moduleName: "Daily" })).statusCode, 200, "daily tasks always allowed");

    // forged webhook is rejected
    const body = JSON.stringify({ type: "checkout.session.completed", data: { object: { mode: "payment", payment_status: "paid", metadata: { email: "a@x.de", package_key: "venture-pro", interval: "once" } } } });
    const bad = await call(webhook, { method: "POST", body });
    assert.equal(bad.statusCode, 400);

    const t = Math.floor(Date.now() / 1000);
    const sig = createHmac("sha256", "whsec_test").update(`${t}.${body}`).digest("hex");
    const res = { statusCode: 200, body: null, headers: {}, status(c) { this.statusCode = c; return this; }, json(o) { this.body = o; return this; }, setHeader() {} };
    await webhook({ method: "POST", headers: { "stripe-signature": `t=${t},v1=${sig}` }, body }, res);
    assert.equal(res.statusCode, 200);

    plan = await call(billing, { token: "tok-a" });
    assert.equal(plan.body.package_key, "venture-pro");
    assert.equal((await post(moduleRun, { moduleKey: "go-to-market", moduleName: "GTM" })).statusCode, 200, "venture suite unlocked");
    assert.equal((await post(moduleRun, { moduleKey: "brand-marketing", moduleName: "Brand" })).statusCode, 402, "growth suite still locked");

    // users cannot set their own plan; the owner can via internal key
    assert.equal((await call(billing, { method: "PATCH", token: "tok-b", body: { packageKey: "enterprise-plus" } })).statusCode, 403);
    const own = await call(billing, { method: "PATCH", internalKey: "internal-test-key", body: { email: "b@y.de", packageKey: "growth" } });
    assert.equal(own.statusCode, 200);
    assert.equal((await call(billing, { token: "tok-b" })).body.package_key, "growth");
  } finally {
    delete process.env.STRIPE_SECRET_KEY;
  }
});

test("Stripe sync imports paid charges once", async () => {
  await post(records, { kind: "connectors", data: { connectorKey: "stripe", name: "Stripe", config: { apiKey: "sk_test_abc" }, connected: true } });
  const charges = { has_more: false, data: [
    { id: "ch_1", paid: true, status: "succeeded", amount: 4990, amount_refunded: 0, currency: "eur", created: 1790000000, description: "Abo" },
    { id: "ch_2", paid: true, status: "succeeded", amount: 1000, amount_refunded: 1000, currency: "eur", created: 1790000100 },
    { id: "ch_3", paid: false, status: "failed", amount: 500, currency: "eur", created: 1790000200 },
  ] };
  let seenKey = null;
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith("https://api.stripe.com/")) {
      seenKey = init.headers.Authorization;
      return new Response(JSON.stringify(charges), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return realFetch(url, init);
  };
  try {
    const r1 = await post(sync, { connector: "stripe" });
    assert.equal(r1.statusCode, 200);
    assert.equal(r1.body.imported, 1, "only the paid, not refunded charge");
    assert.equal(seenKey, "Bearer sk_test_abc", "server used the stored key");
    const r2 = await post(sync, { connector: "stripe" });
    assert.equal(r2.body.imported, 0);
    assert.equal(r2.body.skipped, 1);
    assert.equal(sql("select data->>'amount' from company_records where data->>'externalId' = 'ch_1'"), "49.9");
    assert.equal((await post(sync, { connector: "stripe" }, "tok-b")).statusCode, 404, "b has no stripe connector");
  } finally {
    globalThis.fetch = realFetch;
  }
});
