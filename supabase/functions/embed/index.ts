// Supabase Edge Function `embed` — computes gte-small embeddings (384 dims) inside
// Supabase (no external API key) and attaches retrieval results to new module runs
// and chat messages. Invoked by pg_cron every minute and by /api after writes.
//
// Deploy:  supabase functions deploy embed --no-verify-jwt   (the function checks the key itself)
// Auth:    callers send the service role key (or the optional NEXUM_EMBED_KEY secret) as Bearer token.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { processPending } from "./core.js";

// deno-lint-ignore no-explicit-any
const session = new (globalThis as any).Supabase.ai.Session("gte-small");
const embed = async (text: string): Promise<number[]> =>
  Array.from(await session.run(text, { mean_pool: true, normalize: true }) as number[]);

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization") || "";
  const allowed = [KEY, Deno.env.get("NEXUM_EMBED_KEY")].filter(Boolean).map((k) => `Bearer ${k}`);
  if (!allowed.includes(auth)) return new Response("Unauthorized", { status: 401 });

  const db = createClient(SB_URL, KEY, { auth: { persistSession: false } });
  const work = processPending(db, embed).then((r) => {
    if (r.errors.length) console.error("embed errors", r.errors);
    return r;
  });

  // ?wait=1 returns the counts (debugging); otherwise answer immediately and keep working.
  if (new URL(req.url).searchParams.get("wait")) {
    return Response.json(await work);
  }
  // deno-lint-ignore no-explicit-any
  (globalThis as any).EdgeRuntime?.waitUntil(work);
  return Response.json({ accepted: true }, { status: 202 });
});
