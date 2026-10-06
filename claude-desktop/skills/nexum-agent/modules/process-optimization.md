# Process Optimization (`process-optimization`)

## Goal
Map one named process end-to-end, find the bottleneck and waste, quantify the
saving in hours and €, and hand over a target process plus 1–3 SOPs the team can
use from Monday. Lean and pragmatic for SMEs — no ISO bureaucracy.

## Inputs to use
| Source | Use |
|---|---|
| `inputs.process` (required) | Process scope: trigger → end result (e.g. "from table order to payment", "patient check-in", "new mandate intake", "order to delivery"). |
| `inputs.painPoints` | Symptom list → hypotheses for waste and bottleneck. |
| `inputs.goal` | Optimisation target: time, cost, errors, customer experience. |
| `nexum_records(email,'staff')` → `role, department, employment, salary, status` | Roles in swimlanes; hourly cost = monthly `salary` / 160 (part-time / 80). |
| `nexum_records(email,'suppliers')` → `leadTime, reliability, category` | Supply-side steps; lead time variability. |
| `nexum_records(email,'purchases')` → `status, expected, qty, unitCost` | Order-to-receipt delays (overdue POs). |
| `nexum_records(email,'inventory')` → `stock, reorder` | Stock-outs as process failures. |
| `nexum_records(email,'sales')` → `date, qty` | Demand per hour/day → load peaks. |
| `nexum_records(email,'tasks')` | Recurring manual tasks = automation candidates. |
| `nexum_search(email,'<process words>',10)` | Existing SOPs, checklists, notes. |

Formulas:
- Lead time = Σ (process time + wait time) per unit; **flow efficiency** = value-adding
  time / lead time.
- Cycle time per step = available time / units done; **takt time** = available time /
  customer demand (e.g. 240 min lunch service / 80 covers = 3 min per cover).
  Bottleneck = step with cycle time > takt time or the longest queue.
- **OEE-lite** (for equipment/rooms/chairs) = availability × performance × quality,
  e.g. treatment room used 6 of 8 h (0.75) × 90 % planned pace × 98 % no rework.
- First-pass yield = units right first time / all units; error cost = rework h × hourly cost.
- Saving €/year = hours saved per week × hourly cost × 46 working weeks.
- Supplier lead time reliability = on-time receipts / all receipts.

## Ask first if…
- Process boundaries unclear →
  `{"key":"scope","label":"Where does the process start and end (trigger → result)?","type":"text"}`
- No volumes or times anywhere →
  `{"key":"volumes","label":"How often does it run (per day/week) and roughly how long does one run take?","type":"text"}`
- Roles unknown and no staff records →
  `{"key":"roles","label":"Who is involved in the steps (roles)?","type":"text"}`
Otherwise estimate step times from industry norms, mark them "(estimate)", and put
"measure for 1 week" as the first task.

## Research
- Industry standards relevant to the process: hygiene/HACCP for gastro, GoBD for
  bookkeeping, DSGVO for patient/client data, KassenSichV for POS — cite official
  sources (e.g. https://www.gesetze-im-internet.de).
- Tool options only if automation is proposed (booking, POS, DMS, e-invoicing
  XRechnung/ZUGFeRD), with price ranges and links.
- Method references if helpful: SIPOC (https://asq.org/quality-resources/sipoc),
  value stream mapping (https://www.lean.org/lexicon-terms/value-stream-mapping/).
- Do not research generic Lean theory in depth.

## Method
1. **SIPOC:** Suppliers, Inputs, Process (5–7 high-level steps), Outputs, Customers.
2. **As-is map:** swimlane table — step, role, tool, process time, wait time,
   hand-off, error rate.
3. **Value-stream analysis:** classify each step VA / NVA-necessary / waste;
   name the 8 wastes (TIMWOODS: transport, inventory, motion, waiting,
   overproduction, overprocessing, defects, skills).
4. **Bottleneck:** compare cycle time vs. takt; top 3 root causes (5-Whys).
5. **To-be process:** eliminate → simplify → standardise → automate (in that order).
6. **Improvement backlog:** ICE-scored, with € saving and effort.
7. **SOPs (1–3):** purpose, scope, roles, steps (numbered, ≤ 12), checks, tools,
   time per step, owner, review date.
8. **KPIs:** lead time, flow efficiency, error rate, cost per run — baseline and target.

## Output skeleton
Translate headings and table headers when `lang=de`.
```
## Process optimization – <Process> – <Company>
<executive summary: bottleneck, saving h/€ per year, top 3 changes>
### SIPOC
| Suppliers | Inputs | Process | Outputs | Customers |
### As-is process map
| # | Step | Role | Tool | Process time | Wait time | Value (VA/NVA/Waste) | Issue |
### Bottleneck analysis
| Step | Cycle time | Takt time | Queue/wait | Root cause (5-Whys) |
### To-be process
| # | Step | Role | Change | Time after | Saving |
### Improvement backlog
| # | Measure | Impact | Confidence | Ease | ICE | Saving €/yr | Effort | Owner |
### SOP: <name>
| Step | Action | Responsible | Check / standard | Time |
### KPI targets
| KPI | Formula | Baseline | Target | Measured how |
### Next steps
```

## Quality bar
- [ ] Process uses the owner's words and industry terms; roles match staff records.
- [ ] Every time/saving is labelled measured, owner-stated or estimate.
- [ ] Saving calculation shown with hourly cost basis.
- [ ] SOPs are executable by a new employee without extra explanation.
- [ ] Legal/compliance steps are kept, never "optimised away".

## Tasks & alerts
Tasks (max 5): "Measure process times for 1 week" (high if estimates were used),
"Pilot to-be step <x>" (high), "Introduce SOP <name> and train team" (medium),
"Review KPIs after 30 days" (low).
Alerts:
- Overdue purchase orders or supplier reliability Poor in the process → `warning`,
  link `collection:suppliers`.
- Recurring stock-outs (≥ 2 items ≤ reorder) → `warning`, link `collection:inventory`.
- Saving potential > 5.000 €/year → `recommendation` with impact in €.
- Flow efficiency < 10 % → `info`.
