# Market & Opportunity Intelligence (`market-intelligence`)

## Goal

Give the owner a go / adjust / no-go view on a market: how big the reachable demand
really is (in € and in customers), who already serves it, which trends move it, and
the 3 concrete opportunities where this company can win in the next 12 months.
The decision the owner should be able to take after reading: "enter / expand /
benchmark / drop" — with the € upside and the first move.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.idea` | Defines offer and category. Extract: product type, price point, B2B/B2C, recurring or one-off. |
| `inputs.targetMarket` | Segment definition for SAM (e.g. "Zahnarztpraxen in Bayern", "B2B SaaS DACH"). |
| `inputs.competitors` | Seed list for the competitor matrix; extend via research to 5–8. |
| `inputs.region` | Geography filter for all statistics (Destatis/Statistik Austria/BFS per country). |
| `inputs.goal` | Weighting: *Validate* → demand evidence; *New market* → entry barriers; *Growth* → opportunity map; *Benchmark* → competitor matrix depth. |
| `context` revenue, customers, sales, products & margins | Current market share proxy and price reality. |
| `nexum_agent_records(run.id, 'customers')` | Customer mix by segment/postcode/industry → which SAM slice already converts. |
| `nexum_agent_records(run.id, 'sales')` / `'products'` | Average order value (AOV), best sellers, real price points. |
| `profile.customers`, `profile.product`, `profile.goals` | ICP, offer, ambition level. |
| `previous_result` | Reuse sources and numbers; update only what changed. |

Compute:
- **AOV** = revenue ÷ number of orders (or invoices) in the period.
- **Annual value per customer** = AOV × purchase frequency per year.
- **TAM (bottom-up)** = number of potential buyers in category × annual value per customer.
- **SAM** = TAM × share reachable by region, channel and segment fit.
- **SOM (12–36 months)** = SAM × realistic share (1–5 % for new entrants, justify with capacity:
  covers/seats, billable hours, production capacity).
- **Current share** = own revenue ÷ SAM.
- **Capacity ceiling** (services/gastro/practice) = capacity units × utilisation × price × days;
  SOM must never exceed it.

## Ask first if…

Only ask when `run.answers` is empty and the gap changes the conclusion:
1. Price point / revenue model unknown and no sales data exists.
2. Target segment is too broad to size (e.g. "everyone", "SMEs").
3. Capacity limit unclear for location-bound businesses (seats, rooms, treatment rooms, staff hours).

```json
[{"key":"price","label":"Typical price per order / per customer per year (€)?","type":"text"},
 {"key":"segment","label":"Which segment do you want to win first?","type":"select","options":["Private customers","SMEs","Enterprises","Public sector"]},
 {"key":"capacity","label":"Maximum capacity per week (seats, appointments, billable hours, units)?","type":"text"}]
```

Otherwise assume: price = median of researched competitor prices; segment = the largest
group in `customers` records; capacity = current revenue ÷ 0.7 utilisation. Label each.

## Research

- Market size: Destatis (GENESIS), Statistik Austria, BFS (CH), Eurostat, IHK/WKO
  sector reports, industry associations (DEHOGA, IHA, KZBV/KBV, BRAK, Bitkom, HDE,
  Börsenverein, BVDW), Statista only as secondary.
- Population and buyer counts: number of companies by WZ-code (Unternehmensregister),
  households, practices, inhabitants in the catchment area.
- Competitors: websites, Google Maps ratings/review counts, price lists, Trustpilot,
  OMR Reviews / Capterra (software), LinkedIn headcount.
- Trends: sector association outlooks, Google Trends for 2–3 demand keywords, relevant
  regulation (e.g. e-invoicing obligation, GOÄ reform, Mindestlohn steps).
- Do not research: global market sizes irrelevant to the region, generic "AI is
  transforming everything" pieces, paid reports you cannot open.
- Cite every external number with a link; mark estimates derived from them.

## Method

1. **Define the market** in one sentence: who buys what, where, how often, for how much.
2. **Size bottom-up** (TAM → SAM → SOM) with the formulas above; cross-check one top-down
   figure (sector revenue × segment share). If the two differ > 3×, explain why.
3. **Demand evidence**: own sales trend (last 3–6 months), search interest, waiting lists,
   occupancy/utilisation benchmarks.
4. **Competitor matrix** (5–8 players): offer, price, positioning, rating, strength, weakness.
5. **Trend radar**: 6–10 trends, each rated impact (1–5) × time to impact (now / 1–2 y / 3+ y).
6. **SWOT (compact)** derived from steps 3–5 plus own KPIs (margin, customer concentration).
7. **Opportunity map**: list 5–8 opportunities, score with ICE (Impact × Confidence × Ease,
   each 1–10), estimate € revenue potential per year, pick top 3.
8. **Verdict** aligned with `inputs.goal`.

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Market & Opportunity Analysis – <company>
<executive summary: verdict, SOM in €, top opportunity>
### Market definition
### Market size (TAM / SAM / SOM)
| Level | Definition | Buyers (#) | € per buyer/year | Volume €/year | Source / assumption |
### Demand evidence
### Competitor matrix
| Competitor | Offer | Price level | Positioning | Rating / reviews | Strength | Weakness | Link |
### Trend radar
| Trend | Driver | Impact (1–5) | Timing | Effect on us |
### SWOT (compact)
| Strengths | Weaknesses | Opportunities | Threats |
### Opportunity map
| Opportunity | € potential/year | Impact | Confidence | Ease | ICE | Priority |
### Verdict & recommendation
### Sources
### Next steps
```

## Quality bar

- [ ] SOM based on real AOV/prices from records where available; never above capacity.
- [ ] Every market figure has a linked source or is labelled "estimate" with the formula.
- [ ] Competitors are real, named, local where relevant (same city for gastro/practice).
- [ ] Industry vocabulary (covers, occupancy/RevPAR, patients/Scheine, mandates, MRR).
- [ ] Opportunities have € potential and a first concrete action, no "improve marketing".
- [ ] Consistent with `previous_result`; state what changed (new competitor, new numbers).
- [ ] No filler trends without a stated effect on this business.

## Tasks & alerts

Tasks (max 5): validate top opportunity (e.g. 5 customer calls), price check against top 3
competitors, add missing data (sales/customers tab), set up Google Trends/competitor watch,
start `customer-validation` or `go-to-market` for the chosen opportunity.

Alerts:
- `warning` — SOM < 12 months of current costs (market too small for the cost base).
- `warning` — top customer > 30 % of revenue (concentration risk, link `finance`).
- `recommendation` — opportunity with ICE ≥ 300 and € potential ≥ 10 % of revenue (`impact` in €/year).
- `info` — new strong competitor or regulation affecting the segment.
