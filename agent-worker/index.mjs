// NEXUM Agent Worker — replaces the n8n workflow layer with Claude agents.
//
// What it does:
//  1) Polls Supabase `module_runs` for status = 'queued'.
//  2) For each run: loads the module's Skill (skills/<module_key>.md), fetches the
//     tenant's structured business context (/api/context), configures MCP servers
//     from the tenant's connectors, runs a Claude agent via the Agent SDK, and
//     writes the result back (module_runs.result + status), plus any tasks /
//     notifications the agent emits as a fenced ```json block.
//  3) Exposes POST /chat so the platform's agent-chat can forward chat messages
//     here (set N8N_CHAT_URL to https://<worker-host>/chat).
//
// Env:
//   ANTHROPIC_API_KEY            Claude API key (read automatically by the SDK)
//   SUPABASE_URL                 https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    service_role key (read queue + write results)
//   PLATFORM_URL                 https://www.nexum-intelligence.com (for /api/context)
//   AGENT_MODEL                  optional, default claude-sonnet-4-5
//   POLL_MS                      optional, default 5000
//   PORT                         optional, default 8787 (chat endpoint)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildMcpServers } from "./mcp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PLATFORM_URL = process.env.PLATFORM_URL || "";
const MODEL = process.env.AGENT_MODEL || "claude-sonnet-4-5";
const POLL_MS = Number(process.env.POLL_MS || 5000);
const PORT = Number(process.env.PORT || 8787);

if (!SUPA_URL || !SUPA_KEY) { console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const db = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

// ---- helpers ---------------------------------------------------------------

const CATALOG = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, "catalog.json"), "utf8")); } catch (e) { return {}; }
})();

// Subagents the orchestrator can spawn (Agent SDK `agents` option).
const SUBAGENTS = {
  researcher: {
    description: "Researches the web for market, competitor, trend, pricing and regulatory facts.",
    prompt: "You are a rigorous business researcher. Use WebSearch and WebFetch to find current, credible facts and cite the sources. Return concise, sourced findings — never invent numbers.",
    tools: ["WebSearch", "WebFetch"],
    model: "inherit",
  },
  analyst: {
    description: "Turns the business's data and research into structured, quantified insight.",
    prompt: "You are a sharp business analyst. Combine the company context, its live KPIs and the research into clear, quantified insight and specific recommendations with € impact.",
    tools: [],
    model: "inherit",
  },
  quality: {
    description: "Reviews a draft deliverable for accuracy, unsupported claims, gaps and business usefulness.",
    prompt: "You are a demanding quality reviewer. Check the draft against the provided data, flag unsupported claims and gaps, and tighten it into a crisp, useful result.",
    tools: [],
    model: "inherit",
  },
};

// Every module gets a matched skill: a specific file if present, else built from
// the module catalog (name, role, deliverables) on top of the base skill.
function loadSkill(moduleKey) {
  const specific = path.join(__dirname, "skills", `${moduleKey}.md`);
  if (fs.existsSync(specific)) return fs.readFileSync(specific, "utf8");
  const basePath = path.join(__dirname, "skills", "_generic.md");
  const base = fs.existsSync(basePath) ? fs.readFileSync(basePath, "utf8") : "You are a NEXUM business agent.";
  const m = CATALOG[moduleKey];
  if (!m) return base;
  return [
    base, "",
    `## This module: ${m.name}${m.suite ? ` (${m.suite})` : ""}`,
    m.role ? `Role: ${m.role}.` : "",
    `Category: ${m.category}.`,
    `Produce these deliverables: ${(m.deliverables || []).join(", ")}.`,
    "You may spawn the `researcher`, `analyst` and `quality` subagents (via the Agent tool) and use WebSearch/WebFetch to research anything you're unsure about. Orchestrate: research → analyse → draft → quality-review → finalise.",
  ].filter(Boolean).join("\n");
}

async function fetchContext(email) {
  if (!PLATFORM_URL) return "";
  try {
    // /api/context only answers server-to-server calls that carry the internal key
    const r = await fetch(`${PLATFORM_URL}/api/context?email=${encodeURIComponent(email)}`, { headers: { "x-nexum-key": process.env.NEXUM_INTERNAL_KEY || "" } });
    if (!r.ok) return "";
    const d = await r.json();
    return d.context || "";
  } catch (e) { return ""; }
}

// Run a single agent task (with research + subagents) and return the final text.
async function runAgent({ systemPrompt, prompt, mcpServers }) {
  let resultText = "";
  let assistantText = "";
  const mcpAllowed = Object.keys(mcpServers || {}).map((n) => `mcp__${n}__*`);
  const messages = query({
    prompt,
    options: {
      systemPrompt,
      model: MODEL,
      maxTurns: 20,
      permissionMode: "bypassPermissions",
      mcpServers: mcpServers || {},
      agents: SUBAGENTS,
      allowedTools: ["WebSearch", "WebFetch", "Agent", ...mcpAllowed],
    },
  });
  for await (const m of messages) {
    if (m && m.type === "result" && typeof m.result === "string") resultText = m.result;
    if (m && m.type === "assistant") {
      const content = (m.message && m.message.content) || m.content;
      if (typeof content === "string") assistantText += content;
      else if (Array.isArray(content)) assistantText += content.filter((b) => b && b.type === "text").map((b) => b.text).join("");
    }
  }
  return (resultText || assistantText || "").trim();
}

// Pull an optional fenced ```json { tasks?, notifications? } block out of the text.
function extractStructured(text) {
  const m = text.match(/```json\s*([\s\S]*?)```/i);
  if (!m) return { clean: text, structured: null };
  let structured = null;
  try { structured = JSON.parse(m[1]); } catch (e) {}
  const clean = text.replace(m[0], "").trim();
  return { clean, structured };
}

async function insertRecords(email, kind, items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const rows = items.map((data) => ({ email, kind, data }));
  try { await db.from("company_records").insert(rows); } catch (e) { console.error("insert", kind, e.message); }
}

// Store the finished artifact as a file in Supabase Storage and record a link.
async function storeArtifact(email, run, markdown) {
  const bucket = process.env.ARTIFACTS_BUCKET || "artifacts";
  const filePath = `${email}/${run.id}.md`;
  try {
    const { error } = await db.storage.from(bucket).upload(filePath, Buffer.from(markdown, "utf8"), { upsert: true, contentType: "text/markdown" });
    if (error) { console.error("storage", error.message); return null; }
    const { data } = db.storage.from(bucket).getPublicUrl(filePath);
    const url = (data && data.publicUrl) || null;
    await db.from("company_records").insert({ email, kind: "artifacts", data: { module_key: run.module_key, title: run.module_name || run.module_key, format: "md", url, run_id: run.id, created_at: new Date().toISOString() } });
    return url;
  } catch (e) { console.error("storeArtifact", e.message); return null; }
}

// ---- module run processing -------------------------------------------------

async function processRun(run) {
  console.log(`[run] ${run.module_key} for ${run.email}`);
  await db.from("module_runs").update({ status: "running" }).eq("id", run.id);
  try {
    const context = await fetchContext(run.email);
    const skill = loadSkill(run.module_key);
    const inputs = run.inputs || {};
    const mcpServers = await buildMcpServers(db, run.email);

    const systemPrompt = [
      skill,
      "",
      "## Business context (live data)",
      context || "(no context available yet)",
    ].join("\n");

    const cleanInputs = { ...inputs }; delete cleanInputs._context; delete cleanInputs._company;
    const answersGiven = cleanInputs.answers && Object.keys(cleanInputs.answers).length > 0;

    const prompt = [
      `Run the "${run.module_name || run.module_key}" agent for this business.`,
      Object.keys(cleanInputs).length ? `Inputs:\n${JSON.stringify(cleanInputs, null, 2)}` : "",
      answersGiven
        ? "The owner has answered your open questions (see inputs.answers). Now produce the full deliverable."
        : "If you are missing key information to produce a high-quality, tailored result, respond with ONLY a fenced ```json {\"questions\":[{\"key\":\"…\",\"label\":\"…\",\"type\":\"text|textarea|select\",\"options\":[]}]} block (3–6 sharp questions). Otherwise produce the deliverable now.",
      "If the skill asks for a tasks/notifications JSON block, include exactly one fenced ```json block at the end.",
    ].filter(Boolean).join("\n\n");

    const text = await runAgent({ systemPrompt, prompt, mcpServers });
    const { clean, structured } = extractStructured(text);

    // The agent asked for input → park the run and surface the questions in the UI.
    if (structured && Array.isArray(structured.questions) && structured.questions.length && !answersGiven) {
      await db.from("module_runs").update({ status: "needs_input", questions: structured.questions }).eq("id", run.id);
      console.log(`[needs_input] ${run.module_key} (${structured.questions.length} questions)`);
      return;
    }

    await db.from("module_runs").update({ status: "done", result: clean || text }).eq("id", run.id);

    // Persist non-live deliverables as a downloadable file (Supabase Storage).
    const cat = (CATALOG[run.module_key] || {}).category;
    if (cat !== "live" && (clean || text)) await storeArtifact(run.email, run, clean || text);

    if (structured) {
      await insertRecords(run.email, "tasks", (structured.tasks || []).map((t) => (typeof t === "string" ? { title: t, done: false, source: "agent" } : { done: false, source: "agent", ...t })));
      await insertRecords(run.email, "notifications", (structured.notifications || []).map((n) => ({ severity: "recommendation", read: false, created_at: new Date().toISOString(), ...n })));
    }
    console.log(`[done] ${run.module_key}`);
  } catch (e) {
    console.error("[error]", e.message);
    await db.from("module_runs").update({ status: "error", result: String(e.message || e) }).eq("id", run.id);
  }
}

async function pollOnce() {
  const { data, error } = await db.from("module_runs").select("*").eq("status", "queued").order("created_at", { ascending: true }).limit(3);
  if (error) { console.error("poll", error.message); return; }
  for (const run of data || []) await processRun(run);
}

async function pollLoop() {
  for (;;) {
    try { await pollOnce(); } catch (e) { console.error(e.message); }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

// ---- chat endpoint ---------------------------------------------------------

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") { res.writeHead(200); res.end("ok"); return; }
  if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const { email, message } = JSON.parse(body || "{}");
        const context = await fetchContext(email);
        const mcpServers = await buildMcpServers(db, email);
        const systemPrompt = [loadSkill("chat"), "", "## Business context (live data)", context || "(none)"].join("\n");
        const reply = await runAgent({ systemPrompt, prompt: message, mcpServers });
        try { await db.from("agent_messages").insert({ email, role: "assistant", content: reply }); } catch (e) {}
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reply }));
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(e.message || e) }));
      }
    });
    return;
  }
  res.writeHead(404); res.end();
});

server.listen(PORT, () => console.log(`NEXUM agent worker: chat on :${PORT}, polling every ${POLL_MS}ms`));
pollLoop();
