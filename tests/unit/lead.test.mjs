import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import handler, { normalizeAvailability } from "../../api/lead.js";

const call = async (body) => {
  const res = { code: 200, body: null, setHeader() {}, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; } };
  await handler({ method: "POST", body }, res);
  return res;
};
const contact = { name: "Lena", email: "lena@cafe.de", company: "Cafe Nord", consent: true };

beforeEach(() => {
  for (const k of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "SALES_EMAIL"]) delete process.env[k];
});

test("availability keeps only known days/slots in calendar order", () => {
  assert.deepEqual(
    normalizeAvailability({ days: ["fri", "mon", "sun", "<x>"], slots: ["14:00–16:00", "08:00–10:00", "23:00"], timezone: "Europe/Berlin" }),
    { days: ["mon", "fri"], slots: ["08:00–10:00", "14:00–16:00"], timezone: "Europe/Berlin" });
  assert.equal(normalizeAvailability({ days: [], slots: [], timezone: "<script>" }).timezone, null);
});

test("contact request needs a day and a slot", async () => {
  const r = await call({ source: "contact", contact, availability: { days: ["mon"], slots: [] } });
  assert.equal(r.code, 400);
});

test("contact request is stored with preferred days and slots", async () => {
  process.env.SUPABASE_URL = "https://db.test"; process.env.SUPABASE_SERVICE_ROLE_KEY = "k";
  const sent = [];
  const orig = globalThis.fetch;
  globalThis.fetch = async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return new Response(null, { status: 201 }); };
  try {
    const r = await call({ source: "contact", lang: "de", contact, request: { topic: "AI automation project", budget: "" },
      availability: { days: ["tue", "thu"], slots: ["10:00–12:00"], timezone: "Europe/Berlin" } });
    assert.equal(r.code, 200);
    assert.equal(sent[0].url, "https://db.test/rest/v1/leads");
    assert.deepEqual(sent[0].body.preferred_days, ["tue", "thu"]);
    assert.deepEqual(sent[0].body.preferred_slots, ["10:00–12:00"]);
    assert.equal(sent[0].body.topic, "AI automation project");
    assert.equal(sent[0].body.budget, null);
    assert.equal(sent[0].body.source, "contact");
  } finally { globalThis.fetch = orig; }
});

test("a configured but failing store is reported, not hidden", async () => {
  process.env.SUPABASE_URL = "https://db.test"; process.env.SUPABASE_SERVICE_ROLE_KEY = "k";
  const orig = globalThis.fetch;
  globalThis.fetch = async () => new Response("relation \"leads\" does not exist", { status: 404 });
  const err = console.error; console.error = () => {};
  try {
    const r = await call({ source: "contact", contact, availability: { days: ["mon"], slots: ["08:00–10:00"] } });
    assert.equal(r.code, 502);
  } finally { globalThis.fetch = orig; console.error = err; }
});

test("readiness leads keep working without availability", async () => {
  const r = await call({ contact, score: 72, level: "Ready" });
  assert.equal(r.code, 200);
});
