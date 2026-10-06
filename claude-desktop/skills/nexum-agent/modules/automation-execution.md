# Automation & Execution (`automation-execution`)

## Goal
Turn a recurring process into a documented, automatable workflow: what triggers it,
which systems move which data, what can run unattended, where a human must approve —
plus an implementation plan with effort, cost and a measurable time/€ saving.

## Inputs to use
- `run.inputs`: `processToAutomate` (required), `systems` (tools involved), `frequency`
  (Daily/Weekly/Monthly/Ad hoc), `successMetric`.
- `profile`: industry, size, `team.keyRoles`, `basics.description`.
- `context.text` + `nexum_records`: volumes that size the automation — `sales` per day,
  `purchases` per month, `customers` (new leads/month), invoices per month, `tasks`
  (recurring manual tasks), `staff` (`salary` → hourly cost = monthly cost / 165 h).
- Platform connectors (POS, accounting, shop, e-mail) mentioned in `retrieved`: reuse
  them as data sources; the platform imports via n8n.

## Ask first if…
Ask (only if `run.answers` is empty) when the process description is under ~15 words
or unclear on: (1) current steps and who does them, (2) time per run, (3) systems /
whether they have an API or export, (4) data-protection constraints (patient or client
data). Max 4 questions. Otherwise proceed and state assumptions.

## Research
Check the named systems for APIs, webhooks and native integrations (e.g. orderbird,
Lexoffice, sevDesk, DATEV, Shopify, Doctolib, RA-MICRO, Apaleo, Google Workspace, M365)
and n8n/Make/Zapier nodes. Check GDPR/DSGVO points for health or legal data (AVV,
hosting in EU, § 203 StGB for professional secrecy). Cite docs links.

## Method
1. **As-is map**: numbered steps, actor, system, input → output, time per step,
   errors/rework. Compute `hours/month = time per run × runs/month`.
2. **Classify each step**: Automate (rules-based, structured data), Assist (AI drafts,
   human approves), Keep manual (judgement, relationship, legal signature).
3. **To-be workflow**: trigger → steps → outputs, with the tool per step. Prefer
   existing systems and the platform's n8n; avoid new subscriptions unless ROI clear.
4. **Data & controls**: fields moved, source of truth, error handling (retry, alert to
   owner), approval gates, logging, access rights, GDPR basis.
5. **ROI**: `saving/month = hours saved × hourly cost + error cost avoided`;
   `payback = (setup hours × rate + tool cost) / (saving − running cost)`.
   Default rate for external setup 90 €/h (estimate).
6. **Implementation plan**: phases (pilot one case → parallel run 2 weeks → switch-over),
   owner, effort, done-criteria. Define the success metric with baseline and target.
7. **Automated task list**: the recurring tasks the system will create/execute, with
   frequency and responsible role.
Typical SME candidates: invoice reminders (Mahnwesen), reorder proposals from low stock,
daily POS-to-accounting sync, appointment reminders (medical), mandate intake (law),
review requests after visits (gastro/hotel), lead follow-ups.

## Output skeleton
`## Automation Plan – <company>` + 2–3 sentence summary (process, saving, payback).
### Current process
| # | Step | Who | System | Time | Problem |
### Target workflow
| # | Step | Mode (Auto/Assist/Manual) | Tool | Trigger / rule | Output |
Optional Mermaid flowchart in a code block.
### Data, controls & compliance
### ROI
| Item | Value | Basis |
### Implementation plan
| Phase | Activities | Owner | Effort | Done when |
### Automated tasks
| Task | Frequency | Trigger | Responsible |
### Next steps
(`lang=de`: Ist-Prozess, Soll-Workflow, Daten, Kontrollen & Compliance, ROI,
Umsetzungsplan, Automatisierte Aufgaben, Nächste Schritte.)

## Quality bar
- Each automated step names a concrete tool and trigger; no vague "use AI".
- Human approval kept for money out, legal/medical communication and deletions.
- Saving is computed from real volumes/staff cost where available.
- Workflow documentation is detailed enough for an n8n builder to implement.

## Tasks & alerts
- Tasks: pilot setup (high), collect API keys/access from the tool vendor — owner does
  this, never put keys in the result (medium), define baseline metric (medium).
- Saving ≥ 500 €/month → alert `recommendation`, impact "+<x> €/month", link
  `module:automation-execution`.
- Sensitive data (patient/client) in workflow without EU hosting/AVV → `warning`.
