# Strategic Planning (`strategic-planning`)

## Goal

Convert the owner's main objective into an executable strategy: a strategy map showing
cause and effect from capabilities to financial result, 2–4 OKRs with measurable key
results baselined on real data, and a prioritised initiative backlog that fits the
constraints (budget, people, time). Outcome: the owner knows what to do this quarter,
what not to do, and how progress will be measured.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.objective` | North-star outcome; rewrite as one measurable sentence (from X to Y by date). |
| `inputs.timeframe` | 6 / 12 months / 3 years → OKR cadence (quarterly OKRs inside annual goals). |
| `inputs.constraints` | Hard limits: budget, owner hours, staff, capital, regulation. Initiatives must fit. |
| `context` (all KPI blocks) | Baselines for key results: revenue, profit, customers, pipeline, margin, open tasks. |
| `nexum_agent_records(run.id, 'tasks')` | Running work — avoid duplicate initiatives; reveal overload. |
| `nexum_agent_records(run.id, 'staff')` | Capacity (FTE, hours) for initiatives. |
| `nexum_agent_records(run.id, 'sales')`, `'customers'`, `'campaigns'` | Growth drivers and trends for targets. |
| `profile.goals` | Long-term ambition; check alignment. |
| `retrieved` (SWOT, market, competitor results) | Strategic options; reuse instead of re-analysing. |

Compute:
- **Gap to goal** = target − baseline (in € or units), and required monthly growth
  = (target ÷ baseline)^(1/months) − 1.
- **Driver tree**: revenue = customers × purchase frequency × AOV (or covers × avg. spend;
  occupancy × ADR × rooms × days; billable hours × rate; MRR = customers × ARPU).
  Identify which driver must move by how much.
- **Capacity check** = sum of initiative effort (hours) ≤ available hours × 0.7.
- **Funding check** = sum of initiative costs ≤ budget in constraints / free cash.

## Ask first if…

1. The objective is not measurable and data does not reveal a natural metric
   ("become the best" with no revenue/customer target).
2. Constraints are empty and the plan would require hiring or investment.
3. The owner's weekly time available for strategic work is unknown for a 1–3 person business.

```json
[{"key":"target","label":"What number defines success at the end of the timeframe (e.g. revenue €, customers, margin %)?","type":"text"},
 {"key":"budget","label":"Budget available for initiatives in this timeframe (€)?","type":"text"},
 {"key":"hours","label":"Hours per week you and your team can spend on new initiatives?","type":"text"}]
```

Otherwise assume: target = +20 % of the main KPI per year; budget = 1 month of profit;
5 h/week owner time. Label assumptions.

## Research

Usually limited: sector growth benchmarks to sanity-check targets (associations, Destatis),
proven initiatives in the sector (case studies from IHK, Mittelstand-Digital Zentren,
associations). Do not research generic OKR theory. Link any benchmark used.

## Method

1. **Objective statement**: from-to-by, plus "why now".
2. **Driver tree**: decompose the objective into 3–4 drivers with baseline and required change.
3. **Strategic choices**: where to play / how to win / what we stop doing (2–3 bullets each).
4. **Strategy map** (Balanced Scorecard perspectives): Financial ← Customer ← Internal processes
   ← Learning & growth; 2–3 objectives per perspective, linked by arrows described in a table.
5. **OKRs**: 2–4 objectives, each with 2–4 key results (baseline → target, measurable from
   platform data), quarter-based for 12-month or 3-year timeframes.
6. **Initiatives**: 8–12 candidates → score ICE (Impact, Confidence, Ease 1–10) and
   cost/effort; select the top set that fits capacity and budget; rest = backlog.
7. **Cadence**: weekly 30-min KPI check, monthly review, quarterly OKR reset.
8. **Risks**: top 3 risks to the plan with mitigation.

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Strategic Plan – <company>
<summary: objective, the 2 key bets, what we stop>
### Objective & gap
| KPI | Baseline | Target | Gap | Required growth/month |
### Driver tree
| Driver | Baseline | Target | Lever |
### Strategic choices
### Strategy map
| Perspective | Strategic objective | Drives → | Measure |
### OKRs
| Objective | Key result | Baseline | Target | Quarter | Data source (platform tab) |
### Initiative backlog
| Initiative | Linked KR | Impact | Confidence | Ease | ICE | Cost € | Effort h | Status (now/next/later) |
### Capacity & budget check
### Risks & mitigation
### Operating cadence
### Next steps
```

## Quality bar

- [ ] Baselines come from `context`/records; targets realistic vs. trend and benchmarks.
- [ ] Every KR is measurable inside the platform (name the tab).
- [ ] "Now" initiatives fit hours and budget; overload explicitly flagged.
- [ ] Clear "stop doing" list.
- [ ] € impact per top initiative (estimate labelled).
- [ ] Consistent with `previous_result`: report KR progress and re-prioritise, don't restart.

## Tasks & alerts

Tasks: the 3–5 "now" initiatives (title starts with verb, priority from ICE), plus
"set up monthly KPI review" if no cadence exists.

Alerts:
- `warning` — required growth > 2× historical growth rate (target likely unrealistic).
- `warning` — capacity check fails (planned hours > available) or > 25 open tasks.
- `info` — KR off-track by > 20 % vs. linear plan (on update runs).
