import { serviceClient } from "./db";
import { findService, DESCRIPTION_MISSING_UPSTREAM } from "./catalog";

/**
 * SITE OF SERVICE. Total cost of care at three places, on a federal basis.
 *
 * This is the number a broker or a self-funded employer actually moves money on:
 * the same procedure, in an office, in an ambulatory surgery centre, and in a
 * hospital outpatient department.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS MODULE IS SHAPED THE WAY IT IS. READ BEFORE CHANGING THE MATH.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `medicare_locality_cpt_rate.fac_rate` is NOT the cost of care in a facility.
 * It is the PHYSICIAN's professional fee when the service happens in a facility.
 * It is lower than `nonfac_rate` only because the practice-expense component is
 * stripped out. The hospital bills its own payment separately under OPPS.
 *
 * A brief on this estate said, verbatim, "colonoscopy: office $423, facility $170",
 * and it reached three documents before it was caught. Read plainly it says steer
 * the member to the hospital. That is backwards, and it would have been wrong in
 * front of a client. The correct totals, measured live in CA on the 2026-Q3
 * vintage, are the opposite:
 *
 *   45378 colonoscopy    office $423   ASC $681    HOPD $1,121   (+165%)
 *   29881 knee scope     office $547   ASC $2,191  HOPD $3,889   (+612%)
 *   66984 cataract       office $501   ASC $1,756  HOPD $2,858   (+471%)
 *
 * The ASC column is the money-saving steer, and it is the column nobody could
 * see until the facility-fee tables were joined in.
 *
 *   Office total = nonfac_rate                 (already includes practice expense)
 *   ASC total    = fac_rate + asc.payment_rate
 *   HOPD total   = fac_rate + opps.payment_rate
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE GUARD THAT KEEPS IT HONEST. NOT OPTIONAL.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A missing facility fee must produce an honest empty state, NEVER a computed
 * total. 99213 and 99214 carry OPPS status `B`, "not paid under OPPS", so their
 * facility fee is genuinely absent. Coalescing that absence to zero yields a
 * "HOPD total" of bare `fac_rate`, which renders as "the hospital is 41% cheaper".
 * That is false. E&M in a hospital outpatient department carries a separate
 * clinic-visit facility payment that does not live on that HCPCS row.
 *
 * So: `payment_rate > 0` filters the facility side only, and a null nulls exactly
 * one site rather than dropping the row. Verified live 2026-08-06 against all
 * three tables (19,153 / 7,380 / 1,051 rows, 2026-Q3).
 *
 * Source tables, all owned by the data lane and read strictly read-only here:
 *   medicare_locality_cpt_rate  state, cpt, nonfac_rate, fac_rate, description
 *   opps_hcpcs_apc_crosswalk    hcpcs, payment_rate, status_indicator, year, quarter
 *   asc_payment_rates           hcpcs, payment_rate, year, quarter
 */

/** OPPS status indicators that are separately payable only when billed alone. */
const CONDITIONALLY_PACKAGED = new Set(["Q1", "Q3"]);

export const CONDITIONAL_NOTE = "Paid separately when billed alone";

/**
 * WHY A NULL FACILITY FEE NEEDS FOUR SENTENCES AND NOT ONE.
 *
 * This module originally rendered a single string for every absent facility fee:
 * "Medicare does not price this separately in a hospital outpatient department."
 * That is TRUE for a packaged or non-payable code and **FLATLY FALSE** for a code
 * paid under a different fee schedule.
 *
 * Measured on the live table: screening mammography `77067` is `A` and EKG `93000`
 * is `M`. Both are paid at a hospital, just not out of the OPPS file. Telling a
 * broker a screening mammogram "is not priced at a hospital" is a wrong statement
 * of fact, and a broker repeating it in a renewal meeting is the exact failure this
 * product cannot have. 3,540 codes carry `A` or `M`.
 *
 * The absence is real either way. What differs is WHAT the absence means, and the
 * honest empty state has to say the true one.
 */
const OPPS_STATUS: Record<string, { kind: "packaged" | "elsewhere" | "inpatient" | "unpayable"; say: string }> = {
  N:  { kind: "packaged",  say: "is bundled into the payment for the procedure it accompanies, so it carries no separate facility price" },
  Q2: { kind: "packaged",  say: "is bundled into the payment for the procedure it accompanies, so it carries no separate facility price" },
  A:  { kind: "elsewhere", say: "is paid under a different federal fee schedule in this setting, so the hospital total is not comparable from this file" },
  M:  { kind: "elsewhere", say: "is paid by a different method in this setting, so the hospital total is not comparable from this file" },
  C:  { kind: "inpatient", say: "is an inpatient-only procedure, so there is no outpatient price to compare" },
  B:  { kind: "unpayable", say: "is not paid under the hospital outpatient schedule, and the facility payment it does carry is not on this record" },
  E1: { kind: "unpayable", say: "is not payable by Medicare in this setting" },
};

/**
 * Drugs and biologicals. Excluded from any ranking: the payment is the cost of the
 * drug, not of a place, so "steer this somewhere cheaper" is not a sentence that
 * means anything. One row measures $4,505,000 and would top every league table.
 */
const DRUG_STATUS = new Set(["K", "G"]);

export type Site = {
  /** Total allowed amount at this site, or null when it cannot be priced honestly. */
  total: number | null;
  /** The physician component of the total. Present even when total is null. */
  professional: number | null;
  /** The facility component. Null is the whole point: it means we will not compute. */
  facility: number | null;
  /** Why there is no total, written for a broker rather than a developer. */
  unavailable: string | null;
  /** A true caveat about a total that DOES exist. Never used to explain an absence. */
  note?: string | null;
};

export type SiteComparison = {
  found: true;
  cpt: string;
  name: string;
  plain: string;
  state: string;
  office: Site;
  asc: Site;
  hopd: Site;
  /** HOPD versus office, as a percentage. Null when HOPD cannot be priced. */
  hopdVsOfficePct: number | null;
  /** ASC versus HOPD in dollars. The saving a plan captures by steering. */
  ascSavingVsHopd: number | null;
  /**
   * False when nonfac_rate equals fac_rate, meaning the physician is paid the same
   * everywhere and there is no distinct office option. True for 1,415 codes in CA,
   * which is the honest size of the office-versus-hospital story.
   */
  officeIsDistinct: boolean;
  /** Set when the OPPS status makes the number conditional. */
  caveat: string | null;
  statusIndicator: string | null;
  vintage: string | null;
};

export type NoSiteComparison = {
  found: false;
  cpt: string;
  name: string;
  plain: string;
  state: string;
  message: string;
};

const n = (v: unknown): number | null => {
  if (v == null) return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
};

/**
 * One service, one state, three sites.
 *
 * Returns `found: false` only when there is no federal physician rate at all.
 * A service that exists but cannot be priced in a facility returns `found: true`
 * with that site's `total` null and a sentence saying why, because the absence is
 * itself informative and hiding the row would teach the wrong lesson.
 */
export async function siteComparison(
  cpt: string,
  state: string,
): Promise<SiteComparison | NoSiteComparison> {
  const sb = serviceClient();
  const svc = findService(cpt);
  const plain = svc?.plain ?? `CPT ${cpt}`;

  const [medicare, opps, asc] = await Promise.all([
    sb.from("medicare_locality_cpt_rate")
      .select("nonfac_rate, fac_rate, description, year")
      .eq("cpt", cpt).eq("state", state).limit(1).maybeSingle(),
    sb.from("opps_hcpcs_apc_crosswalk")
      .select("payment_rate, status_indicator, year, quarter")
      .eq("hcpcs", cpt).limit(1).maybeSingle(),
    sb.from("asc_payment_rates")
      .select("payment_rate, year, quarter")
      .eq("hcpcs", cpt).limit(1).maybeSingle(),
  ]);

  const m = medicare.data;
  const office = n(m?.nonfac_rate);
  const professional = n(m?.fac_rate);

  // The upstream description is null for at least one code in the basket, so the
  // catalog name wins wherever upstream is missing or known-bad.
  const upstream = m?.description as string | null | undefined;
  const name =
    DESCRIPTION_MISSING_UPSTREAM.has(cpt) || !upstream ? (svc?.name ?? `CPT ${cpt}`) : upstream;

  if (office == null && professional == null) {
    return {
      found: false, cpt, name, plain, state,
      message: `Medicare does not publish a physician fee for ${plain} in ${state}, so there is no federal basis to compare sites against.`,
    };
  }

  // `payment_rate > 0` is the correct and sufficient filter. CMS zeroes every
  // packaged service on both sides, so a positive rate is a separately payable
  // one. This was verified across every status indicator, not assumed.
  const oppsFee = (opps.data && n(opps.data.payment_rate)! > 0) ? n(opps.data.payment_rate) : null;
  const ascFee = (asc.data && n(asc.data.payment_rate)! > 0) ? n(asc.data.payment_rate) : null;
  const si = (opps.data?.status_indicator as string | null) ?? null;

  const hopdTotal = oppsFee != null && professional != null ? round2(professional + oppsFee) : null;
  const ascTotal = ascFee != null && professional != null ? round2(professional + ascFee) : null;

  // The reason a site has no total, said accurately. `si` decides the sentence for
  // the hospital column; anything we cannot classify gets the narrow, defensible
  // claim ("this file does not carry it") rather than the broad, wrong one
  // ("Medicare does not price it").
  const status = si ? OPPS_STATUS[si] : undefined;
  const hopdReason = oppsFee != null
    ? null
    : status
      ? `${plain} ${status.say}.`
      : `The hospital outpatient file does not carry a separate facility payment for ${plain}, so we do not compute a hospital total.`;

  const ascReason = ascFee != null
    ? null
    : `${plain} is not on the ambulatory surgery centre payment list, so Medicare publishes no surgery centre total for it.`;

  // 72.1% of codes carry nonfac_rate EXACTLY equal to fac_rate, which means there
  // is no distinct office option for that service. Reporting it as an "office
  // price" invents a choice the member does not have.
  const officeIsDistinct = office != null && professional != null && office !== professional;

  return {
    found: true,
    cpt,
    name,
    plain,
    state,
    officeIsDistinct,
    office: {
      total: office,
      professional: office,
      facility: null,
      unavailable: office == null ? `Medicare publishes no office rate for ${plain} in ${state}.` : null,
      note:
        office != null && !officeIsDistinct
          ? "The physician is paid the same wherever this happens, so the whole difference between sites is the facility fee."
          : null,
    },
    asc: {
      total: ascTotal,
      professional,
      facility: ascFee,
      unavailable: ascTotal == null ? ascReason : null,
    },
    hopd: {
      total: hopdTotal,
      professional,
      facility: oppsFee,
      unavailable: hopdTotal == null ? hopdReason : null,
    },
    hopdVsOfficePct:
      hopdTotal != null && office != null && office > 0
        ? Math.round(((hopdTotal - office) / office) * 100)
        : null,
    ascSavingVsHopd: hopdTotal != null && ascTotal != null ? round2(hopdTotal - ascTotal) : null,
    caveat: si && CONDITIONALLY_PACKAGED.has(si) ? CONDITIONAL_NOTE : null,
    statusIndicator: si,
    vintage: vintageOf(opps.data, asc.data),
  };
}

/**
 * The whole steerable basket for one state, ranked by how much a plan saves by
 * moving the service out of a hospital outpatient department.
 *
 * Services that cannot be priced at all three sites are excluded from the ranking
 * BY RULE rather than hidden by styling, because a row reading "no difference"
 * teaches a broker that site of service does not matter, which is the opposite of
 * the truth and the opposite of the sale.
 */
export async function steerableBasket(state: string, limit = 12) {
  const candidates = (await import("./catalog")).SERVICES.filter((s) => s.siteOfService);

  const rows = await Promise.all(
    candidates.map((s) => siteComparison(s.cpt, state)),
  );

  // RANK ON HOSPITAL VERSUS SURGERY CENTRE, NOT HOSPITAL VERSUS OFFICE.
  //
  // 72.1% of codes have nonfac_rate exactly equal to fac_rate, so an office-based
  // ranking sorts mostly on a difference that does not exist and surfaces advice
  // like "steer a distal ulna arthroplasty to an office". The hospital-versus-ASC
  // spread is the comparison that is real for a surgical basket and is the one a
  // plan can actually act on.
  const priced = rows.filter(
    (r): r is SiteComparison =>
      r.found &&
      r.hopd.total != null &&
      r.asc.total != null &&
      !DRUG_STATUS.has(r.statusIndicator ?? ""),
  );

  priced.sort((a, b) => (b.ascSavingVsHopd ?? 0) - (a.ascSavingVsHopd ?? 0));

  return {
    rows: priced.slice(0, limit),
    considered: candidates.length,
    // Reported, never silently truncated. A service drops out because it cannot be
    // priced at both facility sites, and that is a fact about the data worth saying.
    excluded: candidates.length - priced.length,
    rankedBy: "hospital outpatient versus ambulatory surgery centre",
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * `quarter` is a full label ("2026-Q3"), not an integer, so it is used verbatim
 * where present. Composing `${year} Q${quarter}` produced "2026 Q2026-Q3" on the
 * live table. Measured, not assumed.
 */
function vintageOf(
  o: { year?: number | null; quarter?: string | number | null } | null | undefined,
  a: { year?: number | null; quarter?: string | number | null } | null | undefined,
): string | null {
  const src = o?.year ? o : a?.year ? a : null;
  if (!src?.year) return null;
  const q = src.quarter;
  if (q == null) return String(src.year);
  return typeof q === "string" ? q.replace("-", " ") : `${src.year} Q${q}`;
}
