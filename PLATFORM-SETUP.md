# NEXUM Platform — Setup

The platform behind `/platform` is a Vite/React SPA with Vercel functions in
`/api` and Supabase (Postgres + Auth + pgvector + Edge Functions). AI work is done
by a **scheduled Claude automation** that reads and writes Supabase through the
`nexum_*` SQL functions.

```
Browser ──JWT──► /api/* (Vercel) ──service role──► Supabase Postgres
                                                     │ triggers → knowledge_chunks
                                                     │ Edge Function `embed` (gte-small vectors)
Claude automation (Supabase MCP + nexum-agent skill) ┘ claims jobs, writes results
UI polls /api → shows status, questions, results, tasks, alerts, chat replies
```

Details: `design/02-agent-data-flow.md`. Decisions: `DECISIONS.md`.

## 1. Supabase

### 1.1 Database (two migrations, in order)

Supabase → SQL editor → run
`supabase/migrations/20261006000000_nexum_core.sql`, then
`supabase/migrations/20261007000000_nexum_ops_billing.sql` (or `supabase db push`).
Both are idempotent and work on a fresh project and on the old tables. The first creates:

- tables `company_profiles`, `company_records`, `module_runs`, `agent_messages`,
  `knowledge_chunks` (pgvector, 384 dims)
- RLS on all tables (users may only *read* their own rows; all writes go through
  the API with the service role); old `"own rows"` policies are replaced
- triggers that keep `knowledge_chunks` in sync (connector secrets, alerts and
  artifact links are never embedded) and backfill existing data
- the automation interface `nexum_claim_next`, `nexum_ask`, `nexum_complete`,
  `nexum_fail`, `nexum_pending_chats`, `nexum_reply_chat`, `nexum_search`,
  `nexum_records`, `nexum_match_chunks` — executable only by `service_role` /
  `postgres` (the MCP connection)

The `leads` table of the readiness form (READINESS-SETUP.md) also gets RLS enabled.

The second adds:

- `nexum_record_sale` / `nexum_receive_purchase` — POS sale (sale + income + stock) and
  goods receipt (status + stock + weighted average cost + stock purchase) as single
  transactions, used by `/api/ops`
- `subscriptions` — the tenant's plan (written by the Stripe webhook or by you)
- `audit_log` — every change to tenant data with the actor (user, integration or
  agent); shown under Activity → Change history; connector secrets are never logged
- `nexum_schedule_recurring` — daily "Daily Tasks" for active tenants and a Monday
  refresh of live modules (scheduled in 1.3)

### 1.2 Embeddings (Edge Function)

```
supabase functions deploy embed --no-verify-jwt
```

`supabase/functions/embed` computes embeddings with Supabase's built-in
`gte-small` model (no external API key) and attaches the most relevant knowledge
to new jobs and chat messages. It only accepts the service role key (or an
optional `NEXUM_EMBED_KEY` function secret) as Bearer token.

Then run `supabase/setup/embed-cron.sql` once (fill in project URL + the
**service_role** key — under "Legacy API keys" in newer dashboards). It calls the
function every minute when there is pending work. The API additionally triggers
it right after each write.

### 1.3 Recurring runs

Run `supabase/setup/schedules.sql` once (pg_cron, daily 05:30 UTC).

### 1.4 Auth

Authentication → Providers:

1. **Email**: enable. For production turn **Confirm email ON** (tenants are keyed
   by email — without confirmation someone could register an address they don't own).
2. **Google** and **Azure (Microsoft)**: enable with OAuth client ID/secret; add the
   Supabase callback URL shown there to the Google/Azure app.
3. URL Configuration: Site URL `https://www.nexum-intelligence.com`; Redirect URLs
   `https://www.nexum-intelligence.com/platform` and
   `https://www.nexum-intelligence.com/platform?reset=1` (password reset), plus
   `http://localhost:5173/**` for local work.

The UI supports sign-up, sign-in, Google, Microsoft, password reset
("Forgot your password?" → email → set new password) and sign-out.

## 2. Vercel environment variables

| Variable | Where from | Used by |
|---|---|---|
| `SUPABASE_URL` | Project Settings → API | API |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API (service_role, secret!) | API |
| `SUPABASE_ANON_KEY` | Project Settings → API (anon/publishable) | API — verifies user tokens |
| `VITE_SUPABASE_URL` | same as `SUPABASE_URL` | browser (build time) |
| `VITE_SUPABASE_ANON_KEY` | same as `SUPABASE_ANON_KEY` | browser (build time) |
| `NEXUM_INTERNAL_KEY` | any long random string (`openssl rand -hex 32`) | server-to-server calls with `x-nexum-key`; also lets you set plans manually |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (`sk_live_…` / `sk_test_…`) | **turns billing on** — without it every tenant has all suites (beta) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → endpoint secret (`whsec_…`) | verifies `/api/stripe-webhook` |
| `PUBLIC_SITE_URL` | `https://www.nexum-intelligence.com` | Checkout return URLs |

Redeploy after changing `VITE_*` (they are baked into the build).

**Important:** once `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set, every
`/api` call needs a signed-in user (or the internal key). If the `VITE_*`
variables are missing, the UI falls back to the local demo login and the API
answers 401 — so set all five together.

## 3. Billing (Stripe)

1. Set `STRIPE_SECRET_KEY` (start with the test key) and `PUBLIC_SITE_URL`.
2. Stripe → Developers → Webhooks → add endpoint `https://www.nexum-intelligence.com/api/stripe-webhook`
   with events `checkout.session.completed`, `invoice.paid`,
   `customer.subscription.updated`, `customer.subscription.deleted`; put the signing
   secret into `STRIPE_WEBHOOK_SECRET`.
3. Prices come from `PACKAGES` in `src/modules.js` (once or yearly) — the browser never
   sends a price. Paid → `subscriptions` row → suites unlock (the module start is checked
   on the server, `402` otherwise). "Daily Tasks" and "Company Research" are always free.
4. Set a plan by hand (offline invoice, trial):
   `curl -X PATCH https://www.nexum-intelligence.com/api/billing -H "x-nexum-key: $NEXUM_INTERNAL_KEY" -H "Content-Type: application/json" -d '{"email":"kunde@firma.de","packageKey":"growth","periodEnd":"2027-12-31"}'`

Extra runs ("3 extra runs for …") are not metered yet.

## 4. Claude automation

See `claude-desktop/README.md`: connect the Supabase MCP (or connector), add the
`nexum-agent` skill, create a scheduled task with `claude-desktop/AUTOMATION-PROMPT.md`.

## 5. Acceptance test after deploy (incognito)

1. Sign up with a new address → confirm email → sign in.
2. Add a supplier/customer → it appears; Supabase: a row in `company_records` and
   (within a minute) a `knowledge_chunks` row with an embedding.
3. Start a module (e.g. SWOT) → status "Queued".
4. Run the automation once → status "Running" → questions or result appear
   without reloading; a task in Daily Tasks; an alert in the bell; Download .md / PDF work.
5. Sign in with a second account → none of the first account's data is visible.
6. `curl https://www.nexum-intelligence.com/api/records?kind=customers&email=<first account>`
   → **401**.
7. `curl "$SUPABASE_URL/rest/v1/company_records" -H "apikey: <anon key>"` → `[]`.

## 6. Local development and tests

- `pnpm dev` — app only; without `VITE_*` env the platform runs in demo mode.
- `pnpm dev:full` — app **and** `/api` functions on one origin (reads `.env.local`).
- Tests (see `tests/README.md`): `pnpm test` (unit), `pnpm test:db` (SQL, needs
  Docker), `pnpm test:e2e` (API → Postgres/PostgREST → automation interface).

## 7. Data reference

`company_records.kind`: `customers, products, inventory, suppliers, purchases,
sales, transactions, invoices, campaigns, staff, tasks, notifications, artifacts,
connectors`.

- **POS:** `inventory` items carry `unitCost` + `stock`; `products` carry a `recipe`
  (`[{ itemId, qty }]`) → cost and margin. A sale writes `sales`, books an income
  `transactions` row and lowers stock.
- **Finance:** profit = income − expenses − cost of goods sold. Stock purchases
  (`transactions.category = "Purchasing"`) are shown separately and are not an
  expense — their cost counts when the goods are sold. Staff cost is the monthly
  cost of active staff.
- **tasks** `{ title, priority, done, source, run_id? }`;
  **notifications** `{ severity, title, message, impact?, link?, read }` (`link` is a
  view key such as `finance` or `module:predictive`);
  **artifacts** `{ module_key, title, format:'md', run_id, summary }` — the content
  lives in `module_runs.result.markdown` and is downloaded as `.md` or printed to PDF.
- **Connectors:** secrets are masked in API responses (`••••1234`) and kept when a
  masked value is sent back. They are never embedded, logged or given to the automation.
  - **Stripe:** "Sync now" imports paid charges (minus refunds) as income (`externalId` = charge id, no duplicates).
  - **HubSpot:** "Sync now" imports contacts as customers (private app token, scope `crm.objects.contacts.read`).
  - **Google Sheets:** sheet shared as "anyone with the link can view" → "Import now" → column mapping → import.
  - **CSV / Excel:** upload a CSV (`;` or `,`, German number formats) into any operations table.
  - **POS / DATEV:** no direct API yet — export CSV and use the CSV import.
- **Plans:** `subscriptions` table; checked on the server when a module is started.
