// Proves the attribution rule fixes the California payer list.
import { readFileSync } from 'node:fs';
const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const get = k => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const U = get('NEXT_PUBLIC_SUPABASE_URL'), K = get('SUPABASE_SERVICE_ROLE_KEY');
const H = { apikey: K, Authorization: 'Bearer ' + K };

const HOME = { uhc_national:'national', aetna_national:'national', cigna_national:'national', centene:'national',
  anthembcca:'CA', bsca:'CA', empirebcbs:'NY', anthembcbsct:'CT', anthembcbsga:'GA', anthembcbsin:'IN',
  anthembcbsky:'KY', anthembcbsme:'ME', anthembcbsmo:'MO', anthembcbsnh:'NH', anthembcbsnv:'NV',
  anthembcbsoh:'OH', anthembcbsva:'VA', anthembcbswi:'WI', anthembcbsco:'CO', bcbsil:'IL', bcbstx:'TX',
  bcbsok:'OK', bcbsnm:'NM', bcbsmt:'MT', bcbst_tn:'TN', florida_blue:'FL', highmark_pa:'PA', ibx_pa:'PA', horizon_nj:'NJ' };
const num = v => v==null?null:(Number.isFinite(Number(v))?Number(v):null);
const $ = v => v==null?'—':'$'+Math.round(v).toLocaleString();
const judge = r => { const p25=num(r.p25),p50=num(r.p50),p75=num(r.p75);
  if(p25==null||p50==null||p75==null) return 'missing';
  if(p25<5||p50<5) return 'contaminated';
  if(!(p25<=p50&&p50<=p75)) return 'unordered';
  if((r.n??0)<100) return 'thin'; return null; };

for (const [state, cpt] of [['CA','70553'], ['TX','73721'], ['NY','45378']]) {
  const r = await fetch(`${U}/rest/v1/payer_cpt_state_stats?state=eq.${state}&cpt=eq.${cpt}&select=payer,n,p25,p50,p75,p90,modal_share&order=n.desc&limit=60`, {headers:H});
  const rows = await r.json();
  console.log(`\n=== ${state} · CPT ${cpt} ===`);
  const kept=[]; let outOfState=0, contaminated=0;
  for (const x of rows) {
    const home = HOME[x.payer] ?? 'unknown';
    if (home !== 'national' && home !== 'unknown' && home !== state) { outOfState++; continue; }
    const bad = judge(x); if (bad) { contaminated++; continue; }
    kept.push(x);
  }
  if (!kept.length) console.log('  (no in-market payer survives — honest empty state)');
  for (const x of kept.slice(0,8)) {
    const flat = Number(x.modal_share) >= 0.6 ? '  [flat schedule]' : '';
    console.log(`  ${x.payer.padEnd(18)} ${$(num(x.p50)).padStart(8)}   n=${String(x.n).padStart(6)}${flat}`);
  }
  console.log(`  -> ${kept.length} in-market · ${outOfState} out-of-state excluded · ${contaminated} contaminated suppressed`);
}
