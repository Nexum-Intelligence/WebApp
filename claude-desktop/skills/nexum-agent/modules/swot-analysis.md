# SWOT Analysis (`swot-analysis`)

## Goal

A SWOT that is grounded in the company's own numbers and leads to decisions, not a list
of adjectives. The owner gets a scored SWOT canvas for the chosen focus and a TOWS matrix
with 4–6 prioritised strategic moves (SO, WO, ST, WT), each with € impact and owner.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.context` | Scope of the SWOT (whole company, new location, product line, digitalisation …). Everything must relate to it. |
| `inputs.knownStrengths` | Verify with data; keep only what evidence supports. |
| `inputs.knownRisks` | Classify into internal weaknesses vs. external threats. |
| `context` (all KPI blocks) | Internal factors: margin, growth, customer concentration, staff, stock, open tasks. |
| `nexum_records(email,'customers')`, `'sales'` | Retention, concentration, seasonality. |
| `nexum_records(email,'inventory')`, `'suppliers'` | Stock risks, supplier dependence. |
| `nexum_records(email,'staff')` | Key-person risk, capacity. |
| `profile` all sections | Goals and positioning. |
| `retrieved` earlier results (market, competitors, PESTEL) | External factors — reuse rather than re-research. |

Compute (as evidence for S/W):
- **Gross margin** = (revenue − COGS) ÷ revenue vs. sector benchmark.
- **Net margin** = profit ÷ revenue.
- **Revenue growth** = (this period − previous) ÷ previous.
- **Customer concentration** = revenue of top 3 customers ÷ total revenue.
- **Supplier dependence** = spend with top supplier ÷ total purchasing.
- **Personnel cost ratio** = staff costs ÷ revenue.
- **Overdue receivables** = sum of unpaid invoices past due date (from invoices in context).
- **Stock coverage (days)** = inventory value ÷ (COGS per day).

## Ask first if…

Rarely needed. Ask only if `inputs.context` is ambiguous between two different objects
(e.g. "the new location" when two are planned) or the SWOT is for an idea with no data and
no description of team/resources.

```json
[{"key":"scope","label":"Which unit should the SWOT cover?","type":"select","options":["Whole company","One location / branch","One product line","A planned project"]},
 {"key":"team","label":"Team and key resources available for this (people, capital, assets)?","type":"textarea"}]
```

Otherwise take the whole company as scope and state it.

## Research

- External factors only: market growth, competitor moves, regulation (e.g. GEG, e-invoice
  duty B2B 2025–2028, Mindestlohn, Krankenhausreform/ambulantisierung for practices, EU AI Act
  for digital), demand trends, input cost trends (energy, food prices, wages, interest rates).
- Sources: Destatis, Bundesbank/EZB (rates), sector associations, IHK, reputable press
  (Handelsblatt, FAZ, Tagesschau, Ärzteblatt, LTO for legal).
- Skip research if a recent `market-intelligence` or `trend-pestel` result is in `retrieved`;
  reuse and cite it.
- No research for internal factors — they come from data.

## Method

1. **Collect factors**: 4–6 per quadrant; internal = S/W (controllable, from data), external = O/T.
2. **Evidence**: each factor needs a number or source ("Gross margin 68 % vs. 60 % sector").
3. **Score** each factor: Impact (1–5) × Likelihood/certainty (1–5); sort by score.
4. **Quadrant scores** (0–100) = sum of factor scores ÷ max possible × 100 → strength_score,
   weakness_score, opportunity_score, threat_score.
5. **TOWS matrix**: SO (use strengths to capture opportunities), WO (fix weaknesses to capture
   opportunities), ST (use strengths to defuse threats), WT (minimise exposure).
6. **Prioritise** 4–6 moves with ICE; estimate € impact (revenue gain, cost saved or risk avoided).
7. **Strategic implication**: one paragraph — attack, defend, fix or pivot.

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## SWOT Analysis – <company> (<scope>)
<summary: overall posture and top move>
### SWOT canvas
| Quadrant | Factor | Evidence (number / source) | Impact | Likelihood | Score |
### Quadrant scores
| Strengths | Weaknesses | Opportunities | Threats |   (0–100 each)
### TOWS matrix
| | Opportunities | Threats |
| Strengths | SO moves | ST moves |
| Weaknesses | WO moves | WT moves |
### Prioritised strategic moves
| Move | Type (SO/WO/ST/WT) | € impact | Effort | ICE | Owner | Timeframe |
### Strategic implications
### Sources
### Next steps
```

## Quality bar

- [ ] No factor without evidence; internal factors use the company's real KPIs.
- [ ] Strengths are relative to competitors, not self-praise.
- [ ] Owner's known strengths/risks explicitly confirmed or rejected.
- [ ] External facts linked and current (≤ 18 months old).
- [ ] Every move has € impact (labelled estimate) and an owner role.
- [ ] Consistent with `previous_result`; moved/new factors marked.

## Tasks & alerts

Tasks: top 3 moves from the prioritised list as tasks, plus "add missing data" if a quadrant
lacked evidence (e.g. enter supplier purchases), and a review date for the SWOT (quarterly).

Alerts:
- `critical` — threat with score ≥ 20 and no mitigating move (e.g. key customer > 40 % of revenue).
- `warning` — weakness score > strength score, or overdue receivables > 1 month of revenue.
- `recommendation` — SO move with € impact ≥ 5 % of annual revenue.
