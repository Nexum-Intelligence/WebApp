// Local stand-in for a Supabase project, used by the integration tests:
//   Postgres + pgvector  (docker container `nexum-pg`, port 54329)
//   PostgREST            (docker container `nexum-rest`, port 54331)
//   this proxy           (/rest/v1 → PostgREST, /auth/v1/user → fake users,
//                         /functions/v1/embed → supabase/functions/embed/core.js
//                         with a deterministic fake embedding)
// Setup: see tests/README.md.

import http from "node:http";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { processPending } from "../../supabase/functions/embed/core.js";

export const JWT_SECRET = "nexum-local-test-secret-0123456789abcdef";
export const USERS = { "tok-a": "a@x.de", "tok-b": "b@y.de" };
// accounts for the browser test (password for all: test1234)
const ACCOUNTS = new Map([
  ["a@x.de", { name: "Anna Nord", company: "Cafe Nord", industry: "gastro" }],
  ["b@y.de", { name: "Ben Sonne", company: "Hotel Sonne", industry: "hotel" }],
]);

function verifyJwt(token) {
  const [h, b, sig] = String(token).split(".");
  if (!sig) return null;
  const ok = crypto.createHmac("sha256", JWT_SECRET).update(`${h}.${b}`).digest("base64url") === sig;
  if (!ok) return null;
  const claims = JSON.parse(Buffer.from(b, "base64url").toString());
  return claims.exp > Date.now() / 1000 ? claims : null;
}

function userFor(email) {
  const md = ACCOUNTS.get(email) || {};
  return { id: crypto.createHash("md5").update(email).digest("hex").replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*/, "$1-$2-$3-$4-$5"), aud: "authenticated", role: "authenticated", email, user_metadata: md, app_metadata: { provider: "email" }, created_at: new Date().toISOString() };
}

function sessionFor(email) {
  const user = userFor(email);
  const expires_in = 3600;
  return { access_token: jwt({ sub: user.id, email, role: "authenticated", aud: "authenticated" }), token_type: "bearer", expires_in, expires_at: Math.floor(Date.now() / 1000) + expires_in, refresh_token: Buffer.from(email).toString("base64url"), user };
}

function emailFromToken(tok) {
  if (USERS[tok]) return USERS[tok];
  const c = verifyJwt(tok);
  return c && c.email ? c.email : null;
}
const REST = "http://127.0.0.1:54331";

export function jwt(claims) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ exp: Math.floor(Date.now() / 1000) + 3600, ...claims });
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

export const SERVICE_KEY = jwt({ role: "service_role", exp: 4102444800 }); // stable across processes

// Bag-of-words hashing → normalized 384-dim vector: similar words, similar vectors.
export async function fakeEmbed(text) {
  const v = new Array(384).fill(0);
  for (const w of String(text).toLowerCase().match(/[a-zäöüß0-9]{3,}/g) || []) {
    const h = crypto.createHash("md5").update(w).digest();
    v[h.readUInt16BE(0) % 384] += 1;
  }
  const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

export function sql(query) {
  return execFileSync("docker", ["exec", "-i", "nexum-pg", "psql", "-U", "postgres", "-At", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim();
}

export async function startStack(port = 54330) {
  const url = `http://127.0.0.1:${port}`;
  const embedCalls = [];
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    try {
      const cors = { "Access-Control-Allow-Origin": req.headers.origin || "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS", "Access-Control-Expose-Headers": "*" };
      const json = (status, obj) => res.writeHead(status, { ...cors, "Content-Type": "application/json" }).end(JSON.stringify(obj));
      if (req.method === "OPTIONS") { res.writeHead(204, cors).end(); return; }
      if (req.url.startsWith("/auth/v1/user")) {
        const email = emailFromToken((req.headers.authorization || "").replace("Bearer ", ""));
        if (!email) return json(401, { msg: "invalid token" });
        if (req.method === "PUT") return json(200, userFor(email));
        return json(200, userFor(email));
      }
      if (req.url.startsWith("/auth/v1/token")) {
        const p = body.length ? JSON.parse(body.toString()) : {};
        if (req.url.includes("grant_type=password")) {
          if (!ACCOUNTS.has(p.email) || p.password !== "test1234") return json(400, { error: "invalid_grant", error_description: "Invalid login credentials", msg: "Invalid login credentials" });
          return json(200, sessionFor(p.email));
        }
        if (req.url.includes("grant_type=refresh_token")) {
          const email = Buffer.from(String(p.refresh_token || ""), "base64url").toString();
          return ACCOUNTS.has(email) ? json(200, sessionFor(email)) : json(400, { error: "invalid_grant" });
        }
        return json(400, { error: "unsupported_grant_type" });
      }
      if (req.url.startsWith("/auth/v1/signup")) {
        const p = JSON.parse(body.toString() || "{}");
        ACCOUNTS.set(p.email, (p.data || {}));
        return json(200, sessionFor(p.email));
      }
      if (req.url.startsWith("/auth/v1/recover")) return json(200, {});
      if (req.url.startsWith("/auth/v1/logout")) { res.writeHead(204, cors).end(); return; }
      if (req.url.startsWith("/functions/v1/embed")) {
        if (req.headers.authorization !== `Bearer ${SERVICE_KEY}`) { res.writeHead(401).end(); return; }
        const db = createClient(url, SERVICE_KEY, { auth: { persistSession: false } });
        const out = await processPending(db, fakeEmbed);
        embedCalls.push(out);
        res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(out));
        return;
      }
      if (req.url.startsWith("/rest/v1/")) {
        const headers = { ...req.headers };
        delete headers.host; delete headers["content-length"]; delete headers.connection;
        const r = await fetch(REST + req.url.slice("/rest/v1".length), { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : body });
        const out = Buffer.from(await r.arrayBuffer());
        const h = {};
        r.headers.forEach((v, k) => { if (!["content-encoding", "transfer-encoding", "connection"].includes(k)) h[k] = v; });
        res.writeHead(r.status, h).end(out);
        return;
      }
      res.writeHead(404).end();
    } catch (e) {
      res.writeHead(500).end(String(e));
    }
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  return { url, embedCalls, stop: () => new Promise((r) => server.close(r)) };
}

// Minimal Vercel req/res doubles.
export async function call(handler, { method = "GET", query = {}, body, token, internalKey } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (internalKey) headers["x-nexum-key"] = internalKey;
  const res = {
    statusCode: 200, body: null, headers: {},
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; },
    setHeader(k, v) { this.headers[k] = v; },
  };
  await handler({ method, query, headers, body }, res);
  return res;
}
