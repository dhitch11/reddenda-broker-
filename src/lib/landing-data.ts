import { serviceClient, isConfigured } from "./db";

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
 * 3. THE LOCALITY IS NAMED.
 *    `medicare_locality_cpt_rate` holds ONE row per state per code, and that row
 *    is a SPECIFIC Medicare locality, not a state average. Measured 2026-08-24:
 *    California resolves to `locality_name = "YUBA CITY"` with `n_localities =
 *    29`. Code elsewhere in this repo selects it with `.limit(1)` and labels the
 *    result "California", which silently presents one locality's fee as a state
 *    figure. This module reads `locality_name` and prints it. If a page cannot
 *    say WHICH locality a fee came from, it may not call the fee local.
 *
 * WHY THE FACILITY SIDE IS LABELLED SEPARATELY. `opps_hcpcs_apc_crosswalk` and
 * `asc_payment_rates` carry the CMS NATIONAL UNADJUSTED payment, before the wage
 * index for any particular market. Adding a California physician fee to a
 * national facility payment produces a real, checkable, useful total, and it is
 * not a Sacramento total. Both halves are labelled on the face of the page so a
 * broker knows exactly what they are holding.
 */

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
      /** How many localities the state publishes. Context for the line above. */
      localityCount: number | null;
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

export async function siteOfCare(cpt: string, state: string): Promise<SiteOfCare> {
  if (!isConfigured()) {
    return {
      ok: false,
      reason:
        "This server is not holding the federal fee tables right now, so there is no rate to show. We would rather show you nothing than show you a number we cannot source.",
    };
  }

  try {
    const sb = serviceClient();

    const [pfs, opps, asc] = await Promise.all([
      sb
        .from("medicare_locality_cpt_rate")
        .select("nonfac_rate, fac_rate, description, year, locality_name, n_localities")
        .eq("cpt", cpt)
        .eq("state", state)
        .limit(1)
        .maybeSingle(),
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

    const m = pfs.data;
    const office = num(m?.nonfac_rate);
    const professional = num(m?.fac_rate);

    if (office == null && professional == null) {
      return {
        ok: false,
        reason: `The federal physician fee schedule does not carry ${cpt} in ${state} in our copy of the table, so there is no federal basis to compare settings against.`,
      };
    }

    const oppsRate = num(opps.data?.payment_rate);
    const ascRate = num(asc.data?.payment_rate);
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
      description: (m?.description as string | null) ?? `CPT ${cpt}`,
      state,
      localityName: (m?.locality_name as string | null) ?? null,
      localityCount: num(m?.n_localities),
      bars,
      hopdVsOfficePct,
      ascSavingVsHopd,
      physician: {
        vintage: vintage(m as { year?: unknown; quarter?: unknown } | null),
        sourceFile: null,
        publisher: PUBLISHER.pfs,
      },
      facility: {
        vintage: vintage(opps.data) ?? vintage(asc.data),
        sourceFile: (opps.data?.source_file as string | null) ?? (asc.data?.source_file as string | null) ?? null,
        publisher: PUBLISHER.opps,
      },
    };
  } catch {
    return {
      ok: false,
      reason:
        "We could not reach the federal fee tables to answer this, so there is nothing here. This is an outage on our side and not a gap in the data.",
    };
  }
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

export async function refusalLedger(cbsa: string, metro: string): Promise<Refusals> {
  if (!isConfigured()) {
    return {
      ok: false,
      reason: "This server is not holding the commercial corpus right now, so there is nothing to accept or refuse.",
    };
  }

  try {
    const sb = serviceClient();
    const { judge, N_MINIMUM } = await import("./honesty");

    const { data, error } = await sb
      .from("cpt_peer_stats_cbsa")
      .select("cpt, p25, p50, p75, p90, n, updated_at")
      .eq("cbsa", cbsa)
      .in(
        "cpt",
        BASKET.map((b) => b.cpt),
      );

    if (error) {
      return {
        ok: false,
        reason: "We could not reach the commercial corpus to answer this. That is an outage on our side, not a gap in the data.",
      };
    }

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
  } catch {
    return {
      ok: false,
      reason: "We could not reach the commercial corpus to answer this. That is an outage on our side, not a gap in the data.",
    };
  }
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
  if (!isConfigured()) return [];

  const [pfs, opps, asc] = await Promise.all([
    countOf("medicare_locality_cpt_rate"),
    countOf("opps_hcpcs_apc_crosswalk"),
    countOf("asc_payment_rates"),
  ]);

  return [
    { label: "Physician fee rows", value: pfs, foot: PUBLISHER.pfs },
    { label: "Hospital outpatient codes", value: opps, foot: PUBLISHER.opps },
    { label: "Surgery center codes", value: asc, foot: PUBLISHER.asc },
  ];
}
