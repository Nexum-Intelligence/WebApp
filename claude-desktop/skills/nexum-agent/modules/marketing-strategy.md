# Marketing Strategy (`marketing-strategy`)

## Goal
A complete, realistic marketing strategy for the next 3–6 months: positioning,
target segments, AARRR funnel design with stage targets, channel mix with budget,
a 30-day starter roadmap and a content plan. Designed for owners with ≤ 10 h/week
for marketing.

## Inputs to use
| Source | Use |
|---|---|
| `inputs.goal` (Awareness / Lead generation / Sales / Retention, required) | Defines the North Star and which funnel stage gets most budget. |
| `inputs.audience` | Segments/personas; fall back to profile `targetCustomer`, `segments`. |
| `inputs.budget` | Channel budget split. |
| profile `valueProp`, `usp`, `positioning`, `competitors`, `marketRegion`, `goals12m` | Positioning, local scope, goal alignment. |
| context FINANCE / CUSTOMERS / MARKETING | Revenue, customers, pipeline, campaigns, leads. |
| `nexum_records(email,'customers')` → `stage, value` | Stage counts: Lead, Qualified, Customer, Churned → current funnel. |
| `nexum_records(email,'campaigns')` → `channel, budget, leads, status` | CPL per channel. |
| `nexum_records(email,'sales')` → `productName, revenue, profit, date` | Repeat purchase signals, seasonality by month. |

Formulas:
- Funnel rates (stage snapshot, not cohorts): Lead→Qualified = (#Qualified +
  #Customer + #Churned) / all contacts; Qualified→Customer = (#Customer + #Churned)
  / (#Qualified + #Customer + #Churned); churn rate = #Churned / (#Customer + #Churned).
- CAC = marketing spend / new customers; LTV ≈ AOV × purchases/year × gross margin
  × expected years; LTV:CAC target ≥ 3.
- Marketing budget sanity: 3–10 % of revenue for SMEs (state as rule of thumb).

## Ask first if…
- No budget anywhere →
  `{"key":"budget","label":"Monthly marketing budget (money and hours)?","type":"text"}`
- Audience unclear and more than one plausible segment →
  `{"key":"segment","label":"Which customer group should we win first?","type":"select","options":["<segment A>","<segment B>","Both"]}`
- Capacity unknown →
  `{"key":"capacity","label":"Hours per week available for marketing?","type":"select","options":["< 3 h","3–10 h","> 10 h / agency"]}`
Otherwise assume 5 h/week, budget = 5 % of monthly revenue (or 300 € if no revenue),
local market radius 25 km for local businesses.

## Research
- Competitors' visible marketing: website, Google rating count, Instagram/LinkedIn
  activity, ads in Meta Ad Library (https://www.facebook.com/ads/library/).
- Channel usage in DACH: DataReportal Germany/Austria/Switzerland
  (https://datareportal.com/reports/digital-2025-germany).
- Industry channel norms (gastro: Google Maps, Instagram, delivery platforms;
  hotel: Booking/OTA vs. direct; medical: Doctolib/Jameda + GBP; law: SEO + referral;
  B2B services: LinkedIn + referral; artists: Instagram/TikTok + newsletter).
- Do not research global statistics without DACH relevance.

## Method
1. **Situation:** 5 key numbers from context + what works today (best CPL channel).
2. **STP:** segment (2–3 segments), target (pick 1 primary with reason),
   positioning statement.
3. **North Star metric** tied to `goal` (e.g. booked appointments/month,
   repeat guests/month, qualified leads/month) + 3–4 input metrics.
4. **AARRR funnel design:** per stage: channel/tactic, current rate, target rate,
   key action.
5. **Channel mix:** score channels with ICE (Impact, Confidence, Ease 1–10);
   pick top 3; split budget 60/30/10 (core / growth / test).
6. **30-day roadmap:** 4 weeks, max 3 tasks per week.
7. **Content plan:** 3 pillars × formats × channels (see `content-plan` method).

## Output skeleton
Translate headings and table headers when `lang=de`.
```
## Marketing strategy – <Company>
<executive summary>
### Situation analysis
| KPI | Current | Source |
### Target segments & positioning
| Segment | Need | Size/value | Priority |
### North Star & input metrics
| Metric | Type | Current | Target (90 days) |
### Funnel design (AARRR)
| Stage | Tactic / channel | Current rate | Target rate | Key action |
### Channel mix & budget
| Channel | ICE (I/C/E) | Score | Budget €/month | Hours/week | Primary KPI |
### 30-day roadmap
| Week | Tasks | Owner | Output |
### Content plan
| Pillar | Format | Channel | Frequency | Example topic |
### Next steps
```

## Quality bar
- [ ] Strategy follows one primary goal; no "do everything everywhere".
- [ ] Funnel uses real stage counts from `customers`; missing data → template + which tab to fill.
- [ ] Budget and hours fit stated capacity.
- [ ] LTV:CAC or break-even logic shown when margin data exists.
- [ ] If `previous_result` exists: compare targets vs. achieved and adjust.

## Tasks & alerts
Tasks (max 5): "Maintain customer stages in CRM weekly" (medium), "Start channel 1
per roadmap week 1" (high), "Set up monthly KPI check" (medium), "Ask 5 best
customers for referrals/reviews" (medium).
Alerts:
- Lead→Customer rate < 10 % with ≥ 20 leads → `warning` (sales follow-up problem).
- Churned > 20 % of customers → `warning`, link `collection:customers`.
- Marketing budget > 15 % of revenue without lead growth → `info`.
- No leads recorded in 30 days → `recommendation`.
