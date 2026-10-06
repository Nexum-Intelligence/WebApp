# KPI Estimation (`kpi-estimation`)

## Goal
For one focus area, select the 6–10 KPIs that actually steer the business,
compute their current values from records, benchmark them against the industry,
and set realistic targets (conservative / target / stretch) for the chosen
timeframe — plus a dashboard spec so the owner can track them.

## Inputs to use
| Source | Use |
|---|---|
| `inputs.focusArea` (required) | Area: finance, sales, marketing, operations, HR, customer, inventory … |
| `inputs.currentMetrics` | Owner-stated numbers; records win if both exist (note the difference). |
| `inputs.timeframe` (Monthly / Quarterly / Yearly) | Target period and dashboard frequency. |
| profile `industry`, `stage`, `size`, `goals12m`, `financialGoals` | Benchmark set and target ambition. |
| context data (finance, customers, products, inventory, purchasing, sales, invoices, staff, marketing) | Baseline values. |
| `nexum_records` kinds as needed: `transactions (date,type,category,amount)`, `sales (date,qty,revenue,cost,profit)`, `products (price,cost,status)`, `inventory (unitCost,stock,reorder)`, `purchases (qty,unitCost,status,expected)`, `suppliers (leadTime,reliability)`, `customers (stage,value)`, `campaigns (budget,leads)`, `staff (salary,status,employment)` | Compute KPIs. |

KPI library (pick by area and industry):
- Finance: revenue, gross margin % = (revenue − COGS)/revenue, net margin %,
  break-even revenue = fixed costs / gross margin %, staff cost ratio = staff cost /
  revenue, DSO ≈ outstanding invoices / revenue × 30.
- Sales: AOV = revenue / #sales, units per sale, win rate = Customer / (Qualified +
  Customer + Churned), pipeline coverage = weighted pipeline / target.
- Marketing: CPL = budget / leads, CAC = spend / new customers, ROAS, LTV:CAC.
- Customer: churn = Churned / (Customer + Churned), repeat rate, cohort retention
  (share of month-m customers buying again in m+1, m+3 — only if dated data exists).
- Operations/inventory: stock value, inventory turnover = COGS / avg stock value,
  days of inventory = 365 / turnover, low-stock count, supplier lead time (avg
  `leadTime`), on-time PO rate.
- People: revenue per FTE, sick/vacancy notes if available.
- Industry: gastro — food cost % (target 25–35 %), revenue per seat, covers/day;
  hotel — occupancy, ADR, RevPAR = ADR × occupancy; medical — patients/day,
  no-show rate, revenue per treatment hour; law — billable-hour utilisation,
  realisation rate; product/e-com — conversion rate, return rate; digital/SaaS —
  MRR, churn, NRR; artists — revenue per work/commission, newsletter growth.

## Ask first if…
- Focus area is vague ("everything") →
  `{"key":"area","label":"Which area should the KPIs steer first?","type":"select","options":["Finance","Sales","Marketing","Operations","Customers","Team"]}`
- No data in records and no `currentMetrics` for the area →
  `{"key":"baseline","label":"Current rough numbers for this area (e.g. revenue/month, customers, costs)?","type":"textarea"}`
- Goal ambition unknown →
  `{"key":"ambition","label":"How ambitious should targets be?","type":"select","options":["Stabilise","Moderate growth","Aggressive growth"]}`
Otherwise: baseline = last 3 complete months; targets = moderate (between median
benchmark and current value + 10–20 %).

## Research
- Industry benchmarks for the selected KPIs, DACH first: DEHOGA
  (https://www.dehoga-bundesverband.de/zahlen-fakten/), Destatis
  (https://www.destatis.de), IfH/HDE for retail (https://einzelhandel.de),
  KBV/Zi for practices (https://www.zi.de), BRAK statistics for law firms
  (https://www.brak.de), Hotelverband IHA (https://www.hotellerie.de).
- State region, year and sample of each benchmark; label US/global values.
- Do not research KPIs outside the chosen focus area.

## Method
1. **North Star** for the area + 3–5 input metrics (driver tree: NSM = f(inputs)).
2. **KPI selection:** SMART, max 10, each with formula, data source and owner;
   mix leading (pipeline, leads, bookings) and lagging (revenue, margin).
3. **Baseline:** compute from records (state period); else owner value; else "no data".
4. **Benchmarks:** low / median / good with source.
5. **Targets:** conservative / target / stretch for the timeframe; growth path
   month 1 → end of period; consistency check (targets must add up: leads × win
   rate × AOV = revenue target).
6. **Traffic-light thresholds:** green ≥ target, amber within 10 %, red below.
7. **Dashboard spec:** layout, chart type, frequency, data source tab, owner.

## Output skeleton
Translate headings and table headers when `lang=de`.
```
## KPI estimation – <Focus area> – <Company>
<executive summary>
### KPI tree
| Level | KPI | Drives |
### KPI benchmarks
| KPI | Formula | Current | Period | Benchmark low / median / good | Source | Gap |
### Targets
| KPI | Baseline | Conservative | Target | Stretch | Timeframe | Confidence |
### Thresholds
| KPI | Green | Amber | Red |
### Dashboard spec
| Widget | KPI | Chart type | Data source (platform tab) | Frequency | Owner |
### Data gaps
| KPI | Missing data | Where to enter |
### Next steps
```

## Quality bar
- [ ] Every KPI has a formula and a data source; baselines computed, not guessed.
- [ ] Benchmarks cited with links, region and year.
- [ ] Targets are internally consistent (driver math shown for the NSM).
- [ ] ≤ 10 KPIs; each one has an owner.
- [ ] If `previous_result` exists: actual vs. old targets, recalibrate.

## Tasks & alerts
Tasks (max 5): "Enter missing data for <KPI> in <tab>" (high), "Set up monthly
KPI review" (medium), "Agree targets with team" (medium), "Act on red KPI <x>" (high).
Alerts:
- KPI in red vs. benchmark "low" (e.g. gross margin, food cost % > 35 %) → `warning`.
- Gross margin dropped > 5 pp vs. previous run → `warning`, link `finance`.
- Low-stock items > 0 when area is operations → `warning`, link `collection:inventory`.
- No data for the North Star → `recommendation` (where to start tracking).
