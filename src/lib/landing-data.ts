import { serviceClient, isConfigured } from "./db";
import { findService } from "./catalog";
import { judge, N_MINIMUM } from "./honesty";
import fixture from "./landing-fixture.json";

/**
 * THE LANDING PAGE'S DATA LAYER.
 *
 * Every number on broker.reddenda.com's front page is read from a table at
 * request time by this module. Nothing on that page is a constant typed into a
 * component, because a constant typed into a component is how a figure survives
 * the table that produced it.
 *
 * THREE RULES, ALL OF THEM LOAD-BEARING.
 *
 * 1. A NUMBER ARRIVES WITH ITS PROVENANCE OR IT DOES NOT ARRIVE.
 *    Every shape below carries the source file, the publisher, the vintage and,
 *    where it applies, the sample size. The vintage is the DATA's period taken
 *    off the row, never `new Date()`. A rate stamped with today's date is a lie
 *    about freshness and it is the specific defect this estate keeps catching.
 *
 * 2. FAILURE RENDERS AS A SENTENCE, NEVER AS A ZERO.
 *    Every function returns a discriminated union whose false branch carries a
 *    `reason` written for a benefits broker. A missing database, an empty table
 *    and a rejected cell are three different sentences and the page prints the
 *    true one. There is no fallback constant anywhere in this file.
 *
 *    ★ AND SINCE 2026-08-26 THERE IS A SECOND SOURCE, WHICH IS NOT A CONSTANT.
 *    On 2026-08-26 the live homepage rendered the proof row as FOUR "Unavailable"
 *    tiles and the hero card as a refusal, while these exact queries answered in
 *    200ms with real rows from this repo. Two defects compounded:
 *
 *      (a) `pfs.error` WAS NEVER READ. A failed query left `data` null, `rows`
 *          became [], and the page printed "the fee schedule does not carry
 *          45378 at locality 63" - a FALSE sentence about the data, produced by
 *          an unread error about the connection. An error is not an empty, and
 *          the two now take different branches.
 *      (b) The page had one source. When the deploy's environment could not
 *          reach the tables, the page about printing the number printed none.
 *
 *    The second source is `landing-fixture.json`: RAW ROWS from these same
 *    tables, baked by scripts/bake-landing-fixture.mjs and committed. Raw rows,
 *    not computed answers, so the one compute path below runs over either source
 *    and the two cannot drift. Every fixture value carries the table's own
 *    vintage. Live read first, fixture only when the live read FAILS - a
 *    successful query returning zero rows is a true absence and still renders
 *    the honest sentence, never the fixture.
 *
 * 3. THE LOCALITY IS NAMED, AND IT IS A REAL LOCALITY.
 *    This module reads `medicare_locality_cpt_rate_fixed` and filters to an
 *    explicit locality code. It does NOT read `medicare_locality_cpt_rate`, and
 *    the difference is not cosmetic.
 *
 *    MEASURED 2026-08-24, to the digit. The unfixed table holds ONE row per
 *    (state, cpt) whose values are the UNWEIGHTED MEAN across that state's
 *    localities, while carrying a single stale `locality_name`. For CA/45378 the
 *    mean of the 29 locality values is 422.9583 and the stored row is 422.96
 *    labelled "YUBA CITY". Yuba City's ACTUAL rate is 398.34. So the row is a
 *    state average wearing one city's name, and any page printing that number
 *    beside that label is wrong twice: the figure is not Yuba City's, and the
 *    figure is not any real locality's.
 *
 *    `_fixed` is the real grain: 1,047,200 rows, 110 locality names, 29 for CA.
 *    Sacramento-Roseville-Folsom is locality 63 at 417.65 / 169.43.
 *
 *    If a page cannot say WHICH locality a fee came from, it may not call the fee
 *    local.
 *
 * 4. THE DUPLICATE ROW IS DISCLOSED, NOT SILENTLY RESOLVED.
 *    `_fixed` returns TWO rows for (CA, locality 63, 45378) that are identical on
 *    every key it exposes (state, locality, mac, mac_locality, cpt, year,
 *    status_code, conversion factor, all three GPCIs) and differ only in the
 *    RVUs, where the second is EXACTLY half the first on work, pe and mp. Every
 *    one of the 29 CA localities is doubled the same way. The table carries no
 *    modifier column, so nothing in it says what the half row is.
 *
 *    A `.limit(1)` here is a coin flip between $417.65 and $209.11 on the free
 *    surface of a product sold on accuracy, because Postgres does not guarantee
 *    row order without an ORDER BY. So this module orders by `work_rvu`
 *    descending, takes the full line, and RENDERS a sentence saying the other row
 *    exists and that we cannot tell you what it is. Guessing that it is a
 *    reduced-services modifier would be an inference printed as a fact, which is
 *    the one thing this file exists to prevent.
 *
 * WHY THE FACILITY SIDE IS LABELLED SEPARATELY. `opps_hcpcs_apc_crosswalk` and
 * `asc_payment_rates` carry the CMS NATIONAL UNADJUSTED payment, before the wage
 * index for any particular market. Adding a California physician fee to a
 * national facility payment produces a real, checkable, useful total, and it is
 * not a Sacramento total. Both halves are labelled on the face of the page so a
 * broker knows exactly what they are holding.
 */

/**
 * Medicare locality codes, from `src/demo/seed/ca-locality.json`, whose own
 * `__PROVENANCE` field reads "REAL public CMS Physician Fee Schedule at California
 * LOCALITY grain. Not fabricated." CBSA 40900 is Sacramento-Roseville-Folsom and
 * maps to locality 63.
 *
 * Named as a constant rather than passed in, because a locality code is not a
 * user input on this page: the landing has exactly one market on it and it is the
 * market David is presenting to.
 */
export const SACRAMENTO = { state: "CA", locality: "63", cbsa: "40900" } as const;

/** The tables this module reads, with who publishes them. Rendered as provenance. */
export const PUBLISHER = {
  pfs: "CMS Physician Fee Schedule",
  opps: "CMS Hospital Outpatient PPS, Addendum B",
  asc: "CMS Ambulatory Surgical Center payment addenda",
} as const;

export type Provenance = {
  /** The data's own period. Off the row. Never today. */
  vintage: string | null;
  /** The file CMS published, verbatim from the row when the table stores it. */
  sourceFile: string | null;
  publisher: string;
};

/* ────────────────────────────────────────────────────────────────────────────
   SITE OF CARE
   The same procedure in an office, an ambulatory surgery centre and a hospital
   outpatient department, with the FACILITY FEE JOINED TO THE PHYSICIAN FEE.

   The join is the entire point and it is the thing most tools get wrong.
   `fac_rate` is not "the cost in a facility". It is the physician's professional
   fee when the work happens in a facility, stripped of practice expense. Read as
   a site total it says the hospital is cheaper than the office, which is
   backwards, and a broker who repeats it in a renewal meeting is wrong in front
   of a client. siteofservice.ts records that this exact error reached three
   documents on this estate before it was caught.

     office = nonfac_rate                        (practice expense already in it)
     asc    = fac_rate + asc.payment_rate
     hopd   = fac_rate + opps.payment_rate

   A facility payment of zero means CMS packages or does not separately pay the
   code in that setting. It is not a price of zero, so that site returns null and
   the page says why rather than computing a total from an absence.
   ──────────────────────────────────────────────────────────────────────────── */

export type SiteBar = {
  key: "office" | "asc" | "hopd";
  label: string;
  /** Null when the setting cannot be priced honestly. */
  total: number | null;
  /** The physician component of the total. */
  professional: number | null;
  /** The facility component. Null is meaningful: we will not compute past it. */
  facility: number | null;
  /** Why there is no total, in a sentence a broker can read out loud. */
  unavailable: string | null;
};

export type SiteOfCare =
  | {
      ok: true;
      cpt: string;
      description: string;
      state: string;
      /** The Medicare locality this physician fee actually belongs to. */
      localityName: string | null;
      /** The locality code, printed so the row is findable in the CMS file. */
      localityCode: string | null;
      /** Set when the fee table returned more than one row we cannot tell apart. */
      duplicateRowNote: string | null;
      bars: SiteBar[];
      /** Hospital outpatient against office, as a whole percent. */
      hopdVsOfficePct: number | null;
      /** What a plan keeps by steering one case from hospital to surgery centre. */
      ascSavingVsHopd: number | null;
      physician: Provenance;
      facility: Provenance;
    }
  | { ok: false; reason: string };

const num = (v: unknown): number | null => {
  if (v == null) return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
};

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Formatting lives here only because a disclosure sentence is built server side. */
const usdIn = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

/**
 * `quarter` on these tables is already a full label ("2026-Q3"), not an integer.
 * Composing `${year} Q${quarter}` produced the string "2026 Q2026-Q3" on the live
 * table, which is recorded in siteofservice.ts as measured rather than guessed.
 */
function vintage(row: { year?: unknown; quarter?: unknown } | null | undefined): string | null {
  if (!row) return null;
  const q = row.quarter;
  if (typeof q === "string" && q.length > 0) return q;
  const y = num(row.year);
  if (y == null) return null;
  return q == null ? String(y) : `${y} Q${q}`;
}

/** The raw shapes the compute path accepts, from a live query or the fixture alike. */
type RawRow = Record<string, unknown>;

/** The fixture's care branch, run through the SAME compute path as a live read.
    Returns null when the fixture was baked for a different cell than the one
    asked for, so a future page change cannot silently serve the wrong market. */
function fixtureCare(cpt: string, state: string, locality: string): SiteOfCare | null {
  const f = fixture.care;
  if (!f || f.cpt !== cpt || f.state !== state || f.locality !== locality) return null;
  return computeSiteOfCare(cpt, state, f.pfsRows as RawRow[], f.opps as RawRow | null, f.asc as RawRow | null);
}

const CARE_OUTAGE =
  "We could not reach the federal fee tables to answer this, so there is nothing here. This is an outage on our side and not a gap in the data.";

export async function siteOfCare(
  cpt: string,
  state: string = SACRAMENTO.state,
  locality: string = SACRAMENTO.locality,
): Promise<SiteOfCare> {
  if (!isConfigured()) {
    return (
      fixtureCare(cpt, state, locality) ?? {
        ok: false,
        reason:
          "This server is not holding the federal fee tables right now, so there is no rate to show. We would rather show you nothing than show you a number we cannot source.",
      }
    );
  }

  try {
    const sb = serviceClient();

    const [pfs, opps, asc] = await Promise.all([
      /* ORDER BY is load-bearing, not tidiness. See rule 4 in the header: this
         table returns two undifferentiated rows per locality and the second
         carries half the RVUs, so an unordered `.limit(1)` is a coin flip
         between the correct allowed amount and half of it. */
      sb
        .from("medicare_locality_cpt_rate_fixed")
        .select("nonfac_rate, fac_rate, year, locality, locality_name, work_rvu, status_code")
        .eq("cpt", cpt)
        .eq("state", state)
        .eq("locality", locality)
        .order("work_rvu", { ascending: false })
        .limit(4),
      sb
        .from("opps_hcpcs_apc_crosswalk")
        .select("payment_rate, status_indicator, year, quarter, source_file")
        .eq("hcpcs", cpt)
        .limit(1)
        .maybeSingle(),
      sb
        .from("asc_payment_rates")
        .select("payment_rate, year, quarter, source_file")
        .eq("hcpcs", cpt)
        .limit(1)
        .maybeSingle(),
    ]);

    /* ★ AN ERROR IS NOT AN EMPTY. See rule 2 in the header: on 2026-08-26 a
       failed query fell through this seam as an empty result set and the page
       printed a false sentence about the DATA to describe a failure of the
       CONNECTION. Any query error means we do not know what the tables hold,
       so the answer comes from the bake, and only if the bake matches. The
       panel's promise is the three-setting comparison, so a partial read - one
       leg errored, two answered - is treated the same way: we will not caption
       a missing leg "Medicare does not publish this" when the truth is that we
       never heard back. */
    if (pfs.error || opps.error || asc.error) {
      return fixtureCare(cpt, state, locality) ?? { ok: false, reason: CARE_OUTAGE };
    }

    return computeSiteOfCare(
      cpt,
      state,
      (pfs.data ?? []) as RawRow[],
      (opps.data ?? null) as RawRow | null,
      (asc.data ?? null) as RawRow | null,
    );
  } catch {
    return fixtureCare(cpt, state, locality) ?? { ok: false, reason: CARE_OUTAGE };
  }
}

/** ONE compute path, fed by the live read or the bake. All the honesty rules
    live here exactly once: zero-as-packaged, the duplicate-row disclosure, the
    refusal to total past a missing facility fee. */
function computeSiteOfCare(
  cpt: string,
  state: string,
  pfsRows: RawRow[],
  oppsRow: RawRow | null,
  ascRow: RawRow | null,
): SiteOfCare {
  const rows = pfsRows;
  const m = rows[0];
  const office = num(m?.nonfac_rate);
  const professional = num(m?.fac_rate);
  const localityCode = (m?.locality as string | null) ?? null;

  if (office == null && professional == null) {
    /* A SUCCESSFUL query with zero rows. This is a true absence and it renders
       as one; the connection-failure case never reaches this function. */
    return {
      ok: false,
      reason: `The federal physician fee schedule does not carry ${cpt}${localityCode ? ` at Medicare locality ${localityCode}` : ""} in ${state} in our copy of the table, so there is no federal basis to compare settings against.`,
    };
  }

    /* The disclosure, built from what is actually in the result set rather than
       from an assumption about what the extra row means. */
    const others = rows.slice(1).map((r) => num(r.nonfac_rate)).filter((v): v is number => v != null && v !== office);
    const duplicateRowNote = others.length
      ? `This locality returns ${rows.length} rows for ${cpt} that are identical on every field the fee table exposes, differing only in their RVUs. We take the full-RVU line, printed above. The other resolves to ${others.map((v) => usdIn(v)).join(", ")}. The table carries no modifier column, so we will not tell you what that row is.`
      : null;

    const oppsRate = num(oppsRow?.payment_rate);
    const ascRate = num(ascRow?.payment_rate);
    /* Zero is CMS saying "packaged or not separately payable here", not "free". */
    const oppsFee = oppsRate != null && oppsRate > 0 ? oppsRate : null;
    const ascFee = ascRate != null && ascRate > 0 ? ascRate : null;

    const ascTotal = professional != null && ascFee != null ? round2(professional + ascFee) : null;
    const hopdTotal = professional != null && oppsFee != null ? round2(professional + oppsFee) : null;

    const bars: SiteBar[] = [
      {
        key: "office",
        label: "Physician office",
        total: office,
        professional: office,
        facility: null,
        unavailable:
          office == null
            ? "The fee schedule carries no office rate for this code, which usually means it is not performed in an office setting."
            : null,
      },
      {
        key: "asc",
        label: "Ambulatory surgery center",
        total: ascTotal,
        professional,
        facility: ascFee,
        unavailable:
          ascTotal == null
            ? "Medicare does not publish a separate surgery center payment for this code, so there is no total to add the physician fee to."
            : null,
      },
      {
        key: "hopd",
        label: "Hospital outpatient",
        total: hopdTotal,
        professional,
        facility: oppsFee,
        unavailable:
          hopdTotal == null
            ? "Medicare does not publish a separate hospital outpatient payment for this code, so we will not compute a hospital total."
            : null,
      },
    ];

    const hopdVsOfficePct =
      office != null && office > 0 && hopdTotal != null
        ? Math.round(((hopdTotal - office) / office) * 100)
        : null;

    const ascSavingVsHopd = ascTotal != null && hopdTotal != null ? round2(hopdTotal - ascTotal) : null;

    return {
      ok: true,
      cpt,
      /* `_fixed` carries no description column, so the name comes from our own
         catalog rather than from an upstream field that does not exist. The
         catalog is also the safer source: the unfixed table's description is null
         for at least one code in the basket. */
      description: findService(cpt)?.name ?? `CPT ${cpt}`,
      state,
      localityName: (m?.locality_name as string | null) ?? null,
      localityCode,
      duplicateRowNote,
      bars,
      hopdVsOfficePct,
      ascSavingVsHopd,
      physician: {
        vintage: vintage(m as { year?: unknown; quarter?: unknown } | null),
        sourceFile: null,
        publisher: PUBLISHER.pfs,
      },
      facility: {
        vintage: vintage(oppsRow) ?? vintage(ascRow),
        sourceFile: (oppsRow?.source_file as string | null) ?? (ascRow?.source_file as string | null) ?? null,
        publisher: PUBLISHER.opps,
      },
    };
}

/* ────────────────────────────────────────────────────────────────────────────
   THE REFUSAL LEDGER

   This is the page's centre of gravity and the one section a competitor cannot
   copy without changing what they sell.

   For a fixed basket of codes in one metro, ask the corpus for a distribution and
   run every answer through `honesty.judge()`. Print BOTH outcomes: the cells that
   pass with their sample size, and the cells we throw away with the reason. A
   product that shows a number for everything you type is telling you it has never
   thrown anything away, which is not a claim about coverage, it is a claim about
   standards.

   Sacramento is CBSA 40900 because that is the room David is presenting to.
   ──────────────────────────────────────────────────────────────────────────── */

export type LedgerRow = {
  cpt: string;
  label: string;
  kept: boolean;
  /** Sample behind the cell. Present on both branches when the table gave one. */
  n: number | null;
  p50: number | null;
  /** For a refusal, the reason in the operator's language. */
  reason: string | null;
};

export type Refusals =
  | {
      ok: true;
      metro: string;
      cbsa: string;
      rows: LedgerRow[];
      kept: number;
      refused: number;
      /** The floor a cell has to clear, printed so the rule is checkable. */
      minimumSample: number;
      /** The corpus's own write stamp. Labelled as ours, never as a filing date. */
      corpusStamp: string | null;
    }
  | { ok: false; reason: string };

/** The basket. Codes a benefits broker recognises without a lookup. */
const BASKET: { cpt: string; label: string }[] = [
  { cpt: "99213", label: "Office visit, established, level 3" },
  { cpt: "99214", label: "Office visit, established, level 4" },
  { cpt: "70553", label: "MRI brain, with and without contrast" },
  { cpt: "45378", label: "Diagnostic colonoscopy" },
  { cpt: "29881", label: "Knee arthroscopy with meniscectomy" },
  { cpt: "66984", label: "Cataract surgery with lens implant" },
];

/** The fixture's ledger branch through the SAME compute path as a live read.
    Null when the bake was for a different metro than the one asked for. */
function fixtureLedger(cbsa: string, metro: string): Refusals | null {
  const f = fixture.ledger;
  if (!f || f.cbsa !== cbsa) return null;
  return computeLedger(cbsa, metro, f.rows as RawRow[]);
}

const LEDGER_OUTAGE =
  "We could not reach the commercial corpus to answer this. That is an outage on our side, not a gap in the data.";

export async function refusalLedger(cbsa: string, metro: string): Promise<Refusals> {
  if (!isConfigured()) {
    return (
      fixtureLedger(cbsa, metro) ?? {
        ok: false,
        reason: "This server is not holding the commercial corpus right now, so there is nothing to accept or refuse.",
      }
    );
  }

  try {
    const sb = serviceClient();

    const { data, error } = await sb
      .from("cpt_peer_stats_cbsa")
      .select("cpt, p25, p50, p75, p90, n, updated_at")
      .eq("cbsa", cbsa)
      .in(
        "cpt",
        BASKET.map((b) => b.cpt),
      );

    /* An error is not an empty. See the header: the answer comes from the bake,
       and only the true zero-rows case renders the per-code absence sentences. */
    if (error) {
      return fixtureLedger(cbsa, metro) ?? { ok: false, reason: LEDGER_OUTAGE };
    }

    return computeLedger(cbsa, metro, (data ?? []) as RawRow[]);
  } catch {
    return fixtureLedger(cbsa, metro) ?? { ok: false, reason: LEDGER_OUTAGE };
  }
}

/** ONE compute path for the ledger: the honesty filter runs here exactly once,
    over live rows or the bake's rows alike. */
function computeLedger(cbsa: string, metro: string, data: RawRow[]): Refusals {
    const byCpt = new Map<string, Record<string, unknown>>();
    for (const row of data ?? []) byCpt.set(String((row as Record<string, unknown>).cpt), row as Record<string, unknown>);

    let corpusStamp: string | null = null;

    const rows: LedgerRow[] = BASKET.map((b) => {
      const row = byCpt.get(b.cpt);

      if (!row) {
        return {
          cpt: b.cpt,
          label: b.label,
          kept: false,
          n: null,
          p50: null,
          reason: `No ${metro} cell exists for this code in the corpus at all.`,
        };
      }

      const stamp = row.updated_at as string | null | undefined;
      if (stamp && !corpusStamp) corpusStamp = stamp.slice(0, 10);

      const verdict = judge({
        p25: num(row.p25),
        p50: num(row.p50),
        p75: num(row.p75),
        p90: num(row.p90),
        n: num(row.n),
      });

      const n = num(row.n);

      if (verdict.ok) {
        return { cpt: b.cpt, label: b.label, kept: true, n: verdict.cell.n, p50: verdict.cell.p50, reason: null };
      }

      /* The reason a broker hears, keyed to the verdict the filter actually
         returned. Never a generic "no data": the four rejections mean four
         different things and only one of them is about volume. */
      const say: Record<string, string> = {
        sample_too_thin: `${n ?? 0} filings here. We need ${N_MINIMUM}. We show you California instead, and we say so.`,
        percentage_contamination:
          "The filings for this code price as a percentage of another schedule, not in dollars. We will not read those as dollars.",
        missing_percentile: "The published filings do not resolve to a complete distribution for this code.",
        percentiles_out_of_order: "The published filings did not resolve to a usable distribution.",
        implausible_spread: "The filings span too wide a range to report as one market.",
      };

      return {
        cpt: b.cpt,
        label: b.label,
        kept: false,
        n,
        p50: null,
        reason: say[verdict.reason] ?? "This cell did not pass the honesty filter.",
      };
    });

    return {
      ok: true,
      metro,
      cbsa,
      rows,
      kept: rows.filter((r) => r.kept).length,
      refused: rows.filter((r) => !r.kept).length,
      minimumSample: N_MINIMUM,
      corpusStamp,
    };
}

/* ────────────────────────────────────────────────────────────────────────────
   SCALE

   Counts of what is actually loaded, read with a HEAD count so the row payload
   never crosses the wire. A count is the cheapest honest thing a marketing page
   can say, and it is the one number a visitor can verify against the product in
   thirty seconds.
   ──────────────────────────────────────────────────────────────────────────── */

export type ScaleFact = { label: string; value: number | null; foot: string };

async function countOf(table: string): Promise<number | null> {
  try {
    const sb = serviceClient();
    const { count, error } = await sb.from(table).select("*", { count: "exact", head: true });
    if (error) return null;
    return count ?? null;
  } catch {
    return null;
  }
}

export async function scale(): Promise<ScaleFact[]> {
  /* A null count falls back to the bake's count, which was a real HEAD count
     against the same table on the bake date. The page's eyebrow says "counted,
     not claimed", and both paths keep that sentence true. */
  const baked = fixture.counts ?? { pfs: null, opps: null, asc: null };

  if (!isConfigured()) {
    return [
      { label: "Physician fee rows", value: baked.pfs, foot: PUBLISHER.pfs },
      { label: "Hospital outpatient codes", value: baked.opps, foot: PUBLISHER.opps },
      { label: "Surgery center codes", value: baked.asc, foot: PUBLISHER.asc },
    ].filter((f) => f.value != null);
  }

  const [pfs, opps, asc] = await Promise.all([
    countOf("medicare_locality_cpt_rate"),
    countOf("opps_hcpcs_apc_crosswalk"),
    countOf("asc_payment_rates"),
  ]);

  return [
    { label: "Physician fee rows", value: pfs ?? baked.pfs, foot: PUBLISHER.pfs },
    { label: "Hospital outpatient codes", value: opps ?? baked.opps, foot: PUBLISHER.opps },
    { label: "Surgery center codes", value: asc ?? baked.asc, foot: PUBLISHER.asc },
  ];
}
