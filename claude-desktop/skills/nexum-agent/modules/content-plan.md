# Social & Content Plan (`content-plan`)

## Goal
A 4-week content calendar the owner can post from directly: content pillars,
channel roles, a dated calendar with ready-to-use post ideas (hook, caption
outline, visual, CTA, hashtags) and a light production workflow (batching,
templates). Realistic for 1 person with 2–5 h/week.

## Inputs to use
| Source | Use |
|---|---|
| `inputs.channels` (required) | Channels to plan (Instagram, TikTok, LinkedIn, Facebook, Google Business Profile, newsletter, blog, YouTube …). |
| `inputs.audience` | Persona for topics and tone; fall back to profile `targetCustomer`. |
| `inputs.cadence` (Weekly / 2× per week / Daily) | Posts per week per main channel (Daily = 5–7, story-heavy). |
| profile `brandValues`, `usp`, `valueProp`, `location`, `positioning` | Pillars, local hashtags, tone. |
| `retrieved` earlier `brand-marketing` / `marketing-strategy` results | Reuse pillars, tone, campaigns — do not contradict them. |
| `nexum_agent_records(run.id, 'products')` → `name, category, price, status` | Featured products/services (Active only). |
| `nexum_agent_records(run.id, 'sales')` → `productName, revenue, profit, date` | Push best-sellers and high-margin items; seasonality. |
| `nexum_agent_records(run.id, 'campaigns')` → `name, channel, status` | Align posts with active campaigns. |
| `nexum_agent_records(run.id, 'staff')` → `name, role` | Behind-the-scenes / team content (first names only, consent note). |

Metrics: engagement rate = (likes + comments + saves + shares) / reach; profile
→ website/booking click rate = link clicks / profile visits; content-sourced
leads = leads with channel = social in `campaigns`.

## Ask first if…
- No audience and no profile target customer →
  `{"key":"audience","label":"Who should your posts reach (e.g. local families, HR managers, tourists)?","type":"text"}`
- Production capacity unknown and cadence = Daily →
  `{"key":"capacity","label":"Who creates the content and how many hours/week?","type":"text"}`
- Upcoming events/offers unknown →
  `{"key":"events","label":"Any events, launches or offers in the next 4 weeks?","type":"textarea"}`
Otherwise assume 3 h/week, phone-shot photo/video, no paid boosting, and use
public holidays/season of the next 4 weeks as hooks.

## Research
- Platform best practices and formats for the chosen channels (Instagram Creators
  https://creators.instagram.com, LinkedIn https://www.linkedin.com/help/linkedin,
  TikTok Creator Academy https://www.tiktok.com/creator-academy,
  Google Business Profile posts https://support.google.com/business/answer/7342169).
- Posting time/engagement benchmarks: Sprout Social
  (https://sproutsocial.com/insights/best-times-to-post-on-social-media/), Rival IQ
  (https://www.rivaliq.com/blog/social-media-industry-benchmark-report/).
- Local hashtags/events (city, region, Stadtfest, trade fairs) for the next 4 weeks.
- Regulated industries: HWG (medical, no before/after claims), BRAO §43b (law),
  Impressum/Kennzeichnung of ads ("Anzeige/Werbung") per UWG.
- Do not research viral trends that do not fit the brand.

## Method
1. **Channel roles:** each channel gets one job (e.g. Instagram = inspiration &
   community, GBP = local search & offers, LinkedIn = expertise, newsletter =
   retention). Drop channels the capacity cannot serve.
2. **Pillars (3–4):** e.g. Expertise/How-to, Behind the scenes, Products/offers,
   Customer stories/social proof, Local/community. Mix rule ≈ 40/25/20/15, max
   20 % hard selling.
3. **Pillars × formats × channels matrix** (reel, carousel, story, post, article,
   email, GBP post).
4. **Calendar:** dated slots for 4 weeks starting next Monday, hooks tied to
   season, events and best-sellers.
5. **Post ideas:** hook (first line ≤ 10 words), caption outline, visual brief,
   CTA, 3–8 hashtags (mix local + niche).
6. **Production:** batching day, templates, repurposing (1 reel → story + GBP post
   + newsletter snippet), approval if staff appears.
7. **KPIs:** per channel 1–2 metrics with 4-week targets.

## Output skeleton
Translate headings, table headers and the post texts when `lang=de`.
```
## Content plan – <Company>
<executive summary>
### Channel plan
| Channel | Role | Audience | Cadence | Formats | KPI | Target (4 wks) |
### Content pillars
| Pillar | Goal | Share % | Example topics |
### Content calendar
| Date | Day | Channel | Pillar | Format | Topic / hook | CTA | Status |
### Post ideas (ready to use)
| # | Channel | Hook | Caption outline | Visual | CTA | Hashtags |
### Production workflow
### Next steps
```

## Quality bar
- [ ] Calendar dates are real (start next Monday after run date), cadence matches input.
- [ ] Each post idea is specific to the business (real products, place, team), not generic.
- [ ] Selling posts ≤ 20 %; at least one social-proof post per week.
- [ ] Total effort ≤ stated/assumed hours; repurposing shown.
- [ ] Legal: ad labelling, HWG/BRAO limits, photo consent of staff/guests.

## Tasks & alerts
Tasks (max 5): "Batch-produce week 1 content" (high), "Create 3 Canva templates"
(medium), "Update Google Business Profile post" (medium), "Ask 3 customers for a
testimonial" (medium), "Review post metrics after 4 weeks" (low).
Alerts:
- Channel list exceeds capacity (> 3 channels at < 3 h/week) → `info`.
- No active campaign and no leads in 30 days → `recommendation` (link content to an offer).
- Best-selling product has low margin (< 30 %) → `info` (feature higher-margin items).
