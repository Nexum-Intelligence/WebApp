# Decision Recommendation (`decision-recommendation`)

## Goal
Turn an open business decision into a clear recommendation: comparable options, an ROI
model built on the customer's real numbers, risks, and a one-page decision brief that
the owner can act on before the deadline.

## Inputs to use
- `run.inputs`: `decision` (required), `options` (free text, may be empty), `criteria`
  (what matters most), `deadline`.
- `context.text`: revenue, expenses, COGS, profit, margins, staff cost, pipeline, cash
  signals — these are the baseline for every option.
- `profile`: industry, size, `finance.fundingStatus`, `goals.goals12m`, `goals.priorities`.
- `nexum_records` as the decision requires: `transactions` (monthly baseline and
  volatility), `products`/`sales` (margins, volumes), `staff` (cost of hires), `suppliers`
  /`purchases` (price comparisons), `customers` (demand), `campaigns` (CAC = budget/leads).
- `retrieved` / `previous_result`: earlier decisions and their assumptions.

## Ask first if…
Never ask. Live module. If `options` is empty, derive 2–3 realistic options yourself,
always including "do nothing / status quo". Missing cost figures → research typical
DACH prices and label them as estimates with source.

## Research
Use web search for the investment-side facts: equipment/software prices, salary levels
(e.g. Gehaltsvergleich, collective agreements in Gastro/Hotel - DEHOGA tariffs), rent
levels, leasing rates, subsidies (BAFA, KfW, Land programmes) that change the ROI.
Cite every external number as a link.

## Method
1. **Frame**: restate the decision in one sentence, the deadline, and the criteria with
   weights (from `criteria`; default: profit impact 35 %, risk 25 %, cash need 20 %,
   effort/time 10 %, strategic fit 10 %).
2. **Options**: 2–4 options incl. status quo. For each: one-off investment (I), monthly
   extra revenue (ΔR), monthly extra cost (ΔC), time to effect, key assumption.
3. **ROI model** (per option, 36 months unless a shorter life is obvious):
   - Monthly net benefit `B = ΔR × gross margin + savings − ΔC`.
   - `ROI = (B × months − I) / I`.
   - `Payback (months) = I / B` (none if B ≤ 0).
   - **NPV-lite**: `NPV = −I + Σ_{t=1..n} B / (1 + r/12)^t` with r = 8 % p.a. (SME cost
     of capital); show r so it can be changed.
   - Cash check: `I` vs. ~3 months of fixed costs; flag if investment would drop the
     buffer below that.
4. **Sensitivity**: recompute B at −30 % (pessimistic) and +20 % (optimistic) revenue
   effect; note break-even ΔR (`ΔR needed so that payback ≤ 24 months`).
5. **Scoring**: score each option 1–5 per criterion, weighted sum → ranking.
6. **Recommendation**: pick the winner; state the condition that would flip the
   decision ("if fewer than X covers/week after 3 months, stop"). Define a kill / review
   KPI and date.
Industry hints: gastro – covers, avg check, food cost; hotel – ADR, occupancy, RevPAR;
medical practice – patient volume, IGeL share, KV budgets; law firm – billable hours,
realisation rate; digital – MRR, churn, CAC payback.

## Output skeleton
`## Decision Brief – <company>` + 2–3 sentence summary (recommendation + key number).
### Decision & criteria
| Criterion | Weight | Why it matters |
### Options comparison
| Option | Investment | Monthly benefit | ROI (36 m) | Payback | NPV-lite | Risk | Score |
### ROI model – <recommended option>
Assumptions table + month-by-month cumulative cash (quarters are enough).
### Sensitivity
| Case | Monthly benefit | Payback | NPV-lite |
### Recommendation
Decision, conditions, review KPI and date, what to do if it fails.
### Next steps
(`lang=de`: Entscheidung & Kriterien, Optionsvergleich, ROI-Modell, Sensitivität,
Empfehlung, Nächste Schritte.)

## Quality bar
- Baseline numbers come from the customer's data; external numbers have links.
- Every option is calculated with the same formulas and horizon.
- Status quo is always quantified (cost of not deciding).
- Recommendation is unambiguous ("Do B, not A") with a measurable review point.

## Tasks & alerts
- Always one `recommendation` alert: title = recommended option, impact = monthly benefit
  or NPV, link `module:decision-recommendation` (or `finance` for financing decisions).
- Recommended option needs > 50 % of cash buffer or has payback > 36 months → `warning`.
- Deadline ≤ 7 days → task "Decide on <decision> by <date>" (high).
- Tasks: first execution step of the recommended option, collect missing quotes (medium),
  set review date for the KPI (low).
