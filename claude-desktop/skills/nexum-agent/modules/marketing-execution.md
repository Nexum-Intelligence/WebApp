# Marketing Execution (`marketing-execution`)

## Goal
Turn one campaign goal into launch-ready material: concrete campaign setups per
channel (targeting, budget split, bidding, tracking), the actual content assets
(ad copy, post texts, email, landing-page brief) and a performance dashboard spec
with targets the owner can check weekly. Output must be copy-paste usable.

## Inputs to use
| Source | Use |
|---|---|
| `inputs.campaignGoal` (Awareness / Leads / Sales / Retention, required) | Objective, KPI set, bidding strategy. |
| `inputs.channels` | Channel list; if empty, choose from campaign history + industry. |
| `inputs.budget` | Monthly budget; parse "2.000 €" → 2000. |
| `inputs.offer` | What is promoted → hooks, CTA, landing page. |
| profile `targetCustomer`, `location`, `usp`, `website`, `brandValues` | Targeting radius, messaging, tone. |
| `nexum_agent_records(run.id, 'campaigns')` → `name, channel, status, budget, leads` | Historic CPL per channel = `budget / leads`. |
| `nexum_agent_records(run.id, 'customers')` → `stage, value` | Avg order/deal value (AOV) = Σ value(Customer) / #Customer. |
| `nexum_agent_records(run.id, 'products')` → `name, price, cost` / `sales` → `revenue, profit` | Gross margin % = (price − cost) / price → break-even ROAS. |

Formulas:
- CAC = marketing spend / new customers; CPL = spend / leads.
- ROAS = attributed revenue / ad spend; **break-even ROAS = 1 / gross margin %**
  (40 % margin → 2.5).
- Target CPA = AOV × gross margin % × 0.3–0.5 (keeps profit after ads).
- Required leads = revenue target / (AOV × lead-to-customer rate).
- CTR = clicks / impressions; CVR = conversions / clicks; CPM = spend / impressions × 1000.

## Ask first if…
- `budget` empty and goal is Leads/Sales →
  `{"key":"budget","label":"Monthly ad budget?","type":"select","options":["0 € (organic)","300 €","1.000 €","3.000 €+"]}`
- `offer` empty and no active product stands out →
  `{"key":"offer","label":"Which product/service and which offer (price, discount, free consult)?","type":"textarea"}`
- No website/landing page in profile and channel is paid →
  `{"key":"landing","label":"Where should ad clicks go?","type":"select","options":["Website page","Booking tool","WhatsApp/phone","No page yet"]}`
Otherwise assume: budget = 500 €/month, 70/30 split between best historic channel
and one test channel, landing = website contact/booking page.

## Research
- Current DACH CPC/CPM ranges for the chosen channels and industry: e.g. WordStream
  Google Ads benchmarks (https://www.wordstream.com/blog/ws/google-ads-industry-benchmarks),
  Meta Ads Help (https://www.facebook.com/business/help), LinkedIn Ads
  (https://business.linkedin.com/marketing-solutions/ads). Mark US benchmarks as
  such and adjust (DACH CPCs often differ).
- Email benchmarks: Mailchimp (https://mailchimp.com/resources/email-marketing-benchmarks/).
- Platform ad policies for sensitive industries (health, legal, alcohol).
- Do not research creative trends in general or tools the owner does not use.

## Method
1. **Objective → KPI tree:** goal → primary KPI (reach / CPL / ROAS / repeat rate)
   → channel KPIs.
2. **Budget math:** budget → expected clicks (budget / CPC) → conversions (× CVR)
   → customers (× close rate) → revenue (× AOV). Show the chain as a table with
   low / expected / high.
3. **Campaign setup per channel:** objective, audience (geo radius, age, interests,
   keywords incl. negatives), placements, bidding, daily budget, schedule, tracking
   (UTM `utm_source/medium/campaign`, conversion event, call tracking).
4. **Assets:** per channel 3 hooks × 2 variants (headline ≤ 30 chars for Google RSA,
   primary text ≤ 125 chars for Meta), 1 email, landing-page brief (headline,
   3 benefits, proof, CTA, form fields).
5. **Test plan:** one variable per test, minimum 1 week / 100 clicks before judging.
6. **Dashboard spec:** metrics, source, frequency, target, owner.

## Output skeleton
Translate headings and table headers when `lang=de`.
```
## Campaign setup – <Company>
<executive summary: goal, budget, expected outcome range>
### Budget & forecast
| Channel | Budget €/month | CPC/CPM (est.) | Clicks | CVR | Leads/Sales | Revenue € | ROAS |
### Campaign setups
#### <Channel>
| Setting | Value |
### Content assets
| Channel | Asset | Variant | Headline / hook | Body | CTA |
### Landing page brief
### Test plan
| Week | Test | Variant A | Variant B | Success metric |
### Performance dashboard spec
| KPI | Formula | Source | Target | Frequency | Owner |
### Next steps
```

## Quality bar
- [ ] Budget split sums exactly to the budget; forecast labelled as estimate with ranges.
- [ ] Target ROAS ≥ break-even ROAS derived from the real margin (or flagged).
- [ ] Copy respects character limits, `run.lang`, tone and legal limits (HWG, BRAO, UWG).
- [ ] Every campaign has UTM + conversion tracking defined.
- [ ] Uses historic CPL from `campaigns` where available.

## Tasks & alerts
Tasks (max 5): "Set up conversion tracking + UTMs" (high), "Launch <channel>
campaign" (high), "Build landing page per brief" (medium), "Enter campaign in
Marketing (CRM) with budget" (medium), "Review results after 7 days" (medium).
Alerts:
- Planned target ROAS below break-even ROAS → `warning` ("campaign loses money per sale").
- Historic channel CPL > max affordable CPA → `warning`, link `collection:campaigns`.
- Active campaign with 0 leads in 30 days → `recommendation`.
