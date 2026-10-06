# Value Proposition (`value-proposition`)

## Goal

Sharpen why a specific customer should choose this business over the alternative
(including doing nothing). The owner gets a Value Proposition Canvas grounded in real
customer evidence, a fit assessment, one positioning statement, and 3–4 messaging pillars
with proof points and ready-to-use copy for website, offer and pitch.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.customer` | Customer profile segment; one canvas per segment (max 2). |
| `inputs.problem` | Pains and jobs; verify against reviews, customer data, research. |
| `inputs.benefit` | Gain creators; translate into measurable outcomes (time, €, risk, status). |
| `context` customers, sales, products & margins, marketing | Which offers sell, to whom, at what margin. |
| `nexum_records(email,'products')` | Products & services column; flagship offer. |
| `nexum_records(email,'customers')` | Segment sizes, best customers (highest revenue, repeat). |
| `nexum_records(email,'campaigns')` | Which messages/channels converted before. |
| `profile.product`, `profile.customers`, `profile.goals` | Offer and positioning ambition. |
| `retrieved` competitor / validation results | Alternatives and evidence. |

Compute (to quantify value):
- **Customer value in €** = time saved (h) × customer's hourly value, or cost avoided,
  or revenue gained for B2B; for B2C use price of the alternative.
- **Value-to-price ratio** = quantified customer value ÷ price (target ≥ 3 for B2B).
- **Segment attractiveness** = segment revenue share × gross margin × repeat rate.
- **Price premium potential** = (own price − alternative price) supported by unique gains.

## Ask first if…

1. `inputs.problem` and `inputs.benefit` are empty and no reviews/customer feedback exist.
2. Two very different segments are possible (e.g. private vs. corporate clients) and data
   does not show which one matters more.

```json
[{"key":"quote","label":"What do your best customers say when they recommend you? (2–3 phrases)","type":"textarea"},
 {"key":"alternative","label":"What would your customer do if you didn't exist?","type":"text"},
 {"key":"segment","label":"Which segment is most important for the next 12 months?","type":"text"}]
```

Otherwise use reviews (Google, platform profiles) and the highest-margin segment from records.

## Research

- Own reviews and competitor reviews (Google, Jameda/Doctolib, anwalt.de, TripAdvisor,
  Booking, Trustpilot, Etsy) → real customer language for pains and gains.
- Competitor claims (homepage headlines, taglines) to avoid me-too messaging.
- Category forums/communities for recurring complaints.
- Legal guardrails for claims: HWG (Heilmittelwerbegesetz) for practices, BORA/berufsrecht
  advertising rules for lawyers, UWG for comparative and "best" claims, LMIV/health claims for food.
- Do not research generic VPC theory. Link review sources used.

## Method

1. **Customer profile** (per segment): jobs (functional, social, emotional), pains ranked
   by severity × frequency, gains ranked by relevance (required, expected, desired, unexpected).
2. **Value map**: products & services, pain relievers, gain creators — each mapped to a
   specific pain/gain (no orphans).
3. **Fit check**: table pain/gain → reliever/creator → evidence → fit (strong / weak / none).
4. **Alternatives**: do nothing, DIY, competitor, substitute — why customers switch.
5. **Positioning statement**: For <target> who <need>, <brand> is the <category> that
   <key benefit>. Unlike <alternative>, we <differentiator> — proof: <evidence>.
6. **Messaging pillars** (3–4): pillar, customer outcome, proof point (number, review,
   certificate, guarantee), copy line.
7. **Copy kit**: headline + subline (website hero), 3 bullet benefits, elevator pitch (30 s),
   offer CTA — in the customer's language, compliant with sector advertising law.

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Value Proposition – <company>
<summary: segment, core promise, strongest proof>
### Customer profile – <segment>
| Type | Item | Severity / relevance (1–5) | Evidence |
### Value map
| Pain / gain | Our reliever / creator | Product / service |
### Fit assessment
| Pain / gain | Fit (strong/weak/none) | Gap to close |
### Quantified customer value
| Value driver | Calculation | € per customer/year |
### Positioning statement
### Messaging pillars
| Pillar | Customer outcome | Proof point | Copy line |
### Copy kit
### Sources
### Next steps
```

## Quality bar

- [ ] Pains and gains backed by real reviews, records or validation answers — quoted (anonymised).
- [ ] At least one quantified customer value in €.
- [ ] Differentiator holds against named competitors (not "quality" or "service" alone).
- [ ] Claims are legally safe for the sector (HWG, BORA, UWG).
- [ ] Copy uses customer vocabulary in `run.lang`.
- [ ] Consistent with `previous_result`; changed pillars noted.

## Tasks & alerts

Tasks: rewrite website hero with new headline, add proof points (reviews, case study) to
offer page, test 2 headlines (A/B or ads), close weakest fit gap, run `go-to-market`.

Alerts:
- `warning` — main segment has weak fit on its top pain, or margin of the flagship offer < sector benchmark.
- `recommendation` — value-to-price ratio ≥ 5 → price increase potential (`impact` €/year).
- `info` — potentially non-compliant claim found in current messaging.
