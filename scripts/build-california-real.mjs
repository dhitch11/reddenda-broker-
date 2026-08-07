#!/usr/bin/env node
/**
 * build-california-real.mjs — pull the REAL California rate layer.
 *
 * ★ WHY CALIFORNIA IS DIFFERENT. David's requirement: the group being pitched is in Northern
 *   California / Greater Sacramento (CAHIP NorCal is in Citrus Heights, CBSA 40900). If a
 *   Sacramento broker in that room looks up THEIR OWN market, the numbers must behave like
 *   their market. That is the one place fabrication cannot beat truth, because the audience
 *   already knows the answer.
 *
 * So: every California metro resolves to REAL measured distributions. The other ~890 metros
 * resolve to the deterministic synthetic engine. One API, two sources, chosen internally.
 *
 * Source: `peer_rate_dist` — a real aggregate at (cpt, payer, cbsa) carrying p10..p90, n_npi,
 * modal_rate/modal_pct, is_scoreable and confidence. It already ships the quality signals, so
 * the honesty layer runs on REAL flags for California rather than seeded ones.
 *
 * PostgREST caps at 1000 rows silently, so everything here paginates until a short page.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const KEY = readFileSync(join(homedir(), '.reddenda-supabase-service-role'), 'utf8').trim()
const BASE = 'https://gjmytcxrvxqmcbvglgvw.supabase.co/rest/v1'
const OUT = join(import.meta.dirname, '..', 'src', 'demo', 'seed')

/* Every California CBSA present in the corpus, NorCal first. Real Census codes. */
const CA_METROS = [
  '40900', // Sacramento-Roseville-Folsom  ← the room
  '41860', // San Francisco-Oakland-Fremont
  '41940', // San Jose-Sunnyvale-Santa Clara
  '42220', // Santa Rosa-Petaluma
  '42100', // Santa Cruz-Watsonville
  '46700', // Vallejo
  '34900', // Napa
  '44700', // Stockton-Lodi
  '33700', // Modesto
  '46020', // Truckee-Grass Valley
  '17020', // Chico
  '39820', // Redding
  '39780', // Red Bluff
  '45000', // Susanville
  '21700', // Eureka-Arcata
  '18860', // Crescent City
  '17340', // Clearlake
  '46380', // Ukiah
  '43760', // Sonora
  '23420', // Fresno
  '47300', // Visalia
  '25260', // Hanford-Corcoran
  '32900', // Merced
  '12540', // Bakersfield-Delano
  '31080', // Los Angeles-Long Beach-Anaheim
  '40140', // Riverside-San Bernardino-Ontario
  '41740', // San Diego-Chula Vista-Carlsbad
  '37100', // Oxnard-Thousand Oaks-Ventura
  '42200', // Santa Maria-Santa Barbara
  '42020', // San Luis Obispo-Paso Robles
  '41500', // Salinas
  '20940', // El Centro
  '13860', // Bishop
  '23820', // Gardnerville Ranchos NV-CA
]

async function pull(path, label) {
  const rows = []
  for (let off = 0; ; off += 1000) {
    const res = await fetch(`${BASE}/${path}&limit=1000&offset=${off}`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
    if (!res.ok) throw new Error(`${label} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const page = await res.json()
    rows.push(...page)
    process.stdout.write(`\r  ${label}: ${rows.length}`)
    if (page.length < 1000) break
  }
  process.stdout.write(`\r  ${label}: ${rows.length}\n`)
  return rows
}

console.log('pulling REAL California rate layer…')

// Only codes the demo actually serves, so the payload stays small and every cell is usable.
const federal = JSON.parse(readFileSync(join(OUT, 'federal-catalog.json'), 'utf8'))
const codes = federal.catalog.map((c) => c.cpt)

const all = []
for (let i = 0; i < CA_METROS.length; i += 6) {
  const batch = CA_METROS.slice(i, i + 6)
  const rows = await pull(
    // ★ ORDER IS MANDATORY. PostgREST offset pagination without a stable sort can return
    //   OVERLAPPING pages, which duplicated payers in the first pull (Sacramento showed
    //   Anthem GA and Anthem KY twice each). Order by the natural key.
    `peer_rate_dist?cbsa=in.(${batch.join(',')})&select=cbsa,cbsa_name,cpt,payer,p10,p25,p50,p75,p90,n_npi,modal_pct,is_scoreable,confidence&order=cbsa,cpt,payer`,
    `CA ${batch[0]}..${batch[batch.length - 1]}`)
  all.push(...rows)
}

const codeSet = new Set(codes)

/* ★ THE BLUECARD RULE. The real corpus carries out-of-state Blues filed against in-state
   providers: the first Sacramento pull returned `anthembcbsga` (Anthem GEORGIA) and
   `anthembcbsky` (Anthem KENTUCKY) as Sacramento payers. Those are BlueCard spillover or a
   default schedule, not a rate a Sacramento employer can buy. @BROKER-TOOLS built
   src/lib/payers.ts to strip this at read time; the same rule belongs at build time so
   every surface agrees instead of each page filtering its own way.
   Keep: national carriers, and any Blue whose home state IS California. Drop every other
   state-specific Blue. */
const CA_OK = /^(uhc|aetna|cigna|centene|humana|molina|oscar|kaiser)/
const CA_BLUE = /^(anthembcca|blueshield_?ca|bcbs_?ca|anthem_ca)/
const OTHER_STATE_BLUE = /^(anthembcbs|bcbs|bcbst|empirebcbs|highmark|regence|wellmark|premera|excellus|horizon|florida_blue|capital_bc|ibx|carefirst|bcbskc)/
function payerAllowedInCA(slug) {
  const s = String(slug).toLowerCase()
  if (CA_BLUE.test(s)) return true
  if (CA_OK.test(s)) return true
  if (OTHER_STATE_BLUE.test(s)) return false      // out-of-market filing
  return true
}

const dropped = new Set()
const kept = all.filter((r) => {
  if (!codeSet.has(r.cpt)) return false
  if (!payerAllowedInCA(r.payer)) { dropped.add(r.payer); return false }
  return true
})
console.log(`  BlueCard rule dropped ${dropped.size} out-of-market payers: ${[...dropped].slice(0,8).join(', ')}${dropped.size>8?' …':''}`)

/* Collapse the payer axis into (cbsa, cpt) cells plus the per-payer detail. */
const cells = new Map()
for (const r of kept) {
  const k = `${r.cbsa}|${r.cpt}`
  if (!cells.has(k)) cells.set(k, { cbsa: r.cbsa, cbsa_name: r.cbsa_name, cpt: r.cpt, payers: [] })
  if (cells.get(k).payers.some((x) => x.payer === r.payer)) continue   // dedupe, belt and braces
  cells.get(k).payers.push({
    payer: r.payer, p25: r.p25, p50: r.p50, p75: r.p75,
    n_npi: r.n_npi, modal_pct: r.modal_pct, is_scoreable: r.is_scoreable, confidence: r.confidence,
  })
}

/* ★ PAYER-LEVEL QUALITY GATES, applied BEFORE the blend.
   Without these the blend is dominated by single filings and ghost rates, and it showed:
   Sacramento knee arthroscopy came out at 1163% of Medicare, and an Aetna row contributed
   29% of Medicare off n=1. A weighted mean cannot repair inputs that should not be in it.
     - MIN_N: a payer contributing one filing does not describe a market.
     - PLAUSIBILITY BAND: a commercial rate below 40% or above 500% of the Medicare anchor
       for that code is almost certainly a ghost rate, a percentage-of-charge row, or a
       different service. This does NOT catch ghosts generally (nothing read-time can), it
       only stops the most extreme from setting a headline. */
const MIN_PAYER_N = 3
// Commercial almost always pays ABOVE Medicare. A 0.40 floor let San Diego colonoscopy
// through at 52% and Fresno at 56%, which are contaminated rows, not cheap markets. E&M is
// the genuine exception (real TX 99214 measured 78% of Medicare), so it gets its own floor.
const FLOOR_PCT = 0.85
const FLOOR_PCT_EM = 0.55
const isEM = (cpt) => { const n = parseInt(cpt, 10); return n >= 99202 && n <= 99499 }
const CEIL_PCT = 5.00
const anchorOf = new Map(federal.catalog.map((c) => [c.cpt, Math.max(c.office, c.facProf)]))

const out = []
let gatedN = 0, gatedBand = 0
for (const c of cells.values()) {
  const anchor = anchorOf.get(c.cpt) || 0
  const usable = c.payers.filter((p) => {
    if (p.p50 == null || p.n_npi <= 0) return false
    if (p.n_npi < MIN_PAYER_N) { gatedN++; return false }
    const floor = isEM(c.cpt) ? FLOOR_PCT_EM : FLOOR_PCT
    if (anchor > 0 && (p.p50 < anchor * floor || p.p50 > anchor * CEIL_PCT)) { gatedBand++; return false }
    return true
  })
  if (!usable.length) continue
  const N = usable.reduce((s, p) => s + p.n_npi, 0)
  const w = (f) => Math.round((usable.reduce((s, p) => s + (p[f] || p.p50) * p.n_npi, 0) / N) * 100) / 100
  const scoreableN = usable.filter((p) => p.is_scoreable).reduce((s, p) => s + p.n_npi, 0)
  out.push({
    cbsa: c.cbsa, cbsa_name: c.cbsa_name, cpt: c.cpt,
    p25: w('p25'), p50: w('p50'), p75: w('p75'),
    n_npi: N,
    payer_n: usable.length,
    scoreable_share: Math.round((scoreableN / N) * 100),
    payers: usable.sort((a, b) => a.p50 - b.p50).slice(0, 12),
  })
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'california-real.json'), JSON.stringify({
  __PROVENANCE: 'REAL measured distributions from the live corpus for every California metro. Not fabricated. Internal field only, never rendered as a provenance caption.',
  metros: CA_METROS, cells: out,
}, null, 0))

console.log(`  payer gates: ${gatedN} dropped for n<${MIN_PAYER_N}, ${gatedBand} dropped outside ${FLOOR_PCT*100}%/${FLOOR_PCT_EM*100}%(E&M)-${CEIL_PCT*100}% of Medicare`)
const byMetro = {}
for (const c of out) byMetro[c.cbsa_name] = (byMetro[c.cbsa_name] || 0) + 1
console.log(`\nwrote ${join(OUT, 'california-real.json')}`)
console.log(`  REAL CA cells: ${out.length} across ${Object.keys(byMetro).length} metros`)
Object.entries(byMetro).sort((a, b) => b[1] - a[1]).slice(0, 12)
  .forEach(([m, n]) => console.log(`    ${String(n).padStart(5)}  ${m}`))
