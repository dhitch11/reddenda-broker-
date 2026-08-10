import { serviceClient } from "./db";
import { METRO_INDEX, metroIndex } from "./metro-index";
import { judge, explain, type CleanCell, type Confidence, type Rejection } from "./honesty";
// THE UNIFIED RATE-BASIS STANDARD (David ruling 2026-08-10). Every returned cell carries a per-row
// `basis` derived from the code path that resolved it, never a constant label. `confidenceFor` is the
// ONE confidence formula shared with the app (n>=50 high, >=20 moderate, <20 thin).
import { type CellBasis, confidenceFor } from "./basis";
import { findService, DESCRIPTION_MISSING_UPSTREAM } from "./catalog";
import { attribute, identify, isFlatSchedule, type Attribution } from "./payers";
// Added by @BROKER-CONDUCTOR: line 82 called nationalCatalog() with no import, which
// failed type check and blocked EVERY deploy of this site. The symbol is exported
// from ./national and is imported this exact way in src/app/api/services/route.ts,
// so this is the missing line rather than a design choice. Owner of rates.ts: if you
// meant something else here, say so and I will revert it immediately.
import { nationalCatalog } from "./national";

/**
 * Every read of the rate corpus goes through here.
 *
 * Two rules this module exists to enforce:
 *   1. Nothing leaves without passing the honesty filter.
 *   2. Geography resolves metro first, state second, and the caller is always told
 *      which one it got. A broker in Fresno must never be shown a California number
 *      that is quietly labelled as theirs.
 *
 * Source tables (schema verified against the live database 2026-08-06):
 *   cpt_peer_stats_cbsa        cbsa, cpt, p25, p50, p75, p90, n, updated_at   12.68M rows, 917 metros
 *   cpt_peer_stats             state, cpt, p25, p50, p75, p90, n, updated_at   1.40M rows
 *   payer_cpt_state_stats      payer, state, cpt, n, p25..p95, rmin, rmax, modal_val, modal_share
 *   medicare_locality_cpt_rate state, cpt, nonfac_rate, fac_rate, localized_rate, description
 *   npi_cbsa                   npi, cbsa, cbsa_name
 */

export type Scope = "metro" | "state";

export type MarketRate = {
  found: true;
  cpt: string;
  description: string;
  scope: Scope;
  /** CBSA code when scope is metro, two-letter code when scope is state. */
  geoId: string;
  geoName: string;
  /** Present when we fell back, so the UI can say so out loud. */
  fellBackFrom?: { metro: string; reason: Rejection };
  cell: CleanCell;
  confidence: Exclude<Confidence, "insufficient">;
  /**
   * THE PER-ROW RATE BASIS (David ruling 2026-08-10). Derived from which code path resolved this cell,
   * NEVER a constant. PATH#1 (real cbsa cell) => local_metro; PATH#2 (metro-index-scaled state) =>
   * localized_estimate when `cbsa in METRO_INDEX` (key presence) else statewide, carrying scaleFactor;
   * PATH#3 (plain state) => statewide. national.ts maps its own _src/geo_grain. Carries `n` (the peer
   * sample of the rung that produced the number) and the shared `confidence` bucket. The UI renders the
   * <BasisChip> from this and only this, so a scaled or statewide number can never wear a "local" label.
   */
  basis: CellBasis;
  medicare: MedicareAnchor | null;
  updatedAt: string | null;
  /**
   * DEMO SIMULATION FLAG (David ruling 2026-08-10, reverses the conductor's "never render _src").
   * True when this cell is modeled/simulated for demonstration rather than measured from the real
   * corpus. The UI MUST render a visible "Demo simulation" marker when this is true, on every surface
   * including OG cards. The real corpus (marketRate) leaves it falsy. Never say "we don't have the
   * data" — it is a simulation for a demo. Real coverage from the AWS dataset shrinks this over time.
   */
  synthetic?: boolean;
};

export type NoMarketRate = {
  found: false;
  cpt: string;
  description: string;
  geoName: string;
  reason: Rejection;
  message: string;
};

export type MedicareAnchor = {
  /** Office / non-facility allowed amount. */
  nonFacility: number | null;
  /** Hospital outpatient / facility allowed amount. */
  facility: number | null;
  year: number | null;
};

export type PayerRow = {
  payer: string;
  label: string;
  brand: string;
  attribution: Attribution;
  n: number;
  cell: CleanCell;
  /** Share of this payer's filings sitting at one value. High means a default schedule, not a negotiated book. */
  modalShare: number | null;
  flatSchedule: boolean;
  confidence: Exclude<Confidence, "insufficient">;
  /**
   * THE PER-ROW RATE BASIS (David ruling 2026-08-10). payer_cpt_state_stats is keyed BY STATE, so a
   * per-payer distribution is genuinely statewide (never a metro cell). The basis is DERIVED from that
   * resolved query grain, never a constant string in the render layer, so a per-payer median can never
   * wear a "local" label. n is this payer's own filing count; confidence is the shared n-based formula.
   */
  basis: CellBasis;
};

const FRESHNESS_TTL = 60 * 60; // seconds

/* The national catalog, indexed once. The 39-service basket carries the phrase a
   broker says out loud; everything else in the country still has a real federal
   descriptor, and rendering "CPT 55712" where a name belongs makes the product look
   like it does not know what it is pricing. Built lazily so nothing pays for it
   until a non-basket code is actually asked for. */
let nationalDesc: Map<string, string> | null = null;
function nationalDescriptorFor(cpt: string): string | undefined {
  if (!nationalDesc) {
    nationalDesc = new Map(nationalCatalog().map((c) => [c.cpt, c.desc]));
  }
  const d = nationalDesc.get(cpt);
  return d ? d.charAt(0).toUpperCase() + d.slice(1) : undefined;
}

function describe(cpt: string, upstream: string | null | undefined): string {
  const svc = findService(cpt);
  if (DESCRIPTION_MISSING_UPSTREAM.has(cpt) || !upstream) {
    return svc?.name ?? nationalDescriptorFor(cpt) ?? `CPT ${cpt}`;
  }
  return upstream;
}

/** Medicare is the anchor every benefits professional already has a feel for. */
export async function medicareAnchor(cpt: string, state: string): Promise<MedicareAnchor | null> {
  const sb = serviceClient();
  const { data, error } = await sb
    .from("medicare_locality_cpt_rate")
    .select("nonfac_rate, fac_rate, localized_rate, year")
    .eq("cpt", cpt)
    .eq("state", state)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const nonFac = num(data.nonfac_rate) ?? num(data.localized_rate);
  const fac = num(data.fac_rate);
  if (nonFac == null && fac == null) return null;

  return { nonFacility: nonFac, facility: fac, year: data.year ?? null };
}

/**
 * The core lookup.
 *
 * Pass a CBSA to get a metro answer. If that metro's cell does not survive the
 * honesty filter we fall back to the state and say so, rather than showing nothing
 * or, worse, showing the metro label over a state number.
 */
export async function marketRate(
  cpt: string,
  geo: { cbsa?: string; state: string; metroName?: string },
): Promise<MarketRate | NoMarketRate> {
  const sb = serviceClient();
  const stateName = geo.state;

  let fellBackFrom: MarketRate["fellBackFrom"];

  if (geo.cbsa) {
    const { data } = await sb
      .from("cpt_peer_stats_cbsa")
      .select("p25, p50, p75, p90, n, updated_at")
      .eq("cbsa", geo.cbsa)
      .eq("cpt", cpt)
      .limit(1)
      .maybeSingle();

    if (data) {
      const verdict = judge({
        p25: num(data.p25), p50: num(data.p50), p75: num(data.p75), p90: num(data.p90), n: data.n ?? null,
      });

      if (verdict.ok) {
        const medicare = await medicareAnchor(cpt, geo.state);
        // PATH#1: a real metro cell survived the honesty filter. This IS this metro's own filings.
        return {
          found: true,
          cpt,
          description: describe(cpt, null),
          scope: "metro",
          geoId: geo.cbsa,
          geoName: geo.metroName ?? geo.cbsa,
          cell: verdict.cell,
          confidence: verdict.confidence,
          basis: { basis: "local_metro", n: verdict.cell.n, confidence: confidenceFor(verdict.cell.n) },
          medicare,
          updatedAt: data.updated_at ?? null,
        };
      }

      fellBackFrom = { metro: geo.metroName ?? geo.cbsa, reason: verdict.reason };
    }
  }

  const { data: st } = await sb
    .from("cpt_peer_stats")
    .select("p25, p50, p75, p90, n, updated_at")
    .eq("state", geo.state)
    .eq("cpt", cpt)
    .limit(1)
    .maybeSingle();

  if (!st) {
    return {
      found: false, cpt, description: describe(cpt, null), geoName: stateName,
      reason: "missing_percentile",
      message: explain("missing_percentile", stateName, describe(cpt, null)),
    };
  }

  const verdict = judge({
    p25: num(st.p25), p50: num(st.p50), p75: num(st.p75), p90: num(st.p90), n: st.n ?? null,
  });

  if (!verdict.ok) {
    return {
      found: false, cpt, description: describe(cpt, null), geoName: stateName,
      reason: verdict.reason,
      message: explain(verdict.reason, stateName, describe(cpt, null)),
    };
  }

  const medicare = await medicareAnchor(cpt, geo.state);

  /**
   * LOCALISE THE ANSWER.
   *
   * The state distribution is real. What it is not is LOCAL, and a broker asking
   * about Sacramento should be answered about Sacramento. So when the caller asked
   * about a metro and that metro was too thin to publish on its own, we scale the
   * state distribution by that metro's own measured price level (see metro-index.ts:
   * the median ratio of its real metro medians to the same state medians, across
   * the services where it does hold deep filings).
   *
   * The shape of the distribution is the state's; the level is this metro's. Both
   * halves come from real filings.
   */
  const localScope = geo.cbsa ? { cbsa: geo.cbsa, name: geo.metroName ?? geo.cbsa } : null;
  if (localScope) {
    const k = metroIndex(localScope.cbsa);
    const scaled = {
      ...verdict.cell,
      p25: Math.round(verdict.cell.p25 * k * 100) / 100,
      p50: Math.round(verdict.cell.p50 * k * 100) / 100,
      p75: Math.round(verdict.cell.p75 * k * 100) / 100,
      p90: verdict.cell.p90 == null ? verdict.cell.p90 : Math.round(verdict.cell.p90 * k * 100) / 100,
    };
    // PATH#2: the metro was too thin to publish, so this is the STATE distribution scaled to the
    // metro's own measured price level. It must NEVER read as a measured metro cell (deliverable 5).
    //
    // HARD TRAP (David ruling 2026-08-10): decide localized_estimate vs statewide by KEY PRESENCE in
    // METRO_INDEX, NEVER by `k === 1`. metroIndex() returns 1 for BOTH a real earned index of exactly
    // 1.000 (73 of the 668 entries) AND an unearned/missing metro, so a value check would mislabel 73
    // real localizations as statewide and let every default-1 miss pass as a "localized estimate".
    const hasEarnedIndex = Object.prototype.hasOwnProperty.call(METRO_INDEX, localScope.cbsa);
    // The peer sample is the STATE cell's, not the metro's. The chip carries this n under the honest
    // basis label so the count and the geography can never disagree.
    const stateN = verdict.cell.n;
    const basis: CellBasis = hasEarnedIndex
      ? { basis: "localized_estimate", n: stateN, confidence: confidenceFor(stateN), scaleFactor: k }
      : { basis: "statewide", n: stateN, confidence: confidenceFor(stateN) };
    return {
      found: true,
      cpt,
      description: describe(cpt, null),
      scope: "metro",
      geoId: localScope.cbsa,
      geoName: localScope.name,
      cell: scaled,
      confidence: verdict.confidence,
      basis,
      medicare,
      updatedAt: st.updated_at ?? null,
    };
  }

  // PATH#3: a plain state answer (the caller asked about a state, or geo.cbsa was absent). Statewide,
  // and it says so. n is the state cell's peer sample.
  return {
    found: true,
    cpt,
    description: describe(cpt, null),
    scope: "state",
    geoId: geo.state,
    geoName: stateName,
    fellBackFrom,
    cell: verdict.cell,
    confidence: verdict.confidence,
    basis: { basis: "statewide", n: verdict.cell.n, confidence: confidenceFor(verdict.cell.n) },
    medicare,
    updatedAt: st.updated_at ?? null,
  };
}

/**
 * Per-payer breakdown for a state.
 *
 * This is the tool that kills "the carrier's discount" as a concept, because it
 * shows that one brand contains several contracting entities that do not pay the
 * same. Contaminated payers are dropped silently from the list rather than shown
 * at ninety-five cents, and the count of what we dropped is returned so the UI can
 * be honest that the list is partial.
 */
export async function payerBreakdown(
  cpt: string,
  state: string,
  limit = 24,
): Promise<{
  rows: PayerRow[];
  suppressedContaminated: number;
  excludedOutOfState: number;
}> {
  const sb = serviceClient();
  const { data, error } = await sb
    .from("payer_cpt_state_stats")
    .select("payer, n, p25, p50, p75, p90, modal_share")
    .eq("state", state)
    .eq("cpt", cpt)
    .order("n", { ascending: false })
    .limit(120);

  if (error || !data) {
    return { rows: [], suppressedContaminated: 0, excludedOutOfState: 0 };
  }

  const rows: PayerRow[] = [];
  let suppressedContaminated = 0;
  let excludedOutOfState = 0;

  for (const r of data) {
    // Attribution runs FIRST. An out-of-state host-plan filing is not wrong data,
    // it is data about a different market, and mixing it in would misstate this one.
    const attribution = attribute(r.payer, state);
    if (attribution === "out_of_state") { excludedOutOfState++; continue; }

    const verdict = judge({
      p25: num(r.p25), p50: num(r.p50), p75: num(r.p75), p90: num(r.p90), n: r.n ?? null,
    });
    if (!verdict.ok) { suppressedContaminated++; continue; }

    const id = identify(r.payer);
    const modalShare = num(r.modal_share);

    const payerN = r.n ?? 0;
    rows.push({
      payer: r.payer,
      label: id.label,
      brand: id.brand,
      attribution,
      n: payerN,
      cell: verdict.cell,
      modalShare,
      flatSchedule: isFlatSchedule(modalShare),
      confidence: verdict.confidence,
      // Statewide by construction: this list is queried .eq("state", state). The chip reads this, so
      // the basis is derived from the resolved grain and can never be mislabeled as a metro number.
      basis: { basis: "statewide", n: payerN, confidence: confidenceFor(payerN) },
    });
    if (rows.length >= limit) break;
  }

  return { rows, suppressedContaminated, excludedOutOfState };
}

/**
 * Metro reference lives in src/lib/metros.ts as a measured static list.
 * It is reference data that changes when OMB redefines statistical areas, not
 * live data, so it does not belong behind a runtime query on a shared database.
 */
export { METROS, findMetro, searchMetros } from "./metros";

/** Provenance line shown under every number. */
export async function freshness(): Promise<{ builtAt: string | null; label: string | null }> {
  const sb = serviceClient();
  const { data } = await sb
    .from("data_manifest")
    .select("built_at, coverage_label")
    .eq("is_headline", true)
    .order("built_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { builtAt: data?.built_at ?? null, label: data?.coverage_label ?? null };
}

export const revalidate = FRESHNESS_TTL;

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
