# Financial Planning (`financial-planning`)

## Goal

A lean, consistent financial model (3-statement-lite: profitability, liquidity, simplified
balance) with a monthly 12-month plan, a 3- or 5-year annual view, a cash-flow plan that
shows the lowest cash point, and a break-even analysis. Outcome: the owner sees when the
business earns money, how much cash is needed, and which lever (price, volume, cost)
moves profit most.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.revenueModel` | Revenue logic per stream (units × price, covers × spend, rooms × occupancy × ADR, hours × rate × utilisation, MRR). |
| `inputs.mainCosts` | Cost drivers; split fixed vs. variable. |
| `inputs.horizon` | 12 months → monthly only; 3 / 5 years → monthly year 1 + annual years. |
| `context` revenue, expenses, COGS, profit, invoices, inventory, staff, purchasing | Actual baseline, run-rate, seasonality. |
| `nexum_agent_records(run.id, 'transactions')` | Last 6–12 months by category → fixed/variable split, seasonality. |
| `nexum_agent_records(run.id, 'products')` | Price and unit cost per product. |
| `nexum_agent_records(run.id, 'staff')` | Salaries → personnel plan (employer cost DE ≈ gross × 1.21; mini-job ≈ × 1.30; AT ≈ × 1.30). |
| `nexum_agent_records(run.id, 'inventory')`, `'purchases'` | Stock and purchasing cycle → working capital. |
| `profile.basics` | Legal form (tax: Einkommensteuer vs. Körperschaft+Gewerbesteuer), VAT status. |

Compute:
- **Gross margin** = (revenue − COGS) ÷ revenue.
- **Contribution margin per unit** = price − variable cost.
- **Break-even units** = fixed costs ÷ contribution per unit; **break-even revenue** = fixed costs ÷ CM %.
- **Margin of safety** = (planned revenue − break-even revenue) ÷ planned revenue.
- **EBITDA** = revenue − COGS − opex; **EBIT** = EBITDA − depreciation (AfA, linear).
- **Cash flow** = EBIT + depreciation − taxes − Δworking capital − capex − loan principal − private withdrawals.
- **DSO** = receivables ÷ revenue × 30; **DIO** = inventory ÷ COGS × 30; **DPO** = payables ÷ purchases × 30.
- **Runway** = cash ÷ monthly burn.
- **Taxes (rough)**: GmbH ≈ 30 % of profit (KSt + SolZ + GewSt, depends on Hebesatz); sole
  proprietors: show pre-tax and note income tax is private. VAT: plan net, mention VAT timing in cash.

## Ask first if…

1. No actuals and no volume/price assumption — the model would be pure fiction.
2. Opening cash balance unknown (liquidity plan impossible).
3. Planned investments or loans unknown when they are clearly needed (new location, equipment).

```json
[{"key":"cash","label":"Current bank balance (€)?","type":"text"},
 {"key":"volume","label":"Expected monthly sales volume now and in 12 months?","type":"text"},
 {"key":"capex","label":"Planned investments or loans in the horizon (what, €, when)?","type":"textarea"}]
```

Otherwise: use last 3 months as run-rate, opening cash = 1 month of expenses (labelled),
growth = sector benchmark, no new loans.

## Research

Only for assumptions without data: sector cost ratios (DEHOGA, IHA, DATEV/BWA benchmarks,
KBV/ZI-Praxis-Panel for practices, BRAK statistics for law firms), local rent levels,
Gewerbesteuer-Hebesatz of the municipality, current wage agreements/Mindestlohn, interest
rates (KfW, Bundesbank). Link each. No general finance tutorials.

## Method

1. **Assumption sheet**: every driver with value, source (record/benchmark/owner), and confidence.
2. **Revenue plan** by stream and month incl. seasonality from historic data (index per month).
3. **Cost plan**: variable (COGS ratio, payment fees, commissions), personnel (by role),
   fixed (rent, insurance, software, leasing, marketing), depreciation.
4. **Profitability (P&L)** monthly year 1; annual years 2–3/5 with explicit growth and cost-step assumptions.
5. **Liquidity plan** monthly: opening cash, cash in (incl. payment delays), cash out
   (incl. VAT, taxes, capex, loan service, private withdrawals), closing cash; mark lowest point.
6. **Balance-lite** year-end: cash, receivables, inventory, fixed assets | equity, loans, payables.
7. **Break-even**: units/revenue/month reached; chart as table.
8. **Sensitivity**: price −10 %, volume −20 %, COGS +10 %, wages +8 % → EBIT and lowest cash.
9. **Scenarios**: Conservative / Base / Ambitious annual summary.

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Financial Plan – <company>
<summary: year-1 revenue/EBIT, break-even month, lowest cash and funding need>
### Key assumptions
| Driver | Value | Source | Confidence |
### Profitability plan – 12 months
| Month | Revenue | COGS | Gross profit | Personnel | Rent | Marketing | Other opex | EBITDA | Depreciation | EBIT |
### Liquidity plan – 12 months
| Month | Opening cash | Cash in | Cash out | Capex | Loans in/out | Private/Taxes | Closing cash |
### Multi-year overview
| Year | Revenue | Gross margin % | EBITDA | EBIT | Closing cash | Headcount |
### Balance sheet (simplified, year-end)
| Assets | € | Liabilities & equity | € |
### Break-even analysis
| Metric | Value | Formula |
### Sensitivity
| Change | EBIT year 1 € | Lowest cash € |
### Scenarios
### Next steps
```

## Quality bar

- [ ] Year-1 monthly totals equal the annual figure; liquidity closing = next opening.
- [ ] Actuals used as baseline; every assumption labelled with source.
- [ ] Seasonality reflected (gastro/hotel: summer/winter; practices: holiday months).
- [ ] Private withdrawals and taxes included; VAT timing noted.
- [ ] Lowest cash point and funding need explicitly stated in €.
- [ ] Update runs: plan vs. actual variance vs. `previous_result`.

## Tasks & alerts

Tasks: enter missing cost categories in Income & Expenses, set aside tax reserve, renegotiate
largest fixed cost, set price change for low-margin product, review plan vs. actual monthly.

Alerts:
- `critical` — closing cash < 0 in any month of the plan.
- `warning` — lowest cash < 2 months of fixed costs, or margin of safety < 10 %.
- `recommendation` — sensitivity shows price +5 % gives ≥ X € EBIT (`impact` €/year).
