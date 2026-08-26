/**
 * BAKE THE LANDING FIXTURE. @BROKER-MARKETING, 2026-08-26.
 *
 * WHY THIS EXISTS. On 2026-08-26 the live homepage rendered its proof row as four
 * "Unavailable" tiles and its hero card as a refusal, in front of the exact
 * audience the page was built for. The data was fine: the same queries answered
 * in 200ms with real rows from this repo. The deploy's environment could not
 * reach the tables, and the page had no second source, so the page about
 * printing the number printed none.
 *
 * THE FIX IS THE reddenda.health PATTERN: a deploy-time bake of REAL QUERIED
 * ROWS, committed to the repo, that the page falls back to only when the live
 * read fails. The fixture stores RAW ROWS, not computed answers, so
 * src/lib/landing-data.ts runs its one compute path over either source and the
 * two can never drift. Every value in the fixture came out of the published
 * tables and carries the table's own vintage; `bakedAt` records when WE read it,
 * and is never printed as a filing date.
 *
 * RUN:  node --env-file=.env.local scripts/bake-landing-fixture.mjs
 * The queries here mirror src/lib/landing-data.ts. If you change the basket, the
 * code, the locality or the columns THERE, change them HERE in the same commit.
 *
 * THE BAKE REFUSES TO WRITE A PARTIAL FIXTURE. A fixture with an empty branch
 * would just relocate the four-Unavailable failure to a different day.
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("bake: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. Nothing written.");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

/* Mirrors SACRAMENTO and BASKET in src/lib/landing-data.ts. */
const CARE = { cpt: "45378", state: "CA", locality: "63" };
const LEDGER = { cbsa: "40900", metro: "Sacramento" };
const BASKET = ["99213", "99214", "70553", "45378", "29881", "66984"];

const [pfs, opps, asc, ledger, cPfs, cOpps, cAsc] = await Promise.all([
  sb
    .from("medicare_locality_cpt_rate_fixed")
    .select("nonfac_rate, fac_rate, year, locality, locality_name, work_rvu, status_code")
    .eq("cpt", CARE.cpt)
    .eq("state", CARE.state)
    .eq("locality", CARE.locality)
    .order("work_rvu", { ascending: false })
    .limit(4),
  sb
    .from("opps_hcpcs_apc_crosswalk")
    .select("payment_rate, status_indicator, year, quarter, source_file")
    .eq("hcpcs", CARE.cpt)
    .limit(1)
    .maybeSingle(),
  sb
    .from("asc_payment_rates")
    .select("payment_rate, year, quarter, source_file")
    .eq("hcpcs", CARE.cpt)
    .limit(1)
    .maybeSingle(),
  sb
    .from("cpt_peer_stats_cbsa")
    .select("cpt, p25, p50, p75, p90, n, updated_at")
    .eq("cbsa", LEDGER.cbsa)
    .in("cpt", BASKET),
  sb.from("medicare_locality_cpt_rate").select("*", { count: "exact", head: true }),
  sb.from("opps_hcpcs_apc_crosswalk").select("*", { count: "exact", head: true }),
  sb.from("asc_payment_rates").select("*", { count: "exact", head: true }),
]);

const fail = (what, err) => {
  console.error(`bake: ${what} failed${err ? `: ${err.message}` : ""}. Nothing written.`);
  process.exit(1);
};
if (pfs.error || !pfs.data?.length) fail("physician fee query", pfs.error);
if (opps.error || opps.data == null) fail("OPPS query", opps.error);
if (asc.error || asc.data == null) fail("ASC query", asc.error);
if (ledger.error || !ledger.data?.length) fail("refusal-ledger query", ledger.error);
if (cPfs.error || cOpps.error || cAsc.error) fail("scale counts", cPfs.error ?? cOpps.error ?? cAsc.error);

const fixture = {
  /* When WE read the tables. Rendered only as our own read date, never as a filing date. */
  bakedAt: new Date().toISOString().slice(0, 10),
  care: { ...CARE, pfsRows: pfs.data, opps: opps.data, asc: asc.data },
  ledger: { ...LEDGER, rows: ledger.data },
  counts: { pfs: cPfs.count ?? null, opps: cOpps.count ?? null, asc: cAsc.count ?? null },
};

writeFileSync(new URL("../src/lib/landing-fixture.json", import.meta.url), JSON.stringify(fixture, null, 2) + "\n");
console.log(
  `bake: wrote landing-fixture.json · pfs rows ${pfs.data.length} · ledger rows ${ledger.data.length} · counts ${fixture.counts.pfs}/${fixture.counts.opps}/${fixture.counts.asc}`,
);
