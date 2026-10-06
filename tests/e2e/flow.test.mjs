// End-to-end: website API → Supabase (Postgres/PostgREST) → knowledge chunks +
// embeddings → simulated Claude automation (the SQL interface) → API/UI reads.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startStack, call, sql, SERVICE_KEY } from "./harness.mjs";

let stack;
let records, company, moduleRun, chat, context;

before(async () => {
  stack = await startStack();
  process.env.SUPABASE_URL = stack.url;
  process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
  process.env.SUPABASE_ANON_KEY = "anon";
  process.env.NEXUM_INTERNAL_KEY = "internal-test-key";
  sql("truncate company_profiles, company_records, module_runs, agent_messages, knowledge_chunks");
  records = (await import("../../api/records.js")).default;
  company = (await import("../../api/company.js")).default;
  moduleRun = (await import("../../api/module-run.js")).default;
  chat = (await import("../../api/agent-chat.js")).default;
  context = (await import("../../api/context.js")).default;
});
after(async () => { await stack.stop(); });

test("tenant isolation: no token → 401, client email ignored, internal key allowed", async () => {
  const anon = await call(records, { query: { kind: "customers", email: "a@x.de" } });
  assert.equal(anon.statusCode, 401);
  const badTok = await call(records, { query: { kind: "customers", email: "a@x.de" }, token: "forged" });
  assert.equal(badTok.statusCode, 401);
  const ctx = await call(context, { query: { email: "a@x.de" } });
  assert.equal(ctx.statusCode, 401);

  const created = await call(records, { method: "POST", token: "tok-a", body: { email: "b@y.de", kind: "customers", data: { name: "Hotel Sonne", stage: "Customer", value: 12000 } } });
  assert.equal(created.statusCode, 200);
  assert.equal(sql("select email from company_records"), "a@x.de", "stored for the verified user, not the claimed email");

  const asB = await call(records, { query: { kind: "customers" }, token: "tok-b" });
  assert.equal(asB.body.records.length, 0);
  const asA = await call(records, { query: { kind: "customers" }, token: "tok-a" });
  assert.equal(asA.body.records.length, 1);

  const id = asA.body.records[0].id;
  const hijack = await call(records, { method: "DELETE", query: { id }, token: "tok-b" });
  assert.equal(hijack.statusCode, 200);
  assert.equal(sql(`select count(*) from company_records where id = '${id}'`), "1", "other tenant cannot delete");

  const internal = await call(records, { query: { kind: "customers", email: "a@x.de" }, internalKey: "internal-test-key" });
  assert.equal(internal.body.records.length, 1);
  const wrongKey = await call(records, { query: { kind: "customers", email: "a@x.de" }, internalKey: "nope" });
  assert.equal(wrongKey.statusCode, 401);
});

test("connector secrets are masked and preserved", async () => {
  const c = await call(records, { method: "POST", token: "tok-a", body: { kind: "connectors", data: { key: "stripe", config: { apiKey: "sk_live_abcdef1234" } } } });
  assert.equal(c.body.record.data.config.apiKey, "••••1234");
  const p = await call(records, { method: "PATCH", token: "tok-a", body: { id: c.body.record.id, data: { key: "stripe", config: { apiKey: "••••1234", account: "x" } } } });
  assert.equal(p.statusCode, 200);
  assert.equal(sql(`select data->'config'->>'apiKey' from company_records where id = '${c.body.record.id}'`), "sk_live_abcdef1234");
  assert.equal(sql("select count(*) from knowledge_chunks where content like '%sk_live%'"), "0");
});

test("company profile: sections merge, research results survive a stale save", async () => {
  await call(company, { method: "POST", token: "tok-a", body: { data: { basics: { companyName: "Cafe Nord", industry: "gastro" } } } });
  sql(`update company_profiles set data = data || '{"research":{"founded":"2019"}}' where email = 'a@x.de'`);
  await call(company, { method: "POST", token: "tok-a", body: { data: { basics: { companyName: "Cafe Nord GmbH", industry: "gastro" } } } });
  const g = await call(company, { token: "tok-a" });
  assert.equal(g.body.data.basics.companyName, "Cafe Nord GmbH");
  assert.equal(g.body.data.research.founded, "2019");
});

test("full module flow: queue → embeddings/retrieval → ask → answer → complete → visible in UI APIs", async () => {
  await call(records, { method: "POST", token: "tok-a", body: { kind: "suppliers", data: { name: "Roesterei Elbe", product: "Kaffeebohnen" } } });
  await call(records, { method: "POST", token: "tok-a", body: { kind: "transactions", data: { type: "Income", category: "Sales", amount: 5000 } } });
  await call(records, { method: "POST", token: "tok-a", body: { kind: "transactions", data: { type: "Expense", category: "Purchasing", amount: 800 } } });
  await call(records, { method: "POST", token: "tok-a", body: { kind: "transactions", data: { type: "Expense", category: "Rent", amount: 1200 } } });

  const started = await call(moduleRun, { method: "POST", token: "tok-a", body: { moduleKey: "go-to-market", moduleName: "Go-to-Market", suiteKey: "strategy", lang: "de", inputs: { market: "Hamburg Kaffeebohnen", _company: { evil: true } } } });
  assert.equal(started.statusCode, 200);
  const runId = started.body.run.id;
  assert.equal(started.body.run.status, "queued");

  // embeddings + retrieval happened through the kick
  assert.equal(sql("select count(*) from knowledge_chunks where embedding is null"), "0");
  const retrieved = JSON.parse(sql(`select retrieved from module_runs where id = '${runId}'`));
  assert.ok(retrieved.length > 0, "retrieval attached");
  assert.ok(retrieved.some((c) => c.content.includes("Roesterei Elbe")), "relevant supplier retrieved");
  assert.equal(sql(`select inputs ? '_company' from module_runs where id = '${runId}'`), "f", "client profile copy dropped");
  const ctxText = sql(`select context->>'text' from module_runs where id = '${runId}'`);
  assert.match(ctxText, /expenses €1,200/, "stock purchases not counted as expense");

  // --- Claude automation (via Supabase MCP) ---
  const claim = JSON.parse(sql("select nexum_claim_next('claude-test')"));
  assert.equal(claim.run.id, runId);
  assert.equal(claim.profile.basics.companyName, "Cafe Nord GmbH");
  assert.ok(claim.retrieved.length > 0);
  sql(`select nexum_ask('${runId}', '[{"key":"budget","label":"Monatliches Budget?","type":"text"}]')`);

  let runs = await call(moduleRun, { token: "tok-a" });
  let run = runs.body.runs.find((r) => r.id === runId);
  assert.equal(run.status, "needs_input");
  assert.equal(run.questions[0].key, "budget");

  const wrongTenant = await call(moduleRun, { method: "PATCH", token: "tok-b", body: { id: runId, answers: { budget: "1" } } });
  assert.equal(wrongTenant.statusCode, 404);
  const ans = await call(moduleRun, { method: "PATCH", token: "tok-a", body: { id: runId, answers: { budget: "800 EUR" } } });
  assert.equal(ans.statusCode, 200);
  assert.equal(ans.body.run.status, "queued");
  const again = await call(moduleRun, { method: "PATCH", token: "tok-a", body: { id: runId, answers: { budget: "900 EUR" } } });
  assert.equal(again.statusCode, 409);

  const claim2 = JSON.parse(sql("select nexum_claim_next('claude-test')"));
  assert.equal(claim2.run.answers.budget, "800 EUR");
  const md = "# Go-to-Market Hamburg\\n\\n- Kanal: Instagram\\n- Budget: 800 EUR";
  sql(`select nexum_complete('${runId}', E'${md}', 'GTM fuer Hamburg', '[{"title":"Instagram-Profil optimieren","priority":"high"}]', '[{"severity":"recommendation","title":"Budget pruefen","message":"800 EUR reichen fuer 2 Kanaele"}]', null)`);

  runs = await call(moduleRun, { token: "tok-a" });
  run = runs.body.runs.find((r) => r.id === runId);
  assert.equal(run.status, "done");
  assert.match(run.result.markdown, /^# Go-to-Market Hamburg/);
  assert.equal(run.summary, "GTM fuer Hamburg");

  const tasks = await call(records, { query: { kind: "tasks" }, token: "tok-a" });
  assert.equal(tasks.body.records[0].data.title, "Instagram-Profil optimieren");
  const notes = await call(records, { query: { kind: "notifications" }, token: "tok-a" });
  assert.equal(notes.body.records[0].data.link, "module:go-to-market");
  const arts = await call(records, { query: { kind: "artifacts" }, token: "tok-a" });
  assert.equal(arts.body.records[0].data.run_id, runId);
  assert.equal((await call(records, { query: { kind: "tasks" }, token: "tok-b" })).body.records.length, 0);

  // owner edits the result
  const edit = await call(moduleRun, { method: "PATCH", token: "tok-a", body: { id: runId, result: "# Edited" } });
  assert.equal(edit.statusCode, 200);
  assert.equal(sql(`select result->>'markdown' from module_runs where id = '${runId}'`), "# Edited");
});

test("chat is asynchronous: pending → automation reply → visible", async () => {
  const sent = await call(chat, { method: "POST", token: "tok-a", body: { message: "Welche Lieferanten habe ich?", context: { view: "overview" } } });
  assert.equal(sent.statusCode, 200);
  let h = await call(chat, { token: "tok-a" });
  assert.equal(h.body.pending, true);
  const pending = JSON.parse(sql("select nexum_pending_chats(5)"));
  assert.equal(pending.length, 1);
  assert.ok(pending[0].retrieved.some((c) => c.content.includes("Roesterei Elbe")), "chat retrieval");
  sql(`select nexum_reply_chat('${pending[0].message_id}', 'Du hast einen Lieferanten: Roesterei Elbe.')`);
  h = await call(chat, { token: "tok-a" });
  assert.equal(h.body.pending, false);
  assert.equal(h.body.messages.at(-1).role, "assistant");
  assert.equal((await call(chat, { token: "tok-b" })).body.messages.length, 0);
});

test("validation and errors use real status codes", async () => {
  assert.equal((await call(records, { query: { kind: "../x" }, token: "tok-a" })).statusCode, 400);
  assert.equal((await call(records, { method: "PATCH", token: "tok-a", body: { id: "00000000-0000-0000-0000-000000000000", data: {} } })).statusCode, 404);
  assert.equal((await call(moduleRun, { method: "POST", token: "tok-a", body: { moduleKey: "Bad Key!" } })).statusCode, 400);
  assert.equal((await call(chat, { method: "POST", token: "tok-a", body: { message: "" } })).statusCode, 400);
});
