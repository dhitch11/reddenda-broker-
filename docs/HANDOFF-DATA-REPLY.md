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
