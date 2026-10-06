# Predictive Intelligence (`predictive`)

## Goal
Give the owner a transparent, data-backed view of the next 1–12 months: where revenue,
costs and profit are heading, which products will be in demand, and when stock runs out.
Every number must be reproducible from the customer's records; methods stay simple
enough that a Steuerberater or a restaurant owner can follow them.

## Inputs to use
- `run.inputs`: `metric` (what to forecast, e.g. revenue, demand, churn), `horizon`
  (1 / 3 / 6 / 12 months, default 3), `dataAvailable`, `context` (one-offs, planned
  changes such as a new location, price increase, closing weeks).
- `context.text`: revenue, expenses, cost of goods, profit, customers, pipeline, inventory.
- `nexum_records` (limit 500 where possible):
  - `transactions` → `date`, `type` (Income/Expense), `category`, `amount`.
  - `sales` → `date`, `productId`, `productName`, `qty`, `revenue`, `cost`, `profit`.
  - `inventory` → `name`, `unit`, `stock`, `reorder`, `unitCost`, `supplier`.
  - `products` → `name`, `price`, `cost`, `recipe[{itemId, qty}]` (links sales to stock usage).
  - `purchases` → open orders (`status` Ordered, `expected`) that will refill stock.
  - `suppliers` → `leadTime` (days) for reorder timing.
  - `customers` → `stage`, `value` for pipeline-based revenue (weighted).
- `previous_result`: compare last forecast vs. actuals (forecast error) and say so.

## Ask first if…
Never ask. This is a live module — compute from records, state assumptions and data gaps.

## Research
Only if the owner's `context` mentions an external driver (season, event, regulation,
energy prices). Then one quick web search for the fact (e.g. trade-fair dates, school
holidays in the Bundesland, Mehrwertsteuer change for Gastro) and cite it.

## Method
1. **Build monthly series** (calendar months, `YYYY-MM`): income, expenses, profit from
   `transactions`; revenue, units and gross profit per product from `sales`. Drop the
   current incomplete month or pro-rate it (`value × days_in_month / days_elapsed`) and say which.
2. **Data sufficiency** — classify and print it:
   - < 3 months: *insufficient* → run-rate only (last month or avg per day × 30), wide range ±30 %.
   - 3–11 months: *limited* → 3-month moving average + linear trend, no seasonality.
   - ≥ 12 months: *good* → add seasonality index; ≥ 24 months: *strong*.
3. **Moving average:** `MA3 = (m-1 + m-2 + m-3) / 3`.
4. **Linear trend** (least squares on month index t = 1..n): `slope = Σ(t−t̄)(y−ȳ) / Σ(t−t̄)²`,
   `intercept = ȳ − slope·t̄`, forecast `ŷ(t) = intercept + slope·t`. Report slope in €/month
   and as % of the average. Cap trend extrapolation at ±50 % of the current level.
5. **Seasonality index** (≥ 12 months): `SI(month) = avg(value in that calendar month) /
   avg(all months)`; forecast = trend × SI. Typical DACH patterns to sanity-check: gastro
   and hotel peaks in summer/December, medical practices dip in holiday periods, law firms
   and services dip in August and late December.
6. **Scenarios:** base = method above; low = base × (1 − d); high = base × (1 + d), where
   d = max(10 %, coefficient of variation of the last 6 months). Profit scenarios: apply
   the cost-of-goods ratio (COGS / revenue) and keep fixed costs (staff, rent) flat.
7. **Demand per product:** avg units/day over the last 30 days (fallback: all history),
   × horizon days; flag top movers (+/− ≥ 20 % vs. previous 30 days).
8. **Stock-out date per inventory item:** daily usage = Σ over sales of (sale qty × recipe
   qty of that item) / days covered; if no recipe link, use purchases as usage proxy.
   `days_left = stock / daily_usage`; `stock_out_date = today + days_left`. Add open
   purchase quantities when `expected` ≤ stock-out date. Reorder needed when
   `days_left ≤ supplier leadTime + 3 days buffer`.
9. **Pipeline (services, law firms, digital):** weighted pipeline = Σ value × probability
   (Lead 10 %, Qualified 30 %, Customer = booked) — label the weights as assumptions.
10. Back-test: if ≥ 6 months, forecast the last 2 known months from earlier data and
    report the mean absolute percentage error (MAPE).

## Output skeleton
`## Forecast – <company>` + 2–3 sentence summary (direction, main number, confidence).
### Data basis
Months covered, records used, sufficiency level, method chosen, MAPE if available.
### Forecast (<metric>, <horizon>)
| Month | Low | Base | High | Basis |
### Scenario simulation
| Scenario | Assumption | Revenue | Profit | vs. today |
### Product demand
| Product | Units/day (30d) | Trend | Forecast units | Forecast revenue |
### Stock-out forecast
| Item | Stock | Usage/day | Days left | Stock-out date | Lead time | Action |
### Assumptions & limits
### Next steps
(`lang=de`: Prognose, Datenbasis, Szenario-Simulation, Produktnachfrage,
Lagerreichweite, Annahmen & Grenzen, Nächste Schritte.)

## Quality bar
- Each forecast row names its basis (MA3, trend, trend×SI, run-rate).
- No forecast beyond the data's reach without saying so; insufficient data is a finding,
  with the exact tab to fill (Income & Expenses, Sales (POS), Inventory, Products recipe).
- Units and € consistent; dates as `DD.MM.YYYY` for `de`.
- If `previous_result` exists: one line "last forecast vs. actual" with % deviation.

## Tasks & alerts
- Item with stock-out ≤ lead time + 3 days → task "Reorder <item> from <supplier>" (high);
  alert `warning` (≤ 7 days: `critical`), link `collection:inventory`, impact = lost
  revenue per day × gap days.
- Base-case profit negative within horizon → alert `critical`, link `finance`.
- Revenue trend ≤ −10 % over 3 months → alert `warning`, link `finance`.
- Revenue trend ≥ +15 % → alert `info` (capacity/stock check), link `module:hr-planning`
  or `purchasing`.
- Data insufficient (< 3 months) → task "Import 12 months of income history" (medium), alert `info`.
