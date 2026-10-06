// Embedding + retrieval work for the NEXUM knowledge base. Runtime-agnostic so it
// can be unit-tested in Node; `index.ts` wires it to Supabase Edge (gte-small).
//
//   db    — a supabase-js client (service role)
//   embed — async (text) => number[384]
//
// 1. embeds knowledge_chunks whose embedding is null
// 2. attaches the top-k matching chunks to queued module_runs and pending chat
//    messages that have no `retrieved` yet, so the Claude automation gets the
//    relevant knowledge without having to compute a query embedding itself.

export const LIMITS = { chunks: 64, runs: 10, chats: 10, topK: 12 };

const INTERNAL = new Set(["_context", "_company", "answers"]);

export function runQuery(run) {
  const inputs = run.inputs || {};
  const parts = [run.module_name || run.module_key];
  for (const [k, v] of Object.entries(inputs)) {
    if (INTERNAL.has(k) || v == null || v === "") continue;
    parts.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
  }
  return parts.join("\n").slice(0, 2000);
}

export const toVector = (arr) => `[${Array.from(arr).join(",")}]`;

async function retrieve(db, embed, email, text, k) {
  const vec = await embed(text);
  const { data, error } = await db.rpc("nexum_match_chunks", { p_email: email, p_embedding: toVector(vec), p_k: k });
  if (error) throw new Error(`match: ${error.message}`);
  return (data || []).map((c) => ({ kind: c.kind, source: c.source_type, content: c.content, similarity: Math.round(c.similarity * 1000) / 1000 }));
}

export async function processPending(db, embed, limits = LIMITS) {
  const out = { chunks: 0, runs: 0, chats: 0, errors: [] };

  // 1. pending chunks
  const { data: chunks, error: e1 } = await db.from("knowledge_chunks")
    .select("id,content,content_hash").is("embedding", null).order("updated_at", { ascending: true }).limit(limits.chunks);
  if (e1) out.errors.push(`chunks: ${e1.message}`);
  for (const c of chunks || []) {
    try {
      const vec = await embed(c.content);
      // content may have changed meanwhile; then the trigger reset it and the next pass embeds the new text
      const { error } = await db.from("knowledge_chunks").update({ embedding: toVector(vec) }).eq("id", c.id).eq("content_hash", c.content_hash);
      if (error) throw new Error(error.message);
      out.chunks++;
    } catch (e) { out.errors.push(`chunk ${c.id}: ${e.message || e}`); }
  }

  // 2. queued runs without retrieval
  const { data: runs, error: e2 } = await db.from("module_runs")
    .select("id,email,module_key,module_name,inputs").eq("status", "queued").is("retrieved", null)
    .order("created_at", { ascending: true }).limit(limits.runs);
  if (e2) out.errors.push(`runs: ${e2.message}`);
  for (const r of runs || []) {
    try {
      const retrieved = await retrieve(db, embed, r.email, runQuery(r), limits.topK);
      const { error } = await db.from("module_runs").update({ retrieved }).eq("id", r.id);
      if (error) throw new Error(error.message);
      out.runs++;
    } catch (e) { out.errors.push(`run ${r.id}: ${e.message || e}`); }
  }

  // 3. pending chat messages without retrieval
  const { data: msgs, error: e3 } = await db.from("agent_messages")
    .select("id,email,content").eq("status", "pending").is("retrieved", null)
    .order("created_at", { ascending: true }).limit(limits.chats);
  if (e3) out.errors.push(`chats: ${e3.message}`);
  for (const m of msgs || []) {
    try {
      const retrieved = await retrieve(db, embed, m.email, m.content, 8);
      const { error } = await db.from("agent_messages").update({ retrieved }).eq("id", m.id);
      if (error) throw new Error(error.message);
      out.chats++;
    } catch (e) { out.errors.push(`chat ${m.id}: ${e.message || e}`); }
  }

  return out;
}
