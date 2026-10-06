# Opportunity & Risk (`opportunity-risk`)

## Goal
Scan the customer's live data with explicit rules, find the risks that cost money and
the opportunities that make money, rank them in a likelihood × impact matrix and raise
alerts the owner sees on the dashboard. Rules first, judgement second — every finding
must point to the record or KPI that triggered it.

## Inputs to use
- `run.inputs`: `knownRisks`, `marketChanges` (add them to the matrix, verify with data),
  `riskAppetite` (Low/Medium/High → shifts thresholds, see Method).
- `context.text`: revenue, expenses, COGS, profit, customers, pipeline, products &
  margins, inventory/low-stock, suppliers, purchasing, sales, invoices, staff, marketing.
- `profile`: industry, `goals.biggestChallenge`, `finance.financialGoals`.
- `nexum_records`: `products` (`price`, `cost`), `inventory` (`stock`, `reorder`,
  `supplier`, `unitCost`), `suppliers` (`leadTime`, `reliability`, `status`),
  `purchases` (`supplier`, `qty`, `unitCost`, `status`, `expected`), `sales`,
  `transactions`, `customers` (`stage`, `value`), `campaigns` (`status`, `budget`,
  `leads`), `staff` (`salary`, `status`). Invoices (`total`, `status`, `due`) from
  `context` or `nexum_records(email,'invoices')` if available.

## Ask first if…
Never ask. Live module — run the scan on whatever data exists and list the data gaps as findings.

## Research
Only to validate `marketChanges` or an industry threshold (e.g. typical food-cost ratio,
hotel occupancy benchmark, energy price trend). One or two searches, cited as links.

## Method
Run every rule; skip with "no data" if the inputs are missing. Thresholds below are for
`riskAppetite = Medium`; Low → tighten by 20 %, High → loosen by 20 %.

| # | Rule | Formula / trigger |
|---|---|---|
| R1 | Product margin below target | `margin = (price − cost)/price`; target: gastro ≥ 70 % (food cost ≤ 30 %), retail/product ≥ 40 %, services/digital ≥ 60 %, else 50 % |
| R2 | Stock below reorder | `stock ≤ reorder` (and `stock = 0` = critical) |
| R3 | Supplier concentration | share of purchase value (`qty × unitCost`) per supplier > 50 % |
| R4 | Customer concentration | top customer > 25 % or top 3 > 50 % of revenue/pipeline value |
| R5 | Overdue invoices | `status ≠ Paid` and `due < today`; sum and age (0–30 / 31–60 / > 60 d) |
| R6 | Cash / profit trend | profit negative in last month, or 3-month profit trend falling; cash out for stock purchases > 30 % of revenue |
| R7 | No marketing activity | no campaign `Active` and none `Done` in last 60 days |
| R8 | Supplier reliability | stock-critical items sourced only from `Average`/`Poor` supplier or `leadTime` > 14 d |
| R9 | Staff cost ratio | active staff cost / revenue > 35 % (gastro/hotel), > 50 % (services, law, medical) |
| R10 | Stagnant pipeline | leads/qualified with value but no movement; pipeline < 2 × monthly revenue target |
| O1 | Upsell / price room | high-volume products with margin > target + 10 pp → bundle, upsell; low-volume high-margin → promote |
| O2 | Winning channel | campaign with best leads per € → scale budget |
| O3 | Customer reactivation | `Churned` or inactive customers with past value |
| O4 | Cost saving | supplier switch or volume bundling where one item > 15 % of purchases |
| O5 | Growth signal | revenue trend > +10 % → capacity, hiring, new offer |

**Scoring:** likelihood 1–5 (5 = already happening in the data), impact 1–5 by € per
year (1 < 1 k, 2 1–5 k, 3 5–20 k, 4 20–50 k, 5 > 50 k or existential). Score = L × I.
Quantify impact: e.g. R1 → `(target margin − actual) × units/month × price × 12`;
R5 → open amount; R2 → avg daily revenue of affected products × expected gap days.

**Patterns:** look across rules — e.g. falling margin + rising purchase prices = supplier
price drift; overdue invoices concentrated on one client = concentration + cash risk.

## Output skeleton
`## Opportunity & Risk Matrix – <company>` + 2–3 sentence summary (top risk, top opportunity, € at stake).
### Risk scan
| Rule | Finding | Data evidence | Likelihood | Impact | Score | € impact/year |
### Opportunities
| Opportunity | Evidence | Effort | € potential/year | First step |
### Matrix (likelihood × impact)
Grid table: rows Impact 5→1, columns Likelihood 1→5, cells list item IDs.
### Patterns
### Data gaps
### Next steps
(`lang=de`: Risiko-Scan, Chancen, Matrix (Wahrscheinlichkeit × Auswirkung), Muster,
Datenlücken, Nächste Schritte.)

## Quality bar
- Every finding cites the concrete record(s) (product, supplier, invoice, customer name).
- € impacts are calculated, not guessed; estimates labelled "est.".
- Max 10 risks and 5 opportunities, sorted by score; no generic textbook risks.
- Owner's `knownRisks` are addressed explicitly (confirmed / not visible in data).

## Tasks & alerts
- Score ≥ 15 or stock = 0 or overdue > 60 days → `critical`.
- Score 9–14 → `warning`; opportunities with ≥ 2.000 €/year → `recommendation`;
  data gaps → `info`.
- Links: R1/O1 `products`, R2/R8 `collection:inventory`, R3/O4 `purchasing`, R5 `finance`,
  R6/R9 `finance`, R7/O2 `collection:campaigns`, R4/R10/O3 `collection:customers`.
- Tasks (≤ 5): one per top-score item, action-first ("Chase overdue invoice <client> (1.240 €)").
