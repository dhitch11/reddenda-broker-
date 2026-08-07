// Real data coverage sweep. Which CPT x state combinations return honest, usable distributions?
// Zero fabrication: we record exactly what the live API returns, including failures.
import { writeFileSync } from 'node:fs';

const CPTS = [
  ['70450','CT head w/o contrast','imaging'], ['70553','MRI brain w/ and w/o contrast','imaging'],
  ['71250','CT chest w/o contrast','imaging'], ['72148','MRI lumbar spine w/o contrast','imaging'],
  ['73721','MRI lower extremity joint w/o contrast','imaging'], ['74177','CT abdomen + pelvis w/ contrast','imaging'],
  ['76700','Ultrasound abdomen complete','imaging'], ['77067','Screening mammography bilateral','imaging'],
  ['93306','Echocardiogram complete','cardiac'], ['93000','EKG w/ interpretation','cardiac'],
  ['29881','Knee arthroscopy w/ meniscectomy','surgery'], ['45378','Diagnostic colonoscopy','surgery'],
  ['45380','Colonoscopy w/ biopsy','surgery'], ['43239','Upper GI endoscopy w/ biopsy','surgery'],
  ['66984','Cataract surgery w/ IOL','surgery'], ['27447','Total knee replacement','surgery'],
  ['27130','Total hip replacement','surgery'], ['47562','Laparoscopic cholecystectomy','surgery'],
  ['49505','Inguinal hernia repair','surgery'], ['62323','Epidural injection lumbar','pain'],
  ['64483','Transforaminal epidural lumbar','pain'], ['20610','Major joint injection','pain'],
  ['80053','Comprehensive metabolic panel','lab'], ['80061','Lipid panel','lab'],
  ['85025','Complete blood count w/ diff','lab'], ['84443','TSH','lab'], ['81001','Urinalysis w/ microscopy','lab'],
  ['99213','Office visit established 20-29 min','em'], ['99214','Office visit established 30-39 min','em'],
  ['99203','Office visit new 30-44 min','em'], ['99204','Office visit new 45-59 min','em'],
  ['99283','ER visit moderate','em'], ['99285','ER visit high severity','em'],
  ['97110','Therapeutic exercise','pt'], ['98940','Chiropractic manipulation 1-2 regions','pt'],
  ['59400','Vaginal delivery global','ob'], ['59510','Cesarean delivery global','ob'],
  ['95810','Sleep study attended','other'], ['90837','Psychotherapy 60 min','behavioral'],
  ['90834','Psychotherapy 45 min','behavioral'],
];
const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

const BASE = 'https://reddenda.com/api/rate-benchmark';
const CONC = 6;
const out = [];
let done = 0;

async function one(cpt, meta, state) {
  const url = `${BASE}?cpt=${cpt}&state=${state}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) return { cpt, state, ok: false, reason: `http_${r.status}` };
    const d = await r.json();
    if (!d.ok || !d.found) return { cpt, state, ok: false, reason: 'not_found' };
    const b = d.benchmark || {};
    const { p25, p50, p75 } = b;
    // Honesty checks. A distribution we would not show a customer.
    const flags = [];
    if (p25 == null || p50 == null || p75 == null) flags.push('null_percentile');
    if (p25 != null && p25 < 5) flags.push('p25_implausibly_low');
    if (p50 != null && p50 < 5) flags.push('p50_implausibly_low');
    if (p25 && p75 && p75 / p25 > 25) flags.push('spread_gt_25x');
    if (d.sample_n != null && d.sample_n < 300) flags.push('thin_sample');
    if (p25 != null && p50 != null && p25 > p50) flags.push('percentiles_out_of_order');
    if (!d.description) flags.push('no_description');
    return {
      cpt, state, ok: true, category: meta[2], label: meta[1],
      desc: d.description || null, p25, p50, p75,
      medicare: d.medicare ?? null, pct_medicare: d.pct_of_medicare ?? null,
      n: d.sample_n ?? null, updated: d.updated_at ?? null,
      spread: (p25 && p75) ? Math.round((p75 / p25) * 100) / 100 : null,
      flags, clean: flags.length === 0,
    };
  } catch (e) { return { cpt, state, ok: false, reason: String(e.message || e).slice(0, 80) }; }
}

const jobs = [];
for (const c of CPTS) for (const s of STATES) jobs.push([c[0], c, s]);
console.log(`sweeping ${jobs.length} combinations at concurrency ${CONC}`);

let idx = 0;
async function worker() {
  while (idx < jobs.length) {
    const j = jobs[idx++];
    out.push(await one(j[0], j[1], j[2]));
    if (++done % 200 === 0) console.log(`  ${done}/${jobs.length}`);
  }
}
await Promise.all(Array.from({ length: CONC }, worker));

writeFileSync('/Users/user/reddenda-broker/data/coverage.json', JSON.stringify(out, null, 1));
const ok = out.filter(r => r.ok);
const clean = ok.filter(r => r.clean);
console.log(`\n=== SWEEP COMPLETE ===`);
console.log(`total ${out.length} | found ${ok.length} | CLEAN ${clean.length} | flagged ${ok.length - clean.length} | failed ${out.length - ok.length}`);
const fc = {};
for (const r of ok) for (const f of r.flags) fc[f] = (fc[f] || 0) + 1;
console.log('flag counts:', JSON.stringify(fc));
const byState = {};
for (const r of clean) byState[r.state] = (byState[r.state] || 0) + 1;
console.log('clean CPTs per state (low 10):', Object.entries(byState).sort((a,b)=>a[1]-b[1]).slice(0,10));
const byCpt = {};
for (const r of clean) byCpt[r.cpt] = (byCpt[r.cpt] || 0) + 1;
console.log('clean states per CPT (low 10):', Object.entries(byCpt).sort((a,b)=>a[1]-b[1]).slice(0,10));
