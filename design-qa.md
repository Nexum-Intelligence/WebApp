**Source Visual Truth**

- `docs/source/reference-nexum-hero.png`
- `docs/source/reference-particle-deformation.png`
- `docs/source/reference-about-impact.png`
- `docs/source/reference-what-we-build.png`
- `docs/source/reference-how-it-works-01.png`
- `docs/source/reference-how-it-works-02.png`
- Current chat target: AI Systems section should show `Your AI Infrastructure. Managed. Scalable. Intelligent.` with a right-side moving vertical carousel of CMS/system features.
- Current chat target: Homepage should also include the `We Build Systems. Others Build Tools.` block with a left tab list and a right image/text card.
- Current chat target: The `We Build Systems. Others Build Tools.` tab block should use typography that fits the rest of the NEXUM site and automatically advance to the next tab every 4 seconds while staying clickable.
- Current chat target: The highlighted Reviews panel title should be slightly smaller, and the names below should work as tabs that update the visible testimonial and auto-advance every 5 seconds.
- Current chat target: The About page founder cards should use the supplied Melina Kühn and Luise Rimola portraits, real roles, and English profile text.
- Current chat target: The footer should show `Agent Platform` as a separate right-aligned glow button like `Contact Us`, not as a normal text link.
- Current chat target: The Potential Analysis layout should feel wider and more rectangular, with smaller titles and Google/Microsoft sign-in buttons in one row using logo icons.
- Current chat target: The About Reviews hero headline and star emblem should be slightly smaller.
- Current chat target: The Contact hero should show an `AGENT PLATFORM` button below the intro text.
- Current chat target: Melina's founder card should use the newly supplied founder portrait.
- Current chat target: Vercel deployment should keep the Hero 3D logo, pointer-reactive particle motion, and route clicks stable in production.
- State: dark NEXUM site with animated hero sphere, moving purple curtain, multi-page navigation, About/Impact section, What We Build section, and How It Works step layouts.

**Implementation Evidence**

- Local routes tested: `/`, `/about`, `/what-we-build`, `/how-it-works`, `/blog`.
- HTTP evidence: all tested routes returned `200`.
- Build evidence: `vite build` passed after the interaction, routing, image, and layout changes.
- Implementation screenshot path: blocked. Chrome and Edge headless screenshot attempts against the live local route still failed or hung in this environment.
- Current Codex browser connector: blocked by `Cannot redefine property: process` during browser runtime setup, so this update could not be visually captured from the desktop browser tool.

**Findings**

- [P2] Browser-rendered screenshot could not be captured
  Location: QA tooling, not app code.
  Evidence: routes returned `200`, but Chrome/Edge headless did not produce screenshots because of GPU/browser-process failures in this environment.
  Impact: final pixel comparison cannot be certified inside this run.
  Fix: reload the live local site in the user's Chrome window and compare visually against the saved references.

- [P3] Some remaining Framer effects are approximations
  Location: hero background and section transitions.
  Evidence: the clone now has moving CSS shader layers and Canvas particle deformation, but it does not run Framer's proprietary shader/runtime.
  Impact: motion should feel much closer, but exact shader turbulence may still differ.
  Fix: continue tuning animation timing, ribbon opacity, and section offsets from live browser observation.

**Implemented Fidelity Changes**

- Real NEXUM logo and matched Framer image assets mirrored locally.
- Hero particle sphere now uses 4,600 Canvas points and pointer repulsion, so mouse movement visibly displaces the dot field.
- Purple curtain background now animates through layered CSS gradient motion.
- Header/nav now uses real routes: `/about`, `/what-we-build`, `/how-it-works`, `/blog`, `/contact`.
- Added screenshot-oriented About/Impact section with angled marquee, dark cards, glow treatment, and icons.
- Added What We Build page/section with matched woman-in-yellow image and service rows.
- Added How It Works page/section with matched presenter and AI-window images.
- Added the target AI infrastructure section: large left headline, vertical `Ionyx CMS Gives You` copy, and animated right-side feature carousel.
- Restored the separate homepage `We Build Systems. Others Build Tools.` block as a tabbed system-vs-tools section with a right image/text detail card.
- Restored the highlighted Reviews layout with the large `Doesn't Plug AI` headline, right-side business copy, active testimonial card, and avatar selector row.
- Added the missing About intro layout with a wide AI visual and a two-card founder introduction section below it.
- Tuned the `We Build Systems. Others Build Tools.` tab typography to the expanded NEXUM display stack and added a 4-second automatic tab advance with manual hover/focus/click control preserved.
- Tuned the highlighted Reviews panel by reducing the large left title, styling the bottom names as clearer tabs, and adding a 5-second automatic testimonial advance while preserving manual hover/focus/click selection.
- Replaced generic About founder placeholders with local portrait assets for Melina Kühn and Luise Rimola plus English CEO/CMO and CEO/CTO profile copy.
- Moved `Agent Platform` out of the plain footer link list and added it as a right-aligned pill button with the same glow treatment as the header CTA.
- Tuned the Potential Analysis page by widening and flattening the main shell, reducing title sizes, and replacing text-letter provider badges with local Google and Microsoft logo SVGs in a two-column provider button row.
- Reduced the About Reviews hero headline scale and the star emblem size/transform across desktop, tablet and mobile breakpoints.
- Added a centered Contact hero action button below the intro text using the existing glow CTA styling and routing to `/agent-platform`.
- Replaced Melina's founder portrait asset with the newly supplied local JPEG while keeping Luise Rimola's founder image unchanged.
- Hardened the Vercel production path by importing the Hero mesh JSON directly into the JavaScript bundle, adding SPA rewrites/build settings in `vercel.json`, and wrapping internal navigation in a fallback-safe route handler.

**Required Fidelity Surfaces**

- Fonts and typography: Hero and section headlines use the expanded display stack and locked line breaks where needed. Residual risk: Google font loading remains network-dependent.
- Spacing and layout rhythm: Major screenshot sections now use wide dark spacing, large headings, offset image cards, and Framer-like cards. Residual risk remains until live visual comparison is possible.
- Colors and visual tokens: Framer dark, indigo, and lavender tokens are reflected in cards, glows, ribbons, and buttons.
- Image quality and asset fidelity: The key screenshot images for What We Build and How It Works are now local matched Framer assets.
- Copy and content: Main navigation labels, hero copy, section headings, services, process steps, and CTAs match the captured site intent.

**Open Questions**

- Whether remaining blog/contact/legal visuals need the same pixel-level treatment, or whether the current priority remains the animated homepage and main marketing sections.

**Implementation Checklist**

- Reload `http://127.0.0.1:5173/`.
- Move the mouse over the sphere and verify the dot-field displacement.
- Click `ABOUT US`, `WHAT WE BUILD`, `HOW IT WORKS`, `BLOG`, and `CONTACT US` in the nav and verify separate routes.
- Visually compare `/about`, `/what-we-build`, and `/how-it-works` against the saved reference screenshots.

**Comparison History**

- Iteration 1: Previous local clone lacked the moving 3D sphere, real NEXUM logo, purple curtain background, and Framer-like glow effects.
- Fixes made: Added local NEXUM assets, CSS shader background, animated Canvas particle sphere, exact H1 wrapping, and glowing CTA/header buttons.
- Iteration 2: User reported missing mouse deformation, static curtain, non-multipage navigation, and mismatched lower sections.
- Fixes made: Added pointer repulsion, animated curtain layers, real multi-page routes, matched Framer image assets, and new About/What-We-Build/How-It-Works layouts.
- Post-fix evidence: Production build passed and all main routes returned HTTP 200; browser-rendered screenshot capture remains blocked by local Chrome/Edge headless failures.
- Iteration 3: User provided an Ist/Soll comparison for the AI Systems area where the implementation still showed five static cards.
- Fixes made: Removed the active duplicate infrastructure/static-card sequence and implemented a single target-style carousel section with matching copy and continuous vertical movement.
- Post-fix evidence: Production build passed; the old static five-card wall was removed. The `We Build Systems. Others Build Tools.` copy was later reintroduced as a separate target-style tab section in Iteration 10.
- Iteration 4: User provided an Ist/Soll comparison for the Testimonials area where the implementation still used a highlighted quote card with avatar selector row.
- Fixes made: Rebuilt the active Testimonials component as a centered target-style section with blue `TESTIMONIALS` label, large centered headline, and four rounded quote cards in a 2x2 grid.
- Post-fix evidence: Production build passed; static bundle search confirms the old `Head Of Growth` testimonial variant is not present in the generated build.
- Iteration 5: User requested the What-We-Build title to be smaller and constrained to three lines.
- Fixes made: Split the heading into three locked desktop lines and reduced the section-specific headline size while allowing mobile wrapping.
- Post-fix evidence: Production build passed.
- Iteration 6: User requested `WHAT WE BUILD` in the navbar to open the Agent Platform page and the homepage Explore Platform button to open a login/potential-analysis flow.
- Fixes made: Routed navbar `What We Build` to `/agent-platform`, added `/potential-analysis` with left sign-in panel, right scoring panel, dropdown scoring fields, progress bar and sign-in modal with Google/Microsoft options.
- Post-fix evidence: Production build passed; local HTTP checks returned `200` for `/`, `/agent-platform` and `/potential-analysis`.
- Iteration 7: User supplied a ZIP containing `modelToUsed.stl` and requested the 3D model inside the particle sphere rotating with the sphere.
- Fixes made: Sampled the 1,000,000-triangle STL into a 4,200-triangle browser mesh asset, loaded it separately, replaced the flat center logo render with a luminous Canvas mesh and applied the same X/Y rotation values as the sphere points.
- Post-fix evidence: Production build passed; generated asset `nexum-model-mesh-*.json` is emitted separately from the JS bundle.
- Iteration 8: User pointed out that the Testimonials area still did not feel visually adjusted.
- Fixes made: Reworked the active Testimonials section styling with layered glow background, subtler outer panel, expanded display heading, stronger card depth, inner light edges, and decorative quote treatment.
- Post-fix evidence: Production build passed; local HTTP checks returned `200` for `/` and `/about`.
- Iteration 9: User requested the What-We-Build card image be replaced with the supplied blue AI operations dashboard image.
- Fixes made: Added the supplied PNG as `src/assets/framer-images/what-we-build-dashboard-platform.png` and updated the active What-We-Build visual card import/reference.
- Post-fix evidence: Production build passed; local HTTP checks returned `200` for `/` and `/agent-platform`.
- Iteration 10: User asked where the `We Build Systems. Others Build Tools.` homepage block from the screenshot is.
- Fixes made: Added `SystemsToolsSection` directly after `WhatWeBuildSection` on `/`, with interactive left tabs, matching top copy, a dark rounded panel, and a right image/text card that updates on hover/focus/click.
- Post-fix evidence: Production build passed; local HTTP checks returned `200` for `/` and `/agent-platform`.
- Iteration 11: User asked where the highlighted Reviews layout from the screenshot is.
- Fixes made: Rebuilt `TestimonialsSection` as the screenshot-style review section with top headline/copy, large bordered review panel, active quote card, and interactive avatar selector. Existing local visual assets are used as rounded avatar crops.
- Post-fix evidence: Production build passed; local HTTP checks returned `200` for `/` and `/about`.
- Iteration 12: User asked to add the missing About page intro block and two founder containers below it.
- Fixes made: Replaced the generic About subhero with `AboutIntroSection`, added a wide local AI visual, and inserted `FoundersSection` with two image-led founder cards containing title, subtitle and description.
- Post-fix evidence: Production build passed; local HTTP checks returned `200` for `/` and `/`.
- Iteration 13: User asked for the `We Build Systems. Others Build Tools.` tab/card typography to better match the rest of the site and for the active tab to auto-switch every 4 seconds while remaining clickable.
- Fixes made: Updated the left tab and right card typography to the NEXUM expanded display stack, reduced the overly heavy feel, and added a 4000 ms interval that advances through the tab data while preserving hover/focus/click selection.
- Post-fix evidence: Production build passed; local HTTP check returned `200` for `/`. Browser screenshot capture remains blocked in this environment.
- Iteration 14: User asked for the Reviews title to be slightly smaller and for the bottom names to behave as tabs that show each corresponding testimonial and auto-switch every 5 seconds.
- Fixes made: Reduced the Reviews panel title size, strengthened active/hover tab styling on the person selector, added tab/tabpanel ARIA wiring, and added a reduced-motion-aware 5000 ms auto-advance that resets after manual selection.
- Post-fix evidence: Production build passed; local HTTP check returned `200` for `/`. Browser screenshot capture remains blocked in this environment.
- Iteration 15: User supplied two founder portraits and German profile text for Melina Kühn and Luise Rimola and asked for the About founder section to use those images and English copy.
- Fixes made: Copied both portraits into `src/assets/founders/`, imported them into the app, replaced the generic founder data with Melina Kühn (`CEO & CMO`) and Luise Rimola (`CEO & CTO`), translated the provided responsibilities into English, and tuned per-image object positioning in the existing founder-card layout.
- Post-fix evidence: Production build passed; local HTTP check returned `200` for `/about`. Browser screenshot capture remains blocked in this environment.
- Iteration 16: User asked for `Agent Platform` in the footer to be a button on the right, visually matching the `Contact Us` button.
- Fixes made: Removed `Agent Platform` from `footerLinks`, wrapped footer navigation in a new layout, and added a separate `/agent-platform` glow CTA aligned to the right with responsive stacking.
- Post-fix evidence: Production build passed; local HTTP checks returned `200` for `/contact` and `/agent-platform`. Browser screenshot capture remains blocked in this environment.
- Iteration 17: User asked for the Potential Analysis screen titles to be smaller, the overall layout to be more rectangular than square, and Google/Microsoft sign-in buttons to use logos and sit in one row.
- Fixes made: Added local `google-g.svg` and `microsoft.svg` assets, replaced provider initials with logo images on the page and modal, made provider buttons two-column on desktop, widened the Potential Analysis shell, reduced vertical padding/min-height, and lowered the left and right headline scale.
- Post-fix evidence: Production build passed; local HTTP check returned `200` for `/potential-analysis`. Browser screenshot capture remains blocked in this environment.
- Iteration 18: User asked for the star and title in the About Reviews hero to be a little smaller.
- Fixes made: Lowered `.reviews-hero-row h2` from `clamp(42px, 4.6vw, 62px)` to `clamp(36px, 3.9vw, 52px)`, reduced the star asset width and scale, and adjusted tablet/mobile overrides accordingly.
- Post-fix evidence: Production build passed; local HTTP check returned `200` for `/about`. Browser screenshot capture remains blocked in this environment.
- Iteration 19: User asked to add the `Agent Platform` button below the Contact hero intro text.
- Fixes made: Inserted a centered `AGENT PLATFORM` glow CTA between the Contact hero and form section, linked it to `/agent-platform`, and added desktop/mobile spacing rules.
- Post-fix evidence: Production build passed; local HTTP checks returned `200` for `/contact` and `/agent-platform`. Browser screenshot capture remains blocked in this environment.
- Iteration 20: User asked to replace Melina's founder image with the newly supplied portrait.
- Fixes made: Replaced `src/assets/founders/melina-kuehn.jpeg` with the supplied `D3191D1E-52DB-4AC9-B885-2D6CFAE57860.jpeg` image, leaving the existing founder layout and Luise asset untouched.
- Post-fix evidence: Production build passed; local HTTP check returned `200` for `/about`. Browser screenshot capture remains blocked in this environment.
- Iteration 21: User reported Vercel deployment missing the 3D logo, not reacting to hover, and crashing after clicks.
- Fixes made: Removed the separate runtime fetch for `nexum-model-mesh.json` by importing the mesh into the bundle, added `vercel.json` with `npm run build`, `dist` output and catch-all SPA rewrite, and made `navigateTo` fallback to normal browser navigation if URL handling fails.
- Post-fix evidence: Production build passed; local dev HTTP checks returned `200` for `/`, `/about`, `/how-it-works`, and `/agent-platform`. Vite preview starts interactively but could not be kept alive by this shell runner for repeated HTTP checks.

final result: blocked
