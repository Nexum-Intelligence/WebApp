import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resolveTenant } from "../../lib/auth.js";
import { maskSecrets, unmaskSecrets } from "../../api/records.js";
import { flattenProfile } from "../../lib/context.js";
import { runQuery } from "../../supabase/functions/embed/core.js";

const req = (headers = {}) => ({ headers });

beforeEach(() => {
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY; delete process.env.NEXUM_INTERNAL_KEY;
});

test("demo mode (no Supabase on the server) uses the claimed email", async () => {
  assert.deepEqual(await resolveTenant(req(), "Owner@Cafe.de"), { email: "owner@cafe.de", demo: true });
  assert.equal((await resolveTenant(req(), "")).status, 400);
});

test("configured: no token → 401 even with a claimed email", async () => {
  process.env.SUPABASE_URL = "http://127.0.0.1:9"; process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
  const r = await resolveTenant(req(), "victim@x.de");
  assert.equal(r.status, 401);
  assert.equal(r.email, undefined);
});

test("internal key allows server-to-server calls, wrong key does not", async () => {
  process.env.SUPABASE_URL = "http://127.0.0.1:9"; process.env.SUPABASE_SERVICE_ROLE_KEY = "svc"; process.env.NEXUM_INTERNAL_KEY = "k-123";
  assert.deepEqual(await resolveTenant(req({ "x-nexum-key": "k-123" }), "a@x.de"), { email: "a@x.de", internal: true, actor: "internal:a@x.de" });
  assert.equal((await resolveTenant(req({ "x-nexum-key": "k-124" }), "a@x.de")).status, 401);
  assert.equal((await resolveTenant(req({ "x-nexum-key": "k" }), "a@x.de")).status, 401);
});

test("an unset internal key never matches an empty header", async () => {
  process.env.SUPABASE_URL = "http://127.0.0.1:9"; process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
  assert.equal((await resolveTenant(req({ "x-nexum-key": "" }), "a@x.de")).status, 401);
});

test("connector secrets: mask and restore", () => {
  const stored = { key: "stripe", config: { apiKey: "sk_live_abcdef1234", accessToken: "tok_9999", account: "acct_1" } };
  const masked = maskSecrets(stored);
  assert.equal(masked.config.apiKey, "••••1234");
  assert.equal(masked.config.accessToken, "••••9999");
  assert.equal(masked.config.account, "acct_1");
  const back = unmaskSecrets({ ...masked, config: { ...masked.config, account: "acct_2" } }, stored);
  assert.equal(back.config.apiKey, "sk_live_abcdef1234");
  assert.equal(back.config.account, "acct_2");
  assert.equal(unmaskSecrets({ apiKey: "sk_new" }, stored.config).apiKey, "sk_new", "new key replaces old");
});

test("profile flattening tolerates flat fields", () => {
  assert.deepEqual(flattenProfile({ basics: { companyName: "A" }, website: "a.de" }), { companyName: "A", website: "a.de" });
  assert.deepEqual(flattenProfile(null), {});
});

test("retrieval query ignores internal inputs", () => {
  const q = runQuery({ module_name: "SWOT", inputs: { market: "Hamburg", _context: "x", answers: { a: 1 }, empty: "" } });
  assert.equal(q, "SWOT\nmarket: Hamburg");
});

test("monthly series groups by month and excludes stock purchases", async () => {
  const { monthlySeries } = await import("../../lib/context.js");
  const now = new Date(Date.UTC(2026, 9, 15));
  const s = monthlySeries([
    { kind: "transactions", data: { type: "Income", amount: 100, date: "2026-10-02" } },
    { kind: "transactions", data: { type: "Expense", amount: 30, category: "Rent", date: "2026-10-03" } },
    { kind: "transactions", data: { type: "Expense", amount: 500, category: "Purchasing", date: "2026-10-03" } },
    { kind: "sales", data: { cost: 20 }, created_at: "2026-10-04T10:00:00Z" },
    { kind: "transactions", data: { type: "Income", amount: 50, date: "2026-09-30" } },
    { kind: "transactions", data: { type: "Income", amount: 999, date: "2025-01-01" } },
  ], now);
  assert.equal(s.length, 12);
  assert.deepEqual(s.at(-1), { month: "2026-10", revenue: 100, expenses: 30, costOfGoods: 20, profit: 50 });
  assert.equal(s.at(-2).revenue, 50);
  assert.equal(s[0].month, "2025-11");
});

test("csv: delimiters, quotes, German numbers, header mapping", async () => {
  const { parseCsv, mapHeaders, rowsToRecords, toNumber } = await import("../../src/csv.js");
  const p = parseCsv('\uFEFFName;Preis;"Notiz"\r\n"Flat White";"4,20";"mit ""Hafer"""\r\nKuchen;3;\r\n\r\n');
  assert.equal(p.delimiter, ";");
  assert.deepEqual(p.headers, ["Name", "Preis", "Notiz"]);
  assert.equal(p.rows[0].Notiz, 'mit "Hafer"');
  const fields = [{ key: "name", label: "Name" }, { key: "price", label: "Price", type: "number" }];
  const map = mapHeaders(p.headers, fields, { price: ["Preis"] });
  assert.deepEqual(map, { name: "Name", price: "Preis" });
  assert.deepEqual(rowsToRecords(p.rows, fields, map), [{ name: "Flat White", price: 4.2 }, { name: "Kuchen", price: 3 }]);
  assert.equal(toNumber("1.234,50 €"), 1234.5);
  assert.equal(toNumber("1,234.50"), 1234.5);
  assert.equal(parseCsv("a,b\n1,2").rows[0].b, "2");
});

test("stripe webhook signature", async () => {
  const { verifyStripeSignature } = await import("../../api/stripe-webhook.js");
  const { createHmac } = await import("node:crypto");
  const body = '{"type":"x"}', secret = "whsec_test", t = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  assert.equal(verifyStripeSignature(body, `t=${t},v1=${sig}`, secret), true);
  assert.equal(verifyStripeSignature(body + " ", `t=${t},v1=${sig}`, secret), false, "tampered body");
  assert.equal(verifyStripeSignature(body, `t=${t - 1000},v1=${createHmac("sha256", secret).update(`${t - 1000}.${body}`).digest("hex")}`, secret), false, "too old");
  assert.equal(verifyStripeSignature(body, `t=${t},v1=${sig}`, ""), false, "no secret configured");
});

test("checkout params: server-side prices, yearly as subscription", async () => {
  const { checkoutParams } = await import("../../api/billing.js");
  const { PACKAGES } = await import("../../src/modules.js");
  const pkg = PACKAGES.find((p) => p.key === "growth");
  const once = checkoutParams({ email: "a@x.de", pkg, interval: "once", site: "https://s" });
  assert.equal(once.mode, "payment");
  assert.equal(once.line_items[0].price_data.unit_amount, 199900);
  assert.equal(once.metadata.package_key, "growth");
  const year = checkoutParams({ email: "a@x.de", pkg, interval: "year", site: "https://s" });
  assert.equal(year.mode, "subscription");
  assert.equal(year.line_items[0].price_data.unit_amount, 1999000);
  assert.equal(year.line_items[0].price_data.recurring.interval, "year");
});

test("plans: module access by catalog suite", async () => {
  const { moduleAllowed, NO_PLAN } = await import("../../lib/plans.js");
  const starter = { suites: ["foundation", "strategy"] };
  assert.equal(moduleAllowed(starter, "swot-analysis"), true);
  assert.equal(moduleAllowed(starter, "go-to-market"), false);
  assert.equal(moduleAllowed(NO_PLAN, "daily-tasks"), true);
  assert.equal(moduleAllowed(NO_PLAN, "swot-analysis"), false);
  assert.equal(moduleAllowed(starter, "does-not-exist"), false);
});

test("google sheets links only", async () => {
  const { sheetCsvUrl } = await import("../../api/connector-sync.js");
  assert.equal(sheetCsvUrl("https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit#gid=42"),
    "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/export?format=csv&gid=42");
  assert.equal(sheetCsvUrl("http://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789"), null);
  assert.equal(sheetCsvUrl("https://evil.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789"), null);
  assert.equal(sheetCsvUrl("https://docs.google.com.evil.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789"), null);
  assert.equal(sheetCsvUrl("http://169.254.169.254/latest"), null);
});
