# Funding & Finance (`funding-finance`)

## Goal

Answer three questions for the owner: How much money is really needed (and when)? Which
funding mix is realistic and cheapest (equity, loans, Förderkredite, grants, revenue-based,
bootstrapping)? What exactly must go into the application or investor deck? Outcome: a
financing plan with the recommended mix, the application document set and an investor or
bank deck outline.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.fundingAmount` | Stated need — verify against computed capital requirement; flag gap. |
| `inputs.useOfFunds` | Use-of-funds table (capex, stock, marketing, hires, working capital, reserve). |
| `inputs.currentRevenue` | Stage, bankability, investor fit; compare with context revenue. |
| `inputs.fundingType` | Preferred route; still show the best alternative. |
| `context` revenue, expenses, profit, invoices, inventory, staff | Burn, working capital, debt service capacity. |
| `nexum_agent_records(run.id, 'transactions')` | Monthly cash in/out for the last 6–12 months. |
| `nexum_agent_records(run.id, 'sales')`, `'customers'` | Traction metrics for investors (growth, retention). |
| `profile.basics` | Legal form, founding date, location (determines programme eligibility). |
| `retrieved` financial-planning / business-builder results | Reuse projections. |

Compute:
- **Monthly net burn** = cash out − cash in (average of last 3 months).
- **Runway (months)** = cash ÷ monthly net burn.
- **Capital requirement** = capex + start-up costs + working capital + losses until break-even
  + reserve (≥ 3 months fixed costs).
- **Working capital** = receivables + inventory − payables (or DSO/DIO/DPO based).
- **Debt service capacity** = (EBITDA − taxes − private withdrawal) ÷ annual principal + interest;
  banks want ≥ 1.2–1.3.
- **Annuity** = loan × i ÷ (1 − (1 + i)^−n) (monthly i, n months, after grace period).
- **Dilution** = new money ÷ post-money valuation.

## Ask first if…

1. Equity/own funds and existing debt unknown — decisive for bank loans.
2. Owner's openness to giving up shares unknown while equity looks like the best fit.
3. Collateral/guarantee situation unknown for loans > 125.000 €.

```json
[{"key":"ownFunds","label":"Own funds you can invest (€) and existing loans (€, monthly rate)?","type":"text"},
 {"key":"equityOk","label":"Would you give up company shares?","type":"select","options":["Yes","Only a minority (< 25 %)","No"]},
 {"key":"collateral","label":"Collateral available (property, guarantor, none)?","type":"text"}]
```

Otherwise assume own funds = 10 % of need, no equity, no collateral (→ Bürgschaftsbank route). Label it.

## Research

- **Germany**: KfW (ERP-Gründerkredit StartGeld, ERP-Förderkredit KMU / Gründerkredit Universell,
  Digitalisierungs-/Innovationskredit), regional Förderbanken (NRW.BANK, L-Bank, LfA, IBB,
  WIBank, NBank, SAB, ISB, IFB Hamburg, Investitionsbank SH …), Bürgschaftsbanken and
  Mikromezzaninfonds, Gründungszuschuss (Agentur für Arbeit), INVEST / EXIST status, High-Tech
  Gründerfonds and regional VC funds, business angels networks (BAND).
- **Austria**: aws (Garantien, Preseed/Seed), FFG, WKO; **Switzerland**: Bürgschaftsgenossenschaften,
  Innosuisse, cantonal promotion.
- Current interest rates/conditions (KfW Konditionenübersicht), typical bank requirements.
- Crowdfunding/crowdinvesting platforms for consumer brands (Startnext, Seedmatch, Companisto).
- Verify current status and conditions — programmes change. Link every programme. Detailed
  grant search belongs to `subsidy-research`; reference it.

## Method

1. **Need**: rebuild the capital requirement bottom-up; compare with `inputs.fundingAmount`.
2. **Timing**: monthly cash need for 12–18 months → when money must arrive (tranches).
3. **Options screen**: grants, Förderkredit via Hausbank, bank loan with Bürgschaft,
   leasing for equipment, supplier credit, equity (angels/VC), crowdfunding, revenue-based financing,
   bootstrapping levers (deposits, pre-sales, faster invoicing).
4. **Scoring**: cost of capital, speed, control kept, eligibility, effort → recommend a mix
   (typical DACH SME: 10–20 % own funds + Förderkredit + Bürgschaft + grant).
5. **Repayment / dilution check**: debt service capacity or cap-table effect.
6. **Document set**: list per route (bank: business plan, 3-year plan, liquidity plan, BWA/SuSa,
   tax returns, CV, Schufa; investors: deck, model, cap table, data room).
7. **Deck outline** for chosen audience.

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Funding & Finance Plan – <company>
<summary: real need vs. stated need, recommended mix, timing>
### Capital requirement & use of funds
| Use | € | Timing | Note |
### Cash need & runway
| Month | Cash start | In | Out | Cash end |
### Funding options
| Option | Amount € | Cost (interest / equity) | Speed | Eligibility | Effort | Link |
### Recommended financing mix
| Source | € | Share % | Conditions | Next step |
### Repayment / dilution check
### Application documents checklist
| Document | Required for | Available? | Platform source |
### Investor / bank deck outline
| # | Slide | Key message | Number |
### Sources
### Next steps
```

## Quality bar

- [ ] Need computed, not copied; difference to stated amount explained.
- [ ] Programme names, limits and rates linked and marked "as of <date>, verify with Hausbank".
- [ ] Debt service or dilution numbers shown; no recommendation that the business cannot repay.
- [ ] Use-of-funds totals equal funding mix totals.
- [ ] Consistent with earlier financial-planning results; changes stated.

## Tasks & alerts

Tasks: book Hausbank/Förderbank appointment, request Bürgschaftsbank pre-check, prepare BWA
and liquidity plan, collect investment quotes, run `subsidy-research`.

Alerts:
- `critical` — runway < 3 months.
- `warning` — debt service capacity < 1.2 or stated need < computed need by > 20 %.
- `recommendation` — cheaper funding available (e.g. Förderkredit vs. current overdraft) with € interest saving/year.
