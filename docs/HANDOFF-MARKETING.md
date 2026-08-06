# HANDOFF: THE MARKETING SITE
## Reddenda Broker · brokers, General Agents, self-funded employers

**To:** @BROKER-MARKETING (terminal Brober4444)
**From:** @BROKER-TOOLS (Opus 5)
**Date:** 2026-08-06
**Status:** you own every marketing surface. I own the tools, the data layer and the APIs. @DATA-BROKER (262626) owns the corpus.

Read this whole document before your first write. Everything in it was measured, not assumed. Where a number appears, it came out of the live corpus today and you can put it on a page.

---

# 1. THE MISSION IN ONE PARAGRAPH

Federal law made healthcare prices public. Almost nobody can read them. We can. This site sells that capability to the people who buy and broker health plans, and it has to feel like infrastructure a serious institution runs on, not a SaaS landing page. The visitor is a licensed professional with sixty seconds and a deep allergy to being marketed to. **The entire page exists to get one real number in front of them before they decide whether we are worth trusting.**

**The single conversion event: a visitor reaches a real, sourced, market-specific price on screen in under 15 seconds without an account.** Everything else on the page is support for that moment or follow-through from it.

---

# 2. WHO YOU ARE WRITING FOR

Three audiences, one site. Do not build three sites.

### 2.1 The broker
Sells group health to employers. Small group writes 2 to 50 lives, mid-market 50 to 500, consultants 500 plus. Their year is a renewal calendar with a brutal Q4. They win and lose on relationships and on looking like the smartest person in the room. They have no analyst. They have been sold three benefits data platforms already and two of them were abandoned within a quarter.

**What they fear:** losing the account to a national house with a bigger analytics team. Being asked "how do you know this is a good deal" and having only the carrier's own report to point at.
**What they want:** one page they can put in front of a client that no other broker has.
**What makes them close the tab:** a demo request wall, a dashboard with nothing in it, anything that reads as consumer health tech, and any claim of savings we cannot document.

### 2.2 The General Agent
Distributes carrier products to hundreds of downstream brokers. Lives on override commissions and broker loyalty. Their product is a reason for a broker to quote through them rather than someone else.

**What they want:** something to arm their brokers with. Their conversion metric is not their own usage, it is downstream broker adoption.
**Design consequence:** the site needs a clear "for General Agencies" path that speaks about equipping a downstream network, not about looking up a price.

### 2.3 The self-funded or level-funded employer
Benefits manager, HR director of one, or a CFO. Usually 100 to 1,000 lives. Not a healthcare expert. Personally accountable for a number to someone senior. Since the CAA and the recent ERISA fiduciary litigation they are exposed in a way they were not five years ago and they know it.

**What they want:** to not be the person who got it wrong, and to have a defensible file.
**Language note:** they do not know what a CPT code is. They know "an MRI". The site must work entirely in plain English with the code as secondary detail.

---

# 3. THE PRODUCT TRUTH

Do not describe capability we do not have. Everything below is verified against the live corpus as of 2026-08-06.

### 3.1 What is real today

**Metro-level price distributions across 917 metros.** Not state averages. Actual metro markets. CPT 70553, MRI brain with and without contrast:

| Metro | 25th pct | Median | 75th pct | 90th pct | Filings |
|---|---|---|---|---|---|
| Los Angeles | $187 | $498 | $1,095 | $1,605 | 100,870 |
| New York | $278 | $424 | $636 | $1,301 | 646,255 |
| Chicago | $260 | $566 | $879 | $1,126 | 36,083 |
| Houston | $138 | $277 | $525 | $920 | 23,512 |

**These four rows are your hero.** Same scan, four American cities, and the median in Chicago is double Houston's. Use them.

**A Medicare anchor with a real site-of-service split.** `nonfac_rate` versus `fac_rate`:
- Colonoscopy: **office $423, facility $170**
- Office visit, established, 30 to 39 min: **office $148, facility $88**

That is the steering argument with a federal number behind it, available now.

**A per-payer view, honestly attributed.** Texas, knee MRI: UnitedHealthcare $143, BCBS Texas $254, Centene $220.

**39 services in the broker basket**, each carrying the plain phrase a broker would actually say. Imaging, surgery, lab, office visits, ER, therapy, maternity, behavioral, cardiac, pain management.

### 3.2 What is NOT real, and must never be implied

- **We do not have claims or utilization data.** We know what a service costs, not how often anyone uses it. Say this on the page, early and plainly. It is a credibility asset, not a weakness, with an audience that will assume otherwise and then catch us.
- **No PHI. None. Ever.**
- **We cannot separate hospital outpatient from freestanding on the commercial side yet.** Medicare's split is real and usable. The commercial site-of-service tool is pending a data answer from @DATA-BROKER. **Do not put a commercial site-of-service claim on the site until I tell you it exists.**
- **The payer view is legitimately empty in some markets.** California brain MRI returns nothing, because every payer filing in that cell was an out-of-state BlueCard filing. That empty state is correct behavior. Never build a page that implies the payer breakdown is always populated.
- **No savings guarantee, in any wording.**

### 3.3 The two landmines
Never demo `99214` in New York. Its p25 is $0.97 because of a known upstream contamination and our filter correctly refuses to render it. Never rely on `27447`'s upstream description; it is null.

---

# 4. THE FUNNEL

Built for acquisition velocity. Every stage has one job and one measurable exit.

```
   COLD ARRIVAL
        │   organic search on a price question, LinkedIn, a forwarded artifact, a podcast mention
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. THE 15-SECOND NUMBER          no account, no email, no wall  │
│    Hero carries a WORKING lookup. Metro + service. Real result. │
│    EXIT: a real distribution is on their screen.                │
└─────────────────────────────────────────────────────────────────┘
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. THE FLINCH                                                   │
│    They see their own market and the spread is worse than they  │
│    believed. Second lookup within 30 seconds is the signal.     │
│    EXIT: 2+ lookups, or a scroll past the hero.                 │
└─────────────────────────────────────────────────────────────────┘
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. THE ROLE FORK                                                │
│    Three doors: I place groups (broker) · I run an agency (GA)  │
│    · I run our plan (employer). Different proof, same product.  │
│    EXIT: a role path is entered.                                │
└─────────────────────────────────────────────────────────────────┘
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. THE ARTIFACT                                                 │
│    The thing they hand a client. Branded, sourced, dated. This  │
│    is the product, not a feature of it. Export triggers the     │
│    account. This is where email is EARNED, not demanded.        │
│    EXIT: account created.                                       │
└─────────────────────────────────────────────────────────────────┘
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. THE LOOP                                                     │
│    Every exported artifact carries a permalink back to a live   │
│    version. A broker's client forwards it. That recipient is a  │
│    cold arrival at stage 1 with a warm referral attached.       │
│    EXIT: a new session from an artifact link.                   │
└─────────────────────────────────────────────────────────────────┘
        ▼
   DISCOVERY CALL  ·  present on every surface, never the only path
```

**Funnel rules that are not negotiable:**
- **No email wall before value.** The lookup works cold. An audience of licensed professionals treats a gate before proof as evidence there is nothing behind it.
- **The artifact is the growth engine.** Design it to be forwarded. It will be the most-seen surface we own.
- **Seasonality is real.** Q4 is renewal season and traffic will be 3 to 5x. The site must have a renewal-season mode.
- **A discovery call CTA is present on every surface.** It is never the only path forward.

---

# 5. THE PAGES YOU OWN

**Home.** One full scroll. Hero with a working lookup and the signature cinematic. The problem in one devastating visual. Proof with the four-metro table. The role fork. How the data works and where it comes from. The artifact. The honest limits, stated plainly. The close.

**Three role pages.** `/brokers`, `/general-agencies`, `/employers`. Same product, different proof and different vocabulary. The GA page is about equipping a downstream network and is the one most likely to be written wrong; it is not a smaller broker page.

**The methodology page.** Where the data comes from, what Transparency in Coverage is, what we filter and why, what we do not have. With this audience a rigorous methodology page converts better than a features page. Do not bury it.

**Market and service landing pages.** The SEO engine. "MRI cost in Chicago", "colonoscopy price Dallas". Programmatic across the metro list and the service basket, each carrying a real distribution. This is the single largest organic acquisition lever we have and it is entirely gated on real data, so build it against my API and never against a placeholder.

**Trust and legal.** Sources, methodology, what we are not, privacy, no PHI.

---

# 6. THE WORLD-CLASS SKILL SETS THIS BUILD REQUIRES

Bring every one of these to the work. Where you do not have the depth, research to the level of an expert before you decide, do not approximate.

### 6.1 Strategy and positioning
1. **B2B product marketing for financial-grade data products.** Selling belief in a number.
2. **Category design.** We are not "a benefits tool". Name the category so we are the default in it.
3. **Two-audience-plus-one positioning.** Broker, GA and employer on one site without diluting any of them.
4. **Competitive positioning without naming competitors.** Category and shape, never a company.
5. **Pricing and packaging psychology.** Shape only, no prices stated anywhere.
6. **Seasonal go-to-market.** Renewal-cycle timing as a structural feature of the site.

### 6.2 Domain intelligence
7. **Group health insurance distribution.** Broker, GA, carrier, TPA, PEO, captive. Who pays whom.
8. **The fully-insured to level-funded to self-funded ladder** and where margin hides at each rung.
9. **Broker and GA compensation.** Commission, override, PEPM, contingent, and what CAA Section 202 disclosure changed.
10. **Transparency in Coverage mechanics.** 45 CFR 147.212, the file schema, negotiated types, billing class, why a naive percentile lies.
11. **Hospital price transparency**, 45 CFR 180, and the shoppable services concept.
12. **CAA 2021 compliance.** Gag clause attestation, compensation disclosure, RxDC.
13. **ERISA fiduciary duty over plan cost** and what the recent litigation actually held versus what vendors claim it held.
14. **Health plan actuarial literacy.** Trend, allowed versus billed versus paid, credibility at small group size, and the honest limits of a price-only dataset.
15. **Network contracting.** Medicare multiples, rental and wrap networks, BlueCard host and control plan mechanics, and why one brand contains many contracting entities.
16. **Plan design and steering.** Tiered networks, site of service differentials, centers of excellence, reference pricing.
17. **State insurance regulation** touching analytics sold to licensed producers.
18. **Health economics of price dispersion.** The real literature, honestly represented, including where the evidence is weak.

### 6.3 Design and craft
19. **Art direction for institutional data products.** Bloomberg-grade seriousness, not startup gloss.
20. **Brand identity systems** with a swappable wordmark, since the name is not final.
21. **Logo and mark design.** Restrained. No crosses, no heartbeats, no stethoscopes, no swooshes.
22. **Typography and editorial layout.** Real type scale in px with weights, line heights and tracking. Tabular numerals on every financial figure, non-negotiable.
23. **Color systems.** Full token ramp, semantic colors, a colorblind-safe data palette, WCAG AA contrast documented per pair.
24. **Information architecture** for a multi-tool suite where nobody is ever lost.
25. **Interaction design** for search and comparison under time pressure.
26. **Data visualization for non-analysts.** Showing a p25/p50/p75/p90 distribution so a non-analyst feels the spread instantly, without implying precision the data lacks.
27. **Motion design and web cinematics.** Scroll-driven animation, staged reveals, entrance choreography, with real cubic-bezier values and durations.
28. **WebGL, canvas and generative technique** for a hero that visualizes real dispersion as living geometry, with a static fallback and a performance budget.
29. **Micro-interaction craft.** The details that read as expensive: focus states, easing, hover choreography, loading skeletons.
30. **Responsive and mobile design** 320px to 1440px+ for dense comparison content. A broker on a phone in a parking lot before a renewal meeting is a real user.
31. **Accessibility engineering.** WCAG AA, keyboard operability, screen reader treatment of tabular and chart data, prefers-reduced-motion.
32. **Document and artifact design.** The exported PDF is the most-forwarded surface we own. It must feel authoritative and legally careful.
33. **UX writing.** Labels over sentences. Every word load-bearing. No em dashes.

### 6.4 Engineering
34. **Next.js App Router architecture.** Server versus client components on data-heavy pages, streaming, caching and revalidation.
35. **Performance engineering.** LCP, CLS and INP budgets on a page carrying a live query and a cinematic.
36. **Programmatic SEO at scale** across metros and services, with structured data, without thin-content penalties.
37. **Technical SEO and Core Web Vitals.**
38. **Analytics and funnel instrumentation.** Every stage in section 4 measurable.
39. **Security and value gating.** Server-side enforcement only. This estate has shipped client-side padlocks over fully-served payloads.
40. **Email and lifecycle infrastructure**, HubSpot logging in the send loop.

### 6.5 Judgment
41. **Editorial and factual rigor.** Every number traceable to a source.
42. **Regulatory and claims review.** Read every sentence as a plaintiff's lawyer would.
43. **Conversion rate optimization** for a low-volume, high-value professional audience.
44. **Verification discipline.** A 200 and a green deploy are not evidence. Real browser, real clicks, real screenshots, at every breakpoint.

---

# 7. THE BRAIN MAPPINGS

These are the knowledge structures to load before making decisions, not a reading list to skim.

**The estate's own accumulated intelligence, and it is one command away.** 18,316 archived sessions, 1,017,637 messages. Use `rdx s <query>`, `rdx ss <query>`, `rdx w <query>` for war-room verdicts, `rdx t <query>` for a topic timeline. Before you solve anything, check whether this estate already solved it. A lane once spent hours re-fixing a defect another lane had already zeroed.

**`knowledge/19-communication-brain/`** is binding for every prospect-facing word. Open its `00-INDEX.md` first. It routes roughly 80 situations and it is the saved-forever playbook for every touch on every channel. Do not write outreach, a reply, a landing headline or a lifecycle email without it.

**`knowledge/BRAIN-MAPPINGS-MASTER.md`** for expert heuristics. **`knowledge/00-START-HERE.md`** as the cover page.

**Memory at `~/.claude/projects/-Users-user/memory/`.** `MEMORY.md` is the load-first index. Three entries bear directly on your work:
- *An MRF rate belongs to the contracting entity, not the NPI.*
- *Two payer files under one brand are not one relationship.*
- *A citation on a wrong number is worse than no number.*

**The failure library.** This estate has documented, in painful detail, how surfaces break. Read at minimum: a CSS-only gate that gated nothing while serving 303KB to anonymous curl; `scrollWidth` lying on `overflow:visible` while a page scrolled 1,931px sideways; a media element rendering a control that could not play; a media query losing on cascade order and being invisible to every check except reading the computed value. **Your verification must measure the computed result, never the source.**

**The domain corpus to build fresh**, because it is not in the estate yet: the group benefits distribution model, the CAA and ERISA fiduciary landscape, the TiC file specification, and the price dispersion literature. Research these to expert depth. They are the substance behind every sentence on the site.

**The design corpus**, currently being built by a 20-agent war room: award-winning MedTech and health sites, AI and data platform sites, institutional financial interfaces, scroll cinematics, WebGL and generative heroes, cinematic data visualization, editorial typography, micro-interaction craft, navigation systems, and the craft of premium light versus premium dark. **Its output lands as an addendum to this document. Do not duplicate that research.**

---

# 8. VISUAL DIRECTION

The full brand system, motion system, logo with real SVG, marketing page spec and a paste-ready implementation kit are being produced by the design war room and land as **ADDENDUM A** to this document.

Until then, what is already settled:

- **Sibling of Reddenda, not a clone.** Parent is light, white, deep teal accent, restrained grid.
- **Bloomberg-grade, not startup-grade.** This audience judges seriousness in the first second.
- **Tabular numerals on every financial figure.** Non-negotiable.
- **Motion is transform and opacity only.** Honor prefers-reduced-motion. Cinematics belong on the marketing page. Inside a tool, when a broker is reading a number, motion is a defect.
- **The hero cinematic should visualize real dispersion.** Hundreds of actual rate points settling into a distribution, the spread becoming visible. Real data driving it, static fallback, budgeted.

---

# 9. BINDING CONSTRAINTS

1. **Zero fake data.** Real data or an honest empty state. No placeholder number ever renders, not even in a mockup that could ship.
2. **Local market, never national.** Metro first, state fallback, always labelled.
3. **Honest language.** "Documented", "modeled, not guaranteed". Never "guaranteed savings", "recover", "we find you money". Price data, not claims. No PHI.
4. **No em dashes in net-new copy.** Not wordy.
5. **320px to 1440px+**, no horizontal scroll, WCAG AA, never color alone.
6. **No pricing anywhere.** Not final.
7. **Never name a competitor.**
8. **Gate server-side or not at all.**
9. **Scope numbers are the universe indexed toward**, never "live-queryable".

---

# 10. THE CONTRACT BETWEEN US

**I own:** `src/lib/**`, `src/app/api/**`, the tools, the data layer, the honesty filter, gating.
**You own:** every marketing page, the brand system, motion, logo, the funnel, SEO.
**Neither of us edits the other's paths.** Claim in `.terminal-claims.md` before your first write.

**The API contract.** I will publish typed endpoints and post the contract in the claims file the moment they are stable. Your pages consume them. **Never query the rate tables directly from a marketing page and never from a client component.** The peer tables are correctly gated server-side, anon gets 401, and that gate is a real moat. Do not weaken it.

**Shared design tokens.** Whichever of us lands the token layer first publishes it in the claims file and the other consumes rather than forks. My tools must inherit your brand so the suite reads as one product.

**Post findings the moment they are verified, not when your task ends.**

---

# 11. THE BAR

Nothing is done until a real browser has used it.

- Click every control. Not "the element exists". Press it and verify what happened.
- Test negative paths: empty result, no data for this market, slow response, bad input.
- **Measure the computed result, never the source.** A rule can ship in the file, grep as present, and change nothing.
- Look at it. A screenshot catches what assertions cannot.
- Verify at 320, 390, 768, 1440 and 1920.
- A 200, a green deploy and a passing unit test are not evidence.

**And the standard above all of it:** if a broker reads a number on this site, says it out loud in a renewal meeting, and it is wrong, we are finished with that person and everyone they tell. Every design decision serves that sentence.

— @BROKER-TOOLS (Opus 5), 2026-08-06
