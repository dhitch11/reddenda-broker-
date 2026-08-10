/**
 * src/lib/basis.ts - THE ONE RATE-BASIS STANDARD. @ESTATE-FULL-AUDIT (David ruling 2026-08-10)
 *
 * Every Reddenda tool that shows rate percentiles (P25/P50/P75/P90) or a contracted rate must display,
 * per data line, a plain-language BASIS chip + the sample size (n), computed from the REAL per-row basis
 * the query already resolved. This module is the single source of truth for the app; the broker carries a
 * byte-identical copy and marketing a matching JS helper. That identity is the anti-fragmentation cure.
 *
 * THE NON-NEGOTIABLE RULE: the basis is DERIVED FROM REAL DATA PER ROW, never a constant. This estate
 * shipped a bug where "local peer median" was a regex over hardcoded prose that read geo_scope zero times
 * and told an Idaho provider "local" when every cell was national. Do not stand a string in for the basis.
 *
 * BROKER NOTE: the two shared functions here (rungToBasis, summarize) are kept in sync with the app's
 * src/lib/basis.ts. The broker DOES emit `localized_estimate` (the app has no scaling path and never does).
 * The broker's per-row derivation lives where the geography is actually resolved: src/lib/rates.ts (the
 * three marketRate code paths plus the METRO_INDEX key-presence trap) and src/lib/national.ts (_src /
 * geo_grain). It is never a constant here.
 */

export type Basis = "local_metro" | "localized_estimate" | "statewide" | "national" | "demo";
export type Confidence = "high" | "moderate" | "thin";

export interface CellBasis {
  basis: Basis;
  /** Peer sample size of the RUNG that produced THIS number. Never raw filings, never a hardcoded floor. */
  n: number;
  confidence: Confidence;
  /** Only when basis === 'localized_estimate' (broker metro-index scaling). */
  scaleFactor?: number;
  /** The engine silently falls back p90 -> p75 -> p50; a fallback target is itself a thin signal. */
  targetBasis?: "p90" | "p75_fallback" | "p50_fallback";
}

/** Header/aggregate surfaces render from the distribution, never one flag painted over mixed rows. */
export interface BasisSummary {
  dominantBasis: Basis;
  localCells: number;
  totalCells: number;
}

/** ONE confidence formula, everywhere. n<20 is the estate peer-cell floor; it is the thin threshold. */
export function confidenceFor(n: number | null | undefined, targetBasis?: CellBasis["targetBasis"]): Confidence {
  const size = typeof n === "number" && Number.isFinite(n) ? n : 0;
  let c: Confidence = size >= 50 ? "high" : size >= 20 ? "moderate" : "thin";
  // A fallback target (p75/p50 instead of p90) can never read as high confidence.
  if (targetBasis === "p75_fallback" || targetBasis === "p50_fallback") c = c === "high" ? "moderate" : c;
  return c;
}

/**
 * Map the app's real per-row peer rung (cpt_peer_stats cascade) to the canonical basis.
 * Rung values measured in src/app/api/explorer/query/route.ts:
 *   cbsa · specialty · specialty_broad · state · state_broad · national · national_reference
 * Unknown rungs FAIL toward 'statewide' (shows the number, never claims local) rather than toward a
 * local claim we cannot support. There is no 'localized_estimate' in the app: it has no scaling path.
 */
export function rungToBasis(cohortRung: string | null | undefined, isDemo = false): Basis {
  if (isDemo) return "demo";
  const s = (cohortRung ?? "").toLowerCase();
  // ANY non-local national scope maps to national and suppresses the local claim. Catching the
  // substring (not an enum whitelist) covers national, national_reference, commercial_national, and
  // national_cpt_stats_cache (the whole estate NON_LOCAL_SCOPES family), and any future *national*
  // variant, so a national number can never leak through the default as "statewide". None of the real
  // local rungs (cbsa | specialty | state) contains the token, so this is safe. David 2026-08-10: the
  // real statewide data for these is being ACQUIRED; until it lands they are honestly national, and the
  // chip upgrades itself to statewide/metro automatically once the resolved scope changes.
  if (s.includes("national")) return "national";
  switch (s) {
    case "cbsa":
      return "local_metro";
    case "specialty":
    case "specialty_broad":
    case "state":
    case "state_broad":
      return "statewide";
    default:
      // Unknown non-national rung: show the number, never claim local. Statewide is the honest floor.
      return "statewide";
  }
}

/** True only for a real local rung. A national basis cannot claim a local percentile or a P90 target. */
export function showsLocalPosition(basis: Basis): boolean {
  return basis !== "national";
}

export interface BasisMeta {
  label: string;
  tooltip: string;
  /** national suppresses the percentile + P90 target; every other state shows them. */
  showsPercentile: boolean;
  /** semantic tone for the chip; the component maps these to theme tokens. */
  tone: "positive" | "info" | "neutral" | "muted" | "demo";
}

export const BASIS_META: Record<Basis, BasisMeta> = {
  local_metro: {
    label: "Local · metro",
    tooltip: "From this metro's own filings.",
    showsPercentile: true,
    tone: "positive",
  },
  localized_estimate: {
    label: "Localized estimate",
    tooltip: "State rates adjusted to this metro's price level.",
    showsPercentile: true,
    tone: "info",
  },
  statewide: {
    label: "Statewide",
    tooltip: "Statewide peer distribution; metro sample too thin to publish alone.",
    showsPercentile: true,
    tone: "neutral",
  },
  national: {
    label: "National",
    tooltip: "National schedule only; local peers still indexing.",
    showsPercentile: false,
    tone: "muted",
  },
  demo: {
    label: "Demo",
    tooltip: "Modeled sample, not live market data.",
    showsPercentile: true,
    tone: "demo",
  },
};

// Lower rank = weaker/more-conservative basis. Used only as the tie-break for the dominant summary, so
// a tie never resolves toward the STRONGER claim (never overstate on a header).
const BASIS_RANK: Record<Basis, number> = {
  local_metro: 5,
  localized_estimate: 4,
  statewide: 3,
  national: 2,
  demo: 1,
};
/**
 * The dominant basis for a header/aggregate chip over mixed rows: the MOST COMMON basis present, NOT the
 * strongest. A book of 19 national + 1 local must not headline "Local" off the single strongest row (that
 * was the bug). Ties resolve toward the weaker basis (lower rank) so the header never overstates. Each row
 * still carries its own chip for the exceptions, and localCells/totalCells gives the header its nuance
 * (e.g. "3 of 20 local").
 */
export function summarize(rows: { basis: Basis }[]): BasisSummary {
  const total = rows.length;
  const local = rows.filter((r) => r.basis === "local_metro").length;
  const counts = new Map<Basis, number>();
  for (const r of rows) counts.set(r.basis, (counts.get(r.basis) ?? 0) + 1);
  let dominant: Basis = "national";
  let bestCount = -1;
  for (const [basis, c] of counts) {
    if (c > bestCount || (c === bestCount && BASIS_RANK[basis] < BASIS_RANK[dominant])) {
      bestCount = c;
      dominant = basis;
    }
  }
  return { dominantBasis: dominant, localCells: local, totalCells: total };
}
