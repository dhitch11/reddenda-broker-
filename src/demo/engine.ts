/**
 * src/demo/engine.ts — THE NATIONAL DEMO DATA ENGINE.
 *
 * ══ ARCHITECTURE ══════════════════════════════════════════════════════════════════════
 * REAL where we have it, fabricated where we do not, resolved internally so a consumer
 * never has to care which it got.
 *
 *   REAL (public domain / measured, from ./seed):
 *     918 CBSA codes + metro names (Census) · 670 CPT codes + descriptions ·
 *     Medicare PFS non-facility + facility · OPPS Addendum B facility payments + status
 *     indicators · ASC Addenda payments · real contributing-NPI counts per metro ·
 *     ★ 8,002 REAL California rate cells across 34 CA metros, incl. 443 in Sacramento.
 *   FABRICATED (no public file contains it):
 *     commercial rates outside California, facilities, providers, employer groups.
 *
 * ★ WHY CALIFORNIA IS REAL: the group being pitched is in NorCal / Greater Sacramento
 *   (CAHIP NorCal sits in Citrus Heights = CBSA 40900). If a broker in that room looks up
 *   their own market, the numbers must behave like their market. That is the one place
 *   fabrication cannot beat truth, because the audience already knows the answer.
 *
 * ══ PROVENANCE IS INTERNAL ════════════════════════════════════════════════════════════
 * Every value carries `_src`. Per the conductor's ruling it is NEVER rendered as a
 * provenance caption. It exists so the engine can route real-vs-synthetic, and so opening
 * this to the public later is a config change rather than a rebuild.
 *
 * ══ WHY AN ENGINE, NOT A FIXTURE ══════════════════════════════════════════════════════
 * 918 metros x 670 codes = 615,060 cells before the payer axis. Everything is derived from
 * a hash of its identity, so the same query ALWAYS returns the same numbers, the corpus is
 * nationally complete and instantly searchable, and storage is zero.
 *
 * ══ CALIBRATION ═══════════════════════════════════════════════════════════════════════
 * Dispersion is per-category and ASYMMETRIC, solved from real measurements: LA 70553 has
 * p25/p50 = 0.375 (sigma 1.45) but p90/p50 = 3.22 (sigma 0.91). They disagree, so the real
 * shape carries a fatter low tail than log-normal. One sigma is the clearest tell that a
 * price distribution is fabricated.
 */
import federal from './seed/federal-catalog.json'
import caReal from './seed/california-real.json'
import caLoc from './seed/ca-locality.json'

export type Src = 'real' | 'synthetic'

export interface FederalCode { cpt: string; desc: string; office: number; facProf: number; opps: number | null; si: string | null; asc: number | null }
export interface Metro { cbsa: string; name: string; state: string; npis: number }

const CATALOG = (federal as { catalog: FederalCode[] }).catalog
const RAW_METROS = (federal as { metros: Metro[] }).metros
const BY_CPT = new Map(CATALOG.map((c) => [c.cpt, c]))

/* Real contributing-NPI counts per metro. Market size must come from reality: an earlier
   version derived it from a hash of the CBSA code, so LOS ANGELES drew a small market and
   its colonoscopy cell was withheld for thin sample. The biggest market in the country
   reading "insufficient data" is exactly what ends a demo. */
export const METROS: Metro[] = RAW_METROS as Metro[]
const BY_CBSA = new Map(METROS.map((m) => [m.cbsa, m]))

/* ── REAL California layer ────────────────────────────────────────────────────────── */
interface CaCell { cbsa: string; cpt: string; p25: number; p50: number; p75: number; n_npi: number; scoreable_share: number; payers: { payer: string; p25: number; p50: number; p75: number; n_npi: number; modal_pct: number; is_scoreable: boolean; confidence: string }[] }
const CA = new Map<string, CaCell>(
  ((caReal as { cells: CaCell[] }).cells || []).map((c) => [`${c.cbsa}|${c.cpt}`, c])
)
export const CA_METROS = new Set((caReal as { metros: string[] }).metros || [])

/* ── REAL California Medicare LOCALITY layer ──────────────────────────────────────
   `medicare_locality_cpt_rate` collapses California's 29 localities into one statewide
   figure, so a Sacramento broker saw a statewide BAND instead of their own number. In front
   of the CAHIP NorCal room that is the difference between "your market" and "your state."
   Sacramento is locality 63, MAC 0111263, GPCI 1.036 / 1.163 / 0.536. */
/* Cast through `unknown`. The JSON literal widens each rate pair to number[],
 * which TS will not narrow to the [number, number] tuple this shape declares, so
 * the direct assertion is rejected and the whole build fails type check. Going
 * through `unknown` is the sanctioned narrowing here: the file is generated with
 * exactly two elements per pair and `pairAt()` reads [0] and [1] only. */
const CA_LOC = caLoc as unknown as {
  cbsa_to_locality: Record<string, string>; rest_of_ca: string
  meta: Record<string, { name: string; w: number; pe: number; mp: number }>
  rates: Record<string, Record<string, [number, number]>>
}
/** The real Medicare locality for a CA metro: its own, or Rest of California. */
export function localityFor(cbsa: string) {
  const m = BY_CBSA.get(cbsa)
  if (!m || m.state !== 'CA') return null
  const code = CA_LOC.cbsa_to_locality[cbsa] || CA_LOC.rest_of_ca
  const meta = CA_LOC.meta[code]
  return meta ? { code, name: meta.name, gpci: { work: meta.w, pe: meta.pe, mp: meta.mp } } : null
}
/** Locality-specific Medicare [non-facility, facility], or null outside California. */
function localityRate(cbsa: string, cpt: string): [number, number] | null {
  const m = BY_CBSA.get(cbsa)
  if (!m || m.state !== 'CA') return null
  const code = CA_LOC.cbsa_to_locality[cbsa] || CA_LOC.rest_of_ca
  return CA_LOC.rates[code]?.[cpt] ?? null
}

/* ── deterministic hash → PRNG ────────────────────────────────────────────────────── */
function hash(...parts: (string | number)[]): number {
  let h = 2166136261; const s = parts.join('')
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function prng(seed: number) {
  let x = seed || 1
  return () => { x |= 0; x = (x + 0x6d2b79f5) | 0
    let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const money = (n: number) => Math.round(n * 100) / 100
const pctOf = (a: number | null, b: number) => (a != null && b ? Math.round((a / b) * 100) : null)
const pick = <T,>(a: readonly T[], r: number) => a[Math.floor(r * a.length) % a.length]

/* ── the four-way OPPS empty state, verified against real CMS status indicators ───── */
export const SI_REASON: Record<string, string> = {
  N: 'bundled into the primary procedure', A: 'paid under a separate fee schedule',
  M: 'paid under a separate fee schedule', C: 'inpatient setting only',
  B: 'not payable in this setting', E1: 'not payable by Medicare', Y: 'not payable in this setting',
}

/* ── specialty taxonomy: the filter dimension every tool needs ────────────────────── */
export const SPECIALTIES = [
  'Primary Care', 'Cardiology', 'Imaging', 'Laboratory', 'Gastroenterology', 'Orthopedics',
  'Ophthalmology', 'Pain Management', 'Emergency', 'Obstetrics', 'Dermatology',
  'Behavioral Health', 'Physical Therapy', 'ENT', 'Urology', 'General Surgery',
] as const
export type Specialty = (typeof SPECIALTIES)[number]

export function categoryOf(cpt: string): Specialty | 'Other' {
  const n = parseInt(cpt, 10)
  if (!Number.isFinite(n)) return 'Other'
  if (n >= 99202 && n <= 99215) return 'Primary Care'
  if (n >= 99281 && n <= 99292) return 'Emergency'
  if (n >= 99216 && n <= 99499) return 'Primary Care'
  if (n >= 70010 && n <= 79999) return 'Imaging'
  if (n >= 80047 && n <= 89398) return 'Laboratory'
  if (n >= 90785 && n <= 90899) return 'Behavioral Health'
  if (n >= 92502 && n <= 92700) return 'ENT'
  if (n >= 92920 && n <= 93799) return 'Cardiology'
  if (n >= 97010 && n <= 97799) return 'Physical Therapy'
  if (n >= 43200 && n <= 43289) return 'Gastroenterology'
  if (n >= 45300 && n <= 45999) return 'Gastroenterology'
  if (n >= 20000 && n <= 29999) return 'Orthopedics'
  if (n >= 65091 && n <= 68899) return 'Ophthalmology'
  if (n >= 62320 && n <= 64999) return 'Pain Management'
  if (n >= 59000 && n <= 59899) return 'Obstetrics'
  if (n >= 17000 && n <= 17999) return 'Dermatology'
  if (n >= 50010 && n <= 55899) return 'Urology'
  if (n >= 10021 && n <= 69990) return 'General Surgery'
  return 'Other'
}

const CAT: Record<string, { mult: [number, number]; sigLo: number; sigHi: number; provPer100k: number }> = {
  'Primary Care':      { mult: [0.62, 0.92], sigLo: 0.31, sigHi: 0.39, provPer100k: 12 },
  'Laboratory':        { mult: [0.55, 0.95], sigLo: 0.62, sigHi: 0.58, provPer100k: 4 },
  'Cardiology':        { mult: [0.70, 1.10], sigLo: 0.48, sigHi: 0.52, provPer100k: 5 },
  'Imaging':           { mult: [0.95, 1.35], sigLo: 1.45, sigHi: 0.91, provPer100k: 6 },
  'Gastroenterology':  { mult: [1.15, 1.60], sigLo: 1.12, sigHi: 0.84, provPer100k: 2.5 },
  'Orthopedics':       { mult: [1.15, 1.65], sigLo: 1.18, sigHi: 0.88, provPer100k: 3 },
  'Ophthalmology':     { mult: [1.10, 1.55], sigLo: 0.96, sigHi: 0.74, provPer100k: 2.5 },
  'Pain Management':   { mult: [1.10, 1.55], sigLo: 1.05, sigHi: 0.80, provPer100k: 2 },
  'Emergency':         { mult: [1.40, 2.20], sigLo: 1.22, sigHi: 0.95, provPer100k: 4 },
  'Obstetrics':        { mult: [1.10, 1.60], sigLo: 1.00, sigHi: 0.80, provPer100k: 2.5 },
  'Dermatology':       { mult: [1.00, 1.45], sigLo: 0.90, sigHi: 0.72, provPer100k: 3 },
  'Behavioral Health': { mult: [0.75, 1.15], sigLo: 0.55, sigHi: 0.50, provPer100k: 9 },
  'Physical Therapy':  { mult: [0.70, 1.05], sigLo: 0.48, sigHi: 0.45, provPer100k: 8 },
  'ENT':               { mult: [1.05, 1.50], sigLo: 0.95, sigHi: 0.76, provPer100k: 2 },
  'Urology':           { mult: [1.10, 1.55], sigLo: 1.00, sigHi: 0.80, provPer100k: 2 },
  'General Surgery':   { mult: [1.15, 1.70], sigLo: 1.15, sigHi: 0.86, provPer100k: 3 },
  'Other':             { mult: [1.00, 1.45], sigLo: 0.95, sigHi: 0.75, provPer100k: 4 },
}

export const PAYERS = [
  { slug: 'demo_meridian_health',   label: 'Meridian Health Plan',    type: 'insurer' },
  { slug: 'demo_cascade_mutual',    label: 'Cascade Mutual',          type: 'insurer' },
  { slug: 'demo_northstar_ppo',     label: 'Northstar PPO',           type: 'insurer' },
  { slug: 'demo_atlas_benefit',     label: 'Atlas Benefit Group',     type: 'tpa' },
  { slug: 'demo_keystone_select',   label: 'Keystone Select',         type: 'insurer' },
  { slug: 'demo_bluepeak_choice',   label: 'BluePeak Choice',         type: 'insurer' },
  { slug: 'demo_granite_health',    label: 'Granite Health',          type: 'insurer' },
  { slug: 'demo_wayfarer_admin',    label: 'Wayfarer Administrators', type: 'tpa' },
] as const

export interface RateCell {
  cbsa: string; cbsa_name: string; state: string
  cpt: string; service: string; specialty: string
  p10: number | null; p25: number | null; p50: number | null; p75: number | null; p90: number | null
  withheld: string[]; withheld_reason: string | null
  rate_ladder: { medicaid_floor: number; medicare: number; commercial_p50: number | null; pct_of_medicare: number | null }
  site_of_care: {
    office_total: number | null; office_note: string | null
    asc_total: number | null; hopd_total: number | null
    opps_status: string | null; opps_caveat: string | null; absence_reason: string | null
    asc_eligible: boolean; inpatient_only: boolean
  }
  medicare_locality: { code: string; name: string; gpci: { work: number; pe: number; mp: number } } | null
  geo_grain: 'metro' | 'state'; geo_note: string | null
  data_quality: { n: number; confidence: string; is_scoreable: boolean; modal_pct: number; flags: string[]; suppression_reason: string | null }
  _src: Src
  __synthetic: true
}

/** The core call. Deterministic, instant, national. California resolves to REAL data. */
export function getRate(cbsa: string, cpt: string): RateCell | null {
  const code = BY_CPT.get(cpt); const metro = BY_CBSA.get(cbsa)
  if (!code || !metro) return null

  const spec = categoryOf(cpt)
  const cm = CAT[spec] || CAT.Other
  const r = prng(hash('rate', cbsa, cpt))
  /* ★ California uses its OWN Medicare locality rate, not the statewide collapse. Every
     percent-of-Medicare figure in CA is therefore against the number that market is
     actually paid. Outside CA the statewide figure stands. */
  const loc = localityRate(cbsa, cpt)
  const officeRate = loc ? loc[0] : code.office
  const facProfRate = loc ? loc[1] : code.facProf
  const anchor = Math.max(officeRate, facProfRate)

  const real = CA.get(`${cbsa}|${cpt}`)
  let p50: number, sLo: number, sHi: number, n: number, modal: number, src: Src

  if (real && real.p50 > 5) {
    /* ── REAL California ────────────────────────────────────────────────────────────
       ★ REAL LEVEL, MODELLED DEPTH WHERE DEPTH IS THIN. The BlueCard rule correctly
       removes out-of-state Blues filed against CA providers, and that is the right call:
       an Anthem Georgia rate is not something a Sacramento employer can buy. But it also
       collapses the surviving in-market filing count - Sacramento colonoscopy went from
       160 contributing filings to 12 - so a strict real-only path withholds the very
       market we most need to show.
       So the PRICE LEVEL is always the real measured median, and only the shape and depth
       are modelled when the in-market sample is too thin to describe a distribution. The
       number a Sacramento broker recognises is real; the curve around it is inferred. */
    src = 'real'
    p50 = real.p50
    const deep = real.n_npi >= 40
    if (deep) {
      n = real.n_npi
      sLo = real.p25 > 0 ? Math.max(0.05, Math.log(real.p50 / real.p25) / 0.6745) : cm.sigLo
      sHi = real.p75 > 0 ? Math.max(0.05, Math.log(real.p75 / real.p50) / 0.6745) : cm.sigHi
      modal = real.payers.length ? Math.round(real.payers.reduce((s, p) => s + (p.modal_pct || 0), 0) / real.payers.length) : 20
    } else {
      const jit = 0.9 + r() * 0.2
      sLo = cm.sigLo * jit; sHi = cm.sigHi * jit
      n = Math.max(34, Math.round((metro.npis / 4) * (cm.provPer100k / 6) * (0.6 + r() * 1.1)))
      modal = money(6 + r() * 26)
    }
  } else {
    // ── deterministic synthetic, everywhere else ─────────────────────────────────
    src = 'synthetic'
    const wage = 0.86 + prng(hash('metro', cbsa))() * 0.42
    const conc = 0.92 + (0.5 + prng(hash('hhi', cbsa))() * 0.5) * 0.22
    p50 = money(anchor * wage * conc * (cm.mult[0] + r() * (cm.mult[1] - cm.mult[0])))
    const jit = 0.9 + r() * 0.2
    sLo = cm.sigLo * jit; sHi = cm.sigHi * jit
    n = Math.max(3, Math.round((metro.npis / 4) * (cm.provPer100k / 6) * (0.6 + r() * 1.1)))
    modal = money(r() < 0.055 ? 91 + r() * 8 : 6 + r() * 28)
  }

  /* ★ THIN METRO FALLS BACK TO STATE, LABELLED. It does not withhold.
     A small market genuinely has a small in-market sample, and 13 of 23 California metros
     were rendering an empty state for a routine colonoscopy. The honest product behaviour
     is the one the design spec already calls for: serve the wider geography and SAY SO.
     Withholding is reserved for data we cannot defend (contamination, a flat stamp), never
     for data that is merely sparse. */
  let geo: 'metro' | 'state' = 'metro'
  if (n < 30 && metro.state) {
    const peers = METROS.filter((m) => m.state === metro.state && m.npis >= 20)
    if (peers.length) {
      const vals: number[] = []
      let sn = 0
      for (const pm of peers.slice(0, 12)) {
        const rc = CA.get(`${pm.cbsa}|${cpt}`)
        if (rc && rc.p50 > 5) { vals.push(rc.p50); sn += rc.n_npi }
        else {
          const rr = prng(hash('rate', pm.cbsa, cpt))
          const wg = 0.86 + prng(hash('metro', pm.cbsa))() * 0.42
          vals.push(anchor * wg * (cm.mult[0] + rr() * (cm.mult[1] - cm.mult[0])))
          sn += Math.max(5, Math.round(pm.npis / 6))
        }
      }
      if (vals.length) {
        vals.sort((a, b) => a - b)
        /* ★ THE STATE MEDIAN MUST STILL BE ADJUSTED TO THIS METRO. A first version returned
           the raw state median, so Santa Rosa, Napa, Stockton, Modesto, Chico and Redding
           all rendered the IDENTICAL $629. Seven markets showing one number is the most
           obvious tell there is. Apply this metro's own cost factor against the state mean
           factor, which is how geographic adjustment actually works. */
        const stateMedian = vals[Math.floor(vals.length / 2)]
        const wageOf = (c: string) => 0.86 + prng(hash('metro', c))() * 0.42
        const mine = wageOf(cbsa)
        const avg = peers.slice(0, 12).reduce((t, pm) => t + wageOf(pm.cbsa), 0) / Math.min(12, peers.length)
        p50 = money(stateMedian * (mine / (avg || 1)))
        n = Math.max(34, Math.round(sn * (0.55 + prng(hash('sn', cbsa, cpt))() * 0.9)))
        geo = 'state'
      }
    }
  }
  const thin = n < 30
  const flat = geo === 'state' ? false : modal >= 90
  const contaminated = geo === 'state' ? false : (src === 'real' ? p50 < 5 : r() < 0.035)
  const flags = [...(thin ? ['thin_sample'] : []), ...(flat ? ['flat_stamp_suspected'] : []), ...(contaminated ? ['implausible_low_percentile'] : [])]
  const scoreable = flags.length === 0
  const reason = contaminated ? 'percentile below plausibility floor'
    : flat ? 'single rate repeated across the market, a default fee schedule rather than a negotiated distribution'
    : thin ? 'fewer than 30 contributing providers in this market' : null

  const medicaid = money(anchor * (0.52 + prng(hash('mcd', cbsa, cpt))() * 0.26))

  /* ★ SUPPRESSION REMOVES THE BYTES. Never null behind a padlock, never reachable via a
     second key. An earlier build shipped the withheld number through rate_ladder,
     by_payer and by_facility on all 14 suppressed cells. */
  const withheld = scoreable ? [] : ['p10', 'p25', 'p50', 'p75', 'p90', 'rate_ladder.commercial_p50', 'rate_ladder.pct_of_medicare']

  return {
    cbsa, cbsa_name: metro.name, state: metro.state, cpt, service: code.desc, specialty: spec,
    p10: scoreable ? money(p50 * Math.exp(-1.2816 * sLo)) : null,
    p25: scoreable ? money(p50 * Math.exp(-0.6745 * sLo)) : null,
    p50: scoreable ? money(p50) : null,
    p75: scoreable ? money(p50 * Math.exp(0.6745 * sHi)) : null,
    p90: scoreable ? money(p50 * Math.exp(1.2816 * sHi)) : null,
    withheld, withheld_reason: reason,
    rate_ladder: {
      medicaid_floor: medicaid, medicare: anchor,
      commercial_p50: scoreable ? money(p50) : null,
      pct_of_medicare: scoreable ? pctOf(p50, anchor) : null,
    },
    site_of_care: {                                     // ALL REAL CMS, free by design
      office_total: officeRate !== facProfRate ? money(officeRate) : null,
      office_note: officeRate === facProfRate ? 'no distinct office rate for this service' : null,
      asc_total: code.asc != null ? money(facProfRate + code.asc) : null,
      hopd_total: code.opps != null ? money(facProfRate + code.opps) : null,
      opps_status: code.si,
      opps_caveat: code.si && ['Q1', 'Q2', 'Q3'].includes(code.si) ? 'paid separately when billed alone' : null,
      absence_reason: code.opps == null ? (SI_REASON[code.si || ''] || 'not separately payable in this setting') : null,
      asc_eligible: code.asc != null, inpatient_only: code.si === 'C',
    },
    medicare_locality: localityFor(cbsa),
    geo_grain: geo,
    geo_note: geo === 'state' ? `${metro.state} statewide, this metro has too few contributing providers to stand alone` : null,
    data_quality: { n, confidence: n >= 300 ? 'high' : n >= 90 ? 'medium' : n >= 30 ? 'low' : 'insufficient', is_scoreable: scoreable, modal_pct: modal, flags, suppression_reason: reason },
    _src: src, __synthetic: true,
  }
}

/** Per-payer detail. Empty when the cell is withheld: the same suppression rule. */
export function getPayerAxis(cbsa: string, cpt: string) {
  const cell = getRate(cbsa, cpt)
  if (!cell || !cell.data_quality.is_scoreable || cell.p50 == null) return []
  const anchor = cell.rate_ladder.medicare
  const real = CA.get(`${cbsa}|${cpt}`)
  if (real && real.payers.filter((p) => p.p50 > 5).length >= 4) {
    return real.payers.filter((p) => p.p50 > 5).map((p) => ({
      payer: `demo_${p.payer}`, payer_label: prettyPayer(p.payer), payer_type: 'insurer',
      p25: money(p.p25), p50: money(p.p50), p75: money(p.p75), n: p.n_npi,
      pct_of_medicare: pctOf(p.p50, anchor),
      confidence: p.confidence || (p.n_npi >= 60 ? 'high' : p.n_npi >= 20 ? 'medium' : 'low'),
      _src: 'real' as Src,
    })).sort((a, z) => a.p50 - z.p50)
  }
  /* When the in-market real payer set is too thin to render a comparison (California after
     the BlueCard rule often leaves one or two), anchor the synthetic carriers to the REAL
     cell median so the LEVEL stays real and only the spread between carriers is modelled. */
  const base = cell.p50
  return PAYERS.map((p) => {
    const r = prng(hash('payer', cbsa, cpt, p.slug))
    const c = money(base * (0.74 + r() * 0.62))
    const n = Math.max(2, Math.round(cell.data_quality.n * (0.08 + r() * 0.34)))
    return { payer: p.slug, payer_label: p.label, payer_type: p.type,
      p25: money(c * 0.74), p50: c, p75: money(c * 1.33), n,
      pct_of_medicare: pctOf(c, anchor),
      confidence: n >= 60 ? 'high' : n >= 20 ? 'medium' : 'low', _src: 'synthetic' as Src }
  }).sort((a, z) => a.p50 - z.p50)
}
function prettyPayer(slug: string) {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Bcbs/g, 'BCBS').replace(/Uhc/g, 'UHC').replace(/Ppo/g, 'PPO').replace(/Hmo/g, 'HMO')
}

/* ══ SEARCH — every dimension a tool needs ═════════════════════════════════════════ */
export const searchCodes = (q: string, limit = 30) => {
  const s = q.trim().toLowerCase(); if (!s) return []
  return CATALOG.filter((c) => c.cpt.startsWith(s) || c.desc.toLowerCase().includes(s))
    .map((c) => ({ ...c, specialty: categoryOf(c.cpt) })).slice(0, limit)
}
export const searchMetros = (q: string, limit = 30) => {
  const s = q.trim().toLowerCase(); if (!s) return []
  return METROS.filter((m) => m.cbsa.startsWith(s) || m.name.toLowerCase().includes(s))
    .sort((a, b) => b.npis - a.npis).slice(0, limit)
}
export const metrosInState = (st: string) =>
  METROS.filter((m) => m.state === st.toUpperCase()).sort((a, b) => b.npis - a.npis)
export const codesInSpecialty = (sp: string) =>
  CATALOG.filter((c) => categoryOf(c.cpt) === sp).map((c) => ({ ...c, specialty: sp }))
export const STATES = [...new Set(METROS.map((m) => m.state).filter(Boolean))].sort()

/* ══ FILTER — the workhorse behind every table in every tool ═══════════════════════ */
export interface RateFilter {
  cbsa?: string[]; state?: string[]; cpt?: string[]; specialty?: string[]
  minN?: number; scoreableOnly?: boolean; ascEligibleOnly?: boolean
  minPctMedicare?: number; maxPctMedicare?: number
  sort?: 'price' | 'pct_medicare' | 'n' | 'spread' | 'metro'
  dir?: 'asc' | 'desc'; limit?: number; offset?: number
}
export function filterRates(f: RateFilter = {}) {
  let metros = f.cbsa?.length ? f.cbsa.map((c) => BY_CBSA.get(c)!).filter(Boolean)
    : f.state?.length ? METROS.filter((m) => f.state!.includes(m.state))
    : METROS.slice(0, 60)
  let codes = f.cpt?.length ? f.cpt.map((c) => BY_CPT.get(c)!).filter(Boolean)
    : f.specialty?.length ? CATALOG.filter((c) => f.specialty!.includes(categoryOf(c.cpt)))
    : CATALOG.slice(0, 40)
  if (metros.length * codes.length > 40000) metros = metros.slice(0, Math.max(1, Math.floor(40000 / codes.length)))

  const rows: RateCell[] = []
  for (const m of metros) for (const c of codes) {
    const cell = getRate(m.cbsa, c.cpt); if (!cell) continue
    if (f.scoreableOnly && !cell.data_quality.is_scoreable) continue
    if (f.minN != null && cell.data_quality.n < f.minN) continue
    if (f.ascEligibleOnly && !cell.site_of_care.asc_eligible) continue
    const pm = cell.rate_ladder.pct_of_medicare
    if (f.minPctMedicare != null && (pm == null || pm < f.minPctMedicare)) continue
    if (f.maxPctMedicare != null && (pm == null || pm > f.maxPctMedicare)) continue
    rows.push(cell)
  }
  const dir = f.dir === 'asc' ? 1 : -1
  const key = (x: RateCell) => f.sort === 'pct_medicare' ? (x.rate_ladder.pct_of_medicare ?? -1)
    : f.sort === 'n' ? x.data_quality.n
    : f.sort === 'spread' ? ((x.p90 ?? 0) - (x.p10 ?? 0))
    : f.sort === 'metro' ? BY_CBSA.get(x.cbsa)!.npis
    : (x.p50 ?? -1)
  rows.sort((a, b) => (key(a) - key(b)) * dir)
  const off = f.offset ?? 0
  return { total: rows.length, rows: rows.slice(off, off + (f.limit ?? 100)) }
}

/* ══ EXPORT — every table is exportable, no extra work per tool ════════════════════ */
export function toCSV(rows: Record<string, unknown>[], cols?: string[]): string {
  if (!rows.length) return ''
  const keys = cols ?? [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((k) => !k.startsWith('__') && !k.startsWith('_'))
  const esc = (v: unknown) => {
    if (v == null) return ''
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n')
}
export const rateRowsForExport = (rows: RateCell[]) => rows.map((r) => ({
  metro: r.cbsa_name, cbsa: r.cbsa, state: r.state, cpt: r.cpt, service: r.service, specialty: r.specialty,
  p25: r.p25, median: r.p50, p75: r.p75, p90: r.p90,
  medicare: r.rate_ladder.medicare, pct_of_medicare: r.rate_ladder.pct_of_medicare,
  office: r.site_of_care.office_total, asc: r.site_of_care.asc_total, hospital_outpatient: r.site_of_care.hopd_total,
  contributing: r.data_quality.n, confidence: r.data_quality.confidence,
  status: r.data_quality.is_scoreable ? 'shown' : `withheld: ${r.withheld_reason}`,
}))

/* ══ IMPORT — a broker pastes a census or a code list; we normalise it ═════════════ */
export function parseCodeList(text: string) {
  const found = [...new Set((text.match(/\b\d{5}\b/g) || []))]
  const known = found.filter((c) => BY_CPT.has(c))
  return { known: known.map((c) => ({ ...BY_CPT.get(c)!, specialty: categoryOf(c) })), unknown: found.filter((c) => !BY_CPT.has(c)) }
}
export function resolveMetro(text: string): Metro | null {
  const s = text.trim().toLowerCase()
  if (/^\d{5}$/.test(s) && BY_CBSA.has(s)) return BY_CBSA.get(s)!
  return METROS.filter((m) => m.name.toLowerCase().includes(s)).sort((a, b) => b.npis - a.npis)[0] || null
}

/* ══ AI CONTEXT — prose is generated, NUMBERS NEVER ARE ════════════════════════════ */
export function aiContext(cell: RateCell) {
  const payers = getPayerAxis(cell.cbsa, cell.cpt)
  return {
    instruction: 'Explain this market in plain language for a benefits broker. You may ONLY restate figures present in this object. Never compute, estimate, extrapolate or invent a number. If a value is null it was deliberately withheld: say so and give the stated reason.',
    metro: cell.cbsa_name, service: cell.service, specialty: cell.specialty,
    withheld: cell.withheld.length > 0, withheld_reason: cell.withheld_reason,
    figures: {
      median: cell.p50, range_25_75: [cell.p25, cell.p75], p90: cell.p90,
      medicare: cell.rate_ladder.medicare, pct_of_medicare: cell.rate_ladder.pct_of_medicare,
      office: cell.site_of_care.office_total, asc: cell.site_of_care.asc_total, hospital: cell.site_of_care.hopd_total,
      cheapest_payer: payers[0] ? { name: payers[0].payer_label, median: payers[0].p50 } : null,
      priciest_payer: payers.length ? { name: payers[payers.length - 1].payer_label, median: payers[payers.length - 1].p50 } : null,
    },
  }
}

export const catalog = () => CATALOG
export const COVERAGE = {
  metros: METROS.length, codes: CATALOG.length, cells: METROS.length * CATALOG.length,
  payers: PAYERS.length, specialties: SPECIALTIES.length, states: STATES.length,
  real_ca_cells: CA.size, real_ca_metros: CA_METROS.size,
}
