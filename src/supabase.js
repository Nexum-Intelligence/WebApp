// Supabase browser client + auth. When the env vars are set, the platform uses
// real accounts (sign up / sign in / sessions). Without them it falls back to
// the previous local mode so development still works.
//
// Build-time env (Vercel → Settings → Environment Variables), exposed to the
// browser (safe — anon key is public):
//   VITE_SUPABASE_URL       https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY  Supabase → Project Settings → API → anon public key

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = !!(url && anon);
export const supabase = supabaseEnabled ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

// Attach the signed-in user's access token to every same-origin /api/ request,
// so the serverless functions can verify who is calling and scope data to them.
if (typeof window !== "undefined" && supabaseEnabled && !window.__nexumFetchPatched) {
  window.__nexumFetchPatched = true;
  const orig = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    try {
      const u = typeof input === "string" ? input : (input && input.url) || "";
      if (u.indexOf("/api/") === 0) {
        const { data } = await supabase.auth.getSession();
        const t = data && data.session && data.session.access_token;
        if (t) init = { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${t}` } };
      }
    } catch (e) {}
    return orig(input, init);
  };
}
