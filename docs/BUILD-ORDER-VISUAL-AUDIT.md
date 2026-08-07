# CENSENDA — PRIORITISED BUILD ORDER

Everything below was seen with my own eyes on the live PIN-gated site (`reddenda-broker.netlify.app`), Chrome/Playwright, screenshots read as images. Route + viewport cited on every line.

---

## ★ THE SINGLE HIGHEST-LEVERAGE CHANGE ON THE WHOLE SITE

**Put a live number in the right half of every hero. One change, six defects, five routes.**

What I measured at 1440x900: on `/` the hero text caps at 760px and the cards at 880px inside a 1092px content grid — four different right edges (801 / 934 / 1054 / 1266) on one screen, and ~386px of pure white to the right of the cards for the hero's full 1147px height. On `/brokers`, `/general-agencies`, `/employers` and `/tools/site-of-service` it is worse: the entire right ~47% of the first screen is **empty white with no number, no chart, no visual of any kind**. I looked at all four — a buyer's first 3 seconds on the page built for them contains a headline, four lines of grey text, two buttons, and half a blank screen.

Why it beats the Calendly fix, the header fix and the tools fix: those are damage a prospect encounters *after* you have their attention. This is the moment attention is won or lost, it is broken on **five of the eleven routes including all three persona landing pages**, and fixing it simultaneously (a) kills the four-right-edge grid break, (b) lifts the result card out of the 900px fold guillotine, (c) makes the three persona pages stop being one template with swapped copy, (d) removes ~45% dead pixels from the highest-value screen on the site, and (e) puts `$498 / $1,605 / 138%` above the fold where the pitch actually is. It is the only change on this list that raises AMBITION rather than repairing craft.

**What world-class looks like:** left column 560–620px (eyebrow → 62px display headline → 2-line lede → CTA pair). Right column 480–520px, top-aligned to the headline cap-height, carrying a **live, persona-specific result card** — `/brokers` gets the renewal-service spread; `/general-agencies` gets the 12-group book roll-up with `$2.18M`; `/employers` gets one plain-English number ("Your market pays $187 to $1,605 for the same MRI") with **zero CPT codes**. Numbers count up on load. Everything lands inside the first 700px.

---

## MARKETING

### Ship in the next hour

**M1 — Sticky header has no backdrop blur; content ghosts through the nav on the first scroll.** `header.site-header`, every route, both viewports. Computed: `background-color: rgba(255,255,255,0.88)`, `backdrop-filter: none`, `box-shadow: none`, re-read after scroll — no scrolled-state class exists. At 1440 on `/` I watched `$498`, `$187 to`, `$1,605`, `138%` render straight through the bar and collide with "Brokers / General agencies / Employers"; one step further the orange `2.0x apart.` bleeds through the **Censenda wordmark itself**. Same on `/brokers` ("The finalist presentation" through the nav), `/demo/book` at 390 ("Cornerstone Risk Partners / $737K" through the nav), `/` at 390 ("Brain MRI / Los Angeles-Long Beach-Anaheim, CA · CPT 70553" through the nav). **Change:** `backdrop-filter: saturate(180%) blur(14px)` + `-webkit-` prefix, drop the fill to `rgba(255,255,255,0.72)`, and add a `.is-scrolled` class past `scrollY > 8` that fades in a hairline + `0 1px 0 rgba(0,0,0,.04)`. **World-class:** at any scroll position the bar reads as frosted glass over the page, the wordmark is never crossed by a glyph, and the transition into the scrolled state is a 160ms opacity fade you can feel but not catch.

**M2 — "Methodology" is invisible in the mobile nav.** `/` at 390 and 320. `.site-header__nav` has `scrollWidth 499` vs `clientWidth 390`, `overflow-x: auto`. "Methodology" sits at x=379→479 — **fully offscreen at 390**; at 320 both "Platform" and "Methodology" are offscreen. The screenshot shows the row terminating flush at "Platform" with **no fade, no chevron, no scroll affordance whatsoever**. Methodology is the trust artefact for the post-CAA fiduciary CFO and it does not exist on a phone. **Change:** either collapse to a proper menu below 480px, or wrap to two rows, or add a right-edge mask-image fade + snap scrolling. **World-class:** every nav destination reachable in one tap at 320px, with the persona the visitor came for marked as current.

### Next

**M3 — The three persona heroes are the same template with swapped copy.** `/brokers`, `/general-agencies`, `/employers` at 1440: identical eyebrow style, identical 3-line 62px headline block at the same measure, identical `Book a call` / `Read the methodology` pair at the same coordinates, and the **identical second section heading "Three moments in your year."** on all three — including `/employers`, where "three moments in your year" is broker/GA language aimed at a renewal calendar the CFO does not run. **Change:** give each persona its own second-section spine — brokers: "Three moments in your year"; GAs: "What your downstream network gets"; employers: "The three questions you will be asked." **World-class:** a broker and a CFO who both land on the site cannot tell they were served from the same component tree.

**M4 — Unify the grid to one measure.** Content grid is x=174→1266 (1092px) on `/`; hero text 760, hero cards 880, h1 626.8; `/methodology` uses a *centered* ~832px column starting at x=304. Four systems. **Change:** two tokens only — `--measure-text: 680px` and `--measure-content: 1092px`, both left-origin at x=174 — and delete the 880 and the centered-832 exceptions. **World-class:** you can drop a ruler down the left edge of any page and every element starts on it; the only intentional break is the closing CTA, which is already correctly centered (`margin: 124px auto`, `text-align: center`) and should stay that way.

**M5 — The 900px fold guillotines the hero metric tiles.** `/` at 1440x900. Result card top=608; the four metric tiles occupy y=828→949, so the fold cuts 72px into a 121px row: "MIDDLE HALF SPANS $187 to **$1,095**" is sliced horizontally through the numerals, and the captions under `$1,605` and `138%` are cut mid-type. **Change:** M1's two-column hero relocates this entirely; if the hero ships later, reclaim ~140px (section padding 76→48, lede 4 lines→2, move "Working tools. No account required." into the button row). **World-class:** `$498` and `$1,605` fully rendered above y=880 on a 900px screen, with the tile row either wholly above the fold or wholly below it — never bisected.

**M6 — Percentile rail decouples from its labels at 390.** `/` at 390, hero result card: the rail renders four dots across the top, then the labels reflow into a 2×2 block underneath (`$187 / 25TH` and `$498 / MEDIAN` on row 1, `$1,095 / 75TH` and `$1,605 / 90TH` on row 2). The rail's positional encoding — the whole point of the visual — becomes decoration. **Change:** at <560px rotate to a vertical rail with labels pinned to their own tick, or drop the rail and lead with a single big `$498` plus a "$187 → $1,605" range line. **World-class:** the signature visual survives the phone rather than degrading to a teal line above an unrelated table.

---

## TOOLS

### Ship in the next hour

**T1 — The spread bar strikes through the multiplier on the top 11 rows of the Market Brief.** `/tools/market-brief` at 1440, verified at 2× device scale and in the DOM. `.bar` fill right edge = 898–899px; the `N.NNx` label's left edge = 892px → a **6–7px overlap on every row at or above ~3.3x**: `5.85x`, `4.91x`, `4.81x`, `4.53x`, `4.07x`, `4.04x`, `3.75x`, `3.39x`, `3.38x`, `3.36x`, `3.36x`. In the 2× crop the teal bar visibly cuts a horizontal line through the leading digit of `3.75x`, `3.39x`, `3.38x` and both `3.36x`. These are **the top-ranked rows of the artefact the site calls "the artifact a broker hands a client"** — the widest-spread rows are exactly the ones defaced. **Change:** cap the fill at `calc(100% - 12px)` or give the label a left margin clearing the bar's max width. **World-class:** bar and value share a baseline with a fixed 12px gutter, the bar animates from 0 on scroll-in, and the widest row is visually unmistakable at a glance.

**T2 — Every tool dead-ends into white space with zero actions.** `document.querySelectorAll('button').length` = **0 / 0 / 0** on `/tools/rate-check`, `/tools/market-brief`, `/tools/site-of-service` at both 1440 and 390 (and 0 on the `/tools` hub). No `[role=button]`, no `[tabindex]`. In-`<main>` links: rate-check 0, site-of-service 0, market-brief 1. I looked at each: the result card ends, then ~150–170px of empty white, then the global footer. A working `@media print` block exists in the shipped CSS (`.no-print{display:none!important}` etc.) and **nothing on any page invokes or mentions it**. **Change:** a persistent action bar on every result card — `Download the brief (PDF)` · `Copy link to this market` · `Book a walkthrough` — plus a contextual next-step ("See the site-of-service split for Brain MRI in Los Angeles →") wired to the market the user just queried. **World-class:** the Market Brief exports a branded one-pager carrying the market name, build date, filing count, the four summary tiles and the ranked table — the literal "one page no other broker in the room has."

### Next

**T3 — Three tools, three different input systems.** `/` hero uses tall custom-styled selects with a custom chevron; `/tools/site-of-service` at 1440 uses **raw native `<select>`** with the OS chevron at a different height; `/tools/rate-check` and `/tools/market-brief` use bare `<input type=text>` with no chevron, no affordance, no placeholder hint that they are editable. On `/tools/market-brief` the lone `MARKET` field is a 460px text box floating alone in a 1092px grid — a broker will not know the page is interactive. **Change:** one combobox component (typeahead + list + keyboard nav) used in all four places. **World-class:** the same control everywhere, typing "chic" surfaces Chicago-Naperville-Elgin, and the result re-queries with a 200ms crossfade rather than a hard swap.

**T4 — The Rate Check result leads with an apology.** `/tools/rate-check` at 1440: the largest prose block on the page is the `BY PLAN` panel reading "No plan filed in this market has enough usable data for a per-plan figure. 11 filings here came from out-of-state plans covering local providers…" — directly under a chip that says "Every carrier in this market." **Change:** demote it to a collapsed "Why no per-plan view here" disclosure and promote the positive: filing count, carrier count, build date. **World-class:** the honest caveat is one line the visitor can expand, not the paragraph that dominates the answer.

**T5 — `MEDIAN NEGOTIATED` is the only metric tile with no caption.** `/`, `/rates/los-angeles-ca/brain-mri`, `/tools/rate-check` at 1440: tiles 2/3/4 carry captions ("5.9x from low to high", "What the expensive end costs", "Derived from the two figures shown"); tile 1 carries `$498` and then visible empty space to the tile floor. **Change:** add "What the middle of this market pays." **World-class:** four tiles, four captions, one baseline grid.

---

## BRAND

### Ship in the next hour

**B1 — Every conversion CTA on the site lands on a Calendly page branded *Reddenda* pitching a *provider*.** I inventoried all 11 gated routes at 1440: **32 booking links, every one `https://calendly.com/reddenda/discovery`** — `/` (3), `/brokers` (4), `/general-agencies` (4), `/employers` (4), `/tools` (3), `/tools/rate-check` (2), `/tools/market-brief` (2), `/tools/site-of-service` (2), `/methodology` (3), `/demo/book` (2), `/rates/los-angeles-ca/brain-mri` (3). I clicked "Talk to us" on `/` at 1440 and screenshotted the destination: a **black lockup reading "reddenda — HEALTHCARE INTELLIGENCE INFRASTRUCTURE"**, title "Reddenda Discovery Call", description "…walk through your reimbursement opportunity with Reddenda. We'll review **your NPI's contracted-rate benchmarks** against payer-matched peers…". Reproduced at 390 from `/employers` — same page, full-width, first thing on the screen. A self-funded CFO does not have an NPI. A broker does not have contracted-rate benchmarks. **Change:** three Censenda-branded Calendly event types (broker / GA / employer) with correct logo and per-persona descriptions, routed from the matching page; minimum viable is one Censenda event whose copy says renewals and market rates and never says NPI. **World-class:** an on-site `/demo/book` booking flow that pre-fills the market and service the visitor was just looking at, so the call request arrives carrying their query.

**B2 — `/demo/book` is not a booking page.** The route name promises booking; the page is a book-of-business scan ("BOOK SCAN / Pacific Crest General Agency"). Its own header and terminal CTAs point at the same Reddenda Calendly. **Change:** rename to `/demo/book-scan` and give `/demo/book` the real booking form from B1. **World-class:** the URL a prospect can guess is the URL that books the meeting.

### Next

**B3 — Wordmark collision is a brand event, not just a CSS one.** M1's blur fix is the mechanism; the standard is that the **Censenda mark is never crossed by page content at any scroll offset on any route at any viewport.** Add that as a regression check.

---

## LAUNCH

### Ship in the next hour

**L1 — `/demo/book` ships three charts that encode nothing.** 1440 and 390, measured in the DOM. (a) **Renewal calendar:** all twelve `.calBar` elements render at `height: 76px` — 100% of their 76px wrap — every month identical, every label reading `1`, under copy that says *"When the work lands. Q4 carries 33% of the book."* The chart is a flatline directly contradicting its own caption, on the screen built for the GA persona whose entire pain is a brutal Q4. The table below confirms exactly one group per month (Sep, Nov, Jan, Feb, Mar, Jun, Oct, Apr, Jul, May, Aug, Dec). (b) **Downstream agency trend bars:** all three `.trendBar` elements measure `width: 96px` at 1440 and at 390, while their labels read 9.1% / 7.2% / 7.9% — three different values, three identical bars. **Change:** reshape the demo book so renewals concentrate in Q4 (e.g. 4 groups Oct–Dec, 1–2 elsewhere), scale `.calBar` height to `count / max`, add a faint baseline, and scale `.trendBar` width to the trend value against a common domain. **World-class:** a GA looks at that calendar and immediately says "that's my year" — a visible Q4 spike, the tallest bar tinted hotter, and a hover that names the groups renewing that month.

**L2 — The demo is the funnel's destination and nothing points into it from a tool.** `/tools/*` results carry no path to `/demo/book`; the `/tools` hub does not mention it; the persona pages CTA to Calendly, not to the demo. **Change:** add "See this across a whole book →" to every tool result and to each persona page's mid-scroll. **World-class:** a broker can go hero → rate check → market brief → book scan → booking without ever using the top nav.

### Next

**L3 — Add a one-tap demo persona switcher on `/demo/book`.** The scan is fixed to "Pacific Crest General Agency." A broker and a CFO both need it to be about them. **Change:** three chips — *Broker book (14 groups)* / *GA network (12 groups, 3 downstreams)* / *One employer (1,240 lives)* — swapping the dataset in place. **World-class:** the switch animates the numbers rather than reloading, and the calendar reshapes visibly.

**L4 — Mobile table affordance on `/demo/book`.** At 390, `.tableWrap` is `scrollWidth 900 / clientWidth 364` with `overflow-x: auto` — correct (page-level `scrollWidth` stays 390, no body h-scroll) but the header row simply clips after "LIVES" with no fade or cue. **Change:** right-edge `mask-image` fade + a "swipe →" hint on first paint.

---

## ALREADY WORLD-CLASS — DO NOT TOUCH

- **`/methodology`, the whole page.** 1440. "Four ways a naive reading of these files produces a confident, wrong number," then four numbered cards — *A percentage is not a dollar* / *A rate belongs to a contracting entity, not a doctor* / *One carrier brand is many separate plans* / *An out-of-state plan's file contains in-state providers*. This is the most credible thing on the site and the reason a fiduciary CFO would trust it. Change only its container width (M4). Do not shorten it, do not soften it, do not move it behind a CTA.
- **The copy line on every persona hero.** "Be the only person in the room with the market number." (`/brokers`) · "Give your brokers a reason to quote through you." (`/general-agencies`) · "Walk into your renewal knowing what the market pays." (`/employers`) · "Not a screenshot. A query." (`/brokers`, 1440). Each nails its buyer in one sentence. The heroes need a right column, not new words.
- **The `/demo/book` group table.** 1440. Twelve rows, `LIVES / FUNDING / PMPM / TREND / OPPORTUNITY / % OF SPEND / RENEWS`, ranked by opportunity, trend values above 10% in orange, self-funded vs level-funded chips, real metro + plan names ("Harbor Point Manufacturing · Los Angeles-Long Beach-Anaheim, CA · Meridian Health Plan · 11.2% · $267K"). This is the single most convincing screen on the site.
- **The `/tools/market-brief` ranked table and its summary strip.** `38 of 39 SERVICES WITH DEFENSIBLE DATA · 2.7x TYPICAL SPREAD · 5.85x WIDEST: BRAIN MRI · $21,984 TOTAL GAP ACROSS THE BASKET, PER CASE`, then 39 rows with CPT + category subtitles. Fix only the bar/label overlap (T1) — the information design itself is the product.
- **The homepage 4-market comparison.** 1440. "One procedure. 4 markets. **2.0x** apart." with LA / New York / Chicago / Houston and their filing counts (100,870 / 646,255 / 36,083 / 23,512). The clearest single proof on the site.
- **The "Where do you sit at the table?" three-card router** (`/` at 1440 and 390) — `I PLACE GROUPS` / `I RUN AN AGENCY` / `I RUN OUR PLAN`. Correct self-selection, correct labels, works identically stacked on mobile.
- **The demonstration-data banner on `/demo/book`** — amber, top of page, above the fold, both viewports. Leave it exactly where it is.
- **Zero page-level horizontal scroll.** Measured `document.documentElement.scrollWidth === innerWidth === 390` on `/demo/book` at 390 with two internal scrollers behaving correctly. Whatever M2/L4 do, this must stay true at 320, 390, 768, 1440.
- **The closing CTA block** (`/`, 1440): "Bring a number to the meeting." centered with `Book a call` / `See how it works`. It is the one deliberately centered moment on the site and it works — keep it centered when M4 unifies the grid.