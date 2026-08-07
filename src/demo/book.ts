/**
 * src/demo/book.ts — THE BOOK LAYER: networks, employer groups, facilities, trend, baskets.
 *
 * The rate engine answers "what does this procedure cost here." That is a lookup. It is not
 * yet a business. These five surfaces are what turn it into one:
 *
 *   NETWORKS   which carrier network a group can actually buy, scored on one honest unit
 *   GROUPS     a broker's or GA's actual book, nationally, filterable every way
 *   FACILITIES the named place a member should go, which is what makes steerage actionable
 *   TREND      what moved since last year, which is the whole renewal conversation
 *   BASKET     one number for THIS group's own mix of services
 *
 * Everything is deterministic from a hash of its identity, so the same group, the same
 * network and the same book always return the same figures. Nationally complete: any metro,
 * any state, any book size. Fabricated, and isolated by the same containment as the rest of
 * the demo layer (checksum-invalid NPIs, demo_/DEMO- prefixes, a throwing runtime gate).
 */
import { getRate, getPayerAxis, METROS, PAYERS, categoryOf, catalog, type RateCell } from './engine'

/* ── deterministic primitives ─────────────────────────────────────────────────────── */
function hash(...p: (string | number)[]): number {
  let h = 2166136261; const s = p.join('')
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
const pickOne = <T,>(a: readonly T[], r: number) => a[Math.floor(r * a.length) % a.length]
const BY_CBSA = new Map(METROS.map((m) => [m.cbsa, m]))

/* ══ 1. NETWORKS ═══════════════════════════════════════════════════════════════════
   A broker does not buy "a payer", they buy a NETWORK PRODUCT. Breadth and price trade
   off against each other, and the trade is the entire conversation: a narrow network is
   cheaper per service and disrupts more of the member's existing doctors. */
export const NETWORK_TYPES = [
  { key: 'ppo_broad',   label: 'Broad PPO',        breadth: 0.94, priceIdx: 1.00, disrupt: 0.03 },
  { key: 'ppo_std',     label: 'Standard PPO',     breadth: 0.86, priceIdx: 0.94, disrupt: 0.09 },
  { key: 'epo',         label: 'EPO',              breadth: 0.72, priceIdx: 0.87, disrupt: 0.19 },
  { key: 'hmo',         label: 'HMO',              breadth: 0.63, priceIdx: 0.81, disrupt: 0.28 },
  { key: 'narrow',      label: 'Narrow network',   breadth: 0.41, priceIdx: 0.71, disrupt: 0.47 },
  { key: 'tiered',      label: 'Tiered network',   breadth: 0.79, priceIdx: 0.85, disrupt: 0.14 },
] as const

export interface Network {
  id: string; payer: string; payer_label: string; product: string; type: string
  breadth_pct: number; disruption_pct: number
  pct_of_medicare: number | null; index_vs_broadest: number | null
  providers_in_network: number; hospitals: number
  __synthetic: true
}

/** Every network a group in this metro can actually buy, ranked on one honest unit. */
export function getNetworks(cbsa: string, basket?: string[]): Network[] {
  const metro = BY_CBSA.get(cbsa); if (!metro) return []
  const codes = basket?.length ? basket : DEFAULT_BASKET
  const out: Network[] = []
  for (const p of PAYERS) {
    const r = prng(hash('net', cbsa, p.slug))
    const n = 2 + Math.floor(r() * 3)                       // 2-4 products per carrier
    const types = [...NETWORK_TYPES].sort(() => r() - 0.5).slice(0, n)
    for (const t of types) {
      const pcts: number[] = []
      for (const cpt of codes) {
        const cell = getRate(cbsa, cpt)
        if (!cell?.rate_ladder.pct_of_medicare) continue
        pcts.push(cell.rate_ladder.pct_of_medicare * t.priceIdx * (0.94 + r() * 0.12))
      }
      const pct = pcts.length ? Math.round(pcts.reduce((s, x) => s + x, 0) / pcts.length) : null
      out.push({
        id: `${p.slug}__${t.key}`, payer: p.slug, payer_label: p.label,
        product: `${p.label} ${t.label}`, type: t.key,
        breadth_pct: Math.round(t.breadth * 100 * (0.94 + r() * 0.12)),
        disruption_pct: Math.round(t.disrupt * 100 * (0.85 + r() * 0.3)),
        pct_of_medicare: pct, index_vs_broadest: null,
        providers_in_network: Math.round(metro.npis * t.breadth * (0.8 + r() * 0.4) * 12),
        hospitals: Math.max(1, Math.round(metro.npis / 90 * t.breadth * (0.7 + r() * 0.6))),
        __synthetic: true,
      })
    }
  }
  const broadest = out.reduce((a, b) => ((a.pct_of_medicare ?? 0) > (b.pct_of_medicare ?? 0) ? a : b), out[0])
  for (const nw of out) {
    nw.index_vs_broadest = nw.pct_of_medicare && broadest?.pct_of_medicare
      ? Math.round((nw.pct_of_medicare / broadest.pct_of_medicare) * 100) : null
  }
  return out.sort((a, b) => (a.pct_of_medicare ?? 9e9) - (b.pct_of_medicare ?? 9e9))
}

/* ══ 2. THE BASKET ═════════════════════════════════════════════════════════════════
   One number for a group's OWN mix. Utilisation weights per 1,000 members per year. */
export const DEFAULT_BASKET = ['99214', '99213', '45378', '70553', '73721', '74177', '43239', '29881', '66984', '64483']
const UTIL: Record<string, number> = {
  '99213': 2100, '99214': 1900, '99215': 420, '99203': 380, '99204': 460,
  '70553': 8, '73721': 16, '74177': 22, '77067': 210, '93000': 340,
  '45378': 14, '45380': 9, '43239': 11, '29881': 4.5, '29827': 2.8,
  '66984': 6, '64483': 12, '27447': 3.2, '99285': 170, '59400': 11,
}
export interface BasketResult {
  cbsa: string; cbsa_name: string; lives: number
  lines: { cpt: string; service: string; specialty: string; cases: number; unit: number | null; annual: number | null; pct_of_medicare: number | null; withheld: boolean }[]
  annual_total: number; weighted_pct_of_medicare: number | null
  priced_lines: number; withheld_lines: number
  __synthetic: true
}
/** Cost this group's own basket in their own market. Withheld lines are counted, not faked. */
export function priceBasket(cbsa: string, lives: number, basket: string[] = DEFAULT_BASKET): BasketResult {
  const metro = BY_CBSA.get(cbsa)
  const lines = basket.map((cpt) => {
    const cell = getRate(cbsa, cpt)
    const cases = Math.round(((UTIL[cpt] ?? 12) / 1000) * lives * 10) / 10
    const unit = cell?.p50 ?? null
    return {
      cpt, service: cell?.service ?? cpt, specialty: String(categoryOf(cpt)),
      cases, unit, annual: unit != null ? money(unit * cases) : null,
      pct_of_medicare: cell?.rate_ladder.pct_of_medicare ?? null,
      withheld: !cell || !cell.data_quality.is_scoreable,
    }
  })
  const priced = lines.filter((l) => l.annual != null)
  const total = money(priced.reduce((s, l) => s + (l.annual ?? 0), 0))
  const wpct = priced.length
    ? Math.round(priced.reduce((s, l) => s + (l.pct_of_medicare ?? 0) * (l.annual ?? 0), 0) / (total || 1))
    : null
  return {
    cbsa, cbsa_name: metro?.name ?? cbsa, lives, lines,
    annual_total: total, weighted_pct_of_medicare: wpct,
    priced_lines: priced.length, withheld_lines: lines.length - priced.length, __synthetic: true,
  }
}

/* ══ 3. EMPLOYER GROUPS — a real book, nationally, filterable every way ════════════ */
const INDUSTRIES = ['Manufacturing', 'Construction', 'Professional services', 'Retail', 'Transportation & logistics',
  'Agriculture', 'Hospitality', 'Technology', 'Healthcare services', 'Financial services', 'Education',
  'Public sector', 'Non-profit', 'Wholesale distribution', 'Food production'] as const
const STEM = ['Harbor Point', 'Cedarline', 'Vantage Ridge', 'Ironwood', 'Blue Harbor', 'Summit Field', 'Northgate',
  'Lakeshore', 'Pioneer', 'Redstone', 'Fairmount', 'Copperfield', 'Stonebridge', 'Willow Bend', 'Granite Peak',
  'Silver Creek', 'Foxfield', 'Cascade Point', 'Marlow', 'Kestrel', 'Birchwood', 'Halcyon', 'Ridgeline', 'Talon'] as const
const SUFFIX = ['Manufacturing', 'Logistics', 'Foods', 'Construction', 'Group', 'Services', 'Partners', 'Industries',
  'Systems', 'Holdings', 'Cooperative', 'Transport', 'Technologies', 'Senior Living', 'Distribution'] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
export const BROKERAGES = [
  { id: 'demo_bkr_1', name: 'Meridian Benefit Advisors' },
  { id: 'demo_bkr_2', name: 'Cornerstone Risk Partners' },
  { id: 'demo_bkr_3', name: 'Alder Creek Benefits' },
  { id: 'demo_bkr_4', name: 'Sutter Gate Advisors' },
  { id: 'demo_bkr_5', name: 'Pacific Ridge Group' },
] as const

const BASKET_1K = new Map<string, number>()
function basketPer1k(cbsa: string): number {
  let v = BASKET_1K.get(cbsa)
  if (v === undefined) { v = priceBasket(cbsa, 1000).annual_total; BASKET_1K.set(cbsa, v) }
  return v
}

export interface Group {
  group_id: string; name: string; industry: string
  cbsa: string; cbsa_name: string; state: string
  lives: number; funding: 'self-funded' | 'level-funded' | 'fully-insured'
  renewal_month: string; renewal_quarter: string
  carrier: string; carrier_label: string; network_type: string
  annual_spend: number; pmpm: number; trend_pct: number
  opportunity: number; opportunity_pct: number
  brokerage_id: string; brokerage_name: string; producer: string
  risk: 'low' | 'watch' | 'at risk'
  __synthetic: true
}

/* ★ MEMOISED. Groups are a pure function of the metro, but bookRollup -> filterGroups calls
   this for up to 120 metros and each call rebuilt 60 groups, each pricing a 10-code basket.
   That is ~72,000 rate lookups per rollup, recomputed on every view. Cache per metro. */
const GROUPS = new Map<string, Group[]>()

/** Deterministic book for a metro. Same metro, same groups, forever. */
export function groupsInMetro(cbsa: string, count?: number): Group[] {
  if (count == null) { const c = GROUPS.get(cbsa); if (c) return c }
  const metro = BY_CBSA.get(cbsa); if (!metro) return []
  const r = prng(hash('groups', cbsa))
  const n = count ?? Math.max(3, Math.min(60, Math.round(metro.npis / 12) + 3))
  const out: Group[] = []
  for (let i = 0; i < n; i++) {
    const g = prng(hash('grp', cbsa, i))
    const lives = Math.round(28 + Math.pow(g(), 2.4) * 4200)
    const funding = lives > 650 ? 'self-funded' : lives > 260 ? 'level-funded' : 'fully-insured'
    const bk = pickOne(BROKERAGES, g())
    const payer = pickOne(PAYERS, g())
    const nt = pickOne(NETWORK_TYPES, g())
    const mi = Math.floor(g() * 12)
    const spend = money(lives * (6200 + g() * 3400))
    /* Price the basket ONCE per metro at 1,000 lives and scale, rather than re-pricing it
       per group. The basket is linear in lives, so this is the same number for a fraction
       of the work: 60 groups per metro went from 60 basket prices to one. */
    const opp = money(basketPer1k(cbsa) * (lives / 1000) * (0.012 + g() * 0.021))
    const trend = money(4.1 + g() * 9.9)
    out.push({
      group_id: `demo_grp_${cbsa}_${String(i + 1).padStart(3, '0')}`,
      name: `${pickOne(STEM, g())} ${pickOne(SUFFIX, g())}`,
      industry: pickOne(INDUSTRIES, g()),
      cbsa, cbsa_name: metro.name, state: metro.state,
      lives, funding,
      renewal_month: MONTHS[mi], renewal_quarter: `Q${Math.floor(mi / 3) + 1}`,
      carrier: payer.slug, carrier_label: payer.label, network_type: nt.label,
      annual_spend: spend, pmpm: money(spend / lives / 12), trend_pct: trend,
      opportunity: opp, opportunity_pct: money((opp / spend) * 100),
      brokerage_id: bk.id, brokerage_name: bk.name,
      producer: `${pickOne(['A.', 'J.', 'M.', 'R.', 'S.', 'T.', 'K.', 'D.'], g())} ${pickOne(['Alvarez', 'Brennan', 'Chen', 'Delgado', 'Ellis', 'Fischer', 'Grant', 'Hayes', 'Iqbal', 'Novak'], g())}`,
      risk: trend > 11 ? 'at risk' : trend > 8 ? 'watch' : 'low',
      __synthetic: true,
    })
  }
  if (count == null) GROUPS.set(cbsa, out)
  return out
}

export interface GroupFilter {
  state?: string[]; cbsa?: string[]; industry?: string[]; funding?: string[]
  renewalMonth?: string[]; renewalQuarter?: string[]; carrier?: string[]
  brokerage?: string[]; risk?: string[]
  minLives?: number; maxLives?: number; minOpportunity?: number
  q?: string
  sort?: 'lives' | 'spend' | 'opportunity' | 'trend' | 'renewal' | 'name'
  dir?: 'asc' | 'desc'; limit?: number; offset?: number
}
/** The book, filtered every way a broker or GA actually slices it. */
export function filterGroups(f: GroupFilter = {}) {
  /* ★ The national default must actually mean NATIONAL. An earlier version took
     METROS.slice(0, 40), which is the first 40 by CBSA CODE (Aberdeen, Abilene, Ada...),
     so a national rollup returned FEWER groups than California alone. Rank by real market
     size instead, and let an explicit cbsa/state filter widen it without limit. */
  const metros = f.cbsa?.length ? f.cbsa.map((c) => BY_CBSA.get(c)!).filter(Boolean)
    : f.state?.length ? METROS.filter((m) => f.state!.includes(m.state))
    : [...METROS].sort((a, b) => b.npis - a.npis).slice(0, 300)
  let rows: Group[] = []
  for (const m of metros) rows.push(...groupsInMetro(m.cbsa))
  const q = f.q?.trim().toLowerCase()
  rows = rows.filter((g) =>
    (!f.industry?.length || f.industry.includes(g.industry)) &&
    (!f.funding?.length || f.funding.includes(g.funding)) &&
    (!f.renewalMonth?.length || f.renewalMonth.includes(g.renewal_month)) &&
    (!f.renewalQuarter?.length || f.renewalQuarter.includes(g.renewal_quarter)) &&
    (!f.carrier?.length || f.carrier.includes(g.carrier)) &&
    (!f.brokerage?.length || f.brokerage.includes(g.brokerage_id)) &&
    (!f.risk?.length || f.risk.includes(g.risk)) &&
    (f.minLives == null || g.lives >= f.minLives) &&
    (f.maxLives == null || g.lives <= f.maxLives) &&
    (f.minOpportunity == null || g.opportunity >= f.minOpportunity) &&
    (!q || g.name.toLowerCase().includes(q) || g.industry.toLowerCase().includes(q) ||
      g.cbsa_name.toLowerCase().includes(q) || g.producer.toLowerCase().includes(q))
  )
  const dir = f.dir === 'asc' ? 1 : -1
  const key = (g: Group) => f.sort === 'spend' ? g.annual_spend : f.sort === 'trend' ? g.trend_pct
    : f.sort === 'renewal' ? MONTHS.indexOf(g.renewal_month as typeof MONTHS[number])
    : f.sort === 'name' ? 0 : f.sort === 'lives' ? g.lives : g.opportunity
  rows.sort((a, b) => f.sort === 'name' ? a.name.localeCompare(b.name) * dir : (key(a) - key(b)) * dir)
  const off = f.offset ?? 0
  return {
    total: rows.length,
    lives: rows.reduce((s, g) => s + g.lives, 0),
    spend: money(rows.reduce((s, g) => s + g.annual_spend, 0)),
    opportunity: money(rows.reduce((s, g) => s + g.opportunity, 0)),
    rows: rows.slice(off, off + (f.limit ?? 50)),
  }
}

/** GA view: the same book rolled up by downstream brokerage. */
export function bookRollup(f: GroupFilter = {}) {
  const all = filterGroups({ ...f, limit: 100000 })
  const by = new Map<string, { id: string; name: string; groups: number; lives: number; spend: number; opportunity: number; at_risk: number }>()
  for (const g of all.rows) {
    const e = by.get(g.brokerage_id) ?? { id: g.brokerage_id, name: g.brokerage_name, groups: 0, lives: 0, spend: 0, opportunity: 0, at_risk: 0 }
    e.groups++; e.lives += g.lives; e.spend += g.annual_spend; e.opportunity += g.opportunity
    if (g.risk === 'at risk') e.at_risk++
    by.set(g.brokerage_id, e)
  }
  const renewals = MONTHS.map((m) => ({
    month: m,
    groups: all.rows.filter((g) => g.renewal_month === m).length,
    lives: all.rows.filter((g) => g.renewal_month === m).reduce((s, g) => s + g.lives, 0),
  }))
  return {
    total_groups: all.total, total_lives: all.lives, total_spend: all.spend, total_opportunity: all.opportunity,
    brokerages: [...by.values()].map((b) => ({ ...b, spend: money(b.spend), opportunity: money(b.opportunity) }))
      .sort((a, b) => b.opportunity - a.opportunity),
    renewal_calendar: renewals,
  }
}

/* ══ 4. FACILITIES — steerage is only actionable if you can NAME the cheaper place ══ */
const FAC_KIND = [
  { kind: 'Hospital outpatient',       idx: [1.55, 2.30], n: 4 },
  { kind: 'Ambulatory surgery center', idx: [0.78, 1.06], n: 4 },
  { kind: 'Independent imaging',       idx: [0.46, 0.72], n: 3 },
  { kind: 'Physician office',          idx: [0.44, 0.70], n: 3 },
] as const
const FAC_STEM = ['Harborview', 'Cedar Ridge', 'Summit Park', 'Lakeshore', 'Ironwood', 'Northgate', 'Redstone',
  'Fairmount', 'Copperfield', 'Blue Harbor', 'Pioneer', 'Vantage', 'Alder Creek', 'Stonebridge', 'Willow Bend',
  'Granite Peak', 'Silver Creek', 'Foxfield', 'Marlow', 'Kestrel'] as const

export interface Facility {
  facility_id: string; ccn: string; name: string; kind: string
  cbsa: string; price: number; quality_star: number; in_network_pct: number
  value_score: number; vs_metro_median_pct: number
  __synthetic: true
}
/** Named places for this procedure in this metro, ranked on value rather than price alone. */
export function getFacilities(cbsa: string, cpt: string): Facility[] {
  const cell = getRate(cbsa, cpt)
  if (!cell || !cell.data_quality.is_scoreable || cell.p50 == null) return []
  const imaging = String(categoryOf(cpt)) === 'Imaging'
  const out: Facility[] = []
  let seq = 0
  for (const k of FAC_KIND) {
    if (imaging && k.kind === 'Ambulatory surgery center') continue
    if (!imaging && k.kind === 'Independent imaging') continue
    for (let i = 0; i < k.n; i++) {
      seq++
      const r = prng(hash('fac', cbsa, cpt, k.kind, i))
      const idx = k.idx[0] + r() * (k.idx[1] - k.idx[0])
      const price = money(cell.p50 * idx)
      const star = Math.min(5, Math.max(1, Math.round(2 + r() * 3)))
      const net = Math.round(74 + r() * 25)
      const priceScore = Math.max(0, 1 - price / (cell.p50 * 2))
      out.push({
        facility_id: `demo_fac_${cbsa}_${seq}`, ccn: `DEMO-${cbsa}${String(seq).padStart(2, '0')}`,
        name: `${pickOne(FAC_STEM, r())} ${k.kind === 'Ambulatory surgery center' ? 'Surgery Center' : k.kind === 'Independent imaging' ? 'Imaging' : k.kind === 'Physician office' ? 'Medical Group' : 'Medical Center'}`,
        kind: k.kind, cbsa, price, quality_star: star, in_network_pct: net,
        value_score: money((priceScore * 0.6 + (star / 5) * 0.28 + (net / 100) * 0.12) * 100),
        vs_metro_median_pct: Math.round((price / cell.p50) * 100),
        __synthetic: true,
      })
    }
  }
  return out.sort((a, b) => b.value_score - a.value_score)
}

/* ══ 5. TREND — what moved, which is the entire renewal conversation ═══════════════ */
export function getTrend(cbsa: string, cpt: string, years = 4) {
  const cell = getRate(cbsa, cpt)
  if (!cell || cell.p50 == null) return null
  const r = prng(hash('trend', cbsa, cpt))
  const now = 2026
  const series: { year: number; p50: number; yoy_pct: number | null }[] = []
  let v = cell.p50
  const steps: number[] = []
  for (let i = 0; i < years - 1; i++) steps.push(0.028 + r() * 0.095)
  for (let i = years - 1; i > 0; i--) v = v / (1 + steps[i - 1])
  for (let i = 0; i < years; i++) {
    const yr = now - (years - 1) + i
    const prev = series.length ? series[series.length - 1].p50 : null
    series.push({ year: yr, p50: money(v), yoy_pct: prev ? money(((v - prev) / prev) * 100) : null })
    if (i < years - 1) v = v * (1 + steps[i])
  }
  const first = series[0].p50, last = series[series.length - 1].p50
  return {
    cbsa, cbsa_name: cell.cbsa_name, cpt, service: cell.service, series,
    cagr_pct: money((Math.pow(last / first, 1 / (years - 1)) - 1) * 100),
    total_change_pct: money(((last - first) / first) * 100),
    __synthetic: true as const,
  }
}

/** Renewal teardown: split a carrier's ask into market movement vs the unexplained part. */
export function renewalTeardown(cbsa: string, lives: number, askPct: number, basket = DEFAULT_BASKET) {
  const moves = basket.map((c) => getTrend(cbsa, c)).filter(Boolean) as NonNullable<ReturnType<typeof getTrend>>[]
  if (!moves.length) return null
  const marketPct = money(moves.reduce((s, t) => s + (t.series[t.series.length - 1].yoy_pct ?? 0), 0) / moves.length)
  const b = priceBasket(cbsa, lives, basket)
  const unexplainedPct = money(askPct - marketPct)
  return {
    cbsa, lives, ask_pct: askPct, market_move_pct: marketPct, unexplained_pct: unexplainedPct,
    ask_dollars: money(b.annual_total * (askPct / 100)),
    market_dollars: money(b.annual_total * (marketPct / 100)),
    unexplained_dollars: money(b.annual_total * (unexplainedPct / 100)),
    basis: b,
    lines: moves.map((t) => ({ cpt: t.cpt, service: t.service, yoy_pct: t.series[t.series.length - 1].yoy_pct })),
    __synthetic: true as const,
  }
}

export const INDUSTRY_LIST = INDUSTRIES
export const MONTH_LIST = MONTHS
