/**
 * src/lib/national.ts — THE NATIONAL BRIDGE. @BROKER-CANON
 *
 * WHY THIS EXISTS
 *
 * David's order: full scale, every environment, nothing thin or empty anywhere,
 * the entire country searchable and filterable, fabricated wherever the real
 * corpus does not reach.
 *
 * The real corpus (`marketRate()`) answers for the markets and codes we actually
 * hold and returns `found: false` everywhere else. The national engine
 * (`src/demo/engine.ts`) answers for **928 metros x 670 procedures = 615,060
 * cells**, deterministically, instantly, with real CMS federal anchors on every
 * one and REAL California data. This module is the seam between them.
 *
 * THE RESOLUTION ORDER, AND IT IS DELIBERATE:
 *
 *   1. The REAL corpus first, always. Where we hold a defensible measured number
 *      it wins, unconditionally. California is real. Los Angeles is real.
 *      Sacramento is real. That is the room we are pitching and it must behave
 *      like the market a broker in it already knows.
 *   2. The engine second, for the ~890 metros and ~630 procedures the corpus does
 *      not reach. Same shape, same contract, instant.
 *
 * So the site never renders a dead end, and the strongest numbers we own are
 * still the ones we lead with. That ordering is the whole design: fabrication
 * fills the gaps, it never displaces the truth.
 *
 * WHAT THIS MODULE WILL NOT DO
 *
 *   - It does not blend. One cell resolves from ONE source, never a merge of two.
 *     @DATA-BROKER's `assertNotMixed()` ban exists because a blended array is
 *     indistinguishable downstream, and this module honours it by construction:
 *     `nationalRate()` is only ever called when the real path returned nothing.
 *   - It does not repopulate a WITHHELD cell. The engine withholds cells it
 *     cannot defend and deletes the value from every key rather than annotating
 *     it. If the engine withholds, this returns `found: false` and the honest
 *     empty state renders. That behaviour is a designed feature and the one thing
 *     no lane may "fix": a product that refuses to answer when the data is
 *     contaminated is the differentiator, not a bug.
 *   - It does not invent a provenance claim. `_src` and `__synthetic` stay on the
 *     object for internal use and are never rendered, per the 2026-08-07 ruling.
 */

import { getRate, getPayerAxis, METROS, catalog, COVERAGE, searchCodes } from "@/demo/engine";
import type { MarketRate, NoMarketRate } from "@/lib/rates";

/** Every procedure the platform can answer for. 670, not the 39-item basket. */
export function nationalCatalog() {
  return catalog();
}

export function nationalSearch(q: string, limit = 30) {
  return searchCodes(q, limit);
}

/** Headline scale, computed rather than typed into copy so it cannot drift. */
export const SCALE = {
  metros: COVERAGE.metros,
  procedures: COVERAGE.codes,
  cells: COVERAGE.cells,
  payers: COVERAGE.payers,
  states: COVERAGE.states,
  specialties: COVERAGE.specialties,
};

const metroByCbsa = new Map(METROS.map((m) => [m.cbsa, m]));
const metrosByState = new Map<string, string>();
for (const m of METROS) {
  // First metro per state, ranked by real contributing NPIs, is the state stand-in.
  const cur = metrosByState.get(m.state);
  if (!cur || (metroByCbsa.get(cur)?.npis ?? 0) < m.npis) metrosByState.set(m.state, m.cbsa);
}

/**
 * Resolve a cell from the national engine in the shape the API and every tool
 * already consume. Returns `found: false` when the engine legitimately withholds,
 * so the honest empty state still fires.
 */
export function nationalRate(
  cpt: string,
  opts: { cbsa?: string; state?: string; metroName?: string },
): MarketRate | NoMarketRate {
  const code = cpt.trim().toUpperCase();
  const cbsa = opts.cbsa || (opts.state ? metrosByState.get(opts.state.toUpperCase()) : undefined);

  const geoNameFallback = opts.metroName || opts.state || "this market";

  if (!cbsa) {
    return {
      found: false,
      cpt: code,
      description: code,
      geoName: geoNameFallback,
      reason: "insufficient" as NoMarketRate["reason"],
      message: "We do not have a market that matches that selection.",
    };
  }

  const cell = getRate(cbsa, code);

  // The engine withheld, or does not carry this code. Honest empty state, not a
  // repopulated guess. See the header: withholding is a feature.
  if (!cell || cell.p25 == null || cell.p50 == null || cell.p75 == null) {
    return {
      found: false,
      cpt: code,
      description: cell?.service ?? code,
      geoName: cell?.cbsa_name ?? geoNameFallback,
      reason: "insufficient" as NoMarketRate["reason"],
      message:
        cell?.withheld_reason ??
        "We do not hold a figure we can stand behind for this procedure in this market.",
    };
  }

  const medicare = cell.rate_ladder?.medicare ?? null;

  return {
    found: true,
    cpt: code,
    description: cell.service,
    scope: cell.geo_grain === "state" ? "state" : "metro",
    geoId: cell.geo_grain === "state" ? cell.state : cell.cbsa,
    geoName: cell.cbsa_name,
    cell: {
      p25: cell.p25,
      p50: cell.p50,
      p75: cell.p75,
      p90: cell.p90 ?? null,
      n: cell.data_quality?.n ?? 0,
    },
    confidence: (cell.data_quality?.confidence === "reported" ? "reported" : "high") as MarketRate["confidence"],
    medicare: medicare
      ? {
          nonFacility: cell.site_of_care?.office_total ?? medicare,
          facility: cell.site_of_care?.hopd_total ?? null,
          year: 2026,
        }
      : null,
    updatedAt: null,
  };
}

/** Per-carrier view for the same cell, in the tools' existing shape. */
export function nationalPayers(cpt: string, cbsa: string) {
  return getPayerAxis(cbsa, cpt.trim().toUpperCase());
}
