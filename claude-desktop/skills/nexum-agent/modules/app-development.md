# App & Tech Blueprint (`app-development`)

## Goal
Turn the owner's app idea into a buildable blueprint: prioritised requirements, a
pragmatic tech spec, a database schema, and an MVP plan with effort and budget — so an
agency, freelancer or AI builder can start without another workshop.

## Inputs to use
- `run.inputs`: `idea` (required), `platform` (Web/iOS/Android/Cross-platform),
  `coreFeatures`.
- `profile`: industry, size, `customers.targetCustomer`, `product.mainOffer`,
  `finance.fundingStatus` (budget realism), `goals.goals12m`.
- `context.text` / `nexum_records`: existing data the app should reuse or integrate
  (customers, products, sales, inventory, staff) — field names from the platform's
  collections are good default column names.
- Volumes for sizing: customers count, sales per day, staff users.

## Ask first if…
Ask (only if `run.answers` is empty) when `idea` lacks: (1) primary user (staff,
customers, both), (2) must-have feature for launch, (3) budget range / build mode
(agency, freelancer, no-code, in-house), (4) systems to integrate (POS, booking,
accounting). Max 4. If the idea is clear enough, proceed with stated assumptions.

## Research
Competing/existing apps for the use case (could a SaaS solve 80 %? name it with
price), relevant APIs of the systems to integrate, platform rules (App Store review,
PWA as cheaper alternative), compliance (DSGVO, BFSG accessibility from 06/2025 for
consumer-facing services, medical data → MDR/no health data in US clouds, KassenSichV
for POS functions). Cite links.

## Method
1. **Build vs. buy**: one table comparing existing SaaS vs. custom; continue with
   custom only if differentiating or cheaper over 3 years.
2. **Requirements**: personas, user stories (`As <role> I want … so that …`) with
   MoSCoW priority and acceptance criteria; non-functional (performance, GDPR,
   availability, offline needs, languages DE/EN).
3. **Tech spec**: default stack for SMEs unless a reason speaks against it —
   React/Next.js (web) or React Native/Expo (cross-platform), Supabase (Postgres, Auth,
   Row-Level Security, Storage) in an EU region, serverless functions, n8n for
   integrations, Stripe/Mollie for payments. Architecture diagram (Mermaid), auth &
   roles, integrations, hosting, monitoring, backups.
4. **DB schema**: entities, relationships, key fields; every table has `id uuid`,
   `created_at`, owner/tenant column for RLS. Normalise to 3NF; JSONB only for flexible
   extras.
5. **MVP plan**: smallest version that proves value with real users in ≤ 8–12 weeks;
   sprints of 2 weeks; effort in person-days per epic; budget = days × rate (freelancer
   DACH ≈ 650–900 €/day, agency ≈ 900–1.300 €/day, label as estimate); running costs/month.
6. **Success metrics**: activation, weekly active users, time saved or revenue per user.

## Output skeleton
`## App Blueprint: <app name> – <company>` + 2–3 sentence summary.
### Build vs. buy
| Option | Covers | Cost (3 yrs) | Verdict |
### Requirements
| ID | User story | Priority (MoSCoW) | Acceptance criteria |
Non-functional requirements as a list.
### Tech spec
Stack table | Layer | Choice | Reason |, Mermaid architecture, roles & permissions, integrations.
### DB schema
| Table | Column | Type | Key / constraint | Description |
followed by a ```sql block with `create table` statements (uuid PKs, foreign keys,
`created_at timestamptz default now()`, RLS `enable row level security` + one example policy).
### MVP plan
| Sprint | Scope | Effort (PD) | Cost | Done when |
Running costs/month table, risks.
### Next steps
(`lang=de`: Kaufen vs. Bauen, Anforderungen, Technische Spezifikation, Datenbankschema,
MVP-Plan, Nächste Schritte.)

## Quality bar
- SQL is valid PostgreSQL and consistent with the schema table.
- Every Must story maps to at least one table/endpoint; nothing in MVP that isn't Must.
- Costs labelled as estimates with basis; no lock-in to exotic tech.
- GDPR/accessibility points concrete for the industry.

## Tasks & alerts
- Existing SaaS covers ≥ 80 % at lower 3-year cost → `recommendation` "Buy instead of
  build", impact = saving, link `module:app-development`.
- MVP budget > 50 % of yearly profit → `warning`, link `module:funding-finance`.
- Tasks: "Validate top 3 user stories with 5 users" (high), "Request 3 quotes with this
  blueprint" (medium), "Check funding (e.g. Digital Jetzt / Land programme)" (low).
