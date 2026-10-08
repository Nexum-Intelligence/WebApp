# Scaling Strategy (`scaling-strategy`)

## Goal

Decide whether and how the business should scale now: is product-market fit strong
enough, do unit economics survive more volume, which bottleneck caps growth, and which
growth loops can compound. Outcome: a PMF verdict, an LTV/CAC model, 2–3 designed growth
loops and a staged scaling plan (what to standardise, automate, hire or open next) with
€ effect and go/no-go gates.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.stage` | Pre-PMF → focus on retention/PMF, no scaling spend; Early traction → fix bottleneck + 1 loop; Scaling → system, team, new markets/locations. |
| `inputs.bottleneck` | Starting hypothesis; verify with data (leads, conversion, capacity, delivery, cash, people). |
| `inputs.goal` | Target (e.g. "2nd location", "1 M€ ARR", "double covers") → scaling path. |
| `context` revenue, customers, pipeline, marketing, staff, products & margins, open tasks | Growth rate, capacity, margin. |
| `nexum_agent_records(run.id, 'customers')`, `'sales'` | Cohorts, repeat rate, churn, referral source. |
| `nexum_agent_records(run.id, 'campaigns')` | CAC per channel. |
| `nexum_agent_records(run.id, 'staff')`, `'tasks'` | Capacity, owner dependence. |
| `nexum_agent_records(run.id, 'inventory')`, `'suppliers'` | Supply capacity, minimum orders, dependence. |
| `retrieved` go-to-market / business-model results | Assumptions to reuse. |

Compute:
- **CAC** = (marketing + sales cost) ÷ new customers (per channel and blended).
- **ARPU / AOV** and **purchase frequency** per year.
- **Gross-margin LTV** = AOV × frequency × gross margin × lifetime (years);
  recurring: ARPU × GM ÷ monthly churn.
- **LTV/CAC** (target ≥ 3) and **CAC payback** = CAC ÷ (monthly contribution per customer) (target ≤ 12 months; ≤ 3 for B2C/local).
- **Retention / churn**: customers active in month n ÷ cohort size; monthly churn.
- **Revenue per FTE** = revenue ÷ FTE; **utilisation** = billable hours ÷ available hours.
- **Capacity headroom** = (max capacity − current volume) ÷ max capacity.
- **Growth rate** = month-over-month and year-over-year revenue/customer growth.

## Ask first if…

1. Cost of acquiring customers unknown (no campaigns data, no marketing costs) and
   `inputs.stage` is "Scaling".
2. The scaling path is ambiguous (more locations vs. franchise vs. online vs. new segment).
3. Capacity limit unknown for location- or people-bound businesses.

```json
[{"key":"cac","label":"Monthly marketing + sales spend (€) and new customers per month?","type":"text"},
 {"key":"path","label":"Preferred way to scale?","type":"select","options":["More capacity at current site","Additional location","Franchise / licensing","Online / productised offer","New customer segment or region"]},
 {"key":"capacity","label":"Maximum capacity per month with current team/space?","type":"text"}]
```

Otherwise use records and sector benchmarks (label), and evaluate the two most plausible paths.

## Research

- Benchmarks: LTV/CAC, churn, retention for the sector (ChartMogul/OpenView for SaaS,
  sector associations for gastro/hotel/practice), revenue per employee.
- Scaling models: franchise law basics (DFV – Deutscher Franchiseverband), second-location
  costs (rent levels, fit-out), MVZ/Praxisgemeinschaft or Zweigpraxis rules (KV) for doctors,
  partner/associate models for law firms, licensing/print-on-demand for artists, marketplaces for products.
- Automation tools relevant to the bottleneck (booking, invoicing, CRM, POS integrations).
- Do not research generic growth-hacking. Link every benchmark.

## Method

1. **PMF scorecard** (0–5 each, total /30): retention curve flattening, repeat/referral share,
   organic growth share, willingness to pay (no-discount sales), sales-cycle speed,
   "very disappointed" survey ≥ 40 % (if available) → stage: not ready / emerging / validated / scaling-ready.
2. **Unit economics model** per channel and blended; payback; contribution after CAC.
3. **Bottleneck diagnosis** with Theory of Constraints: demand (leads), conversion, delivery
   capacity, quality, cash, people/owner time — quantify the constraint.
4. **Growth loops** (2–3): trigger → action → output → reinvest (e.g. review loop, referral
   loop, content/SEO loop, B2B partner loop, UGC loop); KPI and expected multiplier.
5. **Scaling options**: evaluate paths with investment €, time to break-even, risk, control,
   fit with PMF stage.
6. **Staged plan** with gates: Stage 1 standardise (SOPs, pricing, tools) → Stage 2
   systemise (automation, hires, second channel) → Stage 3 multiply (location, franchise,
   new market). Each gate has KPI thresholds (e.g. LTV/CAC ≥ 3, payback ≤ 12 m, utilisation ≥ 80 %).
7. **Typical traps**: hiring before demand, scaling unprofitable channels, owner as single point of failure.

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Scaling Strategy – <company>
<summary: PMF verdict, true bottleneck, recommended path, first gate>
### PMF scorecard
| Criterion | Score (0–5) | Evidence |
### Unit economics (LTV/CAC)
| Channel | CAC € | AOV/ARPU € | Gross margin % | LTV € | LTV/CAC | Payback (months) |
### Bottleneck analysis
| Constraint | Current | Capacity / benchmark | Gap | Fix |
### Growth loops
| Loop | Trigger | Action | Output | KPI | Priority |
### Scaling options
| Option | Investment € | Time to break-even | Risk | Fit | Recommendation |
### Staged scaling plan
| Stage | Actions | Gate KPI | Target | Timeframe | € effect |
### Next steps
```

## Quality bar

- [ ] CAC, LTV, churn calculated from records; benchmarks only as comparison.
- [ ] Stated bottleneck confirmed or replaced by the data-backed one.
- [ ] No scaling spend recommended while PMF is "not ready".
- [ ] Each stage gated by numeric KPIs; € effect per stage labelled.
- [ ] Sector-specific scaling paths and their legal/regulatory limits addressed.
- [ ] Update runs: compare KPI movement vs. `previous_result`.

## Tasks & alerts

Tasks: fix the bottleneck (concrete), launch loop #1 (e.g. review request after every visit),
write 3 SOPs for owner-dependent processes, pause channel with LTV/CAC < 1, set up cohort tracking.

Alerts:
- `critical` — LTV/CAC < 1 on channel with > 30 % of spend.
- `warning` — capacity headroom < 10 % (lost revenue risk) or churn rising 3 months in a row.
- `recommendation` — channel/loop with LTV/CAC ≥ 4 and headroom available (`impact` €/month from scaling it).
