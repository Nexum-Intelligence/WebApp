# NEXUM Intelligence — Handoff prompt for a coding agent

Paste this whole file to the coding agent as context before continuing work.

---

You are picking up an in-progress product. Read this brief, then continue from
"Open items / next steps". Do not rebuild what exists; extend it.

## What this is
NEXUM Intelligence — a marketing website **plus** a post-login business platform
("digital venture & management team"). A business owner connects/enters their
data; AI agents (one per module) produce analyses and artifacts, generate daily
tasks and alerts, and the owner manages operations (CRM, POS, inventory, finance…).

- Repo: `github.com/Nexum-Intelligence/WebApp` (branch `main`), auto-deployed by **Vercel**.
- Local path: `L:\AI-MASTER\projects\incubating\16-ionyx-framer-clone`
- Domain: `www.nexum-intelligence.com` (DNS at Hostinger → Vercel). Owner: luilrimola@gmail.com.
- Stack: **Vite 6 + React 19** SPA (custom hash-free router, no framework), **Vercel serverless** functions in `/api`, **Supabase** (Postgres + Auth + Storage). Package manager: pnpm. Node type: module (ESM).

## Repo map
- `src/App.jsx` — the ENTIRE app (marketing pages + the platform cockpit). Very large (~3600+ lines). Most platform code lives here.
- `src/modules.js` — data model: SUITES + modules (31), PACKAGES, COMPANY_SECTIONS, COLLECTIONS (operations), CONNECTORS, PHASES, INDUSTRIES (+ industryConfig/opLabel/fieldLabel/kpiLabel/FIELD_OVERRIDES/KPI_OVERRIDES), moduleCategory.
- `src/styles.css` — all styles (`.plat-*` prefix for platform).
- `src/supabase.js` — browser Supabase client + a `window.fetch` patch that attaches the user's access token to `/api/*` calls. Gated by `supabaseEnabled` (VITE env present).
- `src/content.js`, `src/i18n.jsx` — marketing content + i18n (EN/DE; ES/FR fall back to EN).
- `api/*.js` — serverless: `lead.js`, `records.js` (CRUD company_records), `company.js` (profile), `module-run.js` (queue insert/GET/PATCH + injects context), `context.js` (structured business context), `agent-chat.js`. All verify the caller's token via `lib/auth.js` and scope to that email (fall back to provided email when no token, so n8n/worker still works).
- `lib/context.js` — `buildContext(email)` → structured text + JSON of profile + live KPIs. `lib/auth.js` — `authedEmail(req)`.
- `agent-worker/` — standalone Node service (Claude Agent SDK) that REPLACES n8n: polls `module_runs`, runs per-module Skills with subagents (`researcher`/`analyst`/`quality`) + WebSearch/WebFetch + MCP connectors, writes results back, stores artifact files. `catalog.json` gives every module a matched skill. Needs a host (Railway/Fly/VM) + `ANTHROPIC_API_KEY`.
- `claude-desktop/` — the SIMPLER alternative the owner prefers: a Supabase MCP config + a `nexum-agent` Claude Skill so **Claude Desktop reads/writes the Supabase DB directly** and runs modules on demand (no hosted worker). See `claude-desktop/README.md`.
- `PLATFORM-SETUP.md` — all Supabase SQL, env vars, storage, auth, worker/MCP setup. **Primary setup reference.**

## Supabase schema (SQL in PLATFORM-SETUP.md)
- `leads` (readiness form), `company_profiles` (one row/email, `data` jsonb), `company_records` (one row/record: `email, kind, data`; kinds: customers, products, inventory, suppliers, purchases, sales, transactions, campaigns, staff, tasks, notifications, artifacts, connectors), `module_runs` (`status queued|running|needs_input|done|error`, `inputs`, `questions`, `result`), `agent_messages`. Storage bucket `artifacts`.

## What already works (don't rebuild)
- Platform cockpit at `/platform`: sidebar nav, Overview (money KPIs from `/api/context` + agent "Recommended for you" + industry hint + agent constellation of robots), Phases, Daily Tasks.
- **Industry at sign-up** drives vocabulary + which Operations tabs show + field/KPI labels (gastro, hotel, doctor, lawyer, services, product, digital, artist, other).
- Operations tabs (read + manual entry OR connector import): Customers(CRM), Products(POS, with ingredient recipe → cost/margin), Inventory, Suppliers, Purchasing (Receive → stock+expense), Sales(POS) (sale → income + stock down), Finance (computed KPIs + bar chart), Income&Expenses, Marketing, Staff. NO invoice-writing (owner's decision).
- Company Profile = ONE questionnaire (all sections, optional, with "connect data = live" hint + research auto-fill).
- 31 agent modules in suites; result-first module view (editable result + collapsible pre-filled inputs + Generate/Regenerate); live vs artifact categories.
- **Clarification loop**: agent can return `questions` → run `needs_input` → UI shows dynamic question form → answers written to `inputs.answers` → re-queued → agent finalises.
- Notifications bell + alerts; agent chat (floating); Connectors; Subscription (plan cards).
- Structured context injected into every run and chat.
- Real Supabase Auth (email/password + Google + Microsoft OAuth) with token-verified tenant isolation; falls back to a local mock when VITE env vars are absent.

## Important constraints / gotchas
- `src/App.jsx` is one giant file — grep before editing; keep the `.plat-*` CSS convention.
- Cannot run a full `vite build` in this editor env (node_modules were pnpm-installed on Windows; sandbox lacks Linux binaries). **Verify syntax** with esbuild transform instead, e.g. `esbuild.transform(fs.readFileSync('src/App.jsx'),{loader:'jsx'})`.
- `pnpm-workspace.yaml` contains placeholder junk (`allowBuilds: esbuild: set this to true or false`). It has built OK so far, but consider replacing with valid `onlyBuiltDependencies: [esbuild]` if a build fails.
- `agent-worker/` can't run here (needs `ANTHROPIC_API_KEY` + `npm install` + a host). Its SDK message extraction is defensive; adjust `runAgent()` if a future SDK changes message shape. MCP connector→server mappings in `agent-worker/mcp.mjs` are scaffolds.
- API tenant isolation prefers the verified JWT email; this is security-sensitive and was NOT live-tested — verify after deploy.
- Git pushes: use the owner's local credentials / GitHub Desktop. A GitHub PAT was leaked in an earlier chat and should be revoked.

## Open items / next steps (priority order)
1. **Deploy pending changes**: `git add -A && git commit -m "…" && git push` (Vercel auto-builds).
2. **Make real login work** (current blocker the owner hit): set Vercel env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY` (plus existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). In Supabase Auth: enable Email (turn OFF "Confirm email" for testing), enable Google + Azure providers with their OAuth client id/secret + the Supabase callback URL, and add `https://www.nexum-intelligence.com` to redirect URLs. Create a public Storage bucket `artifacts`. Create all tables from PLATFORM-SETUP.md. Then test sign up / sign in / OAuth and tenant isolation in incognito.
3. **Decide the agent runtime**: Claude Desktop + Supabase MCP (owner's preference, on-demand) vs the hosted `agent-worker` (24/7). Wire whichever is chosen end-to-end and test the clarification loop (queue → needs_input → answers → result) and artifact file storage.
4. **Author high-quality per-module skills** (currently catalog-generated + a few hand-written: daily-tasks, decision, chat, _generic). Prioritise business-plan, financial-planning, SWOT, go-to-market, decision.
5. **PDF export** of artifacts (worker currently stores Markdown in Storage).
6. **Deepen industry language** (more FIELD_OVERRIDES/KPI_OVERRIDES per tab) and add Overview charts (revenue/profit over time).
7. **Mobile version** (owner said it follows later).
8. Harden: strict RLS policies, email confirmation + password reset, audit log, real connector→MCP wiring.

## How to work
- Prefer small, verifiable edits. After editing `src/App.jsx` or `src/modules.js`, run the esbuild syntax check. Keep changes consistent with existing patterns (data-driven via `modules.js`; `.plat-*` CSS).
- When adding a module/collection/industry, edit `modules.js` (and `agent-worker/catalog.json` for the worker) — no bespoke components needed for generic CRUD.
