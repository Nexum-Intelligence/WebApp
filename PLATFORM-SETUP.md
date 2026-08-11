# NEXUM Platform — setup (frontend + DB)

The post-login platform lets a business owner open a **module**, fill out its
tasks, and submit. Submitting writes one row to the Supabase table
`module_runs`. **That INSERT is the trigger line that starts the agentic
workflow in n8n.** This app only does the frontend + the DB write; the agent
logic lives in n8n.

## 1. Frontend (already built)

- Route: `/platform` (the header "PLATFORM" button links here).
- Data model: `src/modules.js` — 8 suites, their agent modules (with input
  tasks + deliverables), and the 7 customer packages from the pricing PDF.
- UI: `PlatformPage` in `src/App.jsx` — sign-in gate, suites/modules grouped,
  suites locked/unlocked by the selected plan, a module form modal, and a
  "Your module runs" history list.
- Serverless: `api/module-run.js` — `POST` inserts a run, `GET ?email=` lists a
  user's runs. Degrades gracefully (works even before Supabase is configured).

> Note: login is currently a lightweight mock (name + email stored in the
> browser). Swap for Supabase Auth when you want real accounts + per-user RLS.

## 2. Supabase table

Run this in Supabase → SQL editor:

```sql
create table if not exists public.module_runs (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  email        text not null,
  name         text,
  company      text,
  package_key  text,
  suite_key    text,
  module_key   text not null,
  module_name  text,
  inputs       jsonb not null default '{}'::jsonb,
  status       text  not null default 'queued',   -- queued | running | done | error
  result       jsonb,                              -- agent writes deliverables here
  lang         text,
  source       text default 'platform'
);

create index if not exists module_runs_email_idx
  on public.module_runs (email, created_at desc);
```

The serverless function uses the **service_role** key, so Row Level Security
is bypassed server-side. If you later expose the table to the browser client,
add RLS policies (e.g. `email = auth.jwt() ->> 'email'`).

### Company profile table

The cockpit's **Company data** tabs (Basics, Product, Customers, Marketing,
Finance, Team, Goals) are saved here — one row per user — and passed to every
module run as context (`inputs._company`), so agents share the same business
knowledge:

```sql
create table if not exists public.company_profiles (
  email       text primary key,
  name        text,
  company     text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
```

`api/company.js` upserts on the `email` primary key
(`Prefer: resolution=merge-duplicates`).

### Operational records table (CRM / POS / Finance / Marketing)

The **Operations** tabs — Customers (CRM), Products (POS), Income & Expenses,
Marketing — are generic CRUD tables. Every collection lives in one table,
keyed by `kind` (`customers` | `products` | `transactions` | `campaigns`):

```sql
create table if not exists public.company_records (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  email       text not null,
  kind        text not null,
  data        jsonb not null default '{}'::jsonb
);

create index if not exists company_records_email_kind_idx
  on public.company_records (email, kind, created_at desc);
```

Served by `api/records.js` (GET list, POST insert, PATCH update, DELETE).
Kinds in use: `customers`, `inventory`, `products`, `sales`, `transactions`,
`campaigns`, `tasks`, `connectors`.

**POS / Warenwirtschaft:** `inventory` items carry `unitCost` + `stock`.
`products` carry a `recipe` (`[{ itemId, qty }]`) referencing inventory ids, so
product **cost** = Σ(qty × item unitCost) and **margin** = price − cost. Recording
a sale (Sales POS) writes a `sales` row (revenue/cost/profit), books an income
`transactions` row, and decrements the recipe's inventory `stock`.

`api/module-run.js` also accepts `PATCH { id, email, result }` so a user can edit
and save a module's result/artifact.

### Agent chat table

The floating agent chat (bottom-right robot button) stores its conversation here:

```sql
create table if not exists public.agent_messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  email       text not null,
  role        text not null,          -- user | assistant
  content     text not null
);
create index if not exists agent_messages_email_idx
  on public.agent_messages (email, created_at asc);
```

`api/agent-chat.js` stores each message and, if `N8N_CHAT_URL` is set, forwards
`{ email, message, context }` to n8n and returns `{ reply }`. Without it, a
graceful stub reply is used.

### Phases, artifact categories, live modules & daily tasks

- **Phases** view walks the 5 NEXUM phases (Analysis → Execution); each module is
  tagged **Analysis** / **Artifact** / **Live**.
- **Artifact/Analysis modules** produce a deliverable per run (`module_runs`).
- **Live modules** (Business Operations, Predictive, Opportunity & Risk,
  Decision) update continuously — n8n should keep their latest `module_runs.result`
  fresh rather than waiting for a manual run.
- **Daily Tasks**: the "Generate today's tasks" button posts a `module_runs` row
  with `module_key = 'daily-tasks'`. Your Decision agent reads the business data
  and writes the day's tasks into `company_records` with `kind = 'tasks'`
  (`data = { title, priority, done, source }`). The UI lists and checks them off.

### Research auto-fill

The **Company Basics** tab has a "research agent" card: the owner enters
website + location, which POSTs a `module_runs` row with
`module_key = 'company-research'`. Your n8n research agent picks that up,
researches the company (products, name, shareholders, financials) and writes
the findings back into `company_profiles.data` — which then pre-fills the
profile and every module.

## 3. Environment variables (Vercel → Settings → Environment Variables)

Reuses the same Supabase project as the readiness lead form:

```
SUPABASE_URL                 https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY    (Supabase → Project Settings → API → service_role)
```

## 4. n8n — start the agent on insert

Point n8n at the `module_runs` insert:

1. **Supabase → Database → Webhooks** → create a webhook on `INSERT` into
   `public.module_runs`, targeting your n8n Production webhook URL.
   (Alternatively use n8n's **Supabase Trigger** node.)
2. In n8n, read the new row (`module_key`, `inputs`, `email`, …), run the
   matching agent, and write results back:
   - set `status = 'running'` when it starts,
   - set `status = 'done'` and fill `result` when finished (or `'error'`).
3. The platform's run list reflects `status` on the next page load, so the
   business owner sees Queued → Running → Completed.

## 5. Module ↔ suite ↔ package map

- Packages unlock suites cumulatively (Venture Starter → … → Enterprise+).
- The user's plan is stored in the browser (`nexum_pkg`) for now; wire it to the
  real purchased plan once billing exists.
- Everything is data-driven in `src/modules.js` — add a module by adding an
  object with `fields` (task inputs) and `deliverables`; no other code changes
  needed.
