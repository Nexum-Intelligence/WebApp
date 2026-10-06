# Subsidy & Grant Research (`subsidy-research`)

## Goal

Find the public funding the company can realistically get for the stated project —
grants (Zuschüsse), subsidised loans (Förderkredite), guarantees (Bürgschaften), tax
incentives and advisory subsidies — with a clear eligibility verdict, € benefit, deadline
and next step per programme. Outcome: a ranked shortlist (max 8) and an application
checklist the owner can start this week.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.projectType` | What is funded: founding, investment/equipment, digitalisation, R&D/innovation, energy efficiency, hiring/training, consulting, export, culture/art. Determines programme families. |
| `inputs.location` | Federal state / Land / canton and municipality → regional Förderbank and GRW areas. |
| `inputs.fundingNeed` | Amount → programme size fit (micro < 25 k€, 25–125 k€, > 125 k€). |
| `profile.basics` | Legal form, founding date (start-up < 3/5 years), employee count, revenue → KMU definition (EU: < 250 staff, ≤ 50 M€ revenue or ≤ 43 M€ balance sheet). |
| `context` revenue, staff, profit | Size class, co-financing capacity (own share 10–50 %). |
| `nexum_records(email,'staff')` | Headcount for eligibility and hiring programmes. |
| `retrieved` business-builder / funding-finance results | Capital requirement and use of funds. |
| `previous_result` | Update deadlines, mark expired programmes. |

Compute:
- **KMU check** (EU recommendation 2003/361): staff, revenue, balance sheet; micro/small/medium.
- **Net benefit** per programme: grant € = eligible costs × funding rate; loan benefit ≈
  (market rate − programme rate) × amount × years; guarantee = access, not cash.
- **Own contribution** = eligible costs − grant; check against cash.
- **De-minimis headroom**: 300.000 € per undertaking in 3 years (EU 2023/2831) minus grants already received.
- **Priority score** = € benefit × eligibility probability ÷ application effort (days).

## Ask first if…

1. Project not started? Most grants forbid starting (signing contracts/orders) before
   approval ("vorzeitiger Maßnahmenbeginn") — ask if contracts are already signed.
2. Founder status relevant (unemployment benefit ALG I for Gründungszuschuss, university
   affiliation for EXIST) and unknown.
3. Previous de-minimis aid unknown when de-minimis programmes are the main fit.

```json
[{"key":"started","label":"Have you already signed contracts or placed orders for this project?","type":"select","options":["No","Yes, partly","Yes, completed"]},
 {"key":"founder","label":"Founder status","type":"select","options":["Receiving unemployment benefit (ALG I)","Employed","University / research background","Already self-employed"]},
 {"key":"deminimis","label":"Public grants received in the last 3 years (€, programme)?","type":"text"}]
```

Otherwise assume: project not started, no prior de-minimis aid, founder already self-employed. Label.

## Research

Always search the web; verify that each programme is open (status, call deadline, budget)
as of today and cite the official page.
- **Databases first**: Förderdatenbank des Bundes (foerderdatenbank.de), aws/FFG fördermanager (AT),
  KMU-Portal / Innosuisse / cantonal economic promotion (CH), EU Funding & Tenders Portal.
- **Germany – federal**: KfW (ERP-Gründerkredit StartGeld, ERP-Förderkredit KMU, energy-efficiency
  loans), Gründungszuschuss (Agentur für Arbeit, ALG I), EXIST (university spin-offs), ZIM (R&D
  projects, SMEs), Forschungszulage (tax credit on R&D staff costs), BAFA programmes (consulting,
  energy, export), INVEST (check status), Bürgschaftsbanken, Mikromezzaninfonds.
- **Germany – regional**: the Land's Förderbank (NRW.BANK, L-Bank, LfA Bayern, IBB Berlin,
  WIBank, NBank, SAB, ISB, IFB Hamburg, Investitionsbank SH/ILB/LFI/TAB/BAB …), GRW investment
  grants (structurally weak regions, incl. tourism/hotel investments), Land digitalisation vouchers,
  Meistergründungsprämie (crafts), city start-up grants.
- **Sector-specific**: practices — KV Strukturfonds / Niederlassungsförderung in underserved areas,
  Landarzt programmes; gastro/hotel — GRW, tourism programmes of the Land; artists — Kulturstiftung des
  Bundes, Fonds Darstellende Künste, Stiftung Kunstfonds, Land culture funding, Initiative Musik,
  Creative Europe; digital — ZIM, EU EIC Accelerator, Digital Europe.
- **EU**: Horizon Europe / EIC, Eurostars, LIFE (environment), InvestEU guarantees via banks, ESF Plus via Länder.
- Not to research: expired corona programmes, programmes for large enterprises only, private
  competitions without real money (mention max. 1 if highly relevant).

## Method

1. **Profile**: KMU class, age, location, sector, project type, need, project start status.
2. **Longlist** 10–15 programmes from databases + Land Förderbank + sector sources.
3. **Eligibility check** per programme: legal form, size, location, sector exclusions,
   project start rule, de-minimis, co-financing, Hausbank requirement → verdict ✅ / ⚠️ / ❌.
4. **Benefit & effort**: € benefit, funding rate, max amount, effort (days), decision time.
5. **Rank** by priority score; check combinability (stacking limits, same costs not twice).
6. **Application roadmap**: order of steps (e.g. advice → Hausbank → apply → approval → start).
7. **Checklist** of documents per top programme.

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Funding Opportunities – <company>
<summary: best 2–3 programmes, total € potential, most urgent deadline>
### Company funding profile
| Criterion | Value | Relevance |
### Funding opportunities (ranked)
| # | Programme | Provider | Type (grant/loan/guarantee/tax) | Benefit € / rate | Max amount | Deadline / status | Link |
### Eligibility check
| Programme | Size | Location | Sector | Project not started | De-minimis | Own share | Verdict |
### Combination & sequence
### Application checklist
| Programme | Document / step | Where to get it | Done |
### Important rules (project start, de-minimis, Hausbank)
### Sources
### Next steps
```

## Quality bar

- [ ] Every programme linked to an official source and checked "open as of <date>".
- [ ] Eligibility verdict per programme with reason; no programme listed that is clearly ineligible.
- [ ] Region-specific (correct Land/canton), sector-specific options included.
- [ ] € benefit computed from `fundingNeed` / eligible costs; labelled estimate.
- [ ] Project-start and de-minimis rules explicitly addressed.
- [ ] Update runs: expired programmes removed, new calls added.

## Tasks & alerts

Tasks: contact Hausbank/Förderbank for top loan, book funded advisory session (e.g. regional
Gründungsberatung), prepare documents for programme #1, check de-minimis declarations,
calendar reminder for deadline.

Alerts:
- `critical` — owner indicates project already started where grant requires no prior start.
- `warning` — deadline of a top programme within 30 days.
- `recommendation` — eligible programme with benefit ≥ 5.000 € (`impact` = € benefit, link `module:subsidy-research`).
