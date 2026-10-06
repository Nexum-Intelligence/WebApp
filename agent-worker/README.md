# NEXUM Agent Worker (Claude Agent SDK + Skills + MCP)

This worker **replaces the n8n workflow layer**. Instead of n8n consuming the
`module_runs` inserts, this small Node service runs the agents with the
**Claude Agent SDK**, using per-module **Skills** and the tenant's **MCP**
connectors, then writes the results back to Supabase.

The platform (the Vite app + `/api/*` functions) is unchanged — it still inserts
`module_runs`, writes chat messages, and serves `/api/context`. Only the consumer
changed from n8n to this worker.

## What it does

- **Module runs:** polls `module_runs` for `status = 'queued'`, loads
  `skills/<module_key>.md`, fetches the tenant context from `/api/context`,
  builds `mcpServers` from the tenant's connectors (`mcp.mjs`), runs a Claude
  agent, and writes `module_runs.result` + `status`. If the agent emits a
  ```json { tasks, notifications } ``` block, those are inserted into
  `company_records` (kinds `tasks` / `notifications`) — this drives the Daily
  Tasks list and the notification bell.
- **Chat:** exposes `POST /chat` ({ email, message }) → runs the chat agent →
  returns `{ reply }` and stores it. Point the platform's `N8N_CHAT_URL` at
  `https://<worker-host>/chat`.

## Env

```
ANTHROPIC_API_KEY            Claude API key
SUPABASE_URL                 https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY    service_role key
PLATFORM_URL                 https://www.nexum-intelligence.com   (for /api/context)
AGENT_MODEL                  optional (default claude-sonnet-4-5)
POLL_MS                      optional (default 5000)
PORT                         optional (default 8787)
# optional MCP endpoints
HUBSPOT_MCP_URL, GSHEETS_MCP_URL, SUPABASE_MCP_URL, SUPABASE_MCP_TOKEN
```

## Run

```bash
cd agent-worker
npm install
ANTHROPIC_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... PLATFORM_URL=https://www.nexum-intelligence.com npm start
```

## Deploy

Any always-on Node host works (Railway, Fly.io, Render, a small VM, or a Docker
container). It is **not** a Vercel serverless function — it needs a long-running
process (polling + the agent loop + optional stdio MCP servers). Set the env vars,
run `npm start`, expose the `PORT` for `/chat`.

## Skills

`skills/<module_key>.md` is the agent's instruction set for that module. `_generic.md`
is the fallback. Add or refine skills per module here — no code change needed. Special
skills: `daily-tasks.md`, `decision-recommendation.md`, `chat.md`.

## MCP connectors

`mcp.mjs` maps each tenant's connected sources (from the Connectors tab) to Agent SDK
MCP servers (stdio or HTTP). Wire your real MCP servers there (POS/Kasse, Stripe,
HubSpot, DATEV, Google Sheets, a Supabase MCP for direct data read/write, …). Tools are
allowed as `${serverName}_*`.

## Switching off n8n

Once this worker is running: remove the Supabase → n8n database webhook (the worker
polls instead), and point `N8N_CHAT_URL` at this worker's `/chat`. Nothing else in the
platform needs to change.

> Note: the SDK message shape (`result` / `assistant` blocks) is handled defensively in
> `runAgent()`. If a future SDK version changes it, adjust the extraction there.
