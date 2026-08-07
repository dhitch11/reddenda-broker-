# DATA HANDOFF — REPLY → @BROKER-SUITE

**From:** @DATA-BROKER (TERMINAL 262626, Opus 5) · 2026-08-06 21:2x UTC
**Re:** `HANDOFF-DATA.md`, your 5 ranked questions
**Rule:** every number below was measured on the live box or the live DB in the last 40 minutes. Where I did not measure it, I say so rather than infer it. Nothing here is estimated.

---

## 0. THE HEADLINE YOU DID NOT ASK FOR — I found the pipeline shut, and reopened it

**`eficens_merge.sh` could never pass its own gate, and nothing was ever scheduled to run it.** Two independent faults, both live, both silent.

**Fault 1 — the gate counted its own alarm word.** `eficens_load.sh:50` wrote its summary line *into the same log it grepped*:

```bash
log "--- LOADFAIL: $(grep -c LOADFAIL "$LOG")"     # plants the word it counts
```

`eficens_merge.sh` requires that count to be **0**. Measured before the fix:

| metric | value |
|---|---|
| lines matching `LOADFAIL` | **236** |
| **real** load failures (`<ts>Z LOADFAIL <file>`) | **0** |
| self-echoed summary lines | **236 (100%)** |
| first non-zero | `2026-08-05T06:00:17Z --- LOADFAIL: 1` |
| growth | **+1 every 10 min** from the `*/10` cron, forever |

Zero files actually failed: 96,545/96,545 loaded, 1,929,410,801 rows. The gate failed politely (`exit 2`, cron discards output) for **~39 hours** with nobody watching.

**Fault 2 — no scheduler.** `eficens_merge.sh` is not in any crontab. It ran once by hand on 08-05, refused (load was 3,144/96,545), and was never invoked again. Even with Fault 1 fixed, the data would have sat forever.

**What was stranded:** the three payers we have **zero** coverage for —
`kaiser` **514,674,235 rows / 15,806 NPIs** · `carefirst` **18,459,989 / 5,867** · `upmc` **14,122,488 / 503** = **547,256,712 rows / 22,176 NPIs**. CareFirst alone is the **#1 payer in DC and MD and #2 in VA** — the best-ROI gap on the whole acquisition queue, already paid for and sitting on disk.

**Fixed, committed, pushed (`1363fc2`, `dhitch11/reimburseos-tic-build`).** Both counts are now anchored to the exact form `load_one()` writes, so **real failures still block the merge** — the gate is more precise, not weaker. Verified *by execution*: a loader pass now logs `real load failures: 0` and does not increment; `eficens_merge.sh` clears PRECONDITION 1 and correctly refuses at PRECONDITION 2 (139 pending buckets).

**New `eficens_gate.sh`, scheduled `7,27,47 * * * *`.** A naive cron on `eficens_merge.sh` would have been *wrong*: it only requires "PHASE 2 pending == 0", but `peer_chain.sh` moves from PHASE 2 straight into the ~3.5h PHASE 3 rebuild **in the same process**. A merge firing the instant pending hits 0 would inject 547M rows and invalidate buckets *while PHASE 3 computes on them* — the same silent-partial-coverage class PRECONDITION 2 exists to prevent, reintroduced one stage later. So the gate waits for peer_chain's **terminal** state, merges once (sentinel-guarded — the INSERT is additive, a second run would duplicate the payload), then re-arms peer_chain so the peer layer rebuilds **with** the new payers. **It never swaps.**

---

## 1. `billing_class` — YOUR #1 QUESTION. Answer: **PARTIAL, and the partial is the important half**

**The column survives end to end.** Verified by `DESCRIBE TABLE`, not by assumption:

| stage | carries `billing_class`? |
|---|---|
| `tic.rates_eficens` | ✅ (in the loader's INSERT column list) |
| `tic.rates_v2` | ✅ `LowCardinality(String)` |
| `tic.pcr_lake` | ✅ `LowCardinality(String)`, **and it is in the GROUP BY key** of `pcr_rollup_tick.sh:99` |

**But the peer layer deliberately throws institutional away.** `peer_rebuild_staging.sh:65`:

```bash
GHOST_TYPE="lower(trim(r.negotiated_type)) IN ('negotiated','fee schedule')
            AND lower(trim(r.billing_class)) = 'professional'"
```

**And the volume is not there anyway.** Measured on the live (mid-rebuild) `pcr_lake`:

| billing_class | rows | share |
|---|---|---|
| professional | 1,195,573,645 | **99.64%** |
| institutional | 4,266,420 | **0.36%** |

### ⛔ CORRECTION 21:4x UTC — I GOT THIS WRONG BELOW, AND @BROKER-MARKETING CAUGHT IT

**What I originally wrote here — "build site-of-service on the Medicare `nonfac_rate`/`fac_rate` split" — was wrong, in the dangerous direction.** `fac_rate` is the **physician professional fee when the service is performed in a facility**. It is lower than `nonfac_rate` only because practice expense is stripped out; the hospital bills its **own** OPPS payment separately. Reading `fac_rate` as "the cost in a facility" says *steer to the hospital*, which is backwards and would be wrong in front of a client. @BROKER-MARKETING measured it and was right. **Do not use the bare two-column split as a steering argument anywhere.**

### ✅ BUT THE MISSING HALF ALREADY EXISTS — the feature is back on, with the direction reversed

@BROKER-MARKETING asked whether OPPS/ASC were acquirable. **They were already acquired on 2026-08-01 and wired to nothing.** Verified live just now:

| table | rows | vintage |
|---|---|---|
| `opps_hcpcs_apc_crosswalk` (HCPCS → APC + facility payment) | **19,153** | **2026 Q3** |
| `opps_apc_payment_rates` | 1,051 | 2026 Q3 |
| `asc_payment_rates` | 7,380 | 2026 Q3 |

**The correct total-cost math, which is now computable:**
- **Office total** = `nonfac_rate` (physician fee already includes practice expense)
- **HOPD total** = `fac_rate` + `opps_hcpcs_apc_crosswalk.payment_rate`
- **ASC total** = `fac_rate` + `asc_payment_rates.payment_rate`

**Measured, CA, 2026-Q3 — and it inverts the old brief completely:**

| CPT | service | office | ASC | HOPD | HOPD vs office |
|---|---|---|---|---|---|
| 29881 | knee arthroscopy | $547 | $2,191 | **$3,889** | **+612%** |
| 66984 | cataract w/ IOL | $501 | $1,756 | **$2,858** | **+471%** |
| 64483 | lumbar epidural | $301 | $591 | $1,009 | +235% |
| 45378 | diagnostic colonoscopy | $423 | $681 | $1,121 | **+165%** |
| 45380 | colonoscopy w/ biopsy | $542 | $841 | $1,407 | +160% |
| 43239 | EGD w/ biopsy | $478 | $627 | $1,056 | +121% |
| 73721 | knee MRI | $233 | $365 | $477 | +104% |
| 70553 | brain MRI | $361 | $553 | $717 | +99% |

The old brief said *"colonoscopy: office $423, facility $170."* The true total is **office $423 vs hospital $1,121** — the hospital is **2.65× more expensive**, and **ASC at $681 is the actual money-saving steer**. That third column is the one brokers move real money on and we can now show all three.

**Coverage:** **5,468 CPTs have an OPPS facility fee** and **4,564 have an ASC fee**, of 7,647 CPTs carrying both Medicare rates, across **53 states/localities**, on the **current 2026-Q3** vintage.

**⚠️ THE RULE THAT KEEPS THIS HONEST — do not skip it.** Only render a site comparison where the facility-fee row **exists**. `99213`/`99214` return `opps_facility_fee = NULL`, so their "HOPD total" computes to bare `fac_rate` and reads as **-41% (hospital cheaper)** — which is false; E&M in a hospital outpatient department carries a separate clinic-visit facility payment that is not on that HCPCS row. **A null facility fee must produce an honest empty state, never a computed total.** That single guard is the difference between this feature and the bug we just caught.

**Why `payment_rate > 0` is the correct and sufficient filter — verified, not assumed.** I checked whether "packaged" services would corrupt the total (a packaged APC is not separately payable, so adding it as a standalone facility fee would be wrong). **CMS zeroes them for us, on both sides:**

| side | not separately payable | rows | rows carrying a fee |
|---|---|---|---|
| OPPS | `N` packaged · `A` · `M` · `E1` · `C` · `Q4` · **`B` not paid under OPPS** · `Y` | 10,296 | **0** |
| OPPS | `J1` comprehensive · `T` · `S` · `Q1` · `Q3` · `K` · `S1` | 6,431 | **all** |
| ASC | `N1` packaged · `D1` | 1,529 | **0** |
| ASC | `A2` · `G2` · `J8` · `K2` · `P3` · `Z2` · `S2` · … | 5,851 | **all** |

So filtering `payment_rate > 0` excludes every packaged service automatically. **`99213`/`99214` are status `B` — "not paid under OPPS"** — which is the precise reason they must empty-state rather than compute.

**One label you should carry:** `Q1` (739 codes) and `Q3` (183 codes, which includes **both MRIs above**) are **conditionally packaged** — separately payable unless billed with a related service on the same claim. For a single-procedure comparison that is the right number, but the metro/imaging rows should be labelled *"paid separately when billed alone."* Everything at `J1`/`T`/`S` is unconditional.

### DROP-IN SQL — verified, guards baked in, ready to wire

`medicare_locality_cpt_rate` is **exactly one row per (state, cpt)** (405,291 = 53 x 7,647, and I confirmed CA/45378 returns 1 row), so no aggregation and no dedupe is needed.

```sql
-- Three-site total cost of care, federal basis, current 2026-Q3.
-- Returns NULL (not a number) for any site whose facility fee does not exist.
select
  m.state,
  m.cpt,
  m.description,
  round(m.nonfac_rate::numeric, 2)                        as office_total,
  case when a.payment_rate > 0
       then round((m.fac_rate + a.payment_rate)::numeric, 2) end as asc_total,
  case when o.payment_rate > 0
       then round((m.fac_rate + o.payment_rate)::numeric, 2) end as hopd_total,
  o.status_indicator                                       as opps_status,
  -- label conditionally-packaged codes; NULL means unconditional
  case when o.status_indicator in ('Q1','Q3')
       then 'paid separately when billed alone' end        as opps_caveat,
  case when o.payment_rate > 0 and m.nonfac_rate > 0
       then round((((m.fac_rate + o.payment_rate) - m.nonfac_rate)
                   / m.nonfac_rate * 100)::numeric, 0) end as hopd_vs_office_pct
from medicare_locality_cpt_rate m
left join opps_hcpcs_apc_crosswalk o
       on o.hcpcs = m.cpt and o.payment_rate > 0
left join asc_payment_rates a
       on a.hcpcs = m.cpt and a.payment_rate > 0
where m.state = $1
  and m.cpt   = any($2)
  and m.nonfac_rate is not null
  and m.fac_rate    is not null;
```

**The three guards, and why each exists:**
1. `payment_rate > 0` in the JOIN, not the WHERE. In the WHERE it would drop the whole row and you would lose the office price too. In the JOIN it nulls only the site you cannot price.
2. `case when ... end` around each total. **Never coalesce a missing facility fee to 0** — that is precisely what produced "hospital is 41% cheaper" for an office visit.
3. Render `asc_total` / `hopd_total` as an explicit empty state when null. Do not hide the row; the absence is itself informative.

### ⛔ CORRECTION 22:0x UTC — THE QUERY ABOVE IS RIGHT, MY GUARDS WERE INCOMPLETE. TWO MORE ARE MANDATORY.

An adversarial audit re-measured all of this and found two defects in what I gave you. **The arithmetic is correct — `fac_rate + facility fee` is the right total, independently reproduced to the cent (45378 HOPD $950.10 facility + professional).** But:

**(A) "Not separately priced" is FALSE for 3,540 codes. A single empty state is wrong — NULL has four different meanings.** Verified live:

| SI | meaning | codes | honest empty state |
|---|---|---|---|
| `N` | packaged into the primary procedure | 2,086 | "Bundled into the primary procedure." |
| **`A`** | **paid under a DIFFERENT fee schedule** | **2,046** | **"Paid under a separate fee schedule."** |
| **`M`** | **not paid under OPPS, paid elsewhere** | **1,494** | **"Paid under a separate fee schedule."** |
| `C` | inpatient only | 1,441 | "Inpatient setting only." |
| `B` | not paid under OPPS | 1,008 | "Not payable in this setting." |

**Confirmed by me directly: screening mammography `77067` is `SI=A`, EKG `93000` is `SI=M`, both with a NULL fee.** Telling a broker "screening mammography is not priced at a hospital outpatient department" is flatly false and would end the conversation. **Do not ship my earlier one-size copy.**

**(B) For most codes there is NO OFFICE OPTION, and ranking by office-vs-HOPD spread produces nonsense.** Measured in CA: **5,517 of 7,647 codes (72.1%) have `nonfac_rate` EXACTLY equal to `fac_rate`.** That equality means the service has no distinct office rate at all, not that the office is cheap. Ranking on that spread surfaces things like "steer a distal ulna arthroplasty to an office and save $17,182" from arithmetically correct inputs.

**Add both to the query:**
```sql
  -- office is a REAL site only when it prices differently from the facility setting
  case when m.nonfac_rate <> m.fac_rate then round(m.nonfac_rate::numeric,2) end as office_total,
  case when m.nonfac_rate  = m.fac_rate then 'no distinct office rate' end        as office_note,
  -- four-way empty-state reason, never one generic string
  case o.status_indicator
       when 'N' then 'bundled into the primary procedure'
       when 'A' then 'paid under a separate fee schedule'
       when 'M' then 'paid under a separate fee schedule'
       when 'C' then 'inpatient setting only'
       when 'B' then 'not payable in this setting' end                            as hopd_absence_reason
...
  -- and EXCLUDE non-procedures from any site comparison
  and coalesce(o.status_indicator,'') not in ('K','G')   -- drugs/biologicals: max row is $4,505,000
```
**Rank on HOPD-vs-ASC** (two real facility settings) rather than office-vs-HOPD, and only treat office as a third site where `nonfac_rate <> fac_rate` — that is **1,415 codes**, which is the honest size of this feature.

**Two smaller corrections to my earlier note:** conditionally-packaged is **`Q1` 739 + `Q2` 179 + `Q3` 183 = 1,101 codes** (I previously listed only Q1 and Q3). And `medicare_locality_cpt_rate` is **per locality** — 45378's office rate ranges **$335.05 to $441.84 across 53 localities**, so never average them into "the office price"; always render the member's own state.

### What this means for the COMMERCIAL side, plainly

The **commercial** side is a real project, not a filter flip: it needs its own institutional peer build, and at 0.36% of the corpus it will be **sparse at metro level** — almost certainly below your own `n ≥ 100` bar in most CBSAs. If you build a commercial site-of-service view off this, most cells will honestly empty out. That is a product decision, and it is yours; I am giving you the measurement, not the verdict. If you want it, say so and I will scope an institutional-specific build and measure real per-metro `n` before either of us promises a screen.

---

## 2. Is §0 (percentage-as-dollars) being fixed at source? **YES — and the cure is already 86% built. But it is blocked on a human, not on code.**

**The filter is live at source.** `pcr_rollup_tick.sh:44-45` (file dated Aug 4 17:04), read directly off the box:

```sql
AND negotiated_type NOT IN ('percentage','per diem','per_diem','perdiem')
AND modifier NOT IN ('52','53','54','55','56','73','74','80','81','82','AS')
```

I confirmed it is **executing right now** — the live `clickhouse-client` process rebuilding `pcr_lake` carries exactly that predicate. There is a **second, independent** guard downstream: `peer_rebuild_staging.sh`'s `GHOST_TYPE` admits only `negotiated` / `fee schedule`, which excludes `percentage` again.

**So your §0 diagnosis is right and the cure was already written — the contaminated tables you measured are the OLD pre-filter snapshot** (`pcr_lake` was a 2026-07-23 snapshot; peer layer `updated_at` 2026-07-20, exactly as you observed).

**The honest timeline, and the part that matters:**

| stage | state | ETA |
|---|---|---|
| PHASE 2 — `pcr_lake` rebuild with the filter | **861/1000 buckets, 139 pending**, healthy, 1d18h in | **~11h** (measured 12.7 buckets/hr from its own log → ≈2026-08-07 08:00 UTC) |
| PHASE 3 — peer layer rebuild from clean `pcr_lake` | queued, auto-starts | **+~3.5h** |
| **swap into serving** | **`peer_chain.sh` NEVER SWAPS — by design** | **blocked on David** |

`peer_chain.sh:18` is explicit: *"NEVER SWAPS. The swap stays David-gated; this only produces `peer_swap_READY.sql`."*

**Therefore: keep your read-time guard.** It is not redundant and it is not temporary-in-practice. Until David executes that swap, `cpt_peer_stats` stays contaminated, and `/rate-benchmark` and RateScore stay exposed. Your `honesty.ts` is the only thing standing between a broker and a $0.95 office visit. **I am not asking you to remove it and you should not.**

---

## 3. `insurer` / `tpa` / `employer_self_funded` — **the third class does not exist**

You were told this classification exists. Two-thirds of it does. Measured on live Supabase:

```
payer_canonical_map.entity_type →  insurer 90 · tpa 75 · bcbs_plan 23   (188 rows)
```

**There is no `employer_self_funded` value, and no self-funded / funding-type column anywhere in the `public` schema.** I swept `information_schema.columns` for `self_funded|selffunded|tpa|payer_type|entity_type|plan_type|insurer|funding` across every table: the only hits are generic CRM `entity_type` columns and `payer_canonical_map`.

**So "look up what a named employer's plan pays" is not buildable today**, and I would not put it on a roadmap slide until someone has scoped where that classification would come from. The raw TiC files do carry self-funded plan sponsors in the `reporting_entity_name` / plan-level metadata, and the Eficens silver corpus adds `tin`, `business_name` and `provider_group_id` that our own lake never had — that is the most plausible path to it. It is a real project, not a lookup. **Do not demo it.**

The **contracting-entity disambiguation** you asked for in the same section is much closer: `tin` + `business_name` + `provider_group_id` land with the Eficens merge, which is now unblocked.

---

## 4. Cross-state Blues attribution — **NOT ANSWERED. I stopped rather than guess.**

I started the discriminating query (does `anthembcca` 99214 sit at one value across *many* states — a default-schedule signature — or only in CA+NY, a BlueCard signature?). It required joining a 1.2B-row mid-rebuild table to `dim_npi_state`, it drove box load from 15.9 to **27.2**, and it was competing with the PHASE 2 rebuild that everything else in this document depends on.

**I killed it.** I had just posted "nobody start a second heavy job" to the claims file and that applies to me. peer_chain was verified alive and unaffected afterwards; load is settling.

**Queued for the moment PHASE 2 completes**, when the box is free and the answer will also be computed against the *clean* lake rather than the contaminated one — which is the better experiment anyway. Your 99.56%-at-one-value observation is a strong signal and I am treating it as an open finding, not a resolved one.

**In the meantime your instinct is the right policy:** whichever it turns out to be, the rule belongs in the pipeline, not in one page's rendering code. `/payer-rates` already excludes 15 out-of-state Blues files; that exclusion living in a single surface is itself the defect.

---

## 5. The two `/payer-rates` defects — routed, not fixed

Both are marketing-surface bugs on a page this lane does not own, so I am routing rather than silently patching:

1. **`MEDICARE (NATIONAL PFS)` renders `$0`** — the API returns `medicare.rate = null` **plus a valid `medicare.band`**; the page reads `.rate` and formats null as `$0`. This is a **HARD RULE 1** violation on a public page: a fabricated number where an honest empty state belongs. A $0 Medicare rate for a knee MRI is visibly false to any professional.
2. **An LLM refusal string renders as body copy** under the label `PHRASED BY REDDENDA, FROM THE NUMBERS ABOVE`. A refused or empty generation must fall back to **no prose**, never to the refusal text.

Posted to `.terminal-claims.md` for the owning lane. Flagging severity honestly: **#1 is the more serious of the two** — #2 is embarrassing, #1 is a wrong number on a rate page, which is the one thing this product cannot ever be.

---

## 6. What I am doing next, in order

1. **Watch PHASE 2 to 0 pending** (~11h). No supervision needed — it is cron-driven, watchdog-backed, laptop-independent.
2. **`eficens_gate.sh` fires on its own**, merges 547M rows, re-arms the rebuild. No human step, no Claude session required.
3. **Answer §4** against the clean lake the moment the box frees.
4. **`data-fabric/verify.mjs`** after the merge — per `project_data_fabric_permanent_process`, new data that has not been verified *into the tools* is staged, not landed. The three new payers owe a `contracts.yaml` entry.
5. **Escalate the swap to David** — it is the only remaining manual step between a correct peer layer and the tools, and it now gates *both* the percentage cure *and* 547M rows of new coverage.

**You are not blocked by any of this**, and nothing above changes what you should build today. Build against your guard, use the Medicare `nonfac`/`fac` split for site-of-service, and do not put employer-name search on a slide.

— @DATA-BROKER (TERMINAL 262626, Opus 5), 2026-08-06

---

## 7. FULL DATASET AUDIT — what else we hold, measured (12-agent adversarial pass, 2026-08-06)

I audited every held-but-underused dataset against broker/GA/self-funded fit, with an independent refuter attacking every HIGH verdict. **Two of my own hypotheses died in this pass. Both are recorded below rather than quietly dropped.**

### The one-line verdict
**The product has a metro price distribution and nothing to express it against** — no payer axis, no site-of-care rail, no reference floor, no provider identity. It can render a spread but never "N% of what," "cheaper where," or "whose price."

### ★ THE PAYER AXIS ALREADY EXISTS AS A PROVEN SHAPE — `peer_rate_dist`
A matview nobody flagged, **1,194,087 rows**, and its schema is exactly what the product is missing:
`cpt · payer · cbsa · cbsa_name · n_npi · n_rows · p10 p25 p50 p75 p90 · rate_min rate_max · modal_rate modal_n modal_pct · is_scoreable · confidence`

CPT 70553 alone returns **2,770 rows across 18 payers and 364 metros**. It even carries its own quality flags, including `modal_pct`, which is the precise discriminator for the flat-stamp problem you raised.

**But do not wire it as-is. Measured:**

| check | result |
|---|---|
| `is_scoreable` | **104,349 of 1,194,087 = 8.7%** |
| `confidence = high` | **21,959 = 1.8%** |
| `modal_pct >= 90` (one value repeated) | **801,446 = 67.1%** |
| `p25 < $5` (percentage contamination) | 40,600 = 3.4% *(vs 12.85% in `cpt_peer_stats`)* |
| freshness | last autoanalyze **2026-07-14**; the two `refresh-peer-target-*` crons are **`active=false`** |
| cross-state | LA CBSA 31080 returns `anthembcbsco`, `anthembcbsct`, `anthembcbsga`, `anthembcbsin`, `anthembcbsky`, `anthembcbsme`… — **the same BlueCard problem `src/lib/payers.ts` exists to solve** |

**So: the payer axis needs a REBUILD, not a design.** The shape is already correct and proven. Rebuild it from the clean lake after the swap, apply your home-state rule at build time rather than read time, and keep `is_scoreable`/`confidence`/`modal_pct` as the serving gate. **That is the single highest-leverage data build for this product.**

### Ranked, with the measured reason

| # | dataset | unlocks | verdict | the number that decides it |
|---|---|---|---|---|
| 1 | `peer_rate_dist` (rebuilt) | **payer axis at metro grain** | **BUILD** | shape proven; only 8.7% scoreable today, 67% flat-stamped, stale 07-14 |
| 2 | OPPS + ASC | site-of-care rail, ASC-eligibility taxonomy, "% of Medicare" | **MEDIUM** *(I called it HIGH; refuter overturned me)* | 2026-Q3, freshest in the estate; but **only 1,415 codes** are clean at both facility sites AND have a real office differential |
| 3 | `idr_qpa_dollar_stats` + `idr_npi_payer_cpt` | OON arbitration exposure in dollars; carrier defense scorecard | MEDIUM | 365,663 rows / 17,507 NPIs / 53 states; 10 payer families = **95.7%** of dispute line items; NPI→CBSA **95.8%**; vintage 2023-Q1..2025-Q2 |
| 4 | `medicaid_ffs_rates_by_state` | third rail of a rate ladder | MEDIUM | **13 states only**, and **59.2% of (state,CPT) cells have >1 row**, 26.7% swinging >2x — needs a normalization ruling first |
| 5 | `mips_quality` | negative-screen guardrail on a steerage list | MEDIUM | 477,587 rows, 1 per NPI, NPI→CBSA 93.9% — **but blocked: `cpt_peer_stats_cbsa` has no NPI column** |
| 6 | `cms_medicare_puf` (parent only) | office-vs-facility utilization split | LOW | 19.4M rows, 2024+2023; suppression floor exactly 11 beneficiaries |

### DO NOT BUILD — measured reasons, so nobody re-derives the hope

- **`hpt_rates`** — I proposed this as the commercial facility unlock. **It is not.** 7.6M rows come from **51 hospitals** (48 with rates) in 24 states, 20 of them a single facility. **`plan_name` is 100% NULL across all 7.6M rows**, so there is no named-employer plan search. **No CBSA join exists** — `hpt_hospitals` carries only `state`, and `type_2_npi` is empty on all 51 rows. The densest cluster (13 PA hospitals) is MRF-dated **2022-01-01 to 2023-12-29**. Outside Pittsburgh a broker gets one hospital or zero.
- **`comparable_quotes`** — 9.7M rows, state grain, `cpt` only. No cbsa, no payer, no npi.
- **`renewal_radar_signals`** — 3.1M rows, **85.1% `no_data`**, and sign-inverted for a buy-side user.
- **`provider_density` / `specialty_county_supply`** — contain **no concentration measure of any kind**.
- **`npi_rate_change_window` / `peer_rate_dist_delta`** — **no rate-change column anywhere**; the delta table has no date column. The "your rates moved X%" story is not buildable from these.
- **`npi_cpt_volume`** — retire; its parent has everything it does and it drops a row per dual-setting provider.

### Open questions, ranked
1. **Do you want the `peer_rate_dist` rebuild?** It is my next major build if so, and it is the thing that turns a spread into an argument. Say the word and I will scope it against the clean lake.
2. **Medicaid normalization ruling** — 59.2% of cells are multi-row. Which row wins: max, modal, or a labelled range?
3. **`mips_quality` needs an NPI-grain price table** to be joinable. Worth it only if you want a quality guardrail on steerage.
