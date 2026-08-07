#!/usr/bin/env node
/**
 * build-ca-locality.mjs — pin every California metro to its REAL Medicare locality.
 *
 * ★ THE PROBLEM THIS SOLVES. `medicare_locality_cpt_rate` is one row per (state, cpt): the
 *   29 California localities are already collapsed into a single statewide figure, with only
 *   `n_localities` left as a hint that a collapse happened. So a Sacramento broker was being
 *   shown a 117%-to-147% statewide BAND instead of their own number. In front of the CAHIP
 *   NorCal room, that is the difference between "your market" and "your state."
 *
 * ★ THE DATA ALREADY EXISTS. `medicare_locality_cpt_rate_fixed` carries state, locality,
 *   locality_name, MAC, GPCIs, RVUs and both prices at LOCALITY grain, 9,520 codes per
 *   California locality. Nothing needed acquiring; it needed finding.
 *
 *   Sacramento is locality 63, "SACRAMENTO-ROSEVILLE-FOLSOM", MAC 0111263,
 *   GPCI work 1.036 / PE 1.163 / MP 0.536.
 *
 * Everything written here is REAL public CMS data.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const KEY = readFileSync(join(homedir(), '.reddenda-supabase-service-role'), 'utf8').trim()
const BASE = 'https://gjmytcxrvxqmcbvglgvw.supabase.co/rest/v1'
const OUT = join(import.meta.dirname, '..', 'src', 'demo', 'seed')

/* CBSA → CA Medicare locality. Both sides are real CMS/Census identifiers, and the locality
   names map almost one-to-one onto the metro names, which is what makes this safe.
   Anything in California not listed here is locality 75, "REST OF CALIFORNIA". */
const CBSA_TO_LOCALITY = {
  '40900': '63', // Sacramento-Roseville-Folsom   ← the room
  '41860': '05', // San Francisco-Oakland-Fremont (SF/San Mateo/Alameda/Contra Costa)
  '41940': '09', // San Jose-Sunnyvale-Santa Clara (Santa Clara)
  '31080': '18', // Los Angeles-Long Beach-Anaheim
  '37100': '17', // Oxnard-Thousand Oaks-Ventura
  '34900': '51', // Napa
  '46700': '53', // Vallejo
  '12540': '54', // Bakersfield-Delano
  '17020': '55', // Chico
  '23420': '56', // Fresno
  '25260': '57', // Hanford-Corcoran
  '32900': '59', // Merced
  '33700': '60', // Modesto
  '39820': '61', // Redding
  '40140': '62', // Riverside-San Bernardino-Ontario
  '41500': '64', // Salinas
  '42100': '66', // Santa Cruz-Watsonville
  '42220': '67', // Santa Rosa-Petaluma
  '44700': '68', // Stockton-Lodi
  '47300': '69', // Visalia
  '49700': '70', // Yuba City
  '20940': '71', // El Centro
  '41740': '72', // San Diego-Chula Vista-Carlsbad
  '42020': '73', // San Luis Obispo-Paso Robles
  '42200': '74', // Santa Maria-Santa Barbara
}
const REST_OF_CA = '75'

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

const federal = JSON.parse(readFileSync(join(OUT, 'federal-catalog.json'), 'utf8'))
const wanted = new Set(federal.catalog.map((c) => c.cpt))
const localities = [...new Set([...Object.values(CBSA_TO_LOCALITY), REST_OF_CA])]

console.log(`pulling REAL locality rates for ${localities.length} California localities…`)
const rows = []
for (let i = 0; i < localities.length; i += 5) {
  const batch = localities.slice(i, i + 5)
  // ORDER is mandatory: offset pagination without a stable sort returns overlapping pages.
  rows.push(...await pull(
    `medicare_locality_cpt_rate_fixed?state=eq.CA&locality=in.(${batch.join(',')})&nonfac_rate=not.is.null&select=locality,locality_name,cpt,nonfac_rate,fac_rate,work_gpci,pe_gpci,mp_gpci&order=locality,cpt`,
    `loc ${batch.join('/')}`))
}

/* ★ THIS TABLE HAS MULTIPLE ROWS PER (locality, cpt) AND THE NAIVE LAST-WRITE IS WRONG.
   Measured in Sacramento (locality 63): 7,856 distinct codes, 835 of them carrying more
   than one row, up to 3. For 45378 the two rows are $417.65 and $209.11 - the second is
   exactly half the RVUs of the first. Taking whichever arrived last picked $209.11, which
   would have DOUBLED every California "percent of Medicare" figure on the site.
   Disambiguation: keep the row NEAREST the already-validated statewide value. A locality
   varies roughly +/-15% around the state figure, while the spurious rows differ by about
   2x, so nearest-to-state separates them cleanly and is checkable after the fact. */
const stateNonfac = new Map(federal.catalog.map((c) => [c.cpt, c.office]))

const byLoc = {}
const meta = {}
let ambiguous = 0
for (const r of rows) {
  if (!wanted.has(r.cpt)) continue
  const loc = (byLoc[r.locality] ||= {})
  const cand = [Number(r.nonfac_rate), Number(r.fac_rate)]
  const ref = stateNonfac.get(r.cpt)
  if (loc[r.cpt]) {
    ambiguous++
    if (ref != null) {
      const keepExisting = Math.abs(loc[r.cpt][0] - ref) <= Math.abs(cand[0] - ref)
      if (!keepExisting) loc[r.cpt] = cand
    } else if (cand[0] > loc[r.cpt][0]) loc[r.cpt] = cand
  } else loc[r.cpt] = cand
  meta[r.locality] ||= { name: r.locality_name, w: Number(r.work_gpci), pe: Number(r.pe_gpci), mp: Number(r.mp_gpci) }
}
console.log(`\n  disambiguated ${ambiguous} duplicate locality/cpt rows against the statewide value`)

/* Verify: a locality rate must land within a sane band of the statewide figure. */
let outOfBand = 0
for (const [loc, codes] of Object.entries(byLoc)) {
  for (const [cpt, v] of Object.entries(codes)) {
    const ref = stateNonfac.get(cpt)
    if (ref > 0 && (v[0] / ref < 0.7 || v[0] / ref > 1.4)) outOfBand++
  }
}
console.log(`  locality values outside 70-140% of the statewide figure: ${outOfBand} (expect ~0)`)

writeFileSync(join(OUT, 'ca-locality.json'), JSON.stringify({
  __PROVENANCE: 'REAL public CMS Physician Fee Schedule at California LOCALITY grain. Not fabricated.',
  cbsa_to_locality: CBSA_TO_LOCALITY, rest_of_ca: REST_OF_CA, meta, rates: byLoc,
}, null, 0))

console.log(`\nwrote ${join(OUT, 'ca-locality.json')}`)
console.log(`  localities: ${Object.keys(byLoc).length}`)
for (const [loc, m] of Object.entries(meta).sort()) {
  console.log(`    ${loc}  ${String(Object.keys(byLoc[loc]).length).padStart(4)} codes  GPCI ${m.w}/${m.pe}/${m.mp}  ${m.name.slice(0, 46)}`)
}
const sac = byLoc['63'] || {}
console.log(`\n  ★ SACRAMENTO (locality 63): ${Object.keys(sac).length} codes`)
for (const cpt of ['45378', '70553', '99214', '29881']) {
  if (sac[cpt]) console.log(`      ${cpt}  non-facility $${sac[cpt][0].toFixed(2)}  facility $${sac[cpt][1].toFixed(2)}`)
}
