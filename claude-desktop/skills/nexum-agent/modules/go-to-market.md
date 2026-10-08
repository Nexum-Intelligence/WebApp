# Go-to-Market Plan (`go-to-market`)

## Goal

A launch plan that wins the first (or next) paying customers within a defined budget:
one beachhead segment, the 2–3 channels with the best CAC-to-value fit, a pricing and
offer structure, a funnel with numeric targets and a week-by-week launch timeline. Outcome:
the owner knows exactly what to do in the first 90 days and how many leads, conversions
and € revenue to expect.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.offer` | What is launched; define entry offer, core offer, upsell. |
| `inputs.targetSegment` | Beachhead; check size and reachability. |
| `inputs.channels` | Owner's preferred channels; challenge if CAC/fit is poor. |
| `inputs.timeline` | Launch date → backwards-planned timeline. |
| `context` customers, pipeline, marketing, sales, products & margins | Baseline conversion, AOV, margin, current spend. |
| `nexum_agent_records(run.id, 'campaigns')` | Historic CPL/CAC per channel. |
| `nexum_agent_records(run.id, 'customers')`, `'sales'` | Lead sources, best segments, repeat behaviour. |
| `nexum_agent_records(run.id, 'products')` | Prices and margins for offer design. |
| `profile.customers`, `profile.goals` | ICP and ambition. |
| `retrieved` value-proposition / competitor results | Messaging and positioning to reuse. |

Compute:
- **Customers needed** = revenue target ÷ (AOV × purchases in period).
- **Funnel backwards**: leads = customers ÷ close rate; visitors = leads ÷ conversion rate.
- **CAC** = marketing + sales spend ÷ new customers (per channel where possible).
- **Allowable CAC** = first-order contribution (or 12-month contribution) × 0.3–0.5 for
  one-off sales; LTV ÷ 3 for recurring.
- **Payback months** = CAC ÷ monthly contribution per customer.
- **Budget check** = Σ channel budgets ≤ stated budget; expected customers per channel = budget ÷ CAC.

## Ask first if…

1. Marketing budget unknown and the plan depends on paid channels.
2. Revenue/customer target for the launch period is missing and there is no data to infer it.
3. B2B: decision-maker role unknown (changes channel choice entirely).

```json
[{"key":"budget","label":"Marketing budget for the first 3 months (€)?","type":"text"},
 {"key":"target","label":"How many customers or how much revenue in the first 90 days?","type":"text"},
 {"key":"buyer","label":"Who decides on the purchase?","type":"select","options":["Private person","Owner / managing director","Department head","Purchasing / procurement"]}]
```

Otherwise assume budget = 5 % of planned revenue (min 500 €), target = break-even volume, buyer = owner.

## Research

- Channel benchmarks for the sector/region: Google Ads CPC (Keyword Planner ranges), Meta CPM,
  typical conversion rates; local options (Google Business Profile, Doctolib, OpenTable/Quandoo,
  Booking.com commission 15–18 %, Lieferando commission, marketplaces, LinkedIn).
- Competitor launch offers and pricing (introductory deals, packages).
- Events, trade fairs, associations, Kammern and networks in the region (BNI, IHK events).
- Legal: price indication (PAngV), Impressum, consent for email (UWG §7, DOI), HWG/BORA advertising limits.
- Do not research generic growth-hacking lists. Link benchmarks with date.

## Method

1. **Beachhead**: confirm segment (size, pain, reachability, willingness to pay); write the ICP.
2. **Offer architecture**: entry offer (low-risk first purchase), core offer, upsell/retention
   offer; pricing with anchor and launch incentive (time-limited, no permanent discounting).
3. **Channel selection**: score candidate channels on reach in segment, expected CAC, speed,
   owner skill/effort (1–5) → pick 2–3; one "owned" channel (email/WhatsApp/community) mandatory.
4. **Funnel & targets**: stages (reach → lead → offer/trial → customer → repeat/referral)
   with conversion rates and weekly targets.
5. **Launch timeline**: pre-launch (−6 to −1 weeks: assets, waiting list, partners),
   launch week, post-launch (weeks 1–8: optimise, referrals, reviews).
6. **Sales process** (B2B/high-ticket): outreach script, follow-up cadence, offer template.
7. **Measurement**: KPI dashboard with weekly targets and stop/scale rules per channel
   (stop if CAC > allowable after 300 € spend; scale if < 70 % of allowable).

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Go-to-Market Plan – <company>
<summary: beachhead, offer, top channels, 90-day target>
### Beachhead & ICP
### Offer & pricing
| Offer | Purpose | Price € | Margin % | Launch incentive |
### Channel strategy
| Channel | Reach | Expected CAC € | Speed | Effort | Score | Budget € | Expected customers |
### Funnel targets
| Stage | Conversion % | Week 4 | Week 8 | Week 12 |
### Unit economics check
| Metric | Value | Formula |
### Launch timeline
| Week | Activity | Channel | Owner | Deliverable |
### Stop / scale rules
### Sources
### Next steps
```

## Quality bar

- [ ] Targets derived backwards from revenue goal with real AOV/margins.
- [ ] CAC estimates per channel sourced or labelled; allowable CAC shown.
- [ ] Budget totals match; plan doable with stated team hours.
- [ ] Sector-specific channels (e.g. Doctolib for practices, Booking for hotels) considered.
- [ ] Legal compliance of promotions noted.
- [ ] Update runs: compare actual funnel vs. targets from `previous_result`.

## Tasks & alerts

Tasks: build entry-offer landing page, set up Google Business Profile / booking tool, prepare
launch email to existing contacts, configure tracking (UTM, conversions), weekly KPI check.

Alerts:
- `warning` — CAC above allowable CAC on any channel with spend > 300 €.
- `warning` — required leads > 3× historic monthly leads (target unrealistic).
- `recommendation` — channel with CAC < 50 % of allowable → shift budget (`impact` extra customers × contribution).
