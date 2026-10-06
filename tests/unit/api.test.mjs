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
  assert.deepEqual(await resolveTenant(req({ "x-nexum-key": "k-123" }), "a@x.de"), { email: "a@x.de", internal: true });
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
