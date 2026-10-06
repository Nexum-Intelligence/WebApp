# HR & Hiring Plan (`hr-planning`)

## Goal
Show the owner the organisation they have, the one they need for the next 12 months,
and an affordable hiring roadmap with role profiles ready to post — grounded in
workload, revenue and staff-cost data.

## Inputs to use
- `run.inputs`: `currentTeam` (required), `gaps`, `budget`.
- `nexum_records('staff')`: `name`, `role`, `department`, `employment`
  (Full-time/Part-time/Contractor/Intern), `salary` (monthly cost), `status`.
- `context.text`: revenue, profit, staff cost, revenue trend, open tasks, pipeline.
- `profile`: `team.teamSize`, `team.keyRoles`, `team.hiringNeeds`, `goals.goals12m`,
  industry, location (salary level, labour market).
- Formulas: staff-cost ratio = active staff cost / monthly revenue; revenue per FTE
  (part-time = 0.5 FTE unless known); employer cost ≈ gross salary × 1.21 (DE social
  security share, estimate; AT ≈ 1.30, CH ≈ 1.15).

## Ask first if…
Ask (only if `run.answers` is empty) when neither `staff` records nor `currentTeam`
give roles, or when growth goals are unknown: (1) planned growth / new locations or
services, (2) max monthly budget for new hires, (3) roles that must stay with the
owner, (4) preference employees vs. freelancers. Max 4.

## Research
Salary benchmarks for the role and region (Gehaltsvergleich, StepStone, Kununu, tariff
tables e.g. DEHOGA for gastro/hotel, MFA tariff for medical practices, ReFa salaries for
law firms), Minijob/Midijob limits, current Mindestlohn, typical time-to-hire and
shortage occupations (Engpassberufe), relevant subsidies (Eingliederungszuschuss, Azubi
programmes). Cite links.

## Method
1. **Org chart as-is** from `staff` (+ `currentTeam`): reporting lines, FTE, cost.
   Flag key-person risks (one person covers a critical function), owner overload.
2. **Capacity & demand**: estimate workload per function from data — covers or bookings
   per day (gastro/hotel), patients per day (practice), billable hours/mandates (law),
   projects/clients (services). Compare with capacity; gap in FTE.
3. **Affordability**: max sustainable staff cost = target staff-cost ratio × forecast
   revenue (targets: gastro 30–35 %, hotel 30–38 %, medical practice 25–35 %, law firm
   30–40 %, services/digital 40–55 %). Headroom = max − current. Respect `budget`.
4. **Hiring roadmap**: prioritise roles by impact (revenue enabled or owner hours
   freed × owner hourly value) and urgency; quarter, employment type, cost, alternative
   (freelancer, part-time, outsourcing, automation).
5. **Role profiles**: purpose, responsibilities, must-have / nice-to-have skills, KPIs
   for the first 90 days, salary band, where to post.
6. **Org chart to-be** after 12 months.

## Output skeleton
`## HR & Hiring Plan – <company>` + 2–3 sentence summary.
### Team today
| Name/Role | Department | Type | FTE | Monthly cost | Key-person risk |
### Org chart
Today and in 12 months as indented lists or a Mermaid chart.
### Capacity & affordability
| Function | Workload | Capacity | Gap (FTE) |
| KPI | Today | Target | Headroom € |
### Hiring roadmap
| Quarter | Role | Type | Monthly cost | Why now | Alternative |
### Role profiles
One block per role: Purpose · Responsibilities · Must-have · Nice-to-have · 90-day KPIs · Salary band · Channels.
### Next steps
(`lang=de`: Team heute, Organigramm, Kapazität & Finanzierbarkeit, Einstellungs-
Roadmap, Rollenprofile, Nächste Schritte.)

## Quality bar
- Costs as employer cost, monthly and yearly; benchmarks with source and region.
- Every hire justified by workload or revenue numbers, not by habit.
- Roadmap stays within budget/headroom or says explicitly what revenue is needed.
- Role profiles are usable as a job ad draft; language AGG-compliant (m/w/d).

## Tasks & alerts
- Staff-cost ratio above industry target → `warning`, link `finance`.
- Key-person risk on a revenue-critical function → `warning`, link `module:hr-planning`.
- Capacity gap ≥ 0.5 FTE with headroom available → `recommendation`, impact = revenue enabled.
- Tasks: "Post job ad for <role>" (high for Q1 role), "Define deputy for <function>"
  (medium), "Check Eingliederungszuschuss for <role>" (low).
