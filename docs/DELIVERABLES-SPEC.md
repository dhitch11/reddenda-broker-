# THE BUY-SIDE DELIVERABLE PORTFOLIO
**@BROKER-DELIVERABLES (`ad3c6448`, Opus 5) · 2026-08-07 · 25-agent research fleet, 1.74M tokens**
**Every deliverable below was designed against the measured data, then adversarially refuted on three
lenses — buildability, will-they-pay, and legal/honesty. The refuters killed six proposals and demoted
five. What survives is what survived being attacked.**

---

## 0. THE ONE-PARAGRAPH ANSWER

We do not have a tools problem. Eleven console views are live. **We have an artifact problem.** The
incumbent vendors all sell a data licence or a platform seat; nobody sells **the finished exhibit a
broker hands an employer in a renewal meeting.** That is the same wedge as the provider side, where the
Leverage Memo works precisely because it is a letter addressed to a counterparty, not a report. The
buy-side portfolio should therefore be **three free artifacts that travel, two paid artifacts that get
signed, and one paid artifact nobody else on earth can write** — and the single highest-value thing we
could build is currently blocked on one data rebuild, which every segment's skeptic independently named
as the only item they would write a real cheque for.

---

## 1. THE FIVE FACTS THAT GOVERN EVERY DESIGN

**1.1 The buyer's money is an annuity, so the product must defend retention, not win new business.**
Group-health commission is **level, not front-loaded** — the renewal year pays what year one paid. A book
is an annuity, and an AOR letter moves it with one signature and no carrier change. So the incumbent's
entire defence is *demonstrated proactivity between renewals*, and that is exactly what an artifact is.
Broker economics: 2–50 lives = 4–7% of premium (~$18–27 PEPM), 100–499 = 2–4% (~$12–18 PEPM), self-funded
consulting $8–25 PEPM. **A $4,900 firm licence is under 3% of the revenue from a single 100-life group.**

**1.2 The calendar is not negotiable and it is closing.** Jan 1 dominates. Data pull Jul–Aug, market
Aug–Sep, quotes and no-laser-lock Sep–Oct, open enrolment Nov. **Anything that must influence a 1/1
decision has to land by roughly the end of August.** A rate artifact arriving in November is a next-year
artifact. CAHIP NorCal is **Aug 26** — that is inside the window, which is the whole reason the date
matters commercially and not just socially.

**1.3 The credibility gap at finalists is the wedge.** Brokers lose finalist presentations on the
financial analysis: a single-column "current vs proposed" reads as a quote, not an analysis, and
**presenting generic national benchmarks as tailored projections is a named reason proposals fail
credibility review.** That is the local-peer-median position stated by someone else, in their own
vocabulary, as their own pain. It is also why HARD rule 2 is a commercial advantage here and not just a
constraint.

**1.4 The fear is real but the artifact must not name it.** ERISA health-plan fiduciary suits are being
dismissed on Article III standing, not on the merits — **Lewandowski v. J&J** (dismissed 2025-11-26, on
appeal) and **Navarro v. Wells Fargo** (dismissed 2026-03-06, on appeal). But **Stern v. JPMorgan Chase**
(S.D.N.Y., Mar. 9 2026) survived dismissal on **§406 prohibited-transaction** grounds using the lowered
*Cunningham v. Cornell* pleading standard. Prudence claims die on standing; prohibited-transaction claims
do not. Committees are now told to review TPA contracts and confirm no gag clauses block claims data.
**A committee cannot document prudence about what it pays providers without an external benchmark, and
we are the only party who can produce one.** See §5 for why the word "fiduciary" must never appear on the
cover.

**1.5 What we can actually put on a page.** Measured, not assumed:

| Block | Verdict | Source, measured |
|---|---|---|
| Site-of-care office / ASC / HOPD | ✅ **strongest real block we own** | `medicare_locality_cpt_rate` 405,291 · `opps_hcpcs_apc_crosswalk` 19,153 · `asc_payment_rates` 7,380 — 100% real public CMS, **1,442 codes clean at both sites with a real office differential** |
| OON / federal IDR exposure | ✅ real, route already `real: true` | `idr_qpa_dollar_stats` 16,884 rows; underlying `idr_npi_payer_cpt` 365,663 / 17,507 NPIs / 53 states; vintage 2023-Q1→2025-Q2 |
| Network composition in a metro | ✅ real, non-price | RPC `broker_network_groups` over 83,321 orgs / 1,769,643 clinicians |
| % of Medicare per CPT | ⚠️ commercial is metro, **Medicare denominator is STATE grain** | `cpt_peer_stats_cbsa` 12,677,477 rows, 8,028,113 pass the honesty floor (63.3%) |
| Payer-**named** price position | ⚠️ **STATE grain only, never metro** | `payer_cpt_state_stats` 2,791,353 rows / 30 payers — only **111,635 (4.0%)** pass p25≥5, p50≥5, n≥100 |
| Provider/facility-**named** price | ❌ not for a deliverable | NPI-grain price exists (`npi_payer_cpt_rate` 370M, `payer_contracted_rates` 676M) but **zero broker modules read it**, and it is the ghost-rate blast radius at its worst |
| Modeled dollar impact for a group | ⚠️ arithmetic real, **utilisation fabricated** | `opportunity.ts:77 modelGroup()`; `util` per 1,000 lives hand-carried in `demo/national.ts:114-128` with no source |
| Rx / PBM anything | ❌ | only `nadac_drug_pricing` (30,216 NDC acquisition rows). No rebate, no spread, no payer, no geography |
| Named employer or their claims | ❌ **never** | `cleanroom_claim_lines` = **0 rows**. No employer table exists. `hpt_rates.plan_name` 100% NULL |

**The governing sentence, from `fee-basis.ts`:** our TiC figures are, for most codes, the **physician's
professional fee** — not the price of the procedure. The war room measured what omitting that does:
**NY knee replacement rendered $1,995 against a real allowed amount of $45,000–$70,000.** A broker who
reads that out loud in a finalist meeting does not get a second meeting. Every deliverable below is
designed so its headline survives that sentence.

---

## 2. THE PORTFOLIO — RANKED BY WHAT SURVIVED REFUTATION

### 🟢 TIER 1 — SHIP THIS WEEK. Real data, confirmed buildable, legal at LOW/MED with the stated fix.

#### **D1 · The Site-of-Care Exhibit** — free, the artifact that travels
**Confirmed buildable** (`siteofservice.ts:158/274`, served today by `api/site-of-service`). **Nine of
nine operator panels asked for this**, and the data lane independently called it *"the single most
valuable thing to a broker or a self-funded employer — same procedure, hospital outpatient versus
freestanding, in my metro… the only lever a 200-life group actually controls."*

- **The one number:** the **ratio**, never a dollar total. "This procedure is priced **2.6 times higher**
  in a hospital outpatient department than at a surgery centre."
- **Recipient:** the employer, handed over by the broker; forwarded onward. The forwarding *is* the
  growth engine.
- **Action it forces:** the employer asks the TPA which sites are in-network — a question they have
  never asked and the TPA has never been asked.
- **Price: $0.** The retail broker's own skeptic: *"I'd use it. I wouldn't pay, and you've priced it
  right."* This is the lead magnet and the trust surface.
- 🔴 **THREE FIXES BEFORE IT SHIPS, ALL MEASURED:**
  1. **It is STATE grain, not metro.** `siteComparison()` queries `.eq("state", state)`
     (`siteofservice.ts:167-169`). Any copy saying "in their own metro" is false. Say **state**.
  2. **Put the basis on the sheet, not in a footnote:** *"Commercial plans pay roughly 2–3× these
     amounts. The RATIO is what travels, not the dollar."* Without it the first sophisticated CFO kills
     it with *"That's Medicare. My client isn't on Medicare"* — and we have no answer.
  3. **Two rows break the arithmetic itself:** `99285` carries `office: 0` (divide-by-zero → undefined
     ratio) and `27447` carries `opps: null, asc: 12043` (renders "ASC is the only site" when the truth
     is "HOPD unavailable"). **A null facility fee must render an empty state, never a computed total.**

#### **D2 · The Out-of-Network Exposure Brief** — free, and the only rate-adjacent thing we serve that is real
`api/oon` is the **one rate-adjacent route serving real data** (`real: true`), off the federal IDR record.
- **The one number:** what the federal arbitration record shows disputes settling at, relative to the
  qualifying payment amount, for this service line.
- **Price: $0**, ungated. Trust surface and lead capture.
- 🔴 **TWO LIVE DEFECTS, BOTH SHIPPING RIGHT NOW:**
  1. **`oonSummary()` filters `r.lines >= 20`, not `CREDIBLE_LINES = 1_000`** (`idr.ts:41`) — under a
     comment claiming "computed over credible rows only." **The headline multiple currently on the live
     surface is not credible-filtered.** This is a rule-1 defect with our own guardrail written next to it.
  2. **`idr-outcomes/route.ts:88` pins `.eq("scope","national")`.** A national statistic on a public
     surface in a house whose HARD rule 2 forbids national framing. **Label it national explicitly, or
     serve state scope.** The GA skeptic will ask "is that number for my market?" in the first meeting.
  3. Drop the discarded-mean methodology confession into a footnote. To a GA principal, showing two
     numbers reads as *you don't know which is true*, not as rigour.

#### **D3 · The August Board** (broker) / **Renewal Triage Board** (GA) — the paid anchor
**The GA principal's verdict, unprompted: *"the only one that survives contact."*** It eats their own
list and hands back their own decision — which groups get analyst time in August — with a date on it.
That is a decision they make anyway, badly, in a spreadsheet. Panel evidence: *"decides in late August
which six get the full treatment."*
- **The one number:** a ranked order with a date, not a dollar.
- **Price:** inside the **$4,900/yr firm licence** (broker) or the GA firm licence. **Never per-seat down
  a GA downline** — that is on the permanent barred list.
- 🔴 **BLOCKERS:** there is **no upload path in the repo** (`grep -rln "formData\|csv" src/app/broker/api/`
  → zero hits), and `siteComparison` fires **3 un-batched queries per (cpt, state)** — 200 groups × a
  20-code basket is ~12,000 round trips. **Needs an ingest route and a batched `siteComparisonMany()`.**
- 🔴 **THE OBJECTION THAT DECIDES THE SALE:** *"Where does my book live, who sees it, can I get it out?"*
  Answer with **delete-on-demand, a CSV export, and a written no-retention statement** or it dies in the
  meeting. And if cleaning the columns takes 40 minutes, it never happens twice.

### 🟡 TIER 2 — BUILDABLE, BUT THE PITCH MUST CHANGE

#### **D4 · The Site-of-Care PEPM Exhibit** — reframed as a vendor audit
Real action, wrong buyer as designed. The CFO's objection is exact: *"Isn't this what I pay my navigation
vendor $2.50 PEPM for?"* Standalone it duplicates a QBR slide they already get free.
- ✅ **The reframe that makes it worth $1,200:** sell it as **"hold your navigation vendor to their
  number."** Care-navigation savings are self-attested and undocumented — that is the category's known
  soft spot. A CFO who suspects he is being had will pay for the audit.
- ⚠️ PEPM computed from a federal-floor ratio × an adoption guess is **a modeled number the incumbent
  will circle in red.** `measuredShare` must be on page one — and note honestly that putting it there is
  what makes it survivable *and* what makes it attackable.

#### **D5 · The Behavioral Health Reimbursement Differential Exhibit** — the one nobody else can write
**The highest-ceiling item on the board.** MHPAEA's 2024 final-rule provisions are under a non-enforcement
policy (announced 2025-05-15) — **but the statutory CAA requirement to prepare and furnish a written NQTL
comparative analysis on request remains fully in effect and enforced.** For each NQTL the plan must show
comparability in writing *and in operation*, including **network composition and provider reimbursement
rates** — the standard-setting factor **most plans cannot evidence at all.**
- **We already own the shape.** `bh-exhibit.html` exists on the provider side: a one-page US-Letter
  document with a builder, a three-cell spine, per-line provenance, and a signature block. The buy-side
  version is a mirror, not a new invention.
- 🔴 **SELL IT TO THE WRONG PERSON AND IT IS A $3,900 PAPERWEIGHT.** The CFO's objection: *"Will my ERISA
  attorney accept this as the rate factor?"* A firm-written comparative analysis costs $25–60K. **Sell to
  the ERISA law firms and the TPAs who write these, not to the employer.** If we cannot name a firm that
  will accept it, we do not ship it.

#### **D6 · The Captive Member Book Scan** — the cleanest commercial shape on the list
$4,900 per run, up to ~100 member employers. **Under signature authority, no procurement, not a
subscription.** Captive managers genuinely cannot produce per-member pages and genuinely dislike the
pooled deck. Captives are a *channel*, not an account — hundreds of member employers under one consultant.
- 🔴 **The objection that kills it on slide two:** *"Is this just the same state ratio pasted onto 80
  letterheads?"* Per the spec as written, **it substantially is.** Show real variance across members in
  the demo or do not show it.

### 🔴 KILLED BY THE REFUTERS — do not build, with the reason so nobody re-derives the hope

| Killed | The sentence that killed it |
|---|---|
| **Steerage Basis Ledger** | *"Nobody purchases their own audit."* The pitch itself says it shrinks their claimable savings. **Dead.** |
| **Data-Access Receipt File** (gag-clause) | *"We attested in December. Next."* Signed by the TPA in ten minutes on the CMS portal; never enforced against. The one item the CFO said he would **actively resent** being pitched. |
| **Renewal Question Set, standalone** | *"I pay a broker for this."* Buying it says the broker is useless — a political act the employer will not take. **Bundle it silently, never price it.** |
| **The Channel Run** (co-branded batch) | *"That adoption click is not a review, it is a liability waiver I wrote for myself."* Plus: `renderArtifactHtml` **has no brand slot** (`render.ts:92-103`), and the header hardcodes the canonical mark — co-branding needs a **HARD-rule-5 exception from David**, not a patch. |
| **Embedded Rate Rail / OEM** | Right product, wrong year. *"Who owns the number when a member steers to an ASC and the claim denies?"* — legal + security review + roadmap slot, for a company with one $399 subscriber. |
| **Employee Price Sheet as revenue** | Genuinely useful, genuinely un-payable-for: *"my sheet is number 31 of 30 pieces of paper."* Ship it as a giveaway. |

---

## 3. ⛔ THE BIGGEST PRIZE, AND IT IS ONE REBUILD AWAY

**Every segment's skeptic, independently, named the same item as the only one they would write a real
cheque for — and it is the one we cannot build.**

> Retail broker: *"the only thing on this list I'd actually pay $2,900 for, which should worry you."*
> GA principal: *"The only thing here I'd write a real check for, and you told me it doesn't exist."*
> TPA/MGU: *"The one they actually want. Also the one you cannot make."*

**The Network-vs-Network Repricing Exhibit** — this population, repriced across the 3–4 available
networks at contracted rates. It is blocked on exactly one thing: **`peer_rate_dist` is the correct shape
(cpt × payer × cbsa with percentiles, 1,194,087 rows) and is unusable — `is_scoreable` 8.7%,
`confidence=high` 1.8%, `modal_pct ≥ 90` on 67.1% (flat-stamped), last autoanalyze 2026-07-14, and both
`refresh-peer-target-*` Supabase crons are `active=false`.**

**Two commercial consequences, and they point in opposite directions:**
1. **The rebuild is the single highest-ROI engineering task on the buy-side estate.** It converts a free
   lead-magnet portfolio into a portfolio with a $2,900–$9,500 anchor.
2. **Do not show it on the same page as things we can sell.** The GA said it plainly: *"you just made six
   shipping products feel like the consolation prize."*

---

## 4. 🚨 FIVE LIVE DEFECTS THE FLEET FOUND — these are for the owning lanes, today

These are not deliverable design notes. They are measured defects on shipping surfaces.

1. **`oonSummary()` credible-lines floor is wrong.** Filters `r.lines >= 20`; the constant is
   `CREDIBLE_LINES = 1_000` (`idr.ts:41`), under a comment claiming credible-only. **The live headline is
   not credible-filtered.** → @BROKER-TOOLS
2. **`api/core/idr-outcomes/route.ts:88` pins `.eq("scope","national")`** — national framing on a public
   surface, against HARD rule 2. → @BROKER-TOOLS
3. **`siteComparison()` is STATE grain** (`siteofservice.ts:167-169`) while surfaces imply metro. →
   @BROKER-TOOLS
4. **Two site-of-care rows break the ratio arithmetic:** `99285` `office: 0` (divide by zero), `27447`
   `opps: null` (renders "ASC is the only site"). **Null facility fee must render an empty state.** →
   @BROKER-TOOLS
5. **`scripts/verify-canon.mjs` does not exist in `reddenda-app`** — it lives only in `reddenda-broker`.
   **The canon gate cannot run against the console's output**, which is the surface we demo. →
   @BROKER-CANON

---

## 5. THE THREE RULES EVERY ARTIFACT OBEYS

**5.1 Never put "fiduciary" on a cover.** Naming a document *The Fiduciary File* and placing it in ERISA
committee minutes is a functional-fiduciary invitation under **29 U.S.C. §1002(21)(A)(ii)** — advice for
a fee, regularly, as a primary basis, with mutual understanding. **Call it what it is: a market rate
record.** Let the buyer's counsel decide what it discharges. We never say it discharges anything.

**5.2 Fabrication is authorised; asserting authenticity is not.** David lifted the fabrication constraint
across environments for the demo build. The boundary the lanes derived and nobody has challenged holds:
**a sentence swearing data is real, placed above a fabricated figure, is a representation to a fiduciary.**
Every artifact renders `measured | measured_state | modeled` per row (`resolve.ts:37`) — and note that
`resolveMany()` fills unmatched cells from `@/demo/national` (`resolve.ts:2,159`), so **an artifact built
off `resolveMany` is not all-measured** even when every cell looks real.

**5.3 Flat fees, and the state gate is server-side.** No percentage-of-savings — that is both on the war
room's permanent barred list (ERISA §406(b)(3)) and inside HARD rule 11's form-prohibition states
(**NY, IL, NC = flat only**). Eligibility is gated on the **NPPES-verified state, server-side, never on
IP.** Per-report or annual firm licence, never per-seat down a GA downline. A refuter's line worth
keeping: *a monthly seat "does not produce churn as a risk; it manufactures churn as arithmetic."*

---

## 6. WHAT I RECOMMEND WE DO IN THE NEXT 30 MINUTES

1. **Fix the two OON defects** (§4.1, §4.2). They are on a live surface, they are rule-1 and rule-2, and
   they are each a few lines. — @BROKER-TOOLS
2. **Put the "commercial plans pay 2–3× these amounts; the ratio is what travels" line on the
   site-of-care surface**, and change every "metro" to "state" on it. That single sentence is the
   difference between an exhibit that survives a CFO and one that does not. — @BROKER-TOOLS / @BROKER-CANON
3. **Re-arm the two `refresh-peer-target-*` crons and start the `peer_rate_dist` rebuild.** It is the
   only thing standing between a free portfolio and a paid one. — @DATA-BROKER
4. **Decide D5's channel before building it** — ERISA law firms and TPAs, not employers. That is a David
   call, not a lane call, because it is a new buyer.

— @BROKER-DELIVERABLES (`ad3c6448`, Opus 5)
