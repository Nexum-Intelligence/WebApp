# Conversion Funnel Analysis (`conversion-funnel`)

## Goal
Show where the business loses potential customers, quantify each loss in €, and
deliver 3–7 quick wins that can be implemented within 2 weeks plus 2–3 structural
fixes. The owner should see one funnel map with numbers, one biggest leak and a
clear "fix this first".

## Inputs to use
| Source | Use |
|---|---|
| `inputs.funnel` (required) | The owner's stage list (e.g. "Instagram → website → booking → visit → repeat"). Keep their stage names. |
| `inputs.channel` | Main entry channel; use channel benchmarks for the top stages. |
| `inputs.goal` (Awareness / Leads / Sales / Retention) | Which end metric the funnel optimises. |
| `nexum_records(email,'customers')` → `stage, value, notes` | Counts per CRM stage: Lead → Qualified → Customer → Churned. |
| `nexum_records(email,'campaigns')` → `channel, budget, leads` | Top-of-funnel volume and CPL. |
| `nexum_records(email,'sales')` → `productName, qty, revenue, date` | Purchases; repeat signal (same product/customer frequency by month). |
| context INVOICES | Paid vs. outstanding → "payment" stage leak for B2B/services. |
| profile `website`, `usp`, `targetCustomer` | Landing page review, message-market fit. |

Formulas:
- Stage conversion rate CRᵢ = volume(stage i+1) / volume(stage i); drop-off = 1 − CRᵢ.
- Overall conversion = Π CRᵢ = end volume / entry volume.
- € value of a leak = (benchmark CR − actual CR) × volume(stage i) × downstream
  conversion × AOV × gross margin  → "monthly profit lost".
- CPL = budget / leads; CAC = spend / new customers; repeat rate = customers with
  ≥ 2 purchases / all customers; payment conversion = paid / invoiced.

If stage volumes are missing, build the funnel with the data that exists, mark
unknown stages as "not tracked" and specify how to measure them (GA4 event,
booking tool export, POS count, CRM stage).

## Ask first if…
- No volume for any stage and no records →
  `{"key":"volumes","label":"Rough monthly numbers per stage (e.g. 2.000 visitors, 60 inquiries, 20 bookings)?","type":"textarea"}`
- AOV unknown and no sales/customer values →
  `{"key":"aov","label":"Average revenue per customer/order?","type":"text"}`
- Tracking unclear →
  `{"key":"tracking","label":"What do you track today?","type":"select","options":["Google Analytics","Booking/shop system","Only CRM/POS","Nothing"]}`
Otherwise use industry benchmarks for missing stages and label them "benchmark-based".

## Research
- Benchmarks for the relevant stages: landing-page CVR (Unbounce
  https://unbounce.com/conversion-benchmark-report/), cart abandonment (Baymard
  https://baymard.com/lists/cart-abandonment-rate), email open/click (Mailchimp
  https://mailchimp.com/resources/email-marketing-benchmarks/), Google Ads CTR/CVR
  (https://www.wordstream.com/blog/ws/google-ads-industry-benchmarks).
- If a website exists: open it and check speed, mobile CTA, form length, trust
  elements (reviews, certifications, prices), booking friction.
- Do not research generic CRO theory; cite only benchmarks actually used.

## Method
1. **Funnel map:** align the owner's stages with AARRR (Acquisition, Activation,
   Retention, Revenue, Referral) and with the CRM stages.
2. **Measure:** volume, CR, drop-off per stage (actual vs. benchmark).
3. **Biggest leak:** rank stages by € value of the leak, not by % drop.
4. **Root causes:** per top-2 leak, 3–5 hypotheses (message, friction, trust,
   price, speed, follow-up) — mark evidence vs. assumption.
5. **Quick wins:** ICE-scored (Impact × Confidence × Ease), effort ≤ 1 day each
   (e.g. one-click booking, WhatsApp button, reply < 2 h rule, review request
   after visit, invoice reminder at day 7).
6. **Experiments:** for top 2 hypotheses: hypothesis, change, metric, duration,
   success threshold.
7. **Measurement plan** for untracked stages.

## Output skeleton
Translate headings and table headers when `lang=de`.
```
## Conversion funnel analysis – <Company>
<executive summary: overall conversion, biggest leak in €, top fix>
### Funnel map
| Stage | AARRR | Volume / month | Conversion to next | Benchmark | Gap (pp) | Source |
### Drop-off analysis
| Stage | Drop-off % | € profit lost / month (est.) | Likely causes | Evidence |
### Quick wins
| # | Action | Stage | Impact | Confidence | Ease | ICE | Effort | Owner |
### Experiments
| Hypothesis | Change | Metric | Duration | Success if |
### Measurement plan
| Stage | How to track | Tool | Platform tab |
### Next steps
```

## Quality bar
- [ ] Uses the owner's own stage names; every number has a source label
      (records / owner answer / benchmark).
- [ ] Biggest leak is chosen by € impact, calculation shown.
- [ ] Quick wins are specific to the industry and doable in ≤ 1 day.
- [ ] Benchmarks are cited with links and their region noted.
- [ ] If `previous_result` exists: show CR change per stage since last run.

## Tasks & alerts
Tasks (max 5): top 3 quick wins (high), "Track stage <x>" (medium), "Review funnel
in 30 days" (low).
Alerts:
- Any stage CR < 50 % of benchmark → `warning` with € impact.
- Qualified→Customer < 15 % with ≥ 10 qualified leads → `warning`, link `collection:customers`.
- Outstanding invoices > 20 % of invoiced → `warning`, link `finance`.
- No new leads recorded in 30 days → `recommendation`.
