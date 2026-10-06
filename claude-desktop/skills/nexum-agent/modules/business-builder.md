# Business Builder (`business-builder`)

## Goal

Produce a bank- and funder-ready business plan package: the business plan in the
structure German banks, Gründungszuschuss assessors (fachkundige Stelle) and Förderbanken
expect, a 10–12 slide pitch-deck outline, a compact financial plan (12 months + 3 years)
and a 12-month roadmap. Outcome: the owner can submit or pitch with minimal editing and
knows which figures still need proof.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.businessName` | Title and naming throughout. |
| `inputs.oneLiner` | Executive summary core; sharpen to "We help <who> <achieve what> by <how>". |
| `inputs.goal12m` | Roadmap end state and 12-month targets. |
| `inputs.teamSize` | Personnel plan and founder section. |
| `context` (all) | Actuals for existing businesses: revenue, costs, margin, customers, staff, stock, invoices. |
| `nexum_records(email,'products')` | Offer & pricing chapter; unit economics. |
| `nexum_records(email,'staff')` | Personnel costs (gross + ~21 % employer contributions DE; ~30 % AT). |
| `nexum_records(email,'suppliers')`, `'purchases'` | Procurement chapter, COGS assumptions. |
| `nexum_records(email,'customers')`, `'sales'` | Traction evidence, customer structure. |
| `profile` all sections | Legal form, location, founders, goals. |
| `retrieved` earlier results (market, competitors, SWOT, financial-planning) | Reuse as chapters; do not redo. |

Compute:
- **Gross margin** = (revenue − COGS) ÷ revenue; **EBIT** = revenue − COGS − opex − depreciation.
- **Break-even revenue** = fixed costs ÷ gross margin %.
- **Capital requirement** = investments (capex) + start-up costs + working capital
  (≈ 3 months of opex + stock) + liquidity reserve − own funds.
- **Owner's living costs (Privatentnahme)** must be in the plan for sole proprietors.
- **Runway** = cash ÷ monthly net burn.

## Ask first if…

1. Purpose of the plan unknown — bank loan, Gründungszuschuss, investor and internal plans differ.
2. Founder's own capital and private withdrawal needs unknown (needed for capital requirement).
3. No price/volume basis exists (no sales data, no price in profile).

```json
[{"key":"purpose","label":"Who will read the plan?","type":"select","options":["Bank / KfW loan","Gründungszuschuss (Agentur für Arbeit)","Investors","Internal planning"]},
 {"key":"equity","label":"Own capital available (€) and monthly private withdrawal needed (€)?","type":"text"},
 {"key":"volume","label":"Expected sales in month 1 and month 12 (units, covers, clients or hours)?","type":"text"}]
```

Otherwise assume internal planning, 10 % equity of capital need, private withdrawal
2.000 €/month (sole proprietor), ramp-up 30 % → 80 % of capacity over 12 months. Label.

## Research

- Market size and competitors for the market chapter (reuse `market-intelligence` result if present).
- Bank expectations: KfW business-plan checklist, IHK Businessplan guidelines, Gründerplattform.
- Legal form and permits: Gewerbeanmeldung, Gaststättenerlaubnis/HACCP (gastro),
  Kassenzulassung/KV-Sitz (practice), Kammer membership (law, crafts), Impressum/GDPR.
- Insurance and social security (Künstlersozialkasse for artists, Versorgungswerk for lawyers/doctors).
- Funding options: point to `subsidy-research`; mention only directly relevant programmes with link.
- Do not research generic "how to write a business plan" content.

## Method

1. **Business plan chapters** (bank standard): 1 Executive summary · 2 Founders & team ·
   3 Offer & customer benefit · 4 Market & competition · 5 Marketing & sales ·
   6 Organisation, location, legal form · 7 Opportunities & risks · 8 Financial plan
   (investment, capital requirement & financing, personnel, profitability, liquidity) · 9 Appendix list.
2. **Financial plan lite**: monthly 12-month profitability and liquidity; 3-year annual
   (Base case) with growth assumptions; capital requirement and financing table.
3. **Pitch deck outline** (10–12 slides): Problem, Solution, Market, Product, Business model,
   Traction, Go-to-market, Competition, Team, Financials, Ask/Use of funds, Contact — one
   key message and the evidence per slide.
4. **Roadmap**: 4 quarters × workstreams (Offer, Sales/Marketing, Operations, Team, Finance)
   with milestones that map to `inputs.goal12m`.
5. **Risk section**: top 5 risks × probability × impact × mitigation (banks read this).

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Business Plan – <businessName>
<executive summary 5–7 sentences: offer, market, model, team, capital need, break-even>
### 1 Founders & team
### 2 Offer & customer benefit
### 3 Market & competition
### 4 Marketing & sales
### 5 Organisation, location & legal form
### 6 Opportunities & risks
| Risk | Probability | Impact | Mitigation |
### 7 Financial plan
#### Capital requirement & financing
| Item | € | Financing source | € |
#### Profitability (12 months)
| Month | Revenue | COGS | Gross profit | Personnel | Rent | Other opex | EBIT |
#### 3-year overview
| Year | Revenue | Gross margin % | EBIT | Cash end of year |
#### Liquidity & break-even
### Pitch deck outline
| # | Slide | Key message | Evidence / number |
### 12-month roadmap
| Quarter | Offer | Sales & marketing | Operations | Team | Finance | Milestone |
### Open data & proof points
### Next steps
```

## Quality bar

- [ ] Every figure from records or a labelled assumption; totals add up across tables.
- [ ] Capital requirement includes working capital, reserve and private withdrawals.
- [ ] Bank-relevant risks addressed honestly; no exaggerated market claims.
- [ ] Industry vocabulary and correct DACH legal/regulatory terms.
- [ ] Consistent with `previous_result` and earlier module outputs (same prices, same numbers).
- [ ] "Open data & proof points" lists what the bank will ask for (offers, LOIs, lease).

## Tasks & alerts

Tasks: collect quotes for investments, prepare 3 letters of intent, book bank/Förderbank
appointment (or IHK/Gründerberatung), complete missing data in Income & Expenses,
run `subsidy-research` / `funding-finance`.

Alerts:
- `critical` — liquidity negative in any month without financing.
- `warning` — break-even later than month 24, or equity share < 10 % for a bank loan.
- `recommendation` — eligible for KfW StartGeld / Gründungszuschuss (link `module:subsidy-research`).
