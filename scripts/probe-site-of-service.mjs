// @BROKER-MARKETING probe. Read-only. Answers a product question before a page is written.
//
// THE QUESTION
// The marketing handoff says "Medicare carries a real site-of-service split" and
// cites colonoscopy ($423 office vs $170 facility) and an office visit ($148 vs $88).
// Both true. But the data-path verification also printed MRI brain at office $361
// and facility $361, identical, and MRI knee at $233 / $233.
//
// If the split is only real for some of the basket, then a site-of-service page
// built across the whole basket would show a dozen rows of "no difference" and
// teach a broker that site of service does not matter, which is the opposite of
// the truth and the opposite of what we are selling.
//
// So: measure which services actually carry a split, before designing the module.
// Never build a screen whose content you have not counted.

import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();
const BASE = get("NEXT_PUBLIC_SUPABASE_URL");
const KEY = get("SUPABASE_SERVICE_ROLE_KEY");
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

// The broker basket, read straight out of the tools lane's catalog so this probe
// cannot drift from what the product actually offers.
const catalog = readFileSync(new URL("../src/lib/catalog.ts", import.meta.url), "utf8");
const SERVICES = [...catalog.matchAll(/\{\s*cpt:\s*"(\d+)",\s*name:\s*"([^"]+)",\s*plain:\s*"([^"]+)"/g)].map(
  (m) => ({ cpt: m[1], name: m[2], plain: m[3] }),
);

const STATES = ["CA", "TX", "NY", "FL", "IL"];

async function q(table, params) {
  const r = await fetch(`${BASE}/rest/v1/${table}?${params}`, { headers: H });
  if (!r.ok) throw new Error(`${table} ${r.status} ${await r.text()}`);
  return r.json();
}

const num = (v) => (v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null);
const $ = (v) => (v == null ? "n/a" : "$" + Math.round(v).toLocaleString());

console.log(`\nSITE OF SERVICE . Medicare nonfac vs fac across the ${SERVICES.length}-service basket`);
console.log("Averaged over " + STATES.join(", ") + ". A split is REAL when fac and nonfac differ.\n");

const rows = [];

for (const s of SERVICES) {
  const data = await q(
    "medicare_locality_cpt_rate",
    `cpt=eq.${s.cpt}&state=in.(${STATES.join(",")})&select=state,nonfac_rate,fac_rate`,
  );
  const pairs = data
    .map((d) => ({ nf: num(d.nonfac_rate), f: num(d.fac_rate) }))
    .filter((p) => p.nf != null && p.f != null);

  if (!pairs.length) {
    rows.push({ ...s, verdict: "NO MEDICARE ROW", nf: null, f: null, gap: null });
    continue;
  }

  const nf = pairs.reduce((a, p) => a + p.nf, 0) / pairs.length;
  const f = pairs.reduce((a, p) => a + p.f, 0) / pairs.length;
  const identical = pairs.every((p) => Math.abs(p.nf - p.f) < 0.01);
  const gap = nf > 0 ? (nf - f) / nf : 0;

  rows.push({
    ...s,
    nf,
    f,
    gap,
    verdict: identical ? "IDENTICAL" : gap > 0.15 ? "REAL SPLIT" : "MARGINAL",
  });
}

const w = (s, n) => String(s).padEnd(n);
console.log(w("CPT", 8) + w("SERVICE", 30) + w("OFFICE", 11) + w("FACILITY", 11) + w("GAP", 9) + "VERDICT");
console.log("-".repeat(88));

for (const r of rows.sort((a, b) => (b.gap ?? -1) - (a.gap ?? -1))) {
  console.log(
    w(r.cpt, 8) +
      w(r.plain.slice(0, 28), 30) +
      w($(r.nf), 11) +
      w($(r.f), 11) +
      w(r.gap == null ? "-" : (r.gap * 100).toFixed(0) + "%", 9) +
      r.verdict,
  );
}

const real = rows.filter((r) => r.verdict === "REAL SPLIT");
const identical = rows.filter((r) => r.verdict === "IDENTICAL");
const marginal = rows.filter((r) => r.verdict === "MARGINAL");
const missing = rows.filter((r) => r.verdict === "NO MEDICARE ROW");

console.log("\n" + "=".repeat(88));
console.log(`REAL SPLIT (>15% cheaper in facility) : ${real.length} of ${rows.length}`);
console.log(`MARGINAL                              : ${marginal.length}`);
console.log(`IDENTICAL (no site effect at all)     : ${identical.length}`);
console.log(`NO MEDICARE ROW                       : ${missing.length}`);
console.log("=".repeat(88));
console.log("\nPRODUCT RULE THIS SETS:");
console.log("The site-of-service module may only list services in the REAL SPLIT set.");
console.log("Listing an IDENTICAL service teaches a broker the opposite of the truth.\n");
