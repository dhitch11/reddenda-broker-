/**
 * The honesty filter.
 *
 * Reddenda HARD RULE 1: real data or an honest empty state. Never an estimate,
 * an average, or a placeholder dressed as a measurement.
 *
 * This module is the single place where we decide whether a measured cell is fit
 * to show a human being. Nothing renders a number that has not passed through here.
 *
 * WHY IT EXISTS (measured 2026-08-06, see docs/HANDOFF-DATA.md):
 * Percentage-type negotiated rates from the Transparency in Coverage files are
 * stored as dollar amounts in the upstream peer layer. A `negotiated_type` of
 * "percentage" carrying 0.95 means 95%, not ninety-five cents. Those rows flow
 * into the percentile computation and drag the lower tail to nonsense.
 *
 *   anthembcbsga, NY, 99214 -> median $0.95, 74.2% of rows at that value
 *   anthembcbsct, NY, 99214 -> median $1.00
 *   cpt_peer_stats           -> 179,831 of 1,399,830 cells (12.85%) with p25 < $5
 *   cpt_peer_stats_cbsa      -> 1,380,917 of 12,677,477 cells (10.89%) with p25 < $5
 *
 * This filter is a GUARD, not a CURE. The fix belongs at ingest, partitioning on
 * negotiated_type. That work is owned by the data lane and is handed off in
 * docs/HANDOFF-DATA.md. When the upstream tables are clean this module keeps
 * working and simply stops rejecting anything.
 */

/** Below this, a "rate" is a percentage multiplier, not a dollar amount. */
export const DOLLAR_FLOOR = 5;

/** Observations needed before we will report a metro cell without qualification. */
export const N_CONFIDENT = 500;

/** Observations needed before we will report a metro cell at all. */
export const N_MINIMUM = 100;

/** A p75/p25 ratio beyond this is a distribution we do not trust to be one market. */
export const MAX_SPREAD_RATIO = 25;

export type Confidence = "high" | "reported" | "insufficient";

export type RawCell = {
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  n: number | null;
};

export type Rejection =
  | "percentage_contamination"
  | "missing_percentile"
  | "percentiles_out_of_order"
  | "implausible_spread"
  | "sample_too_thin";

export type Verdict =
  | { ok: true; confidence: Exclude<Confidence, "insufficient">; cell: CleanCell }
  | { ok: false; reason: Rejection };

export type CleanCell = {
  p25: number;
  p50: number;
  p75: number;
  p90: number | null;
  n: number;
};

/**
 * Judge one measured cell.
 *
 * Order matters. We report the most specific defect, because the reason is shown
 * to an operator in the empty state and "we do not have enough observations" and
 * "this market's filings are unusable" are different sentences.
 */
export function judge(raw: RawCell): Verdict {
  const { p25, p50, p75, p90, n } = raw;

  if (p25 == null || p50 == null || p75 == null) {
    return { ok: false, reason: "missing_percentile" };
  }

  // The contamination check runs before everything else. A cell whose lower tail
  // is percentage rows is not a thin sample, it is a wrong sample.
  if (p25 < DOLLAR_FLOOR || p50 < DOLLAR_FLOOR) {
    return { ok: false, reason: "percentage_contamination" };
  }

  if (!(p25 <= p50 && p50 <= p75)) {
    return { ok: false, reason: "percentiles_out_of_order" };
  }

  if (p25 > 0 && p75 / p25 > MAX_SPREAD_RATIO) {
    return { ok: false, reason: "implausible_spread" };
  }

  const observations = n ?? 0;
  if (observations < N_MINIMUM) {
    return { ok: false, reason: "sample_too_thin" };
  }

  // p90 is allowed to be absent. It is the negotiation target and is gated, so a
  // null p90 is a normal state, not a defect.
  const cell: CleanCell = { p25, p50, p75, p90: p90 ?? null, n: observations };

  return {
    ok: true,
    confidence: observations >= N_CONFIDENT ? "high" : "reported",
    cell,
  };
}

/**
 * Operator-facing sentence for a rejection.
 *
 * Written to be read by a broker, not a developer. Honest about what we do not
 * have and never apologetic in a way that implies the number exists and we are
 * withholding it.
 */
export function explain(reason: Rejection, market: string, code: string): string {
  switch (reason) {
    case "percentage_contamination":
      return `Filings for ${code} in ${market} include percentage-based rates that cannot be read as dollar amounts. We do not publish a figure we cannot stand behind.`;
    case "missing_percentile":
      return `We do not have a complete distribution for ${code} in ${market} yet.`;
    case "percentiles_out_of_order":
      return `The published filings for ${code} in ${market} did not resolve to a usable distribution.`;
    case "implausible_spread":
      return `Filings for ${code} in ${market} span too wide a range to report as one market.`;
    case "sample_too_thin":
      return `Not enough public filings for ${code} in ${market} to report a market rate.`;
  }
}

/** Short label for the confidence badge. */
export function confidenceLabel(c: Confidence, n: number): string {
  if (c === "high") return `${n.toLocaleString()} filings`;
  if (c === "reported") return `${n.toLocaleString()} filings, limited sample`;
  return "Insufficient public data";
}
