# Trend & PESTEL Analysis (`trend-pestel`)

## Goal

Translate macro forces into concrete consequences for this business: which political,
economic, social, technological, environmental and legal developments will hit revenue,
costs or operations within the chosen horizon, how hard, and what to do now. Outcome: a
trend radar, a PESTEL canvas with € exposure, and a short list of "prepare now" actions
with deadlines (especially legal ones).

## Inputs to use

| Source | Use |
|---|---|
| `inputs.focus` | What to scan for (e.g. "energy costs and staff shortage", "AI in tax advice"). Weight factors toward it. |
| `inputs.market` | Country/region and sector (DE/AT/CH rules differ — separate them). |
| `inputs.horizon` | 1 / 3 / 5 years — filter trends by time to impact. |
| `context` revenue, expenses, COGS, staff, inventory, suppliers | Exposure: energy share of costs, wage share, import share, stock levels. |
| `nexum_agent_records(run.id, 'transactions')` | Cost categories (energy, rent, wages, fuel, interest) for sensitivity. |
| `nexum_agent_records(run.id, 'suppliers')`, `'purchases'` | Input price exposure, country of origin. |
| `nexum_agent_records(run.id, 'staff')` | Minimum-wage exposure, part-time/mini-job share. |
| `profile` | Sector, location, offer. |

Compute (exposure, € per year):
- **Wage exposure** = staff costs × expected wage increase % (e.g. Mindestlohn step).
- **Energy exposure** = annual energy cost × expected price change %.
- **Interest exposure** = variable-rate debt × rate change.
- **Input price exposure** = COGS × category inflation %.
- **Revenue exposure** = affected revenue share × expected demand change %.
- **Cost ratio** per category = category cost ÷ revenue (shows which shocks matter).

## Ask first if…

Usually no. Ask only when exposure cannot be estimated and it matters for the focus:
1. Energy/wage/interest data missing and the focus is cost pressure.
2. Several countries served but `inputs.market` empty.

```json
[{"key":"energy","label":"Annual energy cost (electricity + gas) in €?","type":"text"},
 {"key":"countries","label":"Which countries do you sell in?","type":"select","options":["Germany","Austria","Switzerland","DACH","EU-wide"]}]
```

Otherwise use cost ratios from context and sector benchmarks, labelled as estimates.

## Research

- **P**: funding priorities, tax changes (VAT on food in gastro, Kleinunternehmerregelung
  thresholds), healthcare policy (KV, GOÄ reform), Bürokratieabbau, state elections affecting rules.
- **E**: inflation (Destatis/Statistik Austria), ECB rates, sector forecasts (ifo, DIW, WIFO),
  energy price outlook, wage agreements and Mindestlohn decisions.
- **S**: demographics, skilled-labour shortage (Fachkräftemonitor), consumer behaviour
  (HDE Konsumbarometer), remote work, health/sustainability preferences.
- **T**: AI adoption, e-invoicing (E-Rechnung B2B obligation timeline), TI/ePA for practices,
  beA/e-Akte for law firms, payment and booking platforms.
- **E (environment)**: CO2 pricing (BEHG/EU ETS2), packaging law (VerpackG), CSRD supply-chain
  requests passed down to SMEs, heat/climate effects on tourism.
- **L**: GDPR enforcement, EU AI Act timeline, Accessibility Act (BFSG, from June 2025),
  working-time recording, industry-specific law.
- Sources: official sites (bundesregierung.de, BMWK, BMF, BMG, EU-Lex, ris.bka.gv.at, admin.ch),
  institutes, associations. Link every item with date. Skip global megatrend listicles.

## Method

1. **Scan**: 2–4 factors per PESTEL dimension relevant to `inputs.focus`, sector and region.
2. **Assess** each: direction (+/−), impact on this business (1–5), probability (1–5),
   time to impact (≤ 1 y / 1–3 y / 3–5 y), € exposure using the formulas above.
3. **Trend radar**: place trends in rings (act now / prepare / watch) and sectors
   (market, technology, regulation, society). Render as a table.
4. **Compliance deadlines**: list legal changes with effective dates as a separate table.
5. **Implications**: for the top 5 by impact × probability → response (adapt, exploit, hedge),
   € effect, first step.
6. **Early-warning indicators**: what to monitor and the threshold that triggers action.

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Trend & PESTEL Analysis – <company>
<summary: biggest risk, biggest opportunity, nearest deadline>
### PESTEL canvas
| Dimension | Factor | Direction | Impact (1–5) | Probability (1–5) | Timing | € exposure/year | Source |
### Trend radar
| Trend | Area | Ring (act now / prepare / watch) | Why it matters for us |
### Legal & compliance deadlines
| Rule | Applies from | What we must do | Effort | Link |
### Implications & responses
| Factor | Response | € effect | First step | Owner |
### Early-warning indicators
| Indicator | Source | Threshold | Action |
### Sources
### Next steps
```

## Quality bar

- [ ] Only factors with a stated effect on this business; no generic megatrends.
- [ ] Country-specific (DE vs. AT vs. CH) legal statements; dates verified and linked.
- [ ] € exposure calculated from the company's own cost structure.
- [ ] Horizon respected; items beyond horizon go to "watch".
- [ ] Consistent with `previous_result`; mark new, changed or expired items.

## Tasks & alerts

Tasks: prepare for the nearest legal deadline, renegotiate energy contract / hedge,
adjust prices for wage increase, set monitoring for 2 indicators, follow-up `swot-analysis`.

Alerts:
- `critical` — legal obligation effective within 90 days and not yet addressed.
- `warning` — single factor exposure > 5 % of annual profit.
- `recommendation` — opportunity factor with € upside (e.g. subsidy, demand shift) → link `module:subsidy-research` or relevant module.
