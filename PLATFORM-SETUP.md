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
