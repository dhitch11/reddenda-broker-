#!/usr/bin/env node
/**
 * scripts/measure-coverage.mjs — WHAT EACH SCALE NUMBER ACTUALLY COUNTS.
 *
 * WHY THIS EXISTS. On 2026-08-26 QA reconciled every scale number rendered on both
 * hosts and found four different values describing what looked like one thing:
 * 918 metros on /tools, 928 on /rates, 668 the broker API can answer for, and a
 * services count that was 39 in the public picker and 73 in the console basket.
 * None of them was fabricated. They are DIFFERENT REAL FACTS - the corpus, the
 * pages we publish, the cells that survive the honesty filter, the picker - and
 * the defect was that no rendered surface said which was which.
 *
 * "918 indexed, 668 reportable" is a stronger sentence than either number alone,
 * and it is the same move that makes the refusal ledger work. But a sentence like
 * that is only worth printing if the numbers in it are MEASURED, so this script
 * measures them and writes them to a generated module with the date attached.
 *
 * TYPED-IN NUMBERS ARE HOW /rates ENDED UP CLAIMING 928 AFTER THE CORPUS MOVED.
 * These are computed. And every one of them renders beside the date it was taken,
 * because a count of what survives a filter is true on a day, not forever.
 *
 * Run: node scripts/measure-coverage.mjs   (writes src/lib/coverage-measured.ts)
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  // An unanswerable question about coverage is not a pass. Same rule as the pricing guard.
  console.error("NO CREDENTIAL. Cannot measure coverage; refusing to write a stale file.");
  process.exit(2);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

/* The honesty filter, mirrored from src/lib/honesty.ts. Kept in step by the
   assertion below rather than by hope: if a threshold moves there and not here,
   this script stops rather than reporting a count against the wrong gate. */
const DOLLAR_FLOOR = 5, N_MINIMUM = 100, MAX_SPREAD_RATIO = 25;
const honesty = fs.readFileSync(path.join(root, "src/lib/honesty.ts"), "utf8");
for (const [name, want] of [["DOLLAR_FLOOR", DOLLAR_FLOOR], ["N_MINIMUM", N_MINIMUM], ["MAX_SPREAD_RATIO", MAX_SPREAD_RATIO]]) {
  const m = honesty.match(new RegExp(`${name}\\s*=\\s*(\\d+)`));
  if (!m || Number(m[1]) !== want) {
    console.error(`THRESHOLD DRIFT: honesty.ts ${name}=${m?.[1]} but this script assumes ${want}. Fix both.`);
    process.exit(1);
  }
}
const num = (v) => (v == null ? null : typeof v === "number" ? v : Number(v));
function passes({ p25, p50, p75, n }) {
  p25 = num(p25); p50 = num(p50); p75 = num(p75);
  if (p25 == null || p50 == null || p75 == null) return false;
  if (p25 < DOLLAR_FLOOR || p50 < DOLLAR_FLOOR) return false;
  if (!(p25 <= p50 && p50 <= p75)) return false;
  if (p25 > 0 && p75 / p25 > MAX_SPREAD_RATIO) return false;
  return (n ?? 0) >= N_MINIMUM;
}

const catalogSrc = fs.readFileSync(path.join(root, "src/lib/catalog.ts"), "utf8");
const CPTS = [...new Set([...catalogSrc.matchAll(/\{\s*cpt:\s*"(\d{4,5}[A-Z]?)"/g)].map((m) => m[1]))];
const metroSrc = fs.readFileSync(path.join(root, "src/lib/metros.ts"), "utf8");
const CBSAS = [...new Set([...metroSrc.matchAll(/cbsa:\s*"(\d{5})"/g)].map((m) => m[1]))];
const STATE_OF = new Map(
  [...metroSrc.matchAll(/cbsa:\s*"(\d{5})",\s*name:\s*"[^"]*",\s*state:\s*"([A-Z]{2})"/g)].map((m) => [m[1], m[2]]),
);

/* ORDER BY IS NOT DECORATION HERE. The first version of this script paginated with
   .range() and no ordering, and two runs four minutes apart returned 838 vs 840
   metros and 17,378 vs 17,597 pages. PostgREST pages an UNORDERED result set, and
   an unordered set has no stable page boundary: rows repeat across pages and
   others are never returned at all. A number that changes when you measure it
   twice is not a measurement, and it was about to be rendered on a public page as
   one. Ordered by the primary key of the grain, both runs now agree exactly. */
async function pull(table, cols, keyCols) {
  let rows = [], from = 0;
  for (;;) {
    let q = sb.from(table).select(cols).in("cpt", CPTS);
    for (const c of keyCols) q = q.order(c, { ascending: true });
    const { data, error } = await q.range(from, from + 999);
    if (error) { console.error(`QUERY FAILED on ${table}: ${error.message}`); process.exit(1); }
    rows = rows.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

const metroRows = await pull("cpt_peer_stats_cbsa", "cbsa, cpt, p25, p50, p75, n", ["cbsa", "cpt"]);
const stateRows = await pull("cpt_peer_stats", "state, cpt, p25, p50, p75, n", ["state", "cpt"]);

/* The table holds more than one row per (cbsa, cpt) - 5,791 of 23,596 keys on the
   day this was written - so counting rows would overcount pages. Deduped by key.
   Checked at the same time: zero keys where the duplicates disagree on pass/fail,
   so this is duplication and not a contradiction. `marketRate()` takes .limit(1)
   with no ORDER BY, which is only safe BECAUSE they agree. */
const published = new Set(CBSAS);
const byKey = new Map();
let disagree = 0;
for (const r of metroRows) {
  const k = `${r.cbsa}|${r.cpt}`;
  const ok = passes(r);
  if (byKey.has(k) && byKey.get(k) !== ok) disagree++;
  if (!byKey.has(k) || ok) byKey.set(k, ok);
}
const answeringByCbsa = new Map();
for (const [k, ok] of byKey) {
  const [cbsa] = k.split("|");
  if (!ok || !published.has(cbsa)) continue;
  answeringByCbsa.set(cbsa, (answeringByCbsa.get(cbsa) ?? 0) + 1);
}
const okStates = new Set();
for (const r of stateRows) if (passes(r)) okStates.add(String(r.state));

const cells = [...answeringByCbsa.values()].reduce((a, b) => a + b, 0);
const out = {
  measuredAt: new Date().toISOString().slice(0, 10),
  publishedMetros: CBSAS.length,
  pickerServices: CPTS.length,
  publishedPages: CBSAS.length * CPTS.length,
  metrosAnsweringLocally: answeringByCbsa.size,
  metroServicePagesAnsweringLocally: cells,
  statesAnswering: okStates.size,
  duplicateVerdictConflicts: disagree,
};
if (disagree > 0) {
  console.error(`REFUSING TO WRITE: ${disagree} (cbsa,cpt) keys whose duplicate rows DISAGREE on pass/fail.`);
  console.error("marketRate() takes .limit(1) with no ORDER BY, so the rendered figure would be arbitrary. Fix the data.");
  process.exit(1);
}

const file = `/**
 * GENERATED by scripts/measure-coverage.mjs. Do not hand-edit.
 *
 * What each of these counts, exactly, because four numbers describing "how much
 * data do you have" is how /rates ended up claiming 928 after the corpus moved.
 * Every figure here is rendered NEXT TO \`measuredAt\`: a count of what survives
 * the honesty filter is true on a day, not forever.
 */
export const MEASURED_COVERAGE = ${JSON.stringify(out, null, 2)} as const;
`;
fs.writeFileSync(path.join(root, "src/lib/coverage-measured.ts"), file);
console.log(JSON.stringify(out, null, 2));
console.log("\nwrote src/lib/coverage-measured.ts");
