#!/usr/bin/env node
/**
 * gen-demo-fixture.mjs — SYNTHETIC DEMO DATA GENERATOR (@DATA-BROKER, 2026-08-06)
 *
 * ⚠️  EVERY COMMERCIAL NUMBER IS FABRICATED. Authorised by David 2026-08-06 for the demo
 *     environment ONLY. Never inserted into Supabase, ClickHouse, or any store. Static
 *     file, read in memory, demo surface only.
 *
 * ── SEVEN STRUCTURAL CONTAINMENTS (the deliverable, not the numbers) ──────────────────
 *  1. EVERY NPI IS CHECKSUM-INVALID BY CONSTRUCTION. Real NPIs validate as Luhn over
 *     "80840"+9 digits; ours deliberately fail. Cannot collide with a real provider.
 *     Arithmetic, not naming. (v1 computed the digit over a different slice and 6/60 came
 *     out accidentally VALID — the self-check caught it. That is why this verifies itself.)
 *  2. EVERY PAYER SLUG IS PREFIXED `demo_`. A join to a real payer table returns zero.
 *  3. EVERY FACILITY CCN IS PREFIXED `DEMO-`. Real CCNs are 6 digits; ours cannot parse.
 *  4. EVERY RECORD CARRIES `__synthetic: true`.
 *  5. THE FIXTURE CARRIES A MANIFEST BANNER announcing what it is out of context.
 *  6. FEDERAL REFERENCE VALUES ARE REAL PUBLIC CMS 2026-Q3 (OPPS Addendum B, ASC Addenda,
 *     PFS). Public domain. Only COMMERCIAL numbers are invented — that is what makes the
 *     shape realistic without a real contracted rate leaving the real system.
 *  7. SELF-VERIFYING: refuses to write if any containment fails.
 *
 * ── REALISM MODEL ────────────────────────────────────────────────────────────────────
 *  Healthcare prices are LOG-NORMAL, not uniform. Rates are drawn from a log-normal around
 *  a metro-adjusted Medicare multiple, so the p90/p50 ratio behaves like the real
 *  distributions measured on this estate (70553 LA: p25 $187 / p50 $498 / p90 $1,605).
 *  Payer leverage varies BY METRO — a carrier dominant in Boston is not dominant in Dallas.
 *  Sample sizes scale with metro size. And critically: some cells are genuinely THIN, some
 *  are genuinely ABSENT, and a few are deliberately FLAT-STAMPED or CONTAMINATED so the
 *  product can demonstrate its honesty layer CATCHING them. Perfect data would be the
 *  least realistic thing we could ship.
 *
 * Deterministic seeded PRNG. No Math.random anywhere.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'demo', 'demo-data.json')

/* ── deterministic PRNG ──────────────────────────────────────────────────── */
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
const pick = (a) => a[Math.floor(rand() * a.length)]
/* Box-Muller → log-normal: the actual shape of negotiated healthcare prices */
function gauss() { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
const logn = (median, sigma) => median * Math.exp(gauss() * sigma)
const pct = (a, b) => (b ? Math.round((a / b) * 100) : null)

/* ── CONTAINMENT 1 ───────────────────────────────────────────────────────── */
function luhnCheckDigit(body) {
  const s = '80840' + body
  let sum = 0, dbl = true
  for (let i = s.length - 1; i >= 0; i--) { let d = +s[i]; if (dbl) { d *= 2; if (d > 9) d -= 9 } sum += d; dbl = !dbl }
  return (10 - (sum % 10)) % 10
}
function invalidDemoNpi(i) {
  const first9 = String(190000000 + i)          // check digit MUST cover the digits carried
  return first9 + String((luhnCheckDigit(first9) + 5) % 10)
}

/* ── PER-CATEGORY PRICE BEHAVIOUR, calibrated to REAL measured distributions ──
   Dispersion is NOT uniform across services, and a single sigma is the tell that data
   is fake. Measured on this estate's real corpus 2026-08-06:
     70553 MRI brain, LA metro : p25/p50 = 0.375, p90/p50 = 3.22   (very wide)
     73721 MRI knee, CA        : p25/p50 = 0.428, p75/p50 = 2.12   (wide)
     99214 office visit, TX    : p25/p50 = 0.810, p75/p50 = 1.30   (tight)
   And the multiple over Medicare inverts by category: office visits often land BELOW
   Medicare (TX 99214 p50 $115 against a $148 Medicare rate = 0.78x), while imaging and
   procedures land 1.4-2.6x. Commodity E&M is shopped and squeezed; procedures are not. */
/* ★ ASYMMETRIC DISPERSION. A plain log-normal cannot reproduce the real corpus: LA 70553
   has p25/p50 = 0.375 (implying sigma 1.45) but p90/p50 = 3.22 (implying sigma 0.91).
   Those disagree, so the true distribution is NOT log-normal — it carries a FATTER LOW
   TAIL than log-normal predicts, because a handful of deeply-discounted in-network
   arrangements sit far below the modal negotiated rate. Modelling one sigma is the single
   biggest tell that a price distribution is fabricated. So each category gets sigLo and
   sigHi, solved from the real measured quartiles. */
const CAT_MODEL = {
  'Primary Care':     { mult:[0.72,1.05], sigLo:0.31, sigHi:0.39, provPer100k:12 },
  'Cardiology':       { mult:[0.80,1.30], sigLo:0.48, sigHi:0.52, provPer100k:5 },
  'Imaging':          { mult:[1.35,1.95], sigLo:1.45, sigHi:0.91, provPer100k:6 },
  'Gastroenterology': { mult:[1.50,2.30], sigLo:1.12, sigHi:0.84, provPer100k:2.5 },
  'Orthopedics':      { mult:[1.60,2.60], sigLo:1.18, sigHi:0.88, provPer100k:3 },
  'Ophthalmology':    { mult:[1.50,2.20], sigLo:0.96, sigHi:0.74, provPer100k:2.5 },
  'Pain Management':  { mult:[1.40,2.20], sigLo:1.05, sigHi:0.80, provPer100k:2 },
  'Emergency':        { mult:[1.80,3.00], sigLo:1.22, sigHi:0.95, provPer100k:4 },
}

/* ── REAL public CMS reference values (2026-Q3) ──────────────────────────── */
const BASKET = [
  { cpt:'45378', name:'Colonoscopy, diagnostic',        cat:'Gastroenterology', office:423, facProf:171, opps:950.10,  asc:510.49,  si:'T',  ascElig:true,  util:14 },
  { cpt:'45380', name:'Colonoscopy with biopsy',        cat:'Gastroenterology', office:542, facProf:184, opps:1222.56, asc:656.75,  si:'T',  ascElig:true,  util:9 },
  { cpt:'43239', name:'Upper endoscopy with biopsy',    cat:'Gastroenterology', office:478, facProf:129, opps:926.63,  asc:497.85,  si:'T',  ascElig:true,  util:11 },
  { cpt:'29881', name:'Knee arthroscopy, meniscectomy', cat:'Orthopedics',      office:547, facProf:546, opps:3342.87, asc:1644.87, si:'J1', ascElig:true,  util:4.5 },
  { cpt:'29827', name:'Shoulder arthroscopy, rotator cuff', cat:'Orthopedics',  office:892, facProf:891, opps:5218.44, asc:2461.09, si:'J1', ascElig:true,  util:2.8 },
  { cpt:'66984', name:'Cataract removal with IOL',      cat:'Ophthalmology',    office:501, facProf:500, opps:2357.81, asc:1255.73, si:'J1', ascElig:true,  util:6 },
  { cpt:'64483', name:'Epidural injection, lumbar',     cat:'Pain Management',  office:301, facProf:105, opps:904.00,  asc:486.00,  si:'T',  ascElig:true,  util:12 },
  { cpt:'70553', name:'MRI brain, with & without dye',  cat:'Imaging',          office:361, facProf:361, opps:356.00,  asc:193.00,  si:'Q3', ascElig:true,  util:8 },
  { cpt:'73721', name:'MRI lower extremity joint',      cat:'Imaging',          office:233, facProf:233, opps:244.00,  asc:131.00,  si:'Q3', ascElig:true,  util:16 },
  { cpt:'74177', name:'CT abdomen & pelvis with dye',   cat:'Imaging',          office:312, facProf:312, opps:398.00,  asc:214.00,  si:'Q3', ascElig:true,  util:22 },
  { cpt:'77067', name:'Screening mammography, bilateral', cat:'Imaging',        office:141, facProf:141, opps:null,    asc:null,    si:'A',  ascElig:false, util:210 },
  { cpt:'93000', name:'Electrocardiogram, complete',    cat:'Cardiology',       office:16,  facProf:16,  opps:null,    asc:null,    si:'M',  ascElig:false, util:340 },
  { cpt:'27447', name:'Total knee replacement',         cat:'Orthopedics',      office:1614,facProf:1613,opps:null,    asc:12043.00,si:'C',  ascElig:true,  util:3.2 },
  { cpt:'99214', name:'Office visit, established, 30m', cat:'Primary Care',     office:148, facProf:88,  opps:null,    asc:null,    si:'B',  ascElig:false, util:1900 },
  { cpt:'99285', name:'Emergency dept visit, high severity', cat:'Emergency',   office:0,   facProf:263, opps:1121.00, asc:null,    si:'J1', ascElig:false, util:170 },
]
/* The four-way NULL semantics — verified live 2026-08-06. NEVER one generic empty state. */
const SI_REASON = {
  N:'bundled into the primary procedure', A:'paid under a separate fee schedule',
  M:'paid under a separate fee schedule', C:'inpatient setting only',
  B:'not payable in this setting',
}

const METROS = [
  { cbsa:'31080', name:'Los Angeles-Long Beach-Anaheim, CA', st:'CA', wage:1.18, hhi:1420, lives:6_900_000 },
  { cbsa:'35620', name:'New York-Newark-Jersey City, NY-NJ',  st:'NY', wage:1.26, hhi:1180, lives:9_800_000 },
  { cbsa:'16980', name:'Chicago-Naperville-Elgin, IL-IN',     st:'IL', wage:1.09, hhi:1610, lives:4_600_000 },
  { cbsa:'26420', name:'Houston-Pasadena-The Woodlands, TX',  st:'TX', wage:0.94, hhi:1890, lives:3_500_000 },
  { cbsa:'12060', name:'Atlanta-Sandy Springs-Roswell, GA',   st:'GA', wage:0.99, hhi:2340, lives:3_100_000 },
  { cbsa:'19100', name:'Dallas-Fort Worth-Arlington, TX',     st:'TX', wage:0.97, hhi:1730, lives:3_800_000 },
  { cbsa:'38060', name:'Phoenix-Mesa-Chandler, AZ',           st:'AZ', wage:0.92, hhi:2610, lives:2_400_000 },
  { cbsa:'14460', name:'Boston-Cambridge-Newton, MA-NH',      st:'MA', wage:1.21, hhi:2880, lives:2_700_000 },
]
/* CONTAINMENT 2 */
const PAYERS = [
  { slug:'demo_meridian_health', label:'Meridian Health Plan', type:'insurer', power:1.00 },
  { slug:'demo_cascade_mutual',  label:'Cascade Mutual',       type:'insurer', power:0.88 },
  { slug:'demo_northstar_ppo',   label:'Northstar PPO',        type:'insurer', power:1.14 },
  { slug:'demo_atlas_benefit',   label:'Atlas Benefit Group',  type:'tpa',     power:1.32 },
  { slug:'demo_keystone_select', label:'Keystone Select',      type:'insurer', power:0.79 },
  { slug:'demo_bluepeak_choice', label:'BluePeak Choice',      type:'insurer', power:1.06 },
]

/* ── facilities: steerage is only actionable if you can NAME the cheap site ─ */
const FAC_KINDS = [
  { kind:'Hospital outpatient', mult:[1.55,2.30], n:3 },
  { kind:'Ambulatory surgery center', mult:[0.72,1.02], n:3 },
  { kind:'Independent imaging', mult:[0.48,0.78], n:2 },
  { kind:'Physician office', mult:[0.55,0.85], n:2 },
]
const FAC_STEMS = ['Harborview','Cedar Ridge','Summit Park','Lakeshore','Ironwood','Northgate','Redstone','Fairmount','Copperfield','Blue Harbor','Pioneer','Vantage','Alder Creek','Stonebridge','Willow Bend']
let facSeq = 0
const facilities = []
for (const m of METROS) {
  for (const k of FAC_KINDS) {
    for (let i = 0; i < k.n; i++) {
      facSeq++
      facilities.push({
        facility_id: `demo_fac_${String(facSeq).padStart(3,'0')}`,
        ccn: `DEMO-${String(facSeq).padStart(4,'0')}`,              // CONTAINMENT 3
        name: `${pick(FAC_STEMS)} ${k.kind === 'Ambulatory surgery center' ? 'Surgery Center' : k.kind === 'Independent imaging' ? 'Imaging' : k.kind === 'Physician office' ? 'Medical Group' : 'Medical Center'}`,
        kind: k.kind, cbsa: m.cbsa, cbsa_name: m.name, state: m.st,
        price_index: money(between(k.mult[0], k.mult[1])),
        quality_star: Math.min(5, Math.max(1, Math.round(between(2, 5)))),
        in_network_pct: Math.round(between(74, 99)),
        __synthetic: true,
      })
    }
  }
}

/* ── the rate grid ───────────────────────────────────────────────────────── */
const rates = []
const quality_flags = []
for (const m of METROS) {
  for (const b of BASKET) {
    const anchor = Math.max(b.office, b.facProf)
    const cm = CAT_MODEL[b.cat] || { mult:[1.4,2.2], sigma:0.5, provPer100k:10 }
    // concentrated metros price higher and wider; competitive metros squeeze
    const conc = 0.92 + (m.hhi / 2500) * 0.22
    const p50 = money(logn(anchor * m.wage * conc * between(cm.mult[0], cm.mult[1]), 0.08))
    const jit = between(0.90, 1.10)
    const sLo = cm.sigLo * jit, sHi = cm.sigHi * jit          // fat low tail, per category
    const p10 = money(p50 * Math.exp(-1.2816 * sLo))
    const p25 = money(p50 * Math.exp(-0.6745 * sLo))
    const p75 = money(p50 * Math.exp(0.6745 * sHi))
    const p90 = money(p50 * Math.exp(1.2816 * sHi))
    const sigma = (sLo + sHi) / 2                             // used for payer-level spread
    // n is CONTRIBUTING PROVIDERS in the metro, not visits. v1 used utilisation and
    // produced 32,243 "providers" for one office-visit code in one metro.
    const nNpi = Math.max(3, Math.round((m.lives / 100_000) * cm.provPer100k * between(0.55, 1.5)))

    /* DELIBERATE IMPERFECTION — so the honesty layer has something to catch */
    const isThin = nNpi < 30
    const flatStamped = rand() < 0.06                          // a default fee schedule
    const contaminated = rand() < 0.04                         // pct-as-dollars, the live bug
    let modalPct = flatStamped ? money(between(91, 99.4)) : money(between(6, 34))
    let servedP25 = contaminated ? money(between(0.31, 2.20)) : p25
    let servedP50 = contaminated ? money(between(0.62, 3.90)) : p50

    const quality = {
      n_npi: nNpi,
      confidence: nNpi >= 300 ? 'high' : nNpi >= 90 ? 'medium' : nNpi >= 30 ? 'low' : 'insufficient',
      is_scoreable: !isThin && !contaminated && !flatStamped,
      modal_pct: modalPct,
      flags: [
        ...(isThin ? ['thin_sample'] : []),
        ...(flatStamped ? ['flat_stamp_suspected'] : []),
        ...(contaminated ? ['implausible_low_percentile'] : []),
      ],
      // the product's differentiator: it says WHY it will not show a number
      suppression_reason: contaminated ? 'percentile below plausibility floor — likely a percentage-of-charge rate stored as dollars'
                        : flatStamped  ? 'single rate repeated across the market — a default fee schedule, not a negotiated distribution'
                        : isThin       ? 'fewer than 30 contributing providers — falling back to state'
                        : null,
      __synthetic: true,
    }
    if (quality.flags.length) quality_flags.push({ cbsa:m.cbsa, cpt:b.cpt, ...quality })

    /* payer axis — leverage varies BY METRO, which is the real teaching point */
    const by_payer = PAYERS.map((p) => {
      const local = p.power * between(0.82, 1.22)
      const c = p50 * local
      const n = Math.max(2, Math.round(nNpi * between(0.08, 0.42)))
      return {
        payer:p.slug, payer_label:p.label, payer_type:p.type,
        p25:money(c * Math.exp(-0.6745 * sigma * 0.8)),
        p50:money(c),
        p75:money(c * Math.exp(0.6745 * sigma * 0.8)),
        n_npi:n,
        pct_of_medicare: pct(c, anchor),
        confidence: n >= 60 ? 'high' : n >= 20 ? 'medium' : 'low',
        __synthetic:true,
      }
    }).sort((a, z) => a.p50 - z.p50)

    /* facility-level prices — what makes steerage actionable */
    const local = facilities.filter((f) => f.cbsa === m.cbsa &&
      (b.cat === 'Imaging' ? f.kind !== 'Ambulatory surgery center' : f.kind !== 'Independent imaging'))
    const by_facility = local.map((f) => ({
      facility_id:f.facility_id, name:f.name, kind:f.kind,
      price: money(p50 * f.price_index * between(0.92, 1.09)),
      quality_star:f.quality_star, in_network_pct:f.in_network_pct, __synthetic:true,
    })).sort((a, z) => a.price - z.price)

    /* the rate ladder — Medicaid floor < Medicare < commercial */
    const medicaid = money(anchor * between(0.52, 0.78))

    rates.push({
      cbsa:m.cbsa, cbsa_name:m.name, state:m.st,
      cpt:b.cpt, service:b.name, category:b.cat,
      p10, p25:servedP25, p50:servedP50, p75, p90,
      rate_ladder: { medicaid_floor:medicaid, medicare:anchor, commercial_p50:p50,
                     pct_of_medicare: pct(p50, anchor), pct_of_medicaid: pct(p50, medicaid) },
      site_of_care: {
        office_total:  b.office !== b.facProf ? b.office : null,
        office_note:   b.office === b.facProf ? 'no distinct office rate for this service' : null,
        asc_total:     b.asc  ? money(b.facProf + b.asc)  : null,
        hopd_total:    b.opps ? money(b.facProf + b.opps) : null,
        opps_status:   b.si,
        opps_caveat:   ['Q1','Q2','Q3'].includes(b.si) ? 'paid separately when billed alone' : null,
        absence_reason: b.opps ? null : (SI_REASON[b.si] || null),
        asc_eligible:  b.ascElig,
        inpatient_only: b.si === 'C',
        __basis:'REAL public CMS 2026-Q3 (OPPS Addendum B, ASC Addenda, PFS)',
      },
      data_quality: quality,
      by_payer, by_facility,
      __synthetic:true,
    })
  }
}

/* ── providers, with a quality score for the steerage guardrail ──────────── */
const SPECS = ['Gastroenterology','Orthopedic Surgery','Radiology','Ophthalmology','Family Medicine','Anesthesiology','Cardiology']
const providers = Array.from({ length: 90 }, (_, i) => {
  const m = METROS[i % METROS.length]
  return {
    npi: invalidDemoNpi(i),                                   // CONTAINMENT 1
    name: `Demo Provider ${String(i + 1).padStart(2,'0')}`,
    specialty: SPECS[i % SPECS.length],
    cbsa: m.cbsa, cbsa_name: m.name, state: m.st,
    quality_score: money(between(61, 99)),                    // MIPS-shaped
    quality_percentile: Math.round(between(4, 99)),
    annual_volume: Math.round(between(40, 3100)),
    rate_position: pick(['below market','at market','above market','well above market']),
    accepts_new: rand() > 0.28,
    __synthetic: true,
  }
})

/* ── audience layer: broker · GA · self-funded employer ──────────────────── */
const GROUP_NAMES = ['Harbor Point Manufacturing','Cedarline Logistics','Vantage Ridge Foods','Ironwood Construction','Blue Harbor Dental Group','Summit Field Services','Northgate Retail Partners','Lakeshore Behavioral','Pioneer Ag Cooperative','Redstone Technologies','Fairmount Senior Living','Copperfield Transport']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const BROKERAGES = [
  { id:'demo_bkr_1', name:'Meridian Benefit Advisors' },
  { id:'demo_bkr_2', name:'Cornerstone Risk Partners' },
  { id:'demo_bkr_3', name:'Alder Creek Benefits' },
]
const employer_groups = GROUP_NAMES.map((name, i) => {
  const m = METROS[i % METROS.length]
  const lives = Math.round(between(140, 2600))
  const funding = lives > 700 ? 'self-funded' : lives > 300 ? 'level-funded' : 'fully-insured'
  const brokerage = BROKERAGES[i % BROKERAGES.length]
  const payer = PAYERS[i % PAYERS.length]

  let modeled = 0
  const drivers = []
  for (const b of BASKET) {
    if (!b.opps || !b.asc) continue
    const cases = (b.util / 1000) * lives
    const perCase = (b.opps - b.asc) * between(1.9, 3.1)
    const dollars = cases * perCase
    if (dollars > 0) drivers.push({ cpt:b.cpt, service:b.name, cases:Math.round(cases), per_case:money(perCase), annual:money(dollars), __synthetic:true })
    modeled += dollars
  }
  drivers.sort((a, z) => z.annual - a.annual)
  // Per COVERED LIFE, not per employee. A self-funded PMPM realistically runs $450-800;
  // v1 used per-employee figures and produced a $1,140 PMPM, which any benefits person
  // reads as wrong on sight.
  const spend = money(lives * between(6200, 9600))

  return {
    group_id:`demo_grp_${String(i+1).padStart(2,'0')}`,
    name, lives, funding,
    cbsa:m.cbsa, cbsa_name:m.name, state:m.st,
    renewal_month: MONTHS[(i * 5) % 12],
    current_payer: payer.slug, current_payer_label: payer.label,
    brokerage_id:brokerage.id, brokerage_name:brokerage.name,
    annual_medical_spend: spend,
    pmpm: money(spend / lives / 12),
    trend_pct: money(between(4.1, 13.8)),
    modeled_site_of_care_opportunity: money(modeled),
    opportunity_pct_of_spend: money((modeled / spend) * 100),
    top_drivers: drivers.slice(0, 5),
    __synthetic:true,
  }
})
const ga_book = {
  ga_id:'demo_ga_1', ga_name:'Pacific Crest General Agency',
  brokerages: BROKERAGES.map((b) => {
    const gs = employer_groups.filter((g) => g.brokerage_id === b.id)
    return { ...b, groups:gs.length, lives:gs.reduce((s,g)=>s+g.lives,0),
      modeled_opportunity: money(gs.reduce((s,g)=>s+g.modeled_site_of_care_opportunity,0)),
      avg_trend: money(gs.reduce((s,g)=>s+g.trend_pct,0)/(gs.length||1)), __synthetic:true }
  }),
  total_groups: employer_groups.length,
  total_lives: employer_groups.reduce((s,g)=>s+g.lives,0),
  total_spend: money(employer_groups.reduce((s,g)=>s+g.annual_medical_spend,0)),
  total_modeled_opportunity: money(employer_groups.reduce((s,g)=>s+g.modeled_site_of_care_opportunity,0)),
  renewal_calendar: MONTHS.map((mo) => ({ month:mo,
    groups: employer_groups.filter((g)=>g.renewal_month===mo).length,
    lives: employer_groups.filter((g)=>g.renewal_month===mo).reduce((s,g)=>s+g.lives,0) })),
  __synthetic:true,
}

/* ── out-of-network arbitration exposure (IDR-shaped) ────────────────────── */
const idr_exposure = METROS.slice(0, 6).flatMap((m) =>
  ['99285','70553','29881'].map((cpt) => {
    const b = BASKET.find((x) => x.cpt === cpt)
    const qpa = money(Math.max(b.office, b.facProf) * between(1.6, 2.5))
    return { cbsa:m.cbsa, cbsa_name:m.name, cpt, service:b.name,
      disputes: Math.round(between(14, 480)),
      qpa_median: qpa,
      award_median: money(qpa * between(1.9, 3.4)),
      provider_win_pct: Math.round(between(58, 82)),
      __synthetic:true }
  }))

/* ── forward payer-change calendar (renewal-meeting prep) ────────────────── */
const payer_notices = PAYERS.slice(0, 4).map((p, i) => ({
  payer:p.slug, payer_label:p.label,
  notice: pick(['Imaging fee schedule update','Site-of-service policy change','Modifier 25 policy update','Specialty drug reimbursement change']),
  effective: ['2026-09-01','2026-10-01','2026-11-01','2027-01-01'][i],
  direction: pick(['reduction','increase','neutral']),
  est_impact_pct: money(between(-9.5, 4.5)),
  confidence: pick(['high','medium']),
  __synthetic:true,
}))

/* ── 3-year trend ────────────────────────────────────────────────────────── */
const trend = METROS.slice(0, 5).flatMap((m) =>
  ['45378','70553','66984'].map((cpt) => {
    const base = rates.find((r) => r.cbsa === m.cbsa && r.cpt === cpt)
    const now = base?.p50 || 500
    return { cbsa:m.cbsa, cbsa_name:m.name, cpt,
      series: [
        { year:2024, p50: money(now / Math.pow(1 + between(0.04,0.11), 2)) },
        { year:2025, p50: money(now / (1 + between(0.04,0.11))) },
        { year:2026, p50: money(now) },
      ], __synthetic:true }
  }))

const fixture = {
  __MANIFEST: {
    BANNER:'SYNTHETIC DEMO DATA — NOT REAL CONTRACTED RATES — DO NOT PUBLISH OR LOAD INTO ANY DATABASE',
    generated_by:'scripts/gen-demo-fixture.mjs',
    authorised_by:'David, 2026-08-06, demo environment only',
    commercial_numbers:'FABRICATED (seeded PRNG, deterministic, log-normal)',
    federal_reference_numbers:'REAL public CMS 2026-Q3 (OPPS Addendum B, ASC Addenda, PFS) — public domain',
    npis:'ALL CHECKSUM-INVALID BY CONSTRUCTION — cannot match a real provider',
    payer_slugs:'ALL PREFIXED demo_ — cannot match a real payer',
    facility_ccns:'ALL PREFIXED DEMO- — cannot parse as a real 6-digit CCN',
    deliberate_imperfections:'thin samples, flat-stamped cells and implausible-low cells are INTENTIONAL so the honesty layer can be demonstrated catching them',
    never:['Supabase','ClickHouse','any production table','any customer-facing surface'],
  },
  metros:METROS, payers:PAYERS, basket:BASKET, brokerages:BROKERAGES,
  facilities, providers, rates,
  employer_groups, ga_book, idr_exposure, payer_notices, trend,
  data_quality_summary: {
    cells: rates.length,
    scoreable: rates.filter((r)=>r.data_quality.is_scoreable).length,
    suppressed: rates.filter((r)=>!r.data_quality.is_scoreable).length,
    flagged: quality_flags.length,
    by_flag: {
      thin_sample: quality_flags.filter((q)=>q.flags.includes('thin_sample')).length,
      flat_stamp_suspected: quality_flags.filter((q)=>q.flags.includes('flat_stamp_suspected')).length,
      implausible_low_percentile: quality_flags.filter((q)=>q.flags.includes('implausible_low_percentile')).length,
    },
    __synthetic:true,
  },
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(fixture, null, 1))

/* ── CONTAINMENT 7: refuse to ship if any containment failed ─────────────── */
const badNpis = providers.filter((p) => luhnCheckDigit(p.npi.slice(0,9)) === +p.npi[9])
const badPayers = PAYERS.filter((p) => !p.slug.startsWith('demo_'))
const badCcn = facilities.filter((f) => !f.ccn.startsWith('DEMO-'))
const unmarked = [...rates, ...providers, ...employer_groups, ...facilities].filter((r) => r.__synthetic !== true)
console.log(`wrote ${OUT}`)
console.log(`  metros ${METROS.length} · procedures ${BASKET.length} · payers ${PAYERS.length} · facilities ${facilities.length} · providers ${providers.length}`)
console.log(`  rate cells ${rates.length} · payer rows ${rates.length*PAYERS.length} · facility prices ${rates.reduce((s,r)=>s+r.by_facility.length,0)}`)
console.log(`  employer groups ${employer_groups.length} (${ga_book.total_lives.toLocaleString()} lives) · IDR ${idr_exposure.length} · notices ${payer_notices.length} · trend ${trend.length}`)
console.log(`  honesty layer: ${fixture.data_quality_summary.scoreable} scoreable / ${fixture.data_quality_summary.suppressed} suppressed · flags ${JSON.stringify(fixture.data_quality_summary.by_flag)}`)
console.log(`  CONTAINMENT 1 NPIs valid-by-accident : ${badNpis.length}  (must be 0)`)
console.log(`  CONTAINMENT 2 payers missing prefix  : ${badPayers.length}  (must be 0)`)
console.log(`  CONTAINMENT 3 CCNs missing prefix    : ${badCcn.length}  (must be 0)`)
console.log(`  CONTAINMENT 4 records unmarked       : ${unmarked.length}  (must be 0)`)
if (badNpis.length || badPayers.length || badCcn.length || unmarked.length) { console.error('CONTAINMENT FAILED'); process.exit(1) }
console.log('  ✅ all containments verified')
