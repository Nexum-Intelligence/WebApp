# Business Operations (`business-operations`) — LIVE

## Goal
Recompute, on every run, a KPI dashboard and a monthly management report from the
customer's records: revenue, expenses, cost of goods, gross margin, profit by
month; top products; low stock; open purchase orders; pipeline by stage; cash
items (outstanding invoices). Compare with `previous_result`, flag what changed
and raise alerts. This module never asks questions.

## Inputs to use
Owner inputs only shape the report, they never block it:
- `inputs.kpis` → add these KPIs to the dashboard (if computable; else "how to track").
- `inputs.processes` → one "visibility" row per process (data source, status).
- `inputs.currentTools` → integration notes (what could feed the data; no setup claims).
- `inputs.teamSize` → revenue per FTE if staff records are missing.

Load records (limit 1000 each) with `nexum_records(email, kind, 1000)`:
| Kind | Fields used |
|---|---|
| `transactions` | `date, type (Income/Expense), category, amount` |
| `sales` | `date, productName, qty, revenue, cost, profit` |
| `products` | `name, category, price, cost, status` |
| `inventory` | `name, unit, unitCost, stock, reorder, supplier` |
| `purchases` | `supplier, itemName, qty, unitCost, status (Draft/Ordered/Received), expected` |
| `customers` | `stage (Lead/Qualified/Customer/Churned), value` |
| `staff` | `salary, status, department, employment` |
| `campaigns` | `channel, status, budget, leads` |
| `tasks` | `title, priority, done` |
Plus context INVOICES (invoiced, outstanding, paid) and `previous_result`.

Formulas (identical to the platform's Finance view — keep them consistent):
- Month key = `date` → `YYYY-MM`. Use the last 6 complete months + current month-to-date.
- Revenue_m = Σ amount, type = Income. (POS sales already post an Income
  transaction with category "Sales" — never add `sales.revenue` on top.)
- Stock purchases_m = Σ amount, type = Expense, category = "Purchasing" (cash out,
  not cost).
- Operating expenses_m = Σ amount, type = Expense, category ≠ "Purchasing"
  + monthly staff cost (Σ `salary` of staff with status Active; apply to each
  month and say so).
- COGS_m = Σ `sales.cost` in month. Gross profit_m = Revenue_m − COGS_m;
  gross margin % = gross profit / revenue.
- Profit_m = Revenue_m − Operating expenses_m − COGS_m; net margin % = profit / revenue.
- MoM change = (this − last) / |last|; margin change in percentage points (pp).
- Product ranking (sales): revenue = Σ revenue, profit = Σ profit, margin % =
  profit / revenue; catalogue margin = (price − cost) / price.
- Low stock = `stock ≤ reorder`; days of cover ≈ stock / (avg daily usage) if usage
  is derivable, else "n/a". Stock value = Σ unitCost × stock.
- Open POs = status Draft/Ordered; overdue = `expected` < today and not Received;
  open PO value = Σ qty × unitCost.
- Pipeline by stage = count and Σ value per `stage`; weighted pipeline (assumption:
  Lead 10 %, Qualified 40 %).
- Staff cost ratio = staff cost / revenue; revenue per FTE (part-time = 0.5).
- CPL = campaign budget / leads.

## Ask first if…
Never ask. Missing data → show the KPI as "no data", name the platform tab to fill
(Income & Expenses, Sales (POS), Products, Inventory, Purchasing, Customers (CRM),
Staff, Marketing (CRM)) and continue. Months with no transactions are shown as 0
only if later months have data; otherwise start at the first month with data.

## Research
None by default. Optional, max one lookup: an industry benchmark for gross margin
or staff-cost ratio (e.g. DEHOGA https://www.dehoga-bundesverband.de/zahlen-fakten/,
Destatis https://www.destatis.de) — cite it, label it as benchmark.

## Method
1. Load all kinds; validate (dates parseable, numbers numeric; count rows skipped).
2. Build the monthly P&L table; compute MoM and vs. 3-month average.
3. KPI dashboard: current month-to-date and last complete month with trend arrows
   (▲ ▼ ▬, threshold ±5 %).
4. Products: top 5 by revenue and top 5 by margin; flag high-revenue/low-margin items.
5. Operations: low-stock list, open/overdue POs, outstanding invoices.
6. Pipeline by stage; campaigns with leads and CPL.
7. Diff vs. `previous_result`: list each KPI that moved > 5 % or margin > 2 pp,
   new low-stock items, resolved items.
8. Derive alerts and max 5 tasks.

## Output skeleton
Translate headings and table headers when `lang=de`.
```
## Business operations report – <Company> – <YYYY-MM>
<executive summary: 3 sentences, biggest change, biggest risk>
### KPI dashboard
| KPI | Current month (MTD) | Last month | MoM | Trend | Note |
### Monthly P&L
| Month | Revenue € | COGS € | Gross margin % | Operating expenses € | Profit € | Net margin % | Stock purchases € |
### Top products
| Product | Units | Revenue € | Profit € | Margin % | Rank change |
### Inventory & purchasing
| Item | Stock | Reorder level | Unit | Supplier | Open PO qty | Expected |
### Pipeline & marketing
| Stage | Contacts | Value € | Weighted € |
### Changes since last report
| Area | Before | Now | Change | Comment |
### Data quality
### Next steps
```

## Quality bar
- [ ] All numbers recomputed from records; formulas match the platform definitions.
- [ ] No double counting of POS revenue; stock purchases kept out of profit.
- [ ] Every comparison states the period; MTD months are labelled as partial.
- [ ] Missing data listed with the tab to fill; no invented numbers.
- [ ] "Changes since last report" present whenever `previous_result` exists.

## Tasks & alerts
Tasks (max 5, no duplicates of open tasks): "Reorder <item>" (high, per low-stock
item, group if > 2), "Chase overdue PO <supplier>" (medium), "Send reminders for
outstanding invoices" (high if > 30 days), "Review price of <low-margin product>"
(medium).
Alerts:
- Gross or net margin drop > 5 pp MoM → `warning`, link `finance`; > 10 pp → `critical`.
- Profit negative in the last complete month → `warning`; 2 months in a row → `critical`.
- Revenue −20 % vs. 3-month average → `warning`.
- Stock ≤ reorder → `warning`, link `collection:inventory`; stock = 0 on an active
  product's ingredient → `critical`.
- PO overdue (expected date passed) → `warning`, link `purchasing`.
- Outstanding invoices > 25 % of invoiced → `warning`, link `finance`.
- Staff cost > 40 % of revenue → `info`.
- No campaign leads in 30 days → `recommendation`, link `collection:campaigns`.
