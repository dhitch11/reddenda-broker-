import { serviceClient } from "./db";
import { caLocalityCodeFor, CA_DEFAULT_LOCALITY } from "./ca-locality";
import { judge, explain, N_MINIMUM, type CleanCell, type Confidence, type Rejection } from "./honesty";
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
  /**
   * Present when we fell back, so the UI can say so out loud.
   *
   * `n` is the metro's OWN filing count, and `need` is the floor it missed. Both are
   * carried because the honest sentence needs the number, not the adjective: David's
   * 08-24 order 6 wants "Sacramento has 17 filings and we need 100", not "thin data".
   * `n` is null only when the metro held no row at all, which is a different fact
   * from holding a row that was too thin, and the UI says the two differently.
   */
  fellBackFrom?: { metro: string; reason: Rejection; n: number | null; need: number };
  cell: CleanCell;
  confidence: Exclude<Confidence, "insufficient">;
  /**
   * THE PER-ROW RATE BASIS (David ruling 2026-08-10). Derived from which code path resolved this cell,
   * NEVER a constant. PATH#1 (a real cbsa cell that passed the honesty filter) => local_metro;
   * PATH#3 (the state cell) => statewide. There is no longer a scaling path, so this module CANNOT
   * emit `localized_estimate` at all - see the block where PATH#2 used to be. national.ts maps its own
   * _src/geo_grain. Carries `n` (the peer sample of the rung that produced the number) and the shared
   * `confidence` bucket. The UI renders the <BasisChip> from this and only this, so a statewide number
   * can never wear a "local" label.
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
  /** ★ WHICH Medicare locality these dollars are from. Added 2026-08-26 under
      Bulletin 2 #5. A dollar from this module now names its locality, and any
      surface that prints it owes the reader that name. */
  locality: string | null;
  localityName: string | null;
  /** "matched" means the caller's own market. Anything else is a real number
      from a NAMED other locality, and the surface says so. */
  basis: "matched" | "state_default" | "rest_of" | "arbitrary";
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

/** Medicare is the anchor every benefits professional already has a feel for.
 *
 * ★ REWRITTEN 2026-08-26 UNDER BULLETIN 2 #5: THE BLENDED TABLE IS GONE FROM
 * THIS FILE. `medicare_locality_cpt_rate` holds ONE row per (state, cpt) whose
 * value is the unweighted mean across that state's localities wearing one
 * city's stale name — measured on the war-room board: this host printed 45378
 * office at $422.96 while the app printed Sacramento's real $417.65, so the
 * two hosts David presents from disagreed about the same code. The read is now
 * `_fixed` at LOCALITY grain, one locality picked the same way the app picks
 * it (exact CBSA crosswalk first, then the CA default, then "rest of", each
 * step NAMED on the result), and the max-total-RVU row within the locality so
 * a component price can never stand in for the whole service. One table, one
 * picker, two hosts, one number.
 */
export async function medicareAnchor(
  cpt: string,
  state: string,
  geo?: { cbsa?: string },
): Promise<MedicareAnchor | null> {
  const sb = serviceClient();
  const { data, error } = await sb
    .from("medicare_locality_cpt_rate_fixed")
    .select("nonfac_rate, fac_rate, year, locality, locality_name, work_rvu, pe_rvu_nonfac, mp_rvu")
    .eq("cpt", cpt)
    .eq("state", state);

  /* An error is not an empty: a failed read renders as "no anchor", never as a
     dollar, and the caller's copy owns the honest absence sentence. */
  if (error || !data?.length) return null;

  type Row = Record<string, unknown>;
  const rows = data as Row[];
  const totalRvu = (r: Row) =>
    (num(r.work_rvu) ?? 0) + (num(r.pe_rvu_nonfac) ?? 0) + (num(r.mp_rvu) ?? 0);

  const localities = Array.from(new Set(rows.map((r) => String(r.locality ?? ""))));
  let chosen: string | null = null;
  let basis: MedicareAnchor["basis"] = "matched";

  /* An exact CBSA wins: the crosswalk cannot collide the way a name can. */
  if (geo?.cbsa) {
    const code = caLocalityCodeFor(geo.cbsa);
    if (code) chosen = localities.find((l) => l.trim() === code) ?? null;
  }
  /* The app's CA default is Sacramento, printed, never silent. */
  if (chosen === null && state.trim().toUpperCase() === "CA") {
    chosen = localities.find((l) => l.trim() === CA_DEFAULT_LOCALITY) ?? null;
    if (chosen !== null) basis = "state_default";
  }
  if (chosen === null) {
    chosen =
      localities.find((l) => {
        const nm = String(rows.find((r) => String(r.locality ?? "") === l)?.locality_name ?? "");
        return /^rest of/i.test(nm.trim());
      }) ?? null;
    if (chosen !== null) basis = "rest_of";
  }
  if (chosen === null) {
    chosen = [...localities].sort()[0] ?? null;
    basis = "arbitrary";
  }

  const pool = rows.filter((r) => String(r.locality ?? "") === chosen);
  const row = (pool.length ? pool : rows).reduce((best, r) => (totalRvu(r) > totalRvu(best) ? r : best));

  const nonFac = num(row.nonfac_rate);
  const fac = num(row.fac_rate);
  if (nonFac == null && fac == null) return null;

  return {
    nonFacility: nonFac,
    facility: fac,
    year: (row.year as number | null) ?? null,
    locality: (row.locality as string | null) ?? null,
    localityName: (row.locality_name as string | null) ?? null,
    basis,
  };
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
        const medicare = await medicareAnchor(cpt, geo.state, { cbsa: geo.cbsa });
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

      // The metro's OWN count travels with the rejection. It is the whole sentence:
      // "Sacramento has 17 filings and we need 100" is checkable; "thin data" is not.
      fellBackFrom = {
        metro: geo.metroName ?? geo.cbsa,
        reason: verdict.reason,
        n: data.n ?? null,
        need: N_MINIMUM,
      };
    } else {
      // No row at all for this metro and code. Different fact from a row that was
      // too thin, and the surface is required to say the two differently.
      fellBackFrom = {
        metro: geo.metroName ?? geo.cbsa,
        reason: "missing_percentile",
        n: null,
        need: N_MINIMUM,
      };
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

  const medicare = await medicareAnchor(cpt, geo.state, { cbsa: geo.cbsa });

  /**
   * ⛔ THE SCALING PATH IS DEAD. DO NOT REBUILD IT.
   *
   * There used to be a PATH#2 here. When a metro's own cell was too thin to publish,
   * it took the CALIFORNIA state distribution, multiplied every percentile by that
   * metro's price index, and returned the product under the METRO's name, labelled
   * "Localized estimate". The index itself is measured, and that is exactly what made
   * it dangerous: a measured multiplier applied to a real number still produces a
   * number nobody filed. metro-index.ts states the assumption in its own words - "a
   * metro that runs 12% under its state on the fifteen services we can see is assumed
   * to run 12% under on the sixteenth". Assumed. That is an estimate, and HARD RULE 1
   * does not have an exception for a well-built one.
   *
   * It shipped a specific lie. `/rates/sacramento-ca/standard-office-visit` printed
   * $84.79 under the H1 "Standard office visit cost in Sacramento, CA", computed as
   * California's $75.97 x 1.1161. Sacramento holds 17 filings for that code. The home
   * page of this same site refused the identical cell and said so. One product, two
   * answers, and the one that spoke with a city's name on it was the invented one.
   *
   * KILLED 2026-08-26 under David's 08-24 order 6. The fall-through below is the whole
   * fix: when a metro cannot answer, CALIFORNIA answers, California is what the page
   * says, and `fellBackFrom` carries the metro's real count so the page can print the
   * reason as a number. A page that names a city now holds that city's own filings.
   */

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
/* ★ THE STORED PLACEHOLDER THAT RENDERED AS A VALUE, 2026-08-26.
   `/methodology` was printing "Current corpus: Coverage date: not yet stamped"
   to anyone who scrolled, and `/api/lookup` was handing the same string to every
   caller in JSON. Nothing was wrong with either page: the SENTINEL IS THE STORED
   DATA. All ELEVEN headline rows in `data_manifest`, back to 2026-07-18, carry
   `coverage_label = "Coverage date: not yet stamped"`. It has never been stamped.

   The same string renders three times on the app's paid client exhibit. This is
   the shared root, and it is a data fix, not a copy fix: the label needs writing
   by whoever owns the corpus build. Until then the code refuses to repeat it,
   because a placeholder rendered where a fact belongs is a fabrication with
   extra steps, and this one sits under the word "corpus" on the methodology page.

   `built_at` IS real and stays: 2026-07-30 on the current headline row. So the
   honest answer is not silence, it is the fact we actually hold, labelled for
   exactly what it is. Callers get `label: null` and render their empty state. */
const UNSTAMPED = /not yet stamped|^\s*$|^n\/?a$|^tbd$|^unknown$|^null$|^undefined$/i;

export async function freshness(): Promise<{ builtAt: string | null; label: string | null }> {
  const sb = serviceClient();
  const { data } = await sb
    .from("data_manifest")
    .select("built_at, coverage_label")
    .eq("is_headline", true)
    .order("built_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const raw = data?.coverage_label ?? null;
  const label = raw && !UNSTAMPED.test(raw.trim()) ? raw : null;
  return { builtAt: data?.built_at ?? null, label };
}

export const revalidate = FRESHNESS_TTL;

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
