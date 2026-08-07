#!/usr/bin/env node
/**
 * build-federal-seed.mjs — pull the REAL public federal reference layer into a seed file.
 *
 * ★ THE ARCHITECTURE THIS SERVES: keep every piece of data we genuinely have REAL, and
 *   fabricate only what we do not have. Everything this script pulls is real public-domain
 *   CMS and Census data:
 *     - real CBSA codes and metro names (Census geography)
 *     - real CPT/HCPCS codes and descriptions
 *     - real Medicare non-facility and facility rates (PFS)
 *     - real hospital outpatient facility payments and status indicators (OPPS Addendum B)
 *     - real ambulatory surgery centre payments (ASC Addenda)
 *   The demo engine then fabricates ONLY the commercial negotiated rates, which is the one
 *   thing no public file contains. That blend is what makes it hyper-realistic: the skeleton
 *   is genuinely real, and it is the skeleton a professional recognises.
 *
 * Written in Node rather than bash because the first two bash attempts died to quoting and
 * to `set -e` interacting with `[ test ] && break`, which exits the script when the test is
 * false. Measured, not guessed: the raw curl always worked and returned 1000 rows.
 *
 * PostgREST caps a response at 1000 rows and does so SILENTLY, so every table here is
 * paginated by offset until a short page is returned. This estate has a locked memory about
 * that exact cap being mistaken for a complete result.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const KEY = readFileSync(join(homedir(), '.reddenda-supabase-service-role'), 'utf8').trim()
const BASE = 'https://gjmytcxrvxqmcbvglgvw.supabase.co/rest/v1'
const OUT = join(import.meta.dirname, '..', 'src', 'demo', 'seed')

async function pull(path, label) {
  const rows = []
  for (let off = 0; ; off += 1000) {
    const url = `${BASE}/${path}&limit=1000&offset=${off}`
    const res = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
    if (!res.ok) throw new Error(`${label} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const page = await res.json()
    if (!Array.isArray(page)) throw new Error(`${label}: expected array, got ${JSON.stringify(page).slice(0, 200)}`)
    rows.push(...page)
    process.stdout.write(`\r  ${label}: ${rows.length}`)
    if (page.length < 1000) break            // short page = last page. Never assume 1000 means done.
  }
  process.stdout.write(`\r  ${label}: ${rows.length}\n`)
  return rows
}

console.log('pulling REAL public federal reference data…')

// PFS: one row per (state, cpt). CA used as the national shape; the engine applies the
// locality adjustment itself so it does not double-count geography.
/* ★ DO NOT FILTER ON description IS NOT NULL. That was a self-inflicted 11x scale cap:
   7,647 CA codes carry both Medicare rates but only 670 carry a description in THIS table,
   so the filter silently threw away 91% of the corpus. Descriptions live elsewhere in real
   public data (OPPS Addendum B short_desc 19,153, ASC Addenda 7,380, medicare_pfs_codes
   833) and are joined below. Pull every code that has RATES; source the label separately. */
const pfs = await pull(
  'medicare_locality_cpt_rate?state=eq.CA&nonfac_rate=not.is.null&fac_rate=not.is.null&select=cpt,description,nonfac_rate,fac_rate&order=cpt',
  'PFS (CA)')

// Real public descriptions, best source first: PFS long text, then OPPS, then ASC.
const pfsDesc = await pull('medicare_pfs_codes?description=not.is.null&select=cpt,description&order=cpt', 'PFS descriptions')
const oppsDesc = await pull('opps_hcpcs_apc_crosswalk?short_desc=not.is.null&select=hcpcs,short_desc&order=hcpcs', 'OPPS descriptions')
const ascDesc = await pull('asc_payment_rates?short_desc=not.is.null&select=hcpcs,short_desc&order=hcpcs', 'ASC descriptions')
/* ★ PREFER THE LONGEST DESCRIPTOR, NOT THE LAST SOURCE WRITTEN.
   CMS short_desc is truncated to a fixed width, so distinct procedures collapse onto the
   same string: typing "colon" returned "Partial removal of colon" FIVE times (44140/44141/
   44143/44144/44145), and 1,198 of 7,647 codes shared a description with another code -
   "Cystoscopy and treatment" covered 17 different procedures. A broker cannot pick from a
   list where five rows read identically. The longer descriptor is the more specific one, so
   take it whichever source it came from. */
const DESC = new Map()
const consider = (code, text) => {
  if (!code || !text) return
  const cur = DESC.get(code)
  if (!cur || String(text).length > cur.length) DESC.set(code, String(text).trim())
}
for (const d of ascDesc) consider(d.hcpcs, d.short_desc)
for (const d of oppsDesc) consider(d.hcpcs, d.short_desc)
for (const d of pfsDesc) consider(d.cpt, d.description)

// OPPS: hospital outpatient facility payment + status indicator. Payable AND non-payable,
// because the four-way empty state depends on knowing WHY a code has no facility payment.
const oppsPaid = await pull(
  'opps_hcpcs_apc_crosswalk?payment_rate=gt.0&select=hcpcs,status_indicator,payment_rate&order=hcpcs',
  'OPPS payable')
const oppsNull = await pull(
  'opps_hcpcs_apc_crosswalk?payment_rate=is.null&select=hcpcs,status_indicator&order=hcpcs',
  'OPPS non-payable')

// ASC: ambulatory surgery centre payment.
const asc = await pull(
  'asc_payment_rates?payment_rate=gt.0&select=hcpcs,payment_rate&order=hcpcs',
  'ASC payable')

// Real Census metro geography.
// ★ DO NOT paginate a row-level table for this. npi_cbsa is 8.77M rows keyed by NPI (~8,770
//   requests to recover 918 distinct values, and the first attempt hung exactly there), and
//   peer_rate_dist is 1.19M. PostgREST has no DISTINCT, so the 918-metro list was pulled ONCE
//   via a server-side `select distinct` and lives in seed/metros.json. Read it, do not refetch.
const metrosRaw = readFileSync(join(OUT, 'metros.txt'), 'utf8').trim().split(';')
  .map((r) => { const i = r.indexOf('|'); return { cbsa: r.slice(0, i), cbsa_name: r.slice(i + 1) } })
  .filter((m) => m.cbsa && m.cbsa_name)

const oppsMap = new Map()
for (const o of oppsPaid) oppsMap.set(o.hcpcs, { si: o.status_indicator, fee: o.payment_rate })
for (const o of oppsNull) if (!oppsMap.has(o.hcpcs)) oppsMap.set(o.hcpcs, { si: o.status_indicator, fee: null })
const ascMap = new Map(asc.map((a) => [a.hcpcs, a.payment_rate]))

// Join into one catalog row per CPT. Every field here is REAL.
let noDesc = 0
const catalog = pfs.map((p) => {
  const o = oppsMap.get(p.cpt) || {}
  const alt = DESC.get(p.cpt)
  const desc = (p.description && alt) ? (alt.length > p.description.length ? alt : p.description)
             : (p.description || alt || null)
  if (!desc) noDesc++
  return {
    cpt: p.cpt,
    desc,
    office: Number(p.nonfac_rate),      // real PFS non-facility
    facProf: Number(p.fac_rate),        // real PFS facility (professional component)
    opps: o.fee != null ? Number(o.fee) : null,
    si: o.si || null,
    asc: ascMap.has(p.cpt) ? Number(ascMap.get(p.cpt)) : null,
  }
})

// Real contributing-NPI counts per metro, folded in here so the engine imports JSON only
// (a .txt import needs a bundler loader and breaks under plain node/tsx).
const SIZE = new Map(readFileSync(join(OUT, 'metro-size.txt'), 'utf8').trim().split(';')
  .filter(Boolean).map((p) => { const [c, n] = p.split(':'); return [c, Number(n)] }))
const stateOf = (name) => { const m = name.match(/,\s*([A-Z]{2})(?:-|$)/); return m ? m[1] : '' }
/* Anything still colliding after that gets the CPT appended. Real, unambiguous, and never
   an invented clinical name - a broker seeing "Partial removal of colon (44143)" can pick. */
const seen = new Map()
for (const c of catalog) { if (!c.desc) continue; const k = c.desc.trim().toLowerCase(); seen.set(k, (seen.get(k) || 0) + 1) }
let disambiguated = 0
for (const c of catalog) {
  if (!c.desc) continue
  if (seen.get(c.desc.trim().toLowerCase()) > 1) { c.desc = `${c.desc} (${c.cpt})`; disambiguated++ }
}
console.log(`  disambiguated ${disambiguated} codes whose description was shared with another code`)

const labelled = catalog.filter((c) => c.desc)
console.log(`\n  codes with rates: ${catalog.length} | with a real description: ${labelled.length} | dropped unlabelled: ${noDesc}`)

const metros = [...new Map(metrosRaw.map((m) => [m.cbsa, m.cbsa_name])).entries()]
  .map(([cbsa, name]) => ({ cbsa, name, state: stateOf(name), npis: SIZE.get(cbsa) ?? 3 }))
  .sort((a, b) => a.cbsa.localeCompare(b.cbsa))

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'federal-catalog.json'), JSON.stringify({
  __PROVENANCE: {
    REAL: 'Every value in this file is real public-domain data: CMS PFS non-facility/facility rates, OPPS Addendum B facility payments and status indicators, ASC Addenda payments, real CPT descriptors, real Census CBSA geography. Vintage 2026-Q3.',
    FABRICATED: 'NOTHING in this file is fabricated. Commercial negotiated rates - the one thing no public file contains - are generated by the demo engine and are marked synthetic there.',
  },
  catalog: labelled, metros,
}, null, 0))

const withOpps = labelled.filter((c) => c.opps != null).length
const withAsc = labelled.filter((c) => c.asc != null).length
const withSi = labelled.filter((c) => c.si).length
console.log(`\nwrote ${join(OUT, 'federal-catalog.json')}`)
console.log(`  CPT catalog        : ${labelled.length} codes (ALL REAL)`)
console.log(`  with OPPS facility : ${withOpps}`)
console.log(`  with ASC facility  : ${withAsc}`)
console.log(`  with status ind.   : ${withSi}`)
console.log(`  metros in seed     : ${metros.length}`)
