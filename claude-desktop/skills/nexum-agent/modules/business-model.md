# Business Model Architect (`business-model`)

## Goal

Turn the owner's value proposition into a coherent, numerically tested business model:
a filled Business Model Canvas, 3 scenarios showing whether the model earns money, a PMF
scorecard and a decision matrix between model variants (e.g. per-visit vs. membership,
project vs. retainer, own shop vs. marketplace). Outcome: the owner knows which model to
run, at which price, and which assumption to test next.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.valueProp` | Value Propositions block; derive the job-to-be-done. |
| `inputs.customer` | Customer Segments; check against real `customers` records. |
| `inputs.revenue` | Revenue Streams + pricing logic. |
| `inputs.resources` | Key Resources, Key Partners. |
| `inputs.stage` | Idea/MVP → assumption-based scenarios; Early revenue/Scaling → data-based. |
| `context` revenue, expenses, COGS, profit, products & margins, staff | Cost structure and unit economics. |
| `nexum_agent_records(run.id, 'products')` | Price, unit cost → contribution margin per product. |
| `nexum_agent_records(run.id, 'sales')`, `'customers'` | Repeat rate, AOV, segment mix. |
| `nexum_agent_records(run.id, 'suppliers')`, `'staff'` | Key partners, cost of capacity. |
| `profile.product`, `profile.customers`, `profile.goals` | Context and ambition. |

Compute:
- **Gross margin** = (revenue − COGS) ÷ revenue.
- **Contribution margin per unit** = price − variable cost (COGS, payment fees, commissions, packaging).
- **Fixed costs/month** = rent + salaries + insurance + software + leasing (from expenses).
- **Break-even units/month** = fixed costs ÷ contribution margin per unit.
- **Repeat rate** = customers with ≥ 2 purchases ÷ all customers (period).
- **LTV** = AOV × purchases per year × gross margin × expected years.
- For subscriptions: **MRR**, **churn** = lost ÷ start customers per month, LTV = ARPU × GM ÷ churn.

## Ask first if…

1. No price and no sales data (stage Idea) — price drives every scenario.
2. Two plausible revenue models and the owner has not said which one they prefer.
3. Fixed-cost base unknown (no expenses in context, no rent/staff known).

```json
[{"key":"price","label":"Planned price (per unit, visit, month or project)?","type":"text"},
 {"key":"model","label":"Which revenue model do you prefer?","type":"select","options":["Per sale / visit","Subscription / membership","Project / retainer","Commission / marketplace","Not decided"]},
 {"key":"fixedCosts","label":"Expected fixed costs per month (rent, staff, software) in €?","type":"text"}]
```

Otherwise assume sector benchmarks (e.g. gastro food cost 28–32 %, personnel 30–35 %;
agency billable utilisation 65–75 %; SaaS gross margin 75–85 %) and label them.

## Research

- Pricing of 3–5 comparable offers in the region (price lists, menus, fee schedules: GOÄ/GOZ for
  practices, RVG for law firms, HOAI for architects/engineers).
- Benchmarks for cost ratios from associations (DEHOGA, IHA, DATEV-Branchenvergleich summaries,
  KfW-Gründungsmonitor), SaaS benchmarks (OpenView/ChartMogul).
- Proven model patterns in the industry (e.g. Gastro: lunch subscription, catering; Praxis:
  IGeL/self-pay services; Kanzlei: flat-fee packages; Artists: Patreon/editions/licensing).
- Do not research generic canvas explanations. Cite every benchmark with a link.

## Method

1. **Business Model Canvas – 9 blocks**: Customer Segments, Value Propositions, Channels,
   Customer Relationships, Revenue Streams, Key Resources, Key Activities, Key Partners,
   Cost Structure. Each block 2–4 bullets, specific to this business; mark each bullet
   as *fact* (from data) or *assumption*.
2. **Consistency check**: does each segment have a channel, a revenue stream and a cost?
   Flag gaps.
3. **Unit economics** per main product/service with the formulas above.
4. **Scenario simulation** (12 months): Conservative / Base / Ambitious, varying volume,
   price and variable cost ratio; show revenue, contribution, fixed costs, EBIT, break-even month.
5. **PMF scorecard**: 6 criteria scored 0–5 with evidence — problem urgency, repeat/retention,
   organic referrals, willingness to pay (price accepted without discount), sales cycle
   length, Sean-Ellis-style "very disappointed" signal (if surveys exist). Total /30.
6. **Decision matrix**: 2–3 model variants × weighted criteria (margin 30 %, cash speed 20 %,
   scalability 20 %, risk 15 %, fit with team 15 %), score 1–5.
7. **Recommendation** + riskiest assumption + cheapest test.

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Business Model – <company>
<summary: recommended model, break-even, riskiest assumption>
### Business Model Canvas
| Block | Content | Fact / Assumption |
### Consistency gaps
### Unit economics
| Product / service | Price € | Variable cost € | Contribution € | Contribution % | Volume/month |
### Scenario simulation (12 months)
| Scenario | Volume | Price € | Revenue € | Contribution € | Fixed costs € | EBIT € | Break-even month |
### PMF scorecard
| Criterion | Score (0–5) | Evidence |
### Decision matrix
| Criterion (weight) | Variant A | Variant B | Variant C |
### Recommendation & riskiest assumption
### Next steps
```

## Quality bar

- [ ] Canvas uses the owner's real products, suppliers, staff — not textbook examples.
- [ ] Unit economics computed from `products` records where available; formula shown otherwise.
- [ ] Every assumption labelled; benchmarks linked.
- [ ] Scenarios are internally consistent (fixed costs identical across scenarios unless justified).
- [ ] € impact of the recommendation stated (e.g. "+2.400 €/month contribution").
- [ ] Industry vocabulary; consistent with `previous_result`, changes stated.

## Tasks & alerts

Tasks: test riskiest assumption (concrete test, e.g. pre-sale landing page, 10 offers), set
price for product X, renegotiate supplier with lowest margin product, enter missing unit
costs in Products tab, run `financial-planning` for chosen model.

Alerts:
- `critical` — contribution margin ≤ 0 on a product with > 10 % of revenue.
- `warning` — base-case break-even later than month 18 or gross margin below sector benchmark by > 10 pp.
- `recommendation` — variant with ≥ 15 % higher contribution (`impact` €/month).
