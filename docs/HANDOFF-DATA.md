# DATA HANDOFF → TERMINAL 262626 (DATA BROKER)

**From:** @BROKER-SUITE lane (Opus 5) · 2026-08-06
**Subject:** Data required for the Reddenda broker / GA / self-funded product, plus one live Rule 1 breach found while scoping it
**Status of my lane:** I am building the broker surface at `/Users/user/reddenda-broker`. I claimed read-only on the peer layer in `.terminal-claims.md` and I am **not** editing any pipeline. Everything below is yours.

---

## 0. READ THIS FIRST — the one item that is live and wrong

**Percentage-type negotiated rates are being stored as dollar amounts.** This is in the served peer layer right now, on public surfaces.

### Evidence

`payer_cpt_state_stats`, state NY, CPT 99214:

| payer | n | p25 | p50 | p75 | modal_val | modal_share | rmin |
|---|---|---|---|---|---|---|---|
| `anthembcbsga` | 89 | **0.95** | **0.95** | **0.95** | **0.95** | 74.2% | 0.92 |
| `anthembcbsct` | 93 | **1.00** | **1.00** | 86.85 | **1.00** | 57.0% | 0.97 |
| `uhc_national` | 1,379 | 83.86 | 128.43 | 179.99 | 55.00 | 7.9% | 43.31 |

A 99214 does not have a negotiated allowed amount of ninety-five cents. `0.95` is **95%**. `1.00` is **100%**. These are `negotiated_type: "percentage"` rows from the TiC files landing in the dollar column and flowing straight into the percentile computation.

### Blast radius (measured, not estimated)

**Per payer**, cells where the *median* is under $5:

| payer | bad cells | total cells | % |
|---|---|---|---|
| `anthembcbsct` | 14,502 | 160,365 | 9.0% |
| `anthembcbsky` | 19,345 | 228,141 | 8.5% |
| `anthembcca` | 8,269 | 100,176 | 8.3% |
| `anthembcbsin` | 17,806 | 216,852 | 8.2% |
| `anthembcbsmo` | 10,287 | 125,141 | 8.2% |
| `anthembcbswi` | 17,247 | 224,991 | 7.7% |
| `anthembcbsga` | 18,967 | 256,507 | 7.4% |
| `empirebcbs` | 15,630 | 224,167 | 7.0% |
| `anthembcbsoh` | 13,900 | 228,743 | 6.1% |
| `aetna_national` | 3,974 | 65,090 | 6.1% |
| `anthembcbsnh` | 9,357 | 165,382 | 5.7% |
| `anthembcbsme` | 6,966 | 138,000 | 5.0% |
| `anthembcbsva` | 5,566 | 112,613 | 4.9% |
| `cigna_national` | 1,098 | 22,780 | 4.8% |
| `anthembcbsnv` | 6,666 | 164,033 | 4.1% |
| `anthembcbsco` | 6,233 | 165,744 | 3.8% |
| `highmark_pa` | 584 | 17,789 | 3.3% |
| `ibx_pa` | 221 | 7,712 | 2.9% |
| `uhc_national` | 322 | 67,258 | 0.5% |

Global minimum across the Anthem/Elevance family, Aetna, UHC, Highmark: **$0.01**.

**In the served peer layer** (this is what customers actually see):

| layer | cells | p25 < $5 | % | p50 < $5 | bad p25 with n ≥ 1,000 |
|---|---|---|---|---|---|
| `cpt_peer_stats` (state) | 1,399,830 | **179,831** | **12.85%** | 134,510 | **85,624** |
| `cpt_peer_stats_cbsa` (metro) | 12,677,477 | **1,380,917** | **10.89%** | 1,074,935 | not measured |

**Roughly one in eight published benchmarks carries a contaminated lower tail, and one in ten has a contaminated median.** The 85,624 figure matters most: those are high-volume cells, so this is not thin-sample noise that a sample floor would catch.

### Where it surfaces today

- `reddenda.com/rate-benchmark` → `/api/rate-benchmark`. Reproduce: `?cpt=99214&state=NY` returns **p25 $0.97, p50 $35.96** over n=228,643. A real New York office-visit median is not $36.
- `cpt_peer_stats` is the comparison basis for **RateScore**. Every provider scored against a contaminated cell is scored against a number that is too low, which biases the score *upward* and makes the provider look better paid than they are. That is the opposite of the product's purpose.

### The fix (yours to make, not mine)

1. **At ingest**, partition on `negotiated_type`. TiC `in_network` rate objects carry `negotiated_type` ∈ `negotiated | derived | fee schedule | percentage | per diem`. Only dollar-denominated types belong in a dollar column. `percentage` rows are a *multiplier* and need either their own column with the basis recorded, or exclusion.
2. **Also check `per diem` and `bundle`/case rates**, which are dollar-valued but not per-CPT comparable, and `billing_class` (`professional` vs `institutional`), which should not be pooled into one distribution.
3. **Add a gate check** the existing 6-check gate does not have: *no served percentile below a per-CPT-family plausibility floor*. A CPT-level floor keyed off a fraction of the Medicare non-facility rate would catch this whole class. It would have caught it on the first publish.
4. **Rebuild** `cpt_peer_stats`, `cpt_peer_stats_cbsa`, `cpt_peer_stats_specialty*`, `cpt_peer_stats_broad`, and `payer_cpt_state_stats` after the filter lands.

### What I am doing in the meantime

The broker product applies a **read-time honesty filter** and will never render a contaminated cell. Policy is in `src/lib/honesty.ts` in my repo. It rejects any cell where `p25 < 5`, `p50 < 5`, or percentiles are out of order, and serves an honest empty state instead of a number. This is a **guard, not a fix** — per the estate's own standing rule, reader guards are a temporary belt and the cure belongs at source.

---

## 1. What the broker product needs from data (priority order)

### P0 — already have it, just needs the cleanup above

| need | source | state |
|---|---|---|
| Metro-level price distributions | `cpt_peer_stats_cbsa` (cbsa, cpt, p25, p50, p75, p90, n) — 12.68M rows, **917 metros** | EXISTS. Contaminated per §0. |
| State fallback | `cpt_peer_stats` — 1.4M rows | EXISTS. Contaminated per §0. |
| Per-payer breakdown | `payer_cpt_state_stats` (payer, state, cpt, p25–p95, rmin, rmax, modal_val, modal_share) — 2.79M rows | EXISTS. Contaminated per §0. |
| Medicare anchor | `medicare_locality_cpt_rate` (state, cpt, **nonfac_rate**, **fac_rate**, localized_rate, description) — 405K rows | EXISTS, looks healthy |
| Metro identity | `npi_cbsa` (npi, cbsa, cbsa_name) — 8.77M rows | EXISTS. I extracted a 400-metro reference list to `data/metros.json`. |
| Freshness / provenance | `data_manifest` (metric, built_at, row_count, checks_passed, coverage_through, coverage_label) | EXISTS and is good. The `coverage_label` text is excellent and I am surfacing it verbatim. |

Peer layer `updated_at` is **2026-07-20**. That is the freshness date I display.

### P1 — needed, do not have, blocks the highest-value broker tool

**Site of service.** The single most valuable thing to a broker or a self-funded employer is: *same procedure, hospital outpatient versus freestanding, in my metro*. Employers move real money on this and it is the only lever a 200-life group actually controls.

To build it I need commercial rates separable by place of service. Specifically:
- `billing_class` (`professional` | `institutional`) preserved from the TiC files through to the peer layer, **not pooled**
- ideally `place_of_service` codes where the files carry them
- or, as a proxy, NPI entity type (1 = individual, 2 = organization) plus taxonomy, joined through `nppes_provider_enrich`

`medicare_locality_cpt_rate` already carries `nonfac_rate` and `fac_rate`, so the **Medicare** side of the site-of-service story is available today. The commercial side is the gap.

**Please answer this one question first, before any other P1 work: does the raw TiC ingest preserve `billing_class`, and can it be projected to the peer layer?** Yes / no / partial changes what I build.

### P2 — high value, later

| need | why | note |
|---|---|---|
| Self-funded employer plans searchable **by name** | "Look up what a named employer's plan pays" is the demo moment that makes the room gasp. Genuinely nothing else on the market does it. | Entity classification `insurer` / `tpa` / `employer_self_funded` reportedly exists. I need to know where it lives, how many entities carry each class, and whether an employer name search is possible. |
| Contracting-entity disambiguation under one brand | "Anthem" is many entities that pay differently. Brokers do not know this and it is our sharpest teaching point. | Partly visible in `payer_cpt_state_stats` already (`anthembcbsga` vs `anthembcbsct` vs `anthembcca`). Needs a clean brand → entity → market mapping. |
| Facility identity | Naming *where* the cheap site is turns insight into action | Currently we can show the spread but not who sits where in it |
| County or ZIP granularity below CBSA | Large metros like NY (n=596,800 on one CPT) can support finer cuts | CBSA is good enough for v1 |

### Deliberately NOT needed

Claims, utilization, member data, PHI of any kind. This product is price-only and says so plainly. Do not source any of it for this lane.

---

## 2. Cross-check I could not run

**Cross-state entity attribution looks wrong.** In NY for 99214: `anthembcca` (Anthem Blue Cross **California**) has 229 rows, 99.56% of them at exactly $115.00, rmin $115.00, rmax $135.13. Also present in NY: `anthembcbsoh`, `anthembcbsmo`, `anthembcbsin`, `bcbstx`, `bcbsil`, `bcbsok`, `bcbsnm`, `bcbsmt`, `florida_blue`, `bcbst_tn` — each with a high modal share at a single value.

Two competing explanations and I could not separate them:
1. **Legitimate BlueCard.** A member on an out-of-state Blues plan treated in NY. `/payer-rates` already excludes these from its per-payer view with the note *"15 out-of-state BlueCross BlueShield files carrying CA providers via BlueCard were excluded — they are not CA plans."* If that exclusion exists in one surface it should exist in all of them.
2. **Attribution error.** A national default fee schedule being stamped onto every state.

The 99.56%-at-one-value signature leans toward a default schedule, not a real negotiated book. **Worth a look.** Whichever it is, the *rule* should be consistent everywhere rather than living in one page's rendering code.

---

## 3. Two live defects on `reddenda.com/payer-rates` (marketing lane owns the page, flagging for routing)

1. **`MEDICARE (NATIONAL PFS)` renders `$0`** on every lookup. Confirmed CA, TX, FL. The API returns `medicare.rate = null` **plus a valid `medicare.band {low, high}`** and a `basis_note`, because with no ZIP input the scope is `state_band`. The page reads `.rate`, gets null, prints `$0`. A $0 Medicare rate for a knee MRI is visibly false to any professional.
2. **An LLM refusal renders as body copy:** *"I cannot complete this request because two of the three payer figures are missing (Anthem Blue Cross and Centene/Ambetter show no median rates), and without complete data I cannot identify which payer pays most versus least."* — under the label `PHRASED BY REDDENDA, FROM THE NUMBERS ABOVE`. An empty or refused generation must fall back to no prose, never to the refusal text.

---

## 4. Verified-good reference values

Measured live 2026-08-06 through the public API and confirmed against the tables. Safe to use in copy, demos and tests.

**State level**

| CPT | ST | p25 | p50 | p75 | n | % of Medicare |
|---|---|---|---|---|---|---|
| 70553 MRI brain w/ + w/o contrast | CA | $258 | $589 | $1,309 | 313,579 | 186% |
| 73721 MRI knee w/o contrast | CA | $154 | $360 | $762 | 295,270 | 176% |
| 29881 knee arthroscopy | CA | $671 | $911 | $2,113 | 170,171 | 177% |
| 99214 office visit est. | TX | $93 | $115 | $149 | 32,365 | 85% |

**Metro level, CPT 70553** — the reason metro beats state

| metro | CBSA | p25 | p50 | p75 | p90 |
|---|---|---|---|---|---|
| Los Angeles | 31080 | $187 | $498 | $1,095 | $1,605 |
| Chicago | 16980 | $260 | $566 | $879 | $1,126 |
| New York | 35620 | $278 | $424 | $636 | $1,301 |
| Atlanta | 12060 | $225 | $362 | $645 | $1,058 |
| Houston | 26420 | $138 | $277 | $525 | $920 |

**Do not use** `99214` in `NY` (contaminated, §0) or `27447` (returns a null description).

**Broker basket coverage**, 39 CPTs × 913 metros = 29,387 cells:
- 1,103 (3.8%) percentage-contaminated → reject
- 27,494 (93.6%) pass at n ≥ 30
- 21,366 (72.7%) pass at n ≥ 100
- 11,477 (39.1%) pass at n ≥ 500

Thin sample in small metros is the main coverage limit, not contamination. My serving policy: **n ≥ 500 → metro, full confidence · n ≥ 100 → metro with a sample note · below that → fall back to state with an explicit label · nothing plausible → honest empty state, never a number.**

---

## 5. What I need back from you, ranked

1. **Answer the `billing_class` question in §1 P1.** It is the single biggest fork in my product scope.
2. **Confirm whether §0 is being fixed at source, and roughly when.** My read-time guard protects the broker surface but not `/rate-benchmark`, not RateScore, and not any provider-facing number.
3. **Tell me where the `insurer` / `tpa` / `employer_self_funded` classification lives** and whether an employer-name search is possible today.
4. **Rule on the cross-state Blues attribution in §2**, and make whatever rule you pick consistent across every surface rather than per-page.
5. **Route the two `/payer-rates` defects in §3** to whoever owns that page.

I am not blocked on any of these. I am building against the read-time guard and will swap to clean tables the moment they exist.

— @BROKER-SUITE lane (Opus 5), 2026-08-06
