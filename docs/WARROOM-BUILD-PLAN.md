# CENSENDA BUILD PLAN
**Owner: David. Operator: this lane. Date: 2026-08-06. Status: engine work UNBLOCKED and urgent, buy-side surface BLOCKED on one ruling (§14.1).**

---

## 1. THE FIVE DECISIONS

| # | Decision | Ruling |
|---|---|---|
| 1 | **What we sell** | **Level, not spread.** Headline unit is `% of the Medicare locality rate` at p50, metro grain. Dispersion is demoted to a gated secondary figure and is never a ranking input. Reason: every known defect in our corpus widens dispersion and none narrows it (NY 99214 IQR ratio is 246x row-grain and 1.83x corrected). We would have been selling our own contamination signature. |
| 2 | **What ships first** | **Site of Care Exhibit, alone.** Public CMS files, no contaminated commercial percentile, ratios already measured (29881 2.03x, 66984 1.88x, 45378 1.86x). Nine of nine operator panels asked for it. |
| 3 | **Name and host** | **Censenda**, ruled by David, live in `src/components/marketing/brand.tsx:41`. Canonical host `censenda.com`. `broker.reddenda.com` never becomes the brand. |
| 4 | **Separation** | Separate repo, separate Netlify site, **separate Supabase project holding only published rollups**, disclosed common ownership. Deliberate reversal of the architecture panel, which did not have the two-sided-conflict finding. |
| 5 | **What we never build** | No score. No savings figure. No named facility. No claims/census/PHI upload. No insurance-arrangement inputs. No percentage-of-savings fee. No compliance verdict. |

---

## 2. POSITIONING, AND THE HONEST ANSWER TO THE TWO-SIDED QUESTION

**Positioning line (lockup):** Know what the market pays.
**Campaign line:** Price the network, not the discount.
**One-sentence product:** Censenda prices a metro against the Medicare locality rate for the codes a group actually uses, from the carrier's own published federal filings, with the sample size, the geography grain and the file date printed on the number.

**The two-sided question, answered verbatim on the record and on every artifact.** A broker or a GA will ask it in the first meeting. The answer is scripted, not improvised:

> "Yes. Reddenda sells rate benchmarking to healthcare providers. Censenda sells it to you. It is the same public federal file, published by your carrier under 45 CFR 147.212, and we show both sides the same number. Three things we do not do. We never show you a provider's confidential contracted rate, because provider intake data lives in a separate database this product cannot reach. We never name a facility or a physician, because the file attaches a rate to a contracting entity and we have no key to resolve one. And we never tell you what your plan pays, because there is no plan dimension in the data. If a vendor tells you they have that, ask them for the join key."

**Non-removable disclosure, in the source footer of every exhibit, every co-branded artifact and every export, screen and print:**

> `Censenda is operated by TwinFlame Group, which also operates Reddenda, a rate-benchmarking service for healthcare providers, including providers in this market. The same published rates are shown to both sides. Censenda holds no provider contract data.`

Undisclosed, that fact voids a fiduciary's exhibit. Disclosed, it is the strongest credibility claim available, because no competitor can say it.

**What we are not.** Censenda is not an insurance producer, consultant or analyst, not a fiduciary, not an ERISA 3(16) or 3(21) service provider, and gives no advice about any insurance policy, plan or program. That sentence is a legal boundary (§14.6) and appears on every artifact.

---

## 3. DOMAIN AND BRAND

**Register `censenda.com` today.** RDAP-verify first (the TMview sweep is hours stale and availability is live state). Defensively register `censenda.health`, `censenda.co`, `sensenda.com`, `censendo.com`. Never make an unfamiliar TLD canonical; `futureful.app` is sitting behind a FortiGuard unrated block right now for exactly that class of reason.

**Mail is on the critical path and the site is not.** David speaks at CAHIP NorCal on Aug 26, twenty days out. A new sending domain needs two to three weeks of warm-up. Stand up SPF, DKIM and DMARC (`p=none` to `quarantine`) on `censenda.com` today and start warming. Until warm, send from `info@reddenda.com` with a Censenda signature block. Never send cold from a five-day-old domain.

**Also today, 60 seconds:** CNAME `broker -> reddenda-broker.netlify.app`, because every link handed out this week carries the raw Netlify host and will otherwise need re-sending. It becomes a 301 to the apex on cutover.

**Brand house, say it out loud in the VC room:** Reddenda (provider side), Censenda (buy side), Tuenda (the intelligence layer both run on). Three Latin gerundives, one rate infrastructure company. Endorsement line `Built on the Reddenda rate platform` at mono 9.5px in the footer, the PDF cover and the email signature. Never in the header.

**Separate note for David, unrelated to this product:** "Reddenda" has zero trademark registrations anywhere in the world. The core brand is unprotected in every jurisdiction.

---

## 4. TOOL SUITE

Eight surfaces. Two deterministic engines underneath: **Engine B** (Medicare reference, setting grid, public CMS files) and **Engine A** (commercial metro level, contract-corrected, blocked until §11 gates go green).

| Tool | What it does | Data behind it | Ships |
|---|---|---|---|
| **T1 Site of Care** | Office (PFS non-facility) vs ASC vs hospital outpatient per Medicare locality, per shoppable procedure, with the ratio as the headline. Labelled a Medicare reference ratio, never a measured commercial spread. **Ratios and CMS rates only. No modeled annual impact, no unit multiplication.** | `medicare_pfs_rvu` (19,356) x `medicare_gpci` (110, year 2026) x CF from `medicare_conversion_factor`. `opps_hcpcs_apc_crosswalk`, `asc_payment_rates`. Never `medicare_locality_cpt_rate` (unlabelled blend wearing a locality's name). Office is a third setting only on the 1,415 codes where nonfac <> fac; 72.1% of CA codes are identical and ranking that spread produces nonsense. | **M2** |
| **T2 Metro Rate Position** | One basket, one metro, up to four named networks. Headline is `% of the Medicare locality rate` at p50. p25/p50/p75 shown, p90 gated. Every cell carries distinct payers, distinct NPIs, grain and file date. | Engine A: `payer_contract_stats_cbsa` + `cpt_contract_stats_cbsa`, built per §11. Never served from `cpt_peer_stats_cbsa` or `peer_rate_dist_delta` directly. | **M5** |
| **T3 Employee Price Sheet** | Employer-branded open-enrollment one-pager, seventh-grade reading level, black-and-white printable. Local price range per shoppable service plus the setting comparison. **No deductible, coinsurance or OOP inputs. No member-share dollars.** | T1 + T2 engines. No new data. | M6 |
| **T4 Channel Batch and Co-Brand** | Up to 200 rows in, co-branded drafts out under the downstream broker's logo and firm name. **Logo and firm name only. No license number, ever.** Every artifact requires a per-artifact adoption click by the named producer before it can be sent. Webhook into the GA quote engine. | No new data. Brand record + delivery layer + adoption ledger. | **M3 (draft path), M5 (T2 content)** |
| **T5 Book Scan** | Re-sorts a pasted book by **level** (`% of Medicare` on a workforce-profile basket) plus ASC-eligibility share, with a visible coverage column. Never by dispersion. | Engine A + Engine B. Business columns are arithmetic on the user's own CSV. | M6 |
| **T6 Counterparty Question Set** | Eight numbered questions bound to specific rows for the renewal call. RFP mode ships only with issuer adoption of the Medicare basis and a non-reliance statement addressed to bidders. | Deterministic rows only. LLM writes prose, never a number, direct Anthropic per the routing law. | M6 |
| **T7 Payer and TPA IDR Record** | Type an administrator name, get presence or absence in the federal IDR record, dispute volume, entity class, and an honest statement that we hold no contracted rates for it. Free trust surface. | `payer_score` (3,737), `payer_canonical_map` (188 classified), `payer_alias` -> `payer_canonical`. Needs a name-search endpoint and replacement of the editorial `featured=true` gate with an n floor of 30. | M6 |
| **T8 Query Receipt** | Replaces "Market Evidence Record". Dated, byte-reproducible record of what was asked, what was returned, what was suppressed and why, at what vintage. **No blank decision template. No six-year archive on our systems. 90-day telemetry retention. Sold as reproducibility, not protection.** | Our own query telemetry plus a hash. | M6 |

**Cut permanently:** employer-specific rate lookup, employer-name search, any savings or overpayment figure, commercial hospital-vs-freestanding pricing, named low-cost facility shortlists, RBP stress sheets, trend and time series, carrier repricing validation, inpatient/MS-DRG, any claims/census/eligibility/835/PBM upload, any compliance or attestation verdict.

---

## 5. INFORMATION ARCHITECTURE

**Spine is the group, path is the tool.** One context control in one fixed pixel. Switching tools preserves the group; switching groups preserves the tool.

Routes: `censenda.com/{tool}?g={group-slug}`. Rail sections and exact strings, all under 22 characters:

- **MARKET**: `Site of Care` · `Market Rates` · `Metro Compare`
- **PLAN**: `Network Read` · `Book of Groups` (GA only)
- **DELIVER**: `Renewal Brief` · `Exports`

**One question per screen, two controls maximum.** Every tool page states its question as a literal sentence in the header and renders a number after at most two required inputs. Everything else lives in one Refine drawer.

**One screen shape on every tool:** header question, sticky control bar, single answer number, evidence (distribution bar plus table), provenance footer. Same order, same heights. The suite is learnable from one tool.

**Metro is the default grain.** State is a fallback, visibly stamped `STATE GRAIN` with the note "Wide grain. Narrow to a metro before you quote." The scope chip enum is three values enforced at the type level: `METRO`, `STATE`, `NO LOCAL BAND`. There is no `NATIONAL`.

**Command palette, four namespaces:** no prefix searches tools by label and by question string, `#` searches codes, `/` searches metros and ZIPs, `@` searches groups. Enter applies to the current tool rather than navigating away.

**Onboarding, three steps, no NPI, under 60 seconds:** where are your people (paste ZIPs), whose network are they on today (picker plus "Not sure yet"), how many employees. Standing copy on step one: "We never ask for claims, member files, or PHI."

**Copy is public per the /methodology split (§13.6):** publish that a defect class exists and that we handle it. Never publish the threshold, the exclusion order or the weighting rule.

---

## 6. BRAND SYSTEM SUMMARY

Light only, locked. `color-scheme: light`, no toggle, no `prefers-color-scheme` branch. The deliverable is a document that gets screenshared and printed; a dark screen and a white PDF are two renderings of one exhibit that will disagree.

**Color, canon, already contrast-verified in `globals.css`:**
`--teal #0FB5A6` (2.57:1, fills only, never text) · `--teal-mid #0A8E83` (4.03:1, display >=24px only) · `--teal-deep #077A70` (5.22:1, **the only teal for small text, links, CTA fill**) · `--teal-press #066B62` · `--teal-wash #E8F7F5` · `--ink #0A0B0C` · `--body #191D21` · `--muted #5B6166` · `--faint #6B7280` · `--ghost #8A9096` (non-text only) · `--paper #FFFFFF` · `--band #F5F8F7` · `--hair #EAEBEC` · `--hair-strong #D6DADC`.

**Semantic bridge (callouts and copy only, never a percentile ramp):** `--live #0FB5A6/#077A70` · `--exposure #C24717` · `--efficient #0C7A55` · `--spread #8A6414` · `--locked #6D5BD6`. Each carries a measured wash at >=4.6:1.

**Distribution ramp, single hue, colorblind-safe by construction:** `#9FDDD6` · `#0FB5A6` · `#077A70` · `#044A44`. Meaning is never carried by hue alone; every marker carries a text label.

**PRO chip, byte-identical or it reads as a knockoff:** `linear-gradient(110deg,#14E09A,#00E5FF)` on ink `#04231F`, 800 10px IBM Plex Mono, tracking .12em, radius 999px, `box-shadow 0 2px 10px rgba(15,181,166,.35)`. Do not import the app repo's 7.5px/`#062A26` variant.

**Type, three faces:** Schibsted Grotesk (display), IBM Plex Sans (UI), IBM Plex Mono (every number, `tabular-nums slashed-zero`). Tool plane scale is separate from marketing and scoped `[data-plane="tool"]`: h1 22, h2 16, body 14, cell 13, cell-num 12.5 mono, stat 30 mono, label 10 mono .12em upper, provenance 10 mono. Floors: 12px prose, 10px mono labels. Mono is the one voice unified across the estate and it is the one that matters.

**Table:** rows 34 comfortable / 40 touch, header 32 sticky, **one separator only** (bottom hairline `#EAEBEC`), no vertical rules, no zebra, no per-cell borders. Hover `rgba(15,181,166,.06)` at 120ms. Sticky first column with edge shadow **only at `scrollLeft > 0`**. Own `overflow-x: auto`; the page body never scrolls sideways.

**Motion:** two curves, five durations (120 tint / 160 fast / 220 panel / 320 drawer / 640 marketing only). Two hard rules: **no count-up on any figure ever** (it renders numbers that were never measured and breaks tabular alignment), and **on refetch hold the stale value at opacity .55**, never skeleton over a cell that already holds a real number.

**Distribution bar, three corrections to what ships today:**
1. **Zero-anchor the axis.** `lo = 0`, `hi = 1.08 x max(p90, medicareHigh)`. Today `lo = min(p25, medicare)` pins p25 to 0%, reading as "the cheapest possible price is the 25th percentile", and puts two markets with different Medicare anchors on different axes.
2. **Five absences, five strings, never one dash.** `money(null)` currently returns an en dash for LOCKED, THIN, NOT REPORTABLE and NOT MEASURED alike. A cell that reads the same in four situations teaches the user that no cell means anything.
3. **A gated p90 is absent from the plot, not blurred.** Pixel x-position is the number. Park the PRO chip at the right inset.

Provenance goes **inside the SVG artboard** so a screenshot cannot be separated from it.

**Banned strings, grep-gated:** national average, national median, average, savings, guaranteed, recovery, we find you money, ROI, HIPAA certified, CAA compliant, audit ready, fiduciary duty satisfied, insights, actionable, platform, seamless, holistic, empower, transform, real-time, unlock, AI-powered, big data, revenue cycle, `n_contracts`, `45 CFR 149.140`. Plus no em dashes, no exclamation marks, no "just", "simply", "oops".

---

## 7. TECHNICAL ARCHITECTURE

**Repo:** `/Users/user/reddenda-broker`, Next 16 App Router, own Netlify site. **Not merged into `reddenda-app`.** The two-sided conflict requires that no credential in this application can reach provider intake data.

**Database: a second Supabase project, `censenda_pub`.** It holds only materialized, filtered, gated rollups. A one-way ETL pushes from the provider project into it. There is no reverse path and no credential in this app that resolves `contract_reviews`, `intake_*` or any per-NPI provider table. The negative is attestable and gets published as a data-flow diagram, because a provider cannot audit our query paths and a promise is not a wall (the CSS PIN gate is the estate's own precedent for what an unprovable wall is worth).

**Never extend `netlify/functions/public-rate-lookup.js`.** Its `PUBLIC_LOOKUP_API_KEY || ''` default makes its 401 block dead code, it sets `Access-Control-Allow-Origin: '*'` with `Cache-Control: public, max-age=300`, and its limiter is documented fail-open. Adding a `cbsa` param there publishes the entire assembly (contract correction, home-state gate, sanity gate, metro grain, Medicare anchor) to an anonymous curl and lets the Netlify edge serve repeats without the limiter ever counting them. Censenda reads `censenda_pub` directly through its own server client.

**Gates are ported, not reinvented.** `src/lib/gate/` copies the structure of `data-gate.ts`, `peer-gate.ts`, `entitlements.ts` and `rate-limit.ts` verbatim, with a parity test that diffs behavior against the app implementations on a shared fixture set. Those ~900 lines encode real incidents (27 paid accounts downgraded by an RLS-blind read, a p90 leak across nine routes, an open redirect on the login callback, cross-org NPI exfil). We inherit the fixes rather than re-earn them.

**Durable anonymous quota.** A `SECURITY DEFINER` RPC on `censenda_pub`, atomic, keyed on a server-set signed cookie plus IP plus ASN. The in-memory Maps in `rate-limit.ts` evict idle buckets in 120s and cannot hold a 24-hour counter; a cold isolate starts every IP at full tokens. **Inversion of the estate's fail-open rule: an abuse brake may fail open, a value gate may not.** On counter failure the route degrades to the demo answer, never to the full answer.

**Artifacts are capability URLs, not bearer links.** v1 delivery is print-ready HTML at a URL carrying an HMAC of `(exhibit_id, brand_id, expiry, account_id)`, 72-hour life, revocable by account, rate-limited per token, view-logged, and watermarked with the issuing account id so a leak is attributable. p90 is re-resolved at render time against current entitlement, never stored inside the object. **No PDF library in v1.** There is none in the stack today and that is a documented deliberate choice; browser Save-as-PDF ships the same bytes. If brokers will not forward a branded HTML page, that is a real finding about the thesis learned for zero infrastructure.

**Render bodies carry no numbers.** The render route takes an `exhibit_id` and re-runs the memoized query server-side, so a client cannot render a value the engine did not compute.

**Fix on sight:** `src/lib/rates.ts:85` reads `medicare_locality_cpt_rate`, the table the ground truth forbids. Repoint to `medicare_pfs_rvu` x `medicare_gpci` x CF.

---

## 8. DEMO AND GATING, ENFORCED SERVER-SIDE

**Entitlement dimension is new: `broker` with three values, `guest | broker | firm`.** The provider ladder (`new|audit|pro|agentic`) is not reused; "audit" reads as a plan audit to this audience, and a provider tier on a buy-side seat recreates QUIRK 1, where a principal with no correct branch silently takes the fail-closed one.

`src/lib/broker/access-decision.ts` exports a **pure** `decideBrokerAccess({tool, authed, brokerPlan, localityScope, cbsa, codeCount, networkCount, pairsUsed})`, snapshotted by a golden matrix in `npm run gates` from the first commit.

| Plan | Gets | Ceiling |
|---|---|---|
| **guest** | T1 full locality ratio table across the curated catalog, all three settings, the chart, the grain row, the provenance disclosure. T7 presence and class. T2 (post-M5): the visitor's own CBSA, fixed six-code basket, all-payer band only, p25/p50/p75. | 25 distinct (code, locality) pairs per rolling 24h for T1; 10 result-producing lookups per 24h for T2; 20 T7 searches. **No branded render, no export, no named networks, no p90.** |
| **broker** | Any locality and metro, 25 codes, four named networks, p90, branded render, saved exhibits, T3/T5/T6/T8. | 200 pairs per 24h. |
| **firm** | Broker plus white-label render, seat management, batch (200 rows), webhook. GA distribution runs through the existing `/partner` principal class, not a new principal. | 2,000 pairs per 24h. |

**Six enforcement rules, all server-side:**
1. **The API coerces, it does not trust.** A guest POST carrying 12 codes, 3 networks and a foreign CBSA is rewritten to the basket, `networks=[]` and the resolved CBSA. A non-basket code from a guest is a 403 deny body, not a client-side hide.
2. **p90 is deleted from the response object below the line**, every column carries `p90_locked: true`, and the response is `private, no-store`. There is no blur, because there is no value on the client to blur. The PDF prints the word `Pro`. CSV exports the literal `locked`.
3. **A locked facet is a button, not a `readOnly` input.** An input you cannot type into is a broken control and users file it as a bug.
4. **The artifact requires the free account on first render**, not at pair 26. The number is free because it is public CMS data and gating it is theatre. The account is the only durable output of that transaction.
5. **The ceiling is stated affirmatively before it is hit** ("18 of 25 pairs today"). No countdown, no progress bar, no exclamation mark. The rendered exhibit stays readable at 429.
6. **Two input firewalls, both grep-gated (§12).** Reject at any depth, case-insensitive: `npi|provider|tin|practice|roster|member|census` (400 `npi_not_supported`) and `funding_type|stop_loss|spec_deductible|attachment|coinsurance|oop_max|sbc|premium` (400 `insurance_arrangement_input_not_supported`). The second one is what keeps us out of NY Ins. Law 2102(b)(3) and out of the savings-figure business with one control.

---

## 9. PACKAGING SHAPE

No prices anywhere in this document. Stripe is the only authority and pricing is not final.

- **Broker**: **annual firm license billed once**, not a monthly seat. Every trigger in this product is annual per group and clustered at 1/1. A monthly subscription against an annual job does not create churn risk, it creates churn arithmetic.
- **GA / FIRM**: channel license, sold as the right to white-label plus a co-branded render allotment plus the quote-engine webhook. **Never per-seat down a distribution hierarchy.** A GA gives value to hold a block; it does not become a software reseller to its own downline.
- **Employer direct**: one-time per-engagement artifact. **Held out of NY and CA entirely until §14.6 counsel returns**, sold through the broker in those states.
- **Structural, permanent, not a price**: no percentage of savings, no contingency, no per-life fee, and Censenda pays no producer, GA, consultant or adviser anything for introducing a customer. The channel buys a license; it is never paid a commission. Amend CLAUDE.md ICP #6 from "white-label / referral" to "white-label licensee" and strike the word referral.
- **Second permanent rule**: no facility, lab, ASC, imaging center, health system or navigation vendor may ever pay for inclusion, ranking or placement. That single configuration converts T1 and T3 from analytics into a marketing-intermediary arrangement that EKRA 18 U.S.C. 220(a)(2)(B) reaches with no referral required. It is also exactly what a growth-pressured founder reaches for in month nine, so it is written down now.

---

## 10. BUILD SEQUENCE, EACH MILESTONE SHIPS LIVE

**M0 (today, zero code).** Covenant question to David in writing (§14.1). Register `censenda.com`, start mail warm-up, add the `broker` CNAME. Open the counsel engagement. Nothing buy-side goes public until M0 closes.

**M1 (this week): the truth pass on what is already live.** Ships regardless of the covenant ruling.
- Delete every commercial percentile from the broker surface: `/api/lookup`, `/api/compare`, the rate-check tool, the metro picker. Suppressing the visible half while serving the invisible half is worse than serving nothing, because the invisible half currently wears a HIGH confidence badge (`judge()` passes CA 70553 at p50 $1,448 on n=10,561 when the corrected figure is $848 on n=710).
- Fix `rates.ts:85`.
- Strip `annual_medical_spend`, `modeled_site_of_care_opportunity`, `total_modeled_opportunity` and per-group case counts from the demo fixture. The containment work is good; it is aimed at the wrong risk. The demo currently teaches the buyer that this product answers "what does this cost me" with a savings figure.
- Rewrite `perf-trust.html` ("Our incentives only point one direction") and `what-happens-after-upload.html` ("We don't sell your data. Not to payers.") before launch makes them false.
- Fix the copy that says 917 metros while the picker exposes 124.
- Apply brand corrections 1 through 8 (§6).

**M2 (week 2): Site of Care Exhibit, live.** Ratio only. Locality resolver with the honest band for the 93 of 925 ambiguous zip3 pairs. Print-ready HTML at a capability URL. Guest ceiling of 25 pairs. Account required on first branded render. Post-deploy: register in `internal-directory.html`, email David.

**M3 (week 3): the channel path, live.** GA brand record (logo and firm name only), 200-row batch producing **drafts**, per-artifact producer adoption click, index CSV, quote-engine webhook. The webhook is promoted from a buried clause to a primary mechanism: it is the only non-volitional trigger in the entire plan and it fires at the rate the GA already quotes rather than the rate a broker remembers to log in.

**M4 (weeks 2 to 8, parallel, provider-positive, NOT gated on the covenant ruling): the engine.** §11 in full. This ships first as a **provider-side RateScore correction**, because `cpt_peer_stats` is the RateScore basis and carries the same contamination, biasing every provider score upward. Whatever David rules on the covenant, this work is required.

**M5 (only after G5 and G6 are green through two consecutive monthly refreshes): Metro Rate Position, live.** `% of Medicare` at p50 as the headline. T4 gains T2 content on the same day.

**M6: T3, T5, T6, T7, T8.** Sequenced by the demand gate below.

**Demand gate, hard, before M6 code is written:** at least 20 distinct broker or GA accounts using T1 on two separate days within a 30-day window. Precondition on M3: 10 primary broker and GA calls. The estate has **4 broker-shaped records in 1,013,392 CRM rows** and has never done primary research on this audience. Nothing justifies building eight surfaces before that.

---

## 11. DATA WORK AND THE CONTAMINATION FILTER STACK

**The plan's original prerequisite does not compile.** `DISTINCT (payer, source_file, billing_class, modifier, negotiated_rate)` names two columns that do not exist on `npi_payer_cpt_rate` (11 columns, no `billing_class`, no `modifier`), and the ClickHouse table every rollup actually reads has 7 columns and no `source_file`. Value-dedup also hands 38% to 58% of the resulting distribution to single-occurrence ghost rates and moves clean cells violently in unpredictable directions (TX 99214, 0.24% junk: p90 moves +28%). It only looks like a cure on NY 99214, which is the one cell where the wrong estimator produces a right-looking answer, and that is the cell it was validated on.

**Filter order is load-bearing. Filter before reweighting, never the reverse.**

| # | Filter | Measured |
|---|---|---|
| F0 | Source from `payer_contracted_rates`, the only table carrying `billing_class`, `modifier`, `negotiated_type`, `service_code`. | 675,921,061 rows |
| F1 | Keep `lower(negotiated_type) in ('negotiated','fee schedule')`. Drop percentage, derived, per diem. Case-insensitive; `NEGOTIATED` exists. | drops 1.70% |
| F2 | Parse and store `billing_code_type`, never read today. Admit only CPT and HCPCS. Reject LOCAL, RC, MS-DRG, APC, NDC, ICD, CSTM-ALL. | a LOCAL code colliding with a CPT string is currently ingested as that CPT |
| F3 | Split `negotiation_arrangement` out of `billing_class` (`lib_parser.js:336` writes one disjoint enum into the other's column) and drop non-`ffs`. | |
| F4 | Drop `0 < rate <= 2.00`. Drop `rate < 0.25 x` the Medicare non-facility rate for that code and locality. | NY 99214: 11,338 of 38,453 rows are <= $2.00, mode 0.95 at 8,365 rows |
| F5 | Newest `source_file` per payer only. Drop `expiration_date < CURRENT_DATE`. Treat 9999/2999/2078 as open sentinels. | `bcbstx` carries two vintages; 0.67% already expired; 88.5% sentinel |
| F6 | Never blend components. Modifier-free is the headline series; 26 and TC are separate labelled series. | 41.2% carry a modifier, 14.4% carry 26/TC, up to 3.165x |
| F7 | Never mix `billing_class`. Institutional is an honest empty state, not a thin percentile. | professional 98.32%, institutional 0.39% |
| F8 | Home-state / BlueCard gate at CBSA grain, modeled on `localityValid()`. | `bcbs_mi`, `bcbs_hi`, `bcbs_ri`, `wellmark_ia` currently appear inside CBSA 31080 |
| F9 | **Payer-equalized weighting, then drop rates appearing on a single NPI in the cell.** Not value-dedup. | TX 99214 payer-equalized p50 $130.59 / p90 $236.87 vs dedup $131.10 / $239.22, without handing the answer to ghosts |
| F10 | Gate on **distinct payers >= 5** and distinct NPIs. Print both. | |
| F11 | Sanity, all AND-ed: `p50>=1`, `p90>=p50`, `p90<=20*p50`, `p25>=0.15*p50`, `p75/p25<=10`, `p50>=0.50 x Medicare anchor`, `p90 != p50`. | 99214 NY fails all three added tests; Santa Clara 70553 fails p90!=p50 |
| F12 | **Estimator-divergence gate.** Compute p50 and p90 four ways; suppress the cell where the p90 range across methods exceeds 15% of the median method. | TX 99214 spans 28% today and correctly suppresses |

**Never print `n_contracts` and never cite 45 CFR 149.140(b)(1).** Contract grain is uncomputable while `tin` is 0% populated: no contract key, no plan key, no arrangement flag exists. The honest label is: `distinct filed price points per payer, deduplicated across providers, not weighted by volume and not weighted by contract`. A benefits attorney checks the citation on the first call.

**Medicare anchor** is always recomputed as `(work x gpci_work + pe x gpci_pe + mp x gpci_mp) x CF` from `medicare_pfs_rvu` and `medicare_gpci` (2026), CF read from a table, never hardcoded. `medicare_locality_cpt_rate_fixed` is an assertion oracle in the gate script only, never a serving path (91,850 of 864,160 keys carry 2 to 3 unlabelled component rows).

**Ingest fixes, ship now even though they are not retroactive:**
- Add `service_code` and `tin` to `uq_pcr_coalesce`, `stream_one.js:104`, `pcr_rollup_tick.sh:99`, `peer_rebuild_staging.sh:172`. Every month this stays broken, the eventual entrant's corpus is structurally better than ours on the dimension four operator panels ranked first.
- Persist `reporting_entity_name` and `reporting_entity_type` at `lib_parser.js:390`. The name is already parsed at :122/:148/:158 and thrown away. It is the only path to TiC-side entity identity and it is half built.

**The compounding asset, started at M4:** Form 5500 Schedule A and C from EFAST2 (EIN, sponsor legal name, participant count, funding arrangement, named TPA and broker). Carrier brand to licensed entity to network product to TIN is the crosswalk nobody can shortcut in six months, and it is 5% built and orphaned today (`payer_canonical_map`, 188 rows, referenced by zero application code).

**Second compounding asset, captured from T6's first commit:** a structured, k-anonymized cross-customer record of counterparty response behavior (which carrier or TPA answered which numbered question, how fast, with what substance, by metro), minimum 5 distinct firms per cell, presence and latency only, never a named-counterparty quality verdict. T6 already prints the blank answer lines and T8 already accepts typed answers. Today that exhaust is deleted on write.

**Refresh cost, owned explicitly:** `cpt_peer_stats_cbsa` measured 10 days stale with no consumer applying a staleness threshold. A staleness badge at >90 days is mandatory on every cell, and the monthly rollup gets a fail-loud alarm. A job that logs its own failure is not monitored.

---

## 12. VERIFICATION GATES

Added to `npm run gates`. Each fails the build RED.

| ID | Gate |
|---|---|
| G1 | Banned-string grep across routes, components, error strings and both export templates, including `n_contracts`, `149.140`, `national median`, `savings`, and the em dash character. |
| G2 | Contrast assertion parsing `globals.css` itself, extended with the eleven new pairs. |
| G3 | NPI firewall: 400 on the seven keys at any depth, plus a regex sweep of every 200 body for a 10-digit NPI or provider name. |
| G4 | Insurance-arrangement input firewall: 400 on the eight keys. |
| G5 | Estimator divergence <= 15% on a fixed 20-cell probe set. |
| G6 | Contract-corrected p50 vs row-grain p50 divergence > 10% on the probe set fails. This alone would have caught CA 70553 on first publish. |
| G7 | Golden matrix for `decideBrokerAccess`, byte-identical cell for cell. |
| G8 | Quota RPC throwing must return the demo body, never the full body. |
| G9 | Measured on the wire with curl: no key matching `/p90(?!_locked)/` for guest or unpaid, `private` and `no-store` present, zero numerals in the gated DOM subtree. |
| G10 | Slate vintage byte-equal to live `updated_at`; snapshot data years equal live `max(year)`. |
| G11 | Medicare anchor equals RVU x GPCI x CF within $0.01 and does **not** equal `medicare_locality_cpt_rate` (assert inequality on 21110 across CA, NY, WA). Zero SELECTs against the forbidden tables in the query log. |
| G12 | Real browser at 320/390/768/1024/1440/1920: `window.scrollTo(9999,0)` then `window.scrollX === 0`; sticky column shadow opacity 0 at `scrollLeft 0`; focused row bounding top >= 104px; interactive chips >= 24 CSS px. |
| G13 | The two-sided conflict disclosure string is present in every artifact render path and every export header block. |
| G14 | No synthetic dollars in any fixture: grep `annual_medical_spend`, `modeled_.*_opportunity`, `total_modeled`. |
| G15 | Gate parity: ported `src/lib/gate/*` behavior diffs clean against the app implementations on the shared fixture set. |

Standing rule: a 200, a green deploy, a passing unit test and a present-in-the-file grep are not evidence. Click every control, test the negative paths, look at a screenshot.

---

## 13. OPERATING CADENCE

1. **Claim before the first write** in `.terminal-claims.md`, naming the lane whose file you touch. `public-rate-lookup.js` and `crm.js` are other lanes' surfaces.
2. **Deploy at every milestone.** Commit and push before every promote. Never batch a day into one promote.
3. **Post-deploy, every time:** open the live URL in a real browser at 390 and 1440, register additively in `internal-directory.html` with the full URL, aliases, deploy id, verification result and lane, then email David from `Reddenda Estate <info@reddenda.com>` with an `ACTION NEEDED` block at the top, then confirm delivery from the Resend API.
4. **Weekly:** full `npm run gates`, the 20-cell probe set, and a staleness check on the rollups.
5. **Monthly:** refresh watch with a fail-loud alarm. Two consecutive clean refreshes is the M5 unlock condition.
6. **Lanes:** @CENSENDA-CONDUCTOR (deploy, domain, claims) · @CENSENDA-TOOLS (`Distribution.tsx`, `src/lib`, `src/app/tools`) · @CENSENDA-MARKETING (`globals.css`, `layout.tsx`, `components/marketing`) · @DATA-FABRIC (filter stack, rollups, ingest keys, RateScore correction) · @LEGAL-STACK (contract stack, counsel, disclosures).
7. **Model routing:** judgment, copy that ships, and anything adversarial goes to the top tier. Mechanical sweeps only where output is verifiable by assertion.

---

## 14. ADVERSARIAL FINDINGS LEDGER

Every FATAL and SERIOUS finding, resolved or accepted with an owner.

**14.1 FATAL, domain and brand vs the published Covenant. NOT RESOLVED. BLOCKED ON DAVID.**
`reddenda.com/covenant` returns 200, is `index, follow`, is linked 3x from the homepage, and reads "The rate index that will never take a dollar from a health plan", with draft charter language prohibiting furnishing any artifact "for the purpose of (i) reducing the amount paid to a health care provider". The proposed buyer is the plan sponsor. Seven of eight tools are inside that prohibition on their face, including T1, whose entire purpose is steerage. Covenant I's Prohibited Party clause additionally screens part of the GA and national-brokerage tier. This was already ruled OUT on 2026-07-14 ("structurally forbidden buyers") and `rdx` returns zero reversals. **No buy-side host resolves, no buy-side page is indexed, and no artifact leaves the building until David rules.** M1 and M4 proceed regardless. Owner: David.

**14.2 FATAL, contract-grain estimator validity. RESOLVED in §11.** Spec deleted and replaced: source from `payer_contracted_rates`, filter before reweighting, payer-equalized weighting plus single-NPI drop instead of value-dedup, the 149.140 citation and the phrase `n_contracts` struck everywhere, and G5/G6 added. **Revalidation runs on TX 99214 and CA 70553, never on NY 99214.** Owner: @DATA-FABRIC.

**14.3 FATAL, execution and delivery realism. RESOLVED in §7, §10, §11.** Commercial percentiles deleted from the live surface in M1, not gated. T1 ships alone on four static federal tables. No PDF pipeline in v1. Synthetic savings fixture stripped. G6 added. Repo stays separate but gates are ported with a parity test (G15), which addresses the substance of the merge objection while satisfying 14.7. Owner: @CENSENDA-CONDUCTOR.

**14.4 SERIOUS, security and value leakage. RESOLVED in §7, §8.** `public-rate-lookup.js` is never extended; Censenda reads its own project. Durable anonymous quota RPC that degrades to demo on failure. Capability URLs with HMAC, 72-hour life, revocation, view logging and per-account watermark. p90 re-resolved at render time. G8/G9 added. The two live `/payer-rates` defects (Medicare card reading `.rate` and printing $0, LLM refusal string as body copy) are fixed by the owning lane under a claim, not by us. Owner: @CENSENDA-TOOLS.

**14.5 SERIOUS, third-party reliance and liability. RESOLVED in §4, §7, §9, and the contract stack below.** Capability URL is the universal delivery path and presents a recipient notice with scope-of-use and non-reliance terms, recording recipient, timestamp and artifact version hash. Batch produces drafts only; publication requires a per-artifact adoption click by the named producer on a screen showing suppression count, failed cells and vintage. The modeled dollar and member-share range are deleted from T1 and T3. T8 replaces the Market Evidence Record with a query receipt, no decision template, 90-day retention. Contract stack, before the first artifact ships: broker/GA master agreement with an express no-third-party-beneficiary clause, a flow-down the broker must present to every recipient, an indemnity running from the broker to us for claims by his clients on exhibits he adopted, an E&O requirement, and a liability cap keyed to fees paid. `terms.html` section 01 scopes the service to "independent medical practices" and its section 07 cap may not attach to buy-side use at all; it is rewritten first. Owner: @LEGAL-STACK plus David.

**14.6 SERIOUS, insurance producer licensing. RESOLVED in §8, §9, §4.** Censenda ships the measurement; the licensee ships the recommendation. Deleted from our output: the plan-design bullet, the draft SPD amendment line, the RFP bid-specification clauses and the modeled plan-liability line. The insurance-arrangement input firewall (G4) is the single control that closes both this and the savings-figure risk. The license number never enters our system; co-branding is a logo and a firm name. The mandatory non-editable footer states we are not a producer, consultant, analyst or fiduciary. **Employer-direct is held out of NY and CA** until insurance-regulatory counsel (not health care counsel) answers one question on NY Ins. Law 2102(b)(3) and Cal. Ins. Code 1831 et seq. Two new hard rules written into CLAUDE.md: no referral compensation, no pay-for-placement. Owner: @LEGAL-STACK. Residual risk accepted: the "two states, one regime class" survey is verified for two and unverified for the rest.

**14.7 SERIOUS, two-sided conflict. RESOLVED in §2, §3, §7, with one carve-out.** Separate entity brand, separate repo, separate Netlify site, **separate Supabase project reachable only by the ETL**, published data-flow diagram, disclosed common ownership, and the conflict printed on every artifact (G13). We keep the provider-side performance lane, because David ruled it public and a real business line on 2026-07-13; the separation is structural rather than by abandoning that lane. `perf-trust.html` and `what-happens-after-upload.html` are rewritten in M1 before launch makes them false. The MSO collision rule is fixed: a multi-NPI group that is also a self-funded employer may hold both principals rather than being silently 403'd. The route-param check is renamed **data firewall**; the agency conflict is a separate open line item so it cannot be marked solved by an 18th gate. Owner: David plus @LEGAL-STACK.

**14.8 SERIOUS, demand and habitual usage. RESOLVED in §9, §10.** Annual license replaces the monthly seat. The GA quote-engine webhook is promoted from a P1 clause to a primary M3 mechanism. T2 is re-keyed from renewal (annual, 1/1-clustered) to prospecting and finalist meetings (weekly). Two surfaces ship, not eight. Hard demand gate before M6. Ten primary calls before M3. The Market Evidence Record is cut as specified and rebuilt as T8 with a different buyer, because you cannot sell risk mitigation while banning every word that names the risk, and the cases it rested on were dismissed on Article III standing. T7 is retained as a free trust surface only. Owner: David plus this lane.

**14.9 SERIOUS, differentiation and moat. RESOLVED in §10, §11, §13.6.** T1 ships with the GA brand record from day one, because the channel relationship is the only appreciating asset in the plan. The guest ceiling produces accounts (branded render requires the account). Counterparty response capture starts at T6's first commit. Form 5500 spine promoted from cut to M4. `uq_pcr_coalesce` fixed now. `/methodology` splits into trust content (published) and build spec (not published): the thresholds, the exclusion order, the weighting rule and the RVU basis stop being mailed out on RFP sheets. Owner: @DATA-FABRIC plus @CENSENDA-MARKETING.

**14.10 SERIOUS, positioning honesty. RESOLVED in §1, §2, §4.** Headline unit becomes `% of the Medicare locality rate` at p50, a central-tendency level claim in the unit this audience already trades. Setting leads, correctly scoped to HOPD vs ASC with office as a third setting only where `nonfac <> fac`. Dispersion is demoted, gated, labelled with its censoring, and removed from Book Scan's ranking. The hero cinematic resolves onto a Medicare reference line rather than into a wide distribution. "THE FLINCH" is retired as a funnel stage. The conflict prints on every artifact. Owner: @CENSENDA-MARKETING.

---

## 15. BLOCKED ON DAVID

1. **Does Covenant II stand as published?** This blocks the entire buy-side launch, not just one tool. Two paths, both executable, neither startable without the ruling. **(A) It stands:** re-point both engines to providers as employer-side and administrator-side intelligence (which self-funded plans and TPAs sit behind your local volume, what a payer will quote before they quote it, what steerage is about to do to your outpatient volume). Same corpus, same grain, same gates, opposite purpose, ships on `app.reddenda.com` with zero new principal, zero new Stripe surface, zero new domain. **(B) It is amended:** amend `/covenant` publicly first with a dated changelog, rewrite the homepage section 02 attack before it indicts us, then launch Censenda on its own registrable domain, disclosed with a link from `/covenant`. Ship-first-amend-later is not available: Certificate Transparency publishes the host the instant the certificate issues.
2. **Register `censenda.com` today**, plus the four defensive domains, and authorize the mail warm-up. CAHIP NorCal is 20 days out and the sending domain is on the critical path.
3. **Approve the separate Supabase project and the disclosed-common-ownership posture**, or rule the alternative (drop the outcome-linked provider agency, which contradicts your 2026-07-13 performance-lane ruling and is why I did not choose it).
4. **Authorize insurance-regulatory counsel** for the one-question opinion, and authorize the broker/GA master agreement plus recipient notice. Employer-direct does not sell into NY or CA until this returns.
5. **File a trademark on "Reddenda."** Zero registrations exist anywhere in the world.
6. **Confirm the packaging shape** (annual firm license, GA channel license, employer per-engagement) so Stripe objects can be created. No prices are stated anywhere until you rule.
7. **Confirm the ICP #6 amendment** ("channel partners, white-label licensee", referral struck) and the two new hard rules: no referral compensation, no pay-for-placement.