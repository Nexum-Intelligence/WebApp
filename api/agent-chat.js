// Vercel Serverless Function — agent chat.
//
// GET  /api/agent-chat?email=..            → { messages: [...] }  (history)
// POST /api/agent-chat { email, message, context } → stores the user message,
//        forwards to the agent (n8n) if configured, stores + returns the reply.
//
// Env:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   store chat in `agent_messages`
//   N8N_CHAT_URL   (optional) webhook that receives { email, message, context }
//                  and returns { reply: "..." }. If unset, a graceful stub reply.

import { buildContext } from "../lib/context.js";

async function store(URL, KEY, row) {
  try {
    await fetch(`${URL}/rest/v1/agent_messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
  } catch (e) {}
}

export default async function handler(req, res) {
  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const N8N = process.env.N8N_CHAT_URL;

  if (req.method === "GET") {
    const email = (req.query && req.query.email) || "";
    if (!email) { res.status(400).json({ error: "Missing email" }); return; }
    if (!URL || !KEY) { res.status(200).json({ messages: [] }); return; }
    try {
      const q = `${URL}/rest/v1/agent_messages?email=eq.${encodeURIComponent(email)}&order=created_at.asc&select=id,role,content,created_at`;
      const r = await fetch(q, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
      res.status(200).json({ messages: r.ok ? await r.json() : [] });
    } catch (e) { res.status(200).json({ messages: [] }); }
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { email = null, message = null, context = {} } = body;
    if (!email || !message) { res.status(400).json({ error: "Missing email or message" }); return; }

    if (URL && KEY) await store(URL, KEY, { email, role: "user", content: message });

    // Ask the agent (n8n) for a reply.
    let reply = "";
    if (N8N) {
      try {
        let business = "";
        try { business = (await buildContext(email)).text; } catch (e) {}
        const r = await fetch(N8N, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, message, context: { ...context, business } }),
        });
        if (r.ok) { const d = await r.json().catch(() => ({})); reply = d.reply || d.output || ""; }
      } catch (e) {}
    }
    if (!reply) {
      reply = "Got it — I've logged that. Once the agent backend (n8n) is connected I can read your live data, update records and document actions right here.";
    }

    if (URL && KEY) await store(URL, KEY, { email, role: "assistant", content: reply });

    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
