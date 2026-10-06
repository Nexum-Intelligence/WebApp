# Customer Validation (`customer-validation`)

## Goal

Tell the owner how to prove or kill their core assumption cheaply and fast: a 2–4 week
validation plan with explicit pass/fail thresholds, a non-leading interview guide, and a
findings scorecard to fill in. If evidence already exists (sales, customers, earlier
answers), score it now. Outcome: "build / adjust / stop" with the evidence behind it.

## Inputs to use

| Source | Use |
|---|---|
| `inputs.hypothesis` | Split into testable parts: problem exists, problem is urgent, customer pays X €, customer uses channel Y. |
| `inputs.targetCustomer` | Recruiting criteria for interviewees (role, company size, location, behaviour). |
| `inputs.channels` | Recruiting and test channels (own customers, LinkedIn, Instagram, local network, associations). |
| `context` customers, sales, pipeline, marketing | Existing evidence: buyers, repeat rate, conversion, open offers. |
| `nexum_records(email,'customers')` | Who to interview first (best, lapsed, lost). |
| `nexum_records(email,'sales')`, `'campaigns'` | Behavioural evidence (what people paid for, which campaign converted). |
| `profile.customers`, `profile.product` | ICP and offer. |
| `run.answers` / `previous_result` | Interview results if the owner reported them → score them. |

Compute:
- **Required sample**: 8–12 problem interviews per segment; 20–50 for a price/landing test.
- **Conversion** = sign-ups or pre-orders ÷ visitors (landing test) or offers accepted ÷ offers sent.
- **Willingness-to-pay** (Van Westendorp simplified): median "too cheap", "bargain", "expensive", "too expensive".
- **Problem score** = share of interviewees who name the problem unprompted × average pain (1–5).
- **Repeat rate** from records = repeat buyers ÷ buyers (existing businesses).

## Ask first if…

1. The hypothesis mixes several assumptions and it is unclear which matters most.
2. No reachable target customers are named and the owner has no customer base.
3. The validation budget/time is unknown and a paid test (ads, prototype) would be the best route.

```json
[{"key":"riskiest","label":"Which assumption would kill the idea if wrong?","type":"select","options":["The problem is real","They would pay my price","I can reach them affordably","They would switch from their current solution"]},
 {"key":"access","label":"Where can you reach 10+ target customers this month?","type":"textarea"},
 {"key":"budget","label":"Budget for tests (ads, prototype) in €?","type":"text"}]
```

Otherwise assume: riskiest = willingness to pay; budget ≤ 300 €; channels = own network + one paid test.

## Research

- Where the target customers gather: associations, Kammern (IHK, Ärztekammer, RAK, HWK),
  LinkedIn groups, subreddits, Facebook groups, local Stammtische, trade fairs in DACH.
- Existing alternatives and their prices (to anchor WTP questions).
- Benchmarks: typical landing-page conversion (2–5 % cold, 10–20 % warm), B2B reply rates (5–15 %).
- Do not research generic Mom-Test summaries; link only concrete communities or benchmark sources.

## Method

1. **Hypothesis tree**: break `inputs.hypothesis` into 3–5 falsifiable statements with a metric
   and a pass threshold ("≥ 6 of 10 interviewees describe the problem unprompted").
2. **Test selection** (cheapest valid test first): problem interviews → solution interviews →
   smoke test (landing page / waiting list) → pre-sale / letter of intent → paid pilot.
3. **Recruiting plan**: 15–20 contacts → expect 8–12 interviews; scripts for outreach in the
   owner's language and channel.
4. **Interview guide** (Mom-Test style): past behaviour, not opinions; no pitching before the
   problem section; 30 minutes; 10–14 questions in 4 blocks (context, problem, current
   solution & spend, WTP/commitment).
5. **Commitment ladder**: time (follow-up call) → reputation (intro) → money (deposit/pre-order).
6. **Findings scorecard** with thresholds; decision rule (≥ 3 of 4 passed → build;
   2 → adjust segment or offer; ≤ 1 → stop).
7. If interview data is present: score it, quote patterns (anonymised), decide.

## Output skeleton

Write headings in English; translate all headings, table headers and text to German when `run.lang = de`.

```
## Customer Validation – <company>
<summary: riskiest assumption, test, decision rule>
### Hypotheses to test
| # | Hypothesis | Metric | Pass threshold | Test |
### Validation plan (2–4 weeks)
| Week | Activity | Channel | Target count | Cost € | Output |
### Recruiting messages
### Interview guide
<4 blocks, numbered questions, notes on what to listen for>
### Findings scorecard
| Hypothesis | Evidence | Result (n) | Threshold | Pass/Fail |
### Decision & next test
### Next steps
```

## Quality bar

- [ ] Hypotheses are falsifiable and have numeric thresholds.
- [ ] Questions ask about past behaviour and spend; no leading or hypothetical questions.
- [ ] Recruiting uses the owner's real channels and existing customers from records.
- [ ] Test costs in € and total plan within the stated budget.
- [ ] Existing evidence (sales, repeat rate) is used before proposing new tests.
- [ ] If `previous_result` exists, update the scorecard with new findings.

## Tasks & alerts

Tasks: send 15 recruiting messages, conduct 5 interviews by date, build landing page /
waiting list, run pre-sale offer, enter results and re-run module.

Alerts:
- `warning` — existing data contradicts the hypothesis (e.g. repeat rate < 15 % for a claimed recurring need).
- `recommendation` — evidence passes ≥ 3 thresholds → start `go-to-market`.
- `info` — validation incomplete after 4 weeks (interviews < 8).
