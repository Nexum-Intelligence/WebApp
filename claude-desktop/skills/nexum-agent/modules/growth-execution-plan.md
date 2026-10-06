# Growth Execution Plan (`growth-execution-plan`)

## Goal
Translate a growth focus into a prioritised, week-by-week execution plan the
owner can follow without a consultant: ranked initiatives (ICE), a roadmap for
the chosen horizon, a concrete weekly action plan and a KPI target table with
a North Star metric. Reuse existing strategy results instead of restarting.

## Inputs to use
| Source | Use |
|---|---|
| `inputs.focus` (required) | The growth lever (e.g. "more repeat guests", "B2B leads", "online shop sales"). |
| `inputs.horizon` (30 days / 90 days / 6 months) | Number of sprints: 4 / 12 / 26 weeks (6 months → monthly milestones + weekly detail for first 4 weeks). |
| `inputs.constraints` | Budget, team hours, seasonality, legal limits → caps the plan. |
| `retrieved` chunks from earlier `marketing-strategy`, `go-to-market`, `scaling-strategy` results | Reuse goals, channels and targets. |
| context FINANCE, CUSTOMERS, MARKETING, OPEN TASKS | Baseline numbers and current workload. |
| `nexum_records(email,'staff')` → `name, role, department, employment, status` | Owners for initiatives; capacity (part-time = 0.5). |
| `nexum_records(email,'tasks')` → `title, priority, done` | Avoid duplicates; include open high-priority tasks. |
| `nexum_records(email,'campaigns')` / `customers` / `sales` | Baselines for KPI targets. |

Formulas:
- Growth gap = target − baseline; required weekly growth = (target / baseline)^(1/weeks) − 1.
- ICE score = Impact × Confidence × Ease (each 1–10); rank descending.
- Capacity check: Σ initiative hours/week ≤ available hours (from constraints,
  default 5 h/week owner + 2 h per active staff in Marketing/Sales).
- Revenue impact = extra customers × AOV × gross margin.

## Ask first if…
- `constraints` empty and no staff records →
  `{"key":"capacity","label":"How many hours per week can you and your team invest?","type":"select","options":["< 3 h","3–10 h","10–20 h","> 20 h"]}`
- Focus has no measurable target →
  `{"key":"target","label":"What result would make this plan a success (number + date)?","type":"text"}`
Otherwise assume horizon = 90 days, budget = 300 €/month, target = +20 % on the
focus metric vs. current baseline; state it.

## Research
- Only what the chosen initiatives need: benchmark conversion/CPL for the
  primary channel, platform how-tos (e.g. Google Business Profile
  https://support.google.com/business/, Meta Business Help
  https://www.facebook.com/business/help), local events/seasonality for timing.
- Do not repeat full market research — link to earlier module results instead.

## Method
1. **Baseline:** 4–6 numbers relevant to the focus (with source).
2. **North Star metric** + 3 input metrics (e.g. NSM: repeat guests/month; inputs:
   newsletter sign-ups, review count, visits/week).
3. **Initiative backlog:** 8–12 ideas → ICE score → top 3–5 (quick wins first,
   1 high-impact project max per sprint).
4. **Roadmap:** phases (30/60/90 or months) with milestone + exit criterion each.
5. **Weekly sprints:** each week ≤ 3 actions, each with owner, hours, output
   ("definition of done"). Week 1 must be executable tomorrow.
6. **Review rhythm:** 15-min weekly check (KPI vs. target, done/not done, next
   week), monthly retro; rule: kill/scale an initiative after 4 weeks of data.
7. **Risks & dependencies:** max 5, with mitigation.

## Output skeleton
Translate headings and table headers when `lang=de`.
```
## Growth execution plan – <Company>
<executive summary: focus, target, horizon, top 3 initiatives>
### Baseline
| Metric | Current | Source |
### North Star & KPI targets
| KPI | Type (NSM/input) | Baseline | Target wk 4 | Target end | Formula |
### Prioritised initiatives (ICE)
| # | Initiative | Impact | Confidence | Ease | ICE | Hours/wk | Budget € | Owner |
### Execution roadmap
| Phase | Weeks | Milestone | Exit criterion |
### Weekly action plan
| Week | Action | Owner | Hours | Definition of done | KPI moved |
### Review rhythm
### Risks & dependencies
| Risk | Likelihood | Impact | Mitigation |
### Next steps
```

## Quality bar
- [ ] Every action has owner, hours and a definition of done.
- [ ] Total hours/week ≤ capacity; budget ≤ constraint.
- [ ] Targets derive from real baselines (or template + which tab to fill).
- [ ] Week 1 contains at least one quick win (< 2 h, visible result).
- [ ] No duplicates of open tasks; `previous_result` progress reviewed.

## Tasks & alerts
Tasks (max 5): the Week 1 actions (priority high/medium) + "Weekly 15-min KPI review"
(medium).
Alerts:
- Planned hours > 120 % of capacity → `warning` ("plan is not feasible").
- > 15 open tasks already → `info` ("finish/close before adding").
- Focus metric declined vs. `previous_result` baseline → `warning`.
- No leads in 30 days while focus is acquisition → `recommendation`.
