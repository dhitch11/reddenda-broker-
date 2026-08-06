#!/usr/bin/env node
/**
 * gen-demo-fixture.mjs — SYNTHETIC DEMO DATA GENERATOR (@DATA-BROKER, 2026-08-06)
 *
 * ⚠️  EVERY COMMERCIAL NUMBER THIS EMITS IS FABRICATED. Authorised by David 2026-08-06
 *     for the demo environment ONLY. It is never inserted into Supabase, ClickHouse, or
 *     any other store. It is a static file, read in-process, by the demo surface alone.
 *
 * FIVE STRUCTURAL CONTAINMENTS — this is the point of the file, not the numbers:
 *
 *  1. EVERY NPI IS DELIBERATELY CHECKSUM-INVALID. A real NPI validates as Luhn over
 *     "80840" + the first 9 digits. We compute the correct check digit and then store
 *     (correct + 5) % 10. So every demo NPI FAILS the standard NPI validator and cannot
 *     collide with any real provider in NPPES or in our lake. This is not a naming
 *     convention that a careless join could defeat; it is arithmetic.
 *  2. EVERY PAYER SLUG IS PREFIXED `demo_`. No real payer slug in this estate carries
 *     that prefix, so a join against a real payer table yields zero rows, never a match.
 *  3. EVERY RECORD CARRIES `__synthetic: true`. Any serialiser can assert on it.
 *  4. THE FIXTURE CARRIES A MANIFEST with a provenance banner, so the file itself
 *     announces what it is if it is ever opened out of context.
 *  5. CPT CODES AND MEDICARE ANCHORS ARE REAL PUBLIC CMS VALUES (they are published
 *     federal fee schedules, not proprietary). Only the COMMERCIAL numbers are invented.
 *     That is what makes the shape realistic without any real contracted rate leaving
 *     the real system.
 *
 * Deterministic: seeded PRNG, so the demo is identical on every run and in every
 * environment. No Math.random anywhere.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'demo', 'demo-data.json')

/* ── deterministic PRNG (mulberry32) ─────────────────────────────────────── */
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20260806)
const between = (lo, hi) => lo + rand() * (hi - lo)
const money = (n) => Math.round(n * 100) / 100

/* ── CONTAINMENT 1: emit an NPI that is guaranteed to FAIL validation ────── */
function luhnCheckDigit(body) {
  const s = '80840' + body
  let sum = 0, dbl = true
  for (let i = s.length - 1; i >= 0; i--) {
    let d = +s[i]
    if (dbl) { d *= 2; if (d > 9) d -= 9 }
    sum += d; dbl = !dbl
  }
  return (10 - (sum % 10)) % 10
}
function invalidDemoNpi(i) {
  // The check digit MUST be computed over the SAME nine digits the NPI actually carries.
  // A first version derived it from a different slice; 6 of 60 then came out accidentally
  // VALID and the containment self-check caught it. Keep these aligned.
  const first9 = String(190000000 + i)         // 9 digits, leading 1, as real NPIs do
  const good = luhnCheckDigit(first9)
  const bad = (good + 5) % 10                  // guaranteed != good
  return first9 + String(bad)
}

/* ── real, public federal reference values (CMS) ─────────────────────────── */
const BASKET = [
  { cpt: '45378', name: 'Colonoscopy, diagnostic',        cat: 'GI',        office: 423,  facProf: 171, opps: 950.10,  asc: 510.49 },
  { cpt: '45380', name: 'Colonoscopy with biopsy',        cat: 'GI',        office: 542,  facProf: 184, opps: 1222.56, asc: 656.75 },
  { cpt: '43239', name: 'Upper endoscopy with biopsy',    cat: 'GI',        office: 478,  facProf: 129, opps: 926.63,  asc: 497.85 },
  { cpt: '29881', name: 'Knee arthroscopy, meniscectomy', cat: 'Ortho',     office: 547,  facProf: 546, opps: 3342.87, asc: 1644.87 },
  { cpt: '66984', name: 'Cataract removal with IOL',      cat: 'Ophth',     office: 501,  facProf: 500, opps: 2357.81, asc: 1255.73 },
  { cpt: '64483', name: 'Epidural injection, lumbar',     cat: 'Pain',      office: 301,  facProf: 105, opps: 904.00,  asc: 486.00 },
  { cpt: '70553', name: 'MRI brain, with & without dye',  cat: 'Imaging',   office: 361,  facProf: 361, opps: 356.00,  asc: 193.00 },
  { cpt: '73721', name: 'MRI lower extremity joint',      cat: 'Imaging',   office: 233,  facProf: 233, opps: 244.00,  asc: 131.00 },
  { cpt: '74177', name: 'CT abdomen & pelvis with dye',   cat: 'Imaging',   office: 312,  facProf: 312, opps: 398.00,  asc: 214.00 },
  { cpt: '99214', name: 'Office visit, established, 30m', cat: 'E&M',       office: 148,  facProf: 88,  opps: null,    asc: null },
]

/* ── metros: real CBSA codes + real names (public census geography) ──────── */
const METROS = [
  { cbsa: '31080', name: 'Los Angeles-Long Beach-Anaheim, CA', idx: 1.18 },
  { cbsa: '35620', name: 'New York-Newark-Jersey City, NY-NJ', idx: 1.26 },
  { cbsa: '16980', name: 'Chicago-Naperville-Elgin, IL-IN',    idx: 1.09 },
  { cbsa: '26420', name: 'Houston-Pasadena-The Woodlands, TX', idx: 0.94 },
  { cbsa: '12060', name: 'Atlanta-Sandy Springs-Roswell, GA',  idx: 0.99 },
  { cbsa: '19100', name: 'Dallas-Fort Worth-Arlington, TX',    idx: 0.97 },
  { cbsa: '38060', name: 'Phoenix-Mesa-Chandler, AZ',          idx: 0.92 },
  { cbsa: '14460', name: 'Boston-Cambridge-Newton, MA-NH',     idx: 1.21 },
]

/* CONTAINMENT 2: `demo_` prefix — cannot match a real payer slug */
const PAYERS = [
  { slug: 'demo_meridian_health',  label: 'Meridian Health Plan',   power: 1.00 },
  { slug: 'demo_cascade_mutual',   label: 'Cascade Mutual',         power: 0.88 },
  { slug: 'demo_northstar_ppo',    label: 'Northstar PPO',          power: 1.14 },
  { slug: 'demo_atlas_benefit',    label: 'Atlas Benefit Group',    power: 1.32 },
  { slug: 'demo_keystone_select',  label: 'Keystone Select',        power: 0.79 },
  { slug: 'demo_bluepeak_choice',  label: 'BluePeak Choice',        power: 1.06 },
]

/* ── build ───────────────────────────────────────────────────────────────── */
const rates = []
for (const m of METROS) {
  for (const b of BASKET) {
    // commercial sits at a realistic multiple of the public Medicare anchor
    const base = b.office * m.idx * between(1.55, 2.35)
    const p50 = money(base)
    const p25 = money(p50 * between(0.62, 0.78))
    const p10 = money(p25 * between(0.68, 0.85))
    const p75 = money(p50 * between(1.28, 1.62))
    const p90 = money(p75 * between(1.15, 1.48))
    const nNpi = Math.round(between(38, 640))

    const byPayer = PAYERS.map((p) => {
      const c = p50 * p.power * between(0.86, 1.16)
      return {
        payer: p.slug, payer_label: p.label,
        p25: money(c * between(0.7, 0.82)),
        p50: money(c),
        p75: money(c * between(1.22, 1.48)),
        n_npi: Math.round(between(6, 120)),
        confidence: nNpi > 300 ? 'high' : nNpi > 90 ? 'medium' : 'low',
        __synthetic: true,
      }
    })

    rates.push({
      cbsa: m.cbsa, cbsa_name: m.name,
      cpt: b.cpt, service: b.name, category: b.cat,
      p10, p25, p50, p75, p90, n_npi: nNpi,
      medicare_office: b.office,                                   // real public CMS
      site_of_care: {
        office_total:  b.office !== b.facProf ? b.office : null,   // null = no distinct office rate
        asc_total:     b.asc  ? money(b.facProf + b.asc)  : null,
        hopd_total:    b.opps ? money(b.facProf + b.opps) : null,
        absence_reason: b.opps ? null : 'not payable in this setting (OPPS status B)',
        __basis: 'REAL public CMS 2026-Q3 fee schedules (OPPS/ASC/PFS)',
      },
      by_payer: byPayer,
      __synthetic: true,
    })
  }
}

const providers = Array.from({ length: 60 }, (_, i) => ({
  npi: invalidDemoNpi(i),                    // CONTAINMENT 1
  name: `Demo Provider ${String(i + 1).padStart(2, '0')}`,
  specialty: ['Gastroenterology', 'Orthopedic Surgery', 'Radiology', 'Ophthalmology', 'Family Medicine'][i % 5],
  cbsa: METROS[i % METROS.length].cbsa,
  __synthetic: true,
}))

/* ── AUDIENCE LAYER: broker · General Agent · self-funded employer ────────
   Price data alone is provider-side thinking. These three personas buy differently:
     - BROKER          : defends a renewal for a named group; needs a savings story per client
     - GENERAL AGENT   : wholesales to many brokers; needs a BOOK roll-up across groups
     - SELF-FUNDED EMPLOYER : carries the risk directly; needs total annual spend exposure
   So every group carries lives, a metro, a renewal month and a modelled opportunity. */
const GROUP_NAMES = [
  'Harbor Point Manufacturing', 'Cedarline Logistics', 'Vantage Ridge Foods',
  'Ironwood Construction', 'Blue Harbor Dental Group', 'Summit Field Services',
  'Northgate Retail Partners', 'Lakeshore Behavioral', 'Pioneer Ag Cooperative',
  'Redstone Technologies', 'Fairmount Senior Living', 'Copperfield Transport',
]
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const BROKERAGES = [
  { id: 'demo_bkr_1', name: 'Meridian Benefit Advisors' },
  { id: 'demo_bkr_2', name: 'Cornerstone Risk Partners' },
  { id: 'demo_bkr_3', name: 'Alder Creek Benefits' },
]

// per-1,000-lives annual utilisation for the basket (illustrative, plausible frequencies)
const UTIL_PER_1K = { '45378': 14, '45380': 9, '43239': 11, '29881': 4.5, '66984': 6,
                      '64483': 12, '70553': 8, '73721': 16, '74177': 22, '99214': 1900 }

const employer_groups = GROUP_NAMES.map((name, i) => {
  const m = METROS[i % METROS.length]
  const lives = Math.round(between(140, 2600))
  const funding = lives > 700 ? 'self-funded' : lives > 300 ? 'level-funded' : 'fully-insured'
  const brokerage = BROKERAGES[i % BROKERAGES.length]

  // modelled annual opportunity = sum over basket of (HOPD - ASC) x expected cases
  let modeled = 0
  const drivers = []
  for (const b of BASKET) {
    if (!b.opps || !b.asc) continue
    const cases = ((UTIL_PER_1K[b.cpt] || 0) / 1000) * lives
    const perCase = (b.opps - b.asc) * between(1.9, 3.1)   // commercial multiple of the CMS delta
    const dollars = cases * perCase
    if (dollars > 0) drivers.push({ cpt: b.cpt, service: b.name, cases: Math.round(cases), per_case: money(perCase), annual: money(dollars) })
    modeled += dollars
  }
  drivers.sort((a, b2) => b2.annual - a.annual)

  return {
    group_id: `demo_grp_${String(i + 1).padStart(2, '0')}`,
    name, lives, funding,
    cbsa: m.cbsa, cbsa_name: m.name,
    renewal_month: MONTHS[(i * 5) % 12],
    brokerage_id: brokerage.id, brokerage_name: brokerage.name,
    annual_medical_spend: money(lives * between(9200, 14800)),
    modeled_site_of_care_opportunity: money(modeled),
    top_drivers: drivers.slice(0, 4),
    __synthetic: true,
  }
})

// GA book roll-up: what a General Agent sees across every downstream brokerage
const ga_book = {
  ga_id: 'demo_ga_1',
  ga_name: 'Pacific Crest General Agency',
  brokerages: BROKERAGES.map((b) => {
    const gs = employer_groups.filter((g) => g.brokerage_id === b.id)
    return {
      ...b,
      groups: gs.length,
      lives: gs.reduce((s, g) => s + g.lives, 0),
      modeled_opportunity: money(gs.reduce((s, g) => s + g.modeled_site_of_care_opportunity, 0)),
      __synthetic: true,
    }
  }),
  total_groups: employer_groups.length,
  total_lives: employer_groups.reduce((s, g) => s + g.lives, 0),
  total_modeled_opportunity: money(employer_groups.reduce((s, g) => s + g.modeled_site_of_care_opportunity, 0)),
  __synthetic: true,
}

const fixture = {
  employer_groups, ga_book, brokerages: BROKERAGES, utilization_per_1k: UTIL_PER_1K,
  __MANIFEST: {
    BANNER: 'SYNTHETIC DEMO DATA — NOT REAL CONTRACTED RATES — DO NOT PUBLISH OR LOAD INTO ANY DATABASE',
    generated_by: 'scripts/gen-demo-fixture.mjs',
    authorised_by: 'David, 2026-08-06, demo environment only',
    commercial_numbers: 'FABRICATED (seeded PRNG, deterministic)',
    federal_reference_numbers: 'REAL public CMS 2026-Q3 (OPPS Addendum B, ASC Addenda, PFS) — public domain',
    npis: 'ALL CHECKSUM-INVALID BY CONSTRUCTION — cannot match a real provider',
    payer_slugs: 'ALL PREFIXED demo_ — cannot match a real payer',
    never: ['Supabase', 'ClickHouse', 'any production table', 'any customer-facing surface'],
  },
  metros: METROS, payers: PAYERS, basket: BASKET, providers, rates,
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(fixture, null, 1))

/* ── self-verify the containments before declaring success ───────────────── */
const badNpis = providers.filter((p) => luhnCheckDigit(p.npi.slice(0, 9)) === +p.npi[9])
const badPayers = PAYERS.filter((p) => !p.slug.startsWith('demo_'))
const unmarked = rates.filter((r) => r.__synthetic !== true)
console.log(`wrote ${OUT}`)
console.log(`  rates rows       : ${rates.length}  (${METROS.length} metros x ${BASKET.length} CPTs)`)
console.log(`  payer rows       : ${rates.length * PAYERS.length}`)
console.log(`  providers        : ${providers.length}`)
console.log(`  CONTAINMENT 1 NPIs valid-by-accident : ${badNpis.length}  (must be 0)`)
console.log(`  CONTAINMENT 2 payers missing prefix  : ${badPayers.length}  (must be 0)`)
console.log(`  CONTAINMENT 3 records unmarked       : ${unmarked.length}  (must be 0)`)
if (badNpis.length || badPayers.length || unmarked.length) { console.error('CONTAINMENT FAILED'); process.exit(1) }
console.log('  ✅ all containments verified')
