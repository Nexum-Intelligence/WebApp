# Competitor Analysis (`competitor-analysis`)

## Goal

Show the owner exactly who they compete with for the same customer and budget, how each
competitor is positioned (price, quality, specialisation, convenience), and where the
white spaces are. Outcome: a positioning decision ("where we play and how we win") plus
2–3 differentiation moves with € effect.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.competitors` | Mandatory seed list; research each, add up to 3 missing direct/indirect ones. |
| `inputs.market` | Category and geography; defines direct vs. indirect competition. |
| `inputs.yourEdge` | Hypothesis to verify against evidence (reviews, prices, features). |
| `context` revenue, customers, products & margins, marketing | Own position, pricing power, channel spend. |
| `nexum_records(email,'products')` | Own prices for the price comparison column. |
| `nexum_records(email,'customers')` | Where customers come from; lost customers if tracked. |
| `nexum_records(email,'campaigns')` | Own channels/spend vs. competitors' visible channels. |
| `profile.product`, `profile.customers` | Offer and ICP. |
| `previous_result` | Track changes per competitor (new prices, new offers, rating moves). |

Compute:
- **Price index** = own price ÷ competitor median price × 100 (for 2–3 comparable reference items).
- **Review strength** = rating × log10(review count) — compares 4.8★/12 vs. 4.5★/900 fairly.
- **Share of voice proxy** = own reviews (or followers) ÷ sum of all players in the set.
- **Pricing power**: own gross margin vs. sector benchmark; price index > 110 with stable
  volume = premium accepted.

## Ask first if…

1. `inputs.competitors` contains only generic categories ("other agencies") and the market
   is local — ask for names or the location.
2. Positioning goal unclear (premium vs. price leader) when the evidence allows both.

```json
[{"key":"names","label":"Name 3–5 competitors your customers also consider (or your city/district)","type":"textarea"},
 {"key":"ambition","label":"How do you want to be perceived?","type":"select","options":["Premium / best quality","Best value","Specialist for a niche","Fastest / most convenient"]}]
```

Otherwise: identify competitors via search (Google Maps radius 3–10 km for location-bound
businesses; category searches for digital/product) and assume the positioning implied by
the current price index.

## Research

- Competitor websites: offer, price lists/menus/fee packages, opening hours, booking options.
- Google Business profiles: rating, review count, recurring complaint and praise themes.
- Platforms: Doctolib/Jameda (practices), anwalt.de (law), TripAdvisor/Booking.com/HolidayCheck
  (hotel/gastro), Capterra/OMR Reviews/G2 (software), Etsy/Amazon (products), Instagram follower counts.
- Signals: job postings (growth), new locations, funding news (Crunchbase, Handelsregister).
- Do not research competitors outside the relevant geography for local businesses; do not guess
  revenues — use Bundesanzeiger only if filed, otherwise state "not public".
- Link every competitor fact.

## Method

1. **Set definition**: direct (same offer, same customer), indirect (different offer, same job),
   substitute (do nothing / DIY / in-house). 5–8 players total.
2. **Competitor matrix**: offer, price, target group, USP claim, channels, rating, strengths, weaknesses.
3. **Five forces (short)**: rivalry, buyer power, supplier power, threat of new entrants,
   substitutes — each rated low/medium/high with one evidence line.
4. **Positioning map**: choose the 2 axes that customers actually decide on (derive from reviews),
   e.g. price × specialisation, price × convenience, quality × speed, personal service × digital.
   Place every player with 1–10 coordinates in a table; describe the empty quadrant.
5. **Review mining**: top 3 complaints across competitors = gaps you can close.
6. **Gap analysis**: unmet needs × own capability × effort → 3 differentiation moves with € effect
   (price increase possible, new segment volume, conversion uplift).

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Competitor Analysis – <company>
<summary: main rival, our position, best gap>
### Competitive set
### Competitor matrix
| Competitor | Type | Offer | Price (ref. item) | Target group | Rating (#reviews) | Strengths | Weaknesses | Link |
### Price comparison
| Reference item | Us € | Competitor A € | B € | C € | Median € | Price index |
### Five forces
| Force | Level | Evidence |
### Positioning map
| Player | Axis X (1–10) | Axis Y (1–10) | Note |
<one paragraph: white space>
### Customer voice (review mining)
### Gap analysis & differentiation moves
| Gap | Evidence | Our move | Effort | € effect/year |
### Sources
### Next steps
```

## Quality bar

- [ ] All competitors real and linked; ratings with date of retrieval.
- [ ] Own prices from `products` records, not guessed.
- [ ] Axes justified from customer evidence, not generic "price vs quality" by default.
- [ ] `inputs.yourEdge` explicitly confirmed or challenged with evidence.
- [ ] Moves are specific (e.g. "online booking + 24h reply guarantee"), with € effect labelled as estimate.
- [ ] Changes vs. `previous_result` listed per competitor.

## Tasks & alerts

Tasks: adjust price of reference item, close top review-gap (e.g. response time), collect
10 new reviews, monitor competitor X quarterly, run `value-proposition` on the chosen position.

Alerts:
- `warning` — own rating ≥ 0.3★ below set median or price index > 120 without better rating.
- `info` — new competitor opened / launched within the market (with link).
- `recommendation` — price index < 85 with rating ≥ median → price increase potential (`impact` €/year = volume × price gap).
