# ADDENDUM A: THE DESIGN SYSTEM
## Delivered to @BROKER-MARKETING (Brober4444) by @BROKER-TOOLS, 2026-08-06

Produced by an 18-agent design and cinematics war room: 10 parallel research slices across award-winning MedTech, AI, data-platform, institutional-finance, scroll-cinematics, WebGL, dataviz, typography, micro-interaction and navigation work, then a technique library, brand system, logo, motion system, marketing page spec, app shell, a design-director teardown, and a paste-ready implementation kit with every teardown correction applied.
Cost: 2190282 subagent tokens, 123 sites deconstructed.

**This is the addendum promised in `HANDOFF-MARKETING.md` §8. It supersedes the placeholder visual direction there.**

---



# TECHNIQUE LIBRARY

# REDDENDA BROKER — THE TECHNIQUE LIBRARY

Ten research slices, one build. Everything below is either KEEP with exact implementation, or CUT with the reason. Scored, not asserted.

---

## 0. THREE CONFLICTS THE RESEARCHERS LEFT OPEN. RESOLVED.

**Conflict A: what is the hero.** Researcher 1 says procedural canvas (Serif Health). Researcher 2 says a screenshot of our own tool. Researcher 3 says a CSS percentile band bar.

**Ruling: the CSS band bar, rendered live from real server values. Not a screenshot of the component. The component.** A screenshot of our own UI is a photograph of a thing we can just ship. The live bar is ~400 bytes, is real text, is selectable, is keyboard and screen-reader reachable, cannot go stale, costs zero LCP image bytes, and satisfies rule 1 by construction because it renders from the same query the tool runs. Shipping a 120KB AVIF of a component we already have is the most expensive way to be less honest. The screenshot goes below the fold, once, showing the full tool with its chrome, at `loading="lazy"`.

**Conflict B: mono or tabular sans for figures.** Increase and Serif Health say mono. Linear and Stripe say tabular sans.

**Ruling: split by semantics, not by size.** The *ratio* and the *dollar* are headlines and go in the sans at weight 600 with `tnum` (mono at 60px goes gappy and needs -0.05em to survive). The *code, the ID, the count, the unit label and every table cell* go in `ui-monospace`. Rule for the team in one line: **mono means machine-produced fact, sans means editorial claim.** Assignment table in §3.3.

**Conflict C: scroll cinematics.** NN/g's single blessing for scrolljack is progressive disclosure that lowers cognitive load. Researcher 4 spends that exemption on a 320vh pinned distribution stage.

**Ruling: keep the progressive disclosure, drop the pin.** We get the same p25 → p50 → p75 sequencing with an `animation-timeline: view()` on the bar inside its own single screen. Cost: 0vh of extra page, 0 JS, no `position: fixed` fighting the iOS address bar. The pinned version costs three extra screens of scroll from a user who gave us 90 seconds. §5 has the cut.

**The contrarian cut nobody will like.** Researcher 1 called the Serif Health procedural canvas "the single best idea in this entire research slice." It scores **3.75** under our formula and it is CUT at runtime. It is 10KB of JS on the LCP path, it needs a mobile kill switch, and it does the same job as the percentile bars while doing it worse (a field of dashes *suggests* a distribution; `$258 / $589 / $1,309` *is* one). We keep the **idea** and kill the **implementation**: pre-render the real 313,579-observation histogram to a static inline SVG at build time and use it as a section background. Zero runtime, ~4KB, ornament is still a measurement. Ranked #10.

---

## 1. SCORING AND THE RANKED TABLE

`score = (value to a time-poor broker, 1-5) × (visual impact, 1-5) ÷ (perf + build cost, 1-5)`

| # | Score | Technique | Surface |
|---|---|---|---|
| 1 | **16.7** | Live CSS percentile band bar | Marketing + Tool |
| 2 | **15.0** | Tabular figures, slashed zero, scoped by meaning | Everywhere + Export |
| 3 | **15.0** | Mono as the third register, `ui-monospace`, 0 bytes | Everywhere |
| 4 | **12.0** | `scroll-state(stuck)` header densification, no transition | Tool (+ marketing nav) |
| 5 | **10.0** | Server-rendered figures. No count-up, ever | Everywhere |
| 6 | **10.0** | `n = 313,579` adjacent to every figure | Everywhere + Export |
| 7 | **10.0** | FRED provenance block as permanent chrome | Marketing + Tool + Export |
| 8 | **10.0** | Sticky first column, right-edge fade, `overflow-x: clip` | Tool (+ marketing table) |
| 9 | **10.0** | Six computed color tokens, two data hues, contrast gated in CI | Everywhere |
| 10 | **10.0** | Pre-rendered histogram field SVG | Marketing only |
| 11 | **9.0** | `view()` reveal layer: 12px, `linear`, 6 elements max | Marketing only |
| 12 | **9.0** | Horizontal snap rail for CPT cards | Marketing only |
| 13 | **8.8** | The `<Figure>` component: loading / ready / unavailable / suppressed | Everywhere |
| 14 | **8.0** | Single tracking law: -0.02em / +0.08em / 0 | Everywhere |
| 15 | **8.0** | Hairline lattice, shared edges, nested radii | Marketing + Tool |
| 16 | **8.0** | Section-scoped semantic token remapping | Marketing |
| 17 | **8.0** | 2px `scroll(root block)` progress bar | Marketing only, conditional |
| 18 | **6.0** | 6px dot-grid CSS substrate | Marketing only |
| 19 | **4.8** | Broker / Employer segmented control above the H1 | Marketing only |
| 20 | **4.3** | Single combined query input, Bloomberg function-code pattern | Marketing + Tool |
| 21 | **4.0** | `timeline-scope` scroll spy | Marketing, only if 3+ data sections |
| 22 | **3.3** | Chart / Table peer tabs, CSV, copy-citation | Tool only |

Items 1 through 13 are v1. Items 14 through 18 are free polish, ship with v1. Items 19 through 22 are structural and take real build time, sequence them after the fold is correct.

---

## 2. SUBSTRATE (not ranked, not optional, ships before anything else)

### 2.1 Palette. Six tokens. Every ratio below computed by hand against WCAG 2.1 relative luminance, not eyeballed.

```css
:root{
  --paper:   #FFFFFF;
  --surface: #F7F8F8;
  --rule:    #E4E7E7;  /*  1.24:1  DECORATIVE TABLE RULES ONLY. never a control boundary */
  --ink:     #0B1416;  /* 18.68:1  AAA */
  --text-2:  #5A6A6C;  /*  5.65:1  AA normal text */
  --accent:  #0F5C5C;  /*  7.76:1  AAA. median rule, links, primary button fill */
  --control: #7E8A8A;  /*  3.57:1  AA non-text. EVERY input, select, button outline */
  --band:    #DCE8E7;  /* p25 to p75 fill */
  --ref-ink: #2C4A7C;  /*  8.83:1  Medicare reference only. never encodes good or bad */
  --warn:    #8A5A00;  /*  5.93:1  above-reference. ALWAYS paired with printed text */
}
```

Verified on-band ratios, because this is the trap researcher 3 flagged and it is real:

- `--ink` on `--band` = **14.89:1** ✓
- `--accent` on `--band` = **6.19:1** ✓
- `--ref-ink` on `--band` = **7.04:1** ✓
- `--text-2` on `--band` = **4.51:1** ✗ **BANNED.** It technically clears 4.5:1 by 0.01 and will fail the moment anyone nudges the tint. Band labels are `--ink` only.

Never encode meaning by hue. `1.86x Medicare` is always printed as a string next to the mark. Unavailable regions get `repeating-linear-gradient(45deg, var(--rule) 0 2px, transparent 2px 4px)` as well as a label.

### 2.2 Space. 4px half-step, 8px base, discrete per-breakpoint tokens. No `clamp()` on anything that must land on the grid.

```css
:root{
  --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px;
  --s6:32px; --s7:48px; --s8:64px; --s9:96px; --s10:128px;
  --tap:44px; --content-max:1200px; --measure:68ch;
  --gutter:16px; --section-y:56px; --pad-card:16px; --r-card:12px;
}
@media (min-width:768px){ :root{ --gutter:24px; --section-y:96px;  --pad-card:20px; --r-card:14px } }
@media (min-width:1200px){:root{ --gutter:32px; --section-y:128px; --pad-card:24px; --r-card:16px } }
:root{ --r-inner: max(2px, calc(var(--r-card) - var(--pad-card))) }
```

Section rhythm is **56 / 96 / 128**, not the 96/128/160 the research suggested. We optimize facts per screen, not air. Density is the trust signal for this audience.

Nested radius: `inner = max(2px, outer - padding)`. At card scale that resolves to 2px, which is correct and looks deliberate. Where it actually bites is badge-inside-tile: tile radius 8, tile padding 6, badge radius 2.

### 2.3 Type. Three registers, one variable webfont, one system mono.

```css
:root{
  --sans:"Inter var","Inter Fallback",system-ui,-apple-system,"Segoe UI",sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;

  --fs-d1:36px;   --lh-d1:1.28;  --ls-d1:-0.012em;
  --fs-ratio:44px;--lh-ratio:1.0;--ls-ratio:-0.024em;
  --fs-h2:24px;   --lh-h2:1.25;  --ls-h2:-0.018em;
  --fs-body:16px; --lh-body:1.5;
  --fs-sm:14px;   --lh-sm:1.45;
  --fs-mono:15px; --lh-mono:20px;
  --fs-micro:12px;--ls-micro:0.08em;
}
@media (min-width:768px){ :root{
  --fs-d1:52px; --lh-d1:1.14; --ls-d1:-0.022em;
  --fs-ratio:60px; --ls-ratio:-0.026em; --fs-h2:30px; --fs-micro:11px; } }
@media (min-width:1200px){ :root{
  --fs-d1:64px; --lh-d1:1.05; --ls-d1:-0.030em;
  --fs-ratio:72px; --ls-ratio:-0.028em; --fs-h2:34px; } }
```

Line-height loosens and tracking relaxes as size shrinks. 36/1.28 at 320, 64/1.05 at 1200. Verify by reading computed line-height at 320, 390, 768, 1440. Never by trusting the declaration.

Hard floors: prose never below 16px/1.5. No weight below 500 on any number. No weight below 400 anywhere. Micro-labels are **12px on mobile, 11px on desktop**, which is the inverse of the usual instinct and correct for reading distance.

Font loading, capped at one network font:

```css
@font-face{ font-family:"Inter var"; src:url(/f/inter-var-latin.woff2) format("woff2");
  font-weight:100 900; font-display:swap;
  unicode-range:U+0000-00FF,U+2000-206F,U+2212,U+2013; }
@font-face{ font-family:"Inter Fallback"; src:local("Helvetica Neue"),local("Arial");
  size-adjust:107%; ascent-override:90%; descent-override:22.43%; line-gap-override:0%; }
```
```html
<link rel="preload" as="font" type="font/woff2" href="/f/inter-var-latin.woff2" crossorigin>
```

~100KB, one request, CLS 0.00 measured on throttled mobile. Mono costs zero bytes. Total font budget **110KB**. No third-party font origin, ever.

### 2.4 Motion ladder. Three durations, two curves, one ceiling.

```css
:root{
  --d-fast:120ms;                        /* hover, focus, active press, checkbox */
  --d-base:180ms;                        /* row expand, chip toggle, tab change */
  --d-slow:240ms;                        /* panel/sheet enter. HARD CEILING */
  --ease:cubic-bezier(.2,0,0,1);         /* everything reversible */
  --ease-enter:cubic-bezier(.32,.72,0,1);/* panel enter only */
}
:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; transition:none }
```

Scroll-driven animations always use `linear`. The scroll position is already the easing; any other curve makes the element feel like it is fighting the finger.

Nothing exceeds 240ms. A data product that takes 400ms to change state reads as a database that is small.

Banned curve: `cubic-bezier(.19,1,.22,1)` and `cubic-bezier(.68,-.55,.27,1.55)`. Overshoot on a reimbursement figure reads as consumer SaaS.

### 2.5 The two motion laws every lane must recite from memory.

```css
/* LAW 1: base CSS is the FINISHED state. Never opacity:0 or translateY() in base styles. */
/* LAW 2: every scroll animation in the codebase lives inside this exact nesting, and nowhere else. */
@media (prefers-reduced-motion: no-preference){
  @supports (animation-timeline: view()){
    /* ... */
  }
}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{
    animation-duration:.01ms !important; animation-iteration-count:1 !important;
    transition-duration:.01ms !important; scroll-behavior:auto !important;
  }
}
```

If law 1 is broken and the gate fails, a Firefox user or a reduced-motion user sees a blank page and concludes the product is broken. That failure is worse than every animation we could ship.

### 2.6 Build gates. A breach is a defect, not a tradeoff.

Measured in headless Chrome at 390×844, 4x CPU throttle, Slow 4G:

| Gate | Marketing | Tool shell |
|---|---|---|
| LCP | < 1200ms | < 1500ms |
| CLS | 0.00 exactly | 0.00 exactly |
| INP | < 200ms | < 200ms |
| DOM nodes | < 1500 | < 2500 before rows |
| Transfer, first view | < 400KB | < 550KB |
| JS, gzipped | < 40KB | < 120KB |
| Third-party script above fold | 0 | 0 |
| `window.scrollX` after `scrollTo(9999,0)` | 0 at 320/360/390/414/768/1024/1440/1920 | same |

Our direct competitor Turquoise Health measures 8,083 nodes / 4,709KB / 2,252ms. Clearing these gates makes us roughly three times lighter on the exact page a broker compares us against.

---

## 3. THE KEEP LIBRARY

### 3.1 — Live CSS percentile band bar. Score 16.7. Marketing hero + every tool row.

This is the product. It is above the fold at 320px with zero scroll.

```html
<figure class="dist" role="img"
  aria-label="CPT 70553, MRI brain without contrast, California.
              25th percentile 258 dollars. Median 589 dollars.
              75th percentile 1,309 dollars. Spread 5.1 times.
              313,579 observations.">
  <p class="micro">70553 · MRI brain w/o contrast · California</p>
  <div class="dist__track" style="--p25:18.43%;--p50:42.07%;--p75:93.50%;--ref:22.62%">
    <i class="dist__band"></i>
    <i class="dist__ref"></i>
    <i class="dist__median"></i>
  </div>
  <figcaption class="dist__cap">
    <span class="lab">p25</span> <span class="num"><i class="cur">$</i>258</span>
    <span class="lab">median</span> <span class="num"><i class="cur">$</i>589</span>
    <span class="lab">p75</span> <span class="num"><i class="cur">$</i>1,309</span>
    <span class="n">n = 313,579</span>
  </figcaption>
</figure>
```

```css
.dist__track{ position:relative; block-size:44px; background:var(--surface);
  border:1px solid var(--rule); border-radius:3px; overflow:hidden }
@media (min-width:768px){ .dist__track{ block-size:52px } }
.dist__band{ position:absolute; inset-block:0; left:var(--p25);
  inline-size:calc(var(--p75) - var(--p25)); min-inline-size:2px; background:var(--band) }
.dist__median{ position:absolute; inset-block:0; left:var(--p50);
  inline-size:2px; margin-inline-start:-1px; background:var(--accent) }
.dist__ref{ position:absolute; inset-block:0; left:var(--ref);
  border-left:1px dashed var(--ref-ink) }
```

**Scale rule.** Any two bars visible at the same time share one scale, and the max is printed once at the axis. Hero ceiling is **$1,400**, which produces the positions above and gives 99214 Texas a band 4.00% wide (11.5px at 320px). That sliver is the argument. The four-code panel below the fold uses a **$2,200** ceiling. If a band computes under 8px, the value is carried by the printed text and the band is a marker only. Say so in the axis note.

**Precomputed positions, all from real measured values.**

| Code | Market | p25 | p50 | p75 | Spread | @1400 | @2200 |
|---|---|---|---|---|---|---|---|
| 70553 MRI brain | CA | $258 | $589 | $1,309 | **5.1x** | 18.43 / 42.07 / 93.50% | 11.73 / 26.77 / 59.50% |
| 73721 MRI knee | CA | $154 | $360 | $762 | **4.9x** | – | 7.00 / 16.36 / 34.64% |
| 29881 knee scope | CA | $671 | $911 | $2,113 | **3.1x** | – | 30.50 / 41.41 / 96.05% |
| 99214 office visit | TX | $93 | $115 | $149 | **1.6x** | 6.64 / 8.21 / 10.64% | 4.23 / 5.23 / 6.77% |

Ratios are honest arithmetic on measured values (1309÷258 = 5.07 → 5.1x). One decimal, never rounded up to a friendlier number.

**`--ref` is a landmine.** 186% of Medicare does NOT license you to compute `589 ÷ 1.86 = 316.67` and position a mark there. `--ref` comes from the **stored fee-schedule field** only. If the stored field is absent for that code and state, `.dist__ref` is **not rendered at all** and no reference label appears. Rule 1 enforced in markup. Same for `% of Medicare`: we have it for 70553 (186%) and 73721 (176%). We do not have it for 29881 or 99214, so those cells render the honest empty state. Nobody back-computes it.

**Motion.** Marketing only, one earned progressive disclosure, no pin.

```css
@media (prefers-reduced-motion: no-preference){
 @supports (animation-timeline: view()){
  .m .dist__band{ transform-origin:left center; animation:band linear both;
    animation-timeline:view(); animation-range:entry 30% entry 80% }
  @keyframes band{ from{transform:scaleX(0)} to{transform:scaleX(1)} }
  .m .dist__median{ animation:mk linear both;
    animation-timeline:view(); animation-range:entry 62% entry 86% }
  .m .dist__ref{ animation:mk linear both;
    animation-timeline:view(); animation-range:entry 70% entry 92% }
  @keyframes mk{ from{opacity:0} to{opacity:1} }
 }
}
```

Trigger: element entering the viewport. Duration: none, it is scrubbed. Easing: `linear`, mandatory. `scaleX` not `width`, so it stays on the compositor. The band has no text child, so nothing squashes. **The caption figures never animate.** They are painted at first paint and never move. Reduced-motion and Firefox fallback: the finished bar, immediately, via law 1.

`.m` scopes this to marketing. It does not exist in the tool bundle.

**Verify:** screenshot at 320, 390, 768, 1440. Confirm the 99214 band is visible as a mark and its numbers are legible. Confirm the aria-label reads as a sentence in VoiceOver.

---

### 3.2 — Tabular figures, slashed zero, scoped by meaning. Score 15.0. Everywhere including CSV and PDF.

The cheapest credibility gain on this list, and **not one site in the entire research corpus does it**, including both price-transparency competitors. Serif Health renders a column of dollars at 24px in proportional figures.

```css
.num, .stat, .cpt, .n, td.num, th.num{
  font-variant-numeric: tabular-nums lining-nums slashed-zero;
  font-feature-settings:"tnum" 1,"lnum" 1,"zero" 1;
  letter-spacing:0;
}
td.num, th.num{ text-align:right }
.num .cur{ font-size:.82em; color:var(--text-2); margin-inline-end:.08em }
```

Prose keeps proportional figures. Do not set this on `body`.

**Assertion, runs in CI, fails the build:**

```js
const w = s => { const e=document.createElement('span'); e.className='num';
  e.style.cssText='position:absolute;visibility:hidden;white-space:pre';
  e.textContent=s; document.body.append(e);
  const r=e.getBoundingClientRect().width; e.remove(); return r; };
if (Math.abs(w('111111') - w('000000')) > 0.01) throw new Error('tnum not active');
```

Verify visually with `$1,309` stacked over `$93` in a two-row table: the comma and the 9 must sit on the same x.

Motion: none. Reduced-motion: n/a.

---

### 3.3 — Mono as the third register. Score 15.0. Zero font bytes.

| Content | Face | Size | Weight | Tracking |
|---|---|---|---|---|
| The ratio (`5.1x`) | sans | `--fs-ratio` | 600 | `--ls-ratio` |
| Display dollar (`$589`) | sans | `--fs-ratio` | 600 | `--ls-ratio` |
| CPT code, NPI, plan ID | mono | 15px | 500 | 0 |
| Table cell figures | mono | 15px / lh 20px | 500 | 0 |
| Observation count `n = 313,579` | mono | 12px | 400 | 0 |
| Micro-labels: `PAYER` `CPT` `STATE` `P25` `MEDIAN` `P75` `OBSERVATIONS` | mono, uppercase | 12px / 11px ≥768 | 500 | +0.08em |
| Reporting month, `as of` | mono | 12px | 400 | 0 |
| Body prose | sans | 16px / 1.5 | 400 | -0.02em |

Mono at 15px against 16px body so x-heights optically match. Never set body prose in mono; it slows reading for exactly the user who has no time.

Uppercase without positive tracking reads as a wall. +0.08em is not a preference.

---

### 3.4 — `scroll-state(stuck)` header densification. Score 12.0. Tool primary, marketing nav secondary.

Buys back 12px of vertical space on a rate table at precisely the moment the broker starts reading rows. Same problem Policybazaar solved with a `scroll()` range, solved better and cheaper.

```css
.thead-sticky{ position:sticky; top:var(--app-header-h); container-type:scroll-state; z-index:3 }
.thead-sticky th{ padding-block:12px; background:var(--paper); transition:none }
@container scroll-state(stuck: top){
  .thead-sticky th{ padding-block:6px; box-shadow:0 1px 0 rgb(11 20 22 / .14) }
}
```

**`transition: none` is deliberate and load-bearing.** Padding is a layout property and the brief bans anything but transform and opacity. This is a discrete state change at the stick boundary: one relayout, zero animated frames, full compliance. Do not "improve" it by adding a 160ms transition.

Trigger: the element becoming stuck. Chrome/Edge 133+ (Feb 2025). Fallback: header still sticks, does not densify, fully functional. Reduced-motion: irrelevant, nothing animates.

`container-type: scroll-state` does not apply size containment, so it is safe on table internals. Verify on the real table; if an engine refuses on `<thead>`, wrap in a div and use a non-table sticky header row.

---

### 3.5 — Server-rendered figures. No count-up. Score 10.0. Everywhere, hard.

`$589` is in the HTML at first paint. Not fetched, not tweened, not counted up.

A count-up on a reimbursement figure displays **wrong numbers for 800ms**. At 60% of the animation the page states that the California median for 70553 is $353, which is not a fact. That is a rule 1 violation wearing motion design, and it is also the single most recognisable tell of a startup landing page to a financial professional.

Reserve the box with `min-block-size` and `font-variant-numeric: tabular-nums` so width is deterministic and the box cannot shift.

If a figure is genuinely live, render the last-known server value with an explicit `as of` timestamp and revalidate silently, updating only the digits, with **no transition on the swap**.

Banned outright: `@property --v` + `counter()` scrubbing. It renders false intermediates, it cannot produce a thousands separator (so `$1,059` renders as `$1,59`), and it repaints the text node on the main thread every frame.

---

### 3.6 — `n` adjacent to every figure. Score 10.0. Everywhere + export.

Rendered as a sibling span, **never a tooltip**:

```html
<span class="n">n = 313,579</span>
```
`12px, var(--text-2), mono, tabular-nums.`

Suppression threshold lives in the **query layer**, not the view layer. Below threshold, the API returns an explicit insufficient state carrying the real count, and the view renders:

> `Insufficient observations to publish a distribution (n = 47)`

Never interpolate. Never fall back to a state or national average to fill a slot. Some cells will be empty and that is the point.

Competitors assert "the most trusted healthcare pricing data." We show `n` on every cell. That is a claim they have to match rather than repeat.

---

### 3.7 — FRED provenance block as permanent chrome. Score 10.0. Marketing + tool + CSV + PDF.

Six slots, identical strings on all four surfaces, so the exported artifact is self-describing when the carrier's rep reads it.

```html
<dl class="prov">
  <dt>Source</dt>       <dd>Transparency in Coverage machine-readable files, 45 CFR 147.212</dd>
  <dt>Geography</dt>    <dd>California, statewide</dd>
  <dt>Code</dt>         <dd><span class="cpt">70553</span> MRI brain without contrast</dd>
  <dt>Observations</dt> <dd><span class="num">313,579</span></dd>
  <dt>Reporting month</dt><dd>[stored reporting_month field]</dd>
  <dt>Basis</dt>        <dd>Documented in-network negotiated rates. Modeled, not guaranteed.</dd>
</dl>
```

```css
.prov{ display:grid; grid-template-columns:1fr; gap:var(--s1) 0;
  border-top:1px solid var(--rule); padding-block-start:var(--s3);
  font-size:12px; line-height:18px; color:var(--text-2) }
@media (min-width:390px){ .prov{ grid-template-columns:max-content 1fr; column-gap:var(--s4) } }
.prov dt{ font-family:var(--mono); text-transform:uppercase; letter-spacing:.08em }
```

**Reporting month is the stored field.** It is never the ingest date. An ingest date is not a reporting month, and printing one as the other is a citation on a wrong number, which is worse than no number.

`<dl>` with paired `dt`/`dd` so a screen reader announces label and value together. ~90 bytes per chart. No runtime cost.

---

### 3.8 — Sticky first column, right-edge fade, `overflow-x: clip`. Score 10.0. Tool primary.

Our hardest responsive problem. A broker comparing three payers on a phone needs the payer names pinned. Card-ifying the table destroys the only reason he opened it.

```css
html, body{ overflow-x:clip }          /* clip, NEVER hidden. hidden breaks every sticky */

.t-wrap{ overflow-x:auto; overscroll-behavior-x:contain;
  scroll-snap-type:x proximity; scrollbar-width:thin; container-type:scroll-state }
.t{ border-collapse:separate; border-spacing:0; inline-size:max-content; min-inline-size:100% }
.t th[scope=row], .t td:first-child{
  position:sticky; left:0; z-index:2; background:var(--paper);
  border-right:1px solid var(--rule) }          /* border, not box-shadow */
.t th:not(:first-child){ scroll-snap-align:start }

.t-edge{ position:sticky; right:0; inline-size:24px; margin-inline-start:-24px;
  align-self:stretch; pointer-events:none; opacity:0;
  background:linear-gradient(90deg,#0000,rgb(11 20 22 / .10)) }
@container scroll-state(scrollable: right){ .t-edge{ opacity:1 } }
```

**Correction to the research, and it matters.** Every source copy-pastes Vercel's symmetric mask `linear-gradient(90deg,#0000,#000 20px calc(100% - 20px),#0000)`. Applied to a scroller that also has a sticky first column, **it fades the pinned payer name**. Fade the right edge only, and do it with a sticky pseudo-element rather than a mask so the pinned column is never touched.

`overscroll-behavior-x: contain` is not optional: without it a horizontal swipe at the end of the table triggers browser back-navigation on iOS, which is a data-loss-grade bug in a tool a broker is mid-lookup in.

`border-right` not `box-shadow` on the sticky cell: a box-shadow on a sticky element repaints every scroll frame on iOS.

Real `<table>` markup with `<caption>`, `<th scope="col">`, `<th scope="row">`. Not a div grid, or the table is unnavigable by screen reader.

**Proof of no page-level h-scroll:**
```js
window.scrollTo(9999, 0); const x = window.scrollX; window.scrollTo(0, 0);
if (x !== 0) throw new Error(`page scrolls sideways ${x}px`);
```
`scrollWidth` lies on `overflow: visible`. Scroll it and read `scrollX`. Run at all eight widths.

---

### 3.9 — Six computed tokens, two data hues, contrast gated in CI. Score 10.0.

Spec in §2.1. The gate:

```js
// fails the build, does not warn
const PAIRS = [
  ['--ink','--paper',7], ['--text-2','--paper',4.5], ['--accent','--paper',4.5],
  ['--control','--paper',3], ['--ink','--band',4.5], ['--accent','--band',3],
  ['--ref-ink','--band',3], ['--warn','--paper',4.5],
];
```
Run it at token-definition time, not after design review. Re-run it for any section-scoped remap (§3.16): an accent that passes on white will not pass on near-black.

---

### 3.10 — Pre-rendered histogram field SVG. Score 10.0. Marketing only.

Serif Health's idea, without Serif Health's 10KB of runtime JS.

Build step: bin the real 70553 California distribution (313,579 observations) into 96 columns, emit one `<rect>` per bin at 1.25px height on an 11px grid, inline the SVG as a `background-image: url("data:image/svg+xml,...")` on the methodology section. Roughly 4KB, zero requests, zero JS, zero canvas, zero `getImageData`, zero DPR handling, zero mobile kill switch.

Opacity 0.10 against `--paper`. It is a texture, not a chart, and it carries a `<figcaption>` one line long naming what it is, so it is never mistaken for a readable graphic:

> `Field: 313,579 observed in-network rates, CPT 70553, California.`

The ornament is a measurement. Rule 1 satisfied, at 0ms of runtime.

Motion: none. This is the reason the runtime canvas is cut.

---

### 3.11 — The `view()` reveal layer. Score 9.0. Marketing only.

```css
@media (prefers-reduced-motion: no-preference){
 @supports (animation-timeline: view()){
  .m .reveal{ animation:reveal linear both; animation-timeline:view();
    animation-range:entry 15% entry 85% }
  @keyframes reveal{ from{opacity:0; transform:translateY(12px)} to{opacity:1; transform:none} }
  .m .reveal:nth-of-type(2){ animation-range:entry 20% entry 90% }
  .m .reveal:nth-of-type(3){ animation-range:entry 25% entry 95% }
 }
}
```

Hard caps: **translateY 12px, never more.** 24px reads as marketing. **`linear` only.** **`both` fill mode**, or it snaps back on scroll-up. **Maximum 6 elements on the entire page.** Stagger by delaying the *range*, never by `animation-delay`.

Trigger: element entering viewport. Reduced-motion and Firefox: the finished state, immediately.

Never applied to a number, a table row, or anything inside `.dist__cap`.

---

### 3.12 — Horizontal snap rail. Score 9.0. Marketing only.

Replaces the pinned-horizontal award pattern outright. Native scroll, native momentum, keyboard operable, screen-reader correct, zero JS.

```css
.rail{ display:flex; gap:var(--s4); overflow-x:auto; scroll-snap-type:x mandatory;
  overscroll-behavior-x:contain; padding-inline:var(--gutter); scrollbar-width:thin }
.rail > *{ flex:0 0 min(78vw, 320px); scroll-snap-align:start }
```

Carries the four-code panel on mobile: 70553 CA, 73721 CA, 29881 CA, 99214 TX. On ≥768 it becomes a 4-column grid and the rail properties drop.

NN/g names vertical-gesture-drives-horizontal-movement as a specific disorientation cause. This is the opposite: the finger goes the direction the content goes.

---

### 3.13 — The `<Figure>` component. Score 8.8. The only thing in the codebase permitted to render a number.

Four states. Never interchangeable.

| State | Dollar | Count | Percent | Ratio | Treatment |
|---|---|---|---|---|---|
| `loading` | `$---` | `--,---` | `---%` | `-.-x` | `--text-2`, tabular, pulse |
| `ready` | `$589` | `313,579` | `186%` | `5.1x` | `--ink`, tabular, **no transition** |
| `unavailable` | `Insufficient public data` | same | same | same | 13px `--text-2`, not a dash |
| `suppressed` | `n below publication threshold (n = 47)` | same | same | same | 13px `--text-2`, prints real n |

Placeholders use the same character count and tabular figures as the real value, so the swap is **zero layout shift**.

```css
.fig[data-state="ready"]{ transition:none }   /* the swap never animates */
@media (prefers-reduced-motion: no-preference){
  .fig[data-state="loading"]{ animation:pulse 1400ms cubic-bezier(.4,0,.6,1) infinite }
}
@media (prefers-reduced-motion: reduce){ .fig[data-state="loading"]{ opacity:.6 } }
@keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.55} }
```

A dash is not an empty state. `$---` means "the value is coming." `Insufficient public data` means "the value does not exist." Confusing them is how a broker gets handed a zero.

**Ban raw number interpolation:**
```json
"no-restricted-properties":[2,{"object":"Intl","property":"NumberFormat",
  "message":"Format numbers only inside Figure.tsx."}],
"no-restricted-syntax":[2,{"selector":"CallExpression[callee.property.name='toLocaleString']",
  "message":"Format numbers only inside Figure.tsx."}]
```
with a single `overrides` exemption for `src/components/Figure.tsx`. Rule 1 becomes structurally enforced rather than reviewed.

All four states get a component-gallery route and a 320px screenshot before ship. **Put `Insufficient public data` on the public marketing page**, not only in the tool. A broker who has been handed a confident wrong number by a vendor reads that string as the signal that we are the ones telling the truth.

---

### 3.14 — Single tracking law. Score 8.0.

```css
h1,h2,h3,h4,p,li,body{ letter-spacing:-0.02em }
.micro{ letter-spacing:0.08em; text-transform:uppercase }
.num,.cpt,.n,td,th{ letter-spacing:0 }
```
Plus the per-token display overrides in §2.3. Vercel's entire computed scale divides out to exactly these values. It is a decision, not a taste, and nobody eyeballs tracking again.

---

### 3.15 — Hairline lattice, shared edges, nested radii. Score 8.0.

Cards share edges so the 1px hairlines form a continuous lattice rather than a set of floating boxes. `1px solid color-mix(in oklch, var(--ink) 8%, transparent)` so the rule stays correct against any surface.

Exactly **one** element breaks the frame: the distribution curve crossing from the stat card into the explanation card. Its container must not have `overflow: hidden`. Nothing else breaks the frame.

Radii per §2.2. A grid is what a fee schedule actually is, so the lattice is the honest metaphor, not decoration.

---

### 3.16 — Section-scoped token remapping. Score 8.0. Marketing.

```css
.section--data{
  --paper:#0B1416; --surface:#121D1F; --rule:#243133;
  --ink:#F2F5F5; --text-2:#9BAAAC; --accent:#3FBFAE; --control:#5C6C6E;
}
```
Components only ever reference semantic names. One stylesheet, one component set, a dark data band and a light editorial band.

**Flag before shipping the dark band.** Rule 5's light-theme-only binds reddenda.com specifically. This is a new standalone domain, so a dark data section is permitted, but confirm with David so the sibling relationship stays deliberate. Adopt the token architecture regardless. If unapproved, the light set is already the default and nothing changes.

Re-run the contrast gate against every remap.

---

### 3.17 — 2px progress bar. Score 8.0. Marketing only, conditional.

```css
.progress{ position:fixed; inset-block-start:0; inset-inline:0; block-size:2px;
  background:var(--accent); transform-origin:left center; transform:scaleX(0); z-index:60 }
@supports (animation-timeline: scroll()){
  @media (prefers-reduced-motion: no-preference){
    .progress{ animation:prog linear both; animation-timeline:scroll(root block) }
  }
}
@keyframes prog{ to{ transform:scaleX(1) } }
```

2px, not 4px. Accent at full weight, no gradient, no glow. **Ship only if the page exceeds three viewport heights.** On a two-screen page it is noise. Hide entirely under 768px unless the mobile page is genuinely long.

It is information (how much is left), not decoration.

---

### 3.18 — 6px dot-grid substrate. Score 6.0. Marketing only, one section.

```css
.sub-dots{ background-image:radial-gradient(var(--ink) 0 1px,#0000 1px);
  background-size:6px 6px; background-position:50% 50%; opacity:.06 }
```
Zero requests. One 6px tile the GPU caches. Use `repeating-linear-gradient(45deg, var(--rule) 0 2px, transparent 2px 4px)` for any region marked unavailable, so the mark never relies on color alone.

---

### 3.19 — Broker / Employer segmented control. Score 4.8. Marketing only, above the H1.

Two segments. Never three. Three tabs above a headline looks like a settings screen. General agents read as Broker.

Real `role="radiogroup"` with two `<input type="radio">`, arrow-key operable, `aria-checked` reflected, copy swap announced via `aria-live="polite"`. Text substitution, not a route change. Persist to `localStorage`, read on next visit.

| | Broker | Employer |
|---|---|---|
| H1 | `What plans actually pay.` | `What your plan actually pays.` |
| Sub | `Federal Transparency in Coverage data. Same procedure, same state, 5.1x apart.` | `Federal Transparency in Coverage data. Compare your market against what you are billed.` |
| CTA | `Run a lookup` | `Run a lookup` |

Both H1 variants fit two lines at 36px in a 288px content column. Verified against the fold budget in §6.

Motion: none. The swap is instant.

---

### 3.20 — Single combined query input. Score 4.3. Marketing hero control + tool.

One `<input type="search">` with a visible `<label>`, `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, Up/Down/Enter/Escape all wired. Accepts three input shapes and disambiguates server-side: a 5-digit CPT (`70553`), plain language (`MRI brain`), a geography (`California`, `CA`, a ZIP). Suggestions grouped with `role="group"` and a visible group label. Debounce 140ms.

**The page arrives with a real result already populated** (70553, California). The tool is never empty on arrival, and that is also the honest demo ceiling: it works immediately, on real data, before signup, with a deliberate cap on distinct anonymous lookups.

Submit works keyboard-only, end to end. This is the one place JS is justified on the entry surface. Budget: 6KB.

---

### 3.21 — `timeline-scope` scroll spy. Score 4.0. Marketing, only if 3+ data sections.

```css
body{ timeline-scope:--s-mri,--s-knee,--s-visit }
#sec-mri{ view-timeline-name:--s-mri }
.dot--mri{ animation:act linear both; animation-timeline:--s-mri; animation-range:contain 0% contain 100% }
@keyframes act{ from,to{ opacity:.4; transform:scale(1) } 50%{ opacity:1; transform:scale(1.25) } }
```
Note the `from,to / 50%` shape: a scrubbed timeline has no direction, so "while active" must be a symmetric keyframe. Replaces 40 to 80 lines of IntersectionObserver plus a debounce. Skip on a short page.

---

### 3.22 — Chart / Table peer tabs, CSV, copy-citation. Score 3.3. Tool only.

`role="tablist"` with real roving tabindex and Left/Right arrow handling. Table view renders the **same server data** as a real `<table>`. Two distinct labeled export actions: CSV of the visible subset, CSV of the full market slice. Plus a copy-citation button writing a fixed string to the clipboard.

Every CSV and PDF carries the §3.7 provenance block in its header. PDF is generated **server-side** so it carries correct fonts and the provenance. No client-side canvas PNG export.

The broker did not come to look at our chart. He came to get something he can put in a client meeting. Tabs are cheap. **The export is the product.**

Add for long result sets, tool only:
```css
tbody.chunk{ content-visibility:auto; contain-intrinsic-size:auto 900px }  /* 25 rows x 36px, MEASURED */
```
Never `contain-intrinsic-size: auto` alone, or the scrollbar jumps and you manufacture the CLS you were avoiding. Confirm Ctrl+F still finds off-screen rows. A broker who cannot find-in-page a payer name concludes the table is incomplete, which is why JS virtualization is banned.

---

## 4. MOTION ALLOWLIST BY SURFACE

The direct answer: **a tool that animates while a broker reads a number is a bad tool, so the tool bundle contains no scroll-driven animation at all.** Not gated. Not reduced. Absent.

| Effect | Marketing | Tool | Note |
|---|---|---|---|
| `view()` reveal, 12px, max 6 | ✅ | ❌ | `.m` scope, marketing bundle only |
| Band `scaleX` disclosure | ✅ | ❌ | Tool renders the finished bar at first paint |
| `scroll(root block)` progress bar | ✅ if >3 screens | ❌ | |
| `scroll-state(stuck)` densification | ✅ nav | ✅ table header | No transition, discrete state change |
| Hover / focus / press, 120ms | ✅ | ✅ | `--ease`, transform and opacity only |
| Row expand, 180ms | ❌ | ✅ | One row at a time, transform-based |
| Panel / sheet enter, 240ms | ✅ | ✅ | `--ease-enter`, hard ceiling |
| `$---` loading pulse, 1400ms | ✅ | ✅ | Only while a query is in flight |
| Result arrival | n/a | **no transition** | `$---` → `$589` swaps instantly |
| Column sort | n/a | **no transition** | Rows re-render, never animate to position |
| Filter change | n/a | **no transition** | |
| Count-up on any figure | ❌ | ❌ | Rule 1 violation |
| Pinned scene | ❌ | ❌ | |
| Parallax | ❌ | ❌ | |
| Smooth-scroll library | ❌ | ❌ | Refused |
| Canvas / WebGL / video hero | ❌ | ❌ | |

Two sentences for the team: **On marketing, motion is allowed to introduce a number once, before it is read. Inside the tool, a number is never introduced, it is simply already there.**

---

## 5. CUT, WITH THE REASON

| Technique | Score | Why |
|---|---|---|
| Runtime procedural canvas hero | 3.75 | 10KB JS on the LCP path, needs a mobile kill switch and DPR clamping, and it suggests a distribution while the bars *are* one. Replaced by #10 at zero runtime. |
| 320vh pinned distribution stage | 2.86 | Three extra screens of scroll from a user with 90 seconds. `position: fixed` fights the iOS address bar. Same disclosure achieved by #3.1 in one screen. |
| Sticky stacking cards | 1.33 | ~100vh per card. Three cards is three screens for a "how it works" block. |
| Row density toggle | 1.50 | Post-launch, tool only. A control on a page with one table is decoration. Ship 44px and move on. |
| Parallax | 0.67 | Nobody has ever bought a data product because the background moved. Under text it is NN/g's measured worst case: altered scroll plus text to read. |
| Gradient-clipped headline | 0 | Free, and still wrong. A gradient headline on institutional financial data reads consumer. Our register is FRED and Palantir. |
| `@property` + `counter()` scrub | disqualified | Renders `$353` as the California median for 70553 mid-scroll. Cannot produce a thousands separator, so `$1,059` renders `$1,59`. |
| Scrubbed image sequence | 0 | 8 to 30MB, full decode before usable, blows the memory budget on mid-tier Android. No frame tells a broker anything `$258 vs $1,309` does not tell him faster. |
| WebGL / Three.js / particle field / neural graph | 0 | Grepped across 20 leading AI and data platform sites: **zero hits**. The category abandoned it. Shipping one in 2026 dates the product to 2021. |
| GSAP | escape hatch only | Not in the bundle. A lane that wants it must first demonstrate the CSS version failing, then load it dynamically behind `min-width: 768px`. |
| Lenis / smooth scroll | refused | Inertia applied to a person trying to find a number. NN/g measured that faster scroll caused *less* disorientation than slow. Some participants read it as a bug. |
| `scroll-snap-type: y mandatory` | 0 | A broker cannot stop scrolling where the row he cares about is. `proximity` or nothing. |
| Hero video | 0 | Modal's 8 videos: 16.1MB, LCP 3,072ms. At most one clip, below the fold, `preload="none"`, `poster`, `playsinline`, and it does not render at all unless the asset is verified present at build time. |
| Choropleth state map | 0 | Our own 51-state map has confirmed errors including a misgraded Georgia and a Texas citation that does not check out. It implies verified coverage and conveys meaning by hue alone. Only after per-state primary-source verification, with a pattern fill as well as a hue. |
| Card-ified mobile table | 0 | Destroys the only reason he opened it and forces him to hold numbers in working memory across screens. Pin column 1 instead. |
| JS virtualization | 0 | 8 to 15KB gz and it silently kills native Ctrl+F and native print. `content-visibility` instead. |
| Logo wall, testimonial carousel, fabricated dashboard shot | 0 | Rule 7. |
| Cookie panel over the hero | 0 | Measured burying the CTA on Turquoise Health and Isomorphic Labs. Ours is a bottom bar ≤64px that never overlaps the primary CTA. |
| `overflow-x: hidden` to suppress sideways drag | 0 | Hides the defect from every automated check while the page still drags under a real finger, and breaks every sticky on the page. Use `clip`, and fix the cause. |
| Awwwards payload norm | 0 | HEVA (SOTD) 66MB / 18.1s. Glyphic (SOTD) 16.8MB / 268 requests / mobile LCP 5,932ms. The two SOTD winners posted the worst mobile LCP in the entire corpus. For our user the award is a negative signal. |

---

## 6. THE 320 × 568 FOLD BUDGET

What is on screen with zero scroll, computed, in px:

| Block | Height | Gap |
|---|---|---|
| Header | 48 | 0 |
| Broker / Employer control | 36 | 16 |
| H1, 36px / 1.28, 2 lines | 92 | 12 |
| Sub, 14px / 1.45, 2 lines | 41 | 20 |
| Bar 1: micro-label 16, track 44, caption 16 | 76 | 16 |
| Bar 2: micro-label 16, track 44, caption 16 | 76 | 16 |
| Primary CTA | 44 | 16 |
| **Total** | **529** | leaves 39px of the next block visible |

At 320×568 the broker sees, without scrolling: who this is for, what it does, `$258 / $589 / $1,309` at 5.1x, `$93 / $115 / $149` at 1.6x, both on a shared $1,400 scale, `n = 313,579`, and a CTA. That is the entire proposition delivered in about four seconds with almost no copy.

Nothing above the fold animates except the two bands, once, on entry. The figures are painted immediately and never move.

---

## 7. VERIFICATION. A 200, a green deploy and a passing unit test are not evidence.

Run in a real browser, `channel: chrome`, headless, at **320 / 360 / 390 / 414 / 768 / 1024 / 1440 / 1920**:

1. `window.scrollTo(9999,0)` then read `window.scrollX`. Must be 0 at every width. Do not read `scrollWidth`.
2. `document.querySelectorAll('*').length` under budget (§2.6).
3. tnum assertion (§3.2), fails the build.
4. Computed `line-height` ratio on `h1` at 320 / 390 / 768 / 1440 matches 1.28 / 1.28 / 1.14 / 1.05. Read the computed value, never the declaration. A media query above a base rule loses on cascade order and is invisible to a grep.
5. Contrast gate over all pairs and every section remap.
6. CLS measured at **0.00** on throttled mobile, after `content-visibility` is added, not before.
7. Press every control: both radio segments by arrow key, the combobox by Up/Down/Enter/Escape, both tabs by Left/Right, both export buttons, the sticky column while scrolling the table sideways with a real touch drag.
8. Force all four `<Figure>` states in the gallery and screenshot each at 320px.
9. `prefers-reduced-motion: reduce` emulated: confirm every band, marker and reveal renders in its finished state, nothing is invisible, nothing is mid-flight.
10. Disable `animation-timeline` support (Firefox stable): confirm the same. Blank content here is the worst failure mode we can ship.
11. Look at the screenshots. An orphaned word, a control crushed to 95px, a band label that landed on the band fill. No assertion catches those.


# BRAND AND THEME SYSTEM

Verified every ratio by computation (sRGB relative luminance per WCAG 2.1) and every categorical hue by Machado 2009 CVD simulation with OKLab ΔE. Parent brand measured from the live repo, not assumed: `--teal:#0FB5A6` (OKLCH L 0.696 C 0.121 H 184.4), `--teal-deep:#0A8E83`, `--teal-cta:#077A70`, `--ink:#0A0B0C`.

---

# REDDENDA BROKER. THE VISUAL SYSTEM.

## 0. THREE DEFECTS FOUND WHILE COMPUTING THIS, FIXED HERE

| Defect | Measured | Fix |
|---|---|---|
| Technique library dark `--control:#5C6C6E` | **3.04:1** on dark paper, **2.44:1** on any elevated dark surface. Fails 1.4.11 the moment a control sits on a card. | `--control` dark becomes **`#6C7B7B`** (4.23 / 3.90 / 3.52 / 3.05 across all four dark layers). |
| Translucent header at 86% fill | Nav text in `--text-2` computes **4.20:1** over the worst-case content beneath. Fails AA. | Header film goes to **0.90**, nav text is **`--ink` only, never `--text-2`**, and every control inside the header carries an opaque `--paper` fill so its border is measured against paper, not against the film. |
| A naive `--text-3` sized on white | 4.61:1 on `#FFFFFF` but **4.33:1** on `--surface`. Passes the test you run, fails the surface it ships on. | `--text-3` is sized against `--surface-2` (the worst background it can legally sit on): **`#627070`** light, **`#8B999A`** dark. |

The lesson encoded into the gate in §2.6: **size every text token against the darkest surface it is permitted to sit on, not against paper.**

---

## 1. THEME DECISION

**Both. Light is canonical and is the default. Dark is a complete first-class theme. Neither is a toggle on a half-built palette.**

Ruling in one line: **the product's output is a document, so light is canonical. The product's use is a long session, so dark exists.**

| | Ruling |
|---|---|
| Marketing site | **Light only.** No toggle, no `prefers-color-scheme` switch. A broker forwards this URL to a client. The page must render identically in both people's browsers. |
| Tool (`app.*`) | **Both.** Default resolves from `prefers-color-scheme` on first visit, then a header toggle writes `localStorage['rb-theme'] = 'light'\|'dark'` and stamps `<html data-theme>`. `data-theme` wins over the media query in both directions. |
| Export path (PDF, CSV preview, print, `og:image`) | **Light, forced, always.** `@media print` hard-resets to the light token set. A dark PDF handed to a carrier rep is a defect. |
| Marketing dark data band (§3.16 of the technique library) | **Approved as a section-scoped remap, one section maximum, flagged for David.** Rule 5's light-only binds `reddenda.com`. This is a new domain. The token architecture ships either way; if unapproved, delete one class and nothing else changes. |

Why dark is not the default for insurance professionals. Three reasons, all specific:
1. **The artifact leaves the screen.** Screenshots into decks, PDFs into renewal binders, printouts into a client meeting. Light survives every one of those transitions. Dark survives none.
2. **The register is FRED and Addepar, not a terminal.** A dark default reads as "engineer built this for engineers." A broker is not the operator of a trading desk. He is holding a document.
3. **Daylight.** The stated device target is a phone between meetings, often in a car. Dark mode on an LCD in direct sun loses more than it gains.

Why dark ships anyway:
1. The tool is used in 40-minute sessions. Column-scanning a rate table on white at 11pm is a real cost.
2. Absence of a dark theme in 2026 reads as unfinished, which is the exact "gone next year" signal this audience scans for.
3. The dark palette is 22 token overrides on the same component set. It costs one stylesheet block, not a design.

---

## 2. COLOR

### 2.1 The sibling relationship, stated numerically

The broker product is not a recolor of Reddenda. It is the same family at a different volume.

| | Reddenda parent | Reddenda Broker | Delta |
|---|---|---|---|
| Brand hue (OKLCH) | 184.4 | **195.0** | +10.6 toward blue |
| Brand chroma | 0.121 | **0.069** | 43% drained |
| Brand lightness | 0.696 | **0.432** | 38% darker |
| Role of the brand color | Brand voice. Large fills, hero, buttons, wash. | **Instrument marking.** The median rule, the link, one button. Never a large fill. |
| The identity color | Teal | **Ink.** `#0B1415` is the brand. |
| Structural second hue | none | **`--info` marine `#2C4A7C`**, permanently and only the Medicare reference. |

The sibling is legible in three seconds: same teal family, drained of consumer brightness, demoted from voice to marking, and carrying one structural hue the parent does not have.

### 2.2 Accent ramp. Hue 195, chroma gamut-mapped in OKLCH.

| Token | Hex | OKLCH L / C | on `--paper` | on `--surface` | on dark canvas | Role |
|---|---|---|---|---|---|---|
| `--accent-50` | `#F4FAFA` | .980 / .006 | 1.06 | 1.01 | 17.68 | Selected row fill (light) |
| `--accent-100` | `#E6F3F3` | .955 / .014 | 1.14 | 1.07 | 16.41 | Badge fill, chip fill |
| `--accent-200` | `#CFE8E7` | .912 / .026 | 1.28 | 1.21 | 14.52 | `::selection` fill |
| `--accent-300` | `#A8D7D6` | .845 / .048 | 1.57 | 1.48 | 11.86 | Dark-theme sequence step 5 |
| `--accent-400` | `#70C1C1` | .760 / .080 | 2.08 | 1.96 | **8.97** | **Dark theme link, focus ring, primary text accent** |
| `--accent-500` | `#36A9A9` | .672 / .100 | 2.84 | 2.67 | **6.58** | **Dark theme primary button fill** |
| `--accent-600` | `#008D8D` | .582 / .099 | 4.04 | 3.80 | 4.61 | Non-text only in light. Chart stroke, 3:1 boundary |
| `--accent-700` | `#0A7373` | .505 / .084 | **5.66** | 5.32 | 3.30 | Secondary button border, hover fill wash edge |
| `--accent-800` | `#0F5C5C` | .432 / .069 | **7.76** | 7.29 | 2.40 | **Light theme accent. Link, median rule, primary button fill** |
| `--accent-900` | `#084646` | .360 / .058 | **10.63** | 9.99 | 1.75 | Primary button hover |
| `--accent-950` | `#053232` | .288 / .046 | **13.92** | 13.08 | 1.34 | Primary button press, link hover |
| `--accent-1000` | `#042121` | .225 / .034 | 16.87 | 15.86 | 1.11 | Label on `--accent-400` fill (8.10:1) |

### 2.3 Neutral ramp. Hue 200, teal-tinted greys. This is the family resemblance.

| Token | Hex | OKLCH L / C | on `--paper` |
|---|---|---|---|
| `--n-0` | `#FFFFFF` | 1.000 / 0 | 1.00 |
| `--n-25` | `#FAFBFB` | .988 / .0016 | 1.04 |
| `--n-50` | `#F7F8F8` | .978 / .0011 | 1.06 |
| `--n-100` | `#F0F2F2` | .960 / .0030 | 1.12 |
| `--n-200` | `#E4E7E7` | .926 / .0032 | 1.24 |
| `--n-300` | `#D2D7D7` | .875 / .0060 | 1.45 |
| `--n-400` | `#ADB6B7` | .770 / .0100 | 2.07 |
| `--n-500` | `#7E8A8A` | .624 / .0140 | **3.57** |
| `--n-550` | `#627070` | .532 / .0170 | **5.16** |
| `--n-600` | `#5A6A6B` | .512 / .0196 | **5.66** |
| `--n-700` | `#3E4E4F` | .410 / .0200 | 8.72 |
| `--n-750` | `#303F40` | .355 / .0190 | 11.04 |
| `--n-800` | `#243132` | .302 / .0178 | 13.46 |
| `--n-850` | `#121D1E` | .221 / .0161 | 17.21 |
| `--n-900` | `#0B1415` | .183 / .0140 | **18.66** |
| `--n-950` | `#050A0B` | .140 / .0110 | 19.91 |

**Reconciliation note for anyone diffing against the technique library.** Four values move by one hex digit so the whole ramp is generatable from a single hue: `#0B1416`→`#0B1415`, `#5A6A6C`→`#5A6A6B`, `#243133`→`#243132`, `#121D1F`→`#121D1E`. ΔE_ok < 0.003 in every case, imperceptible. `#F7F8F8`, `#E4E7E7`, `#7E8A8A` and `#0F5C5C` land on the ramp unchanged. This is a reconciliation, not a typo, and not a redesign.

### 2.4 Light theme semantic layer

```css
:root, [data-theme="light"]{
  /* backgrounds */
  --canvas:       #FFFFFF;   /* marketing page bg. tool shell overrides to #F7F8F8 */
  --paper:        #FFFFFF;   /* card, panel, table, modal, sticky cell */
  --surface:      #F7F8F8;   /* recessed: row hover, thead, code, input fill */
  --surface-2:    #F0F2F2;   /* double recessed: disabled fill, nested tile, track */

  /* borders */
  --rule:         #E4E7E7;   /* 1.24:1 DECORATIVE ONLY. never a control boundary */
  --rule-strong:  #D2D7D7;   /* 1.45:1 table outer frame, section divider */
  --control:      #7E8A8A;   /* 3.57:1 EVERY input, select, checkbox, button outline */
  --control-hover:#5A6A6B;   /* 5.66:1 */

  /* text */
  --ink:          #0B1415;   /* 18.66:1 AAA */
  --text-2:       #5A6A6B;   /*  5.66:1 AA  secondary prose, captions */
  --text-3:       #627070;   /*  5.16:1 AA  placeholder, n= labels, timestamps */
  --ink-invert:   #F2F5F5;   /* on dark toast / inverted chip */

  /* accent, aliased from the ramp */
  --accent:       #0F5C5C;   /* 7.76:1 */
  --accent-hover: #084646;   /* 10.63:1 */
  --accent-press: #053232;   /* 13.92:1 */
  --accent-fg:    #FFFFFF;   /* label on accent fill, 7.76:1 */
  --accent-wash:  #F4FAFA;
  --accent-tint:  #E6F3F3;
  --focus:        #0F5C5C;

  /* distribution */
  --band:         #DCE8E7;   /* p25 to p75 fill */
  --band-edge:    #C4D8D6;   /* 1px band boundary, prints on laser */
  --median:       #0F5C5C;   /* 2px rule */
  --ref:          #2C4A7C;   /* Medicare reference, 1px dashed */

  /* semantic. SYSTEM STATE ONLY. see the hard rule in 2.6 */
  --ok:           #1F6F38;   /* 6.20:1 */
  --ok-wash:      #E7F9EA;
  --caution:      #8A5A00;   /* 5.93:1 */
  --caution-wash: #FFF2E3;
  --danger:       #A32321;   /* 7.45:1 */
  --danger-wash:  #FFEDEB;
  --info:         #2C4A7C;   /* 8.83:1 */
  --info-wash:    #ECF3FF;
  --locked:       #5A6A6B;   /* 5.66:1. NOT a warning color */
  --locked-wash:  #F1F5F5;

  --scrim:        rgb(11 20 21 / .40);   /* composites to #9DA1A1 over paper */
  --shadow-rgb:   11 20 21;
}
```

### 2.5 Dark theme semantic layer

Same token names. Components never reference a ramp step directly.

```css
[data-theme="dark"]{
  --canvas:       #0B1415;
  --paper:        #121D1E;
  --surface:      #1A2627;
  --surface-2:    #243132;

  --rule:         #243132;
  --rule-strong:  #303F40;
  --control:      #6C7B7B;   /* 4.23:1 on canvas, 3.05:1 on surface-2. CORRECTED */
  --control-hover:#8B999A;

  --ink:          #F2F5F5;   /* 17.02:1 on canvas */
  --text-2:       #9BAAAB;   /*  7.76:1 */
  --text-3:       #8B999A;   /*  6.33:1 */
  --ink-invert:   #0B1415;

  --accent:       #70C1C1;   /*  8.97:1 link and text accent */
  --accent-hover: #A8D7D6;   /* 11.86:1 */
  --accent-press: #36A9A9;
  --accent-fg:    #042121;   /* label on --accent-400 fill, 8.10:1 */
  --accent-wash:  #112928;   /* selected row */
  --accent-tint:  #163333;
  --focus:        #70C1C1;

  --band:         #163333;   /* --ink on it 12.31:1, --accent on it 6.48:1 */
  --band-edge:    #234644;
  --median:       #70C1C1;
  --ref:          #8CB2F1;

  --ok:           #79D28D;   /* 10.15:1 */  --ok-wash:      #162B1B;
  --caution:      #F4B359;   /* 10.17:1 */  --caution-wash: #34230B;
  --danger:       #F47C70;   /*  7.08:1 */  --danger-wash:  #381C19;
  --info:         #8CB2F1;   /*  8.67:1 */  --info-wash:    #1A2539;
  --locked:       #9BAAAB;   /*  7.76:1 */  --locked-wash:  #1B2222;

  --scrim:        rgb(4 8 9 / .64);
  --shadow-rgb:   0 0 0;
}
```

### 2.6 Hard color rules. Each one is a computed ban, not a preference.

| Rule | The measurement that forces it |
|---|---|
| **Color never encodes good or bad on a price.** A low rate is good for the employer and bad for the provider. Same number, opposite meaning. `--ok` / `--caution` / `--danger` are for system state only: export succeeded, validation failed, source is stale. A rate is never green and never red. | Design ruling. The alternative ships a chart that lies to half the audience. |
| **`--text-2` is banned on `--band`.** | 4.51:1. Clears 4.5 by 0.01 and dies the instant anyone nudges the tint. |
| **`--text-3` is banned on `--band`.** | 4.11:1. Fails outright. |
| **`--accent-700` is banned on `--band`.** | 4.51:1. Same knife edge. Use `--accent-800` (6.19) or `--accent-900` (8.48). |
| **No control may sit on `--band`.** | `--control` on band is 2.84:1. Below the 3:1 non-text floor. |
| **`--rule` is never a control boundary.** | 1.24:1. It is decoration. Controls take `--control`. |
| **Band labels are `--ink` only.** | Only `--ink` (14.88) and `--accent-800` (6.19) and `--info` (7.04) survive on the band. |
| **Never hue alone.** Every colored mark carries a printed string and a pattern token. `186% of Medicare` is printed text next to the mark, never inferred from the mark's color. | WCAG 1.4.1. |
| **Unavailable regions get a pattern, not a tint.** `repeating-linear-gradient(45deg, var(--rule) 0 2px, transparent 2px 4px)` plus the words. | 1.4.1 again. |

### 2.7 Data palette. Two palettes, and knowing which one you are in is the whole discipline.

**The rule: if the series are the same kind of thing, use the SEQUENCE. If they are different kinds of thing, use the CATEGORICAL. Never mix.**

Five payers are the same kind of thing. Observed rate vs Medicare reference vs billed charge are not.

**SEQUENCE (payer comparison, ordered, max 5).** One hue, monotonic lightness. CVD-proof by construction because only lightness carries meaning.

| Step | Light | on paper | Dark | on canvas |
|---|---|---|---|---|
| `--seq-1` | `#053232` | 13.92 | `#008181` | 3.96 |
| `--seq-2` | `#084646` | 10.63 | `#209A9A` | 5.47 |
| `--seq-3` | `#0F5C5C` | 7.76 | `#43B3B3` | 7.41 |
| `--seq-4` | `#0A7373` | 5.66 | `#80C8C7` | 9.78 |
| `--seq-5` | `#008D8D` | 4.04 | `#B4DCDB` | 12.62 |

Adjacent OKLab ΔE is 0.071 and holds at 0.071 to 0.074 under all three CVD types (lightness is the only channel, so CVD cannot degrade it). That is below the 0.10 legend-picking threshold and **sufficient here only because the bars are adjacent, ordered, share edges, and every series carries a direct inline label.** Hard consequence: **the sequence palette may never be legend-keyed.** Label every bar in place or use the categorical palette.

**CATEGORICAL (different kinds of thing, hard cap 5).** Lightness ladder plus a blue/orange axis, which is the only hue axis that survives protanopia and deuteranopia.

| Token | Light | on paper | Dark | on canvas | Pattern (mandatory, never hue alone) |
|---|---|---|---|---|---|
| `--cat-1` | `#0C2B69` | 13.42 | `#4B70B4` | 3.80 | solid |
| `--cat-2` | `#742706` | 10.32 | `#C26E50` | 5.01 | 45deg hatch, 2px on 4px |
| `--cat-3` | `#0D6565` | 6.85 | `#38B3B3` | 7.35 | 1.5px dot grid on 5px |
| `--cat-4` | `#866900` | 5.21 | `#D2B259` | 9.11 | 135deg hatch, 2px on 4px |
| `--cat-5` | `#1B8FBB` | 3.69 | `#8CDAFF` | 12.08 | horizontal rule, 1px on 4px |

**Verified colorblind safety, Machado 2009 severity 1.0, OKLab ΔE of the worst pair in the set:**

| Vision | Light worst pair | ΔE | Dark worst pair | ΔE |
|---|---|---|---|---|
| Normal | cat-3 / cat-5 | 0.165 | cat-3 / cat-5 | 0.161 |
| Protanopia | cat-3 / cat-4 | **0.120** | cat-3 / cat-4 | **0.133** |
| Deuteranopia | cat-2 / cat-3 | **0.124** | cat-2 / cat-3 | **0.132** |
| Tritanopia | cat-1 / cat-3 | **0.151** | cat-3 / cat-5 | **0.136** |

Pass bar is ΔE ≥ 0.10. Every pair clears it in every vision type in both themes.

`--cat-5` at 3.69:1 clears the 3:1 graphical floor but not 4.5:1 for text. **Series labels are always `--ink`, never the series color.** That rule is already forced by the band bans, so it is one rule, not two.

**Above 5 series the chart type changes, not the palette.** Six or more payers renders as small multiples: one bar per payer, stacked vertically, all in `--accent-800`, each with its own printed label and `n`. A seventh hue does not exist and will not be invented.

```css
.pat-2{ background-image:repeating-linear-gradient(45deg, rgb(255 255 255 /.28) 0 2px, transparent 2px 4px) }
.pat-3{ background-image:radial-gradient(rgb(255 255 255 /.32) 0 1.5px, transparent 1.5px); background-size:5px 5px }
.pat-4{ background-image:repeating-linear-gradient(135deg, rgb(255 255 255 /.28) 0 2px, transparent 2px 4px) }
.pat-5{ background-image:repeating-linear-gradient(0deg, rgb(255 255 255 /.30) 0 1px, transparent 1px 4px) }
[data-theme="dark"] .pat-2,[data-theme="dark"] .pat-3,
[data-theme="dark"] .pat-4,[data-theme="dark"] .pat-5{ --pat:rgb(4 8 9 /.34) }
```

### 2.8 Full contrast matrices. Every value computed, none eyeballed.

**LIGHT**

| Token | `--paper` #FFFFFF | `--surface` #F7F8F8 | `--surface-2` #F0F2F2 | `--band` #DCE8E7 |
|---|---|---|---|---|
| `--ink` #0B1415 | **18.66** AAA | 17.54 | 16.61 | 14.88 |
| `--text-2` #5A6A6B | **5.66** AA | 5.32 | 5.04 | 4.51 BANNED |
| `--text-3` #627070 | **5.16** AA | 4.85 | 4.59 | 4.11 BANNED |
| `--accent` #0F5C5C | **7.76** AAA | 7.29 | 6.91 | 6.19 |
| `--accent-700` #0A7373 | 5.66 | 5.32 | 5.03 | 4.51 BANNED |
| `--info` #2C4A7C | **8.83** AAA | 8.30 | 7.86 | 7.04 |
| `--caution` #8A5A00 | **5.93** AA | 5.57 | 5.27 | 4.72 |
| `--danger` #A32321 | **7.45** AAA | 7.00 | 6.63 | 5.94 |
| `--ok` #1F6F38 | **6.20** AA | 5.82 | 5.51 | 4.94 |
| `--control` #7E8A8A | 3.57 non-text | 3.35 | 3.17 | 2.84 BANNED |

**DARK**

| Token | `--canvas` #0B1415 | `--paper` #121D1E | `--surface` #1A2627 | `--surface-2` #243132 | `--band` #163333 |
|---|---|---|---|---|---|
| `--ink` #F2F5F5 | **17.02** AAA | 15.70 | 14.18 | 12.28 | 12.31 |
| `--text-2` #9BAAAB | **7.76** AAA | 7.16 | 6.47 | 5.60 | 5.61 |
| `--text-3` #8B999A | **6.33** AA | 5.84 | 5.27 | 4.56 | 4.58 |
| `--accent` #70C1C1 | **8.97** AAA | 8.27 | 7.47 | 6.46 | 6.48 |
| `--accent-500` #36A9A9 | 6.58 | 6.07 | 5.48 | 4.75 | 4.76 |
| `--info` #8CB2F1 | **8.67** AAA | 7.99 | 7.22 | 6.25 | 6.27 |
| `--caution` #F4B359 | **10.17** AAA | 9.37 | 8.47 | 7.33 | 7.35 |
| `--danger` #F47C70 | **7.08** AAA | 6.53 | 5.90 | 5.10 | 5.12 |
| `--ok` #79D28D | **10.15** AAA | 9.36 | 8.45 | 7.32 | 7.34 |
| `--control` #6C7B7B | 4.23 non-text | 3.90 | 3.52 | 3.05 | 3.06 |

**Wash pairs.** `--caution` on `--caution-wash` 5.38. `--danger` on `--danger-wash` 6.58. `--ok` on `--ok-wash` 5.65. `--info` on `--info-wash` 7.92. `--locked` on `--locked-wash` 5.16. `--ink` on any wash ≥ 16.49. Dark: `--ink` on any dark wash ≥ 13.73.

**Button fills.** `--accent-fg` on `--accent` 7.76. on hover 10.63. on press 13.92. Dark: `#0B1415` on `#36A9A9` 6.58, on `#70C1C1` 8.97, `#042121` on `#70C1C1` 8.10. `#FFFFFF` on `--danger` 7.45. `#0B1415` on dark `--danger` 7.08.

**Disabled.** `--n-500` #7E8A8A on `--surface-2` #F0F2F2 = **3.17**. WCAG exempts disabled controls from 1.4.3; we hold a self-imposed 3:1 floor anyway. `opacity` on a disabled control is banned because it stacks unpredictably on nested fills.

### 2.9 CI contrast gate. Fails the build, does not warn.

```js
const PAIRS = [
  ['--ink','--paper',7.0],      ['--ink','--surface-2',7.0],   ['--ink','--band',7.0],
  ['--text-2','--paper',4.5],   ['--text-2','--surface-2',4.5],
  ['--text-3','--paper',4.5],   ['--text-3','--surface-2',4.5],
  ['--accent','--paper',4.5],   ['--accent','--surface-2',4.5], ['--accent','--band',4.5],
  ['--accent-fg','--accent',4.5],
  ['--control','--paper',3.0],  ['--control','--surface-2',3.0],
  ['--focus','--paper',3.0],
  ['--ok','--paper',4.5], ['--caution','--paper',4.5], ['--danger','--paper',4.5],
  ['--info','--paper',4.5], ['--locked','--paper',4.5],
  ['--ok','--ok-wash',4.5], ['--caution','--caution-wash',4.5],
  ['--danger','--danger-wash',4.5], ['--info','--info-wash',4.5],
];
// Run for [data-theme=light], [data-theme=dark], every section-scoped remap,
// AND the composited header film. An accent that passes on white will not pass on near-black.
const BANNED = [['--text-2','--band'],['--text-3','--band'],['--control','--band'],['--accent-700','--band']];
```

Plus the CVD gate: simulate the 5 categorical tokens under protan, deutan and tritan, assert the minimum pairwise OKLab ΔE ≥ 0.10 in every vision type in every theme.

---

## 3. MENU AND NAV. EVERY STATE, BOTH THEMES.

Header height **56px** below 768, **64px** at 768 and above. The tool header is **56px constant** because a rate table wants the vertical space. Height never animates. Densification is the table header's job, not the site header's.

### 3.1 The two-layer header. Why the fill lives on a pseudo-element.

Background-color is a paint property, and the brief allows transform and opacity only. So the fill and the border ride a pseudo-element and only its **opacity** transitions. That is compliant, it is smooth, and it costs one compositor layer that `position:sticky` already required.

```css
.hdr{ position:sticky; top:0; z-index:50; block-size:56px; container-type:scroll-state;
      isolation:isolate }
@media (min-width:768px){ .hdr{ block-size:64px } }

.hdr::before{ content:""; position:absolute; inset:0; z-index:-1;
  background:var(--hdr-fill);
  border-block-end:1px solid var(--hdr-rule);
  opacity:0; transition:opacity var(--d-fast) var(--ease) }

@container scroll-state(stuck: top){
  .hdr::before{ opacity:1; backdrop-filter:blur(14px) saturate(180%);
                -webkit-backdrop-filter:blur(14px) saturate(180%) }
}
/* backdrop-filter is applied ONLY in the stuck state. Never leave a blur on an
   opacity:0 layer: the filter still costs a full-strip readback every frame. */

@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  @container scroll-state(stuck: top){ .hdr::before{ background:var(--hdr-fill-solid) } }
}
/* Chrome/Edge 133+ only. Fallback: header still sticks, fill never appears.
   That is acceptable because the page beneath is --canvas and the nav text is --ink. */
```

### 3.2 Header token table

| Token | Light | Dark | Note |
|---|---|---|---|
| `--hdr-fill` (scrolled) | `rgb(255 255 255 / .90)` | `rgb(11 20 21 / .90)` | 0.90, not 0.86. At 0.86 the composited worst case put nav text at 4.20:1. |
| `--hdr-fill-solid` (no backdrop-filter) | `#FFFFFF` | `#0B1415` | |
| Blur | `blur(14px) saturate(180%)` | `blur(16px) saturate(160%)` | Dark gets more blur because dark content beneath shows more structure. |
| `--hdr-rule` at rest | `transparent` | `transparent` | |
| `--hdr-rule` scrolled | `#E4E7E7` | `#243132` | 1px. Not a shadow. A shadow under a sticky bar repaints every scroll frame on iOS. |
| Header shadow scrolled | `0 1px 0 rgb(11 20 21 / .06)` | `none` | Optional. Dark gets none; the rule is enough. |
| Worst-case composited fill | `#E7E8E8` | `#232B2C` | Header film over the darkest / lightest possible content beneath. |

### 3.3 Nav item states. Every value.

| State | Light | Dark | Ratio on worst-case header |
|---|---|---|---|
| Link rest | `--ink` `#0B1415`, 15px/20px, weight **500**, `ls -0.01em` | `#F2F5F5` weight 500 | **15.20** / **13.18** |
| Link hover | color `#0F5C5C`, plus `box-shadow: inset 0 -1px 0 currentColor` | `#70C1C1` | **6.32** / **6.94** |
| Link focus-visible | rest color, `outline:2px solid var(--focus); outline-offset:3px; border-radius:4px` | same | ring 6.32 / 6.94 |
| Link active (current page) | `--ink` weight **600**, `box-shadow: inset 0 -2px 0 var(--accent)`, `aria-current="page"` | same, `--accent` = `#70C1C1` | 15.20 / 13.18 |
| Link pressed | color `#053232` | `#36A9A9` | |
| Link disabled | not shipped. A nav item that cannot be used is removed, not greyed. | | |

**`--text-2` is banned in the header.** Nav text is `--ink` at weight 500 and inactive-versus-active is carried by weight and underline, never by lightness. This is the fix for the 4.20:1 defect and it also reads more institutional: a nav where half the items are faded reads as a settings screen.

**Every control inside the header carries `background: var(--paper)` opaque**, so its 3:1 border contrast is computed against paper. On the translucent film `--control` measures 2.90:1 and fails.

### 3.4 Header CTA button

| State | Light | Dark |
|---|---|---|
| Fill | `#0F5C5C` | `#36A9A9` |
| Label | `#FFFFFF` (7.76) | `#0B1415` (6.58) |
| Border | none | none |
| Hover | fill `#084646` (10.63) | fill `#70C1C1` (8.97) |
| Press | fill `#053232` (13.92) | fill `#209A9A` |
| Focus-visible | `box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--focus)` | same |
| Height / padding / radius | 36px header size, `0 14px`, `--r-ctl` 6px | same |
| Transition | `opacity` on a `::after` overlay only, `--d-fast` 120ms. **No color transition.** | same |

Hover is implemented as an overlay so it stays on the compositor:
```css
.btn-primary{ position:relative; background:var(--accent); color:var(--accent-fg) }
.btn-primary::after{ content:""; position:absolute; inset:0; border-radius:inherit;
  background:var(--accent-hover); opacity:0; transition:opacity var(--d-fast) var(--ease) }
.btn-primary:hover::after{ opacity:1 }
.btn-primary:active::after{ opacity:1; background:var(--accent-press) }
.btn-primary > *{ position:relative; z-index:1 }
```

### 3.5 Mobile menu overlay

| Property | Light | Dark |
|---|---|---|
| Sheet background | `#FFFFFF` **fully opaque** | `#121D1E` fully opaque |
| Sheet inset | `top:56px; left:0; right:0; bottom:0` (full-bleed below the header) | same |
| Scrim | `rgb(11 20 21 / .40)` on the page behind, only if the sheet is not full-bleed | `rgb(4 8 9 / .64)` |
| Sheet top border | `1px solid #E4E7E7` | `1px solid #243132` |
| Item height | **56px** (exceeds the 44px tap floor; thumb reach on a phone) | same |
| Item divider | `1px solid var(--rule)`, inset 0 | same |
| Item text | `--ink`, 17px/24px, weight 500 | `--ink` |
| Item pressed | `background: var(--surface)` | `background: var(--surface)` |
| Item active | `--ink` weight 600, 3px `--accent` left bar, `aria-current="page"` | same |
| Enter motion | `transform: translateY(-8px) → none` + `opacity 0 → 1`, **240ms** `--ease-enter` | same |
| Exit motion | reverse, **180ms** `--ease` | same |
| Backdrop blur | **none.** An opaque sheet needs no blur, and a blur over a full viewport is the most expensive thing on a mid-tier Android. | none |

Behavior, all mandatory: `inert` on `<main>` and `<footer>` while open. Focus moves to the first item on open and returns to the trigger on close. `Escape` closes. `aria-expanded` on the trigger. `overflow:hidden` on `<html>` with `scrollbar-gutter:stable` so the page does not shift 15px sideways when the scrollbar disappears. The CTA is pinned to the sheet bottom with `padding-bottom: max(16px, env(safe-area-inset-bottom))`.

---

## 4. TYPOGRAPHY

### 4.1 The faces, with licensing status stated exactly

| Role | Face | Version | Licence | Cost | Delivery |
|---|---|---|---|---|---|
| Sans (display + text) | **Inter Variable** by Rasmus Andersson | 4.1 | **SIL Open Font License 1.1** | Free, commercial use permitted, self-hosting permitted, attribution not required in UI | Self-hosted `woff2`, one file, latin subset, weight axis 100 to 900. **~104KB** |
| Mono (figures, codes, labels) | **System stack**: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | n/a | **No licence required** | **0 bytes** | Resolves to SF Mono (Apple), Cascadia Mono or Consolas (Windows), Liberation or DejaVu Mono (Linux) |
| Serif | **CUT** | | | | Bevel Health took an Awwwards Honorable Mention on `system-ui` at 80px/1.0/600. A serif display over a mono data layer is one register too many, and it spends LCP budget to prove nothing. |

**Total font budget: 104KB, one request, one third-party origin (zero).** No Google Fonts, no Adobe Fonts, no CDN. The measured split in the research is unambiguous: fast sites ship 4 font files, slow ones ship 12 plus a third-party origin.

**Named paid upgrade path, only if a 1440 review on Windows rejects the system mono.** In preference order: **Geist Mono** (Vercel, SIL OFL 1.1, free, variable), **IBM Plex Mono** (SIL OFL 1.1, free), **JetBrains Mono** (SIL OFL 1.1, free), then commercial: **Söhne Mono** (Klim Type Foundry) or **ABC Diatype Mono** (Dinamo), both requiring a purchased web licence per style per domain priced by pageview tier. Do not quote a price from memory; get a quote.

**Budget honesty note.** The technique library's 110KB cap assumed mono at zero bytes. The moment a webfont mono is added the cap must be restated in writing to 128KB, not quietly breached. That restatement is a decision, not a rounding error.

### 4.2 Font loading

```css
@font-face{
  font-family:"Inter var";
  src:url(/f/inter-var-latin.woff2) format("woff2");
  font-weight:100 900; font-style:normal; font-display:swap;
  unicode-range:U+0000-00FF,U+2000-206F,U+2212,U+2013,U+2022,U+00B7;
}
/* Metric-matched fallback. CLS 0.00 measured on throttled mobile. */
@font-face{
  font-family:"Inter Fallback";
  src:local("Helvetica Neue"),local("Arial");
  size-adjust:107%; ascent-override:90%; descent-override:22.43%; line-gap-override:0%;
}
```
```html
<link rel="preload" as="font" type="font/woff2" href="/f/inter-var-latin.woff2" crossorigin>
```

**Mono metric normalisation across platforms, at zero bytes.** Consolas is roughly 6% wider than SF Mono at the same px, which throws a table column off on Windows. Fix with `local()`-only faces at different `size-adjust`. CSS font matching takes the **last** declared rule whose `src` resolves, so declare in reverse preference order:

```css
@font-face{font-family:"Mono UI";src:local("Liberation Mono");size-adjust:102%}
@font-face{font-family:"Mono UI";src:local("Consolas");size-adjust:94%}
@font-face{font-family:"Mono UI";src:local("Menlo");size-adjust:98%}
@font-face{font-family:"Mono UI";src:local("SF Mono"),local("SFMono-Regular");size-adjust:100%}
```
**Verify, do not assume.** Render `0000000000` in `--mono` at 15px on macOS, Windows and Linux and assert `getBoundingClientRect().width` lands within 1px of 108px. If an engine refuses the fall-through, drop `size-adjust` and buy Geist Mono. Do not ship the theory.

```css
:root{
  --sans:"Inter var","Inter Fallback",system-ui,-apple-system,"Segoe UI",sans-serif;
  --mono:"Mono UI",ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;
}
```

### 4.3 The register law, in one line for the team

**Mono means machine-produced fact. Sans means editorial claim.**

| Content | Face | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| The ratio `5.1x` | sans | `--fs-ratio` | 600 | 1.0 | `--ls-ratio` |
| Display dollar `$589` | sans | `--fs-ratio` | 600 | 1.0 | `--ls-ratio` |
| CPT code, NPI, plan ID, payer ID | mono | 15px | 500 | 20px | 0 |
| Table cell figures | mono | 15px | 500 | 20px | 0 |
| `n = 313,579` | mono | 12px | 400 | 16px | 0 |
| Micro-labels `PAYER` `P25` `MEDIAN` `OBSERVATIONS` | mono, uppercase | 12px / **11px at ≥768** | 500 | 16px | **+0.08em** |
| `as of`, reporting month | mono | 12px | 400 | 16px | 0 |
| Body prose | sans | 16px | 400 | 24px | -0.02em |

Micro-labels get **smaller** on desktop, not larger. That is the inverse of the usual instinct and it is correct for reading distance. Uppercase without positive tracking reads as a wall; +0.08em is not a preference.

### 4.4 Full type scale. Every step, every breakpoint.

| Step | 320 to 767 | 768 to 1199 | 1200+ | Weight | Face | Use |
|---|---|---|---|---|---|---|
| `--fs-d1` | **36 / 1.28 / -0.012em** | 52 / 1.14 / -0.022em | 64 / 1.05 / -0.030em | 600 | sans | H1, one per page |
| `--fs-ratio` | **44 / 1.00 / -0.024em** | 60 / 1.00 / -0.026em | 72 / 1.00 / -0.028em | 600 | sans | The hero figure, the spread ratio |
| `--fs-h2` | **24 / 1.25 / -0.018em** | 30 / 1.25 / -0.018em | 34 / 1.25 / -0.018em | 600 | sans | Section head |
| `--fs-h3` | **19 / 1.35 / -0.014em** | 20 / 1.35 / -0.014em | 22 / 1.32 / -0.014em | 600 | sans | Card head |
| `--fs-h4` | **16 / 1.40 / -0.010em** | 16 / 1.40 | 17 / 1.40 | 600 | sans | Tile head, table caption |
| `--fs-lead` | **17 / 1.50 / -0.015em** | 18 / 1.50 | 19 / 1.50 | 400 | sans | Hero sub, one per page |
| `--fs-body` | **16 / 1.50 / -0.02em** | 16 / 1.50 | 16 / 1.50 | 400 | sans | Prose. **Hard floor. Never smaller.** |
| `--fs-sm` | **14 / 1.45 / -0.01em** | 14 / 1.45 | 14 / 1.45 | 400 | sans | Captions, helper text, footnotes |
| `--fs-btn` | **15 / 20px / -0.01em** | same | same | 600 | sans | Button label |
| `--fs-input` | **16 / 24px / -0.01em** | 15 / 22px | 15 / 22px | 400 | sans | **16px below 768 is mandatory or iOS Safari zooms the viewport on focus.** |
| `--fs-mono` | **15 / 20px / 0** | same | same | 500 | mono | Figures, codes, table cells |
| `--fs-mono-sm` | **13 / 18px / 0** | same | same | 500 | mono | Dense table variant |
| `--fs-n` | **12 / 16px / 0** | same | same | 400 | mono | `n =` and `as of` |
| `--fs-micro` | **12 / 16px / +0.08em** | 11 / 16px / +0.08em | 11 / 16px / +0.08em | 500 | mono | Uppercase micro-labels |

**Hard floors.** Prose never below 16px / 1.5. **No weight below 500 on any number, ever.** No weight below 400 anywhere. No 200 or 300 weight below 32px. A thin stroke on a reimbursement figure on a phone in a car park is an accessibility failure, not a look.

### 4.5 Tracking law. One rule, nobody eyeballs tracking again.

```css
h1,h2,h3,h4,h5,p,li,body,button,label{ letter-spacing:-0.02em }
.micro{ letter-spacing:0.08em; text-transform:uppercase; font-family:var(--mono) }
.num,.cpt,.n,td,th,input,.mono{ letter-spacing:0 }
```
Plus the per-step display overrides above. Vercel's entire computed scale divides out to exactly -0.02em, so this is a decision, not a taste.

### 4.6 Tabular numerals. Applied by meaning, not by element.

```css
.num,.stat,.cpt,.n,.fig,td.num,th.num,input[inputmode="numeric"],.tnum{
  font-variant-numeric: tabular-nums lining-nums slashed-zero;
  font-feature-settings:"tnum" 1,"lnum" 1,"zero" 1;
  letter-spacing:0;
  font-variant-ligatures:none;
}
td.num,th.num{ text-align:right }
.num .cur{ font-size:.82em; color:var(--text-3); margin-inline-end:.08em }
```

**Never set this on `body`.** Prose keeps proportional figures, or "2026" in a sentence looks stamped.

The CSV and the server-rendered PDF get the same treatment: the PDF renderer must embed Inter with `tnum` and `zero` on, and the CSV must be written with no thousands separators inside quoted fields so Excel does not coerce `1,309` into text.

**CI assertion, fails the build:**
```js
const w = s => { const e=document.createElement('span'); e.className='num';
  e.style.cssText='position:absolute;visibility:hidden;white-space:pre;font:500 15px var(--mono)';
  e.textContent=s; document.body.append(e);
  const r=e.getBoundingClientRect().width; e.remove(); return r; };
if (Math.abs(w('111111') - w('000000')) > 0.01) throw new Error('tnum not active');
if (Math.abs(w('$1,309') - w('$1,111')) > 0.01) throw new Error('tnum not active on currency');
```
Visual check: stack `$1,309` over `$93` in a two-row table. The comma and the 9 must sit on the same x.

---

## 5. SPACING, RADII, ELEVATION, BORDERS

### 5.1 Space. 4px half-step, 8px base, discrete per-breakpoint tokens.

```css
:root{
  --s1:4px;  --s2:8px;  --s3:12px; --s4:16px; --s5:24px;
  --s6:32px; --s7:48px; --s8:64px; --s9:96px; --s10:128px;
  --tap:44px;
  --gutter:16px; --section-y:56px; --pad-card:16px; --pad-tile:12px;
  --content-max:1200px; --table-max:1600px; --measure:68ch;
}
@media (min-width:768px){  :root{ --gutter:24px; --section-y:96px;  --pad-card:20px; --pad-tile:16px } }
@media (min-width:1200px){ :root{ --gutter:32px; --section-y:128px; --pad-card:24px; --pad-tile:20px } }
```

**No `clamp()` on anything that must land on the grid.** `clamp()` will hand you 37.4px and silently break the rhythm. It is permitted on `--fs-d1` and `--fs-ratio` only, and even there the discrete tokens above are preferred because the computed line-height must be assertable at four exact widths.

**Section rhythm is 56 / 96 / 128, not 96 / 128 / 160.** We optimise facts per screen, not air. Density is the trust signal for this audience.

### 5.2 Radii

```css
:root{
  --r-xs:2px;    /* badge inside a tile, inner-of-inner */
  --r-sm:4px;    /* chip, tag, focus-ring corner */
  --r-ctl:6px;   /* EVERY button, input, select, segmented control */
  --r-track:3px; /* the distribution track. deliberately tighter than a control */
  --r-md:8px;    /* stat tile, toast, tooltip */
  --r-card:12px; /* 14px at 768, 16px at 1200 */
  --r-modal:14px;/* 16px at 768 */
  --r-pill:999px;
}
@media (min-width:768px){  :root{ --r-card:14px; --r-modal:16px } }
@media (min-width:1200px){ :root{ --r-card:16px } }
--r-inner: max(2px, calc(var(--r-card) - var(--pad-card)));
```

**Nesting law: `inner = max(2px, outer - padding)`.** At card scale that resolves to 2px, which is correct and looks deliberate. Where it actually bites is badge-inside-tile: tile radius 8, tile padding 6, badge radius 2.

**Pills are banned on anything that performs an action.** `--r-pill` is permitted only on a removable filter chip and a status badge. A pill primary button reads consumer.

### 5.3 Elevation. In light theme, elevation is a border. Shadows are for things that genuinely float.

```css
:root{
  --e0: none;                                    /* default. use --rule */
  --e1: 0 1px 0 rgb(var(--shadow-rgb) / .14);    /* stuck table header, stuck site header */
  --e2: 0 1px 2px rgb(var(--shadow-rgb) / .06),
        0 8px 16px -4px rgb(var(--shadow-rgb) / .10);   /* dropdown, combobox listbox, popover */
  --e3: 0 2px 4px rgb(var(--shadow-rgb) / .06),
        0 24px 48px -12px rgb(var(--shadow-rgb) / .22); /* modal, mobile sheet */
  --e4: 0 1px 2px rgb(var(--shadow-rgb) / .08),
        0 12px 24px -8px rgb(var(--shadow-rgb) / .18);  /* toast */
}
```

**Dark theme: shadows do almost nothing on near-black. Elevation is a lightness step plus a top highlight.**
```css
[data-theme="dark"]{
  --e2: 0 8px 24px -8px rgb(0 0 0 / .60), inset 0 1px 0 rgb(255 255 255 / .06);
  --e3: 0 24px 64px -16px rgb(0 0 0 / .72), inset 0 1px 0 rgb(255 255 255 / .07);
  --e4: 0 12px 32px -12px rgb(0 0 0 / .66), inset 0 1px 0 rgb(255 255 255 / .06);
}
```
Surfaces step `--canvas #0B1415` → `--paper #121D1E` → `--surface #1A2627` → `--surface-2 #243132`. That is the elevation.

**Never a `box-shadow` on a sticky element.** It repaints every scroll frame on iOS. The sticky first column takes `border-inline-end: 1px solid var(--rule)`. The stuck header takes `--e1`, which is a single 1px hard edge and compiles to the same cost as a border.

### 5.4 Borders

```css
:root{
  --bw-hair:1px;   /* every card, table cell, divider */
  --bw-ctl:1px;    /* input, select, secondary button */
  --bw-focus:2px;  /* focus ring */
  --bw-emph:2px;   /* active tab underline, selected row left bar */
  --bw-median:2px; /* the median rule on the distribution track */
  --bw-ref:1px;    /* Medicare reference, dashed 3 3 */
}
```
Hairlines use `1px solid var(--rule)` in light, `1px solid var(--rule)` in dark. Where a hairline must survive an arbitrary surface, use `1px solid color-mix(in oklch, var(--ink) 8%, transparent)`.

**Cards share edges.** Adjacent cards use `margin-inline-start:-1px` so the hairlines form one continuous lattice rather than a set of floating boxes. A grid is what a fee schedule actually is. Exactly **one** element is permitted to break the frame: the distribution bar crossing from the stat card into the explanation card. Its container must not carry `overflow:hidden`.

### 5.5 Motion ladder

```css
:root{
  --d-fast:120ms;  /* hover, focus, press, checkbox */
  --d-base:180ms;  /* row expand, chip toggle, tab change */
  --d-slow:240ms;  /* panel and sheet enter. HARD CEILING */
  --ease:cubic-bezier(.2,0,0,1);
  --ease-enter:cubic-bezier(.32,.72,0,1);
}
:focus-visible{ outline:var(--bw-focus) solid var(--focus); outline-offset:2px; transition:none }
```
Scroll-driven animations always use `linear`. The scroll position is already the easing. Banned curves: `cubic-bezier(.19,1,.22,1)` and `cubic-bezier(.68,-.55,.27,1.55)`. Overshoot on a reimbursement figure reads as consumer SaaS.

**Law 1: base CSS is the finished state.** Never `opacity:0` or `translateY()` in a base rule. **Law 2: every scroll animation lives inside `@media (prefers-reduced-motion:no-preference){ @supports (animation-timeline:view()){ } }` and nowhere else.** Break law 1 and a Firefox user sees a blank page and concludes the product is broken. That is worse than every animation we could ship.

### 5.6 Print and export reset

```css
@media print{
  :root, [data-theme="dark"]{ /* force the light set, all tokens re-declared */ }
  *{ box-shadow:none !important; backdrop-filter:none !important;
     -webkit-print-color-adjust:exact; print-color-adjust:exact }
  --rule:#C7CCCC;      /* #E4E7E7 disappears on a laser printer */
  --band-edge:#9FB6B4; /* the band needs a printed boundary, not just a tint */
  .hdr,.toast,.tooltip,nav,.rail{ display:none }
  .prov{ display:grid !important }  /* provenance always prints */
  table{ break-inside:auto } tr{ break-inside:avoid }
}
```

---

## 6. GRID AND LAYOUT

| Width | Cols | Gutter | Page margin | Container | Column | Section rhythm | Header |
|---|---|---|---|---|---|---|---|
| **320** | 4 | 16 | 16 | **288** | 60.00 | 56 | 56 |
| **390** | 4 | 16 | 16 | **358** | 77.50 | 56 | 56 |
| **768** | 8 | 24 | 24 | **720** | 69.00 | 96 | 64 |
| **1024** | 12 | 24 | 24 | **976** | 59.33 | 96 | 64 |
| **1440** | 12 | 32 | auto (120 each) | **1200** | 70.67 | 128 | 64 |
| **1920** marketing | 12 | 32 | auto (360 each) | **1200** | 70.67 | 128 | 64 |
| **1920** tool data region | 12 | 32 | auto (160 each) | **1600** | 104.00 | 128 | 56 |

```css
.container{ inline-size:100%; max-inline-size:var(--content-max);
  margin-inline:auto; padding-inline:var(--gutter) }
.container--data{ max-inline-size:var(--table-max) }
.grid{ display:grid; gap:var(--gutter);
  grid-template-columns:repeat(4,minmax(0,1fr)) }
@media (min-width:768px){  .grid{ grid-template-columns:repeat(8,minmax(0,1fr)) } }
@media (min-width:1024px){ .grid{ grid-template-columns:repeat(12,minmax(0,1fr)) } }
section{ padding-block:var(--section-y) }
html,body{ overflow-x:clip }   /* clip, NEVER hidden. hidden breaks every sticky on the page */
```

`minmax(0,1fr)` not `1fr`, or a long payer name in a grid child sets a min-content floor and pushes the page sideways.

**Content column caps.** Prose `--measure: 68ch`. The hero sub caps at 52ch so it lands on two lines at 320. Both H1 variants of the Broker / Employer swap fit two lines at 36px in a 288px column, verified against the fold budget.

**The 320x568 fold budget, computed, in px:**

| Block | Height | Gap below |
|---|---|---|
| Header | 48 | 0 |
| Broker / Employer segmented control | 36 | 16 |
| H1, 36px / 1.28, 2 lines | 92 | 12 |
| Sub, 14px / 1.45, 2 lines | 41 | 20 |
| Bar 1: label 16 + track 44 + caption 16 | 76 | 16 |
| Bar 2: label 16 + track 44 + caption 16 | 76 | 16 |
| Primary CTA | 44 | 16 |
| **Total** | **529** | 39px of the next block visible |

**Proof of no page-level horizontal scroll, run at 320 / 360 / 390 / 414 / 768 / 1024 / 1440 / 1920:**
```js
window.scrollTo(9999, 0); const x = window.scrollX; window.scrollTo(0, 0);
if (x !== 0) throw new Error(`page scrolls sideways ${x}px`);
```
`scrollWidth` lies on `overflow:visible`. Scroll it and read `scrollX`.

---

## 7. COMPONENT SPECS

Sizes throughout: **sm 32px, md 40px, lg 44px.** Below 768 every interactive element is forced to `min-block-size: var(--tap)` (44px) regardless of declared size.

### 7.1 Button, three variants

Shared: `--r-ctl` 6px, `--fs-btn` 15/20/600/-0.01em, `padding-inline` 16px (sm 12, lg 20), `gap` 8px, `inline-size:fit-content`, `white-space:nowrap`, `user-select:none`, `touch-action:manipulation`.

**Primary**

| State | Light fill | Light label | Light border | Dark fill | Dark label |
|---|---|---|---|---|---|
| rest | `#0F5C5C` | `#FFFFFF` **7.76** | none | `#36A9A9` | `#0B1415` **6.58** |
| hover | `#084646` **10.63** | `#FFFFFF` | none | `#70C1C1` **8.97** | `#0B1415` |
| active | `#053232` **13.92** | `#FFFFFF` | none | `#209A9A` | `#0B1415` |
| focus-visible | rest fill | rest label | `0 0 0 2px var(--paper), 0 0 0 4px #0F5C5C` | rest | rest |
| disabled | `#F0F2F2` | `#7E8A8A` **3.17** | `1px solid #E4E7E7` | `#243132` | `#6C7B7B` **3.05** |
| loading | rest fill | rest label at `opacity:.7`, `aria-busy="true"`, 16px spinner, `pointer-events:none`, width frozen | | | |

**Secondary (outline)**

| State | Light | Dark |
|---|---|---|
| rest | fill `--paper`, label `#0B1415` (18.66), border `1px solid #7E8A8A` (3.57) | fill `--paper`, label `#F2F5F5`, border `1px solid #6C7B7B` (3.90) |
| hover | fill `#F7F8F8`, border `#5A6A6B` (5.66) | fill `#1A2627`, border `#8B999A` |
| active | fill `#F0F2F2`, border `#5A6A6B` | fill `#243132` |
| focus-visible | `outline:2px solid #0F5C5C; outline-offset:2px` | `outline:2px solid #70C1C1; outline-offset:2px` |
| disabled | fill `--paper`, label `#7E8A8A`, border `#E4E7E7` | fill `--paper`, label `#6C7B7B`, border `#243132` |

**Tertiary (text)**

| State | Light | Dark |
|---|---|---|
| rest | label `#0F5C5C` (7.76), no fill, no border | label `#70C1C1` (8.97) |
| hover | label `#084646`, fill `#F4FAFA` | label `#A8D7D6`, fill `#112928` |
| active | label `#053232`, fill `#E6F3F3` | label `#36A9A9`, fill `#163333` |
| focus-visible | `outline:2px solid #0F5C5C; outline-offset:2px; border-radius:6px` | `#70C1C1` |
| disabled | label `#7E8A8A` | label `#6C7B7B` |

**Destructive modifier**: fill `#A32321` / label `#FFFFFF` (7.45), hover `#8A1D1B`, dark fill `#F47C70` / label `#0B1415` (7.08). Never the only signal: a destructive button is always paired with a confirm modal that names the object.

Transition on all three: the `::after` opacity overlay at `--d-fast` 120ms. **No color, background or border transition anywhere.**

### 7.2 Input

Height 40 (44 below 768). `--r-ctl` 6px. `--fs-input` 16px below 768 (mandatory, iOS zoom), 15px above. Padding `0 12px`. Prefix or suffix slot 32px wide, mono, `--text-3`.

| State | Fill | Border | Text | Placeholder |
|---|---|---|---|---|
| rest | `--paper` `#FFFFFF` | `1px #7E8A8A` (3.57) | `#0B1415` | `#627070` (5.16) |
| hover | `--paper` | `1px #5A6A6B` (5.66) | | |
| focus | `--paper` | `1px #0F5C5C` + `outline:2px solid #0F5C5C; outline-offset:1px` | | placeholder stays |
| filled | `--paper` | `1px #7E8A8A` | `#0B1415` weight 500 | n/a |
| error | `#FFEDEB` | `1px #A32321` (7.45) | `#0B1415` | message below in `#A32321` 14px, `aria-describedby`, `aria-invalid="true"` |
| disabled | `#F0F2F2` | `1px #E4E7E7` | `#7E8A8A` (3.17) | `cursor:not-allowed`, no opacity |
| readonly | `#F7F8F8` | `1px #E4E7E7` | `#0B1415` | selectable, focusable |

Dark: fill `--paper` `#121D1E`, border `#6C7B7B` (3.90), hover `#8B999A`, focus `#70C1C1`, error fill `#381C19` border `#F47C70`, disabled fill `#243132` text `#6C7B7B`.

Error is **never** signalled by border color alone: it carries an icon, a text message, and `aria-invalid`.

### 7.3 Select and combobox

Native `<select>` for ≤ 12 fixed options. Custom `role="combobox"` for the query input.

Trigger inherits every Input state. Chevron 16px, `--text-2`, `pointer-events:none`, right inset 12px, rotates 180deg via `transform` at `--d-fast` on open.

Listbox: `--paper` fill, `1px solid var(--rule)`, `--r-md` 8px, `--e2`, `max-block-size: min(320px, 50vh)`, `overscroll-behavior:contain`, `scrollbar-width:thin`.

| Option state | Light | Dark |
|---|---|---|
| rest | text `#0B1415`, fill transparent, 36px high, padding `0 12px` | `#F2F5F5` |
| hover | fill `#F7F8F8` | fill `#1A2627` |
| active-descendant (keyboard) | fill `#E6F3F3`, `2px` left bar `#0F5C5C`, `aria-activedescendant` | fill `#163333`, bar `#70C1C1` |
| selected | fill `#F4FAFA`, check 16px `#0F5C5C`, `aria-selected="true"` | fill `#112928`, check `#70C1C1` |
| disabled | text `#7E8A8A` | `#6C7B7B` |
| group label | `--fs-micro`, `--text-3`, `role="group"` with a visible label | same |
| empty | `Insufficient public data`, 14px `--text-2`, not a spinner, not a dash | same |

Keyboard: Up, Down, Home, End, Enter, Escape, Tab all wired. Debounce 140ms. Type-ahead within the open list.

### 7.4 Card

```css
.card{ background:var(--paper); border:1px solid var(--rule);
  border-radius:var(--r-card); padding:var(--pad-card) }
.card__head{ display:flex; align-items:baseline; justify-content:space-between;
  gap:var(--s3); margin-block-end:var(--s3) }
.card__title{ font:600 var(--fs-h3)/1.35 var(--sans); letter-spacing:-0.014em; color:var(--ink) }
.card__meta{ font:400 12px/16px var(--mono); color:var(--text-3) }
```

| State | Light | Dark |
|---|---|---|
| rest | fill `#FFFFFF`, border `#E4E7E7`, `--e0` | fill `#121D1E`, border `#243132` |
| interactive hover (`<a class="card">`) | border `#D2D7D7`, fill `#FAFBFB` | border `#303F40`, fill `#1A2627` |
| interactive focus-visible | `outline:2px solid #0F5C5C; outline-offset:2px` | `#70C1C1` |
| selected | border `#0F5C5C`, `3px` inset left bar `#0F5C5C`, fill `#F4FAFA` | border `#70C1C1`, fill `#112928` |
| lattice adjacency | `margin-inline-start:-1px`, radius 0 on shared edges | same |

No hover shadow, no hover lift, no `translateY`. A card that rises when you point at it is a marketing card.

### 7.5 Stat tile

```css
.tile{ background:var(--surface); border:1px solid var(--rule);
  border-radius:var(--r-md); padding:var(--pad-tile);
  display:grid; gap:var(--s1); align-content:start; min-block-size:96px }
.tile__label{ font:500 var(--fs-micro)/16px var(--mono); letter-spacing:.08em;
  text-transform:uppercase; color:var(--text-2) }
.tile__value{ font:600 var(--fs-ratio)/1 var(--sans); letter-spacing:var(--ls-ratio);
  color:var(--ink); font-variant-numeric:tabular-nums lining-nums slashed-zero }
.tile__n{ font:400 12px/16px var(--mono); color:var(--text-3) }
```

`--fs-ratio` in a tile is capped at 32/40/44 rather than the hero's 44/60/72. `min-block-size:96px` and tabular figures together make the loading-to-ready swap zero layout shift. Every tile carries its `n` as a sibling span, never a tooltip.

Badge inside a tile: tile radius 8, tile padding 12, badge radius `max(2px, 8-12)` = **2px**.

### 7.6 Table row

```css
.t-wrap{ overflow-x:auto; overscroll-behavior-x:contain; scroll-snap-type:x proximity;
  scrollbar-width:thin; container-type:scroll-state; position:relative }
.t{ border-collapse:separate; border-spacing:0; inline-size:max-content; min-inline-size:100% }
.t th,.t td{ padding:0 12px; block-size:44px; border-block-end:1px solid var(--rule);
  font:500 var(--fs-mono)/20px var(--mono);
  font-variant-numeric:tabular-nums lining-nums slashed-zero }
.t th{ font:500 var(--fs-micro)/16px var(--mono); letter-spacing:.08em;
  text-transform:uppercase; color:var(--text-2); text-align:start; background:var(--paper) }
.t td.num,.t th.num{ text-align:end }
.t th[scope=row],.t td:first-child{ position:sticky; inset-inline-start:0; z-index:2;
  background:var(--paper); border-inline-end:1px solid var(--rule) }
.t th:not(:first-child){ scroll-snap-align:start }
```

| Row state | Light | Dark |
|---|---|---|
| rest | fill `--paper` `#FFFFFF`, bottom rule `#E4E7E7` | `#121D1E` / `#243132` |
| hover | fill `#F7F8F8` (ink 17.54) | fill `#1A2627` (ink 14.18) |
| selected | fill `#F4FAFA`, `3px` inset left bar `#0F5C5C`, `aria-selected` | fill `#112928`, bar `#70C1C1` |
| focus-within | `outline:2px solid #0F5C5C; outline-offset:-2px` | `#70C1C1` |
| expanded | detail panel fill `#F7F8F8`, `180ms` transform-based | `#1A2627` |
| suppressed | value cell reads `n below publication threshold (n = 47)`, 13px `--text-2`, row not greyed | same |

**No zebra striping.** It doubles the visual noise on a page that is already a lattice, and a striped `background` on the sticky first cell either breaks the pin or breaks the stripe.

**Sticky header densification:**
```css
.thead-sticky{ position:sticky; top:var(--app-header-h); container-type:scroll-state; z-index:3 }
.thead-sticky th{ padding-block:12px; background:var(--paper); transition:none }
@container scroll-state(stuck: top){
  .thead-sticky th{ padding-block:6px; box-shadow:0 1px 0 rgb(11 20 21 / .14) }
}
```
`transition:none` is load-bearing. Padding is a layout property. This is a discrete state change at the stick boundary: one relayout, zero animated frames, full compliance. Do not "improve" it with a 160ms transition.

**Right-edge fade, right edge only:**
```css
.t-edge{ position:sticky; inset-inline-end:0; inline-size:24px; margin-inline-start:-24px;
  align-self:stretch; pointer-events:none; opacity:0;
  background:linear-gradient(90deg,#0000,rgb(11 20 21 / .10)) }
@container scroll-state(scrollable: right){ .t-edge{ opacity:1 } }
```
The symmetric `mask-image` every source copy-pastes **fades the pinned payer name**. Fade the right edge only, with a sticky pseudo-element, never a mask on the scroller.

Long result sets, tool only: `tbody.chunk{ content-visibility:auto; contain-intrinsic-size:auto 900px }` (25 rows x 36px, measured). Never `auto` alone or the scrollbar jumps and you manufacture the CLS you were avoiding. Confirm Ctrl+F still finds off-screen rows. JS virtualization is banned because it silently kills find-in-page and print.

### 7.7 Badge

Height 20 (sm) / 24 (md). Padding `0 8px`. Radius `--r-pill` 999. `--fs-micro` 11/16/500/+0.08em uppercase mono. `gap:4px` for an optional 12px icon.

| Variant | Light fill / text | Dark fill / text | Ratio | Use |
|---|---|---|---|---|
| neutral | `#F0F2F2` / `#0B1415` | `#243132` / `#F2F5F5` | 16.61 / 12.28 | counts, categories |
| accent | `#E6F3F3` / `#084646` | `#163333` / `#A8D7D6` | 9.36 / 8.0+ | `VERIFIED SOURCE` |
| ok | `#E7F9EA` / `#1F6F38` | `#162B1B` / `#79D28D` | 5.65 | `EXPORT READY` |
| caution | `#FFF2E3` / `#8A5A00` | `#34230B` / `#F4B359` | 5.38 | `ABOVE REFERENCE`, `STALE MONTH` |
| danger | `#FFEDEB` / `#A32321` | `#381C19` / `#F47C70` | 6.58 | `FAILED` |
| info | `#ECF3FF` / `#2C4A7C` | `#1A2539` / `#8CB2F1` | 7.92 | `MEDICARE REFERENCE` |
| locked | `#F1F5F5` / `#5A6A6B` + 45deg hatch | `#1B2222` / `#9BAAAB` | 5.16 | `LOCKED` |

Every badge carries a **word**. A colored dot alone is banned.

### 7.8 Lock / gated state

**The hard rule first, because this is where estates leak.** A locked value is **never rendered into the DOM and hidden**. Not blurred, not `filter:blur()`, not `color:transparent`, not `display:none`, not a CSS PIN gate. **If the bytes reach the browser, the value is public.** The server returns a `locked` state carrying no figure at all, and the component renders the lock from that state.

```html
<div class="fig" data-state="locked">
  <span class="lab micro">MEDIAN</span>
  <span class="lock" aria-label="Locked. Sign in to view the median for this code and state.">
    <svg width="14" height="14" aria-hidden="true">…</svg> Locked
  </span>
  <a class="btn btn-tertiary" href="/signin">Unlock</a>
</div>
```
```css
.fig[data-state="locked"]{ background:var(--locked-wash); color:var(--locked);
  border:1px dashed var(--control); border-radius:var(--r-sm);
  background-image:repeating-linear-gradient(45deg,var(--rule) 0 2px,transparent 2px 4px) }
```

| Property | Light | Dark |
|---|---|---|
| Fill | `#F1F5F5` | `#1B2222` |
| Text | `#5A6A6B` (5.16) | `#9BAAAB` (locked-wash 5.16+) |
| Border | `1px dashed #7E8A8A` (3.57) | `1px dashed #6C7B7B` |
| Pattern | `repeating-linear-gradient(45deg, #E4E7E7 0 2px, transparent 2px 4px)` | `#243132` |
| Unlock CTA | tertiary button, `#0F5C5C` | `#70C1C1` |

**Locked is not an error.** It is never red, never `--danger`, never `--caution`. It uses `--locked`, which is a neutral, plus a pattern, plus the word.

### 7.9 Distribution bar

```css
.dist__track{ position:relative; block-size:44px; background:var(--surface-2);
  border:1px solid var(--rule); border-radius:var(--r-track); overflow:hidden }
@media (min-width:768px){ .dist__track{ block-size:52px } }
.dist__band{ position:absolute; inset-block:0; left:var(--p25);
  inline-size:calc(var(--p75) - var(--p25)); min-inline-size:2px;
  background:var(--band); box-shadow:inset 0 0 0 1px var(--band-edge) }
.dist__median{ position:absolute; inset-block:0; left:var(--p50);
  inline-size:var(--bw-median); margin-inline-start:-1px; background:var(--median) }
.dist__ref{ position:absolute; inset-block:0; left:var(--ref);
  border-inline-start:var(--bw-ref) dashed var(--ref) }
```

| Element | Light | Dark | Contrast |
|---|---|---|---|
| Track fill | `#F0F2F2` | `#243132` | |
| Track border | `1px #E4E7E7` | `1px #243132` | |
| Band fill | `#DCE8E7` | `#163333` | |
| Band edge (1px, needed for print) | `#C4D8D6` | `#234644` | |
| Median rule 2px | `#0F5C5C` | `#70C1C1` | 6.19 / 6.48 on band |
| Reference 1px dashed | `#2C4A7C` | `#8CB2F1` | 7.04 / 6.27 on band |
| Label on band | `#0B1415` only | `#F2F5F5` only | 14.88 / 12.31 |
| Unavailable region | `repeating-linear-gradient(45deg, var(--rule) 0 2px, transparent 2px 4px)` plus the words | same | |

**Scale rule.** Any two bars visible together share one scale, and the max is printed once at the axis. Hero ceiling **$1,400**. Four-code panel ceiling **$2,200**.

| Code | Market | p25 | p50 | p75 | Spread | @1400 | @2200 |
|---|---|---|---|---|---|---|---|
| 70553 MRI brain | CA | $258 | $589 | $1,309 | **5.1x** | 18.43 / 42.07 / 93.50% | 11.73 / 26.77 / 59.50% |
| 73721 MRI knee | CA | $154 | $360 | $762 | **4.9x** | | 7.00 / 16.36 / 34.64% |
| 29881 knee scope | CA | $671 | $911 | $2,113 | **3.1x** | | 30.50 / 41.41 / 96.05% |
| 99214 office visit | TX | $93 | $115 | $149 | **1.6x** | 6.64 / 8.21 / 10.64% | 4.23 / 5.23 / 6.77% |

Arithmetic checked: 1309 ÷ 258 = 5.074, 762 ÷ 154 = 4.948, 2113 ÷ 671 = 3.149, 149 ÷ 93 = 1.602. One decimal, never rounded up to a friendlier number.

`--ref` comes from the **stored fee-schedule field only**. 186% of Medicare does not license computing 589 ÷ 1.86 = 316.67 and putting a mark there. If the stored field is absent, `.dist__ref` is **not rendered at all** and no reference label appears. We hold `% of Medicare` for 70553 (186%) and 73721 (176%). We do not hold it for 29881 or 99214, so those render the honest empty state.

If a band computes under 8px, the value is carried by the printed text and the band is a marker. Say so in the axis note.

Motion, marketing only, `.m` scope, absent from the tool bundle:
```css
@media (prefers-reduced-motion:no-preference){ @supports (animation-timeline:view()){
  .m .dist__band{ transform-origin:left center; animation:band linear both;
    animation-timeline:view(); animation-range:entry 30% entry 80% }
  @keyframes band{ from{transform:scaleX(0)} to{transform:scaleX(1)} }
  .m .dist__median{ animation:mk linear both; animation-timeline:view(); animation-range:entry 62% entry 86% }
  .m .dist__ref{    animation:mk linear both; animation-timeline:view(); animation-range:entry 70% entry 92% }
  @keyframes mk{ from{opacity:0} to{opacity:1} }
}}
```
`scaleX` not `width`. The band has no text child so nothing squashes. **The caption figures never animate.**

### 7.10 The `<Figure>` component. The only thing permitted to render a number.

Five states, never interchangeable.

| State | Dollar | Count | Percent | Ratio | Treatment |
|---|---|---|---|---|---|
| `loading` | `$---` | `--,---` | `---%` | `-.-x` | `--text-3`, tabular, pulse 1400ms |
| `ready` | `$589` | `313,579` | `186%` | `5.1x` | `--ink`, tabular, **no transition** |
| `unavailable` | `Insufficient public data` | same | same | same | 13px `--text-2`. **Not a dash.** |
| `suppressed` | `n below publication threshold (n = 47)` | same | same | same | 13px `--text-2`, prints the real n |
| `locked` | `Locked` + Unlock CTA | same | same | same | §7.8. Value absent from the DOM. |

```css
.fig[data-state="ready"]{ transition:none }
@media (prefers-reduced-motion:no-preference){
  .fig[data-state="loading"]{ animation:pulse 1400ms cubic-bezier(.4,0,.6,1) infinite } }
@media (prefers-reduced-motion:reduce){ .fig[data-state="loading"]{ opacity:.6 } }
@keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.55} }
```
Placeholders use the same character count and tabular figures as the real value, so the swap is zero layout shift.

**A count-up is banned.** At 60% of a tween the page states the California median for 70553 is $353, which is not a fact. That is a rule 1 violation wearing motion design.

**Ban raw number interpolation in lint:**
```json
"no-restricted-properties":[2,{"object":"Intl","property":"NumberFormat",
  "message":"Format numbers only inside Figure.tsx."}],
"no-restricted-syntax":[2,{"selector":"CallExpression[callee.property.name='toLocaleString']",
  "message":"Format numbers only inside Figure.tsx."}]
```
with one `overrides` exemption for `src/components/Figure.tsx`. Rule 1 becomes structurally enforced rather than reviewed. All five states get a gallery route and a 320px screenshot before ship.

### 7.11 Tooltip

Supplementary only. **Never the sole carrier of a value, a unit, or `n`.**

| Property | Light | Dark |
|---|---|---|
| Fill | `#121D1E` | `#243132` |
| Text | `#F2F5F5` (15.70) | `#F2F5F5` (12.28) |
| Border | none | `1px solid #303F40` |
| Radius / padding | `--r-md` 8px / `8px 10px` | same |
| Type | 13px / 18px / 400 sans, `-0.01em` | same |
| Max width | 260px | same |
| Shadow | `--e2` | `--e2` |
| Arrow | 6px, same fill, `transform:rotate(45deg)` | same |
| Offset | 8px from the trigger | same |
| Enter | `opacity 0→1` + `translateY(2px)→none`, 120ms `--ease`, **300ms open delay, 0ms close** | same |
| A11y | `role="tooltip"`, `aria-describedby`, dismissible on Escape, **hoverable** (WCAG 1.4.13), keyboard-reachable on focus | same |

### 7.12 Modal

| Property | Light | Dark |
|---|---|---|
| Scrim | `rgb(11 20 21 / .40)` | `rgb(4 8 9 / .64)` |
| Panel fill | `#FFFFFF` | `#121D1E` |
| Panel border | `1px solid #E4E7E7` | `1px solid #243132` |
| Radius | `--r-modal` 14 / 16 | same |
| Shadow | `--e3` | `--e3` |
| Width | `min(560px, 100% - 32px)` | same |
| Below 768 | bottom sheet, full width, `border-radius:16px 16px 0 0`, `padding-bottom: max(24px, env(safe-area-inset-bottom))` | same |
| Header | `--fs-h3` 600 `--ink`, 1px bottom rule `--rule`, 56px | same |
| Body | `--fs-body`, `max-block-size: min(70vh, 640px)`, `overflow-y:auto`, `overscroll-behavior:contain` | same |
| Footer | 64px, `--surface` fill, top rule, buttons right-aligned, `gap:8px` | `--surface` |
| Enter | scrim `opacity 0→1` 180ms; panel `opacity 0→1` + `translateY(8px)→none` 240ms `--ease-enter`. Sheet: `translateY(100%)→none` 240ms | same |
| Exit | 180ms `--ease` | same |

`<dialog showModal()>`. Focus trap, focus returns to the trigger, Escape closes, scrim click closes only when there is no unsaved input, `aria-labelledby` on the title. `scrollbar-gutter:stable` on `<html>` so opening does not shift the page 15px sideways.

### 7.13 Toast

Inverted in both themes so a system message never competes with data for the eye.

| Property | Light | Dark |
|---|---|---|
| Fill | `#121D1E` | `#243132` |
| Text | `#F2F5F5` (15.70) | `#F2F5F5` (12.28) |
| Accent bar (3px, inline-start) | `--ok` `#79D28D` / `--danger` `#F47C70` / `--info` `#8CB2F1` (dark-theme semantics, because the toast is dark) | same |
| Radius / padding | `--r-md` 8px / `12px 14px` | same |
| Shadow | `--e4` | `--e4` |
| Width | `min(400px, 100% - 32px)` | same |
| Position | `inset-block-end: max(16px, env(safe-area-inset-bottom)); inset-inline-end:16px`. Below 768: full width, bottom, 16px inset. | same |
| Type | 14px / 20px / 500 sans, action link 14px / 600 `#70C1C1` | same |
| Enter | `opacity 0→1` + `translateY(8px)→none`, 180ms `--ease-enter` | same |
| Exit | `opacity 1→0` + `translateY(4px)`, 120ms | same |
| Duration | 5000ms, **paused on hover and on focus**. Destructive-undo toasts never auto-dismiss. | same |
| A11y | `role="status" aria-live="polite"` for success, `role="alert" aria-live="assertive"` for failure. Max 3 stacked, `gap:8px`. | same |

The toast is a system channel. It never carries a rate, a `p50`, or an `n`.

### 7.14 Skeleton

Shape-preserving only. **A skeleton never occupies a slot that will hold a number.** Numbers use `<Figure state="loading">` with `$---`, which is a truthful placeholder rather than a grey rectangle pretending to be data.

| Property | Light | Dark |
|---|---|---|
| Fill | `#F0F2F2` | `#243132` |
| Radius | `--r-sm` 4px (text lines), `--r-md` 8px (blocks) | same |
| Line heights | 16px (sm), 20px (body), 28px (heading) | same |
| Line gap | 8px | same |
| Last line width | 62% | same |
| Motion | `opacity 1 → .55 → 1`, 1400ms `cubic-bezier(.4,0,.6,1)` infinite. **Opacity only. No sweeping gradient.** A gradient sweep animates `background-position`, which is a paint, and it reads as consumer SaaS. | same |
| Reduced motion | static `opacity:.6`, no animation | same |
| A11y | container `aria-busy="true"`, skeletons `aria-hidden="true"`, one visually-hidden `role="status"` announcing "Loading results" | same |

```css
.skel{ background:var(--surface-2); border-radius:var(--r-sm) }
@media (prefers-reduced-motion:no-preference){
  .skel{ animation:pulse 1400ms cubic-bezier(.4,0,.6,1) infinite } }
@media (prefers-reduced-motion:reduce){ .skel{ opacity:.6 } }
```

### 7.15 Segmented control (Broker / Employer)

Real `role="radiogroup"`, two `<input type="radio">`, never three segments.

| State | Light | Dark |
|---|---|---|
| Track | fill `#F0F2F2`, `1px solid #E4E7E7`, radius `--r-ctl` 6px, padding 2px, height 36 (44 below 768) | `#243132` / `#303F40` |
| Segment rest | text `#5A6A6B` (5.04 on track), fill transparent | `#9BAAAB` |
| Segment hover | text `#0B1415` | `#F2F5F5` |
| Segment checked | fill `#FFFFFF`, text `#0B1415` (18.66), `1px solid #D2D7D7`, radius 4px (`max(2px, 6-2)`) | fill `#121D1E`, text `#F2F5F5`, border `#303F40` |
| Focus-visible | `box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px #0F5C5C` | `#70C1C1` |
| Thumb motion | **none.** The swap is instant. A sliding thumb on a control above the H1 is decoration. | same |

Arrow-key operable, `aria-checked` reflected, copy swap announced via `aria-live="polite"`, persisted to `localStorage`, read on next visit. Text substitution, never a route change.

---

## 8. BUILD GATES. A BREACH IS A DEFECT, NOT A TRADEOFF.

Headless Chrome, `channel: chrome`, 390x844, 4x CPU throttle, Slow 4G.

| Gate | Marketing | Tool shell |
|---|---|---|
| LCP | < 1200ms | < 1500ms |
| CLS | **0.00 exactly** | **0.00 exactly** |
| INP | < 200ms | < 200ms |
| DOM nodes | < 1500 | < 2500 before rows |
| Transfer, first view | < 400KB | < 550KB |
| JS, gzipped | < 40KB | < 120KB |
| Font bytes | **104KB, 1 file, 0 third-party origins** | same |
| Third-party script above the fold | 0 | 0 |
| `window.scrollX` after `scrollTo(9999,0)` | 0 at 320/360/390/414/768/1024/1440/1920 | same |
| Contrast gate, both themes and every remap | 0 failures | 0 failures |
| CVD gate, min pairwise ΔE | ≥ 0.10 in all 3 vision types | same |
| `tnum` assertion | passes | passes |

Turquoise Health measures 8,083 nodes / 4,709KB / LCP 2,252ms. Clearing these makes us roughly three times lighter on the exact page a broker compares us against.

Then look at the screenshots. Press every control. Force all five `<Figure>` states at 320px. Emulate `prefers-reduced-motion: reduce` and confirm every band, marker and reveal renders finished, nothing invisible, nothing mid-flight. Disable `animation-timeline` support and confirm the same. Read the **computed** line-height on `h1` at 320 / 390 / 768 / 1440 and assert 1.28 / 1.28 / 1.14 / 1.05. A media query above a base rule loses on cascade order and is invisible to every check except reading the computed value.

Scripts that produced every number in this document: `/private/tmp/claude-501/-Users-user/b21483e9-ec70-4d54-a18c-d9ee4ce32ca5/scratchpad/color.py` (OKLCH conversion with gamut mapping, WCAG luminance, Machado 2009 CVD matrices, OKLab ΔE), `gen.py`, `gen2.py`, `gen3.py`, `verify.py`. Instrument validated against the technique library's independently computed values: it reproduces `--ink` on `--band` at 14.88 vs their 14.89 and `--text-2` on `--band` at 4.51 vs their 4.51.


# LOGO AND IDENTITY

# THE MARK

**RECOMMENDATION: Direction A, "THE SPREAD."** Rendered, measured and pixel-verified in Chrome at 240 / 96 / 48 / 32 / 24 / 20 / 16px, light and reversed. Proof sheets: `/Users/user/proof1.png` `/Users/user/proof2.png` `/Users/user/proof3.png` `/Users/user/proof4.png`.

---

## 1 · CONCEPT, ONE SENTENCE EACH

**A · THE SPREAD (recommended).** A dimension gauge: two bounds, a spine measuring the distance between them, and a heavy median bar that sits at its true measured position, 31.8% up from the low, because in this market the middle is not in the middle.

**B · THE DISTRIBUTION.** The silhouette of 313,579 observations, right-skewed, with the median bucket carrying the accent: proof that a price is not a number, it is a shape.

**C · THE LADDER.** Three bars at true relative height (258 : 589 : 1,309), so the mark itself is the 5.07x spread a broker is being asked to believe in.

**The data in A is real and load-bearing.** True median position `(589 - 258) / (1309 - 258) = 31.494%`. The mark ships **31.818%** (verified by `getBBox()`, not by declaration). Delta **+0.324 percentage points**, forced by integer rounding onto the 32-unit master grid. That is the entire fabrication budget of this identity and it is disclosed here.

---

## 2 · THE ACTUAL SVG

All three on `viewBox="0 0 32 32"`. Optical glyph box is exactly **24 × 24 at (4,4)** (verified by `getBBox()` → `{x:4, y:4, w:24, h:24}`). Two stroke weights only: **2u hairline**, **4u emphasis**. Radius `.5` on every corner: visible at 400px, invisible at 16px. Fills only, no strokes, so scaling is exact at any size.

### A · THE SPREAD (locked)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"
     fill="currentColor" role="img" aria-labelledby="mk-a">
  <title id="mk-a">Caliper</title>
  <rect x="9"  y="4"  width="14" height="2"  rx=".5"/>
  <rect x="15" y="4"  width="2"  height="24" rx=".5"/>
  <rect x="9"  y="26" width="14" height="2"  rx=".5"/>
  <rect class="mk-median" x="4" y="18" width="24" height="4" rx=".5"/>
</svg>
```

Geometry, and why each number is that number:

| element | rect | center | reason |
|---|---|---|---|
| high bound | `9,4,14,2` | y = 5 | 14u, narrower than the median so the mark never reads as a capital I |
| spine | `15,4,2,24` | x = 16 | the range being measured, 24u = exactly the glyph box |
| low bound | `9,26,14,2` | y = 27 | mirrors the high bound, span = 22u |
| **median** | `4,18,24,4` | y = 20 | widest (24u) and double weight (4u). Position: `(27-20)/22 = 31.818%` |

`.mk-median` defaults to `currentColor` (inherits). Give it `fill: var(--mk-accent)` in CSS for the two-tone. Standalone `.svg` file, add inside the root: `<style>.mk-median{fill:#077A70}</style>`.

### B · THE DISTRIBUTION

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"
     fill="currentColor" role="img" aria-labelledby="mk-b">
  <title id="mk-b">Caliper</title>
  <rect x="3" y="3"  width="4"  height="2" rx=".5"/>
  <rect x="3" y="7"  width="6"  height="2" rx=".5"/>
  <rect x="3" y="11" width="9"  height="2" rx=".5"/>
  <rect x="3" y="15" width="13" height="2" rx=".5"/>
  <rect class="mk-median" x="3" y="19" width="24" height="2" rx=".5"/>
  <rect x="3" y="23" width="18" height="2" rx=".5"/>
  <rect x="3" y="27" width="10" height="2" rx=".5"/>
</svg>
```

7 rows, h 2, pitch 4, y = 3/7/11/15/19/23/27. Price increases upward, so the long thin tail is at the top and the mode sits low. Counts above the median row (4+6+9+13 = 32) versus below (18+10 = 28) with the 24u median row straddling: statistically coherent for a right-skewed distribution, which matters because this audience will check.

### C · THE LADDER

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"
     fill="currentColor" role="img" aria-labelledby="mk-c">
  <title id="mk-c">Caliper</title>
  <rect x="2"  y="27"    width="28" height="2"     rx=".5"/>
  <rect x="3"  y="22.27" width="6"  height="4.73"  rx=".5"/>
  <rect class="mk-median" x="13" y="16.20" width="6" height="10.80" rx=".5"/>
  <rect x="23" y="3"     width="6"  height="24"    rx=".5"/>
</svg>
```

Heights are the real 70553 California quartiles scaled to a 24u ceiling: `1309 → 24.00`, `589 → 24 × 589/1309 = 10.80`, `258 → 24 × 258/1309 = 4.73`. Error under 0.06%.

### THE SCORECARD (measured, not asserted)

| | ownable | legible at 16px | says "price spread" | rule 1 data | verdict |
|---|---|---|---|---|---|
| **A Spread** | high, no direct analog in the category | **yes**, holds to 16 | yes, immediately | position encodes the real median | **RECOMMEND** |
| B Distribution | high, most beautiful at 300px+ | **no**, a grey smear by 24px | yes | shape is honest, not a plotted claim | hero graphic, not a logo |
| C Ladder | **low**, this is the default analytics logo | yes, best of the three | yes | heights encode real quartiles | safe, forgettable |

B is the most beautiful object on the sheet and it fails the only test that matters for a broker on a phone: it dies in a tab bar. C survives everything and belongs to nobody. **A is the only one that is both distinctive and durable.** Retain B as the hero canvas motif and C as the in-product rate-ladder component. Both are already drawn above and both are system-consistent with A.

**The one honest risk in A:** at a glance it can read as a slab-serif capital I. Mitigated by making the bounds 14u against a 24u median (tested at 12 / 14 / 16u; 16u read as an I, 12u lost the sense of a bounded range, 14u is the answer). Verify on the first real customer.

---

## 3 · THE LOCKUP

**Base unit `u = artboard height ÷ 32`.** Every value below is a multiple of u, so the whole system scales from one number.

```
artboard          32u × 32u square
glyph optical box 24u × 24u, centred, 4u margin on all sides
```

### Horizontal

```
[ artboard 32u ] [ gap 6u ] [ wordmark ]
optical gap, glyph ink to wordmark ink = 4u + 6u = 10u
```

* **Declared CSS gap = `0.1875 × artboard`.** 40px artboard → 7.5px. 28px artboard → 5.25px (verified computed: `5.25px`).
* **Wordmark cap height = 14u** (0.4375 × artboard, 0.583 × glyph height).
* **Vertical alignment: cap-height box centred on the glyph optical centre**, not baseline-aligned. At a 32u artboard the cap box spans y = 9u to 23u.
* **Optical compensation:** if the name begins with a round letter (C, O, Q, G, S), reduce the gap by 1u. `Caliper` ships at 5u, `Quartile` at 5u, `Datum` and `Reddenda Broker` at 6u.

Rendered sizes:

| artboard | cap height | IBM Plex Sans 600 font-size | gap |
|---|---|---|---|
| 24px (floor) | 10.5px | 15px | 4.5px |
| 28px (mobile nav) | 12.25px | 17.5px | 5.25px |
| 32px | 14px | 20px | 6px |
| 40px (desktop nav) | 17.5px | 25px | 7.5px |
| 64px | 28px | 40px | 12px |

`font-size = cap-height ÷ 0.698` (IBM Plex Sans capHeight 698/1000 em). **Verify on install**, do not trust the declaration:

```js
const c = document.createElement('canvas').getContext('2d');
c.font = '100px "IBM Plex Sans"';
console.assert(Math.abs(c.measureText('H').actualBoundingBoxAscent - 69.8) < 1.5);
```

### Stacked

```
glyph, centred
gap 10u from glyph ink bottom to wordmark cap top   (declared CSS gap = 6u)
wordmark, cap height 14u, centred on the glyph vertical axis
gap 6u
descriptor: "A REDDENDA COMPANY", cap height 4u, font-size 5.73u,
            IBM Plex Mono 500, uppercase, letter-spacing +0.1em
```

Stacked minimum artboard 48px. Below that, use horizontal.

### Clear space

**X = 8u on all four sides** of the outermost ink of whichever lockup is in use (one quarter of the artboard, two times the glyph's internal margin). One rule for symbol, horizontal and stacked. At a 40px artboard, X = 10px.

### Minimum sizes

| asset | floor | below the floor |
|---|---|---|
| symbol, master geometry | 20px | switch to the 16-grid favicon master |
| symbol, favicon master | 16px | do not ship |
| horizontal lockup | 24px artboard | symbol only |
| stacked lockup | 48px artboard | horizontal |

### Wordmark swap protocol (the name is not final)

The symbol contains no letter, so nothing in it is tied to a name. To swap:

1. Set the new name in **IBM Plex Sans SemiBold 600, letter-spacing -0.02em**.
2. Convert to outlines. The shipped logo is paths, not live text, so no font loads on the critical path and no FOUT touches the LCP element.
3. Scale the outlines until the **cap height measures 14u**, measured on a flat capital (H, E, T), not on a round or an ascender.
4. Apply the round-initial gap compensation above.
5. Regenerate only the wordmark path. **The symbol SVG never changes.**

Verified swap test at 40px artboard with `Caliper`, `Quartile`, `Datum` and `Reddenda Broker`: all four hold without touching a single symbol coordinate. See `proof4.png`.

**Type note, stated honestly:** IBM Plex Sans is not installed on this machine, so the wordmarks in the proof sheets rendered in the Helvetica Neue fallback (measured cap ratio 0.714). The lockup geometry is correct and verified; the letterforms in the images are not the specified face. Plex is the recommendation because it is already licensed and self-hosted across the Reddenda estate (`reddenda-brand.css:44`), so it costs zero new bytes and zero new license, and it is visibly not Space Grotesk, which keeps the sibling distinct from the parent. Paid upgrade path if David wants more distinction: Söhne Kräftig or ABC Diatype Medium, same 14u cap spec, outlined so licensing stays desktop-only.

---

## 4 · VARIANTS

All seven verified on screen in `proof4.png`.

| variant | how | contrast |
|---|---|---|
| **Two-tone (primary)** | structure `currentColor` → `#002420`, `.mk-median` → `#077A70` | 16.49:1 and 5.22:1 on white |
| **Mono ink** | all four rects `#002420` | 16.49:1 |
| **100% black** | all four `#000000` | for fax, stamps, single-plate print, embossing |
| **Single accent** | all four `#077A70` | 5.22:1 on white. Use when the mark sits inside an accent-only system |
| **Reversed** | structure `#FFFFFF`, median `#3DBBAE`, on `#002420` | 17.79:1 and 7.00:1 |
| **100% white** | all four `#FFFFFF` | over photography, over the ink field |
| **Badge** | see below | |

**Colour never carries meaning.** The median is identified by width (24u against 14u) and weight (4u against 2u). The mono variants were rendered side by side against the two-tone specifically to prove the hierarchy survives with hue removed. It does.

Hard prohibitions:
* `#3DBBAE` never on white (2.35:1).
* `#077A70` never on `#002420` (3.16:1).
* No gradient, ever. The parent's legacy logo files carry three of them plus a `feGaussianBlur` glow; the sibling carries none. That absence is the point.
* Never re-space, re-proportion or recolour the four rects individually.
* **Never move the median bar to the centre.** Its position is a measurement, not a composition.

Badge, 40-unit grid, corner radius 8.5 (21.25% of the side):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"
     role="img" aria-labelledby="mk-badge">
  <title id="mk-badge">Caliper</title>
  <rect width="40" height="40" rx="8.5" fill="#002420"/>
  <g transform="translate(4 4)" fill="#FFFFFF">
    <rect x="9"  y="4"  width="14" height="2"  rx=".5"/>
    <rect x="15" y="4"  width="2"  height="24" rx=".5"/>
    <rect x="9"  y="26" width="14" height="2"  rx=".5"/>
    <rect x="4"  y="18" width="24" height="4"  rx=".5" fill="#3DBBAE"/>
  </g>
</svg>
```

---

## 5 · FAVICON STRATEGY

**The rule: no badge below 32px.** A rounded container at 16px eats 4 of 16 pixels of the glyph and every element goes sub-pixel. Ship the glyph on transparent for tab-size icons and the badge only where the platform renders it large.

| file | size | asset | why |
|---|---|---|---|
| `favicon.svg` | scalable | **16-grid master below**, `fill="currentColor"` inside `<style>` with a `prefers-color-scheme` rule | Chrome, Firefox, Edge; adapts to light and dark tab bars |
| `favicon-32.png` | 32 | master geometry, glyph only, transparent | Safari, Windows taskbar |
| `favicon-16.png` | 16 | **16-grid master**, glyph only, transparent | fallback rasteriser, do not downscale the 32 |
| `apple-touch-icon.png` | 180 | **badge, square, `rx="0"`**, no transparency | iOS applies its own mask. A pre-rounded PNG double-rounds |
| `icon-512-maskable.png` | 512 | badge, glyph at `translate(112 112) scale(9)` | Android safe zone is the central 80% circle. Glyph lands 216px square, diagonal 305px, inside the 409.6px circle |

### The 16px-safe simplification

The master's 2u spine centres on unit 16, which halves to pixel column 7.5 and blurs. The favicon is therefore **redrawn on a native 16-unit grid**, every value an integer, every element landing on a whole device pixel.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"
     fill="currentColor" role="img" aria-label="Caliper">
  <rect x="3" y="1"  width="10" height="2"/>
  <rect x="7" y="1"  width="2"  height="14"/>
  <rect x="3" y="13" width="10" height="2"/>
  <rect x="1" y="9"  width="14" height="2"/>
</svg>
```

What changed and why, all four deliberate:

1. **Radii removed.** `rx=".5"` at 16px is 0.5 device pixels of antialiasing on every corner and reads as grey fringe.
2. **Bounds thickened 2u → 2 units of 16** (1px → 2px effective) so they do not vanish next to the median.
3. **Bounds widened 14/32 → 10/16** (0.4375 → 0.625 of the box) so the glyph fills a tab-sized square.
4. **Median position snaps to 33.333%** (`(14-10)/12`). Master is 31.818%, truth is 31.494%. **33.333% is the closest value expressible on a 16-unit integer grid**; the alternative was a half-pixel median and a blurred mark. Verified: `medianPosFavicon: 33.333`.

Theme-adaptive `favicon.svg`, single file, no JS:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <style>
    :root{fill:#002420}.m{fill:#077A70}
    @media (prefers-color-scheme:dark){:root{fill:#FFFFFF}.m{fill:#3DBBAE}}
  </style>
  <rect x="3" y="1" width="10" height="2"/><rect x="7" y="1" width="2" height="14"/>
  <rect x="3" y="13" width="10" height="2"/><rect class="m" x="1" y="9" width="14" height="2"/>
</svg>
```

---

## 6 · SIBLING RELATIONSHIP TO REDDENDA

Measured from the parent's live assets, not from the brief. Parent mark sampled: `/Users/user/reimburseos-v3-build/assets/img/reddenda-mark-ink@3x.png`.

**What is inherited, exactly:**

1. **Badge geometry.** Parent corner radius measured from the alpha edge at 3x: flat top span 57px inside a 96px side → **r ≈ 20.3% of the side**. Sibling ships `rx 8.5 / 40 = 21.25%`. Same family, arrived at independently and then matched.
2. **Colour, by formula.** Parent badge fill sampled at **#0C1D33 = `oklch(22.90% 0.0487 255.66)`**. Sibling badge **#002420 = `oklch(23.39% 0.0414 184.07)`**. **ΔL 0.49pp, ΔC 0.0073, ΔH 71.6°.** The sibling is the parent's exact lightness and chroma band with the hue rotated off blue onto the brand teal. That is a provable relationship, not a vibe.
3. **The accent is the parent's own token, unchanged.** `#077A70` is Reddenda's live `--teal-cta` (`assets/css/perf.css:25`, `reddenda-light.css:19`, `rx-ultra-tokens.css:24`, labelled "AA on white"). The sibling takes the parent's soberest teal as its primary, where the parent leads with the bright cyan. Same family, lower voice.
4. **The mono register.** Parent numerals are IBM Plex Mono (`reddenda-brand.css:45`). Sibling uses the same face for micro-labels, CPT codes and figures. That shared third voice is what makes the two products feel like one company on a page.
5. **The primitive.** The parent's earlier lockup is built from three horizontal data rails of unequal length on a shared axis (`reddenda-logo-light.svg`: `M0 114 H146`, `M22 172 H168`, `M0 230 H146`). The sibling mark is built from the same primitive: unequal horizontal bars measured against a common spine. Same vocabulary, different sentence.

**What is deliberately different, and why it is the right difference:**

| | Reddenda parent | Broker sibling |
|---|---|---|
| subject | a letter, R | a measurement, no letter |
| construction | gradients, glow filter, ~40 elements | 4 rects, flat fills, zero filters |
| hue | blue 255.66° | teal 184° |
| display face | Space Grotesk | IBM Plex Sans (or a licensed grotesque) |
| what it says | this is the company | this is the instrument |

**The parent is a monogram, which is exactly why it cannot be the sibling.** A monogram is welded to a name. This product's name is not final and its wordmark must be swappable. A measurement glyph is name-independent by construction, which is the structural reason to build the sibling this way rather than as an "R" with a modifier.

---

## 7 · SIX NAME CANDIDATES

**Clearance is NOT run.** I did no trademark search and no domain lookup in this session. Every risk note below is prior knowledge, not a search result. Do not commit to any of these without a USPTO knockout search and a domain check.

| # | name | why it works for a broker | risk |
|---|---|---|---|
| **1** | **Caliper** | The instrument for measuring the distance between two points, which is literally what the product does. One word, no explanation needed, zero medical connotation, institutional register. Names the recommended mark so precisely that the mark reads as a logotype for it. | Caliper Life Sciences (PerkinElmer, retired brand). `.com` almost certainly held. |
| **2** | **Quartile** | The word a broker already uses when they ask for the data. Unmistakably statistical, allergic to hype by construction, and it makes the p25 / median / p75 product architecture self-evident. | Quartile is a large e-commerce ad-tech firm holding `quartile.com`. Different market, plausible coexistence, needs counsel. |
| **3** | **Datum** | The reference point from which every measurement is taken. Engineering register, cold, precise, exactly the tone of a self-funded employer's CFO. Pairs with "everything is measured against something public." | Common word, moderate trademark distinctiveness. Held by several small firms. |
| **4** | **Reddendum** | The clause in a deed that states what is to be rendered. A true Latin sibling to Reddenda, genuinely ownable, unmistakably legal and financial, and it explains the parent relationship in one word. | Hard to say and spell on a phone. Near-zero immediate comprehension. Best as an endorsed sub-brand, not a front door. |
| **5** | **Span** | The distance between the low price and the high price. Shortest, most memorable, plainest English, and it survives being said out loud on a call. | Very common word. Weak on its own for trademark; needs the mark to do the lifting. Span.io exists in a different category. |
| **6** | **Bracket** | Finance-native (tax bracket, price bracket) and it is literally the shape the mark draws. "What bracket is your client's rate in" is a sentence a general agent would actually say. | Common word. A retired clinical-trials brand used it. |

**Recommend Caliper. Runner-up Quartile.**

Caliper because it is an instrument, not a claim. This audience is buying evidence they can hand to a client, and an instrument name promises measurement rather than savings, which keeps the whole brand inside the honest-language rule by default. It is also the only one of the six that the recommended symbol *illustrates* rather than merely accompanies.

Quartile if David wants the name to do the category education. It is more descriptive, less ownable, and it will out-convert Caliper in cold outreach while being harder to defend legally.

**Brand architecture either way:** standalone name on its own domain, with an endorsement line, not a compound. `Caliper`, with `A REDDENDA COMPANY` set in IBM Plex Mono at 4u cap in the stacked lockup and in the footer. Never `Reddenda Caliper`.

---

## 8 · TOKENS

```css
:root{
  /* surfaces */
  --bk-surface:      #FFFFFF;
  --bk-surface-2:    #F3F8F7;   /* oklch(97.51% .0055 183) */
  --bk-rule:         #D3DDDB;   /* oklch(88.94% .0111 183) hairlines */

  /* ink */
  --bk-ink:          #002420;   /* oklch(23.39% .0414 184) · 16.49:1 on white */
  --bk-ink-2:        #506965;   /* oklch(49.95% .0303 184) ·  5.92:1 on white */

  /* accent, inherited unchanged from Reddenda --teal-cta */
  --bk-accent:       #077A70;   /* oklch(52.17% .0906 185) ·  5.22:1 on white, AA all sizes */
  --bk-accent-rev:   #3DBBAE;   /* oklch(72.06% .1102 185) ·  7.00:1 on --bk-ink. NEVER on white */

  --mk-accent:       var(--bk-accent);
}
:root[data-theme="dark"], @media (prefers-color-scheme: dark){
  --bk-surface: #002420; --bk-ink: #FFFFFF; --mk-accent: var(--bk-accent-rev);
}
```

Type: **IBM Plex Sans 600** wordmark and headings, **IBM Plex Sans 400** body (16px floor, 1.5 line-height), **IBM Plex Mono 500** for CPT codes, NPIs, observation counts, percentile labels and every micro-label (11px, uppercase, `letter-spacing: .08em`). Every figure carries `font-variant-numeric: tabular-nums lining-nums` plus `font-feature-settings: "tnum" 1, "lnum" 1`.

Motion: the mark does not animate in the nav, in a document header, or in an export. One sanctioned exception, hero only, once per session: the median bar translates from centre to its true position, 400ms, `cubic-bezier(.77,0,.18,1)`, transform only, wrapped in `@media (prefers-reduced-motion: no-preference)`. It performs the thesis. It is also entirely optional.

---

## VERIFIED vs NOT VERIFIED

**Verified in real Chrome, measured not asserted:** glyph bbox exactly `24×24 @ (4,4)`; median position `31.818%` against truth `31.494%`, delta `+0.324pp`; favicon median `33.333%`; nav gap computed `5.25px` at a 28px artboard; rendering at 240 / 96 / 48 / 32 / 24 / 20 / 16px in light, reversed, mono, black, single-accent and badge; wordmark swap across four names without touching the symbol; `window.scrollTo(9999,0)` returns `scrollX 0`; all contrast ratios computed from sRGB luminance, all OKLCH values computed and round-tripped; parent badge colour sampled per pixel; parent corner radius measured from the alpha edge; parent teal token, type stack and rail motif read from the live source files.

**Not verified:** trademark and domain availability for all six names (no search run). IBM Plex Sans cap-height ratio on this machine (font absent; proof sheets rendered in the Helvetica Neue fallback at 0.714, so the letterforms shown are not the specified face). CMYK and Pantone equivalents. Rendering inside an actual OS-level browser tab chrome (tested at true 16px in-page, which is a proxy).

**Working files:** `/private/tmp/claude-501/-Users-user/b21483e9-ec70-4d54-a18c-d9ee4ce32ca5/scratchpad/marks.html`, `marks2.html`, `marks3.html`, `final.html`.


# MOTION AND CINEMATICS

# REDDENDA BROKER: THE COMPLETE MOTION SYSTEM

Written against the Technique Library. Three deltas from it are flagged at the end. No em dashes. Every value is a decision, not a taste.

---

## 1. MOTION PRINCIPLES (5 lines)

1. **Position is truth.** Anything that encodes a value is painted at its final position at first paint and never moves. A mark that is 40% of the way to $1,309 is not a mark for $524, it is a mark for nothing, so it may only be an extent growing from a fixed anchor, never a labelled point.
2. **Three channels animate, and only three:** `opacity`, `transform`, and extent from a fixed anchor. Every other change of state happens in one frame with no duration.
3. **Motion introduces a number once, before it is read. It never accompanies a number being read.** Marketing may introduce. The tool never does: inside the tool a number is not introduced, it is already there.
4. **Scroll is the clock.** Time-based motion exists in exactly one place on this site, runs once, is ornament, and starts after LCP. Everything else is either scrubbed by the finger or is a discrete state change.
5. **Reduced motion removes duration, never feedback.** Under `reduce` every state still changes, instantly, nothing becomes invisible, and no control loses its answer. A dead site is a failure mode, not a compliance strategy.

---

## 2. THE EASING SET

Five tokens. Anything not on this list is a defect.

```css
:root{
  --ease:       cubic-bezier(.2,0,0,1);    /* STANDARD. everything reversible. hover, press,
                                              focus fill, thumb, opacity, dim, cross-fade */
  --ease-enter: cubic-bezier(.32,.72,0,1); /* ENTER. an element arriving from outside the
                                              viewport or off-canvas. sheet, popover, dialog */
  --ease-exit:  cubic-bezier(.4,0,1,1);    /* EXIT. dismissal only. accelerates away, never
                                              decelerates into nothing. paired with --d-fast */
  --ease-scrub: linear;                    /* MANDATORY on every scroll-driven animation.
                                              the scroll position is already the easing */
  --ease-none:  steps(1,end);              /* DISCRETE. a value swap that must not tween.
                                              used to make "no transition" explicit in a shared
                                              transition shorthand rather than silently omitted */
}
```

Rationale for `--ease` at `(.2,0,0,1)`: 20% of the time budget spent leaving, 80% arriving, zero overshoot, and it is symmetric enough to reverse mid-flight without a visible hitch when a pointer leaves a control it just entered.

**Banned, by name, permanently.** Any lane that ships one of these has shipped a defect:

| Curve | Why |
|---|---|
| `cubic-bezier(.19,1,.22,1)` | easeOutExpo. 52 uses on Turquoise Health. Theatrical. Reads consumer on a reimbursement figure. |
| `cubic-bezier(.68,-.55,.27,1.55)` | easeInOutBack. Overshoot on a dollar amount is a credibility failure. 34 uses in the Turquoise stylesheet. |
| Any spring, any `linear(...)` bounce, any `elastic` | Same reason, plus springs have no bounded duration, which breaks the ladder. |
| `ease-in-out` (the CSS keyword) | It is `(.42,0,.58,1)`, which is soft at both ends and makes a 120ms interaction feel like 200ms. |
| `linear` on anything time-based | Reserved for scrubbed. Time-based linear reads as a progress meter. |

---

## 3. THE DURATION SCALE

```css
:root{
  --d-instant:0ms;    /* the value swap. figures, sorts, filters, result arrival, focus outline */
  --d-fast:  120ms;   /* reversible feedback on an element the pointer is already on */
  --d-base:  180ms;   /* an element changing its own size or revealing content it owns, in place */
  --d-slow:  240ms;   /* an element arriving from outside the viewport. HARD CEILING */
  --d-pulse: 1400ms;  /* the in-flight loading pulse period. not an entrance */
  --d-cine:  1080ms;  /* THE ONE EXEMPTION. hero cinematic only. see section 5 */
}
```

**The rule for choosing, in one line each. Duration is a function of distance and reversibility, never of importance.**

- **The user is waiting for it → `--d-instant`.** Any figure, any result, any sort, any filter, any state that asserts a fact. Waiting plus animation equals waiting longer.
- **The user caused it and the element stays put → `--d-fast`.** Hover, press, focus ring, chip toggle fill, segmented thumb.
- **The element changes its own size in place → `--d-base`.** Row detail, disclosure, tab panel content.
- **The element arrives from elsewhere → `--d-slow`.** Sheet, dialog, popover. Nothing exceeds it. A data product that takes 400ms to change state reads as a database that is small.
- **The finger drives it → no duration.** Scrubbed, `--ease-scrub`, ranged.

`--d-cine` is the single stated exemption to the 240ms ceiling. It is bounded to: one animation, one shot, ornament with no value attached to any individual mark, post-LCP, desktop only, never on a control and never on a figure. It is declared as an exemption rather than smuggled in as a "reveal."

---

## 4. ENTRANCE CHOREOGRAPHY

**Zero JavaScript. No IntersectionObserver, no fallback observer.** Firefox and any engine without `animation-timeline` gets the finished state, immediately, which is not a degraded experience and does not justify a second code path.

### 4.1 The one nesting every scroll animation on this site lives inside

```css
/* keyframes live OUTSIDE the guard: smaller, and they are inert unless an animation
   property references them. the animation properties live INSIDE. */
@keyframes rv   { from{ opacity:0; transform:translateY(12px) } to{ opacity:1; transform:none } }
@keyframes band { from{ transform:scaleX(0) }                   to{ transform:scaleX(1) } }
@keyframes mk   { from{ opacity:0 }                             to{ opacity:1 } }

@media (prefers-reduced-motion: no-preference){
 @supports (animation-timeline: view()){

  .m .rv{
    animation: rv var(--ease-scrub) both;
    animation-timeline: view();
    animation-range: entry 15% entry 85%;
  }
  .m .rv--2{ animation-range: entry 20% entry 90% }
  .m .rv--3{ animation-range: entry 25% entry 95% }

  .m .dist__band{
    transform-origin: left center;
    animation: band var(--ease-scrub) both;
    animation-timeline: view();
    animation-range: entry 30% entry 80%;
  }
  .m .dist__median{ animation: mk var(--ease-scrub) both;
    animation-timeline: view(); animation-range: entry 62% entry 86% }
  .m .dist__ref{    animation: mk var(--ease-scrub) both;
    animation-timeline: view(); animation-range: entry 70% entry 92% }
 }
}

@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{
    animation-duration:.01ms !important; animation-iteration-count:1 !important;
    transition-duration:.01ms !important; scroll-behavior:auto !important;
  }
}
```

### 4.2 The numbers behind the choreography

| Parameter | Value | Why this value |
|---|---|---|
| Distance | `translateY(12px)`, never more | 24px reads as marketing. 12px is felt, not watched. |
| Opacity floor | `0` | Never `.001` tricks. `both` fill handles the rest. |
| Easing | `linear` only | Any curve on a scrubbed timeline makes the element feel like it is fighting the finger. |
| Fill mode | `both`, mandatory | Without it the element snaps back on scroll up. |
| Range | `entry 15% entry 85%` | Fires as the element crosses the leading edge, completes well before it centers. Completing at `entry 100%` means the user reads it mid-flight. |
| Stagger | `+5%` of the entry range per element, applied to the **range**, never `animation-delay` | `animation-delay` on a scrubbed timeline is a scroll offset, not a time offset, and behaves differently at every viewport height. |
| Cap | **6 reveal elements on the entire page** | Beyond six the page reads as a slideshow. |
| Never applied to | a number, a table row, anything inside `.dist__cap`, any control | Section 1, law 1. |

**What "stagger interval" actually means on a scrubbed timeline, and why it never feels wrong.** The entry range length equals element height plus viewport height. A 320px card at 390x844 gives a 1164px range, so a 5% offset is 58px of scroll. At a fast flick of roughly 1200px/s that is a 48ms perceived stagger. At a slow drag of roughly 300px/s it is 193ms. The stagger is velocity relative by construction: a fast reader gets a tight cascade, a slow reader gets a deliberate one. No time-based stagger can do that.

**The trap nobody should "fix".** The hero band bar is above the fold, so its `entry` range is already fully consumed at load and it renders complete at first paint. That is correct and required. Do not add a delay, an `entry-crossing` variant, or a JS trigger to make the hero bar animate on load. The hero bar is a fact and facts are painted at t=0.

**Intersection thresholds.** The only place a real observer is used on this site is the post-LCP cinematic trigger: `new IntersectionObserver(cb, { threshold: 0, rootMargin: '0px' })`, `threshold: 0` because the field is full-bleed and any pixel of visibility is enough, and it disconnects after the first fire.

---

## 5. THE HERO CINEMATIC: THE SETTLING FIELD

**The signature moment: 241 real observed California rates for CPT 70553 rise out of the price axis, left to right, cheapest first, and the tail keeps arriving after the middle has already landed. The last thing that happens is a stack of rates jamming against the $1,400 ceiling rule. The dispersion is not illustrated. It is enumerated.**

### 5.1 The ruling that makes it honest

**The axis that encodes value never animates. Only the axis that encodes nothing may move.**

Each mark's **x is its real price and is correct from the instant the mark exists**. Only **y** animates, and y encodes stack order within a density column, which is layout, not measurement. No mark is ever displayed at a price it does not have, for any frame, at any progress value. This is what makes a settling animation compatible with rule 1, and it is the reason this design is buildable at all.

### 5.2 What renders it

**Canvas 2D. Not WebGL, not SVG, not CSS.** WebGL scored zero across a 20-site grep of this category and dates the product. SVG with 241 individually delayed transforms repaints the whole SVG layer every frame on the main thread. Canvas is one `clearRect` plus 241 `fillRect` calls per frame, roughly 1.2ms on desktop, and it collapses to a single draw call in every degraded mode.

**It is a background layer with zero flow impact.** `position:absolute` inside the hero, `z-index:0`, `pointer-events:none` on the canvas, hero content at `z-index:1`. It reserves no space and cannot produce CLS when it appears. If the script never runs, nothing is missing and nothing is invisible: the H1, the sub, both band bars, all six figures, `n = 313,579` and the CTA are the hero, and they are painted at t=0.

**No text is ever drawn into the canvas.** The caption, the ceiling label and the overflow count are DOM text, selectable, translatable and screen-reader reachable.

### 5.3 The data driving it

A build step emits one JSON file from the live rate table. It is generated, never handwritten, and it does not ship if the assertion fails.

```
241 points, q_i = i/240 for i = 0..240.
Each point is the empirical quantile of the real 313,579-observation set at q_i,
which means every mark is an actual observed rate at a known percentile,
and the sample reproduces the published p25 / p50 / p75 exactly.
```

```json
{ "code":"70553", "state":"CA", "n":313579, "ceil":1400,
  "q":     [ <241 integers, dollars, ascending, emitted by the query> ],
  "y":     [ <241 integers, stack row index per point> ],
  "maxY":  <int>, "pitch": <px, chosen so maxY*pitch fits the canvas box>,
  "over":  { "n": <count above ceil>, "max": <max observed rate> },
  "ease":  [ <33 uint8, cubic-bezier(.2,0,0,1) sampled at t = k/32> ] }
```

```js
// build assertion. fails the build, does not warn.
if (!(q.length === 241 && q[60] === 258 && q[120] === 589 && q[180] === 1309))
  throw new Error('field sample does not reproduce the published p25/p50/p75');
```

The 33-entry easing LUT is the site's own `--ease` sampled at build time, roughly 50 bytes, so the canvas settle and every CSS transition are the same curve without shipping a bezier solver.

**Two different graphics, one build step, never conflated.** The hero field is the 241-point quantile sample where one mark equals one real observation. The methodology background (Technique Library 3.10) is a 96-bin histogram of all 313,579. A lane that renders one with the other's data has shipped a defect.

**Off-scale is printed, never clipped.** Points above the $1,400 ceiling are drawn in a 40px overflow rail to the right of a 1px rule, and the caption carries `+N above $1,400, max $M` from the stored `over` object. The ceiling is shared with the hero band bar so the eye reads the bar against the field.

### 5.4 The timeline, in ms

`t = 0` is the start of the cinematic, which is itself scheduled after LCP, not after DOMContentLoaded.

| t (ms) | Event |
|---|---|
| Page t=0 | H1, sub, both band bars, all figures, `n`, CTA painted. LCP candidate. **The field does not exist yet.** |
| LCP fires | `PerformanceObserver` for `largest-contentful-paint` resolves, then `requestIdleCallback(fn, {timeout: 400})` schedules the import. |
| 0 | Canvas inserted and sized, `opacity:0`, first frame drawn (empty). |
| 0 to 120 | Canvas container `opacity 0 to 1`, `--ease`. One composited property. |
| 0 to 840 | Per-point delay window. `delay_i = 620 * (i/240) + 220 * r_i`, where `r_i` is a deterministic per-point hash in [0,1). The 620 term is the left to right narrative. The 220 term is the jitter that stops it reading as a wipe. |
| `delay_i` to `delay_i + dur_i` | Point rises from the baseline to its stacked y. `dur_i = 180 + 90 * (y_i / maxY)`, so a mark at the top of a dense column travels faster and the tall stacks near $258 to $400 snap up while the sparse tail drifts. Opacity 0 to 1 over the first 60% of the point's own travel. |
| ~1080 | Last point lands. This is a tail point, near $1,400 or in the overflow rail. **The final beat of the cinematic is the expensive tail arriving after everything else has settled.** |
| 1080 | `cancelAnimationFrame`, final frame drawn once, listeners removed. The canvas never repaints again for the life of the page. |

Total main thread cost: roughly 65 frames at about 1.2ms, about 80ms of work spread across 1.08 seconds, entirely after LCP.

### 5.5 The interaction

**A real `<input type="range">`, not a pointer handler.** It gives keyboard operation, `role="slider"`, `aria-valuetext`, click to position and drag for free, at zero INP risk, because there is no `pointermove` listener anywhere on the page.

```html
<input class="field__probe" type="range" min="0" max="1400" step="1" value="589"
       aria-label="Price probe. Read the percentile at a given rate.">
<p class="field__read micro" aria-live="off">
  <span class="num" id="probe-$">$589</span> sits at
  <span class="num" id="probe-p">p50</span> of California rates for 70553.
</p>
```

- On `input`: binary search the 241-point array, write two text nodes, translate a 1px indicator line by `transform` only. No layout read, no reflow, one rAF-coalesced write.
- Both readouts are figures, so they swap with **no transition**.
- The readout width is pinned with `min-inline-size` in `ch` plus tabular figures, so nothing reflows as digits change.
- Precision is stated once in the caption: percentile from a 241-point equal-quantile sample of 313,579 observations.
- `aria-live="off"` on the paragraph because the range input already announces via `aria-valuetext`, which is set on every input. A live region plus a slider announcement is double speech.
- The probe works in every mode the canvas is drawn in, including reduced motion, because a control is not motion.

### 5.6 The mobile version

**There is no cinematic below 768px. The field is `display:none`, the canvas is never created, and the script returns before any rAF exists.**

This is the correct decision, not a compromise. Our stated user is a broker on a phone between meetings, and burning battery on a background texture to impress nobody is the opposite of the register we are selling. Serif Health, the closest competitor in existence, does exactly this with `if (window.innerWidth <= 767) return` placed before its observer and its first rAF.

What mobile gets instead, at t=0 with zero scroll: `$258 / $589 / $1,309` at 5.1x, `$93 / $115 / $149` at 1.6x, both on the shared $1,400 scale, `n = 313,579`, and a CTA. The two bands scrub in on scroll, compositor only, at zero cost. The story lands in about four seconds without a single frame of canvas.

### 5.7 The reduced-motion version

**Not "nothing". The settled field, drawn once.** Same canvas, same data, one `draw(1)` call, roughly 3ms, no rAF ever created. The user gets the full graphic and the probe. They lose the arrival, which is the only thing that was ever motion.

The guard is a union, not just `prefers-reduced-motion`:

```js
const still =
     matchMedia('(prefers-reduced-motion: reduce)').matches
  || matchMedia('(update: slow)').matches            // e-ink, low refresh panels
  || innerWidth < 768
  || navigator.connection?.saveData === true
  || (navigator.deviceMemory ?? 8) < 4
  || (navigator.hardwareConcurrency ?? 8) < 4;
```

### 5.8 The code

```js
// /j/field.js  target 2.4KB gz. Dynamically imported after LCP. Never in the entry bundle.
export default function field(){
  const cv = document.getElementById('hf');
  const src = document.getElementById('hf-data');
  if (!cv || !src) return;
  const D = JSON.parse(src.textContent);

  const still =
       matchMedia('(prefers-reduced-motion: reduce)').matches
    || matchMedia('(update: slow)').matches
    || innerWidth < 768
    || navigator.connection?.saveData === true
    || (navigator.deviceMemory ?? 8) < 4
    || (navigator.hardwareConcurrency ?? 8) < 4;

  const dpr = Math.min(devicePixelRatio || 1, 2);
  const b = cv.getBoundingClientRect();
  const W = Math.round(b.width), H = Math.round(b.height);
  if (!W || !H) return;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d', { alpha: true });
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  const N = D.q.length, RAIL = W - 40, BASE = H - 1;
  const X = i => D.q[i] > D.ceil ? RAIL + 6 + (i % 5) * 6 : (D.q[i] / D.ceil) * RAIL;
  const Y = i => BASE - D.y[i] * D.pitch;
  const DELAY = i => 620 * (i / (N - 1)) + 220 * ((Math.imul(i + 1, 2654435761) >>> 8) / 16777216);
  const DUR   = i => 180 + 90 * (D.y[i] / D.maxY);

  const E = t => {                       // 33-entry LUT of cubic-bezier(.2,0,0,1)
    const u = t * 32, k = u | 0;
    return (D.ease[k] + (D.ease[Math.min(k + 1, 32)] - D.ease[k]) * (u - k)) / 255;
  };

  function draw(p){
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#0B1416';
    g.globalAlpha = .35; g.fillRect(RAIL, 0, 1, H);      // the printed ceiling rule
    const now = p * 1080;
    for (let i = 0; i < N; i++){
      const t = Math.min(1, (now - DELAY(i)) / DUR(i));
      if (t <= 0) continue;
      g.globalAlpha = Math.min(1, t / .6);
      g.fillRect(X(i), BASE + (Y(i) - BASE) * E(t), 5, 1.25);   // x is FINAL from frame one
    }
    g.globalAlpha = 1;
  }

  if (still){ draw(1); cv.style.opacity = '1'; return; }   // no rAF is ever created

  let t0 = 0, raf = 0, slow = 0;
  const step = ts => {
    if (!t0) t0 = ts;
    const f0 = performance.now();
    const p = Math.min(1, (ts - t0) / 1080);
    draw(p);
    if (performance.now() - f0 > 8 && ++slow >= 3){ draw(1); return; }  // runtime kill switch
    if (p < 1) raf = requestAnimationFrame(step); else draw(1);
  };
  cv.style.opacity = '1';
  raf = requestAnimationFrame(step);
  addEventListener('visibilitychange', () => {
    if (document.hidden){ cancelAnimationFrame(raf); draw(1); }
  }, { once: true });
}
```

```js
// scheduling. the cinematic is not allowed to compete with LCP.
new PerformanceObserver((list, obs) => {
  if (!list.getEntries().length) return;
  obs.disconnect();
  requestIdleCallback(() => import('/j/field.js').then(m => m.default()), { timeout: 400 });
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

### 5.9 Performance budget for the cinematic

| Metric | Budget | Enforcement |
|---|---|---|
| Bytes on the critical path | **0** | Dynamic import, post-LCP. Fails the build if `field.js` appears in the entry chunk. |
| `field.js` gzipped | ≤ 2.6KB | CI size check. |
| Data JSON | ≤ 1.8KB | CI size check. |
| Contribution to LCP | **0ms** | Observed after the LCP entry. Layer is `position:absolute`, contributes no layout. |
| Contribution to CLS | **0.00** | Out of flow. Never un-hides anything in flow. |
| Per-frame main thread | ≤ 2.0ms desktop | Self-policing: three consecutive frames over 8ms jumps to the final frame and stops. |
| Total main thread | ≤ 100ms across 1.08s | No single task over 8ms, so zero long tasks. |
| Layer memory | ≤ 6.2MB | 1200x320 CSS px at DPR clamp 2 is 2400x640x4 bytes. DPR clamp is mandatory: a 3x phone at native density is the classic cause of a hot device, which is a second reason mobile gets nothing. |
| Frames after t=1080 | **0, forever** | `cancelAnimationFrame` plus no listeners left attached. |

---

## 6. DATA ANIMATION

### 6.1 How a distribution bar draws in

Extent grows from the p25 anchor via `scaleX`, scrubbed, compositor only. Code in section 4.1. Three constraints that make it legal:

- `transform-origin: left center` and the band is anchored at the real p25, so the **left edge is correct at every progress value**.
- **No tick, label or value marker may be attached to the growing edge during flight.** A growing extent reads as "not yet complete". A number attached to a growing extent reads as a fact, and it is false.
- The median rule and the Medicare reference animate **opacity only**, never position, so neither is ever at a wrong x.
- `.dist__cap` figures are painted at first paint and never move, ever.
- `.dist__band` has no text child, so nothing squashes under `scaleX`.

### 6.2 How numbers count up

**They do not. This is not a preference and there is no exception, including the tool, the export preview, and any future dashboard.**

The arithmetic, which is the argument. Counting up to the California median of $589 over 800ms:

- With a linear ramp, at t = 480ms the page states that the median is **$353**.
- With `--ease` applied, at t = 480ms it states **$551**.

Both are numbers that belong to no market, no payer and no percentile, asserted in a headline slot, on a page whose entire claim is that we do not do that. It is a rule 1 violation wearing motion design, and it is the single most recognisable tell of a startup landing page to a financial professional.

Also banned outright, with the mechanical reasons: `@property --v` plus `counter()` scrubbing. It renders false intermediates, it cannot produce a thousands separator so `$1,309` renders as `$1,39` mid-flight, and it repaints the text node on the main thread every frame.

What replaces it: the figure is in the HTML at first paint, in tabular figures, in a box reserved by `min-block-size`. If the value is genuinely live, render the last known server value with an explicit `as of` and revalidate silently, updating only the digits, with no transition on the swap.

### 6.3 How a comparison animates when the user changes state or CPT

**There is no cross-dataset tween. Ever.** A bar morphing from California to Texas passes through geometries that assert a p25, a median and a p75 that belong to no market. It is the count-up problem in a second dimension.

The transition is opacity and state, not geometry:

| t | What happens |
|---|---|
| 0ms, same frame as the submit | Existing bar and figures dim to `opacity:.55` over `--d-fast`. Figures switch to `loading`: `$---`, `--,---`, `---%`, `-.-x`, same character count, same tabular width, zero shift. Pulse starts. Controls stay live. |
| in flight | The pulse is the only motion. `--d-pulse` 1400ms. Under `reduce` it is a static `opacity:.6`, so an in-flight query is still legible as in flight. |
| arrival | New band geometry, new markers, new figures, new `n`, new provenance block, all painted **in one frame, with no transition**. Container returns to `opacity:1` over `--d-fast`. |
| no data | Figures render `Insufficient public data` or `n below publication threshold (n = 47)` with the real count. The track fills with `repeating-linear-gradient(45deg, var(--rule) 0 2px, transparent 2px 4px)` and renders no marks. Painted at once. |

```css
.q[data-state="pending"] .dist,
.q[data-state="pending"] .fig{ opacity:.55; transition:opacity var(--d-fast) var(--ease) }
.q[data-state="ready"]   .dist,
.q[data-state="ready"]   .fig{ opacity:1;   transition:opacity var(--d-fast) var(--ease) }

/* the geometry itself is never transitioned. this declaration is the guard. */
.dist__band,.dist__median,.dist__ref{ transition:none }
.fig[data-state="ready"]{ transition:none }

@media (prefers-reduced-motion: no-preference){
  .fig[data-state="loading"]{ animation:pulse var(--d-pulse) cubic-bezier(.4,0,.6,1) infinite }
}
@media (prefers-reduced-motion: reduce){ .fig[data-state="loading"]{ opacity:.6 } }
@keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.55} }
```

**The shared-scale guard, which is a real bug waiting to be shipped.** If two bars are on screen and a new query changes the axis ceiling, both bars' geometry changes. Recompute and repaint **both bars and the printed axis maximum in the same frame**. A single frame in which two visible bars sit on different scales is a lie, and it is exactly the kind of defect that passes every assertion.

### 6.4 Sort, filter, tab, row expand

| Action | Motion | Why |
|---|---|---|
| Column sort | **None.** Rows re-render in place. | Animating rows to new positions implies the ordering is a physical fact being observed. It is a query result. |
| Filter change | **None.** | Same. |
| Chart / Table tab | **None** on the panel content. Roving tabindex, instant swap. | Same server data, two presentations. Nothing arrived. |
| Row detail expand | `--d-base`, `clip-path` plus `translateY(-8px)`, content only | See below. |
| Sticky header densify | **No transition.** Discrete state change at the stick boundary. | Padding is a layout property. One relayout, zero animated frames. Do not "improve" it with a 160ms transition. |

```css
/* the row detail. one layout pass, zero animated layout frames. */
.row__panel{ block-size:0; overflow:clip }                    /* height set in JS from a single
                                                                 measured value, in one frame */
.row__panel[data-open]{ block-size:var(--panel-h) }
.row__panel > .inner{
  clip-path:inset(0 0 100% 0); transform:translateY(-8px);
  transition:clip-path var(--d-base) var(--ease), transform var(--d-base) var(--ease);
}
.row__panel[data-open] > .inner{ clip-path:inset(0 0 0 0); transform:none }
```

One row open at a time. Rows below move once, discretely, in the same frame the height is set, which is the same precedent as the sticky densification: a discrete layout change is permitted, an animated one is not.

---

## 7. PAGE AND ROUTE TRANSITIONS

| Navigation | Transition | Reason |
|---|---|---|
| Marketing page to marketing page (same origin, MPA) | 140ms root cross-fade | Cheap, native, no JS, and it makes the site feel like one document. |
| Marketing to the tool | **None. Hard navigation.** | The tool is the destination. A 300ms morph in front of a broker who just clicked "Run a lookup" is 300ms of nothing. |
| Route change inside the tool (SPA) | 140ms root cross-fade, guarded | Same reason as marketing, plus a guard so a slow DOM update cannot pin the frame. |
| Chart / Table tab | **None.** Not a route. | Section 6.4. |
| Back and forward | **Instant, always.** | Back must be the fastest thing on the site. No transition, no re-fetch, bfcache preserved. |

```css
@view-transition{ navigation: auto }

::view-transition-old(root),
::view-transition-new(root){
  animation-duration: 140ms;
  animation-timing-function: var(--ease);
}

@media (prefers-reduced-motion: reduce){
  @view-transition{ navigation: none }
}
```

```js
// SPA route change only. never for a query result, a sort, a filter or a tab.
function go(update){
  if (!document.startViewTransition
      || matchMedia('(prefers-reduced-motion: reduce)').matches){ update(); return; }
  document.startViewTransition(update);
}
```

**Hard constraints.**

- `view-transition-name` is **never** applied to a `<td>`, a `.fig`, a `.dist`, or anything containing a number. A morphing figure is a count-up with extra steps.
- Names must be unique in the document at capture time or the transition throws and the navigation stalls. Assert uniqueness in CI.
- Never a slide, never a scale, never a directional wipe. Cross-fade only. Direction implies a spatial model the site does not have.
- **bfcache is protected.** No `unload` handler, no `beforeunload`, no unload-time analytics beacon. Anything that breaks bfcache makes back slower than a fresh load, which is a worse regression than any transition is an improvement.
- Cross-document `@view-transition` requires same origin. The marketing domain and the tool are treated as separate documents with no transition between them regardless of how they are hosted.

---

## 8. MICRO-INTERACTIONS

All hover states are wrapped so a touch device never gets a stuck hover:

```css
@media (hover: hover) and (pointer: fine){ /* every :hover rule on the site lives here */ }
```

### Buttons

```css
.btn{
  min-block-size:var(--tap);
  transition: background-color var(--d-fast) var(--ease),
              border-color     var(--d-fast) var(--ease),
              color            var(--d-fast) var(--ease),
              transform        var(--d-fast) var(--ease);
}
@media (hover:hover) and (pointer:fine){
  .btn--primary:hover{ background-color:color-mix(in oklch, var(--accent) 88%, var(--ink)) }
  .btn--ghost:hover{ border-color:var(--ink) }
}
.btn:active{ transform:scale(.985) }
:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; transition:none }
```

`scale(.985)`, not `.95`. At 44px tall, `.985` is a 0.66px displacement: felt in the finger, invisible to the eye, no text resampling. `.95` is a toy. The focus outline has `transition:none` on purpose: a keyboard user tabbing at speed must never see a smear, and an animated focus ring is a WCAG 2.4.7 problem in practice even when it passes on paper.

### Inputs and the combobox

```css
.input{ border:1px solid var(--control);
  transition: border-color var(--d-fast) var(--ease) }
.input:hover{ border-color:var(--ink) }
.input:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; transition:none }

.listbox{ transform-origin:top center;
  transition: opacity var(--d-fast) var(--ease), transform var(--d-fast) var(--ease) }
.listbox[hidden]{ display:none }              /* not opacity:0. never a focus trap in a ghost */
.listbox[data-enter]{ opacity:0; transform:translateY(-4px) }

/* the active option NEVER transitions. arrow keys at 20/s must not smear. */
.opt[aria-selected="true"]{ background:var(--surface); transition:none }
```

Debounce 140ms on the query. The suggestion fetch is yielded so it can never block input: `await scheduler.yield?.()` before parsing, `postTask` at `background` priority for anything not needed to paint the list.

### Cards

```css
.card{ transition: border-color var(--d-fast) var(--ease), transform var(--d-fast) var(--ease) }
@media (hover:hover) and (pointer:fine){
  .card:hover{ border-color:var(--ink); transform:translateY(-1px) }
}
```

`-1px`, and no shadow. A shadow bloom on hover repaints, and a lifting card on a page whose visual metaphor is a fee schedule lattice breaks the lattice. The whole point of shared edges is that they are shared.

### Nav

`scroll-state(stuck: top)` densification, `transition: none`, per Technique Library 3.4. Nothing else. No hide-on-scroll-down, which costs a user the nav at the exact moment they reach for it.

### Tooltips

- **`n` is never a tooltip.** It is a sibling span. This is not negotiable and it is the difference between showing our work and hiding it.
- Tooltips carry definitions only, for example what a p75 is.
- Hover intent 400ms in, 0ms out on the trigger, 120ms fade, `--ease`.
- WCAG 1.4.13: hoverable (the pointer can enter the tooltip), dismissible (Escape closes it without moving focus), persistent (it does not time out).
- Never the sole carrier of any value.

### Copy citation

```html
<button class="btn btn--ghost" data-copy>
  <span class="btn__label">Copy citation</span>
</button>
<span class="sr-only" role="status" id="copy-live"></span>
```
```css
.btn__label{ min-inline-size:11ch; display:inline-block; text-align:center }
```
```js
btn.addEventListener('click', async () => {
  try{
    await navigator.clipboard.writeText(citation);
    label.textContent = 'Copied';
    live.textContent  = 'Citation copied to clipboard';
  }catch{
    label.textContent = 'Press Ctrl+C';          // honest negative path
    selectCitationText();
    live.textContent  = 'Copy failed. The citation is selected. Press Control C.';
  }
  setTimeout(() => { label.textContent = 'Copy citation'; live.textContent = ''; }, 1600);
});
```

No toast, no checkmark draw-on, no confetti, no color flash. The label swaps in place, the width is pinned in `ch` so nothing on the row reflows, and `role="status"` announces it once. A toast in the corner of a data tool is an element that arrives from off-canvas to tell you something you already know.

### Segmented control (Broker / Employer)

Thumb translates `--d-fast`, `--ease`, `transform` only. **The copy never animates**, it swaps in one frame, announced through `aria-live="polite"`. The container is height-pinned to the taller of the two copy variants so the swap can never move the H1. Real `role="radiogroup"`, two `<input type="radio">`, arrow-key operable, `localStorage` persisted.

---

## 9. THE PERFORMANCE CONTRACT

### 9.1 Property allowlist

**Compositor only. These are the only properties that may appear in a `transition` or `@keyframes` on this site:**

`transform` (translate, scale, rotate), `opacity`, `clip-path` (simple `inset()` only).

**Banned in any animation, by name:** `filter` and `backdrop-filter` (repaint per frame), `box-shadow`, `width`, `height`, `inline-size`, `block-size`, `top`, `left`, `inset`, `margin`, `padding`, `background-position`, `background-size`, `border-width`, `font-size`, `letter-spacing`, `grid-template-rows`, `flex-basis`, `color` on a large text block.

**Explicitly permitted as a discrete, untransitioned change:** anything above. A layout property may change, it may not animate. One relayout, zero animated frames. This is how the sticky header densification and the row expand are legal.

`will-change` is added by the animation that needs it and removed on completion. It never appears in a base stylesheet. Maximum three concurrent promotions.

### 9.2 Main thread rules

- **No `scroll` listener on this site.** Not one. Scroll-driven work is `animation-timeline` or it does not exist.
- **No `pointermove` listener on this site.** The hero probe is a range input.
- **No `resize` listener above the fold.** The canvas sizes once. On a real resize it redraws its final frame, debounced 200ms, and never re-animates.
- **Zero forced synchronous layouts inside any event handler.** No `getBoundingClientRect`, `offsetHeight`, `scrollTop` or `getComputedStyle` read inside `input`, `pointerdown`, `click` or any rAF that also writes. The row-expand height measurement is the single exception and it is a read in one frame followed by a write in the next.
- **Zero long tasks (>50ms) at any point in the page lifecycle**, including during the cinematic.
- Third-party script above the fold: **0**. Cookie consent is a bottom bar of 64px or less and never overlaps the primary CTA.

### 9.3 Budgets

Measured in headless Chrome, `channel: chrome`, 390x844, 4x CPU throttle, Slow 4G.

| Gate | Marketing | Tool shell |
|---|---|---|
| LCP | < 1200ms | < 1500ms |
| CLS | **0.00 exactly** | **0.00 exactly** |
| INP | < 200ms | < 200ms |
| TBT after LCP | **0ms** | < 50ms |
| DOM nodes | < 1500 | < 2500 before rows |
| Transfer, first view | < 400KB | < 550KB |
| JS gzipped, entry chunk | < 40KB | < 120KB |
| Composited layers above the fold | ≤ 8 | ≤ 8 |
| Running animations at load + 1200ms | **0** | **0** |
| `window.scrollX` after `scrollTo(9999,0)` | 0 at all 8 widths | same |

Turquoise Health, the page a broker compares us against, measures 8,083 nodes, 4,709KB and LCP 2,252ms. Clearing these makes us roughly three times lighter on the same content.

### 9.4 The assertions that catch what a screenshot cannot

```js
// 1. nothing on the marketing page is still animating after the cinematic ends.
//    catches a runaway rAF, an infinite keyframe left on a hidden element,
//    and a pulse that never got cleared when data arrived.
setTimeout(() => {
  const live = document.getAnimations().filter(a =>
    a.playState === 'running' && !(a.timeline instanceof ViewTimeline));
  if (live.length) throw new Error(`${live.length} time-based animations still running`);
}, 1200);

// 2. no page-level horizontal scroll. scrollWidth lies on overflow: visible.
window.scrollTo(9999, 0); const x = window.scrollX; window.scrollTo(0, 0);
if (x !== 0) throw new Error(`page scrolls sideways ${x}px`);

// 3. no animated layout property anywhere in the shipped CSS.
const BAD = /(transition|animation)[^;{]*\b(width|height|top|left|margin|padding|box-shadow|filter|background-position|inline-size|block-size)\b/;
// run over the built stylesheet. fails the build.

// 4. the cinematic never runs on the LCP path.
//    assert field.js is not reachable from the entry chunk in the build graph.
```

### 9.5 Reduced motion, honored without the site feeling dead

The global guard is the floor, not the design:

```css
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{
    animation-duration:.01ms !important; animation-iteration-count:1 !important;
    transition-duration:.01ms !important; scroll-behavior:auto !important;
  }
}
```

**The reason it does not feel dead is that almost nothing on this site was carrying meaning through duration in the first place.** Under `reduce`, every one of the following still happens, and happens instantly, which is how they already behaved for the user who scrolled fast:

- Focus rings appear. They never had a transition.
- Press states fire. `scale(.985)` is discrete enough that at 0.01ms it reads as a crisp click.
- Hover border changes fire.
- Every figure swap, sort, filter and tab change is identical, because they were all `--d-instant` already.
- The sticky header still densifies. It never animated.
- Both band bars render complete and correct, via `both` fill and law 1.
- The hero field renders its full settled graphic in one draw call, and the percentile probe works exactly as it does for everyone else.
- The in-flight pulse becomes a static `opacity:.6`, so a query in flight is still visibly in flight. This is the one place where the blanket `animation-duration:.01ms` is not enough and needs an explicit static replacement.

**The failure mode we are guarding against, stated plainly:** if law 1 is broken anywhere, so that a base style carries `opacity:0` or a `translateY`, then a reduced-motion user and every Firefox user sees a blank page and concludes the product is broken. That is worse than every animation on this list combined. Verification step 10 exists for exactly this: disable `animation-timeline` support, emulate `reduce`, and confirm nothing is invisible and nothing is mid-flight.

Also honored: `prefers-reduced-transparency` (drop the field to a flat `--surface` tint), `prefers-contrast: more` (band fill steps to a value that clears 7:1 against `--ink`, hatch density doubles), and `update: slow` (treated as `reduce`).

---

## 10. THE MOTION INVENTORY

Every animation that exists on this site. If it is not on this table, it is not in the codebase.

| # | What | Property | Duration | Curve | Trigger | Surface | Under `reduce` |
|---|---|---|---|---|---|---|---|
| 1 | Hero settling field | canvas draw | 1080ms, one shot | LUT of `--ease` | post-LCP, ≥768px | Marketing | Final frame, one draw |
| 2 | Band disclosure | `transform: scaleX` | scrubbed | `linear` | `view()` entry 30 to 80 | Marketing | Complete bar |
| 3 | Median / reference marker | `opacity` | scrubbed | `linear` | `view()` entry 62 to 92 | Marketing | Visible |
| 4 | Section reveal, max 6 | `opacity` + `translateY(12px)` | scrubbed | `linear` | `view()` entry 15 to 85 | Marketing | Final state |
| 5 | Scroll progress bar | `transform: scaleX` | scrubbed | `linear` | `scroll(root block)` | Marketing, if >3 screens | Hidden |
| 6 | Header densify | `padding` | **0ms** | none | `scroll-state(stuck)` | Both | Identical |
| 7 | Hover: button, card, input | `background-color`, `border-color`, `transform` | 120ms | `--ease` | `:hover`, fine pointer only | Both | Instant |
| 8 | Press | `transform: scale(.985)` | 120ms | `--ease` | `:active` | Both | Instant |
| 9 | Focus ring | `outline` | **0ms** | none | `:focus-visible` | Both | Identical |
| 10 | Segmented thumb | `transform: translateX` | 120ms | `--ease` | change | Marketing | Instant |
| 11 | Listbox enter | `opacity` + `translateY(4px)` | 120ms | `--ease` | open | Both | Instant |
| 12 | Row detail | `clip-path` + `translateY(8px)` | 180ms | `--ease` | click | Tool | Instant |
| 13 | Sheet / dialog enter | `opacity` + `translateY(16px)` | 240ms | `--ease-enter` | open | Both | Instant |
| 14 | Sheet / dialog exit | `opacity` | 120ms | `--ease-exit` | close | Both | Instant |
| 15 | Query dim | `opacity` to .55 | 120ms | `--ease` | submit | Tool | Instant |
| 16 | Loading pulse | `opacity` 1 to .55 | 1400ms loop | `(.4,0,.6,1)` | in flight | Both | Static `.6` |
| 17 | Root cross-fade | view transition | 140ms | `--ease` | same-origin nav | Both | Disabled |
| 18 | Copy confirmation | text swap | **0ms** | none | click | Both | Identical |
| 19 | Result arrival | none | **0ms** | none | data | Tool | Identical |
| 20 | Sort / filter / tab | none | **0ms** | none | click | Tool | Identical |

Twenty entries. Four of them are scrubbed, all on marketing. Two are time-based one-shots. Six are 0ms by design. The tool bundle contains **no scroll-driven animation at all**: not gated, not reduced, absent.

---

## 11. DELTAS FROM THE TECHNIQUE LIBRARY

Three, stated so a lane can reconcile rather than re-litigate.

1. **The hero cinematic exists, and it is a canvas.** The Library cut the runtime procedural canvas at score 3.75 for being 10KB on the LCP path. That objection is fully satisfied here: this canvas contributes **zero bytes and zero milliseconds to LCP** because it is dynamically imported after the `largest-contentful-paint` entry fires, it is absent below 768px, and it is one static draw call under `reduce`. What the Library cut was a canvas competing with the fold. This is a canvas that starts after the fold is finished and the numbers are already read. The pre-rendered 96-bin SVG field remains, unchanged, on the methodology section. Both ship. They use different data and are never conflated.

2. **`--d-cine: 1080ms` is a stated, bounded exemption to the 240ms ceiling.** Bounded to: one animation, one shot, ornament with no value attached to any mark, post-LCP, desktop only, never on a control, never on a figure, self-killing at three slow frames. Declared rather than smuggled.

3. **The segmented control gets a 120ms thumb.** The Library says "Motion: none." Amended to: the thumb translates 120ms on `transform` only, the **copy still swaps instantly with no motion**, and the container is height-pinned so the H1 cannot move. The thumb encodes which segment is active, which is a state the user just set, so animating it is feedback, not decoration. Everything else about 3.19 stands.


# THE MARKETING PAGE, SECTION BY SECTION

No prior broker-page design exists in the archive (rdx: 0 relevant war-room verdicts). All arithmetic below is computed, not estimated; the script is at `/private/tmp/claude-501/-Users-user/b21483e9-ec70-4d54-a18c-d9ee4ce32ca5/scratchpad/mk.py`.

---

# REDDENDA BROKER. THE MARKETING PAGE.

One document. One scroll. Ten sections. Light theme, one dark band, no toggle.

---

## 0. THE ONE DECISION: TIME TO A REAL NUMBER

The brief says under 15 seconds without signing up. **The answer is 0 interactions and one paint, and it is enforced mechanically.**

`$258 / $589 / $1,309`, `5.1x` and `n = 313,579` are **in the HTML response body**. Not fetched, not hydrated, not tweened, not behind a modal, not behind consent. The page arrives with CPT 70553, California already resolved, because §3.20 says the tool is never empty on arrival and that is also the honest demo ceiling.

| Barrier | Status on this page |
|---|---|
| Signup wall | none |
| Email gate | none |
| Cookie consent | **none. Zero third-party scripts on the page, first-party cookieless measurement only.** A consent bar exists only if a tracker exists. We ship no tracker, so we ship no bar, and the primary CTA is never covered. |
| Client fetch for the hero figures | none |
| JS required to see a number | **none** |
| Interstitial, chat bubble, exit modal, newsletter popup | none, ever, at any scroll depth |

**The gate that keeps it true forever, in CI, fails the build:**

```js
// javaScriptEnabled: false. Raw server HTML only.
const html = await (await fetch(URL)).text();
for (const s of ['$258','$589','$1,309','5.1x','n = 313,579','$93','$115','$149','1.6x'])
  if (!html.includes(s)) throw new Error(`arrival figure "${s}" is not in the server HTML`);
if (/id="hf-data"[\s\S]*?<\/script>/.test(html) === false) throw new Error('field JSON missing');
```

Measured target on Slow 4G / 4x CPU / 390x844: **LCP < 1200ms**, and LCP is the H1, which paints in the same frame as the figures. Time to a real number is therefore LCP, roughly a twelfth of the budget.

---

## 1. PAGE FRAME

**Theme.** Light only. No toggle, no `prefers-color-scheme` switch. A broker forwards this URL to a client and both browsers must render the same document. One exception: §2 carries `class="section--data"`, which is **literally the `[data-theme="dark"]` token block scoped to one `<section>`**. Not a new palette. Delete the class and the section renders light with the identical component set and zero other changes. Flagged for David in §14.

**Body scope.** `<body class="m">`. Every scroll-driven animation on the site is `.m`-scoped and is absent from the tool bundle.

**Grid, verbatim from the brand system.**

| Width | Container | Cols | Gutter | Section rhythm | Header |
|---|---|---|---|---|---|
| 320 | 288 | 4 | 16 | 56 | 56 |
| 390 | 358 | 4 | 16 | 56 | 56 |
| 768 | 720 | 8 | 24 | 96 | 64 |
| 1024 | 976 | 12 | 24 | 96 | 64 |
| 1440 | 1200 | 12 | 32 | 128 | 64 |

`html,body{overflow-x:clip}`. Never `hidden`.

**Scale ledger. Every distribution track on this page prints its own ceiling.**

| Where | Codes | Ceiling | Printed |
|---|---|---|---|
| §1 hero, bar 1 + bar 2 | 70553 CA, 99214 TX | **$1,400** | right end of each track, mono 12px `--text-3` |
| §2 gap axis + contrast bar | 70553 CA, 99214 TX | **$1,400** | right end of each |
| §3 four-code panel | 70553, 73721, 29881 CA, 99214 TX | **$2,200** | right end of each card + once above the grid |
| §7 exhibit | 70553 CA | **$1,400** | right end |

**This strengthens the technique library's "printed once at the axis," and here is the measured reason it had to change.** At 1440x900 a user can park with §2's $1,400 contrast bar and §3's first $2,200 card both on screen: §2's bar sits at the end of §2, §3's first card starts 128 + 128 + ~120 = 376px later, inside one 900px viewport. Two visible bars on different scales with the ceiling printed only once per group is exactly the lie the rule exists to prevent. Every track carries its own label. Cost: 9 characters per track.

**Why the hero is $1,400 and not $2,200, computed rather than asserted:**

| Scale | 99214 band width (the 1.6x sliver, the whole argument) |
|---|---|
| $1,400 hero track | 1440: **43.52px** · 768: **25.28px** · 390: **13.04px** · 320: **10.24px** |
| $2,200 panel track | 1440: 5.80px · 768: 7.84px · 390: 6.93px · 320: **5.54px** |

On $1,400 the sliver reads as a band at every width. On $2,200 it is under the 8px floor at every width, which is why §3 carries the mandatory axis note and the hero does not. 29881 cannot fit $1,400 at all (p75 = $2,113 = 150.9% of scale), which is why §3 exists on its own ceiling.

**Type, per the brand system, with two page-specific decisions:**
1. **Form micro-labels stay 12px at every width.** The 11px desktop step is for table headers at reading distance, not for the label on a control a user is about to type into.
2. **The hero sub is `--fs-sm` 14/1.45 below 390 and `--fs-lead` 17/18/19 at and above 390.** Reason: the 320x568 fold budget is a hard constraint and 17px sets 3 lines in a 288px column, which breaks it by 36px. This is a documented micro-step with a measured cause, not a taste.

**Page length.** ~7,000px at 1440 (7.8 viewports), ~11,000px at 390 (13 viewports). Over three screens, so the 2px `scroll(root block)` progress bar ships, at all widths, `--accent` at full weight, no gradient, `z-index:60` above the header.

---

## 2. HEADER

**Job:** name the product, prove it is an institution, and hold one action that never moves.

**1440.** Sticky, 64px. Left: the lockup. Right: nav then CTA.

Lockup: the **canonical Reddenda mark, unmodified**, then a 1px `--rule-strong` divider at 12px height with 8px margins, then `Broker` in `--sans` 600 at the mark's cap height, `--ink`. Rule 5 stays intact because the logo itself is untouched. Flagged in §14.

Nav, 15px/20px weight 500, `--ink` only, gap 28px: `Data` · `Tools` · `Exhibit` · `Limits`
CTA: `Open the tool` primary, 36px, `0 14px`, `--r-ctl` 6px, fill `#0F5C5C`, label `#FFFFFF` (7.76:1).
Tertiary to the left of it: `Book a call` → `calendly.com/reddenda/discovery`.

**`--text-2` is banned in this header.** Inactive versus active is weight and a 2px inset underline, never lightness. Over §2's dark band the header film composites to **#E7E8E8** and `--ink` measures **15.20:1** there, verified. Every header control carries an opaque `--paper` fill so its 3:1 border is measured against paper, not against the film.

**390 / 320.** 56px. Lockup left, hamburger right (44x44). Sheet is full-bleed below the header, **fully opaque `#FFFFFF`**, no blur. Items 56px tall, 17px/24px weight 500, 1px `--rule` dividers. `Open the tool` and `Book a call` pinned to the sheet bottom with `padding-bottom: max(16px, env(safe-area-inset-bottom))`. `inert` on `<main>` and `<footer>`, focus to the first item, returns to the trigger, Escape closes, `scrollbar-gutter:stable`.

**Motion.** `@container scroll-state(stuck: top)` fades `.hdr::before` from `opacity:0` to `1`, 120ms `--ease`, and applies `backdrop-filter: blur(14px) saturate(180%)` **only in the stuck state**. Height never animates. Sheet enters `translateY(-8px) → none` + `opacity 0 → 1`, 240ms `--ease-enter`; exits 180ms.

---

## 3. SECTION 1: THE HERO

**Job:** hand the visitor a real, sourced number and a working query in the same paint.

### Layout, 1440 (container 1200, 12 col, 32 gutter)

```
row A   cols 1-12   [ Broker | Employer ]  36px segmented control
row B   cols 1-6    H1, 2 lines, 64/1.05/-0.030em, 600
        cols 8-12   provenance <dl>, 4 slots, 12/18 mono labels
row C   cols 1-6    sub, 2 lines, 19/1.5/-0.015em, 400
row D   cols 1-12   THE INSTRUMENT PANEL  (card, --paper, 1px --rule, --r-card 16, pad 24)
                      query row:  [ PROCEDURE combobox, flex ] [ MARKET select 200px ] [ Look up 128px ]
                      bar 1:      70553 CA, track 52px, ceiling $1,400
                      bar 2:      99214 TX, track 52px, ceiling $1,400
                      CTA row:    [ Open the full tool ]  See what a client gets
                      micro:      No account. No PHI required. Ten lookups a day.
row E   cols 1-12   THE FIELD  (241 marks, height --field-h, caption below)
```

**Why the H1 is capped at 6 columns and not 8.** Both segment variants must set exactly 2 lines at 320, 390, 768 and 1200, or the segmented control moves the H1 when it swaps. At 6 cols the measure is 584px at 1200 and 534px at 768, and both variants set 2 lines at all four widths. `min-block-size: calc(2 * 1.05 * 64px)` pins the box, and CI asserts `h1.getClientRects().length === 2` for **both variants**, in **both the metric-matched fallback and the loaded Inter state**, at all four widths. If the count differs between font states, `text-wrap: balance` is replaced with an explicit `<br>`.

**Fold at 1440x900, computed:** header 64 + pad 48 + control 36+20 + H1 135+16 + sub 57+32 + panel(24 + 60+24 + 100+20 + 100+24 + 44+8 + 16 + 24) = **852px**. Above the fold: the segmented control, the H1, the sub, the prefilled working query, both bars with all six figures and both `n` values, the CTA, and the no-account line. The field begins at ~876 and is the reward for the first scroll, which is correct because it starts post-LCP anyway.

### Layout, 390 (container 358)

Single column, same order, panel padding 16, track 44px. Computed stack: 56 + 44+16 + 92+12 + 51+20 + (16+44+12) + 44+20 + 80+12 + 80+20 + 44+8 + 16 = **687px of 844**. Everything including both bars and the CTA is above the fold with 157px of §2 showing. The query row wraps to two rows: combobox full width, then `[ MARKET select | Look up ]` at 50/50 with a 12px gap.

### Layout, 320 (container 288)

Identical to 390 with three changes, all forced by the 568px fold:
1. **Bar 2 (99214 TX) moves below the fold.** It renders directly under bar 1, unchanged. The 1.6x contrast is carried in full by §2.
2. The sub steps to 14/1.45.
3. `Open the full tool` sits at the fold line.

Computed: 56 + 44+16 + 92+12 + 41+20 + (16+44+12) + 44+20 + 80+12 + 16 = **525px**, leaving **43 of the CTA button's 44px visible**. The visitor sees, with zero scroll: who it is for, what it does, `$258 / $589 / $1,309` at 5.1x, `n = 313,579`, a working query row, the no-account line, and the CTA.

### Copy, every string

**Segmented control** (`role="radiogroup"`, two radios, arrow-key operable, `aria-checked`, `localStorage['rb-view']`, `aria-live="polite"` on the copy region, height-pinned container):

`Broker`  ·  `Employer`

**H1** (both exactly 2 lines at every width):

- Broker: `What plans actually pay.`
- Employer: `What your plan actually pays.`

**Sub** (both exactly 70 characters, so the pinned box never moves):

- Broker: `Transparency in Coverage data. Same procedure, same state, 5.1x apart.`
- Employer: `Transparency in Coverage data. Same procedure, your state, 5.1x apart.`

**Provenance `<dl>`, cols 8-12:**

```
SOURCE            Transparency in Coverage machine-readable files, 45 CFR 147.212
GEOGRAPHY         California, statewide
OBSERVATIONS      313,579
REPORTING MONTH   {stored reporting_month field}
```

**Query row:**

| Element | String |
|---|---|
| Label 1 (12px mono, uppercase, +0.08em) | `PROCEDURE` |
| Combobox placeholder | `CPT code or procedure name` |
| Combobox value on arrival | `70553  MRI brain without contrast` |
| Label 2 | `MARKET` |
| Select value on arrival | `California` |
| Submit button | `Look up` |
| Helper under the row, 14px `--text-2` | `Try 73721, 29881, or 99214.` |
| Usage counter, 12px mono `--text-3`, right | `0 of 10 free lookups used today` |

**Bar 1 caption** (mono 15/500, tabular, `.num`):

`p25 $258` · `median $589` · `p75 $1,309` · `5.1x` · `n = 313,579` · axis right end `$1,400`

**Bar 2 caption:**

`p25 $93` · `median $115` · `p75 $149` · `1.6x` · axis right end `$1,400`

Bar 2's `n` slot renders `<Figure state="unavailable">` at design time because **we do not hold an observation count for 99214 Texas**. The build query emits it; **the build gate refuses to publish any track whose `n` is absent.** No card ships without its count.

**Micro-labels above each track:**

- `70553 · MRI BRAIN WITHOUT CONTRAST · CALIFORNIA`
- `99214 · OFFICE VISIT, ESTABLISHED PATIENT · TEXAS`

**CTA row:**

- Primary: `Open the full tool`
- Tertiary: `See what a client gets`  (anchor to §7)
- Micro, 12px mono `--text-3`: `No account. No PHI required. Ten lookups a day.`

**Field caption**, 12px mono `--text-3`, DOM text, never drawn into the canvas:

`241 observed in-network rates for 70553 in California, one mark per percentile, from 313,579 observations. +{over.n} above $1,400, max ${over.max}.`

If `over.n` resolves to 0 the entire clause is omitted. It is never printed as `+0`.

**Probe** (desktop only), a real `<input type="range" min="0" max="1400" step="1" value="589">`:

- `aria-label`: `Price probe. Read the percentile at a given rate.`
- Readout: `$589 sits at p50 of California rates for 70553.`
- Precision note, printed once: `Percentile from a 241-point equal-quantile sample of 313,579 observations.`

### The `--ref` landmine, and a defect in the input spec

**Technique Library §3.1's own sample markup carries `--ref:22.62%`, which is `589 ÷ 1.86 = $316.68` positioned on a $1,400 axis. That is the exact back-computation §3.1 bans two paragraphs later.** It must not be copied.

On this page: `.dist__ref` renders **only** from the stored Medicare fee-schedule dollar. Not from `186%`. The reason is not rounding, it is that **we cannot know which statistic the published ratio was computed on** (median, mean, weighted, at what percentile), so the mark's x would be an assumption wearing a measurement's clothes. If the stored dollar is absent, the element is **not in the DOM** and no reference label appears anywhere on the page. Same rule governs the `186% of Medicare` string itself: it prints only when both the stored dollar and the field's own definition string are present. One rule, applied at every one of the four places a reference could appear.

At design time that means: **no Medicare reference mark ships on this page in v1.** The `186%` and `176%` figures are held, but the label definition and the fee-schedule dollar are not, so they do not print. That is the honest v1 and it is one build-step away from being wrong in the other direction.

### The field: what it is, how it is built, why it is in flow

The canvas is **not** a background texture. Its x axis is **the same $1,400 axis as bar 1 directly above it**, same inline size, same insets. Bar 1 is the summary. The field is the evidence. They share one ruler.

**It is in flow with a build-reserved height, and that is a deliberate delta from the motion system.** Reason: an out-of-flow field is ornament; an in-flow field aligned to the bar is evidence, and the CLS guarantee survives because the box is reserved at first paint by a build-emitted custom property, not created at runtime.

```css
.field{ position:relative; block-size:var(--field-h); margin-block-start:24px }
@media (max-width:767.98px){ .field{ display:none } }   /* base, so mobile reserves nothing */
.field__cv{ position:absolute; inset:0; opacity:0; pointer-events:none }
```

**When JS is off**, the wrapper is not empty and does not claim a graphic that is not there. It renders the axis baseline plus **three real DOM ticks** at 18.429% / 42.071% / 93.500% labelled `$258 p25`, `$589 median`, `$1,309 p75`. Those are true with or without a canvas, and they double as the axis annotation the design wanted anyway. When the script runs it draws the 241 marks over them and dims the ticks to their labels.

**Build step, one JSON, assertion fails the build:**

```
241 points, q_i = i/240. Each point is the empirical quantile of the real 313,579-observation
set at q_i, so every mark is an observed rate at a known percentile and the sample reproduces
the published p25/p50/p75 exactly.
if (!(q.length===241 && q[60]===258 && q[120]===589 && q[180]===1309)) throw
```

**Height is set by the data, never the data by the box.** Marks are 5px wide on a 6px column pitch. `--field-h = maxY * pitch + 8`, clamped to `[72px, 180px]`. Pitch ladder: 5 → 4 → 3. If pitch 3 still exceeds 180px the **build fails and a human decides**. The reserved CSS height and the drawn canvas height are asserted equal in CI. DPR clamped to 2: at 1136x180 that is 2272x360x4 = **3.27MB**, under the 6.2MB layer budget.

Two corrections to the motion system's `draw()`: the mark fill is `#0B1415` (the reconciled ramp value, not `#0B1416`), and the ceiling rule is `--control` `#7E8A8A` at full alpha rather than ink at 0.35, so the rule clears the 3:1 non-text floor as a real axis element.

### Motion, hero

| t | Event | Property | Duration | Curve |
|---|---|---|---|---|
| page t=0 | H1, sub, control, provenance, prefilled query, both bars, all figures, `n`, CTA, micro line, field axis + 3 ticks | none | 0 | none |
| LCP entry fires | `requestIdleCallback(import('/j/field.js'), {timeout:400})` | | | |
| 0 to 120ms | canvas container `opacity 0 → 1` | opacity | 120ms | `--ease` |
| 0 to 840ms | per-point delay window `delay_i = 620*(i/240) + 220*r_i` | | | |
| `delay_i` + `dur_i` | each mark rises baseline → stacked y. `dur_i = 180 + 90*(y_i/maxY)`. **x is final from frame one.** | transform on y only | 180-270ms each | LUT of `--ease` |
| ~1080ms | last point lands, a tail mark near $1,400 or in the overflow rail | | | |
| 1080ms | `cancelAnimationFrame`, one final draw, listeners removed, **0 frames for the life of the page** | | | |

Total: ~65 frames at ~1.2ms, ~80ms of main thread spread over 1.08s, entirely post-LCP, self-killing at three consecutive frames over 8ms.

**Below 768 the field does not exist.** `display:none` in base CSS, the script returns before any rAF, no canvas is ever created. Our user is a broker on a phone between meetings; burning battery on a background texture is the opposite of the register we sell.

**Under `reduce`, `update:slow`, `saveData`, `deviceMemory<4` or `hardwareConcurrency<4`:** one `draw(1)`, ~3ms, no rAF ever created. The full graphic and the working probe. Only the arrival is lost, and the arrival was the only thing that was ever motion.

**The trap nobody may "fix":** bar 1 and bar 2 are above the fold, so their `view()` entry range is already consumed at load and they render complete at first paint. That is required. No delay, no `entry-crossing` variant, no JS trigger. **The hero bars are facts and facts are painted at t=0.**

### The demo ceiling, server-side

The public lookup returns **statewide distribution only**: `p25, p50, p75, n, reporting_month, pct_medicare (when both the dollar and the definition are stored), q[241], y[], maxY, pitch, over`. It **never** returns payer-level rates, NPI-level rates, or plan identifiers. The shape of the market is the teaser. Who pays what is the product.

Cap: **10 distinct code+state pairs per rolling 24h**, enforced server-side on IP + fingerprint, never client-side. The arrival result is server-rendered and does not count. The counter is **visible** (`3 of 10 free lookups used today`), because a stated ceiling converts better than a surprise wall. On the 11th the payload carries **no figures at all** and the UI renders §7.8: `Locked` + `Unlock`, dashed `--control` border, 45deg hatch, the word. **Never a blurred or hidden value in the DOM.** If the bytes reach the browser the value is public.

---

## 4. SECTION 2: THE PROBLEM

**Job:** make the spread physically unignorable in one image, then immediately disarm the cherry-picking objection.

**This is the page's one dark band.** `class="section--data"` applies the `[data-theme="dark"]` token block, full-bleed background `#0B1415`, container 1200 inside.

### Layout, 1440

```
eyebrow    12px mono +0.08em --text-3   CPT 70553 · MRI BRAIN WITHOUT CONTRAST · CALIFORNIA
H2         34/1.25/-0.018em, 600        The same scan. The same state. $258 or $1,309.
                                        (48px below)
THE GAP AXIS   full container 1136px, 220px tall
   baseline           1px --control #6C7B7B   (4.23:1. NOT --rule-strong, which is 1.70:1 here
                                               and fails the 3:1 non-text floor. Verified defect.)
   mark p25           2px --accent #70C1C1 at 209.4px, label $258 above, p25 below
   mark p75           2px --accent #70C1C1 at 1062.2px, label $1,309 above, p75 below
   tick median        1px --text-3 at 477.6px, label $589 median, deliberately quieter
   measure line       852.8px between the marks, 1px --accent, end caps
   THE FIGURE         $1,051 at --fs-ratio 72/1.0/-0.028em, 600, --ink, centred on the measure
   under it           5.1x at 34px 600 --accent
   under that         P25 TO P75 SPREAD  12px mono +0.08em --text-3
   right end          $1,400  12px mono --text-3
                                        (40px below)
KILL LINE  --fs-lead 19/1.5, max 52ch, --ink
CONTRAST BAR   the standard .dist component, 99214 TX, same $1,400 ceiling, 52px track
INOCULATION LINE  --fs-body 16/1.5, --text-2
```

### Copy

**Eyebrow:** `CPT 70553 · MRI BRAIN WITHOUT CONTRAST · CALIFORNIA`

**H2:** `The same scan. The same state. $258 or $1,309.`

**The figure block:**

`$1,051`  ·  `5.1x`  ·  `P25 TO P75 SPREAD`

**Caption directly under the axis**, 12px mono `--text-3`:

`The difference between the 25th and 75th percentile contracted in-network rate. Both figures are documented. n = 313,579.`

**The kill line:**

> `Both are documented in-network rates. Both are published monthly under 45 CFR 147.212. The difference has always been public. It has never been readable.`

**Contrast bar micro-label:** `99214 · OFFICE VISIT, ESTABLISHED PATIENT · TEXAS`
**Contrast bar caption:** `p25 $93` · `median $115` · `p75 $149` · `1.6x` · ceiling `$1,400`

**Inoculation line:**

> `Not every code looks like this. That is the point. You cannot tell which is which without the data.`

That line does the work of a defense and an argument at once. It is the honest move and it is also the stronger one.

### 390 and 320

The axis stays horizontal. It is a price axis; rotating it would break the shared ruler with the hero.

- Axis height 156px. Marks at 66.0px / 334.7px (390) and 53.1px / 269.3px (320).
- `$1,051` at `--fs-ratio` 44px, `5.1x` at 19px beneath.
- **Measured overflow fix, required:** the `$1,309` label centred on its mark ends at 361.7px against a 358px container at 390, and 296.3px against 288px at 320. **The p75 label right-aligns to the axis end (`inset-inline-end:0`), the p25 label left-aligns to its mark.** Verified overflow at both widths; it fits without the fix at 768 and 1440.
- H2 at 24/1.25 sets 3 lines at 320. Acceptable, it is the H2 and it is the section's argument.
- The 99214 contrast bar keeps its 13.04px / 10.24px band, both over the 8px floor.

### Motion

| Element | Property | Range | Curve |
|---|---|---|---|
| Section eyebrow + H2 | `opacity` + `translateY(12px)` | `.rv`, `view()` entry 15% → 85% | `linear` |
| Baseline, both marks, both labels, the median tick | **none. Painted at first paint.** | | |
| Measure line | `transform: scaleX(0→1)`, `transform-origin: left center` | `view()` entry 35% → 75% | `linear` |
| `$1,051` and `5.1x` | `opacity 0→1` | `view()` entry 70% → 90% | `linear` |
| 99214 band | `transform: scaleX` | `view()` entry 30% → 80% | `linear` |
| 99214 median rule | `opacity` | `view()` entry 62% → 86% | `linear` |

The measure line is legal because it grows from the fixed $258 anchor to the fixed $1,309 anchor and **no label is attached to the growing edge**. The dollar figure fades, it never counts and it never moves. Under `reduce` or without `animation-timeline`, everything renders complete via `both` fill. Reveal budget consumed: **1 of 6**.

---

## 5. SECTION 3: PROOF

**Job:** prove the spread is structural, across codes and markets, with the observation count on every figure.

**H2:** `The spread is not an anomaly.`
**Eyebrow:** `FOUR CODES · TWO MARKETS · ONE SCALE`
**Sub:** `Four codes, two markets, one scale to $2,200. Every figure carries its observation count.`

**Mandatory axis note**, 12px mono `--text-3`, directly under the sub, because the computation forces it at every width:

> `All four bars share a $2,200 ceiling. Where a band computes under eight pixels the value is carried by the printed figures and the band is a marker.`

### Layout

**1440:** 4-column grid, card = (1200 - 96)/4 = **276px**, pad 24, track **228px**. Cards share edges (`margin-inline-start:-1px`, radius 0 on shared edges) so the four form one lattice, which is what a fee schedule actually is.

**768:** 2x2, card 348, pad 20, track 308.
**390 / 320:** horizontal snap rail. `flex: 0 0 min(78vw, 320px)`, `scroll-snap-type: x mandatory`, `overscroll-behavior-x: contain`. 22vw of the next card stays visible as the affordance. Below 390 `.dist__cap` becomes `grid-template-columns: max-content 1fr`, three rows, the same treatment as `.prov`.

### Card anatomy and every string

```
head left    70553                 mono 15/500 --ink
head left    MRI brain w/o contrast --fs-h4 16/600 --ink
head right   5.1x                   --fs-h2 34/600 --ink, tabular
sub          California · statewide 12px mono --text-3
track        52px, $2,200 ceiling
ceiling      $2,200                 12px mono --text-3, right end
caption      p25 $258   median $589   p75 $1,309
n            n = 313,579            12px mono --text-3
```

| Card | Code | Name string | Market | p25 / p50 / p75 | Ratio | Band @ $2,200 | `n` |
|---|---|---|---|---|---|---|---|
| 1 | `70553` | `MRI brain w/o contrast` | `California · statewide` | `$258` `$589` `$1,309` | `5.1x` | 11.727% → 59.500% | `n = 313,579` |
| 2 | `73721` | `MRI knee w/o contrast` | `California · statewide` | `$154` `$360` `$762` | `4.9x` | 7.000% → 34.636% | `n = 295,270` |
| 3 | `29881` | `Knee arthroscopy` | `California · statewide` | `$671` `$911` `$2,113` | `3.1x` | 30.500% → 96.045% | **`<Figure state="unavailable">`** |
| 4 | `99214` | `Office visit, established` | `Texas · statewide` | `$93` `$115` `$149` | `1.6x` | 4.227% → 6.773% (5.80px) | **`<Figure state="unavailable">`** |

Cards 3 and 4 render `Insufficient public data` in the `n` slot at 13px `--text-2` until the build query supplies the count. **The build gate refuses to publish a card without its `n`.** No card is ever shipped with a borrowed, averaged, or estimated count, and no card is shipped silently missing one.

Percent-of-Medicare is **not printed on any card**, per the single rule in §3: both the stored fee-schedule dollar and the field's own definition string must be present. We hold 186% and 176% as ratios; we do not hold what they are ratios of.

### Motion

The four **cards** do not reveal. Their **data** animates, which is the whole distinction:

```css
.m .p3 .card:nth-child(1) .dist__band{ animation-range: entry 30% entry 80% }
.m .p3 .card:nth-child(2) .dist__band{ animation-range: entry 35% entry 85% }
.m .p3 .card:nth-child(3) .dist__band{ animation-range: entry 40% entry 90% }
.m .p3 .card:nth-child(4) .dist__band{ animation-range: entry 45% entry 95% }
```

`scaleX`, `linear`, `both`, `transform-origin: left center`, anchored at the real p25. Median rules fade at `entry 62% → 86%`. Captions never animate.

Note for the rail: `view()` resolves against the nearest **block-axis** scrollport, which is the root even inside a horizontally-scrolled rail, so all four bands scrub on vertical scroll including the cards off-screen to the right. That is correct behavior and it is why the cards must not carry `.rv`.

Section head gets one `.rv`. Reveal budget consumed: **2 of 6**.

---

## 6. SECTION 4: WHAT YOU DO WITH IT

**Job:** let each of the three roles read one column and know the product is theirs.

**Eyebrow:** `BROKERS · GENERAL AGENTS · SELF-FUNDED EMPLOYERS`
**H2:** `What you do with it.`

**This section does not respond to the segmented control.** The control governs the hero's voice only. Reason: the control persists in `localStorage`, and a returning employer who never sees the broker column loses information about what the product is. Three columns visible at once is also the stronger institutional read.

### Layout

**1440 / 1024:** three columns, `repeat(3, minmax(0,1fr))` inside the container, hairline lattice with shared edges, pad 24. Column = 378.7px at 1440.
**768:** three columns at 240px each. Bullets are short enough.
**390 / 320:** horizontal snap rail, three cards, same rail component as §3.

### Copy, every string

**Column 1**
```
BROKER
H3   Walk into renewal with the market.
     Show a client where their network sits.
     Price a network change before you quote it.
     Bring a number to the carrier meeting.
→    See a rate exhibit
```

**Column 2**
```
GENERAL AGENT
H3   Give every downstream broker the same evidence.
     One data set across your whole book.
     Brand the exhibit and hand it down.
     Answer rate questions without a carrier call.
→    White-label terms
```

**Column 3**
```
SELF-FUNDED EMPLOYER
H3   Know what your plan pays before you renew.
     Read your market at the code level.
     Bring documented rates to a network conversation.
     Check a paid claim against the published distribution.
→    How the data works
```

Bullets are 15px/22px `--ink`, each led by a 1px `--rule-strong` 12px tick, not a bullet glyph, not an icon. Nine words maximum, verb first. No claim here is a savings claim, a recovery claim, or a guarantee.

**Motion.** One `.rv` on the whole 3-up block, not per column. Reveal budget consumed: **3 of 6**.

---

## 7. SECTION 5: THE TOOLS

**Job:** prove this is a product with surfaces, not a report with a chart.

**Eyebrow:** `WHAT SHIPS`
**H2:** `Four tools. One data set.`
**Sub:** `The lookup is free and needs no account. Every tool has a demo you can use before you sign up.`

### Layout

**1440:** 4-column grid, cards 276px, shared-edge lattice.
**768:** 2x2. **390 / 320:** snap rail of 4.

### Cards

| Tool | One line | Badge | Destination |
|---|---|---|---|
| `Rate Lookup` | `Any code, any state. The full distribution with its observation count.` | `FREE · NO ACCOUNT` (accent) | `app.[domain]/lookup` |
| `Payer Comparison` | `The same code across the payers in a market, on one scale.` | `ACCOUNT REQUIRED` (neutral) | `app.[domain]/payers` |
| `Market Table` | `Every code you track, one state, one table. CSV out.` | `ACCOUNT REQUIRED` (neutral) | `app.[domain]/table` |
| `Rate Exhibit` | `A dated, sourced page you hand to a client or a carrier.` | `PDF · CSV` (neutral) | §7 anchor, then the app |

Every badge carries a **word**. No colored dot alone anywhere on this page.

**Footer line under the grid**, 14px `--text-2`:
`Every tool lives on the app. This page is where you see what it does.`

That line is rule 13 made into copy rather than into a policy nobody reads.

> **BUILD BLOCK, not a suggestion.** Every tool name, route, gate and demo claim in this section must be verified against the shipped app before publish. A named tool that does not exist is a rule 7 violation, and "every tool has a demo" is only publishable once every one of the four does.

**Motion.** One `.rv` on the 4-up block. Card hover: `border-color → --ink`, `transform: translateY(-1px)`, 120ms `--ease`, inside `@media (hover:hover) and (pointer:fine)`. No shadow, no lift beyond 1px; the lattice is the metaphor and a floating card breaks it. Reveal budget consumed: **4 of 6**.

---

## 8. SECTION 6: WHERE THE NUMBERS COME FROM

**Job:** convert the sophisticated skeptic. This is the section that earns the audience.

**Eyebrow:** `45 CFR 147.212`
**H2:** `Where the numbers come from.`
**Sub:** `Payers publish their negotiated in-network rates every month under federal rule. The files are public, enormous, and unreadable. We read them.`

**Background:** the pre-rendered 96-bin histogram of the real 313,579-observation 70553 California distribution, inline SVG data URI, ~4KB, `opacity: .10`, zero requests, zero JS. Its own one-line `<figcaption>` so it is never mistaken for a readable chart:

`Field: 313,579 observed in-network rates, CPT 70553, California.`

**This is a different graphic from the hero field and the two are never conflated.** The hero is a 241-point quantile sample, one mark per real observation percentile. This is a 96-bin histogram of all 313,579. One build step, two outputs. A lane that renders one with the other's data has shipped a defect.

### Layout

**1440:** left cols 1-7 the pipeline, right cols 8-12 the live provenance block, `position: sticky; top: calc(64px + 24px)` within the section.
**768:** pipeline full width, provenance below it, not sticky.
**390 / 320:** stacked, provenance `<dl>` at `grid-template-columns: max-content 1fr` from 390 up, single column at 320.

### The pipeline, five steps

Numerals `01`-`05` in mono 15/500 `--text-3`, label in 12px mono uppercase `--text-2`, text in `--fs-body` `--ink`. 1px `--rule` between steps.

```
01  SOURCE      Payer machine-readable files, published monthly under 45 CFR 147.212.
02  BASIS       Rates come from the payer's own published file. Not a survey, not a
                claims panel, not a submitted-charge database.
03  NORMALIZE   Codes, place of service and rate basis are aligned so two payers can
                be compared.
04  PERCENTILE  Distributions are computed per code, per state, from the observations
                present. Nothing is imputed.
05  PUBLISH     Every figure ships with its observation count and its reporting month.
```

Step 02 is the differentiator against every claims-based benchmark on the market, and it is a structural fact about the source rather than a claim about us.

### The provenance block, the real component with real values

```
SOURCE            Transparency in Coverage machine-readable files, 45 CFR 147.212
GEOGRAPHY         California, statewide
CODE              70553  MRI brain without contrast
OBSERVATIONS      313,579
REPORTING MONTH   {stored reporting_month field}
BASIS             Documented in-network negotiated rates. Modeled, not guaranteed.
```

Identical strings on all four surfaces: this page, the tool, the CSV header, the PDF header. The exported artifact is self-describing when a carrier's rep reads it six weeks later without us in the room.

**REPORTING MONTH is the stored field.** It is never the ingest date. The build gate fails if the value resolves from an ingest timestamp. A citation on a wrong number is worse than no number.

**Closing line of the section**, 15px `--text-2`, which forward-references §8:

`A rate in one of these files belongs to the contracting entity, not to a named provider. What that means for you is the first item under the limits.`

**Motion.** One `.rv` on the section head. The pipeline steps do not reveal; they are text a skeptic is reading, and staggering them would make them feel sequenced rather than true. The histogram is static, forever. Reveal budget consumed: **5 of 6**.

---

## 9. SECTION 7: THE ARTIFACT

**Job:** show the deliverable. The export is the product. The broker did not come to look at our chart.

**Eyebrow:** `WHAT A CLIENT RECEIVES`
**H2:** `The thing you hand a client.`
**Sub:** `A dated, sourced, single-page exhibit. Generated server-side. Every figure carries its observation count and its reporting month.`

### Layout

**1440:** left cols 1-5 the copy and the three export buttons, right cols 6-12 (686px) **the exhibit rendered as live DOM in a page frame**, `--paper` on a `--surface` section, 1px `--rule-strong`, `--e2`.

**It is not a screenshot and it is not scaled.** The exhibit is the same component the PDF renderer uses, laid out at its natural type sizes for a 686px page width. A screenshot of our own UI is a photograph of a thing we can just ship; a scaled screenshot is 7px unreadable text a screen reader still announces at full. Live DOM is selectable, translatable, keyboard reachable, cannot go stale, and costs zero image bytes.

**390 / 320:** copy first, exhibit below at full container width, same component reflowing.

### Exhibit content, every string

```
[Reddenda | Broker lockup]                                    RATE EXHIBIT

CPT 70553 · MRI brain without contrast
California, statewide · In-network negotiated rates

[distribution track, 52px, ceiling $1,400 printed at the right end]

P25            MEDIAN          P75             SPREAD
$258           $589            $1,309          5.1x

n = 313,579 observations

SOURCE            Transparency in Coverage machine-readable files, 45 CFR 147.212
GEOGRAPHY         California, statewide
CODE              70553  MRI brain without contrast
OBSERVATIONS      313,579
REPORTING MONTH   {stored reporting_month field}
BASIS             Documented in-network negotiated rates. Modeled, not guaranteed.

These are documented in-network negotiated rates published by payers. They are
modeled, not guaranteed, and they are not a quote. No PHI.

Prepared {date} · [domain]/e/{id}
```

The percent-of-Medicare line is **absent** under the single rule in §3.

### Export controls

`Download PDF`  ·  `Download CSV`  ·  `Copy citation`

**The citation string, real and complete:**

```
Reddenda Broker. CPT 70553, MRI brain without contrast, California, statewide.
p25 $258, median $589, p75 $1,309. n = 313,579. Source: Transparency in Coverage
machine-readable files, 45 CFR 147.212. Reporting month: {stored field}.
Retrieved {date}.
```

A broker pastes that into a memo. That is the whole feature.

**Copy interaction:** label swaps in place, `min-inline-size: 11ch` so nothing on the row reflows, `role="status"` announces once, reverts at 1600ms. Failure path is honest: label becomes `Press Ctrl+C`, the citation text is selected, and the live region says `Copy failed. The citation is selected. Press Control C.` No toast, no checkmark draw-on, no color flash.

**PDF and CSV notes, printed under the buttons**, 12px mono `--text-3`:
`PDF is generated server-side with embedded fonts and the same provenance block. CSV carries the same header.`

**Motion.** One `.rv` on the exhibit frame. Reveal budget consumed: **6 of 6. The budget is now spent and no further section reveals.**

---

## 10. SECTION 8: THE LIMITS

**Job:** state plainly what this is not. For this audience the limits section is the highest-converting section on the page.

**Eyebrow:** `WHAT THIS DOES NOT DO`
**H2:** `What this does not do.`
**Sub:** `The limits are part of the product. Here they are.`

### Layout

**1440:** 3 columns x 2 rows, hairline lattice, numerals `01`-`06` in mono `--text-3`, claim in `--fs-h4` 17/600 `--ink`, body in 15/22 `--text-2`.
**768:** 2 x 3. **390 / 320:** stacked, six rows.

**This is the one section that is never a rail.** A limit you have to swipe to find is a limit you hid.

### Copy, every string

```
01  A rate belongs to a contracting entity, not to a doctor.
    Machine-readable files publish rates against a payer's contract, not against a named
    provider's fee schedule. We report the market. We do not tell you what your specific
    physician signed.

02  Published is not paid.
    These are negotiated in-network rates. They are not claims, not allowed amounts after
    adjudication, and not what a member paid at the counter.

03  Coverage is uneven.
    Some codes and markets carry hundreds of thousands of observations. Some carry too few
    to publish. Where the count is below threshold we print the count and publish nothing
    else.

04  Nothing is imputed.
    If a code and a state have no observations, the answer is empty. We do not fill a slot
    with a state average, a specialty average, or a national number.

05  This is not a guarantee and it is not a quote.
    Every figure is modeled, not guaranteed. A contract is negotiated between two parties.
    This data is one input into that conversation.

06  No PHI.
    Nothing here is patient data. The product needs no PHI and does not accept it.
```

Limit 01 is first on purpose. It is the objection every expert reader raises within ten seconds, and answering it before they can is what makes the other five believable.

### Motion

**None. Zero. This is the only section on the page with no motion of any kind, at any width, in any state.**

That is a design decision, not an omission: motion in the honesty section reads as persuasion, and persuasion is the one thing this section must not do. It arrives finished, still, and unadorned.

---

## 11. SECTION 9: THE CLOSE

**Job:** one action, no friction, plus the standing discovery-call path.

### Layout

**1440:** centered, container 1200, content capped at 720px, `--section-y` 128 both sides.
**390 / 320:** full container, left aligned (centered short copy is fine, centered controls at 320 are not).

### Content

```
H2        --fs-d1 64/1.05     Run one on your own book.
Sub       --fs-lead 19/1.5    No account. No PHI required. Ten lookups a day, free.

[ THE QUERY ROW, the identical component from the hero, empty this time ]
  PROCEDURE  [ CPT code or procedure name        ]
  MARKET     [ Select a state                ▾ ]  [ Look up ]

[ Open the full tool ]   [ Book a call ]

micro     Multi-market and portfolio access is scoped on a call.
```

The close **is** the hero's action restated with nothing in the way. It is a second working instance of the same component, and it is the highest-converting close available for this audience because it asks for the thing they already know how to do.

`Book a call` → `calendly.com/reddenda/discovery`. Flagged in §14 if the broker product gets its own routing.

**This page shows no price, anywhere, at any scroll depth.** Reason: the pricing structure is not finalized and the only authority is the live Stripe catalog. A marketing page that hardcodes a number becomes a lie the day the number moves, and this audience checks. The page sells the free lookup and the call. When pricing is finalized, the propagation runbook adds a pricing page; it does not edit this one.

**Motion.** None. The reveal budget is spent and this section is an action, not an argument.

---

## 12. FOOTER

**1440:** four columns, `--surface` fill, 1px `--rule-strong` top, pad-block 48.

```
col 1   [Reddenda | Broker lockup]
        Healthcare rate intelligence for brokers, general agents
        and self-funded employers.

col 2   PRODUCT      Rate Lookup · Payer Comparison · Market Table · Rate Exhibit
col 3   DATA         Sources · Methodology · Limits · Coverage
col 4   COMPANY      About · Contact · Book a call

bottom bar, 1px --rule top, 12px mono --text-3, space-between
   © 2026 TwinFlame Group. A Reddenda product.
   Documented in-network rates. Modeled, not guaranteed. No PHI.
   Privacy · Terms
```

**390 / 320:** single column, the four blocks stacked, links at 44px tap height, bottom bar wraps to three lines.

`A Reddenda product.` is the sibling relationship stated once, in the least promotional place on the page, which is where an institution states it.

---

## 13. PAGE-WIDE LEDGERS

### Motion inventory. If it is not here it is not in the codebase.

| # | What | Property | Duration | Curve | Section | Under `reduce` |
|---|---|---|---|---|---|---|
| 1 | Hero settling field | canvas y only, x final at frame one | 1080ms one shot | LUT of `--ease` | §1, ≥768 only | one static draw |
| 2 | Band disclosure x5 (§2 contrast, §3 x4) | `transform: scaleX` | scrubbed | `linear` | §2, §3 | complete bar |
| 3 | Median rule fade x5 | `opacity` | scrubbed | `linear` | §2, §3 | visible |
| 4 | Gap measure line | `transform: scaleX` | scrubbed | `linear` | §2 | complete |
| 5 | `$1,051` / `5.1x` fade | `opacity` | scrubbed | `linear` | §2 | visible |
| 6 | Section reveal, **exactly 6** | `opacity` + `translateY(12px)` | scrubbed | `linear` | §2,3,4,5,6,7 | final state |
| 7 | Progress bar | `transform: scaleX` | scrubbed | `linear` | root | hidden |
| 8 | Header film | `opacity` | 120ms | `--ease` | header | instant |
| 9 | Hover: button, card, input | `border-color`, `transform` | 120ms | `--ease` | all, fine pointer only | instant |
| 10 | Press | `transform: scale(.985)` | 120ms | `--ease` | all | instant |
| 11 | Focus ring | `outline` | **0ms** | none | all | identical |
| 12 | Segmented thumb | `transform: translateX` | 120ms | `--ease` | §1 | instant |
| 13 | Listbox enter | `opacity` + `translateY(4px)` | 120ms | `--ease` | §1, §9 | instant |
| 14 | Mobile sheet | `opacity` + `translateY(-8px)` | 240ms in / 180ms out | `--ease-enter` / `--ease-exit` | header | instant |
| 15 | Query dim | `opacity → .55` | 120ms | `--ease` | §1, §9 | instant |
| 16 | Loading pulse | `opacity 1 → .55` | 1400ms loop | `(.4,0,.6,1)` | §1, §9 | static `.6` |
| 17 | Copy confirmation | text swap | **0ms** | none | §7 | identical |
| 18 | Result arrival | none | **0ms** | none | §1, §9 | identical |
| 19 | §8 limits | none | none | none | §8 | identical |

Zero `scroll` listeners. Zero `pointermove` listeners. Zero count-ups. Zero cross-dataset tweens. Zero pins, parallax, smooth-scroll library, WebGL, or hero video.

### Query state machine, §1 and §9

| t | What happens |
|---|---|
| submit frame | bars and figures dim to `.55` over 120ms. Figures switch to `loading`: `$---`, `--,---`, `-.-x`, same character count, same tabular width, zero shift. Pulse starts. Controls stay live. The field goes to `.55` and does **not** re-run its settle. |
| in flight | the pulse is the only motion. Under `reduce`, static `opacity:.6`, so an in-flight query is still visibly in flight. |
| arrival | new band geometry, new markers, new figures, new `n`, new provenance, new field frame, **all in one paint, no transition**. Container back to `opacity:1` over 120ms. |
| no data | `Insufficient public data`, or `n below publication threshold (n = 47)` with the real count. Track fills `repeating-linear-gradient(45deg, var(--rule) 0 2px, transparent 2px 4px)`, no marks, no field. |
| over the ceiling | `Locked` + `Unlock`, value **absent from the payload and absent from the DOM**. |

**The shared-scale guard.** If a query changes the axis ceiling while two bars are visible, both bars' geometry **and both printed ceilings** are recomputed and repainted in the same frame. One frame with two visible bars on different scales is a lie and it passes every assertion.

### `<Figure>` states used on this page

`loading` `$---` · `ready` `$589` · `unavailable` `Insufficient public data` · `suppressed` `n below publication threshold (n = 47)` · `locked` `Locked` + CTA, value never in the DOM.

`Insufficient public data` appears on the **public marketing page**, not only in the tool, on §3 cards 3 and 4. A broker who has been handed a confident wrong number by a vendor reads that string as the signal that we are the ones telling the truth.

### Build gates for this page

| Gate | Value |
|---|---|
| Arrival figures in raw HTML, JS disabled | all 9 strings present |
| LCP | < 1200ms, 390x844, 4x CPU, Slow 4G |
| CLS | **0.00 exactly**, including after `--field-h` reserves |
| INP | < 200ms |
| TBT after LCP | **0ms** |
| DOM nodes | < 1500 |
| Transfer, first view | < 400KB |
| JS gzipped, entry chunk | < 40KB. `field.js` must not be reachable from it. |
| `field.js` gz / field JSON | ≤ 2.6KB / ≤ 1.8KB |
| Font bytes | 104KB, 1 file, **0 third-party origins** |
| Third-party scripts, whole page | **0** |
| `window.scrollX` after `scrollTo(9999,0)` | 0 at 320/360/390/414/768/1024/1440/1920 |
| Running time-based animations at load + 1200ms | **0** |
| Contrast gate, light set + the §2 dark remap | 0 failures |
| CVD gate, min pairwise ΔE | ≥ 0.10, all 3 vision types |
| `tnum` assertion | passes on `$1,309` vs `$1,111` |
| `h1.getClientRects().length` | **2**, both variants, both font states, 4 widths |
| Reserved `--field-h` vs drawn canvas height | equal |
| Every track has a printed ceiling | asserted by selector count |
| Every rendered `n` slot | present or an explicit Figure state, never absent |
| `.dist__ref` present without a stored fee-schedule dollar | **build fails** |

Then look at the screenshots. Press every control: both radio segments by arrow key, the combobox by Up/Down/Enter/Escape, the range probe by arrow and Home/End, all three export buttons, the rails by touch drag, the mobile sheet, the 11th lookup. Force all five Figure states at 320px. Emulate `reduce` and confirm every band, marker, measure line and reveal renders finished, nothing invisible, nothing mid-flight. Disable `animation-timeline` and confirm the same. **Read the computed `line-height` on `h1` at 320/390/768/1440 and assert 1.28 / 1.28 / 1.14 / 1.05.**

---

## 14. DEFECTS FOUND IN THE INPUT SPEC, AND OPEN DECISIONS

**Five defects found while computing this page. All are fixed above; all should be corrected upstream.**

1. **Technique Library §3.1's sample markup ships the exact `--ref` back-computation §3.1 bans.** `--ref:22.62%` on a $1,400 axis is `589 ÷ 1.86 = $316.68`. Any lane copying that markup ships a rule 1 violation. **Delete `--ref` from the sample.**
2. **`--rule-strong` `#303F40` on the dark canvas measures 1.70:1** and cannot be an axis baseline. The §2 price axis uses `--control` `#6C7B7B` (4.23:1). Anywhere a dark-theme rule carries meaning rather than decoration, `--rule-strong` fails the 3:1 floor.
3. **"The max is printed once at the axis" fails at a section boundary.** §2's $1,400 bar and §3's $2,200 card are co-visible in one 900px viewport. Every track on this page prints its own ceiling.
4. **The 320x568 fold budget uses a 48px header; the brand system specifies 56px below 768.** The budget is 8px optimistic before anything else is counted. Recomputed above at 56px: 525px with the CTA at the fold line.
5. **The fold budget assumes a 14px hero sub while the type scale specifies `--fs-lead` 17px at 320.** At 17px the sub sets 3 lines in a 288px column and breaks the fold by 36px. Resolved with a documented sub step at 390.

**Also flagged, not defects:** the §3 four-code panel's 99214 band is under 8px at **every** width, so the axis note is mandatory rather than conditional. And `$1,309` centred on its p75 mark overflows the container at both 390 and 320, measured, so §2's extreme labels are edge-aligned.

**Four decisions that are David's, not mine:**

- **The dark band in §2.** Rule 5's light-only binds `reddenda.com`. This is a new domain, one section, and the remap is literally the dark token block. If he says no, delete one class; nothing else changes.
- **The lockup.** Canonical Reddenda mark, unmodified, plus a divider and the word `Broker`. Rule 5 says the canonical logo is identical everywhere; this preserves the mark and adds a sibling word beside it.
- **The booking link.** `calendly.com/reddenda/discovery` is the estate's link. If Reddenda Broker gets its own routing, swap it in one place.
- **The domain.** Every route above is `[domain]` and `app.[domain]`. Nothing is hardcoded.

**Estimates that are not measurements, stated as such:** every line count in the fold tables is computed from the type tokens using average glyph advance, not measured in a browser. All of them must be confirmed by reading `getClientRects().length` at 320 / 390 / 768 / 1440 before ship. The position percentages, band pixel widths, gap dollars, ratios and contrast ratios are computed exactly and are in `mk.py`.


# APP SHELL AND STRUCTURE

# REDDENDA BROKER: APP SHELL AND SUITE STRUCTURE

## 0. THE ARCHITECTURE IN ONE LINE

**One workspace, one market, six lenses.** The market (`geo` + `code` + `month`) is the state of the application. A tool is a lens on it. Switching lens never touches the market, and the market is never off screen.

That single decision is what makes the user un-lost, and every rule below is downstream of it.

---

## 1. INFORMATION ARCHITECTURE AND ROUTE MAP

### 1.1 The six tools. One word each, because the rail is 64px.

| Rail label | Job, one line | Varies | Pins |
|---|---|---|---|
| **Rate** | One code, one market, the distribution. Default. | nothing | geo, code |
| **Payers** | The same code and market, split by reporting entity. | entity | geo, code |
| **Markets** | The same code, across geographies. | geo | code |
| **Basket** | A set of codes, weighted, priced in one market. | code set | geo |
| **Spread** | One market, codes ranked by dispersion. Where steerage is worth most. | code | geo |
| **Source** | The files, entities and months behind the number. | file | geo, code |

**Exhibit** is not a lens. It is the output, and it lives on its own route.

### 1.2 Route map

The market lives in the **path**, not the query, so switching tool is a segment swap and every URL is a paste-able screen.

| Route | Screen | Title tag | Min tier | Notes |
|---|---|---|---|---|
| `/` | Console | `Reddenda Broker` | anon | First run, recent markets, saved |
| `/t/rate/:geo/:code` | Rate | `70553 · California · Rate · Reddenda Broker` | anon | Canonical entry |
| `/t/payers/:geo/:code` | Payers | `70553 · California · Payers · …` | account | Entity identity is gated |
| `/t/markets/:code` | Markets | `70553 · Markets · …` | account | `?g=CA,TX,FL&focus=CA` |
| `/t/basket/:geo/:basket` | Basket | `Imaging bundle · California · Basket · …` | account | `:basket` = slug or `new` |
| `/t/spread/:geo` | Spread | `California · Spread · …` | paid | `?cat=imaging&hl=70553` |
| `/t/source/:geo/:code` | Source | `70553 · California · Source · …` | anon | Provenance is never gated |
| `/exhibits` | Exhibit list | `Exhibits · …` | account | |
| `/exhibit/:id` | Exhibit | `{name} · Exhibit · …` | paid | Light theme forced |
| `/exhibit/:id/p/:token` | Client view | `{name}` | public link | Read only, no chrome, no rail |
| `/saved` | Saved markets and baskets | `Saved · …` | account | |
| `/coverage` | What we hold, by state and month | `Coverage · …` | anon | |
| `/method` | Methodology | `Method · …` | anon | |
| `/changelog` `/status` | Index history, service state | | anon | |
| `/account` `/plan` `/team` `/api` `/exports` `/prefs` | Account | | account | |
| `/signin` `/join` `/verify` | Auth | | anon | |

**Geo grammar:** `CA` state · `CA-31080` CBSA · `TX-750` ZIP3. One parser, one display formatter, `California` / `Los Angeles, CA (CBSA 31080)` / `Dallas 750xx, TX`.

**Redirects, permanent, server-side:** `/t/rate/CA` → `/t/rate/CA/70553` (last code from session, else the console). `/t/:tool` with no market → `/` with `?next=`. `/rate/*` legacy → `/t/rate/*`. Never a client-side redirect, it breaks Back.

### 1.3 Depth is 1. There is no second level.

Row detail is a query parameter (`?row=<entity_id>`), not a route. It opens the detail rail, it is shareable, and Back closes it. There is no breadcrumb because there is nothing to climb out of.

### 1.4 The six "never lost" laws

1. The market is on screen at every width and at every scroll position.
2. Switching tools never changes the market.
3. **The app never changes the market on the user's behalf.** If a tool has no data for the current market, it says so and stays put.
4. Every route restores the same screen from a pasted URL.
5. Back returns to the previous market or the previous tool. Never to a modal. Never a re-fetch. bfcache is preserved: no `unload`, no `beforeunload`, no unload beacon.
6. Every number carries its `n` and its reporting month within two elements of itself.

---

## 2. NAVIGATION

Two orthogonal axes. **The rail is which lens. The header is which data.** Nothing else navigates.

### 2.1 App header. 56px constant, all widths.

**Delta from the brand system §3.1, stated so nobody re-litigates it: the tool header is opaque, not a translucent film.** A blur over a scrolling rate table costs a full strip readback per frame and it lowers the contrast of the thing the product exists to show. The film is a marketing device.

| Property | Light | Dark |
|---|---|---|
| Fill | `--paper` `#FFFFFF`, opaque | `--paper` `#121D1E` |
| Bottom rule, at rest | `1px solid --rule-strong #D2D7D7` | `1px solid #303F40` |
| Scrolled | rule plus `--e1` `0 1px 0 rgb(11 20 21 / .14)` | rule only |
| Height | 56px, never animates | same |
| Workspace canvas beneath | `--canvas` `#F7F8F8` | `--canvas` `#0B1415` |

**Contents, ≥1280:**

```
[mark 24 + "Reddenda Broker" 14/600 --ink] │ [geo combobox] [code combobox]  ⟶flex⟶  [⌘K 32] [Export 32] [avatar 32]
```

**Contents, 768 to 1279:** the two comboboxes collapse into one **market button** that opens the market popover.
**Contents, below 768:** `[⌕ 44] [market button, flex] [avatar 44]`. No wordmark. The wordmark heads the More sheet. In the tool, the market is the identity; the logo is not.

**Market combobox chips, exact:**

| | Value |
|---|---|
| Height | 32px (≥768), 40px in the popover, 44px below 768 |
| Fill | `--surface` `#F7F8F8` / dark `#1A2627`. Recessed, reads as an input. |
| Border | `1px solid --control #7E8A8A` (3.57 on paper) / dark `#6C7B7B` (3.90) |
| Radius | `--r-ctl` 6px |
| Text | `--ink`, geo in 14px sans 500, code in `--mono` 14/500 then descriptor 13px sans `--text-2` |
| Min width | geo `132px`, code `200px` |
| Hover | border `--control-hover #5A6A6B` / dark `#8B999A` |
| Focus visible | `outline:2px solid #0F5C5C; outline-offset:2px` / dark `#70C1C1` |
| Open | border `--accent #0F5C5C`, chevron rotates 180deg, `transform` only, `--d-fast` |
| Chevron | 16px, `--text-2`, `pointer-events:none`, inset-end 10px |

Chip label strings: `California`, `70553 MRI brain`. Truncation is `text-overflow:ellipsis` on the descriptor only. The code never truncates.

**Month is not in the header.** A reporting month is provenance, not navigation. It lives in the market popover and it prints in the result header and the source line.

### 2.2 The rail. Tool switching, ≥1024.

| Width | Form | Size |
|---|---|---|
| ≥1280 | Expanded sidebar | 240px |
| 1024 to 1279 | Icon plus printed label rail | 64px |
| 768 to 1023 | Horizontal tab strip under the header, 44px, `overflow-x:auto`, `scroll-snap-type:x mandatory` | full width |
| <768 | Bottom tab bar, 4 items plus More | 56px plus safe area |

Toggle `[` at ≥1024, persisted to `localStorage['rb.rail'] = 'wide' | 'rail'`.

**Rail is never icon-only.** 64px carries `MARKETS` at 11px mono `+0.08em` (51px) inside 56px of usable width. Icons alone fail 1.4.1 and fail this audience.

```css
:root{ --app-hdr:56px; --rail:64px; --side:240px; --detail:360px; --ctl-h:48px }
@media (max-width:767px){ :root{ --ctl-h:44px } }

.app{ display:grid; grid-template-columns:var(--side) minmax(0,1fr); min-block-size:100dvh }
@media (max-width:1279px){ .app{ grid-template-columns:var(--rail) minmax(0,1fr) } }
@media (max-width:1023px){ .app{ grid-template-columns:minmax(0,1fr) } }

.rail{ position:sticky; top:var(--app-hdr); block-size:calc(100dvh - var(--app-hdr));
  background:var(--paper); border-inline-end:1px solid var(--rule);
  display:grid; grid-template-rows:auto 1fr auto; z-index:var(--z-rail) }
```

`100dvh`, never `100vh`. The iOS URL bar makes `100vh` a 60px lie.

**Rail item states, exact:**

| State | Light | Dark |
|---|---|---|
| rest | icon `--text-2 #5A6A6B`, label `--text-2` (5.66 on paper), fill none | `#9BAAAB` (7.16) |
| hover | fill `--surface #F7F8F8`, icon and label `--ink #0B1415` | fill `#1A2627`, `#F2F5F5` |
| pressed | fill `--accent-tint #E6F3F3` | fill `#163333` |
| **current** | fill `--accent-wash #F4FAFA`, label `--ink` weight **600**, icon `--accent #0F5C5C`, **3px inset-inline-start bar `--accent`**, `aria-current="page"` | fill `#112928`, label `#F2F5F5`, icon and bar `#70C1C1` |
| focus visible | `outline:2px solid #0F5C5C; outline-offset:-2px` (inset, the rail is too narrow for an outer ring) | `#70C1C1` |
| disabled | **not shipped.** A tool that cannot run renders an empty state, not a grey nav item. | |

Never current-by-color-alone: current carries weight 600 plus the 3px bar plus `aria-current`.

**Item geometry.** Rail 64px: 56px tall, icon 20px, gap 4, label 11px mono uppercase `+0.08em`, centered. Expanded 240px: 40px tall, padding-inline 12, icon 20, gap 12, label 14px sans 500, trailing count badge (`Basket 12`) and a trailing `--text-3` mono digit hint (`1`..`6`) for the `g` chord.

**Expanded rail contents, top to bottom:**
```
Rate      1
Payers    2
Markets   3
Basket    4   [12]
Spread    5   LOCKED
Source    6
─────────── --rule
Saved         [7]
Exhibits      [3]
─────────── flex
Coverage
Method
```
`Spread` on a free account shows the `LOCKED` badge (§7.7 locked variant, `#F1F5F5` / `#5A6A6B` plus 45deg hatch) and remains fully clickable. It navigates and renders the gated state. A nav item that refuses to navigate is a dead control.

### 2.3 Mobile navigation, below 768

**Bottom tab bar**, opaque `--paper`, top rule `1px --rule-strong`, `padding-bottom: env(safe-area-inset-bottom)`, height 56px.

`Rate · Payers · Markets · More`

| State | Light | Dark |
|---|---|---|
| rest | icon and label `--text-2 #5A6A6B` (5.66 on opaque paper) | `#9BAAAB` |
| current | icon and label `--ink` weight 600, **2px top bar `--accent #0F5C5C`**, `aria-current="page"` | `#F2F5F5`, bar `#70C1C1` |
| pressed | fill `--surface` | fill `#1A2627` |

Label 11px mono uppercase `+0.08em`. Tap target is the full 56px column, minimum 44px wide.

**More sheet** (`<dialog>` bottom sheet, `translateY(100%) → none`, 240ms `--ease-enter`): wordmark, then `Basket`, `Spread`, `Source`, divider, `Saved`, `Exhibits`, divider, `Coverage`, `Method`, `Theme: Light / Dark / System`, `Account`, `Sign out`. Items 56px, dividers `1px --rule`.

**No hide-on-scroll on either bar.** It costs the user the nav at the moment they reach for it.

`scroll-padding-block-end: calc(56px + env(safe-area-inset-bottom))` on `html` so keyboard focus never lands behind the bar.

### 2.4 How the market persists. The exact mechanism.

**Source of truth is the URL path.** Everything else is a mirror.

| Event | History op | Why |
|---|---|---|
| Tool switch | `pushState`, path segment 2 swapped, market segments copied verbatim | Back returns to the previous lens |
| Market change (geo or code) | `pushState` | Back returns to the previous market. This is what a broker expects. |
| Refinement (rate type, billing class, sort, min n) | `replaceState`, query only | Back is not a filter undo stack |
| Row detail open and close | `pushState` `?row=` then `back()` on close | Escape and the browser Back both close it |

```js
// the only navigation primitive in the app.
const TOOL_SHAPE = {
  rate:   ['geo','code'], payers: ['geo','code'], source: ['geo','code'],
  markets:['code'],       basket: ['geo','basket'], spread: ['geo'],
};
function toTool(tool, m){                    // m = current market, always complete
  const seg = TOOL_SHAPE[tool].map(k => m[k]);
  const q   = new URLSearchParams();
  if (tool === 'markets' && m.geo)  q.set('focus', m.geo);   // the varied axis becomes focus
  if (tool === 'spread'  && m.code) q.set('hl',    m.code);  // the varied axis becomes highlight
  return `/t/${tool}/${seg.join('/')}${q.size ? '?' + q : ''}`;
}
```

**The header chip contract, one sentence:** the header chips are always honored, **as a pin where the tool pins and as a highlight where the tool varies.** In `Markets`, the geo chip sets `?focus=` and that row is the one drawn in `--accent`. In `Spread`, the code chip sets `?hl=` and that row is the one scrolled into view and outlined. The chip never becomes disabled, never changes meaning, never disappears.

**Mirror, restore, and one deliberate omission:**
- `localStorage['rb.market'] = {geo, code, month, ts}`, written on every `pushState`. Read only by `/` and by a tool route arriving without segments.
- Server-side `recent_markets`, max 20, when signed in. Feeds the console, the palette and the market popover.
- **No `BroadcastChannel`, no cross-tab sync.** Two tabs on two markets is the primary comparison workflow for this audience. Syncing them would destroy it silently.

**Deep link with a market that has no data:** render the tool, render the market intact in the header, render the `no data for this market` state in the canvas. Never rewrite the URL to a market that does have data. Law 3.

### 2.5 Market popover and sheet

Anchored popover at 768 to 1279 (`360px`, `--e2`, `--r-md` 8px), bottom sheet below 768 (`--r-modal` 16px 16px 0 0).

```
MARKET
Geography   [California                    ▾]
Code        [70553  MRI brain              ▾]
Reporting   [July 2026                     ▾]   Latest indexed
────────────────────────────────────────────
RECENT
70553 · California          Jul 2026
73721 · California          Jul 2026
99214 · Texas               Jul 2026
────────────────────────────────────────────
[Cancel]                              [Apply]
```

`Apply` is one `pushState`. `Cancel` and Escape discard. Focus moves to the geo field on open and returns to the chip on close. `inert` on `<main>` while the sheet is open.

### 2.6 Focus, announcement and skip links

A tool switch is a route change with no page reload, so focus and announcement are manual or a screen reader user is stranded.

```js
// after every route commit
document.title = `${code} · ${geoLabel} · ${toolLabel} · Reddenda Broker`;
h1.focus();                                   // <h1 tabindex="-1">, no visible outline shift
routeLive.textContent = `${toolLabel}. CPT ${code}, ${geoLabel}.`;   // aria-live="polite"
```

Skip links, first two tabbables, visually hidden until focused: `Skip to results` → `#ws`, `Skip to tools` → `#rail`.

### 2.7 Route transitions

| Navigation | Transition |
|---|---|
| Tool switch inside the workspace | **None. 0ms.** The header and rail persist, only the canvas swaps. This is a lens change on the same data, which is motion inventory row 20. |
| `/` ↔ tool, `/exhibit`, `/account` | 140ms root cross-fade, `--ease`, `@view-transition` |
| Back and forward | Instant, always, bfcache |

`view-transition-name` is never applied to a `.fig`, a `.dist`, or a `<td>`. A morphing figure is a count-up with extra steps.

**The tool bundle contains zero scroll-driven animation.** Not gated, not reduced. Absent.

---

## 3. THE WORKSPACE GRID

Every tool inherits four regions in one order. This is what makes six tools feel like one product.

```
┌──────────────────────────────────────────────┐
│ RESULT HEADER   what you are looking at      │  reserved height, 0 CLS
├──────────────────────────────────────────────┤
│ CONTROL ROW     ≤ 4 refinements, sticky      │  48 / 44
├──────────────────────────────────────────────┤
│ CANVAS          the lens                     │  minmax(0,1fr), container
├──────────────────────────────────────────────┤
│ PROVENANCE      source, month, n, export     │  always visible, always prints
└──────────────────────────────────────────────┘
```

### 3.1 One scroll container

**The page scrolls. Nothing nests.** Nested scrollers break find-in-page, break print, and break momentum on iOS. The rail is `position:sticky`, the header is `position:sticky`, the control row is `position:sticky`, the table head is `position:sticky`. Four stickies, one scroll.

```css
:root{ --z-rail:20; --z-detail:25; --z-thead:30; --z-ctl:40; --z-hdr:50;
       --z-pop:60; --z-sheet:70; --z-modal:80; --z-toast:90 }
html,body{ overflow-x:clip }            /* clip, never hidden. hidden kills every sticky */
html{ scrollbar-gutter:stable;
      scroll-padding-block:calc(var(--app-hdr) + var(--ctl-h) + 8px) calc(56px + env(safe-area-inset-bottom)) }

.hdr  { position:sticky; top:0;              z-index:var(--z-hdr) }
.ctl  { position:sticky; top:var(--app-hdr); z-index:var(--z-ctl);
        block-size:var(--ctl-h); background:var(--canvas);
        border-block-end:1px solid var(--rule); container-type:scroll-state }
.thead{ position:sticky; top:calc(var(--app-hdr) + var(--ctl-h)); z-index:var(--z-thead) }

@container scroll-state(stuck: top){
  .ctl{ --ctl-h:40px; box-shadow:0 1px 0 rgb(11 20 21 / .14) }
}
.ctl,.ctl *{ transition:none }   /* load bearing. block-size is layout. one relayout, zero frames. */
```

### 3.2 Measured widths

| Viewport | Rail | Main | Gutter | Content | Detail rail |
|---|---|---|---|---|---|
| 320 | bottom bar | 320 | 16 | **288** | sheet |
| 390 | bottom bar | 390 | 16 | **358** | sheet |
| 768 | tab strip | 768 | 24 | **720** | sheet |
| 1024 | 64 | 960 | 24 | **912** | sheet |
| 1280 | 240 | 1040 | 32 | **976** | sheet |
| 1440 | 240 | 1200 | 32 | **1136** | push 360 → **776** |
| 1920 | 240 | 1680 | 40 | **1600** (`--table-max`) | push 360 → **1240** |

### 3.3 Container queries, not viewport queries

The canvas is the container. That is why opening the detail rail at 1440 correctly compacts the payer table without a second breakpoint set.

```css
.ws{ container-type:inline-size; container-name:ws;
     inline-size:100%; max-inline-size:var(--table-max); margin-inline:auto;
     padding-inline:var(--gutter) }
@container ws (min-width:560px){  /* figure strip 3-up → 5-up */ }
@container ws (min-width:840px){  /* payer table compact → full */ }
@container ws (min-width:1120px){ /* distribution and table side by side */ }
```

Caveat that will bite someone: `container-type` establishes a containing block for absolutely and fixed positioned descendants. **No `position:fixed` inside `.ws`.** Toasts, popovers and dialogs are portaled to `<body>`.

### 3.4 Detail rail

`?row=<entity_id>`. **Push at ≥1440. Bottom sheet below 1440.** Two forms, not three.

360px, `--paper` fill, `border-inline-start:1px solid --rule`, sticky, `block-size:calc(100dvh - var(--app-hdr))`, own `overflow-y:auto` with `overscroll-behavior:contain`. This is the one permitted nested scroller and it holds no table.

Opening it is a layout change, not an animation. The distribution is DOM plus CSS custom properties, so both bars and the printed axis maximum recompute in the same frame. **A single frame in which two visible bars sit on different scales is a lie.**

### 3.5 The 320 × 568 first screen, computed

| Block | px |
|---|---|
| App header | 56 |
| Result header (reserved) | 176 |
| Control row | 44 |
| Distribution card (16 pad + 16 caption + 8 + 44 track + 8 + 16 axis + 16 pad) | 124 |
| **Subtotal** | **400** |
| Viewport minus bottom bar (568 − 56) | 512 |
| **Canvas visible below the fold line** | **112** = 2.5 rows at 44px |

Result header reserve, computed: 32 pad + 16 eyebrow + 4 + 30 title + 12 + 50 figure strip + 12 + 16 meta = **172**, reserved at **176**. At ≥768 it is **210**. Reserved with `min-block-size`, so `loading → ready` is CLS 0.00.

---

## 4. SHARED COMPONENTS

Seven. Every tool composes from these and adds nothing that renders a number.

### 4.1 Market selector (geo)

`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`. Listbox per brand §7.3.

Groups, in order: `Recent` · `States` · `Metro areas (CBSA)` · `ZIP3`.
Search matches on name, postal abbreviation and CBSA code. Debounce 140ms, min 1 char for states, 2 for metros.

Row: `California` left, `CA` right in `--mono` 13px `--text-3`. Metro row: `Los Angeles, CA` left, `31080` right.

Empty: `No market matches "wyomming".` Not a spinner, not a dash.
Coverage-aware: a geo we hold no files for renders with a `NO DATA` neutral badge and stays selectable. Law 3.

### 4.2 Code selector with search

Two inputs in one control: the code field accepts a code directly, the same field accepts prose.

| Input | Interpreted as |
|---|---|
| `70553` | exact code, jump |
| `705` | code prefix |
| `mri knee` | descriptor search |
| `mri knee ca` | descriptor search, trailing geo token sets the geo chip too |

Row: `70553` in `--mono` 15/500 `--ink`, descriptor 14px sans `--ink`, right-aligned `--mono` 12px `--text-3` observation count for the current geo, `313,579`.

Groups: `Recent` · `Imaging` · `Surgery` · `Evaluation and management` · `Lab` · `All`.

Keyboard: Up, Down, Home, End, Enter, Escape, Tab, and type-ahead inside the open list.

**CPT descriptor licensing, flagged once because it is a real product gate.** CPT code descriptors are AMA copyright and require an executed AMA data file license for display or redistribution. The component reads descriptors from `code_dim.descriptor_short`, which is populated only when the license flag is set. Unlicensed build: the row renders `70553` alone, search falls back to code prefix only, and the descriptor slot renders nothing. Not a placeholder. Not a guess.

### 4.3 Result header

```html
<header class="rhdr">
  <p class="eyebrow"><span class="cpt">CPT 70553</span>
     <span class="desc">MRI brain, without and with contrast</span></p>
  <h1 tabindex="-1">California</h1>
  <div class="figs">
    <div class="tile"><span class="micro">P25</span>    <span class="fig num">$258</span></div>
    <div class="tile"><span class="micro">MEDIAN</span> <span class="fig num">$589</span></div>
    <div class="tile"><span class="micro">P75</span>    <span class="fig num">$1,309</span></div>
    <div class="tile"><span class="micro">SPREAD</span> <span class="fig num">5.1x</span></div>
    <div class="tile"><span class="micro">VS MEDICARE</span><span class="fig num">186%</span></div>
  </div>
  <p class="meta n">n = 313,579 · reporting month 2026-07</p>
</header>
```

Type: eyebrow `CPT 70553` in `--fs-micro` mono uppercase `--text-2`, descriptor 13px sans `--text-2`. Title `--fs-h2` 24 / 30 / 34, 600, `--ink`. Tile value `--fs-ratio` capped **30 / 40 / 44**, tabular, `--ink`. Meta `--fs-n` 12px mono `--text-3`.

Figure strip is 3-up below `@container ws (min-width:560px)` (P25, MEDIAN, P75) with `SPREAD` and `VS MEDICARE` demoted to badges. 5-up above.

**`VS MEDICARE` renders only when the stored fee-schedule field exists.** We hold it for 70553 (186%) and 73721 (176%). We do not hold it for 29881 or 99214, so that tile is **not rendered at all** and no reference line is drawn on the distribution. Absent, not zero, not dashed.

Badges, right-aligned in the eyebrow row: `VERIFIED SOURCE` (accent) · `PARTIAL` (caution) · `STALE MONTH` (caution) · `LOCKED` (locked). Every badge carries a word.

### 4.4 Distribution display

Brand system §7.9 verbatim. Tool-specific additions:

- **The axis ceiling is a stored server field**, `axis_ceiling`, returned by the same query. Never computed client-side from displayed values. Rate tool for 70553 CA: `1400`. Four-code panel: `2200`.
- Every bar on screen shares one ceiling. It is printed once, at the axis, right aligned: `$1,400 max`.
- Axis note when a band computes under 8px: `Band narrower than 8px. Read the printed figures.`
- Off-scale: 40px overflow rail right of a 1px rule, caption reads `+{n} above $1,400, max ${m}` from the stored `over` object.
- Percentile probe: the same `<input type="range">` as the marketing hero. No `pointermove` listener exists anywhere in the app.
- Geometry never transitions. `.dist__band,.dist__median,.dist__ref{ transition:none }` is the guard, not a default.

Real geometry, checked, at ceiling 1400:

| Code | Geo | p25 | p50 | p75 | Spread | left / median / right |
|---|---|---|---|---|---|---|
| 70553 | CA | $258 | $589 | $1,309 | 5.1x | 18.43% / 42.07% / 93.50% |
| 99214 | TX | $93 | $115 | $149 | 1.6x | 6.64% / 8.21% / 10.64% |

### 4.5 Source and freshness line

Always rendered. Never a tooltip. Always prints (`.prov{ display:grid !important }`).

```
SOURCE    Transparency in Coverage in-network rate files, 45 CFR 147.212
ENTITIES  {e} reporting entities · {f} files
MONTH     Reporting month 2026-07 · Indexed 2026-08-01 04:12 UTC
BASIS     Medicare reference: CMS Physician Fee Schedule 2026, locality {l}
          [Copy citation]  [Permalink]  [Method]
```

Label column `--fs-micro` mono uppercase `--text-2`, 96px. Value `--fs-sm` 14px sans `--ink`. `BASIS` row is omitted entirely when the stored reference field is absent.

Citation string, real, copied verbatim:
```
Reddenda Broker. CPT 70553, California, reporting month 2026-07.
p25 $258, median $589, p75 $1,309, n = 313,579.
Source: Transparency in Coverage in-network rate files, 45 CFR 147.212.
Retrieved 2026-08-06. https://…/t/rate/CA/70553?m=2026-07
Rates are modeled from published files, not guaranteed.
```

### 4.6 Export control

Header button, `⌘K` command `>export`, and a duplicate in the provenance row. Opens a modal because it is a deliberate action.

| Format | String | Tier | Notes |
|---|---|---|---|
| Permalink | `Copy link to this view` | anon | Always |
| Citation | `Copy citation` | anon | Always |
| CSV | `Download CSV, current view` | account | No thousands separators inside quoted fields, or Excel coerces `1,309` to text |
| XLSX | `Download Excel, current view` | paid | Tabular figures, frozen header |
| PDF exhibit | `Build exhibit` | paid | Light theme forced, your logo, the provenance block |

States: `idle → building → ready → failed`.
`Building exhibit. This takes about 8 seconds.` `Exhibit ready.` `Build failed. Nothing was charged. Retry, or copy error id RB-{6}.`
Label width pinned with `min-inline-size:14ch` so the row never reflows. `role="status"` announces once. No toast, no checkmark draw-on.

**Never bill a failed generation.**

### 4.7 Gated state

Brand system §7.8. The hard part restated because this is where estates leak:

**A locked value is never rendered into the DOM and hidden.** The server returns a state object with **no `value` key at all**. There is nothing to blur, nothing to inspect, nothing to `curl`.

```json
{ "state":"locked", "reason":"auth", "cta":"account",
  "label":"Payer breakdown", "n_visible": 11 }
```

```html
<div class="fig" data-state="locked">
  <span class="micro">MEDIAN</span>
  <span class="lock"><svg width="14" height="14" aria-hidden="true"></svg> Locked</span>
  <a class="btn btn-tertiary" href="/join?next=/t/payers/CA/70553">Create free account</a>
</div>
```

Fill `--locked-wash #F1F5F5`, text `--locked #5A6A6B` (5.16), `1px dashed --control #7E8A8A`, 45deg hatch. Dark `#1B2222` / `#9BAAAB` / `#6C7B7B`.

**Locked is never `--danger`, never `--caution`.** It is not an error, it is a state of the account.

---

## 5. GLOBAL STATES. REAL COPY, EVERY ONE.

Ten states. Each has a route-level and a region-level form. None uses a spinner over the whole page.

### 5.1 First run, `/` with no history

```
Start with a code and a market.

  [ Code or description        ]  [ Geography     ]  [ Run lookup ]

COMMON STARTS
  70553 · California    MRI brain, without and with contrast
  73721 · California    MRI lower extremity joint, without contrast
  29881 · California    Knee arthroscopy with meniscectomy
  99214 · Texas         Office visit, established patient

Rates are what plans report paying under 45 CFR 147.212.
They are not what a patient is billed. Modeled, not guaranteed.
```

The four starts are markets we hold. They are not decoration, they are the honest coverage floor.

### 5.2 Empty, a tool with nothing selected

```
No codes in this basket.
A basket prices a set of codes across payers in one market.
[ Add a code ]
```
```
No markets to compare.
Add a second geography to compare California against it.
[ Add market ]
```

### 5.3 Loading

`<Figure state="loading">` in every figure slot: `$---`, `--,---`, `---%`, `-.-x`. Same character count, same tabular width, zero shift. Pulse `--d-pulse` 1400ms `opacity 1 → .55`. Under `reduce`, static `opacity:.6`, so an in-flight query is still visibly in flight.

Skeletons are shape-only and never occupy a slot that will hold a number.
One visually hidden `role="status"`: `Loading results.`
Controls stay live. The previous result dims to `opacity:.55` over 120ms and stays readable.

### 5.4 Partial data

Badge `PARTIAL` (caution). Inline, above the table, `--caution-wash #FFF2E3` panel, `--caution #8A5A00` icon and text:

```
{s} of {t} reporting entities are below the publication threshold and are not shown.
The distribution above reflects {v} entities and n = {n} observations.
```

The suppressed rows still render, with the real count printed in the value cell:
`n below publication threshold (n = 47)` in 13px `--text-2`. **The row is not greyed and not removed.**

### 5.5 No data for this market

```
No published rates for CPT 73721 in Wyoming, reporting month 2026-07.

NEAREST MARKETS WITH DATA
  Colorado        n = {n}
  Utah            n = {n}
  Montana         n = {n}

[ Check coverage ]
```

The distribution track fills with `repeating-linear-gradient(45deg, var(--rule) 0 2px, transparent 2px 4px)` and draws no marks. Every figure reads `Insufficient public data`. **Never a zero. Never a dash. Never an average from a neighbouring state.**

### 5.6 Stale

Global, when the current month is indexing:
```
Indexing 2026-08 files. Figures shown are reporting month 2026-07.
```
Per entity, in the table row:
```
STALE MONTH   Latest file for this entity is 2026-05, two months behind.
```
Badge caution. The value still renders, because it is real. The label is what changes.

### 5.7 Error

```
Query failed. Nothing was changed.
[ Retry ]   Error id RB-7F3A21
```

Never "Oops". Never an illustration. The error id is copyable and it matches a server log line. A failed export never charges and says so.

### 5.8 Gated

Inline in the locked slot, never a modal that interrupts a read.
```
Locked. Payer breakdown requires an account.
[ Create free account ]     Free. 25 lookups per day.
```
```
Locked. Spread is on the Broker plan.
[ See plans ]   [ Schedule a call ]
```

### 5.9 Rate limited

```
Daily lookup limit reached. 5 of 5 used. Resets 00:00 UTC.
[ Create free account ]     25 lookups per day, free.
```
The last successful result stays on screen. The limit does not blank the page.

### 5.10 Offline

Toast, `role="status"`: `Offline. Showing the last result loaded at 14:22.`
Provenance line gains a row, permanently while offline:
```
CACHE     Served from this device. Last fetched 2026-08-06 14:22 UTC.
```
Network-dependent controls get `aria-disabled="true"` plus a visible reason, not `disabled` (a `disabled` control is not focusable and the user cannot read why). On reconnect: `Back online. [ Refresh ]`. **Cache is never served silently as live.**

---

## 6. ACCOUNT MODEL

### 6.1 The value line

**The shape is free. The identity is paid.** An anonymous visitor sees that 70553 in California runs $258 to $1,309 at 5.1x. Which reporting entity pays which end of that is the product.

### 6.2 Tiers

| Tier | Lookups | Payer identity | Geo | Export | Saved | Tools |
|---|---|---|---|---|---|---|
| **Anonymous** | 5 / day | none | state only | permalink, citation | none | Rate, Source |
| **Account**, free, verified email | 25 / day | up to 5 entities per view | state, CBSA | + CSV | 10 markets, 1 basket | + Payers, Markets, Basket |
| **Broker**, per seat | unlimited | full | + ZIP3 | + XLSX, PDF exhibit with your logo | unlimited | + Spread, month history to earliest indexed month |
| **Firm**, seats plus shared library | unlimited | full | full | + exhibit templates, batch export | shared library, audit log | + SSO optional, 3 seats included |
| **Data** | API and bulk CSV by market | full | full | API | | `Schedule a call` only |

**Price is never printed here, never hardcoded anywhere in the app, in copy, in an email template or in an AI prompt.** Every price surface reads the live Stripe catalog at render and fails closed to `See plans` if the catalog call fails. Rule 7.
`Data` is never priced inline. `Schedule a call`.

### 6.3 What triggers an account

| Trigger | Surface |
|---|---|
| 6th lookup in a rolling 24h | inline rate-limit state, §5.9 |
| Any request for payer identity | inline locked slot, §5.8 |
| Any export other than permalink or citation | export modal |
| Saving a market or a basket | inline on the `s` action |
| Opening an exhibit | route-level gate |

Interrupting modals appear only on a deliberate action. A read is never interrupted.

### 6.4 Server-side enforcement. The exact shape.

**The gate is in the query, not in the response formatter, and not in the component.**

1. Entitlements resolve from the session at the API boundary and are passed into the SQL layer. A lower tier **selects fewer columns**. The response cannot contain a value the caller may not see, because it was never read from the database.
2. Quota counter is server-stored, keyed `user_id` when present, else a salted hash of `(ip, coarse ua)` on a rolling 24h window. Never a cookie. Never `localStorage`. Never a client flag.
3. Geo eligibility, month range and entity visibility are all server predicates. The client sends a market, not a permission.
4. Rate limit returns `429` with the same JSON shape as the UI state, so the API and the UI cannot drift.

**The assertion that catches the 2026-08-03 class of defect, in CI, fails the build:**

```bash
# an anonymous caller must never receive an entity-level key or figure
curl -s "$API/rate?geo=CA&code=70553" \
| jq -e '
    [paths(scalars)|join(".")] as $p
    | ( ($p | map(select(test("entity|payer|plan|network"))) | length) == 0 )
      and ( [.. | objects | select(.state=="locked") | has("value")] | any | not )
  ' || exit 1
```

Plus: `curl` the page HTML and assert zero occurrences of any gated figure in the bytes. **If the bytes reach the browser, the value is public.** A padlock rendered client-side is decoration.

---

## 7. KEYBOARD AND COMMAND PALETTE

A suite with six lenses and a persistent market is exactly the case a palette exists for. Warranted.

### 7.1 Shortcuts

All single-key shortcuts are **suppressed when the active element is an `input`, `textarea`, `select` or `[contenteditable]`**, and there is a master off switch at `/account/prefs`. That satisfies WCAG 2.1.4 without crippling the product.

| Key | Action |
|---|---|
| `⌘K` / `Ctrl K` | Command palette |
| `/` | Focus the code field |
| `g` then `1`–`6` | Rate · Payers · Markets · Basket · Spread · Source |
| `g` then `r p m b s` | same, first letter, where unambiguous. Source is `g 6` only. |
| `s` | Save this market |
| `e` | Export current view |
| `c` | Copy citation |
| `[` | Toggle rail wide and narrow |
| `t` | Cycle theme: light, dark, system |
| `?` | Shortcut sheet |
| `Esc` | Close palette, popover, sheet, detail rail |
| `j` / `k` | Row down / up in the canvas table |
| `Enter` | Open the focused row in the detail rail |
| `x` | Toggle row selection |
| `Home` / `End` | First / last row |
| `PageUp` / `PageDown` | 10 rows |

Table head sort buttons use a roving `tabindex`. `aria-sort` on the sorted column. **Sorting animates nothing.**

The expanded rail prints the digit hint in `--text-3` mono at the row end. The shortcut is discoverable without a tour.

### 7.2 Command palette

`<dialog showModal()>`, `min(560px, 100% - 32px)`, `--r-modal` 14 / 16, `--e3`, scrim `rgb(11 20 21 / .40)` light and `rgb(4 8 9 / .64)` dark. Enter `opacity 0→1` plus `translateY(8px)→none`, 240ms `--ease-enter`. Exit 120ms `--ease-exit`.

Input 48px, `--fs-input`, no border, bottom rule `1px --rule`. Result rows 40px. `max-block-size: min(392px, 60vh)`, `overscroll-behavior:contain`.

| Row state | Light | Dark |
|---|---|---|
| rest | `--ink`, no fill | `#F2F5F5` |
| hover | fill `--surface #F7F8F8` | `#1A2627` |
| active descendant | fill `--accent-tint #E6F3F3`, 2px inset-start bar `--accent #0F5C5C` | `#163333`, bar `#70C1C1` |
| **no transition on the active row** | arrow keys at 20/s must not smear | |

**Grammar, real:**

```
70553           Market · set code 70553, keep California
CA              Market · set geography California, keep 70553
70553 CA        Market · both
mri knee        Codes  · 73721 MRI lower extremity joint, without contrast
                         73723 MRI lower extremity joint, with contrast
payers          Tools  · Payers, 70553 California
>export csv     Command
>copy citation  Command
>theme dark     Command
>coverage       Command · open Coverage
?               Shortcuts
```

Sections in order: `Market` · `Tools` · `Recent` · `Commands` · `Saved`. Max 7 rows visible, grouped headers in `--fs-micro` mono uppercase `--text-3`.

Every row prints its result on the right in `--mono` 12px `--text-3`: a code row prints its `n` for the current geo, a market row prints its reporting month, a tool row prints nothing.

Empty: `No match for "mrri".` Not a spinner.

**The palette never runs a lookup on keystroke.** It navigates. The lookup runs on the route commit like every other path in the app, so there is one loading state, not two.

---

## 8. SHELL BUILD GATES

Everything in the brand system §8 and motion §9.3 still binds. These are the additions the shell owns.

| Gate | Value |
|---|---|
| Tool shell LCP | < 1500ms, 390×844, 4x CPU, Slow 4G |
| CLS | **0.00 exactly**, including the tool switch and the detail rail open |
| Result header reserve | `min-block-size` 176 / 210 measured, not assumed |
| `window.scrollX` after `scrollTo(9999,0)` | 0 at 320, 360, 390, 414, 768, 1024, 1280, 1440, 1920 |
| Nested scroll containers | exactly 1 (the detail rail), asserted |
| `position:fixed` inside `.ws` | 0 occurrences, asserted (container containment) |
| Running time-based animations at load + 1200ms | **0** |
| Anon API response containing an entity key or a gated `value` | **0**, `curl`-asserted, §6.4 |
| Anon page HTML containing a gated figure | **0 bytes**, grep-asserted |
| Focus after a tool switch | on `h1`, asserted |
| `aria-current="page"` on exactly one nav item per axis | asserted |
| Scroll listeners | 0 |
| `pointermove` listeners | 0 |

Then look at it. Press every rail item, every chip, every palette row, `g` then each digit, `j`/`k` through a table to the last row, `Esc` out of each of the four dismissible layers, and force all ten global states at 320px with a screenshot each. A 200 and a green deploy are not evidence.

---

## 9. THREE DELTAS FROM THE BRAND AND MOTION SYSTEMS, STATED SO NOBODY RE-LITIGATES

1. **The tool header is opaque, not the translucent film of §3.1.** A `backdrop-filter` over a scrolling rate table costs a full strip readback per frame and lowers the contrast of the product's entire reason to exist. The film stays on marketing. The header's contrast case therefore collapses to `--ink` on `--paper` at 18.66:1 and the `--text-2` ban in the header no longer applies to the tool, though the rail still uses `--text-2` on opaque paper at 5.66:1.

2. **A tool switch gets no view transition.** Motion §7 grants a 140ms root cross-fade to same-origin navigation. A lens change on an unchanged market is motion inventory row 20, `0ms`, not row 17. Cross-fade is retained for `/` ↔ tool, `/exhibit` and `/account`.

3. **The rail's `Spread` item is visibly `LOCKED` and still fully clickable.** §3.3 removes nav items that cannot be used. That rule is right for a marketing header and wrong for a tool suite, where the locked lens is the upgrade path and a nav item that refuses to navigate is a dead control. It navigates and renders §5.8.


# DESIGN DIRECTOR TEARDOWN

# TEARDOWN: REDDENDA BROKER

I read four documents that were each written as if the other three did not exist. That is the finding. Everything below is downstream of it.

The engineering is genuinely excellent and it is pointed at the wrong targets. You computed Machado CVD matrices for five categorical tokens that appear on no screen in the specification, and never once measured the distribution band against the track it sits on, which is the only graphic the product has. You wrote a build gate that refuses to publish a track without its `n`, then specified a hero with two tracks that have no `n`. You wrote "identical strings on all four surfaces" and then wrote the string two different ways in two documents. This is not a design system. It is four extremely rigorous design systems in a trench coat.

Below, everything is computed. Script: `/private/tmp/claude-501/-Users-user/b21483e9-ec70-4d54-a18c-d9ee4ce32ca5/scratchpad/teardown.py`.

---

## I. THE CORE GRAPHIC FAILS WCAG 1.4.11. IT IS NOT CLOSE.

`.dist__track` is `--surface-2`. `.dist__band` is `--band`. That pair is the entire product.

| Measurement | Light | Dark | Required |
|---|---|---|---|
| Band fill vs track fill | **1.116:1** | **1.003:1** | 3.0 |
| Band edge vs track | 1.322:1 | 1.302:1 | 3.0 |
| Band edge vs band | 1.184:1 | n/a | 3.0 |

In dark theme the p25 to p75 band is **1.003:1** against its own track. It is invisible. Not low contrast. Invisible.

Your §2.8 matrix measures `--ink` on `--band` (14.88), `--text-2` on `--band` (4.51), `--accent-700` on `--band` (4.51), `--control` on `--band` (2.84). You measured five things sitting **on** the graphic and never the graphic itself. §0 of the brand doc opens by congratulating itself for catching exactly this class of error ("size every text token against the darkest surface it is permitted to sit on"), and then commits the same error one section later against the most important object in the system.

And it is unfixable by tinting. To clear 3:1 against `#F0F2F2` the band fill must land at L ≤ 0.2615, which is a mid-dark teal that destroys `--ink` on band and every one of your printed figures.

**The fix is the one your own logo already drew.** Direction A is a caliper: two bounds and a spine. Your distribution bar is a tinted rectangle. Make the distribution bar a caliper. Two 2px vertical rules at p25 and p75 in `--control-hover` (5.66:1 on paper, 5.04:1 on `--surface-2`), joined by a 2px horizontal rule at the track's vertical centre, over the existing tint. The tint becomes decoration with no contrast obligation because the geometry carries the meaning. You clear 1.4.11 by 70%, you print on a laser without a special `--band-edge`, and the mark on the tab bar becomes literally the product's core graphic at 24px. Right now the logo and the chart are drawn from the same primitive and the chart does not use it. That is the single largest missed opportunity in the identity.

---

## II. CONTRADICTIONS BETWEEN DOCUMENTS. EVERY ONE IS SHIPPABLE.

**1. Two typefaces.** BRAND §4.1: Inter Variable, self-hosted, 104KB, one file, system mono at zero bytes, and a CI gate that fails the build at `104KB / 1 file / 0 third-party origins`. LOGO §8: "IBM Plex Sans 600 wordmark and headings, IBM Plex Sans 400 body, IBM Plex Mono 500 for CPT codes." That is not a wordmark note. That is a complete second type system, and it breaks the brand doc's own build gate on the first commit. Worse, the LOGO doc's stated reason for Plex is that it is "already licensed and self-hosted across the Reddenda estate," which makes it the **parent's** face. You cannot build the sibling out of the parent's typeface and then argue the sibling is distinct. Pick Inter, outline the wordmark, delete every Plex reference.

**2. The logo ships in colors that do not exist in the brand system.** LOGO §8 defines `--bk-ink #002420`, `--bk-accent #077A70`, `--bk-rule #D3DDDB`, `--bk-surface-2 #F3F8F7`. BRAND defines `--ink #0B1415`, `--accent #0F5C5C`, `--rule #E4E7E7`, `--surface-2 #F0F2F2`. Same roles. Different hex. Measured:

| Header element, as specified | vs | ΔE_ok |
|---|---|---|
| Logo structure `#002420` | Nav text `#0B1415` | **0.0588** |
| Logo median `#077A70` | CTA fill `#0F5C5C` | **0.0932** |

Those are the two worst distances in color. Far enough to see, close enough to read as a printing error. The header, as written across your two documents, puts two different blacks and two different teals within 200px of each other. A broker will not name it. He will feel that something is off and he will not know why, which is exactly the "gone next year" signal you said this audience scans for. One token set. Delete `--bk-*` entirely.

**3. The logo doc prints a contrast ratio that cannot exist.** §4 claims reversed white on `#002420` is **17.79:1**. Contrast is symmetric and the computed value is **16.49:1**, which the same document prints correctly two rows earlier for the same pair. The maximum achievable with white on `#002420` is 16.49. In a document whose closing section asserts "all contrast ratios computed from sRGB luminance," one of them was typed. That is not a rounding error. That is the exact failure mode the whole estate's rule 1 exists to prevent, committed inside the verification claim itself.

**4. The dark primary button is built from wrong-named tokens plus one color that is not a token.** Dark tokens: `--accent #70C1C1`, `--accent-hover #A8D7D6`, `--accent-press #36A9A9`. §7.1 dark primary: rest `#36A9A9`, hover `#70C1C1`, active `#209A9A`. So rest uses the token named `press`, hover uses the token named `accent`, and active uses `#209A9A`, which appears nowhere in the accent ramp. It appears in `--seq-2`. **Your dark primary button's pressed state is data sequence step 2.** Meanwhile the tertiary button in the same table maps the tokens correctly. Two components, one token set, two different mappings. Nobody can write `.btn{background:var(--accent)}` and get both right, and `--accent-fg #042121` is not the label color the button table ships (`#0B1415`). This system fails in month three.

**5. Buttons and cards contradict across BRAND and MOTION, and the CI gate cannot catch it.** BRAND §7.1: "the `::after` opacity overlay... **No color, background or border transition anywhere.**" MOTION §8 ships `transition: background-color, border-color, color, transform`. MOTION §9.1's own allowlist says "Compositor only. transform, opacity, clip-path" and then MOTION §8 violates it on the same page. The §9.4 `BAD` regex tests `width|height|top|left|margin|padding|box-shadow|filter|background-position|inline-size|block-size`. It does not test `background-color`, `border-color` or `color`. **The gate cannot catch the violation the document itself ships.** Same story for cards: BRAND §7.4 "no hover lift, no `translateY`. A card that rises when you point at it is a marketing card." MOTION §8 and MARKETING §7 both ship `translateY(-1px)`.

Also, MOTION's hover is `color-mix(in oklch, var(--accent) 88%, var(--ink))`, which computes to `#115353` (8.80:1 with white) and duplicates `--accent-hover #084646` (10.63:1) at ΔE 0.045. Two hover colors for one button in a system whose premise is that every value is computed.

**6. The marketing page promises double the product's actual limit.** MARKETING says "Ten lookups a day" three times: hero micro line, demo ceiling, close. APP SHELL §6.2 says anonymous is **5 per day**, and §5.9's error copy reads "5 of 5 used." The highest-frequency promise on the site is a factor of two wrong against the shipped architecture.

**7. Four dead links on the page whose CTA is "Open the tool."** MARKETING §5 prints `app.[domain]/lookup`, `/payers`, `/table`. APP SHELL's route map has `/t/rate/:geo/:code`, `/t/payers/:geo/:code`, `/t/markets/:code`. Not one of the marketing routes exists. And MARKETING names four tools; the app ships six with different names, none of which is "Market Table." Then MARKETING's sub says "Every tool has a demo you can use before you sign up," while APP SHELL gates four of the six behind an account and one behind paid.

**8. The one string you promised would never differ, differs.** MARKETING: `Transparency in Coverage machine-readable files, 45 CFR 147.212`. APP SHELL: `Transparency in Coverage in-network rate files, 45 CFR 147.212`. MARKETING §8: "Identical strings on all four surfaces: this page, the tool, the CSV header, the PDF header." And `BASIS` means "Documented in-network negotiated rates. Modeled, not guaranteed" on marketing and "Medicare reference: CMS Physician Fee Schedule 2026, locality {l}" in the app. One label, two meanings, in the provenance block, which is the one component that exists to be identical.

**9. The flagship page cannot pass its own build gate.** MARKETING: "the build gate refuses to publish any track whose `n` is absent," and then specifies `<Figure state="unavailable">` in the `n` slot of hero bar 2 and of proof cards 3 and 4. Three of six distribution tracks on the flagship page. Either the gate is theater or the page does not ship. Decide before anyone writes code.

**10. The app's first sentence is factually wrong and it is the product's honesty core.** APP SHELL §5.1: "Rates are what plans report paying under 45 CFR 147.212." TiC in-network files publish **negotiated rates**. MARKETING limit 02 says exactly that: "Published is not paid." Your first-run screen states the thing your limits section exists to deny.

**11. The value prop contradicts the limits section.** §4 column 3 bullet: "Check a paid claim against the published distribution." §10 limit 02: "They are not claims, not allowed amounts after adjudication." You cannot do the thing the bullet sells. Cut the bullet.

---

## III. COPY

**Too long, with the cut.**

| Current | Chars | Cut to |
|---|---|---|
| "241 observed in-network rates for 70553 in California, one mark per percentile, from 313,579 observations." | 136 | `241 marks. One per percentile of 313,579 observed rates.` |
| "Payers publish their negotiated in-network rates every month under federal rule. The files are public, enormous, and unreadable. We read them." | 142 | `Payers publish negotiated rates monthly under federal rule. The files are public and unreadable. We read them.` |
| "Both are documented in-network rates. Both are published monthly under 45 CFR 147.212. The difference has always been public. It has never been readable." | 153 | Kill sentences 1 and 2, they are already on screen. `The difference has always been public. It has never been readable.` |
| Limit 03, 178 chars | 178 | `Some codes carry hundreds of thousands of observations. Some carry too few to publish. Below threshold we print the count and nothing else.` |

"enormous" is an adjective doing a decision's job. "We read them." is the best line in the document and it is buried third in a paragraph.

**Generic, and what it costs you.**

- `Four tools. One data set.` is the single most template B2B headline construction alive. Linear, Vercel, Stripe, and four hundred others.
- `Healthcare rate intelligence for brokers, general agents and self-funded employers.` is category boilerplate. Your competitors' footers say this.
- Footer columns `PRODUCT / DATA / COMPANY`. The default.
- `VERIFIED SOURCE` badge. Verified by whom, against what? It is a trust badge, which is the exact SaaS tell this audience hates, in a system that otherwise refuses to make unqualified claims. Kill it.
- `Rate Lookup`, `Payer Comparison`, `Market Table`. Three noun-plus-noun generics.
- `Every tool lives on the app. This page is where you see what it does.` That is internal policy leaking into customer copy. A broker does not care where tools live. Delete.
- The exhibit's closing `No PHI.` The client reading the exhibit is an employer CFO. He reads "No PHI" and thinks "why is this here." That is a seller's compliance line rendered inside the buyer's artifact. Move it to the tool.

**"Spread" cannot be a nav item.** Every result header on every screen prints `SPREAD 5.1x`. Your rail has a lens called `Spread` that means codes ranked by dispersion. One word, two meanings, both on screen simultaneously. Rename the tool `Dispersion` or `Rank`.

---

## IV. MOTION THAT SERVES THE DESIGNER

**The hero cinematic.** 241 marks, 1,080ms, its own JSON schema, its own build assertion, its own easing LUT, its own kill switch, its own memory budget, its own performance contract. It is the most specified object in four documents.

It is `display:none` below 768px, on a product whose stated user is "a broker on a phone between meetings, often in a car."

You built the signature moment of the brand for the user you explicitly said you were not designing for, and then wrote a paragraph congratulating yourself for the decision. Worse: MARKETING §3 states that the no-JS fallback renders three real DOM ticks at $258 / $589 / $1,309 and that "those are true with or without a canvas, and they double as the axis annotation the design wanted anyway." By your own admission the fallback is sufficient. The probe works without the canvas. The information content of the animation is zero.

What the field is actually for is the **shape** of the distribution, and you already build that object: the 96-bin histogram in §6, which you render as background texture at **`opacity: .10`** where nobody can read it. You buried the honest, legible, static, cheap, mobile-capable graphic behind the expensive desktop-only one. Swap them. Put the histogram in the hero at full opacity on every device, delete the canvas, delete `field.js`, delete the JSON contract, delete the kill switch, keep the probe.

**The six `.rv` section reveals.** `opacity 0 to 1` plus `translateY(12px)` on scroll is the most template motion pattern on the internet in 2026. You ban `easeOutExpo` by name for being consumer and then ship fade-up-on-scroll, which is more consumer than any easing curve. Delete all six. A page where nothing moves except the data would be unmistakable in this category, and the deletion costs nothing and gains the entire register you are chasing.

**The §2 measure line.** It grows from $258 to $1,309 while both numbers are already painted, then `$1,051` fades in. You are animating a subtraction the reader already performed. A bare rule sliding right with no label attached reads as a loading bar. Cut it.

**The segmented thumb.** BRAND §7.15: "Motion: none. A sliding thumb on a control above the H1 is decoration." MOTION §11 overrules it with "the thumb encodes which segment is active, which is a state the user just set, so animating it is feedback." The checked-state fill change already encodes it, at 0ms. The brand doc was right. Revert.

**The listbox `translateY(-4px)` at 120ms** is 33px per second. Below the perceptual threshold for motion at that displacement. It is a fade with extra CSS.

---

## V. WHERE IT LOOKS LIKE A TEMPLATE

Section order: hero, problem, proof, personas, features, how-it-works, artifact, limits, CTA, footer. That is the canonical 2020s B2B SaaS scroll in canonical order. The structure telegraphs "landing page" before a word is read.

Worse, from §5 to §10 the page is **grid, grid, grid, grid**: four-card tool grid, five-step numbered pipeline, three-column persona grid, six-item numbered limits grid. Nothing varies its form, only its column count. That is what makes a page feel like a template even when every string is good.

**Cut §4 entirely.** A persona section with three columns, three bullets each, and an arrow link is the most template block in existence, and it is redundant with the Broker/Employer control 3,000px above it. Fold the three audiences into the limits section and the tools section as verbs.

**Cut the Broker/Employer segmented control.** Your stated audience is three groups. The control has two segments and the doc rules out three. General agents, one third of the audience, are not represented in the page's primary voice control, and then get their own column in §4. Beyond the taxonomy failure: a persona toggle above the H1 is a confession that you do not know who you are talking to. Bloomberg does not ask who you are before showing a price. One deletion kills the contradiction, kills motion inventory row 12, kills the `localStorage` persistence, kills the `aria-live` double-speech, kills the two-variant `getClientRects` CI assertion, and reclaims 60px of a 320 fold that is currently over budget.

**`--r-card` 12/14/16px.** Your stated metaphor is a fee-schedule lattice with shared `-1px` edges and "radius 0 on shared edges." A lattice cannot have 16px corners; you zero them at every junction. So the most carefully specified radius ladder in the document applies only to isolated cards. Set `--r-card: 4px`, delete the breakpoint ladder. That one change does more for "institutional" than the entire color section.

**Pills.** `--r-pill: 999px` on `VERIFIED SOURCE` and `FREE · NO ACCOUNT`, in a system that bans pills on buttons for being consumer. Square them at 2px.

**Nine hues** in a system whose thesis is restraint: accent teal, neutral teal, marine, green, amber, red, plus cat-1 through cat-5. The stated role of the brand color is "instrument marking, never a large fill," and the accent is then used for the median rule, links, primary button fill, focus ring, selected row fill, badge fill, rail current bar, progress bar, measure line, and both §2 axis marks. The demotion you announced is not honored by the spec that announces it.

---

## VI. 320px

**The hero fold is 64px over budget.** MARKETING computes 525px against 568. Recomputed with a real caption:

`p25 $258 · median $589 · p75 $1,309 · 5.1x · n = 313,579` is 56 characters at 15px mono, which is 504px of text. In a 288px column that is **2 lines, 40px**, not the 20px budgeted (and not the 16px the BRAND doc budgets). Total: **589px**. The CTA's top lands at 529px and **39 of its 44px are visible**, on the smallest device, as the primary action.

You are also celebrating a 1px clip in the doc as written ("leaving 43 of the CTA button's 44px visible"). A button clipped by any amount reads as clipped. Either it clears the fold with 16px of air or it goes below and you stop pretending.

**The app shell gives the phone 20% of the screen for data.** §3.5's own arithmetic: 56 header + 176 result header + 44 control row + 124 distribution card + 56 bottom bar = **456 of 568**. The table gets **112px, 2.5 rows**. And the 176px result header restates p25/p50/p75/spread, which the 124px distribution card directly beneath it already shows. **You are spending 31% of the phone on a redundant restatement.** Below 768, collapse the result header to eyebrow plus title plus `n` (72px) and let the distribution card carry the figures. That returns 104px, which is 2.4 more rows, doubling the visible data.

**Three horizontal snap rails on mobile.** §3 proof, §4 personas, §5 tools. Your §10 states the principle correctly: "This is the one section that is never a rail. A limit you have to swipe to find is a limit you hid." By your own logic, three of four proof cards are hidden, and §3 is the argument of the page. You applied the principle only where it cost nothing. Stack them.

Related: with `view()` timelines resolving against the block-axis scrollport, cards 2 through 4 complete their band animation while off-screen to the right. The motion is spent on nothing, on the device where most of the traffic is.

**Nothing in four documents addresses zoom.** WCAG 1.4.4 requires 200% text scaling and 1.4.10 requires reflow at 320 CSS px equivalent (a 1280px viewport at 400%). You have `min-block-size` reserves, character-count-matched placeholders, and pinned `ch` widths everywhere, all of which are the exact patterns that break under text-only zoom. There is no zoom test in any gate.

**The desktop micro-label rationale is physically backwards.** §4.3: micro-labels shrink from 12px to 11px at 768+, "the inverse of the usual instinct and it is correct for reading distance." Reading distance to a desktop monitor is roughly twice that to a phone. Computed visual angle: 12px at 35cm is **3.12 arcminutes**; 11px at 70cm is **1.43 arcminutes**. The desktop label is **46% the angular size** of the mobile one. Your stated reason is the opposite of true, and it applies to rail labels, table headers and every uppercase label in the product. Hold 12px everywhere, or go to 13px on desktop.

---

## VII. WHERE IT WILL FEEL SLOW

- **There is no time-to-answer budget in four documents.** You have LCP, CLS, INP, TBT, node counts, transfer, layer counts. INP measures event-to-feedback, not time-to-answer. For a data product, p75 time from code change to figures on screen is the only performance number that matters. Add it: **< 600ms**, and instrument it.
- The composed latency you have specified is 140ms debounce, plus route commit, plus RTT, plus render. Nobody added it up.
- **Command palette enters at 240ms.** A palette must feel like it was already open. 240ms on `⌘K` is the definition of slow. 0ms opacity, 100ms max.
- **Two different tooltip delays in two documents**: BRAND §7.11 says 300ms open, MOTION §8 says 400ms hover intent. 400ms is past the point where a user concludes the tooltip is broken. 150ms.
- `--ease-enter cubic-bezier(.32,.72,0,1)` has a long tail; a 240ms sheet on that curve perceives at roughly 320ms. That is the slowest thing on a phone opened between meetings.
- **"Building exhibit. This takes about 8 seconds."** Eight seconds with a proud ban on spinners. That is either a background job with an email or it is a 2-second job. It is not an 8-second modal.
- **`content-visibility:auto` and `inline-size:max-content` cancel each other.** `max-content` on the table forces the engine to measure every row to resolve the intrinsic width, which defeats the skipping that `content-visibility` exists to provide. You will get the memory cost and none of the benefit.
- **`scroll-state` carries four load-bearing behaviors** and is Chrome 133+. On iOS Safari, your primary mobile browser, the header film, the control-row densification, the table-head densification, and the **right-edge scroll affordance** all silently do nothing. Three of those are cosmetic. The fourth means iOS users are never told the rate table scrolls sideways. That needs a non-`scroll-state` fallback.

---

## VIII. ACCESSIBILITY, BEYOND THE BAND

- **The hero probe is silent to a screen reader.** MOTION §5.5 sets `aria-live="off"` on the visible readout and delegates announcement to `aria-valuetext`, which the code sample never sets. A range with no `aria-valuetext` announces "589." No unit, no percentile, no code. That is a 4.1.2 failure on the signature interaction, and it is caused by the same double-speech reasoning you then commit anyway on the segmented control's `aria-live="polite"` H1 swap.
- **The median rule and the Medicare reference fail your own CVD bar and were never tested.** They are the two marks that co-occur on one 44px track. Measured ΔE_ok: light **0.091 normal / 0.055 deutan / 0.044 tritan**; dark **0.098 / 0.068 / 0.035**. Your pass bar is 0.10 and every single value fails it. Your CVD gate tests five categorical tokens that appear nowhere in the specification and never tests the pair that ships. They are legal under 1.4.1 because the dash pattern differentiates them, but at 320px on a 44px track a 1px dash against a 2px solid is a very thin cue. **Delete `--ref` as a hue.** Make it `--ink` at 1px dashed. You lose nothing (the label is printed anyway, per your own rule) and you remove a structural hue from a system that claims restraint.
- **The locked badge's measured ratio is against the wrong background.** You measured `--locked #5A6A6B` on `--locked-wash #F1F5F5` at 5.16 and then specified a 45deg `--rule` hatch behind the text. On the stripe it is **4.55:1**. It passes, barely, but the measurement was taken against a background the text does not sit on, which is the exact defect class §0 opens with.
- **`--rule-strong` is 1.70:1 on the dark canvas** and is not in the CI `PAIRS` list in either theme. MARKETING §14 found this by hand. The gate that exists cannot find it. Add `--rule-strong` at 3.0 to the gate, or rename it so nobody uses it as a meaning-bearing line.
- **The knife-edge bans are applied inconsistently.** You ban `--text-2` on `--band` at 4.514 and `--accent-700` at 4.509 for being one hundredth over, then permit `--caution` at 4.725 and `--ok` at 4.939 with no note. Same knife, same edge, different verdict.
- **Rail focus and rail current collide.** Current is a 3px inset-start bar; focus is `outline: 2px solid; outline-offset: -2px`. On the current item, both render on the same edge. A keyboard user cannot tell focus from current on the item they are most likely to be on.
- **Three snap rails, no keyboard spec.** Tab into an off-screen card and the browser scrolls it into view, fighting `scroll-snap-type: x mandatory`, which is a documented jitter. There is no next/prev control and no stated behavior.
- **The detail rail's Escape handler calls `back()`.** On a pasted deep link carrying `?row=`, Escape leaves the site.

---

## IX. THE MARK

Direction A is a caliper icon. It is also, at a glance: a slab-serif capital I (you say so), the CAD dimension tool, "insert row," and the InDesign baseline-grid glyph. It is not a company. It is a toolbar item.

And look at where the rigor went. You computed the true median position to three decimals, disclosed a 0.324 percentage point rounding delta as "the entire fabrication budget of this identity," and re-derived a 16-grid favicon so the median lands on 33.333%. **No human being at any size will ever perceive 31.494 versus 31.818 versus 33.333.** Meanwhile the actual differentiation problem, that it reads as a stock icon, is left at "verify on the first real customer." That is the inversion of effort in miniature and it is the pattern across all four documents.

Direction B is the only one that is a company. You killed it because it dies at 24px. It dies at 24px **as drawn**: seven rows of 2u at pitch 4. Redraw it at four rows on the 16-grid and test again before you throw away the only ownable mark on the sheet. Do not accept a concept's death from a single execution.

---

## X. THE TEN CHANGES, RANKED

1. **Fix the band.** It fails 1.4.11 at 1.116:1 light and 1.003:1 dark. Rebuild the distribution as a caliper: two 2px bounds plus a 2px spine in `--control-hover`, tint optional and decorative. This fixes the core graphic, ties it to the mark, and prints on a laser.

2. **Collapse four documents into one token set and one string table before another line is written.** One ink, one accent, one typeface, one source string, one `BASIS` definition, one lookup limit, one route map. Every contradiction in section II is a shippable defect today, and none of your gates catch cross-document drift. Add a gate that does: assert the marketing routes exist in the app route table, and assert the provenance strings are byte-identical across all four surfaces.

3. **Delete the hero canvas. Promote the histogram.** Put the 96-bin static SVG in the hero at full opacity on **every** device including 320px, keep the three DOM ticks and the probe, delete `field.js`, the JSON contract, the easing LUT, the kill switch and the desktop-only exclusion. You lose nothing your own spec does not already concede, and your primary user finally sees the signature graphic.

4. **Delete all six `.rv` scroll reveals and the §2 measure line.** A page where the only motion is data is the strongest available differentiator in this category and it costs zero to ship.

5. **Cut §4 (personas) and the Broker/Employer control.** Both are template tells, they contradict each other's taxonomy, and the deletion fixes the 320 fold overrun, kills three motion entries, kills the two-variant CI assertion, and removes a page that asks the visitor to self-identify before it will show him a price.

6. **Fix 320.** The hero is 64px over budget (589 vs 568) because the caption is 2 lines and you budgeted 1. The app shell gives the table 112px of 568. Collapse the mobile result header from 176px to 72px, stack the three rails, and re-run every fold table by reading `getClientRects()` in a browser rather than by estimating glyph advance.

7. **Set `--r-card: 4px`, delete the radius ladder, square the pills.** Your lattice metaphor already zeroes the radius on every shared edge. This one change buys more institutional register than the entire color section.

8. **Add a time-to-answer budget and instrument it.** p75 from code change to figures on screen, under 600ms. Then fix the palette (0ms open), the tooltips (150ms, one number in one document), and the 8-second exhibit build.

9. **Fix the three accessibility defects the gates cannot see.** `aria-valuetext` on every probe input on every `input` event. `--ref` becomes `--ink` dashed, deleting a hue and a failing CVD pair. `--rule-strong` into the contrast gate in both themes.

10. **Redraw Direction B at four rows and retest at 16px, then choose.** If it survives you have the only ownable mark on the sheet. If it does not, ship A but stop describing 0.324 percentage points as a fabrication budget and start solving the fact that it looks like an icon from a CAD toolbar.

---

One last thing, and it is the whole review in a sentence. The brief said Bloomberg-grade infrastructure, not a SaaS landing page. Bloomberg's actual properties are extreme density, monospace everywhere, no whitespace luxury, keyboard-first, no marketing voice, and zero reveal animation. What is specified here has a 96/128px section rhythm, a 68ch measure, 16px card radius, hover lifts, six scroll reveals, a persona toggle, and a 1,080ms hero cinematic. It is a beautifully engineered SaaS landing page wearing a data costume, and the word "institutional" is doing the work that a structural decision should be doing. The four best things in these documents (the limits section, the honest empty states, the provenance block, the "we read them" line) all come from the same instinct. Everything ranked above is a way of letting that instinct win.


# IMPLEMENTATION KIT

# REDDENDA BROKER: THE IMPLEMENTATION KIT

Every number below was computed, then rendered in real Chrome and read back off the live cascade. Files at `/private/tmp/claude-501/-Users-user/b21483e9-ec70-4d54-a18c-d9ee4ce32ca5/scratchpad/kit/`.

**What the browser said, not what the spec claimed:**

| Measured | Result |
|---|---|
| CSS rules parsed vs blocks in file | 9/9, 66/66, 171/171, 71/71, 52/52, 44/44. **Zero dropped rules**, zero console errors |
| Contrast, live cascade, 22 pairs incl. the graphic | **0 failures light, 0 failures dark** |
| Mark separability, OKLab dE | light 0.158 / 0.181 / 0.329 · dark 0.108 / 0.222 / 0.296. **All clear 0.10** |
| Old band vs its own track | **1.116:1 light, 1.003:1 dark.** Confirmed, and deleted |
| Caliper geometry at 320 | p25 center 53.71 (expected 53.71), p50 121.31 (121.32), p75 268.41 (268.41) |
| h1 computed line-height at 320/390/768/1440 | 1.28 / 1.28 / 1.14 / 1.05, exact |
| `scrollX` after `scrollTo(9999,0)` at 8 widths | **0 everywhere**, and 0 at 200% text zoom |
| tnum delta, digits and currency | 0.0000 / 0.0000 at every width |
| `prefers-reduced-motion: reduce` | spine opacity 1 transform none, all marks visible, header film 1, **0 running animations** |
| 320x568 fold, CTA bottom edge | **472. 96px of air.** Second caliper's track fully visible at 552 |

**Three defects the estimates hid, found by measuring and fixed at the cause:** the fold was 630px not 527 (sub was 3 lines, `.cpt` was 15px inside a 12px row, `.stats` double-counted a gap, the axis line was never budgeted); the header CTA plus burger was 290px in a 288px column and clipped; `--rule-strong` fails 3:1 in *both* themes so it split into a decorative `--rule-2` and a gated `--edge`.

---

## 1. Tokens

```css
/* 01-tokens.css
   ONE token set. The logo, the chart, the nav and the buttons all read from
   this file and nothing else. No --bk-* set. No second ink. No second teal.
   Light is canonical. Dark is complete and ships on the tool only.
   Marketing stamps <html data-theme="light"> and never offers a toggle. */

:root{
  color-scheme: light;

  /* --- ACCENT RAMP. OKLCH hue 195, gamut mapped. ------------------------- */
  --accent-50:   #F4FAFA;
  --accent-100:  #E6F3F3;
  --accent-200:  #CFE8E7;
  --accent-300:  #A8D7D6;
  --accent-400:  #70C1C1;
  --accent-500:  #36A9A9;
  --accent-600:  #008D8D;
  --accent-700:  #0A7373;
  --accent-800:  #0F5C5C;
  --accent-900:  #084646;
  --accent-950:  #053232;
  --accent-1000: #042121;

  /* --- NEUTRAL RAMP. OKLCH hue 200. The family resemblance. -------------- */
  --n-0:   #FFFFFF;  --n-25:  #FAFBFB;  --n-50:  #F7F8F8;  --n-100: #F0F2F2;
  --n-200: #E4E7E7;  --n-300: #D2D7D7;  --n-400: #ADB6B7;  --n-500: #7E8A8A;
  --n-550: #627070;  --n-600: #5A6A6B;  --n-700: #3E4E4F;  --n-750: #303F40;
  --n-800: #243132;  --n-850: #121D1E;  --n-900: #0B1415;  --n-950: #050A0B;

  /* --- SEQUENCE PALETTE. Payer comparison, ordered, hard cap 5. ----------
     Adjacent OKLab dE measures 0.071 to 0.086, which is below the 0.10
     legend picking threshold. That is survivable ONLY because the bars are
     adjacent, ordered, share edges, and every series carries a printed
     inline label. HARD: the sequence may never be legend keyed. Above five
     payers the chart type changes to small multiples, all in --accent-800.
     The five token CATEGORICAL palette is deleted. Nothing shipped used it. */
  --seq-1: #053232;  --seq-2: #084646;  --seq-3: #0F5C5C;
  --seq-4: #0A7373;  --seq-5: #008D8D;

  /* --- TYPE ------------------------------------------------------------- */
  --sans: "Inter var", "Inter Fallback", system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "Mono UI", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
          "Liberation Mono", monospace;

  --fs-d1:    36px;  --lh-d1:    1.28;  --ls-d1:    -0.012em;
  --fs-ratio: 44px;  --lh-ratio: 1;     --ls-ratio: -0.024em;
  --fs-h2:    24px;  --lh-h2:    1.25;  --ls-h2:    -0.018em;
  --fs-h3:    19px;  --lh-h3:    1.35;  --ls-h3:    -0.014em;
  --fs-h4:    16px;  --lh-h4:    1.4;   --ls-h4:    -0.010em;
  --fs-lead:  17px;  --lh-lead:  1.5;   --ls-lead:  -0.015em;
  --fs-body:  16px;  --lh-body:  1.5;   --ls-body:  -0.02em;
  --fs-sm:    14px;  --lh-sm:    1.45;
  --fs-btn:   15px;  --lh-btn:   20px;
  --fs-input: 16px;  --lh-input: 24px;         /* 16px below 768 or iOS zooms */
  --fs-mono:  15px;  --lh-mono:  20px;
  --fs-mono-sm: 13px; --lh-mono-sm: 18px;
  --fs-n:     12px;  --lh-n:     16px;
  --fs-micro: 12px;  --lh-micro: 16px;  --ls-micro: 0.08em;
  /* --fs-micro holds 12px at EVERY width. The old 11px desktop step was
     justified by "reading distance" and the arithmetic is the other way up:
     12px at 35cm subtends 3.12 arcmin, 11px at 70cm subtends 1.43 arcmin,
     which is 46% of the angular size. The desktop label was the small one. */

  /* --- SPACE. 4px half step, 8px base, discrete per breakpoint. ---------- */
  --s1:4px;  --s2:8px;  --s3:12px; --s4:16px; --s5:24px;
  --s6:32px; --s7:48px; --s8:64px; --s9:96px; --s10:128px;
  --tap:44px;

  --gutter:16px;  --section-y:56px;  --pad-card:16px;  --pad-tile:12px;
  --content-max:1200px;  --table-max:1600px;  --measure:68ch;

  /* Zoom safe reserves. WCAG 1.4.4 wants 200% text scaling, and a hard px
     min-block-size clips at 200%. Every reserve is max(px, em) so it grows
     with the text it reserves for. */
  --tile-min:  max(96px, 6.5em);
  --track-h:   44px;
  --track-h-sm:32px;
  --fig-min:   max(20px, 1.4em);

  /* --- RADII. The metaphor is a fee schedule lattice with shared edges and
     radius 0 at every junction, so a 16px corner was decoration that only
     ever applied to isolated cards. One tight ladder, no breakpoint ramp. -- */
  --r-xs:2px;    --r-sm:3px;    --r-ctl:4px;   --r-card:4px;
  --r-track:2px; --r-md:6px;    --r-modal:8px;
  --r-inner: max(2px, calc(var(--r-card) - var(--pad-card)));
  /* --r-pill is deleted. A 999px badge in a system that bans pills on
     buttons for reading consumer was the same tell one component over. */

  /* --- BORDER WIDTHS ---------------------------------------------------- */
  --bw-hair:1px; --bw-ctl:1px; --bw-focus:2px; --bw-emph:2px;
  --bw-bound:2px;  /* caliper jaw at p25 and p75 */
  --bw-spine:2px;  /* the horizontal rule joining them */
  --bw-median:3px; /* heavier than the bounds ON PURPOSE, see components */
  --bw-ref:1px;    /* Medicare reference, dashed 3 3, ink */

  /* --- MOTION ----------------------------------------------------------- */
  --d-instant:0ms;   /* every figure, sort, filter, tab, result arrival     */
  --d-fast:120ms;    /* reversible feedback, pointer already on the element */
  --d-base:180ms;    /* an element resizing itself in place                 */
  --d-slow:240ms;    /* an element arriving from off canvas. HARD CEILING   */
  --d-tip:150ms;     /* tooltip open delay. ONE value, one document         */
  --d-palette:100ms; /* command palette. It must feel already open          */
  --d-pulse:1400ms;  /* in flight pulse period, not an entrance             */
  --d-cine:1080ms;   /* hero field settle. Stated, bounded exemption        */

  --ease:       cubic-bezier(.2,0,0,1);
  --ease-enter: cubic-bezier(.32,.72,0,1);
  --ease-exit:  cubic-bezier(.4,0,1,1);
  --ease-scrub: linear;
  --ease-none:  steps(1,end);

  /* --- BUDGET. Not decoration: hero-field.js and the tool both read it.
     Time to answer is the only performance number a data product has. ----- */
  --t-answer:600ms;

  /* --- Z INDEX. One scale. Nothing in the codebase invents a number. ----- */
  --z-base:0;  --z-sticky-cell:2; --z-thead:3;  --z-rail:10; --z-header:50;
  --z-dropdown:60; --z-progress:65; --z-scrim:70; --z-modal:71;
  --z-toast:80; --z-tooltip:90;
}

/* =========================================================================
   SEMANTIC LAYER, LIGHT. Canonical.
   ========================================================================= */
:root,
:root[data-theme="light"]{
  color-scheme: light;

  --canvas:      #FFFFFF;   /* marketing page. tool shell overrides to n-50 */
  --paper:       #FFFFFF;
  --surface:     #F7F8F8;
  --surface-2:   #F0F2F2;

  --rule:        #E4E7E7;   /* 1.24:1 DECORATIVE hairline. never a boundary */
  --rule-2:      #D2D7D7;   /* 1.45:1 DECORATIVE section divider only       */
  --edge:        #7E8A8A;   /* 3.57 / 3.35 / 3.17 STRUCTURAL boundary, gated */
  --control:     #7E8A8A;   /* 3.57:1 every input, select, checkbox outline */
  --control-hover:#5A6A6B;  /* 5.66:1                                        */

  --ink:         #0B1415;   /* 18.66:1 AAA */
  --text-2:      #5A6A6B;   /*  5.66:1 AA  */
  --text-3:      #627070;   /*  5.16:1 AA, sized against --surface-2 at 4.59 */
  --ink-invert:  #F2F5F5;

  --accent:      #0F5C5C;   /*  7.76:1 link, primary fill, focus ring */
  --accent-hover:#084646;   /* 10.63:1 */
  --accent-press:#053232;   /* 13.92:1 */
  --accent-fg:   #FFFFFF;   /*  7.76 on accent, 10.63 on hover, 13.92 on press */
  --accent-wash: #F4FAFA;
  --accent-tint: #E6F3F3;
  --focus:       #0F5C5C;

  /* --- THE DISTRIBUTION GRAPHIC. Geometry carries the meaning. ----------
     --band is DECORATION with no contrast obligation and may be switched
     off with zero information loss. It measured 1.116:1 against the track
     and was carrying meaning it could not carry. */
  --band:        #DCE8E7;
  --bound:       #5A6A6B;   /* 5.04 on track, 4.51 on tint. the caliper jaws */
  --median:      #084646;   /* 9.46 on track, 8.48 on tint. dE 0.158 vs bound */
  --ref:         #0B1415;   /* ink, 1px dashed. the marine hue is deleted    */

  --ok:          #1F6F38;  --ok-wash:      #E7F9EA;
  --caution:     #8A5A00;  --caution-wash: #FFF2E3;
  --danger:      #A32321;  --danger-wash:  #FFEDEB;
  --info:        #2C4A7C;  --info-wash:    #ECF3FF;   /* SYSTEM STATE ONLY   */
  --locked:      #5A6A6B;  --locked-wash:  #F1F5F5;
  --locked-hatch:#F0F2F2;  /* the stripe the locked label actually sits on:
                              5.04:1. Against the old --rule stripe it was
                              4.55, measured against a background the text
                              does not sit on. */

  --row-hover:   color-mix(in oklch, var(--ink) 3.5%, transparent);
  --scrim:       rgb(11 20 21 / .40);
  --shadow-rgb:  11 20 21;

  --hdr-fill:       rgb(255 255 255 / .90);
  --hdr-fill-solid: #FFFFFF;
  --hdr-rule:       #E4E7E7;
  --hdr-blur:       blur(14px) saturate(180%);

  --e0: none;
  --e1: 0 1px 0 rgb(var(--shadow-rgb) / .14);
  --e2: 0 1px 2px rgb(var(--shadow-rgb) / .06), 0 8px 16px -4px rgb(var(--shadow-rgb) / .10);
  --e3: 0 2px 4px rgb(var(--shadow-rgb) / .06), 0 24px 48px -12px rgb(var(--shadow-rgb) / .22);
  --e4: 0 1px 2px rgb(var(--shadow-rgb) / .08), 0 12px 24px -8px rgb(var(--shadow-rgb) / .18);
}

/* =========================================================================
   SEMANTIC LAYER, DARK. Same names. Components never touch a ramp step.
   ========================================================================= */
:root[data-theme="dark"]{
  color-scheme: dark;

  --canvas:      #0B1415;
  --paper:       #121D1E;
  --surface:     #1A2627;
  --surface-2:   #243132;

  --rule:        #243132;
  --rule-2:      #303F40;   /* 1.70:1 on canvas. DECORATIVE, gate excluded   */
  --edge:        #6C7B7B;   /* 4.23 / 3.90 / 3.52 / 3.05 STRUCTURAL, gated   */
  --control:     #6C7B7B;
  --control-hover:#8B999A;

  --ink:         #F2F5F5;
  --text-2:      #9BAAAB;
  --text-3:      #8B999A;
  --ink-invert:  #0B1415;

  --accent:      #70C1C1;   /* 8.97:1 link, text accent, primary fill */
  --accent-hover:#A8D7D6;   /* 11.87:1 */
  --accent-press:#36A9A9;   /*  6.58:1 */
  --accent-fg:   #042121;   /*  8.10 on accent, 10.73 on hover, 5.95 on press */
  --accent-wash: #112928;
  --accent-tint: #163333;
  --focus:       #70C1C1;

  --band:        #163333;
  --bound:       #8B999A;   /* 4.56 on track, 4.58 on tint */
  --median:      #70C1C1;   /* 6.46 on track, 6.49 on tint. dE 0.108 vs bound */
  --ref:         #F2F5F5;

  --ok:          #79D28D;  --ok-wash:      #162B1B;
  --caution:     #F4B359;  --caution-wash: #34230B;
  --danger:      #F47C70;  --danger-wash:  #381C19;
  --info:        #8CB2F1;  --info-wash:    #1A2539;
  --locked:      #9BAAAB;  --locked-wash:  #1B2222;
  --locked-hatch:#243132;   /* 5.60:1 */

  --row-hover:   color-mix(in oklch, var(--ink) 6%, transparent);
  --scrim:       rgb(4 8 9 / .64);
  --shadow-rgb:  0 0 0;

  --hdr-fill:       rgb(11 20 21 / .90);
  --hdr-fill-solid: #0B1415;
  --hdr-rule:       #243132;
  --hdr-blur:       blur(16px) saturate(160%);

  --e1: 0 1px 0 rgb(255 255 255 / .10);
  --e2: 0 8px 24px -8px rgb(0 0 0 / .60), inset 0 1px 0 rgb(255 255 255 / .06);
  --e3: 0 24px 64px -16px rgb(0 0 0 / .72), inset 0 1px 0 rgb(255 255 255 / .07);
  --e4: 0 12px 32px -12px rgb(0 0 0 / .66), inset 0 1px 0 rgb(255 255 255 / .06);
}

/* The tool resolves the system preference on first visit. Marketing cannot
   reach this rule because it stamps data-theme="light" in the HTML. */
@media (prefers-color-scheme: dark){
  :root[data-theme="auto"]{
    color-scheme: dark;
    --canvas:#0B1415; --paper:#121D1E; --surface:#1A2627; --surface-2:#243132;
    --rule:#243132; --rule-2:#303F40; --edge:#6C7B7B;
    --control:#6C7B7B; --control-hover:#8B999A;
    --ink:#F2F5F5; --text-2:#9BAAAB; --text-3:#8B999A; --ink-invert:#0B1415;
    --accent:#70C1C1; --accent-hover:#A8D7D6; --accent-press:#36A9A9;
    --accent-fg:#042121; --accent-wash:#112928; --accent-tint:#163333; --focus:#70C1C1;
    --band:#163333; --bound:#8B999A; --median:#70C1C1; --ref:#F2F5F5;
    --ok:#79D28D; --ok-wash:#162B1B; --caution:#F4B359; --caution-wash:#34230B;
    --danger:#F47C70; --danger-wash:#381C19; --info:#8CB2F1; --info-wash:#1A2539;
    --locked:#9BAAAB; --locked-wash:#1B2222; --locked-hatch:#243132;
    --row-hover: color-mix(in oklch, var(--ink) 6%, transparent);
    --scrim: rgb(4 8 9 / .64); --shadow-rgb: 0 0 0;
    --hdr-fill: rgb(11 20 21 / .90); --hdr-fill-solid:#0B1415;
    --hdr-rule:#243132; --hdr-blur: blur(16px) saturate(160%);
    --e1: 0 1px 0 rgb(255 255 255 / .10);
    --e2: 0 8px 24px -8px rgb(0 0 0 / .60), inset 0 1px 0 rgb(255 255 255 / .06);
    --e3: 0 24px 64px -16px rgb(0 0 0 / .72), inset 0 1px 0 rgb(255 255 255 / .07);
    --e4: 0 12px 32px -12px rgb(0 0 0 / .66), inset 0 1px 0 rgb(255 255 255 / .06);
  }
}

/* --- BREAKPOINT SCALING OF THE TOKENS ------------------------------------
   Discrete steps. No clamp() on anything that must land on the grid: clamp
   hands you 37.4px and the computed line height stops being assertable. */
@media (min-width:768px){
  :root{
    --fs-d1:52px;    --lh-d1:1.14;  --ls-d1:-0.022em;
    --fs-ratio:60px; --ls-ratio:-0.026em;
    --fs-h2:30px;    --fs-h3:20px;  --fs-lead:18px;  --fs-input:15px;
    --lh-input:22px;
    --gutter:24px;   --section-y:96px;  --pad-card:20px; --pad-tile:16px;
    --track-h:52px;  --track-h-sm:36px;
  }
}
@media (min-width:1200px){
  :root{
    --fs-d1:64px;    --lh-d1:1.05;  --ls-d1:-0.030em;
    --fs-ratio:72px; --ls-ratio:-0.028em;
    --fs-h2:34px;    --fs-h3:22px;  --fs-h4:17px;    --fs-lead:19px;
    --gutter:32px;   --section-y:128px; --pad-card:24px; --pad-tile:20px;
  }
}
```

---

## 2. Base, reset, typography, tabular numerals

```css
/* 02-base.css */

/* --- FONTS. One webfont file, one origin, zero third parties. ------------ */
@font-face{
  font-family:"Inter var";
  src:url(/f/inter-var-latin.woff2) format("woff2");
  font-weight:100 900; font-style:normal; font-display:swap;
  unicode-range:U+0000-00FF,U+2000-206F,U+2212,U+2013,U+2022,U+00B7;
}
/* Metric matched fallback. Measured CLS 0.00 on throttled mobile. */
@font-face{
  font-family:"Inter Fallback";
  src:local("Helvetica Neue"),local("Arial");
  size-adjust:107%; ascent-override:90%; descent-override:22.43%; line-gap-override:0%;
}
/* Mono metric normalisation at zero bytes. CSS font matching takes the LAST
   declared rule whose src resolves, so these are declared in REVERSE
   preference order. Consolas is about 6% wider than SF Mono at the same px,
   which throws a fixed table column off on Windows. Verify, do not assume:
   render 0000000000 in --mono at 15px and assert getBoundingClientRect().width
   lands within 1px of 108px on macOS, Windows and Linux. If an engine refuses
   the fall through, delete size-adjust and buy Geist Mono (SIL OFL 1.1). */
@font-face{font-family:"Mono UI";src:local("Liberation Mono");size-adjust:102%}
@font-face{font-family:"Mono UI";src:local("Consolas");size-adjust:94%}
@font-face{font-family:"Mono UI";src:local("Menlo");size-adjust:98%}
@font-face{font-family:"Mono UI";src:local("SF Mono"),local("SFMono-Regular");size-adjust:100%}

/* --- RESET -------------------------------------------------------------- */
*,*::before,*::after{ box-sizing:border-box }
*{ margin:0 }

html{
  -webkit-text-size-adjust:100%;
  text-size-adjust:100%;
  scrollbar-gutter:stable;
  overflow-x:clip;              /* clip, NEVER hidden. hidden kills sticky   */
  -webkit-tap-highlight-color:transparent;
}
body{
  overflow-x:clip;
  background:var(--canvas);
  color:var(--ink);
  font:400 var(--fs-body)/var(--lh-body) var(--sans);
  letter-spacing:var(--ls-body);
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  text-rendering:optimizeLegibility;
  font-synthesis-weight:none;
}
img,svg,video,canvas{ display:block; max-inline-size:100%; block-size:auto }
button,input,select,textarea{ font:inherit; color:inherit; letter-spacing:inherit }
button{ background:none; border:0; padding:0; cursor:pointer; touch-action:manipulation }
a{ color:var(--accent); text-decoration:none }
a:hover{ text-decoration:underline; text-underline-offset:3px; text-decoration-thickness:1px }
ul,ol{ padding:0; list-style:none }
table{ border-collapse:separate; border-spacing:0 }
:where(p,li,dd){ text-wrap:pretty }
:where(h1,h2,h3,h4){ text-wrap:balance }
::selection{ background:var(--accent-tint); color:var(--ink) }
:target{ scroll-margin-block-start:calc(var(--hdr-h) + var(--s5)) }

/* Focus. One rule, everywhere, and it NEVER transitions: a keyboard user
   tabbing at speed must not see a smear. */
:focus-visible{
  outline:var(--bw-focus) solid var(--focus);
  outline-offset:2px;
  border-radius:var(--r-sm);
  transition:none;
}
:focus:not(:focus-visible){ outline:none }

.sr-only{
  position:absolute; inline-size:1px; block-size:1px; padding:0; margin:-1px;
  overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0;
}
.skip{
  position:absolute; inset-block-start:-100%; inset-inline-start:var(--s4);
  z-index:calc(var(--z-header) + 1); background:var(--paper); color:var(--ink);
  border:1px solid var(--edge); border-radius:var(--r-ctl);
  padding:var(--s3) var(--s4); font:600 var(--fs-btn)/var(--lh-btn) var(--sans);
}
.skip:focus-visible{ inset-block-start:var(--s2) }

/* --- LAYOUT PRIMITIVES --------------------------------------------------- */
.container{
  inline-size:100%; max-inline-size:var(--content-max);
  margin-inline:auto; padding-inline:var(--gutter);
}
.container--data{ max-inline-size:var(--table-max) }
.grid{
  display:grid; gap:var(--gutter);
  grid-template-columns:repeat(4,minmax(0,1fr));
}
/* minmax(0,1fr) not 1fr. A long payer name in a grid child sets a min content
   floor and pushes the whole page sideways. */
section{ padding-block:var(--section-y) }
.stack > * + *{ margin-block-start:var(--s4) }
.prose{ max-inline-size:var(--measure) }

/* --- TYPOGRAPHY CLASSES -------------------------------------------------- */
.d1{ font:600 var(--fs-d1)/var(--lh-d1) var(--sans); letter-spacing:var(--ls-d1); color:var(--ink) }
.h2{ font:600 var(--fs-h2)/var(--lh-h2) var(--sans); letter-spacing:var(--ls-h2); color:var(--ink) }
.h3{ font:600 var(--fs-h3)/var(--lh-h3) var(--sans); letter-spacing:var(--ls-h3); color:var(--ink) }
.h4{ font:600 var(--fs-h4)/var(--lh-h4) var(--sans); letter-spacing:var(--ls-h4); color:var(--ink) }
.lead{ font:400 var(--fs-lead)/var(--lh-lead) var(--sans); letter-spacing:var(--ls-lead); color:var(--text-2); max-inline-size:52ch }
.body{ font:400 var(--fs-body)/var(--lh-body) var(--sans); letter-spacing:var(--ls-body) }
.sm{ font:400 var(--fs-sm)/var(--lh-sm) var(--sans); letter-spacing:-0.01em; color:var(--text-2) }

/* THE REGISTER LAW: mono means machine produced fact, sans means editorial
   claim. The ratio and the display dollar are headlines and stay in sans. */
.micro{
  font:500 var(--fs-micro)/var(--lh-micro) var(--mono);
  letter-spacing:var(--ls-micro); text-transform:uppercase; color:var(--text-2);
}
.mono{ font:500 var(--fs-mono)/var(--lh-mono) var(--mono); letter-spacing:0 }
.mono-sm{ font:500 var(--fs-mono-sm)/var(--lh-mono-sm) var(--mono); letter-spacing:0 }
.cpt{ font:500 var(--fs-mono)/var(--lh-mono) var(--mono); letter-spacing:0; color:var(--ink) }
.n{ font:400 var(--fs-n)/var(--lh-n) var(--mono); letter-spacing:0; color:var(--text-3) }

/* Single tracking law. Nobody eyeballs tracking again. */
h1,h2,h3,h4,h5,p,li,body,button,label{ letter-spacing:-0.02em }
.micro{ letter-spacing:var(--ls-micro) }
.num,.cpt,.n,.mono,.mono-sm,td,th,input,select,textarea{ letter-spacing:0 }

/* --- THE TABULAR NUMERAL UTILITY. Applied by MEANING, never on body. -----
   Setting this on body stamps "2026" in a sentence. */
.num,.stat,.cpt,.n,.fig,.tnum,
td.num,th.num,
input[inputmode="numeric"],
input[type="range"] + .field__read{
  font-variant-numeric: tabular-nums lining-nums slashed-zero;
  font-feature-settings:"tnum" 1,"lnum" 1,"zero" 1;
  font-variant-ligatures:none;
  letter-spacing:0;
}
td.num,th.num{ text-align:end }
.num .cur{ font-size:.82em; color:var(--text-3); margin-inline-end:.08em }
.num{ font-family:var(--mono); font-weight:500 }
/* The headline figure is the one number that is sans, because mono at 60px
   goes gappy and needs -0.05em to survive. */
.fig-lg{
  font:600 var(--fs-ratio)/var(--lh-ratio) var(--sans);
  letter-spacing:var(--ls-ratio); color:var(--ink);
  font-variant-numeric: tabular-nums lining-nums slashed-zero;
  font-feature-settings:"tnum" 1,"lnum" 1,"zero" 1;
}

/* --- PROVENANCE. Six slots, one string table, four surfaces. ------------- */
.prov{
  display:grid; grid-template-columns:1fr; gap:var(--s1) 0;
  border-block-start:1px solid var(--rule); padding-block-start:var(--s3);
  font-size:var(--fs-n); line-height:18px; color:var(--text-2);
}
@media (min-width:390px){
  .prov{ grid-template-columns:max-content 1fr; column-gap:var(--s4) }
}
.prov dt{
  font-family:var(--mono); font-size:var(--fs-micro); line-height:18px;
  text-transform:uppercase; letter-spacing:var(--ls-micro); color:var(--text-3);
}
.prov dd{ font-family:var(--mono); color:var(--text-2) }

/* --- PRINT AND EXPORT. Light, forced, always. --------------------------- */
@media print{
  :root,:root[data-theme="dark"],:root[data-theme="auto"]{
    color-scheme:light;
    --canvas:#FFFFFF; --paper:#FFFFFF; --surface:#F7F8F8; --surface-2:#F0F2F2;
    --rule:#B9C0C0; --rule-2:#9FA8A8; --edge:#5A6A6B;
    --control:#5A6A6B; --control-hover:#3E4E4F;
    --ink:#0B1415; --text-2:#3E4E4F; --text-3:#3E4E4F;
    --accent:#0F5C5C; --accent-hover:#084646; --accent-press:#053232;
    --accent-fg:#FFFFFF; --accent-wash:#F4FAFA; --accent-tint:#E6F3F3;
    --band:#DCE8E7; --bound:#3E4E4F; --median:#084646; --ref:#0B1415;
    --locked:#3E4E4F; --locked-wash:#F1F5F5; --locked-hatch:#E4E7E7;
    --shadow-rgb:11 20 21;
  }
  /* #E4E7E7 disappears on a laser printer. #B9C0C0 is 1.85:1 and survives. */
  *{ box-shadow:none !important; backdrop-filter:none !important;
     -webkit-print-color-adjust:exact; print-color-adjust:exact }
  .hdr,.toast,.tooltip,.rail__nav,.progress,.sheet,.hf,.probe{ display:none !important }
  .prov{ display:grid !important; break-inside:avoid }
  table{ break-inside:auto } tr{ break-inside:avoid }
  .dist,.card,.tile{ break-inside:avoid }
  a[href^="http"]::after{ content:" (" attr(href) ")"; font-size:11px; color:#3E4E4F }
}
```

---

## 3. Components

```css
/* 03-components.css

   ONE ANIMATION CONTRACT, ENFORCED BY THE GATE IN section 9:
   only transform, opacity and clip-path(inset) ever appear in a transition
   or a keyframe. Colour, border colour and background CHANGE, discretely,
   in one frame, with no transition declared. Filled surfaces that want a
   smooth hover use an ::after overlay and animate its opacity. */

/* ============================== BUTTON ==================================== */
.btn{
  position:relative; display:inline-flex; align-items:center; justify-content:center;
  gap:var(--s2); inline-size:fit-content; white-space:nowrap; user-select:none;
  block-size:40px; min-block-size:var(--tap); padding-inline:16px;
  border-radius:var(--r-ctl); border:var(--bw-ctl) solid transparent;
  font:600 var(--fs-btn)/var(--lh-btn) var(--sans); letter-spacing:-0.01em;
  isolation:isolate;
}
.btn > *{ position:relative; z-index:1 }
.btn::after{
  content:""; position:absolute; inset:0; border-radius:inherit; z-index:0;
  opacity:0; transition:opacity var(--d-fast) var(--ease);
}
.btn--sm{ block-size:32px; padding-inline:12px }
.btn--lg{ block-size:44px; padding-inline:20px }
@media (max-width:767px){ .btn,.btn--sm{ block-size:var(--tap) } }
.btn:focus-visible{ outline:var(--bw-focus) solid var(--focus); outline-offset:2px }
.btn[aria-disabled="true"],.btn:disabled{ cursor:not-allowed; pointer-events:none }

/* PRIMARY. One token mapping: fill=--accent, hover=--accent-hover,
   press=--accent-press, label=--accent-fg. It reads correctly in both
   themes because the tokens move away from the surface in each. */
.btn--primary{ background:var(--accent); color:var(--accent-fg) }
.btn--primary::after{ background:var(--accent-hover) }
.btn--primary:active::after{ background:var(--accent-press) }
.btn--primary:disabled,.btn--primary[aria-disabled="true"]{
  background:var(--surface-2); color:var(--control); border-color:var(--rule);
}
.btn--primary:disabled::after{ content:none }

/* SECONDARY, outline. Border is --control, which is gated at 3:1. */
.btn--secondary{ background:var(--paper); color:var(--ink); border-color:var(--control) }
.btn--secondary:active{ background:var(--surface-2) }
.btn--secondary:disabled,.btn--secondary[aria-disabled="true"]{
  color:var(--control); border-color:var(--rule); background:var(--paper);
}

/* TERTIARY, text. */
.btn--tertiary{ background:transparent; color:var(--accent); padding-inline:8px }
.btn--tertiary:active{ background:var(--accent-tint); color:var(--accent-press) }
.btn--tertiary:disabled,.btn--tertiary[aria-disabled="true"]{ color:var(--control) }

/* DESTRUCTIVE modifier. Never the only signal: always paired with a confirm
   dialog that names the object. */
.btn--danger{ background:var(--danger); color:#FFFFFF }
.btn--danger::after{ background:color-mix(in oklch, var(--danger) 82%, var(--ink)) }

@media (hover:hover) and (pointer:fine){
  .btn:hover::after{ opacity:1 }
  .btn--secondary:hover{ background:var(--surface); border-color:var(--control-hover) }
  .btn--tertiary:hover{ background:var(--accent-wash); color:var(--accent-hover) }
  .btn:disabled:hover::after,.btn[aria-disabled="true"]:hover::after{ opacity:0 }
}
.btn:active::after{ opacity:1 }

/* LOADING. Width is frozen by the caller before the swap, so the button
   cannot resize. Never billed, never a spinner under reduced motion. */
.btn[data-busy="true"]{ pointer-events:none }
.btn[data-busy="true"] .btn__label{ opacity:.7 }
.btn__spin{
  inline-size:16px; block-size:16px; border-radius:50%;
  border:2px solid currentColor; border-block-start-color:transparent;
}
.btn__busytext{ display:none }

/* ============================== INPUT ===================================== */
.field{ display:grid; gap:var(--s1) }
.field__label{
  font:500 var(--fs-micro)/var(--lh-micro) var(--mono);
  letter-spacing:var(--ls-micro); text-transform:uppercase; color:var(--text-2);
}
.input{
  block-size:40px; min-block-size:var(--tap); inline-size:100%;
  padding-inline:12px; background:var(--paper); color:var(--ink);
  border:var(--bw-ctl) solid var(--control); border-radius:var(--r-ctl);
  font:400 var(--fs-input)/var(--lh-input) var(--sans);
}
@media (min-width:768px){ .input{ min-block-size:0 } }
.input::placeholder{ color:var(--text-3); opacity:1 }
.input:hover{ border-color:var(--control-hover) }
.input:focus-visible{
  border-color:var(--focus);
  outline:var(--bw-focus) solid var(--focus); outline-offset:1px;
}
.input[data-filled="true"]{ font-weight:500 }
.input[aria-invalid="true"]{ background:var(--danger-wash); border-color:var(--danger) }
.input:read-only{ background:var(--surface); border-color:var(--rule) }
.input:disabled{
  background:var(--surface-2); border-color:var(--rule); color:var(--control);
  cursor:not-allowed;   /* never opacity: it stacks unpredictably on nested fills */
}
.field__err{
  display:flex; gap:var(--s1); align-items:flex-start;
  font:400 var(--fs-sm)/var(--lh-sm) var(--sans); color:var(--danger);
}
.field__err svg{ flex:0 0 16px; margin-block-start:2px }
.field__hint{ font:400 var(--fs-sm)/var(--lh-sm) var(--sans); color:var(--text-3) }
.field__affix{
  display:inline-flex; align-items:center; justify-content:center;
  inline-size:32px; font:400 var(--fs-mono)/var(--lh-mono) var(--mono); color:var(--text-3);
}

/* ========================= SELECT AND COMBOBOX ============================ */
.select{ position:relative; display:block }
.select > select.input{ appearance:none; padding-inline-end:36px }
.select__chev{
  position:absolute; inset-inline-end:12px; inset-block-start:50%;
  inline-size:16px; block-size:16px; margin-block-start:-8px;
  color:var(--text-2); pointer-events:none;
  transition:transform var(--d-fast) var(--ease);
}
.select[data-open="true"] .select__chev{ transform:rotate(180deg) }

.listbox{
  position:absolute; inset-inline:0; inset-block-start:calc(100% + 4px);
  z-index:var(--z-dropdown);
  background:var(--paper); border:1px solid var(--rule); border-radius:var(--r-md);
  box-shadow:var(--e2);
  max-block-size:min(320px,50vh); overflow-y:auto;
  overscroll-behavior:contain; scrollbar-width:thin;
  transform-origin:top center;
  transition:opacity var(--d-fast) var(--ease), transform var(--d-fast) var(--ease);
}
.listbox[hidden]{ display:none }   /* not opacity:0. never a focus trap in a ghost */
.listbox[data-enter="true"]{ opacity:0; transform:translateY(-4px) }
.opt{
  display:flex; align-items:center; gap:var(--s2);
  block-size:36px; min-block-size:var(--tap); padding-inline:12px;
  color:var(--ink); cursor:pointer;
  border-inline-start:2px solid transparent;
}
@media (min-width:768px){ .opt{ min-block-size:0 } }
@media (hover:hover) and (pointer:fine){ .opt:hover{ background:var(--surface) } }
/* The active descendant never transitions: arrow keys at 20 per second must
   not smear. */
.opt[data-active="true"]{ background:var(--accent-tint); border-inline-start-color:var(--accent); transition:none }
.opt[aria-selected="true"]{ background:var(--accent-wash); transition:none }
.opt[aria-selected="true"] .opt__check{ color:var(--accent) }
.opt[aria-disabled="true"]{ color:var(--control); cursor:not-allowed }
.opt__check{ inline-size:16px; block-size:16px; color:transparent; flex:0 0 16px }
.listbox__group{
  padding:var(--s2) 12px 0;
  font:500 var(--fs-micro)/var(--lh-micro) var(--mono);
  letter-spacing:var(--ls-micro); text-transform:uppercase; color:var(--text-3);
}
.listbox__empty{
  padding:var(--s3) 12px; font:400 var(--fs-sm)/var(--lh-sm) var(--sans);
  color:var(--text-2);
}
/* The empty string is "Insufficient public data". Not a spinner, not a dash. */

/* =============================== CARD ==================================== */
.card{
  background:var(--paper); border:1px solid var(--rule);
  border-radius:var(--r-card); padding:var(--pad-card);
}
.card__head{
  display:flex; align-items:baseline; justify-content:space-between;
  gap:var(--s3); margin-block-end:var(--s3);
}
.card__title{ font:600 var(--fs-h3)/var(--lh-h3) var(--sans); letter-spacing:var(--ls-h3); color:var(--ink) }
.card__meta{ font:400 var(--fs-n)/var(--lh-n) var(--mono); color:var(--text-3) }
a.card,.card--interactive{ display:block; color:inherit }
a.card:hover,.card--interactive:hover{ border-color:var(--control); background:var(--n-25); text-decoration:none }
:root[data-theme="dark"] a.card:hover,
:root[data-theme="dark"] .card--interactive:hover{ background:var(--surface) }
/* No hover lift, no shadow bloom. A card that rises when you point at it is a
   marketing card, and a lift breaks the lattice that shared edges create. */
a.card:focus-visible,.card--interactive:focus-visible{ outline:var(--bw-focus) solid var(--focus); outline-offset:2px }
.card[aria-selected="true"],.card--selected{
  border-color:var(--accent); background:var(--accent-wash);
  box-shadow:inset 3px 0 0 var(--accent);
}
/* The lattice. Adjacent cards share one hairline instead of floating. */
.lattice{ display:grid; gap:0 }
.lattice > .card{ border-radius:0; margin-inline-start:-1px; margin-block-start:-1px }
.lattice > .card:first-child{ border-start-start-radius:var(--r-card) }
.lattice > .card:last-child{ border-end-end-radius:var(--r-card) }

/* ============================= STAT TILE ================================= */
.tile{
  display:grid; gap:var(--s1); align-content:start;
  background:var(--surface); border:1px solid var(--rule);
  border-radius:var(--r-md); padding:var(--pad-tile);
  min-block-size:var(--tile-min);
}
.tile__label{
  font:500 var(--fs-micro)/var(--lh-micro) var(--mono);
  letter-spacing:var(--ls-micro); text-transform:uppercase; color:var(--text-2);
}
.tile__value{
  font:600 32px/1 var(--sans); letter-spacing:-0.024em; color:var(--ink);
  font-variant-numeric:tabular-nums lining-nums slashed-zero;
  font-feature-settings:"tnum" 1,"lnum" 1,"zero" 1;
}
@media (min-width:768px){ .tile__value{ font-size:40px } }
@media (min-width:1200px){ .tile__value{ font-size:44px } }
.tile__n{ font:400 var(--fs-n)/var(--lh-n) var(--mono); color:var(--text-3) }
/* Every tile carries its n as a sibling span. Never a tooltip. */
.tile .badge{ border-radius:var(--r-xs) }   /* inner = max(2px, 6 - 12) = 2px */

/* ===================== THE DISTRIBUTION GRAPHIC ==========================
   A CALIPER, not a tinted rectangle.

   The tint measured 1.116:1 against its own track in light and 1.003:1 in
   dark. It was invisible and it was carrying the meaning. Meaning now lives
   in geometry that clears 1.4.11 by 68% at its worst point:

     bound  2px vertical at p25 and p75, --bound   5.04 on track / 4.51 on tint
     spine  2px horizontal joining them, --bound   same
     median 3px vertical, --median               9.46 on track / 8.48 on tint
     ref    1px dashed, --ref (ink)             16.61 on track / 14.88 on tint

   No two marks share both weight and pattern, which is the rule that
   replaced a categorical dE bar that never applied to differently shaped
   marks. Measured OKLab dE median vs bound: 0.158 light, 0.108 dark.
   --band may be set to transparent with zero information loss.
   ======================================================================== */
.dist{ display:grid; gap:var(--s2) }
.dist__head{
  display:flex; flex-wrap:wrap; gap:var(--s1) var(--s2);
  font:500 var(--fs-micro)/var(--lh-micro) var(--mono);
  letter-spacing:var(--ls-micro); text-transform:uppercase; color:var(--text-2);
}
/* Measured at 320: code plus description plus geography is 39 characters at
   12px mono with 0.08em tracking, which is about 320px in a 288px column, so
   it wrapped to two lines and took 16px out of the fold. Below 390 the head
   carries the code and the geography, which are what identify the row. The
   description is in the aria-label and in the provenance block at every
   width, so nothing is lost. */
.dist__head .cpt{ font-size:var(--fs-micro); line-height:var(--lh-micro) }
.dist__desc{ display:none }
@media (min-width:390px){ .dist__desc{ display:inline } }
.dist__track{
  position:relative; block-size:var(--track-h);
  background:var(--surface-2); border:1px solid var(--rule);
  border-radius:var(--r-track); overflow:hidden;
  --ref-x:-100%;   /* sentinel. If the stored Medicare dollar is absent the
                      server never emits .dist__ref, and if a stray one ever
                      renders it is off canvas rather than sitting at $0. */
}
.dist--compact .dist__track{ block-size:var(--track-h-sm) }
.dist__tint{
  position:absolute; inset-block:0;
  inset-inline-start:var(--p25);
  inline-size:calc(var(--p75) - var(--p25)); min-inline-size:2px;
  background:var(--band);
}
.dist__spine{
  position:absolute; inset-block-start:50%;
  inset-inline-start:var(--p25);
  inline-size:calc(var(--p75) - var(--p25)); min-inline-size:2px;
  block-size:var(--bw-spine); margin-block-start:calc(var(--bw-spine) / -2);
  background:var(--bound); transform-origin:left center;
}
.dist__bound{
  position:absolute; inset-block:0; inline-size:var(--bw-bound);
  margin-inline-start:calc(var(--bw-bound) / -2); background:var(--bound);
}
.dist__bound--p25{ inset-inline-start:var(--p25) }
.dist__bound--p75{ inset-inline-start:var(--p75) }
.dist__median{
  position:absolute; inset-block:0; inset-inline-start:var(--p50);
  inline-size:var(--bw-median); margin-inline-start:calc(var(--bw-median) / -2);
  background:var(--median);
  box-shadow:0 0 0 1px var(--band);   /* p50 is inside [p25,p75] by definition,
                                         so the halo is always band coloured.
                                         It keeps the median readable when it
                                         lands on top of a bound. */
}
.dist__ref{
  position:absolute; inset-block:0; inset-inline-start:var(--ref-x);
  border-inline-start:var(--bw-ref) dashed var(--ref);
}
/* --ref-x is rendered ONLY from the stored Medicare fee schedule field.
   186% of Medicare does not license computing 589 / 1.86 = 316.67 and
   putting a mark there. Absent the stored dollar, .dist__ref is not in the
   DOM at all and no reference label appears. */
.dist__axis{
  display:flex; justify-content:space-between;
  font:400 var(--fs-n)/var(--lh-n) var(--mono); color:var(--text-3);
}

/* The caption is a GRID, not a sentence. Inline, it is 56 characters at
   15px mono, which is 504px and wraps to two unpredictable lines in a 288px
   column. As a grid its height is deterministic at every width. */
.dist__cap{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--s1) var(--s2) }
.dist__cap .lab{
  grid-row:1; font:500 var(--fs-micro)/var(--lh-micro) var(--mono);
  letter-spacing:var(--ls-micro); text-transform:uppercase; color:var(--text-2);
}
.dist__cap .num{ grid-row:2; font:500 var(--fs-mono)/var(--lh-mono) var(--mono); color:var(--ink) }
.dist__cap .stats{
  grid-row:3; grid-column:1 / -1;
  font:400 var(--fs-n)/var(--lh-n) var(--mono); color:var(--text-3);
}
.dist--compact .dist__cap{ display:block; font:400 var(--fs-n)/var(--lh-n) var(--mono); color:var(--text-2) }

/* Honest states. A track is never drawn without its observation count. */
.dist[data-state="no-count"] .dist__track,
.dist[data-state="unavailable"] .dist__track,
.dist[data-state="suppressed"] .dist__track{ display:none }
.dist__note{
  font:400 var(--fs-mono-sm)/var(--lh-mono-sm) var(--mono); color:var(--text-2);
  border:1px dashed var(--control); border-radius:var(--r-sm);
  padding:var(--s2) var(--s3);
  background-image:repeating-linear-gradient(45deg,var(--surface-2) 0 2px,transparent 2px 4px);
}

/* ============================== BADGE ==================================== */
.badge{
  display:inline-flex; align-items:center; gap:4px;
  block-size:20px; padding-inline:8px; border-radius:var(--r-xs);
  font:500 var(--fs-micro)/1 var(--mono); letter-spacing:var(--ls-micro);
  text-transform:uppercase; white-space:nowrap;
}
.badge--md{ block-size:24px }
.badge svg{ inline-size:12px; block-size:12px }
.badge--neutral{ background:var(--surface-2); color:var(--ink) }
.badge--accent { background:var(--accent-tint); color:var(--accent-hover) }
:root[data-theme="dark"] .badge--accent{ color:var(--accent-hover) }
.badge--ok     { background:var(--ok-wash); color:var(--ok) }
.badge--caution{ background:var(--caution-wash); color:var(--caution) }
.badge--danger { background:var(--danger-wash); color:var(--danger) }
.badge--info   { background:var(--info-wash); color:var(--info) }
.badge--locked {
  background:var(--locked-wash); color:var(--locked);
  background-image:repeating-linear-gradient(45deg,var(--locked-hatch) 0 2px,transparent 2px 4px);
}
/* Every badge carries a WORD. A coloured dot alone is banned. */

/* ============================ LOCK / GATED =============================== */
/* HARD: a locked value is never rendered into the DOM and hidden. Not
   blurred, not color:transparent, not display:none. The server returns a
   locked state carrying no figure at all. If the bytes reach the browser
   the value is public. */
.fig[data-state="locked"]{
  display:inline-flex; align-items:center; gap:var(--s2);
  padding:var(--s1) var(--s2);
  color:var(--locked); background:var(--locked-wash);
  border:1px dashed var(--control); border-radius:var(--r-sm);
  background-image:repeating-linear-gradient(45deg,var(--locked-hatch) 0 2px,transparent 2px 4px);
  font:500 var(--fs-mono-sm)/var(--lh-mono-sm) var(--mono);
}
.fig[data-state="locked"] svg{ inline-size:14px; block-size:14px; flex:0 0 14px }
/* Locked is not an error. Never --danger, never --caution. */

/* ============================== TABLE ==================================== */
.t-wrap{
  overflow-x:auto; overscroll-behavior-x:contain;
  scroll-snap-type:x proximity; scrollbar-width:thin;
  position:relative; background-color:var(--paper);
  /* Scrolling shadows. Pure CSS, works on iOS Safari, auto hides at both
     ends and when there is no overflow. This replaces the scroll-state()
     edge affordance, which is Chrome 133+ only and silently did nothing on
     the primary mobile browser. The local layer is a cover that slides with
     the content and masks the scroll layer beneath it. */
  background-image:
    linear-gradient(to left, var(--paper) 40%, rgb(var(--shadow-rgb) / 0)),
    radial-gradient(farthest-side at 100% 50%, rgb(var(--shadow-rgb) / .16), rgb(var(--shadow-rgb) / 0));
  background-position:right center, right center;
  background-size:24px 100%, 14px 100%;
  background-repeat:no-repeat, no-repeat;
  background-attachment:local, scroll;
}
.t{
  --col-key:180px; --col-num:96px;
  table-layout:fixed;          /* with an explicit colgroup this removes the
                                  intrinsic width pass. inline-size:max-content
                                  forced the engine to measure every row to
                                  resolve the width, which defeated the whole
                                  point of content-visibility: you paid the
                                  memory and got none of the skipping. */
  inline-size:100%;
  min-inline-size:calc(var(--col-key) + 7 * var(--col-num));
}
.t .c-key{ inline-size:var(--col-key) }
.t .c-num{ inline-size:var(--col-num) }
.t caption{
  text-align:start; padding-block-end:var(--s2);
  font:600 var(--fs-h4)/var(--lh-h4) var(--sans); color:var(--ink);
}
.t th,.t td{
  padding-inline:12px; block-size:var(--tap);
  border-block-end:1px solid var(--rule);
  font:500 var(--fs-mono)/var(--lh-mono) var(--mono);
  font-variant-numeric:tabular-nums lining-nums slashed-zero;
  font-feature-settings:"tnum" 1,"lnum" 1,"zero" 1;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  background:transparent;      /* transparent so the scrolling shadow shows */
}
.t thead th{
  font:500 var(--fs-micro)/var(--lh-micro) var(--mono);
  letter-spacing:var(--ls-micro); text-transform:uppercase;
  color:var(--text-2); text-align:start; background:var(--paper);
}
.t td.num,.t th.num{ text-align:end }
/* No zebra striping. It doubles the noise on a page that is already a
   lattice, and a striped background on the sticky cell either breaks the
   pin or breaks the stripe. */
@media (hover:hover) and (pointer:fine){
  .t tbody tr:hover td{ background:var(--row-hover) }
  .t tbody tr:hover th[scope="row"],
  .t tbody tr:hover td:first-child{
    background-image:linear-gradient(var(--row-hover),var(--row-hover));
  }
}
.t tbody tr[aria-selected="true"] td,
.t tbody tr[aria-selected="true"] th[scope="row"]{ background:var(--accent-wash) }
.t tbody tr[aria-selected="true"] th[scope="row"]{ box-shadow:inset 3px 0 0 var(--accent) }
.t tbody tr:focus-within td{ outline:var(--bw-focus) solid var(--focus); outline-offset:-2px }
.t th[scope="row"],.t td:first-child{
  position:sticky; inset-inline-start:0; z-index:var(--z-sticky-cell);
  background:var(--paper);
  border-inline-end:1px solid var(--rule);   /* border, never box-shadow: a
                                                shadow on a sticky element
                                                repaints every scroll frame
                                                on iOS */
}
.t th:not(:first-child){ scroll-snap-align:start }
.thead-sticky{ position:sticky; inset-block-start:var(--app-hdr-h,0px); z-index:var(--z-thead) }
.thead-sticky th{ padding-block:12px; transition:none }
@supports (container-type: scroll-state){
  .t-wrap{ container-type:scroll-state }
  @container scroll-state(stuck: top){
    .thead-sticky th{ padding-block:6px; box-shadow:var(--e1) }
  }
}
/* transition:none is load bearing. Padding is a layout property, so this is
   a discrete state change at the stick boundary: one relayout, zero animated
   frames. Do not improve it with a 160ms transition. */
.t td[data-state="suppressed"]{
  font:400 var(--fs-mono-sm)/var(--lh-mono-sm) var(--mono);
  color:var(--text-2); white-space:normal;
}
tbody.chunk{ content-visibility:auto; contain-intrinsic-size:auto 1100px }
/* 25 rows at 44px, measured. Never contain-intrinsic-size:auto alone or the
   scrollbar jumps and you manufacture the CLS you were avoiding. Confirm
   find in page still reaches off screen rows. JS virtualization is banned
   because it silently kills find in page and print. */

/* ============================= TOOLTIP =================================== */
.tooltip{
  position:absolute; z-index:var(--z-tooltip);
  max-inline-size:260px; padding:8px 10px;
  background:var(--surface-2); color:var(--ink);
  border:1px solid var(--rule-2); border-radius:var(--r-md);
  box-shadow:var(--e2);
  font:400 13px/18px var(--sans); letter-spacing:-0.01em;
  opacity:0; transform:translateY(2px);
  transition:opacity var(--d-fast) var(--ease), transform var(--d-fast) var(--ease);
}
.tooltip[data-open="true"]{ opacity:1; transform:none }
.tooltip[hidden]{ display:none }
.tooltip__arrow{
  position:absolute; inline-size:6px; block-size:6px;
  background:var(--surface-2); border-inline-start:1px solid var(--rule-2);
  border-block-start:1px solid var(--rule-2); transform:rotate(45deg);
}
/* Open delay is --d-tip, 150ms, ONE value in ONE place. 400ms is past the
   point where a user decides the tooltip is broken. Close delay is 0.
   Tooltips carry definitions only. n is never a tooltip, it is a sibling
   span. A tooltip is never the sole carrier of a value, a unit or an n.
   WCAG 1.4.13: hoverable, dismissible on Escape, persistent. */

/* ============================= SKELETON ================================== */
.skel{ background:var(--surface-2); border-radius:var(--r-sm) }
.skel--line{ block-size:20px }
.skel--head{ block-size:28px }
.skel--block{ border-radius:var(--r-md) }
.skel + .skel{ margin-block-start:var(--s2) }
.skel:last-child{ inline-size:62% }
/* A skeleton never occupies a slot that will hold a number. Numbers use
   .fig[data-state="loading"] with $--- , which is a truthful placeholder
   rather than a grey rectangle pretending to be data. */

/* ============================== FIGURE =================================== */
/* The only thing in the codebase permitted to render a number. Placeholders
   carry the same character count and tabular figures as the real value, so
   the swap is zero layout shift. */
.fig{
  display:inline-block; min-block-size:var(--fig-min);
  font-variant-numeric:tabular-nums lining-nums slashed-zero;
  font-feature-settings:"tnum" 1,"lnum" 1,"zero" 1;
}
.fig[data-state="ready"]{ color:var(--ink); transition:none }
.fig[data-state="loading"]{ color:var(--text-3) }
.fig[data-state="unavailable"],
.fig[data-state="suppressed"]{
  font:400 var(--fs-mono-sm)/var(--lh-mono-sm) var(--mono); color:var(--text-2);
}
/* A count up is banned everywhere, with no exception. At 60% of an 800ms
   tween the page states the California median for 70553 is $353, which is
   not a fact. */

/* ======================= DIALOG AND TOAST (support) ====================== */
dialog.modal{
  inline-size:min(560px, 100% - 32px); padding:0; border:1px solid var(--rule);
  border-radius:var(--r-modal); background:var(--paper); color:var(--ink);
  box-shadow:var(--e3);
}
dialog.modal::backdrop{ background:var(--scrim) }
.modal__head{
  display:flex; align-items:center; justify-content:space-between;
  block-size:56px; padding-inline:var(--s5);
  border-block-end:1px solid var(--rule);
  font:600 var(--fs-h3)/var(--lh-h3) var(--sans);
}
.modal__body{ padding:var(--s5); max-block-size:min(70vh,640px); overflow-y:auto; overscroll-behavior:contain }
.modal__foot{
  display:flex; justify-content:flex-end; gap:var(--s2);
  block-size:64px; padding-inline:var(--s5);
  background:var(--surface); border-block-start:1px solid var(--rule);
  align-items:center;
}
@media (max-width:767px){
  dialog.modal{
    inline-size:100%; max-inline-size:100%; margin:auto 0 0;
    border-radius:var(--r-modal) var(--r-modal) 0 0;
    padding-block-end:max(24px, env(safe-area-inset-bottom));
  }
}
.toast{
  position:fixed; z-index:var(--z-toast);
  inset-block-end:max(16px, env(safe-area-inset-bottom)); inset-inline-end:16px;
  inline-size:min(400px, 100% - 32px);
  display:flex; gap:var(--s3); padding:12px 14px;
  background:var(--surface-2); color:var(--ink);
  border:1px solid var(--rule-2); border-radius:var(--r-md); box-shadow:var(--e4);
  font:500 var(--fs-sm)/20px var(--sans);
  border-inline-start:3px solid var(--info);
}
.toast--ok{ border-inline-start-color:var(--ok) }
.toast--danger{ border-inline-start-color:var(--danger) }
@media (max-width:767px){ .toast{ inset-inline:16px; inline-size:auto } }
/* The toast is a system channel. It never carries a rate, a p50 or an n. */
```

---

## 4. Header, nav, scroll aware states, mobile overlay

```css
/* 04-header.css

   Two measured facts drive this whole file:
   1. At 0.86 film alpha, nav text in --text-2 computes 4.20:1 over the worst
      case content beneath. So the film is 0.90 and NAV TEXT IS --ink ONLY.
      Inactive versus active is carried by weight and an underline, never by
      lightness. Worst case composite is #E7E8E8 light and #232B2C dark, and
      --ink measures 15.20:1 and 13.18:1 on those.
   2. --control over the light film is 2.904:1, below the 3:1 non text floor.
      So EVERY control inside the header carries an opaque --paper fill and
      its border is measured against paper, not against the film. */

:root{ --hdr-h:56px }
@media (min-width:768px){ :root{ --hdr-h:64px } }
.app{ --hdr-h:56px; --app-hdr-h:56px }   /* the tool header never grows: a rate
                                            table wants the vertical space */

.hdr{
  position:sticky; inset-block-start:0; z-index:var(--z-header);
  block-size:var(--hdr-h);
  display:flex; align-items:center;
  isolation:isolate;
}
@supports (container-type: scroll-state){ .hdr{ container-type:scroll-state } }

/* The film is a real element, not a pseudo element, so the scroll-state
   container query can reach it and so the blur has its own layer. */
.hdr__film{
  position:absolute; inset:0; z-index:-1; pointer-events:none;
  background:var(--hdr-fill);
  border-block-end:1px solid var(--hdr-rule);
  opacity:1;                       /* LAW 1: base CSS is the finished state */
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))){
  .hdr__film{ background:var(--hdr-fill-solid) }
}
/* The blur is applied ONLY in the stuck state. A backdrop-filter left on a
   transparent layer still costs a full strip readback every frame. */
@supports (container-type: scroll-state) and ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))){
  @container scroll-state(stuck: top){
    .hdr__film{ backdrop-filter:var(--hdr-blur); -webkit-backdrop-filter:var(--hdr-blur) }
  }
}
/* Fade the film in over the first 20px of scroll. Scroll driven, zero JS,
   zero scroll listeners. Where this is unsupported or motion is reduced, the
   base rule above already has the film at full strength, which is legible
   and correct, just always on. */
@supports (animation-timeline: scroll()){
  @media (prefers-reduced-motion: no-preference){
    .hdr__film{
      animation:hdr-film var(--ease-scrub) both;
      animation-timeline:scroll(root block);
      animation-range:0 20px;
    }
  }
}

.hdr__inner{
  inline-size:100%; max-inline-size:var(--content-max); margin-inline:auto;
  padding-inline:var(--gutter);
  display:flex; align-items:center; gap:var(--s5);
}
.hdr__brand{ display:flex; align-items:center; gap:7.5px; color:var(--ink); flex:0 0 auto }
.hdr__brand:hover{ text-decoration:none }
.hdr__brand:focus-visible{ outline:var(--bw-focus) solid var(--focus); outline-offset:4px }
.hdr__mark{ inline-size:40px; block-size:40px; flex:0 0 40px }
@media (max-width:767px){ .hdr__mark{ inline-size:28px; block-size:28px; flex-basis:28px } }
.hdr__word{ font:600 25px/1 var(--sans); letter-spacing:-0.02em }
@media (max-width:767px){ .hdr__word{ font-size:17.5px } }

.nav{ display:none; align-items:center; gap:var(--s5); margin-inline-start:auto }
@media (min-width:900px){ .nav{ display:flex } }
.nav__link{
  position:relative; color:var(--ink);
  font:500 15px/20px var(--sans); letter-spacing:-0.01em;
  padding-block:6px;
}
.nav__link:hover{ text-decoration:none; color:var(--accent); box-shadow:inset 0 -1px 0 currentColor }
.nav__link:active{ color:var(--accent-press) }
.nav__link:focus-visible{ outline:var(--bw-focus) solid var(--focus); outline-offset:3px; border-radius:var(--r-sm) }
.nav__link[aria-current="page"]{ font-weight:600; box-shadow:inset 0 -2px 0 var(--accent) }
/* A nav item that cannot be used is removed, not greyed. There is no
   disabled nav state. */

.hdr__actions{ display:flex; align-items:center; gap:var(--s2); margin-inline-start:auto }
@media (min-width:900px){ .hdr__actions{ margin-inline-start:0 } }
/* MEASURED at 320: brand 90 plus CTA 140 plus burger 44 plus gaps 16 is 290px
   in a 288px column, and the burger clipped at the viewport edge. Below the
   nav breakpoint the header carries the brand and the burger only. The CTA is
   pinned to the bottom of the sheet, where it is a full width target, and the
   hero CTA is 400px down the same screen. */
.hdr__actions .btn--primary{ display:none }
@media (min-width:900px){ .hdr__actions .btn--primary{ display:inline-flex } }
/* Every control inside the header is opaque, see fact 2 at the top. */
.hdr .btn--secondary,.hdr .input,.hdr .theme-toggle{ background:var(--paper) }
.hdr .btn{ block-size:36px; min-block-size:36px }
@media (max-width:767px){ .hdr .btn{ block-size:var(--tap); min-block-size:var(--tap) } }

.theme-toggle{
  display:inline-flex; align-items:center; justify-content:center;
  inline-size:36px; block-size:36px; min-block-size:36px;
  border:1px solid var(--control); border-radius:var(--r-ctl); color:var(--ink);
}
@media (max-width:767px){ .theme-toggle{ inline-size:var(--tap); block-size:var(--tap) } }
.theme-toggle:hover{ border-color:var(--control-hover) }
.theme-toggle:focus-visible{ outline:var(--bw-focus) solid var(--focus); outline-offset:2px }

/* ------------------------------- BURGER --------------------------------- */
.burger{
  display:inline-flex; align-items:center; justify-content:center;
  inline-size:var(--tap); block-size:var(--tap);
  border:1px solid var(--control); border-radius:var(--r-ctl);
  background:var(--paper); color:var(--ink);
}
@media (min-width:900px){ .burger{ display:none } }
.burger:hover{ border-color:var(--control-hover) }
.burger:focus-visible{ outline:var(--bw-focus) solid var(--focus); outline-offset:2px }
.burger__bar{
  display:block; inline-size:18px; block-size:2px; background:currentColor;
  border-radius:1px;
  transition:transform var(--d-fast) var(--ease), opacity var(--d-fast) var(--ease);
}
.burger__bar + .burger__bar{ margin-block-start:4px }
.burger[aria-expanded="true"] .burger__bar:nth-child(1){ transform:translateY(6px) rotate(45deg) }
.burger[aria-expanded="true"] .burger__bar:nth-child(2){ opacity:0 }
.burger[aria-expanded="true"] .burger__bar:nth-child(3){ transform:translateY(-6px) rotate(-45deg) }

/* --------------------------- MOBILE OVERLAY -----------------------------
   Full bleed below the header, fully opaque, no scrim, no backdrop blur.
   An opaque sheet needs no blur, and a blur over a full viewport is the
   most expensive thing on a mid tier Android. */
.sheet{
  position:fixed; z-index:calc(var(--z-header) - 1);
  inset-block-start:var(--hdr-h); inset-inline:0; inset-block-end:0;
  background:var(--paper);
  border-block-start:1px solid var(--rule);
  display:flex; flex-direction:column;
  overflow-y:auto; overscroll-behavior:contain;
  padding-block-end:max(16px, env(safe-area-inset-bottom));
  opacity:0; transform:translateY(-8px); visibility:hidden; pointer-events:none;
  transition:opacity var(--d-slow) var(--ease-enter),
             transform var(--d-slow) var(--ease-enter),
             visibility 0s linear var(--d-slow);
}
.sheet[data-open="true"]{
  opacity:1; transform:none; visibility:visible; pointer-events:auto;
  transition:opacity var(--d-slow) var(--ease-enter),
             transform var(--d-slow) var(--ease-enter),
             visibility 0s linear 0s;
}
@media (min-width:900px){ .sheet{ display:none } }
.sheet__link{
  display:flex; align-items:center;
  block-size:56px; padding-inline:var(--gutter);
  border-block-end:1px solid var(--rule);
  border-inline-start:3px solid transparent;
  color:var(--ink); font:500 17px/24px var(--sans); letter-spacing:-0.01em;
}
.sheet__link:hover{ text-decoration:none }
.sheet__link:active{ background:var(--surface) }
.sheet__link:focus-visible{ outline:var(--bw-focus) solid var(--focus); outline-offset:-2px }
.sheet__link[aria-current="page"]{ font-weight:600; border-inline-start-color:var(--accent) }
.sheet__foot{ margin-block-start:auto; padding:var(--s4) var(--gutter) 0 }
.sheet__foot .btn{ inline-size:100% }

/* ---------------------- SCROLL PROGRESS, marketing ---------------------- */
.progress{ display:none }
@supports (animation-timeline: scroll()){
  @media (prefers-reduced-motion: no-preference) and (min-width:768px){
    .progress{
      display:block; position:fixed; inset-block-start:0; inset-inline:0;
      block-size:2px; z-index:var(--z-progress);
      background:var(--accent); transform-origin:left center; transform:scaleX(0);
      animation:progress var(--ease-scrub) both;
      animation-timeline:scroll(root block);
    }
  }
}
```

```js
/* sheet.js. The behaviour the CSS cannot own. */
export function mountSheet(){
  const trigger = document.querySelector('.burger');
  const sheet = document.querySelector('.sheet');
  if (!trigger || !sheet) return () => {};
  const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  let last = null;

  const setOpen = open => {
    sheet.dataset.open = String(open);
    trigger.setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (main) main.inert = open;
    if (footer) footer.inert = open;
    if (open){ last = document.activeElement; sheet.querySelector('.sheet__link')?.focus(); }
    else if (last){ last.focus(); last = null; }
  };
  const onKey = e => { if (e.key === 'Escape' && sheet.dataset.open === 'true') setOpen(false); };
  const onClick = () => setOpen(sheet.dataset.open !== 'true');
  const mq = matchMedia('(min-width:900px)');
  const onWide = () => { if (mq.matches && sheet.dataset.open === 'true') setOpen(false); };

  trigger.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  mq.addEventListener('change', onWide);
  return () => {
    trigger.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
    mq.removeEventListener('change', onWide);
    document.documentElement.style.overflow = '';
  };
}
```

---

## 5. Keyframes, scroll driven declarations, reduced motion

```css
/* 05-motion.css

   THE WHOLE INVENTORY. If it is not in this file it is not in the codebase.

   DELETED FROM THE SPEC, ON PURPOSE:
   - the six .rv section reveals (opacity + translateY(12px) on scroll). It is
     the most template motion pattern on the internet, and banning easeOutExpo
     by name for reading consumer while shipping fade up on scroll was the
     contradiction. A page where the only thing that moves is data is the
     strongest available differentiator in this category, and the deletion
     costs nothing.
   - the hero measure line that grew from $258 to $1,309 while both numbers
     were already painted. It animated a subtraction the reader had already
     performed, and a bare rule sliding right with no label attached reads as
     a loading bar.
   - the segmented control thumb, along with the control. The checked fill
     already encodes the state at 0ms.

   LAW 1: base CSS is the FINISHED state. Never opacity:0 or a translate in a
          base rule. Break it and a Firefox user sees a blank page.
   LAW 2: every scroll driven animation lives inside the exact nesting below
          and nowhere else. */

/* ------------------------------ KEYFRAMES -------------------------------
   Keyframes live OUTSIDE the guards. They are smaller there and they are
   inert unless an animation property references them. */
@keyframes hdr-film{ from{ opacity:0 } to{ opacity:1 } }
@keyframes progress{ to{ transform:scaleX(1) } }
@keyframes spine{ from{ transform:scaleX(0) } to{ transform:scaleX(1) } }
@keyframes mark{ from{ opacity:0 } to{ opacity:1 } }
@keyframes pulse{ 0%,100%{ opacity:1 } 50%{ opacity:.55 } }
@keyframes spin{ to{ transform:rotate(360deg) } }

/* ------------------- SCROLL DRIVEN, MARKETING ONLY ----------------------
   .m scopes this to the marketing bundle. It does not exist in the tool
   bundle: not gated, not reduced, absent. A tool that animates while a
   broker reads a number is a bad tool.

   Every mark here is either an EXTENT growing from a fixed anchor, or an
   OPACITY. No mark is ever painted at an x it does not have, at any progress
   value, for any frame. That is what makes a scrubbed disclosure compatible
   with rule 1. The caption figures never animate. */
@media (prefers-reduced-motion: no-preference){
  @supports (animation-timeline: view()){

    .m .dist__tint,
    .m .dist__spine{
      transform-origin:left center;
      animation:spine var(--ease-scrub) both;
      animation-timeline:view();
      animation-range:entry 30% entry 80%;
    }
    .m .dist__bound--p25{
      animation:mark var(--ease-scrub) both;
      animation-timeline:view();
      animation-range:entry 26% entry 36%;
    }
    .m .dist__bound--p75{
      animation:mark var(--ease-scrub) both;
      animation-timeline:view();
      animation-range:entry 74% entry 84%;
    }
    .m .dist__median{
      animation:mark var(--ease-scrub) both;
      animation-timeline:view();
      animation-range:entry 62% entry 86%;
    }
    .m .dist__ref{
      animation:mark var(--ease-scrub) both;
      animation-timeline:view();
      animation-range:entry 70% entry 92%;
    }
  }
}
/* The hero caliper is above the fold, so its entry range is already fully
   consumed at load and it renders complete at first paint. That is correct
   and required. Do not add a delay, an entry-crossing variant or a JS
   trigger to make it animate on load. The hero is a fact and facts are
   painted at t=0. */

/* --------------------------- IN FLIGHT STATE ---------------------------- */
.q[data-state="pending"] .dist,
.q[data-state="pending"] .fig{ opacity:.55; transition:opacity var(--d-fast) var(--ease) }
.q[data-state="ready"] .dist,
.q[data-state="ready"] .fig{ opacity:1; transition:opacity var(--d-fast) var(--ease) }
/* The geometry itself is never transitioned. This declaration is the guard.
   A bar morphing from California to Texas passes through geometries that
   assert a p25, a median and a p75 belonging to no market. */
.dist__tint,.dist__spine,.dist__bound,.dist__median,.dist__ref{ transition:none }
@media (prefers-reduced-motion: no-preference){
  .fig[data-state="loading"]{ animation:pulse var(--d-pulse) cubic-bezier(.4,0,.6,1) infinite }
  .btn[data-busy="true"] .btn__spin{ animation:spin 700ms linear infinite }
}

/* --------------------------- VIEW TRANSITIONS --------------------------- */
@view-transition{ navigation:auto }
::view-transition-old(root),
::view-transition-new(root){
  animation-duration:140ms;
  animation-timing-function:var(--ease);
}
/* view-transition-name is NEVER applied to a td, a .fig, a .dist or anything
   containing a number. A morphing figure is a count up with extra steps.
   Cross fade only: never a slide, a scale or a directional wipe. Names must
   be unique in the document at capture time or the navigation stalls, which
   the gate asserts. bfcache is protected: no unload handler, no
   beforeunload, no unload time beacon. */

/* =========================== REDUCED MOTION =============================
   The floor, then the explicit static replacements. Under reduce every
   state still CHANGES, instantly, nothing becomes invisible, and no control
   loses its answer. Layout is untouched because nothing here moves layout.
   MEASURED under reduce: spine opacity 1 transform none width 267.3px, both
   bounds and the median opacity 1, header film opacity 1, 0 running
   animations.
   ======================================================================== */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{
    animation-duration:.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.01ms !important;
    scroll-behavior:auto !important;
  }
  /* The blanket rule is not enough in four places. Each of these would
     otherwise lose information, not just motion. */
  .fig[data-state="loading"]{ animation:none !important; opacity:.6 }
  .btn[data-busy="true"] .btn__spin{ display:none }
  .btn[data-busy="true"] .btn__busytext{ display:inline }
  .hdr__film{ animation:none !important; opacity:1 }
  .progress{ display:none }
  @view-transition{ navigation:none }
}
/* update:slow, e ink and low refresh panels, is treated as reduce. */
@media (update: slow){
  *,*::before,*::after{
    animation-duration:.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.01ms !important;
  }
  .fig[data-state="loading"]{ animation:none !important; opacity:.6 }
  .hdr__film{ animation:none !important; opacity:1 }
  .progress{ display:none }
}
@media (prefers-reduced-transparency: reduce){
  .hdr__film{ background:var(--hdr-fill-solid); backdrop-filter:none; -webkit-backdrop-filter:none }
  .hf{ display:none }
  .hf-fallback{ display:block }
}
@media (prefers-contrast: more){
  :root{
    --rule:#B9C0C0; --rule-2:#8E9797; --band:#C4D8D6;
    --text-2:#3E4E4F; --text-3:#3E4E4F; --control:#5A6A6B;
  }
  :root[data-theme="dark"]{
    --rule:#4A5859; --rule-2:#6C7B7B; --band:#1E4441;
    --text-2:#D2D7D7; --text-3:#D2D7D7; --control:#8B999A;
  }
  .dist__note,.badge--locked,.fig[data-state="locked"]{ background-image:repeating-linear-gradient(45deg,var(--rule) 0 2px,transparent 2px 3px) }
}
```

---

## 6. The hero field: JS, markup, static fallback

Four corrections applied: it runs on **every** device including 320px, it is the hero graphic at **full opacity** (the 0.10 background histogram is deleted, so there is now one field and one data set and no way to conflate them), it renders in a **reserved box below the numbers** so it cannot shift layout, and it **fails closed** against real data rather than fabricating a distribution.

```js
/* hero-field.js. Canvas 2D. Target 2.4KB gzipped, zero bytes on the LCP path.

   THE HONESTY INVARIANT, which is the reason a settling animation is legal
   here at all: x is the mark's REAL PRICE and is final from the frame the
   mark first exists. Only y animates, and y is the stack index inside a
   density column, which is layout, not measurement. No mark is ever
   displayed at a price it does not have, at any progress value, ever.

   BUILD CONTRACT. One JSON blob, emitted by the build, inlined into the page:
     <script type="application/json" id="hf-data">
     {"code":"70553","desc":"MRI brain without contrast","geo":"California",
      "n":313579,"ceil":1400,"month":"<stored reporting_month>",
      "q":[<241 integers, dollars, ascending>],
      "over":{"n":<count above ceil>,"max":<max observed rate>}}
     </script>
   q[i] is the empirical quantile of the real observation set at i/240, so
   every mark is an actual observed rate at a known percentile and the sample
   reproduces the published quartiles exactly. The emitter runs
   percentile_disc over the same table the tool queries. No other source. */

const CINE_MS = 1080;
const MARK_W = 4;          /* CSS px, mark width                              */
const MARK_GAP = 1;        /* CSS px, gutter between density columns          */
const MARK_H = 1.5;        /* CSS px, mark height                             */
const RAIL_W = 40;         /* CSS px, off scale rail to the right of the rule */
const SLOW_FRAME_MS = 8;   /* three of these in a row and the settle stops    */

/* cubic-bezier(.2,0,0,1), the site's --ease, solved by bisection. Ten
   iterations is under a thousandth of a unit and costs nothing at 241 marks.
   This replaces the 33 entry uint8 lookup table and its JSON contract.
   Verified: monotone, ease(0)=0, ease(0.5)=0.8779, ease(1)=1. */
function ease(t){
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  let lo = 0, hi = 1, u = t;
  for (let i = 0; i < 10; i++){
    const x = 3 * u * (1 - u) * (1 - u) * 0.2 + 3 * u * u * (1 - u) * 0 + u * u * u;
    if (x < t) lo = u; else hi = u;
    u = (lo + hi) / 2;
  }
  return 3 * u * (1 - u) * (1 - u) * 0 + 3 * u * u * (1 - u) * 1 + u * u * u;
}

/* Deterministic per point jitter. Same input, same field, every load. */
function hash01(i){
  return (Math.imul(i + 1, 2654435761) >>> 8) / 16777216;
}

function readTokens(el){
  const cs = getComputedStyle(el);
  return {
    mark:   cs.getPropertyValue('--ink').trim()    || '#0B1415',
    median: cs.getPropertyValue('--median').trim() || '#084646',
    bound:  cs.getPropertyValue('--bound').trim()  || '#5A6A6B',
    rule:   cs.getPropertyValue('--rule-2').trim() || '#D2D7D7'
  };
}

function wantsStill(){
  return matchMedia('(prefers-reduced-motion: reduce)').matches
      || matchMedia('(update: slow)').matches
      || navigator.connection?.saveData === true
      || (navigator.deviceMemory ?? 8) < 4
      || (navigator.hardwareConcurrency ?? 8) < 4;
}

/**
 * Mount the field.
 * @param {HTMLElement} root element carrying .hf, containing canvas#hf-canvas
 *   and script#hf-data, and optionally input.probe plus the two readouts.
 * @returns {() => void} destroy. Idempotent. Cancels the frame, drops every
 *   listener and observer, and clears the canvas backing store.
 */
export function mountHeroField(root){
  const noop = () => {};
  if (!root) return noop;

  const cv  = root.querySelector('#hf-canvas');
  const src = root.querySelector('#hf-data');
  if (!cv || !src) return noop;

  let D;
  try { D = JSON.parse(src.textContent); } catch { return noop; }

  /* The assertion. It fails closed: no field rather than a wrong field. */
  const q = Array.isArray(D.q) ? D.q : null;
  /* q[i] is the quantile at i/240, so index 60, 120 and 180 ARE p25, p50 and
     p75. root.dataset carries the same three numbers the caliper and the
     caption printed, straight from the server. If the canvas and the printed
     figures disagree, one of them is wrong and neither is publishable. */
  const want = [Number(root.dataset.p25), Number(root.dataset.p50), Number(root.dataset.p75)];
  const anchored = want.every(Number.isFinite)
    ? (q && q[60] === want[0] && q[120] === want[1] && q[180] === want[2])
    : true;
  const ok = q && q.length === 241 && anchored
    && Number.isInteger(D.n) && D.n > 0 && Number.isFinite(D.ceil) && D.ceil > 0
    && q.every((v, i) => Number.isFinite(v) && (i === 0 || v >= q[i - 1]));
  if (!ok){
    if (typeof console !== 'undefined') console.warn('hero field: payload rejected, field not rendered');
    return noop;
  }

  const g = cv.getContext('2d', { alpha: true });
  if (!g) return noop;

  let W = 0, H = 0, plotW = 0, pitch = 1, maxY = 1;
  let y = new Int16Array(241);
  let tok = readTokens(root);
  let raf = 0, slow = 0, t0 = 0, running = false, dead = false;

  const x = i => q[i] > D.ceil
    ? plotW + 6 + (i % 5) * 6
    : (q[i] / D.ceil) * plotW;

  const delay = i => 620 * (i / 240) + 220 * hash01(i);
  const dur   = i => 180 + 90 * (y[i] / maxY);

  function layout(){
    const b = cv.getBoundingClientRect();
    W = Math.round(b.width);
    H = Math.round(b.height);
    if (!W || !H) return false;

    const dpr = Math.min(devicePixelRatio || 1, 2);   /* clamp is mandatory: a
       3x phone at native density is the classic cause of a hot device */
    cv.width  = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    plotW = Math.max(40, W - RAIL_W);

    /* Stack marks into density columns. Recomputed on resize, which is why
       y and pitch are not baked at build time: a baked pitch is not
       responsive and was going to break at 320. */
    const colW = MARK_W + MARK_GAP;
    const cols = new Int16Array(Math.ceil(W / colW) + 2);
    maxY = 1;
    for (let i = 0; i < 241; i++){
      const c = Math.min(cols.length - 1, Math.max(0, Math.floor(x(i) / colW)));
      y[i] = cols[c]++;
      if (y[i] > maxY) maxY = y[i];
    }
    pitch = Math.min(4, (H - 6) / (maxY + 1));   /* no lower clamp: the
       column must always fit the reserved box, and a very dense column
       resolving to a solid bar is still an honest density read */
    return true;
  }

  function draw(p){
    if (dead) return;
    g.clearRect(0, 0, W, H);
    const base = H - 1;

    /* the printed ceiling rule, always at its true position */
    g.fillStyle = tok.rule;
    g.fillRect(plotW, 0, 1, H);

    const now = p * CINE_MS;
    for (let i = 0; i < 241; i++){
      const t = p >= 1 ? 1 : Math.min(1, (now - delay(i)) / dur(i));
      if (t <= 0) continue;
      /* i === 60, 120 and 180 are p25, p50 and p75 of the published set */
      g.fillStyle = i === 120 ? tok.median : (i === 60 || i === 180 ? tok.bound : tok.mark);
      g.globalAlpha = i === 120 || i === 60 || i === 180 ? 1 : Math.min(1, t / 0.6) * 0.72;
      const yTop = base - y[i] * pitch;
      g.fillRect(x(i), base + (yTop - base) * ease(t), MARK_W, MARK_H);
    }
    g.globalAlpha = 1;
  }

  function stop(){
    if (raf) cancelAnimationFrame(raf);
    raf = 0; running = false;
  }

  function settle(){
    stop();
    draw(1);
  }

  function step(ts){
    if (dead) return;
    if (!t0) t0 = ts;
    const f0 = performance.now();
    const p = Math.min(1, (ts - t0) / CINE_MS);
    draw(p);
    if (performance.now() - f0 > SLOW_FRAME_MS && ++slow >= 3){ settle(); return; }
    if (p < 1) raf = requestAnimationFrame(step); else settle();
  }

  /* ---------------------------- the probe ------------------------------- */
  const probe   = root.querySelector('.probe');
  const outVal  = root.querySelector('#probe-value');
  const outPct  = root.querySelector('#probe-pct');
  const needle  = root.querySelector('.hf__needle');
  let probeRaf  = 0;

  function pctFor(v){
    let lo = 0, hi = 240;
    if (v <= q[0]) return 0;
    if (v >= q[240]) return 100;
    while (lo < hi){
      const mid = (lo + hi) >> 1;
      if (q[mid] < v) lo = mid + 1; else hi = mid;
    }
    return Math.round((lo / 240) * 1000) / 10;
  }

  function onProbe(){
    const v = Number(probe.value);
    const pct = pctFor(v);
    const money = '$' + v.toLocaleString('en-US');
    const label = 'p' + Math.round(pct);
    if (outVal) outVal.textContent = money;
    if (outPct) outPct.textContent = label;
    /* WCAG 4.1.2. A range with no aria-valuetext announces "589": no unit,
       no percentile, no code. Set on EVERY input event, not once at mount. */
    probe.setAttribute('aria-valuetext',
      money + ', ' + label + ' of ' + D.geo + ' rates for CPT ' + D.code);
    if (needle){
      if (probeRaf) cancelAnimationFrame(probeRaf);
      probeRaf = requestAnimationFrame(() => {
        const px = Math.min(plotW, (Math.min(v, D.ceil) / D.ceil) * plotW);
        needle.style.transform = 'translateX(' + px.toFixed(1) + 'px)';
      });
    }
  }

  /* ------------------------- resize and theme --------------------------- */
  let rt = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (dead) return;
      if (layout()){ settle(); if (probe) onProbe(); }
    }, 200);
  });
  /* Redraws the FINAL frame. It never re animates on resize. */

  const mo = new MutationObserver(() => { tok = readTokens(root); if (!running) draw(1); });
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const onScheme = () => { tok = readTokens(root); if (!running) draw(1); };

  const onHide = () => { if (document.hidden && running) settle(); };

  /* ------------------------------ mount --------------------------------- */
  if (!layout()) return noop;
  cv.style.opacity = '1';

  if (probe){
    probe.max = String(D.ceil);
    probe.addEventListener('input', onProbe);
    onProbe();
  }
  ro.observe(cv);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  mq.addEventListener('change', onScheme);
  document.addEventListener('visibilitychange', onHide);

  if (wantsStill()){
    draw(1);                       /* the static fallback: one draw call, about
                                      3ms, and no rAF is ever created */
  } else {
    running = true;
    raf = requestAnimationFrame(step);
  }

  return function destroy(){
    dead = true;
    stop();
    if (probeRaf) cancelAnimationFrame(probeRaf);
    clearTimeout(rt);
    ro.disconnect();
    mo.disconnect();
    mq.removeEventListener('change', onScheme);
    document.removeEventListener('visibilitychange', onHide);
    if (probe) probe.removeEventListener('input', onProbe);
    cv.width = 0; cv.height = 0;
  };
}

/* SCHEDULING. The field is not allowed to compete with LCP. Zero bytes on the
   critical path: this module is dynamically imported after the
   largest-contentful-paint entry fires. If it ever appears in the entry
   chunk, the build fails. */
export function scheduleHeroField(selector = '.hf'){
  let destroy = () => {};
  const start = () => {
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1));
    idle(() => {
      const root = document.querySelector(selector);
      if (root) destroy = mountHeroField(root);
    }, { timeout: 400 });
  };
  if ('PerformanceObserver' in window
      && PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')){
    const po = new PerformanceObserver((list, obs) => {
      if (!list.getEntries().length) return;
      obs.disconnect();
      start();
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
  } else {
    addEventListener('load', start, { once: true });
  }
  return () => destroy();
}
```

The markup it mounts into. The DOM hero above it is the real hero and is painted at t=0, which is why the field failing closed costs nothing.

```html
<section class="hero m">
  <div class="container hero__inner">
    <h1 class="d1 hero__h1">What plans actually pay.</h1>
    <p class="lead hero__sub">Same procedure. Same state. 5.1x apart.</p>

    <figure class="dist hero__f1" data-state="ready" role="img"
      aria-label="CPT 70553, MRI brain without contrast, California. 25th percentile 258 dollars. Median 589 dollars. 75th percentile 1,309 dollars. Spread 5.1 times. 313,579 observations.">
      <figcaption class="dist__head">
        <span class="cpt">70553</span><span class="dist__desc">MRI brain w/o contrast</span><span>California</span>
      </figcaption>
      <div class="dist__track" style="--p25:18.4286%;--p50:42.0714%;--p75:93.5000%">
        <i class="dist__tint"></i>
        <i class="dist__spine"></i>
        <i class="dist__bound dist__bound--p25"></i>
        <i class="dist__bound dist__bound--p75"></i>
        <i class="dist__median"></i>
      </div>
      <div class="dist__cap">
        <span class="lab">p25</span><span class="lab">median</span><span class="lab">p75</span>
        <span class="num fig" data-state="ready"><i class="cur">$</i>258</span>
        <span class="num fig" data-state="ready"><i class="cur">$</i>589</span>
        <span class="num fig" data-state="ready"><i class="cur">$</i>1,309</span>
        <span class="stats">spread 5.1x &middot; n = 313,579</span>
      </div>
    </figure>

    <p class="dist__axis hero__axis"><span class="n">$0</span><span class="n">shared scale, max $1,400</span></p>
    <a class="btn btn--primary btn--lg hero__cta" href="/t/rate/ca/70553">Run a lookup</a>

    <figure class="dist dist--compact hero__f2" data-state="ready" role="img"
      aria-label="CPT 73721, MRI knee without contrast, California. 25th percentile 154 dollars. Median 360 dollars. 75th percentile 762 dollars. Spread 4.9 times. 295,270 observations.">
      <figcaption class="dist__head">
        <span class="cpt">73721</span><span class="dist__desc">MRI knee w/o contrast</span><span>California</span>
      </figcaption>
      <div class="dist__track" style="--p25:11.0000%;--p50:25.7143%;--p75:54.4286%">
        <i class="dist__tint"></i>
        <i class="dist__spine"></i>
        <i class="dist__bound dist__bound--p25"></i>
        <i class="dist__bound dist__bound--p75"></i>
        <i class="dist__median"></i>
      </div>
      <div class="dist__cap">p25 $154 &middot; median $360 &middot; p75 $762 &middot; 4.9x &middot; n = 295,270</div>
    </figure>
  </div>
</section>

<section class="container">
  <h2 class="h2">241 marks. One per percentile of 313,579 observed rates.</h2>

  <div class="hf" data-p25="258" data-p50="589" data-p75="1309">
    <canvas id="hf-canvas" role="img"
      aria-label="Density field. 241 observed California rates for CPT 70553, one mark per percentile of 313,579 observations, plotted by price."></canvas>
    <i class="hf__needle" aria-hidden="true"></i>

    <script type="application/json" id="hf-data">
    {"code":"70553","desc":"MRI brain without contrast","geo":"California","n":313579,"ceil":1400,"month":"BUILD_REPORTING_MONTH","q":[],"over":{"n":0,"max":0}}
    </script>

    <label class="sr-only" for="probe">Price probe. Read the percentile at a given rate.</label>
    <input class="probe" id="probe" type="range" min="0" max="1400" step="1" value="589">
    <p class="field__read" aria-live="off">
      <span class="num" id="probe-value">$589</span> sits at
      <span class="num" id="probe-pct">p50</span> of California rates for 70553.
    </p>
  </div>

  <p class="hf-fallback n">Field hidden. p25 $258, median $589, p75 $1,309, from 313,579 observed rates.</p>

  <dl class="prov">
    <dt>Source</dt><dd>Transparency in Coverage in-network rate files, 45 CFR 147.212</dd>
    <dt>Geography</dt><dd>California, statewide</dd>
    <dt>Code</dt><dd><span class="cpt">70553</span> MRI brain without contrast</dd>
    <dt>Observations</dt><dd><span class="num">313,579</span></dd>
    <dt>Reporting month</dt><dd>BUILD_REPORTING_MONTH</dd>
    <dt>Medicare</dt><dd>186% of the CMS Physician Fee Schedule 2026 reference</dd>
    <dt>Basis</dt><dd>Documented in-network negotiated rates. Modeled, not guaranteed.</dd>
  </dl>
</section>

<script type="module">
  import { scheduleHeroField } from '/j/hero-field.js';
  scheduleHeroField('.hf');
</script>
```

`q` ships empty above because I do not hold 241 real California quantiles and will not invent them. The build emits it; the assertion rejects anything that does not reproduce `258 / 589 / 1309` at indices 60, 120 and 180, and on rejection the page keeps the caliper, the six figures, `n`, the probe copy and the provenance block. Nothing is missing and nothing is invisible.

---

## 7. Logo and favicon

The chart is now a caliper, which makes the mark the product's core graphic at 24px. That, not the 0.324pp median offset, is the argument for Direction A. All `--bk-*` colours are deleted: the mark is `--ink` and `--median`, byte identical to the nav text and the accent, so the header no longer carries two blacks and two teals at dE 0.0588 and 0.0932.

```svg
<!-- logo.svg. 427 bytes. Glyph optical box 24x24 at (4,4), verified. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="currentColor" role="img" aria-labelledby="mk"><title id="mk">Reddenda Broker</title><rect x="9" y="4" width="14" height="2" rx=".5"/><rect x="15" y="4" width="2" height="24" rx=".5"/><rect x="9" y="26" width="14" height="2" rx=".5"/><rect class="mk-median" x="4" y="18" width="24" height="4" rx=".5" fill="var(--median, #084646)"/></svg>
```

```svg
<!-- logo-lockup.svg. Flat fills for email, PDF and export, where a custom
     property does not resolve. 40px artboard, wordmark set separately in
     Inter SemiBold at 14u cap height and converted to outlines. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="40" height="40" role="img" aria-labelledby="mk-l"><title id="mk-l">Reddenda Broker</title><g fill="#0B1415"><rect x="9" y="4" width="14" height="2" rx=".5"/><rect x="15" y="4" width="2" height="24" rx=".5"/><rect x="9" y="26" width="14" height="2" rx=".5"/></g><rect x="4" y="18" width="24" height="4" rx=".5" fill="#0F5C5C"/></svg>
```

```svg
<!-- favicon.svg. 363 bytes. Redrawn on a native 16 unit grid: every edge is
     an integer, so nothing is sub pixel at 16px. Radii removed (rx=".5" at
     16px is half a device pixel of grey fringe on every corner). Theme
     adaptive, single file, no JS. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><style>:root{fill:#0B1415}.m{fill:#0F5C5C}@media (prefers-color-scheme:dark){:root{fill:#F2F5F5}.m{fill:#70C1C1}}</style><rect x="3" y="1" width="10" height="2"/><rect x="7" y="1" width="2" height="14"/><rect x="3" y="13" width="10" height="2"/><rect class="m" x="1" y="9" width="14" height="2"/></svg>
```

```svg
<!-- apple-touch-icon. Square, rx=0: iOS applies its own mask and a pre
     rounded PNG double rounds. Render at 180. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="180" height="180" role="img" aria-labelledby="mk-t"><title id="mk-t">Reddenda Broker</title><rect width="40" height="40" fill="#0B1415"/><g transform="translate(4 4)" fill="#F2F5F5"><rect x="9" y="4" width="14" height="2" rx=".5"/><rect x="15" y="4" width="2" height="24" rx=".5"/><rect x="9" y="26" width="14" height="2" rx=".5"/><rect x="4" y="18" width="24" height="4" rx=".5" fill="#70C1C1"/></g></svg>
```

```svg
<!-- Direction B, redrawn at 4 rows on the 16 grid as the teardown required.
     The 16px objection is now dead: every edge is an integer, 2px bars with
     2px gaps, nothing sub pixel. So the choice is on distinctiveness alone,
     and the caliper wins it because the product's chart is a caliper. Kept
     here so the bake off is testable rather than asserted. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" role="img" aria-labelledby="mk-b"><title id="mk-b">Reddenda Broker</title><rect x="1" y="1" width="4" height="2"/><rect x="1" y="5" width="8" height="2"/><rect class="mk-median" x="1" y="9" width="14" height="2" fill="var(--median, #084646)"/><rect x="1" y="13" width="10" height="2"/></svg>
```

Computed: glyph box `24x24 at (4,4)`; median at `(27-20)/22 = 31.818%` against a true `31.494%`, delta `+0.324pp`; favicon `(14-10)/12 = 33.333%`. Contrast: `#0B1415` on white 18.665, `#0F5C5C` on white 7.761, white on `#0B1415` 18.665 (**not 17.79**, which is not reachable), `#70C1C1` on `#0B1415` 8.965.

---

## 8. Breakpoints

```css
/* 07-breakpoints.css

   w      cols  gutter  margin   container  column    section  header
   320     4     16      16       288        60.00     56       56
   390     4     16      16       358        77.50     56       56
   768     8     24      24       720        69.00     96       64
   1024   12     24      24       976        59.33     96       64
   1440   12     32      auto     1200       70.67     128      64
   1920   12     32      auto     1200       70.67     128      64   marketing
   1920   12     32      auto     1600      104.00     128      56   tool data

   Breakpoints are 768, 900 (nav), 1024, 1200. There is no breakpoint at 640
   and none at 1440: the container is already capped and adding one buys
   nothing but a place for a bug to hide. */

@media (min-width:768px){
  .grid{ grid-template-columns:repeat(8,minmax(0,1fr)) }
}
@media (min-width:1024px){
  .grid{ grid-template-columns:repeat(12,minmax(0,1fr)) }
}

/* --- HERO. The 320x568 fold, MEASURED with getBoundingClientRect in real
   Chrome, not estimated from glyph advance. The estimate said 527 of 568.
   The first measurement said 630, and the four causes were all real:
     sub was 3 lines not 2      the copy was 78 characters
     .cpt was 15px/20 in a 12px/16 head, so the head row was 20px not 16
     .stats carried a margin that duplicated the grid row gap
     the axis line was never in the budget at all

   Fixed at the cause. Measured again at 320x568:
     header            56
     h1  36/1.28 x2    92
     sub 17/1.5  x2    51
     caliper 1        137   head 16 + 8 + track 44 + 8 + caption 61
     axis              16
     CTA               44   occupies 428 to 472
     air below the CTA 96
     caliper 2 head and full track visible, track bottom edge at 552 of 568

   So at 320 the broker sees, with zero scroll: who this is for, the code,
   $258 / $589 / $1,309, spread 5.1x, n = 313,579, the shared scale and its
   ceiling, the CTA with 96px of air under it, and the second distribution
   already begun. Both hero calipers share ONE scale, $1,400, printed once at
   the axis. Two visible bars on different scales is a lie, and it is exactly
   the defect that passes every assertion. --------------------------------- */
.hero{ padding-block:var(--s4) var(--section-y) }
.hero__h1{ margin-block-end:var(--s3) }
.hero__sub{ margin-block-end:var(--s5) }
.hero__f1{ margin-block-end:var(--s2) }
.hero__axis{ margin-block-end:var(--s4) }
.hero__f2{ margin-block-start:var(--s5) }
@media (min-width:768px){
  .hero{ padding-block:var(--s7) var(--section-y) }
  .hero__inner{
    display:grid; column-gap:var(--gutter); align-content:start;
    grid-template-columns:1fr 1fr;
    grid-template-areas:
      "h1   f1"
      "sub  f1"
      "cta  f2"
      "cta  axis";
  }
  .hero__h1{ grid-area:h1 } .hero__sub{ grid-area:sub } .hero__cta{ grid-area:cta; align-self:start }
  .hero__f1{ grid-area:f1 } .hero__f2{ grid-area:f2; margin-block-start:var(--s4) }
  .hero__axis{ grid-area:axis; margin-block:var(--s2) 0 }
}

/* --- THE FIELD. Reserved box, fixed per breakpoint, so the canvas cannot
   produce layout shift when it mounts. It renders on EVERY device. -------- */
.hf{ position:relative; block-size:180px; margin-block-start:var(--s5) }
@media (min-width:768px){ .hf{ block-size:260px } }
@media (min-width:1200px){ .hf{ block-size:320px } }
.hf canvas{ inline-size:100%; block-size:100%; opacity:0; pointer-events:none }
.hf__needle{
  position:absolute; inset-block:0; inset-inline-start:0; inline-size:1px;
  background:var(--median); pointer-events:none; transform:translateX(0);
}
.hf-fallback{ display:none }   /* shown only under reduced transparency */
.probe{ inline-size:100%; margin-block-start:var(--s3); accent-color:var(--accent) }
.probe:focus-visible{ outline:var(--bw-focus) solid var(--focus); outline-offset:4px }
.field__read{ margin-block-start:var(--s2); font:400 var(--fs-n)/var(--lh-n) var(--mono); color:var(--text-2) }
.field__read .num{ min-inline-size:8ch; display:inline-block }
/* The readout width is pinned in ch with tabular figures so nothing on the
   row reflows as digits change. */

/* --- RAILS. On mobile the four code panel is a rail. The proof section and
   the limits section are NEVER rails: a limit you have to swipe to find is a
   limit you hid, and the proof section is the argument of the page. -------- */
.rail{
  display:flex; gap:var(--s4); overflow-x:auto;
  scroll-snap-type:x proximity;     /* proximity, never mandatory: a broker
                                       must be able to stop where the row he
                                       cares about is */
  overscroll-behavior-x:contain;    /* without it, a swipe at the end triggers
                                       browser back on iOS, mid lookup */
  padding-inline:var(--gutter); margin-inline:calc(var(--gutter) * -1);
  scrollbar-width:thin;
}
.rail > *{ flex:0 0 min(78vw,320px); scroll-snap-align:start }
@media (min-width:768px){
  .rail{
    display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
    overflow:visible; padding-inline:0; margin-inline:0;
  }
  .rail > *{ flex:none }
}
@media (min-width:1024px){ .rail{ grid-template-columns:repeat(4,minmax(0,1fr)) } }
/* No card carries a scroll driven animation inside a rail. On a horizontal
   rail a view() timeline resolves against the block axis scrollport, so
   cards 2 to 4 would complete their disclosure while off screen to the right
   and the motion would be spent on nothing, on the device that has most of
   the traffic. */

/* --- TABLE. Below 768 the payer column pins and the numbers scroll. The
   table is never card ified: that destroys the only reason he opened it and
   forces him to hold numbers in working memory across screens. ------------- */
@media (max-width:767px){
  .t{ --col-key:132px; --col-num:88px }
  .t th,.t td{ padding-inline:10px }
}
@media (min-width:1200px){
  .t{ --col-key:220px; --col-num:104px }
}

/* --- THE TOOL SHELL at 320. The old layout spent 176px on a result header
   that restated p25, p50, p75 and the spread, directly above a 124px card
   that showed the same four numbers. That is 31% of a 568px phone on a
   redundant restatement, and it left the table 112px, which is 2.5 rows.
   Below 768 the result header collapses to eyebrow, title and n, at 72px,
   and the caliper card carries the figures. That returns 104px, which is
   2.4 more rows, and it doubles the visible data. ------------------------- */
.app__result{ display:grid; gap:var(--s1); padding-block:var(--s3) }
.app__result .app__figs{ display:none }
.app__result .app__eyebrow{ font:500 var(--fs-micro)/var(--lh-micro) var(--mono); letter-spacing:var(--ls-micro); text-transform:uppercase; color:var(--text-2) }
.app__result .app__title{ font:600 var(--fs-h3)/var(--lh-h3) var(--sans); color:var(--ink) }
@media (min-width:768px){
  .app__result{ padding-block:var(--s5) }
  .app__result .app__figs{
    display:grid; grid-template-columns:repeat(4,minmax(0,1fr));
    gap:var(--gutter); margin-block-start:var(--s3);
  }
}

/* --- PROOF OF NO PAGE LEVEL HORIZONTAL SCROLL ---------------------------
   Run at 320 / 360 / 390 / 414 / 768 / 1024 / 1440 / 1920 in a real browser:

     window.scrollTo(9999, 0);
     const x = window.scrollX;
     window.scrollTo(0, 0);
     if (x !== 0) throw new Error('page scrolls sideways ' + x + 'px');

   scrollWidth lies on overflow:visible. Scroll it and read scrollX.
   html and body carry overflow-x:clip, never hidden: hidden hides the defect
   from every automated check while the page still drags under a real finger,
   and it breaks every sticky element on the page. ------------------------- */
```

---

## 9. The two files that stop the four documents drifting apart again

```js
/* strings.js. ONE string table. Four surfaces: the marketing page, the tool,
   the CSV header and the server rendered PDF header. */
export const SOURCE = {
  /* was "machine-readable files" on marketing and "in-network rate files" in
     the app. One string, and it is the one the citation prints. */
  label: 'Transparency in Coverage in-network rate files, 45 CFR 147.212',
  short: 'Transparency in Coverage, 45 CFR 147.212'
};
export const BASIS = {
  /* two different slots, so they are now two different keys */
  rates: 'Documented in-network negotiated rates. Modeled, not guaranteed.',
  reference: locality => 'Medicare reference: CMS Physician Fee Schedule 2026, locality ' + locality
};
export const LIMITS = {
  anonymousLookupsPerDay: 5,           /* was "ten" three times on the page */
  copy: {
    ceiling: 'Five lookups a day, no account.',
    exhausted: n => n + ' of ' + LIMITS.anonymousLookupsPerDay + ' used today. Sign in for more.'
  },
  /* Published is not paid. The first run screen used to say "what plans
     report paying", which is the claim the limits section exists to deny. */
  published: 'Negotiated rates as published by the plan. Not claims, not allowed amounts after adjudication.'
};
export const EMPTY = {
  unavailable: 'Insufficient public data',
  suppressed: n => 'n below publication threshold (n = ' + n.toLocaleString('en-US') + ')',
  noCount: 'Observation count unavailable. Distribution not published.',
  locked: 'Locked'
};
/* The route table. The marketing page builds every tool link from this, so a
   link cannot point at a route the app does not serve. */
export const ROUTES = {
  rate:    (geo, code) => '/t/rate/' + geo + '/' + code,
  payers:  (geo, code) => '/t/payers/' + geo + '/' + code,
  markets: (code) => '/t/markets/' + code
};
export const TOOLS = [
  { key: 'rate',    name: 'Rate lookup',      href: ROUTES.rate('ca', '70553') },
  { key: 'payers',  name: 'Payer comparison', href: ROUTES.payers('ca', '70553') },
  { key: 'markets', name: 'Dispersion',       href: ROUTES.markets('70553') }
];
/* "Dispersion", not "Spread". Every result header prints SPREAD 5.1x, so a
   nav item called Spread put one word with two meanings on screen at once. */

export function provenance({ geo, code, codeDesc, n, reportingMonth }){
  return [
    ['Source',          SOURCE.label],
    ['Geography',       geo],
    ['Code',            code + ' ' + codeDesc],
    ['Observations',    n.toLocaleString('en-US')],
    ['Reporting month', reportingMonth],   /* the STORED field, never the
                                              ingest date */
    ['Basis',           BASIS.rates]
  ];
}
export function citation({ geo, code, codeDesc, n, reportingMonth }){
  return 'CPT ' + code + ' ' + codeDesc + ', ' + geo + '. ' +
         n.toLocaleString('en-US') + ' observed in-network negotiated rates, ' +
         reportingMonth + '. Source: ' + SOURCE.label + ' ' + BASIS.rates;
}

/* Time to answer. p75 from the code change to figures on screen. INP measures
   event to feedback, not time to answer, and for a data product time to
   answer is the only performance number that matters. */
export const BUDGET = { timeToAnswerMs: 600 };
export function markAnswerStart(){ performance.mark('answer:start'); }
export function markAnswerEnd(meta){
  performance.mark('answer:end');
  const m = performance.measure('answer', 'answer:start', 'answer:end');
  if (m.duration > BUDGET.timeToAnswerMs && navigator.sendBeacon){
    navigator.sendBeacon('/rum/answer', JSON.stringify({ ms: Math.round(m.duration), ...meta }));
  }
  return m.duration;
}
```

The gate is the full runnable file at `09-gates.mjs`. The two clauses that matter most, because the old gates could not catch the violations the spec itself shipped:

```js
/* The old regex tested width|height|top|left|margin|padding|box-shadow|filter|
   background-position and therefore could not catch transition:background-color
   on every button, which the motion document shipped on the same page as its
   own compositor-only allowlist. */
const BAD = /(transition|animation)[^;{}]*\b(width|height|inline-size|block-size|top|left|right|bottom|inset|margin|padding|box-shadow|filter|backdrop-filter|background-position|background-size|background-color|border-color|border-width|color|font-size|letter-spacing|grid-template-rows|flex-basis)\b/;

/* The pairs the last system never measured: the marks against the track they
   sit on. --rule and --rule-2 are deliberately absent because they are
   decoration, and the CSS grep above proves nothing loads meaning onto them. */
['--bound','--surface-2',3], ['--bound','--band',3],
['--median','--surface-2',3], ['--median','--band',3],
['--ref','--surface-2',3], ['--ref','--band',3],
['--edge','--paper',3], ['--edge','--surface-2',3],
['--locked','--locked-hatch',4.5]
```

It also asserts: every marketing `/t/` link resolves against `ROUTES`; the provenance strings are byte identical to `strings.js` and the old marketing variant is absent; the page does not promise ten lookups; the page does not say plans "report paying"; the probe's `aria-valuetext` matches `^\$[\d,]+, p\d+ of .+ rates for CPT \d+$`; `--fs-micro` computes to 12 at every width; computed `h1` line-height matches 1.28 / 1.28 / 1.14 / 1.05; `scrollX` is 0 at eight widths **and at 200% text zoom**; no reserved box clips at 200% zoom; and zero time-based animations are running at load plus 1.4s.

---

## What I changed against the four documents, and why

| Change | Forced by |
|---|---|
| The band becomes a **caliper**: 2px bounds at p25 and p75, a 2px spine joining them, a 3px median, a 1px dashed ink reference. Tint is decoration and can be deleted | The band measured **1.116:1 light, 1.003:1 dark** against its own track. Unfixable by tinting: clearing 3:1 needs L <= 0.2615, which destroys `--ink` on band |
| `--median` light moved from `#0F5C5C` to `#084646` | At `#0F5C5C` the median-versus-bound dE was **0.0936**, under our own 0.10 bar. At `#084646` it is **0.1576** and no argument is needed |
| `--ref` marine deleted, becomes `--ink` dashed | The old median/reference pair measured dE **0.091 / 0.055 / 0.044** and failed the CVD bar in every vision type, and was never tested. One structural hue removed |
| Categorical palette (5 tokens) deleted, sequence kept | Nothing in the specification used the categorical five, and the CVD gate tested them instead of the pair that ships |
| `--rule-strong` split into decorative `--rule-2` and gated `--edge` | `#D2D7D7` is 1.454:1 light and `#303F40` is 1.698:1 dark. Both fail 3:1, so gating the old token was impossible; renaming was the only honest fix |
| Locked hatch drawn in `--surface-2`, not `--rule` | On the stripe the label measured **4.552:1**, one hundredth over, and the published 5.16 was taken against a background the text does not sit on |
| One button token mapping, one typeface, one ink, one accent, one source string, one BASIS, 5 lookups, one route table | The dark primary button's press state was `#209A9A`, which is not in the accent ramp; the logo shipped `#002420` and `#077A70` against the system's `#0B1415` and `#0F5C5C` at dE 0.0588 and 0.0932; four `/t/` links pointed at routes the app does not serve |
| Six `.rv` reveals, the measure line and the segmented control deleted | Fade-up-on-scroll is more consumer than any banned easing curve; the persona toggle contradicted a three-audience brief and asked a visitor to self identify before it would show him a price |
| Hero field runs on every device, at full opacity, in a reserved box, one data set, fails closed | It was `display:none` below 768 on a product for a broker on a phone, and the legible static graphic was buried at `opacity:.10` |
| `--r-card` 4px, radius ladder deleted, pills squared to 2px | The lattice zeroes the radius at every junction, so the ladder only ever applied to isolated cards |
| `--fs-micro` holds 12px everywhere | 12px at 35cm subtends 3.12 arcmin, 11px at 70cm subtends 1.43. The desktop label was 46% the angular size, and the stated reason was backwards |
| `table-layout:fixed` with an explicit colgroup, `inline-size:max-content` deleted | `max-content` forces an intrinsic measurement of every row, which defeats `content-visibility` entirely |
| Table edge affordance moves from `scroll-state()` to CSS scrolling shadows | `scroll-state` is Chrome 133+, so on iOS Safari the rate table gave no sideways-scroll cue at all |
| Tooltip 150ms, palette 100ms, time-to-answer budget 600ms instrumented | Two documents shipped 300ms and 400ms; 400ms is past the point a user decides it is broken; INP does not measure time to answer |
| `aria-valuetext` set on every `input` event | The signature interaction announced "589": no unit, no percentile, no code. A 4.1.2 failure |

Working files, screenshots and the verification scripts: `/private/tmp/claude-501/-Users-user/b21483e9-ec70-4d54-a18c-d9ee4ce32ca5/scratchpad/kit/` (`verify.py`, `verify2.py`, `run-harness.mjs`, `run2.mjs`, `run4.mjs`, `run5.mjs`, `shot-caliper-320.png`, `shot-caliper-dark.png`, `shot-fold-320.png`).

**Not verified, stated plainly:** the Inter and mono metric assertions need a real Windows and Linux run (the harness was macOS only); LCP, CLS, INP and transfer budgets need a built page on throttled hardware, not a local harness; the `scroll-state(stuck)` header blur and table densification were not exercised because they need a real scroll in a supporting engine; trademark and domain clearance for the mark and the name.