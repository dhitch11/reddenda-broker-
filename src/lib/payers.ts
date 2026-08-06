/**
 * Payer identity and attribution.
 *
 * THE PROBLEM THIS SOLVES (measured 2026-08-06):
 * Querying `payer_cpt_state_stats` for CPT 70553 in California returns, ranked by
 * volume:
 *
 *   anthembcbsga   median $1,448   n=1,934   74% of filings at one value
 *   anthembcbsoh   median $4,493   n=1,690   51% at one value
 *   anthembcbsky   median $1,448   n=1,590   70% at one value
 *   empirebcbs     median $1,448   n=  508   69% at one value
 *
 * Anthem Georgia is not a California health plan. These are out-of-state Blues
 * files carrying California providers through BlueCard, plus what looks like a
 * shared default schedule (the repeated $1,448 across four unrelated states with
 * modal shares near 70% is not four independently negotiated books).
 *
 * Showing that list to a broker as "what payers pay in California" would be false.
 * So every payer row is resolved to a home state and rows that do not belong to the
 * queried market are either excluded or labelled, never silently mixed in.
 *
 * This mirrors an exclusion the marketing site already applies on one page. Making
 * it a shared rule rather than one page's rendering logic is the point.
 */

export type PayerIdentity = {
  slug: string;
  /** What a broker calls it. */
  label: string;
  /** Parent brand, because one brand contains many contracting entities. */
  brand: string;
  /** Two-letter home state, or "national" for a genuinely multi-state carrier. */
  home: string | "national";
};

export const PAYERS: PayerIdentity[] = [
  // National carriers. Genuinely write business in every state.
  { slug: "uhc_national", label: "UnitedHealthcare", brand: "UnitedHealthcare", home: "national" },
  { slug: "aetna_national", label: "Aetna", brand: "Aetna", home: "national" },
  { slug: "cigna_national", label: "Cigna", brand: "Cigna", home: "national" },
  { slug: "centene", label: "Centene / Ambetter", brand: "Centene", home: "national" },

  // Blues. Each is a separate contracting entity with its own book, in ONE state.
  { slug: "anthembcca", label: "Anthem Blue Cross", brand: "Elevance", home: "CA" },
  { slug: "bsca", label: "Blue Shield of California", brand: "Blue Shield of California", home: "CA" },
  { slug: "empirebcbs", label: "Empire BlueCross BlueShield", brand: "Elevance", home: "NY" },
  { slug: "anthembcbsct", label: "Anthem BCBS Connecticut", brand: "Elevance", home: "CT" },
  { slug: "anthembcbsga", label: "Anthem BCBS Georgia", brand: "Elevance", home: "GA" },
  { slug: "anthembcbsin", label: "Anthem BCBS Indiana", brand: "Elevance", home: "IN" },
  { slug: "anthembcbsky", label: "Anthem BCBS Kentucky", brand: "Elevance", home: "KY" },
  { slug: "anthembcbsme", label: "Anthem BCBS Maine", brand: "Elevance", home: "ME" },
  { slug: "anthembcbsmo", label: "Anthem BCBS Missouri", brand: "Elevance", home: "MO" },
  { slug: "anthembcbsnh", label: "Anthem BCBS New Hampshire", brand: "Elevance", home: "NH" },
  { slug: "anthembcbsnv", label: "Anthem BCBS Nevada", brand: "Elevance", home: "NV" },
  { slug: "anthembcbsoh", label: "Anthem BCBS Ohio", brand: "Elevance", home: "OH" },
  { slug: "anthembcbsva", label: "Anthem BCBS Virginia", brand: "Elevance", home: "VA" },
  { slug: "anthembcbswi", label: "Anthem BCBS Wisconsin", brand: "Elevance", home: "WI" },
  { slug: "anthembcbsco", label: "Anthem BCBS Colorado", brand: "Elevance", home: "CO" },
  { slug: "bcbsil", label: "Blue Cross Blue Shield of Illinois", brand: "HCSC", home: "IL" },
  { slug: "bcbstx", label: "Blue Cross Blue Shield of Texas", brand: "HCSC", home: "TX" },
  { slug: "bcbsok", label: "Blue Cross Blue Shield of Oklahoma", brand: "HCSC", home: "OK" },
  { slug: "bcbsnm", label: "Blue Cross Blue Shield of New Mexico", brand: "HCSC", home: "NM" },
  { slug: "bcbsmt", label: "Blue Cross Blue Shield of Montana", brand: "HCSC", home: "MT" },
  { slug: "bcbst_tn", label: "BlueCross BlueShield of Tennessee", brand: "BCBS Tennessee", home: "TN" },
  { slug: "florida_blue", label: "Florida Blue", brand: "GuideWell", home: "FL" },
  { slug: "highmark_pa", label: "Highmark", brand: "Highmark", home: "PA" },
  { slug: "ibx_pa", label: "Independence Blue Cross", brand: "Independence", home: "PA" },
  { slug: "horizon_nj", label: "Horizon BCBS New Jersey", brand: "Horizon", home: "NJ" },
];

const bySlug = new Map(PAYERS.map((p) => [p.slug, p]));

/** Slugs encode the home state. Fall back to parsing when a slug is not registered. */
const SLUG_STATE = /(?:^|_)(a[klrzs]|c[aot]|d[ce]|fl|ga|hi|i[adln]|k[sy]|la|m[adeinost]|n[cdehjmvy]|o[hkr]|pa|ri|s[cd]|t[nx]|ut|v[at]|w[aivy])$/;

export function identify(slug: string): PayerIdentity {
  const known = bySlug.get(slug);
  if (known) return known;

  const m = slug.toLowerCase().match(SLUG_STATE);
  return {
    slug,
    label: slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    brand: "Unknown",
    home: m ? m[1].toUpperCase() : "national",
  };
}

export type Attribution = "in_market" | "national" | "out_of_state";

/**
 * Does this payer's filing belong in this market's comparison?
 *
 * in_market   this carrier's home state is the market. Its book is real here.
 * national    a national carrier. Real here.
 * out_of_state a host-plan or BlueCard filing carrying local providers. Real data,
 *              but it is not a plan an employer in this market can buy, so it is
 *              excluded from the headline comparison and labelled if shown.
 */
export function attribute(slug: string, state: string): Attribution {
  const id = identify(slug);
  if (id.home === "national") return "national";
  return id.home === state.toUpperCase() ? "in_market" : "out_of_state";
}

/**
 * A modal share this high means most filings sit at one number, which is the
 * signature of a default or standard schedule rather than a negotiated book.
 * We still show it, with the caveat, because the flatness is itself informative.
 */
export const FLAT_SCHEDULE_THRESHOLD = 0.6;

export function isFlatSchedule(modalShare: number | null): boolean {
  return modalShare != null && modalShare >= FLAT_SCHEDULE_THRESHOLD;
}
