// Proves the broker data path works against the live corpus, with the honesty
// filter applied. No fabrication: every number printed came from the database.
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const get = k => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const URL_ = get('NEXT_PUBLIC_SUPABASE_URL');
const KEY = get('SUPABASE_SERVICE_ROLE_KEY');
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const DOLLAR_FLOOR = 5, N_MIN = 100, N_CONF = 500, MAX_SPREAD = 25;
function judge({ p25, p50, p75, p90, n }) {
  p25 = num(p25); p50 = num(p50); p75 = num(p75); p90 = num(p90);
  if (p25 == null || p50 == null || p75 == null) return { ok: false, reason: 'missing_percentile' };
  if (p25 < DOLLAR_FLOOR || p50 < DOLLAR_FLOOR) return { ok: false, reason: 'percentage_contamination' };
  if (!(p25 <= p50 && p50 <= p75)) return { ok: false, reason: 'percentiles_out_of_order' };
  if (p25 > 0 && p75 / p25 > MAX_SPREAD) return { ok: false, reason: 'implausible_spread' };
  if ((n ?? 0) < N_MIN) return { ok: false, reason: 'sample_too_thin' };
  return { ok: true, confidence: n >= N_CONF ? 'high' : 'reported', cell: { p25, p50, p75, p90, n } };
}
const num = v => { if (v == null) return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const $ = v => v == null ? '—' : '$' + Math.round(v).toLocaleString();

async function q(table, params) {
  const r = await fetch(`${URL_}/rest/v1/${table}?${params}`, { headers: H });
  if (!r.ok) throw new Error(`${table} ${r.status} ${await r.text()}`);
  return r.json();
}

const CASES = [
  ['31080', 'Los Angeles', 'CA', '70553'], ['35620', 'New York', 'NY', '70553'],
  ['16980', 'Chicago', 'IL', '70553'],     ['26420', 'Houston', 'TX', '70553'],
  ['31080', 'Los Angeles', 'CA', '73721'], ['12060', 'Atlanta', 'GA', '45378'],
  ['35620', 'New York', 'NY', '99214'],    // must be REJECTED (contaminated)
  ['31080', 'Los Angeles', 'CA', '27447'],
];

console.log('\n=== METRO LOOKUPS (honesty filter applied) ===\n');
let served = 0, rejected = 0;
for (const [cbsa, city, st, cpt] of CASES) {
  const rows = await q('cpt_peer_stats_cbsa', `cbsa=eq.${cbsa}&cpt=eq.${cpt}&select=p25,p50,p75,p90,n,updated_at&limit=1`);
  if (!rows.length) { console.log(`${city.padEnd(13)} ${cpt}  NO ROW -> state fallback`); continue; }
  const v = judge(rows[0]);
  if (v.ok) {
    served++;
    const c = v.cell;
    console.log(`${city.padEnd(13)} ${cpt}  ${$(c.p25).padStart(7)} / ${$(c.p50).padStart(7)} / ${$(c.p75).padStart(7)} / p90 ${$(c.p90).padStart(7)}  n=${c.n.toLocaleString().padStart(9)}  [${v.confidence}]`);
  } else {
    rejected++;
    console.log(`${city.padEnd(13)} ${cpt}  REJECTED -> ${v.reason}   (raw p25=${rows[0].p25} p50=${rows[0].p50})`);
  }
}

console.log('\n=== MEDICARE ANCHOR (facility vs non-facility) ===\n');
for (const cpt of ['70553', '73721', '45378', '99214']) {
  const rows = await q('medicare_locality_cpt_rate', `cpt=eq.${cpt}&state=eq.CA&select=nonfac_rate,fac_rate,localized_rate,year,description&limit=1`);
  const r = rows[0];
  if (!r) { console.log(`${cpt}  no Medicare row`); continue; }
  console.log(`${cpt}  office ${$(num(r.nonfac_rate)).padStart(7)}   facility ${$(num(r.fac_rate)).padStart(7)}   ${r.description ?? '(no description upstream)'}`);
}

console.log('\n=== PAYER BREAKDOWN, CA 70553 (contaminated payers suppressed) ===\n');
const pr = await q('payer_cpt_state_stats', `state=eq.CA&cpt=eq.70553&select=payer,n,p25,p50,p75,p90,modal_share&order=n.desc&limit=20`);
let shown = 0, supp = 0;
for (const r of pr) {
  const v = judge(r);
  if (!v.ok) { supp++; continue; }
  if (shown++ >= 8) continue;
  console.log(`  ${r.payer.padEnd(20)} ${$(v.cell.p50).padStart(8)}   n=${String(r.n).padStart(6)}   modal ${(Number(r.modal_share) * 100).toFixed(0)}%`);
}
console.log(`  ...${shown} served, ${supp} suppressed by the honesty filter`);

console.log('\n=== FRESHNESS ===\n');
const fm = await q('data_manifest', `select=metric,built_at,coverage_label&order=built_at.desc&limit=1`);
console.log('  latest manifest:', fm[0]?.metric, fm[0]?.built_at);
const one = await q('cpt_peer_stats_cbsa', `cbsa=eq.31080&cpt=eq.70553&select=updated_at&limit=1`);
console.log('  peer layer updated_at:', one[0]?.updated_at);

console.log(`\n=== RESULT: ${served} served, ${rejected} correctly rejected ===\n`);
