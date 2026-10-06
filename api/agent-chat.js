// Vercel Serverless Function — agent chat (asynchronous).
//
// GET  /api/agent-chat → { messages, pending }   (latest 100, oldest first)
// POST /api/agent-chat { message, context:{view} } → stores the message as pending
//
// The Claude automation answers pending messages via nexum_pending_chats() /
// nexum_reply_chat(); the UI polls GET until the reply appears.

import { resolveTenant } from "../lib/auth.js";
import { setActor } from "../lib/actor.js";
import { readBody, fail, rest, kickEmbed, enc } from "../lib/http.js";

export default async function handler(req, res) {
  const body = req.method === "POST" ? readBody(req) : {};
  const t = await resolveTenant(req, (req.query && req.query.email) || body.email);
  if (!t.email) return fail(res, t.status, t.error);
  setActor(t.actor);
  const email = t.email;

  try {
    if (req.method === "GET") {
      if (t.demo) return res.status(200).json({ messages: [], pending: false });
      const r = await rest(`agent_messages?email=eq.${enc(email)}&order=created_at.desc&limit=100&select=id,role,content,status,reply_to,created_at`);
      if (!r.ok) return fail(res, 502, "Could not load messages");
      const messages = r.data.reverse();
      return res.status(200).json({ messages, pending: messages.some((m) => m.status === "pending") });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return fail(res, 405, "Method not allowed");
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return fail(res, 400, "Missing message");
    if (message.length > 4000) return fail(res, 400, "Message too long");
    const view = body.context && typeof body.context.view === "string" ? body.context.view.slice(0, 80) : null;

    if (t.demo) {
      return res.status(200).json({ ok: true, stored: false, message: { id: `local-${Date.now()}`, role: "user", content: message, status: "pending", created_at: new Date().toISOString() } });
    }

    const r = await rest("agent_messages", {
      method: "POST",
      body: { email, role: "user", content: message, status: "pending", context: { view } },
      prefer: "return=representation",
    });
    if (!r.ok) return fail(res, 502, "Could not send message");
    await kickEmbed();
    const m = r.data[0];
    return res.status(200).json({ ok: true, stored: true, message: { id: m.id, role: m.role, content: m.content, status: m.status, created_at: m.created_at } });
  } catch (e) {
    console.error("[agent-chat]", e);
    return fail(res, 500, "Server error");
  }
}
