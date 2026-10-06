# Project & Task Execution (`project-execution`)

## Goal
Make one project executable: scope and work breakdown, a Gantt plan as a week
table with milestones and critical path, a Kanban board, a RACI, risks and a
sprint report format. On re-runs, act as the PMO: report progress against the
previous plan and replan.

## Inputs to use
| Source | Use |
|---|---|
| `inputs.projectName` (required) | Title; search knowledge (`nexum_search(email, '<project words>', 10)`). |
| `inputs.objectives` | Deliverables → work packages; derive acceptance criteria. |
| `inputs.deadline` | End date; "Q4 2026" → last working day of the quarter. Compute weeks from run date. |
| `inputs.stakeholders` | RACI roles, approval points, communication plan. |
| `nexum_records(email,'staff')` → `name, role, department, employment, status` | Assignees and capacity: full-time 40 h, part-time 20 h, contractor as stated; only status Active. |
| `nexum_records(email,'tasks')` → `title, priority, done` | Existing tasks related to the project → Kanban "To do/Done"; avoid duplicates. |
| context FINANCE (profit, expenses), OPEN TASKS | Budget realism and current workload. |
| `nexum_records(email,'suppliers')` → `name, category, leadTime, reliability` | External dependencies (lead time adds to the schedule). |
| `previous_result` | Baseline plan for progress/variance. |

Formulas:
- Duration (weeks) = effort (h) / (assigned capacity h/week × availability 0.6
  for SMEs where daily business continues).
- Buffer = 20 % of critical path (30 % if suppliers with reliability Average/Poor).
- Progress % = Σ effort of done packages / total effort; schedule variance =
  planned % − actual %.
- Cycle time = done date − start date per card; throughput = cards done / week.
- WIP limit "Doing" = number of people × 2.

## Ask first if…
- No objectives and nothing in knowledge →
  `{"key":"objectives","label":"What must exist at the end (3–5 deliverables)?","type":"textarea"}`
- No deadline →
  `{"key":"deadline","label":"Fixed deadline or flexible?","type":"text"}`
- No staff records and no stakeholders →
  `{"key":"team","label":"Who works on the project and how many hours per week each?","type":"textarea"}`
Otherwise assume: owner + active staff at 20 % of their time, deadline = 12 weeks
from run date, weekly sprints.

## Research
Only project-specific facts that change the schedule: permit/approval durations
(e.g. Gaststättenerlaubnis, Bauantrag, KV-Zulassung), supplier delivery times,
platform setup times, public holidays/school holidays in the Bundesland
(https://www.schulferien.org or official state pages). Cite sources. Do not research
project-management theory.

## Method
1. **Scope:** objective, deliverables, acceptance criteria, out-of-scope.
2. **WBS:** 4–8 work packages, each 1–10 tasks with effort (h) and dependency.
3. **Schedule:** forward-plan from today; mark milestones (◆) and critical path;
   add buffer before the deadline. If infeasible, show the gap and 2 options
   (cut scope / add capacity / move date).
4. **RACI:** per work package: Responsible, Accountable (exactly one), Consulted, Informed.
5. **Kanban:** Backlog / To do (this sprint) / Doing / Review / Done with WIP limit.
6. **Risks:** top 5 (probability × impact 1–5), mitigation, owner.
7. **Cadence:** weekly 30-min sprint review; sprint report template.
8. **Re-run:** compare with `previous_result` plan → progress %, slipped tasks,
   new risks, replanned dates.

## Output skeleton
Translate headings and table headers when `lang=de`. Gantt bars: `█` planned,
`◆` milestone, `·` empty; one column per calendar week (KW).
```
## Project plan – <Project> – <Company>
<executive summary: goal, deadline, feasibility, critical path>
### Scope & acceptance criteria
| Deliverable | Acceptance criterion | Owner |
### Work breakdown
| WP | Task | Effort h | Depends on | Owner | Start | End |
### Gantt plan
| WP / task | KW xx | KW xx | KW xx | ... |
### Kanban board
| Backlog | To do | Doing (WIP n) | Review | Done |
### RACI
| Work package | R | A | C | I |
### Risks
| Risk | P (1–5) | I (1–5) | Score | Mitigation | Owner |
### Sprint report (week <n>)
| Metric | Planned | Actual | Variance |
### Next steps
```

## Quality bar
- [ ] Dates are real calendar weeks from the run date; deadline feasibility stated.
- [ ] Every task has owner, effort and dependency; one Accountable per package.
- [ ] Capacity check against staff records shown; overload flagged.
- [ ] Kanban cards are concrete verbs + object ("Order POS hardware").
- [ ] Re-run shows variance vs. previous plan.

## Tasks & alerts
Tasks (max 5): the next sprint's critical-path tasks (high) + "Schedule weekly
30-min project review" (medium).
Alerts:
- Plan needs > 110 % of available capacity or ends after the deadline → `warning`.
- Critical-path task overdue vs. previous plan → `warning`; milestone missed → `critical`.
- Supplier with reliability Poor on the critical path → `info`, link `collection:suppliers`.
- Project cost exceeds 3 months of current profit → `info`, link `finance`.
