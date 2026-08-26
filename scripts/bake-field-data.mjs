/**
 * BAKE THE PRICE FIELD. @BROKER-MARKETING, 2026-08-26. M2 of the marketing rebuild.
 *
 * Writes public/field-data.json: the data behind the hero canvas. Every value is
 * read from the live tables at bake time; nothing is estimated and nothing is
 * fabricated. The canvas renders empty ink if this file is absent, so the bake
 * REFUSES to write a partial file.
 *
 * WHAT THE FILE HOLDS, AND WHY EACH PIECE IS HONEST:
 *   counties  Every U.S. county centroid from geo_counties (real lat/lng, real
 *             population, USPS state). The same spine reddenda.health's hero
 *             runs on.
 *   states    Per-state Medicare-allowed averages for CPT 45378 (diagnostic
 *             colonoscopy), OFFICE setting, from cms_geo_service_puf. 45378 and
 *             not 99214, because the broker hero's featured example is the
 *             45378 site-of-care trio: ONE code on ONE dollar axis, never two
 *             grains mixed. The 2024 data_year rides in meta and is printed.
 *   trio      The Sacramento site-of-care totals for the same code, from the
 *             SAME queries the hero panel runs (locality-63 PFS 2026 + national
 *             OPPS/ASC 2026-Q3). Vintages differ from the PUF and BOTH are
 *             labelled on the canvas; an axis that mixed vintages silently
 *             would be a lie drawn in pixels.
 *
 * RUN:  node --env-file=.env.local scripts/bake-field-data.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("bake-field: credentials not set. Nothing written.");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const CPT = "45378";

/* cms_geo_service_puf keys states by full name; geo_counties uses USPS codes. */
const ABBR = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO",
  Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY",
  Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH",
  "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

const fail = (what, err) => {
  console.error(`bake-field: ${what} failed${err ? `: ${err.message}` : ""}. Nothing written.`);
  process.exit(1);
};

/* Counties: page past the PostgREST row cap explicitly. */
const pages = await Promise.all(
  [0, 1, 2, 3].map((p) =>
    sb
      .from("geo_counties")
      .select("lat, lng, population, state")
      .order("county_fips", { ascending: true })
      .range(p * 1000, p * 1000 + 999),
  ),
);
if (pages.some((p) => p.error)) fail("geo_counties", pages.find((p) => p.error)?.error);
const rows = pages.flatMap((p) => p.data ?? []);
if (rows.length < 3000) fail(`geo_counties returned only ${rows.length} rows`);
const counties = rows
  .filter((r) => r.lat != null && r.lng != null)
  .map((r) => [Math.round(r.lat * 100) / 100, Math.round(r.lng * 100) / 100, r.population || 0, r.state || ""]);

/* State Medicare-allowed averages, office setting, same code as the trio. */
const bench = await sb
  .from("cms_geo_service_puf")
  .select("geo_desc, avg_mdcr_alowd_amt, data_year")
  .eq("geo_level", "State")
  .eq("hcpcs_cd", CPT)
  .eq("place_of_srvc", "O")
  .limit(100);
if (bench.error || !bench.data?.length) fail("cms_geo_service_puf", bench.error);
const states = {};
let pufYear = null;
for (const b of bench.data) {
  const code = ABBR[b.geo_desc];
  const v = Number(b.avg_mdcr_alowd_amt);
  if (code && v > 0) {
    states[code] = Math.round(v * 100) / 100;
    pufYear = b.data_year ?? pufYear;
  }
}
if (Object.keys(states).length < 40) fail(`only ${Object.keys(states).length} state benchmarks`);

/* The trio, from the same tables the hero panel reads. Full-RVU line by ORDER BY,
   zero-as-packaged, totals refused past a missing leg: the same laws as
   src/lib/landing-data.ts, restated here because a canvas label that disagreed
   with the panel beside it would be the worst pixel on the page. */
const [pfs, opps, asc] = await Promise.all([
  sb
    .from("medicare_locality_cpt_rate_fixed")
    .select("nonfac_rate, fac_rate, year, locality_name")
    .eq("cpt", CPT)
    .eq("state", "CA")
    .eq("locality", "63")
    .order("work_rvu", { ascending: false })
    .limit(1),
  sb.from("opps_hcpcs_apc_crosswalk").select("payment_rate, quarter").eq("hcpcs", CPT).limit(1).maybeSingle(),
  sb.from("asc_payment_rates").select("payment_rate, quarter").eq("hcpcs", CPT).limit(1).maybeSingle(),
]);
if (pfs.error || !pfs.data?.length) fail("PFS locality 63", pfs.error);
if (opps.error || opps.data == null) fail("OPPS", opps.error);
if (asc.error || asc.data == null) fail("ASC", asc.error);

const round2 = (v) => Math.round(v * 100) / 100;
const office = Number(pfs.data[0].nonfac_rate);
const professional = Number(pfs.data[0].fac_rate);
const oppsFee = Number(opps.data.payment_rate) > 0 ? Number(opps.data.payment_rate) : null;
const ascFee = Number(asc.data.payment_rate) > 0 ? Number(asc.data.payment_rate) : null;
if (!(office > 0) || !(professional > 0) || oppsFee == null || ascFee == null) {
  fail("trio has a missing leg; refusing to bake a partial axis");
}

const fieldData = {
  bakedAt: new Date().toISOString().slice(0, 10),
  counties,
  states,
  trio: {
    office: round2(office),
    asc: round2(professional + ascFee),
    hopd: round2(professional + oppsFee),
    locality: "Sacramento locality 63",
    pfsYear: pfs.data[0].year ?? null,
    facilityVintage: opps.data.quarter ?? asc.data.quarter ?? null,
  },
  meta: {
    cpt: CPT,
    name: "Diagnostic colonoscopy",
    pufYear,
    source: "geo_counties + cms_geo_service_puf + CMS fee schedules, read at bake",
  },
};

writeFileSync(new URL("../public/field-data.json", import.meta.url), JSON.stringify(fieldData) + "\n");
console.log(
  `bake-field: ${counties.length} counties · ${Object.keys(states).length} state benchmarks (${pufYear}) · trio ${fieldData.trio.office}/${fieldData.trio.asc}/${fieldData.trio.hopd}`,
);
