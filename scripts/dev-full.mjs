// Local dev server: Vite app + the Vercel functions in /api on the same origin,
// so the platform can be tested end to end without `vercel dev`.
//   pnpm dev:full            (reads env from the shell / .env.local)
import { createServer, loadEnv } from "vite";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = process.cwd();
Object.assign(process.env, { ...loadEnv("development", root, ""), ...process.env });

function apiMiddleware() {
  return {
    name: "nexum-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, "http://localhost");
        const m = url.pathname.match(/^\/api\/([a-z0-9-]+)$/);
        if (!m) return next();
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const raw = Buffer.concat(chunks).toString();
        let body;
        try { body = raw ? JSON.parse(raw) : undefined; } catch (e) { body = raw; }
        const file = pathToFileURL(path.join(root, "api", `${m[1]}.js`)).href;
        try {
          const mod = await import(`${file}?t=${Date.now()}`);
          const shim = {
            statusCode: 200,
            status(c) { this.statusCode = c; return this; },
            setHeader(k, v) { res.setHeader(k, v); },
            json(o) { res.statusCode = this.statusCode; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); return this; },
          };
          await mod.default({ method: req.method, headers: req.headers, query: Object.fromEntries(url.searchParams), body, rawBody: raw }, shim);
          if (!res.writableEnded) res.end();
        } catch (e) {
          console.error(`[api/${m[1]}]`, e);
          res.statusCode = 500; res.end(JSON.stringify({ ok: false, error: "dev server error" }));
        }
      });
    },
  };
}

const server = await createServer({ root, plugins: [apiMiddleware()], server: { host: "127.0.0.1", port: Number(process.env.PORT) || 5173, strictPort: true } });
await server.listen();
server.printUrls();
