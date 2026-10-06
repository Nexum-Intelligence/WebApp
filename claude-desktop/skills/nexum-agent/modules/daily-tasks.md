# Daily Tasks (`daily-tasks`)

## Goal
Each day, give the owner the 3–6 actions with the highest € impact × urgency, derived
from their live data — concrete enough to do today, without duplicating tasks that are
already open. The deliverable is the task list; the Markdown is a short rationale.

## Inputs to use
- `context.text`: low stock, overdue/open invoices, open purchase orders, pipeline,
  product margins, marketing, open tasks, profit trend.
- `nexum_records`:
  - `tasks` → `title`, `priority`, `done`, `source` — open = `done` false. Read first.
  - `inventory` → `stock`, `reorder`, `unitCost`, `supplier`.
  - `purchases` → `status` (Ordered), `expected`, `supplier`, `itemName`, `qty × unitCost`.
  - `customers` → `stage` Lead/Qualified, `value`, `notes` (no follow-up noted).
  - `products` → `price`, `cost` (margin); `sales` → top products, recent volumes.
  - `campaigns` → active/none; `suppliers` → `leadTime`.
  - invoices (`total`, `status`, `due`) from `context` or `nexum_records(email,'invoices')` if available.
- Unanswered agent alerts and recent results in `retrieved` / `previous_result`.
- `profile`: empty fields count as profile gaps.

## Ask first if…
Never ask. Work with available data; if data is thin, tasks become "add data" tasks.

## Research
None. (Only if a task depends on a dated external fact, e.g. a tax deadline this week —
then one check, cited.)

## Method
1. **Collect candidates** with rules and € impact:
   | Signal | Candidate task | € impact |
   |---|---|---|
   | `stock ≤ reorder` (0 = urgent) | Reorder <item> from <supplier> | daily revenue of affected products × days until refill |
   | invoice unpaid and `due < today` | Send reminder for invoice <customer> | open amount |
   | purchase `Ordered` and `expected < today` | Chase delivery of <item> from <supplier> | value of blocked sales |
   | Lead/Qualified with value, no recent contact | Call <lead> about <offer> | value × win probability (Lead 10 %, Qualified 30 %) |
   | product margin below industry target | Raise price / recost <product> | margin gap × monthly units |
   | no active campaign | Launch <channel> campaign for <best product> | est. leads × avg value |
   | critical/warning alert not acted on | Act on alert "<title>" | alert impact |
   | key profile gaps (industry, offer, target customer) | Complete <section> in profile | enabler (low €, small effort) |
   | finished deliverable with unchecked next steps | Do step from <module> | as stated |
2. **Score**: `score = € impact (normalised 1–5) × urgency (1–5)`; urgency 5 = today/
   overdue, 4 = this week, 3 = within lead time, 2 = this month, 1 = someday. Effort
   tie-breaker: quicker first.
3. **De-duplicate**: drop a candidate if an open task has the same object (item,
   customer, invoice, product) and intent, even with different wording. Merge similar
   ones ("Reorder 3 items from Metro" instead of three tasks).
4. **Select 3–6**: highest scores; max 2 tasks of the same type; at least one revenue-
   generating task if any exists.
5. **Write titles**: verb first, object, key number, ≤ 70 characters, in `run.lang`.
   Good: "Reorder 20 kg mozzarella from Metro (2 days left)". Bad: "Inventory".
   Priority: score ≥ 16 high, 8–15 medium, else low.

## Output skeleton
`## Today's priorities – <company>` + one sentence (number of tasks, € at stake).
### Why these tasks
Numbered list, one line each: task → reason with the number (stock, days, €).
### Skipped
One line: duplicates of open tasks or lower-scored candidates (optional).
(`lang=de`: Heutige Prioritäten, Warum diese Aufgaben, Übersprungen.)

`tasks` argument example:
`[{"title":"Send reminder for invoice Müller GmbH (1.240 €, 18 days late)","priority":"high"},
{"title":"Reorder oat milk from Metro (stock 4 l, lead time 2 d)","priority":"high"},
{"title":"Call lead Praxis Weber about maintenance plan (4.800 €)","priority":"medium"}]`
`summary`: "4 tasks, ~7.300 € at stake today".

## Quality bar
- 3–6 tasks, each tied to a specific record and number; no generic advice.
- Zero duplicates of open tasks; titles ≤ 70 chars, action-first.
- Markdown ≤ 15 lines; use industry words (guests, patients, clients, mandates).
- Never invent customers, items or amounts.

## Tasks & alerts
- `tasks`: the 3–6 selected tasks (max 5 are passed per call — if 6, merge the two
  lowest into one).
- Alerts only for new urgent signals not already alerted: stock = 0 on a selling item →
  `critical` (`collection:inventory`); invoice > 30 days overdue → `warning` (`finance`);
  purchase > 3 days late → `warning` (`purchasing`). Otherwise pass `null`.
