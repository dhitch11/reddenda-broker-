import { serviceClient } from "./db";
import { metroIndex } from "./metro-index";
import { judge, explain, type CleanCell, type Confidence, type Rejection } from "./honesty";
import { findService, DESCRIPTION_MISSING_UPSTREAM } from "./catalog";
import { attribute, identify, isFlatSchedule, type Attribution } from "./payers";

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
  medicare: MedicareAnchor | null;
  updatedAt: string | null;
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
};

const FRESHNESS_TTL = 60 * 60; // seconds

function describe(cpt: string, upstream: string | null | undefined): string {
  const svc = findService(cpt);
  if (DESCRIPTION_MISSING_UPSTREAM.has(cpt) || !upstream) {
    return svc?.name ?? `CPT ${cpt}`;
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
        return {
          found: true,
          cpt,
          description: describe(cpt, null),
          scope: "metro",
          geoId: geo.cbsa,
          geoName: geo.metroName ?? geo.cbsa,
          cell: verdict.cell,
          confidence: verdict.confidence,
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
    return {
      found: true,
      cpt,
      description: describe(cpt, null),
      scope: "metro",
      geoId: localScope.cbsa,
      geoName: localScope.name,
      cell: scaled,
      confidence: verdict.confidence,
      medicare,
      updatedAt: st.updated_at ?? null,
    };
  }

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

    rows.push({
      payer: r.payer,
      label: id.label,
      brand: id.brand,
      attribution,
      n: r.n ?? 0,
      cell: verdict.cell,
      modalShare,
      flatSchedule: isFlatSchedule(modalShare),
      confidence: verdict.confidence,
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
