/**
 * src/demo/index.ts — THE ONLY SANCTIONED DOOR TO SYNTHETIC DATA.
 *
 * ⚠️  Everything behind this module is FABRICATED (commercial numbers) or PUBLIC CMS
 *     reference data (federal fee schedules). Authorised by David 2026-08-06 for the
 *     demo environment ONLY.
 *
 * THE RULE THIS FILE ENFORCES:
 *   Synthetic data may be READ, in memory, by a demo surface, when demo mode is explicitly
 *   on. It may never be written anywhere, never merged with real rows, and never rendered
 *   without the demo banner.
 *
 * Why a runtime throw and not just a convention: this estate has shipped a "gate" that was
 * a CSS class before. A guard that cannot fail is not a guard. This one throws.
 */
import raw from './demo-data.json'

export const DEMO_BANNER =
  'DEMONSTRATION DATA — illustrative figures, not real contracted rates'

/** True only when the demo environment is explicitly switched on. Default is OFF. */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === '1'
}

/**
 * CONTAINMENT 4 — the runtime gate. Any attempt to read synthetic data outside demo mode
 * is a hard failure, not a silent empty array. A fail-open here would be the exact
 * fail-open class this estate keeps shipping.
 */
export function loadDemoData() {
  if (!isDemoMode()) {
    throw new Error(
      '[demo] Refusing to load synthetic data: NEXT_PUBLIC_DEMO_MODE is not "1". ' +
        'This data is fabricated and must never reach a real surface.'
    )
  }
  // The JSON's inferred literal type does not structurally overlap DemoFixture, so the
  // cast goes through unknown. This is the shape assertion the fixture is validated
  // against below, not a bypass of it.
  return raw as unknown as DemoFixture
}

/**
 * CONTAINMENT 5 — the mixing ban. Synthetic rows must never be concatenated onto real
 * rows: a blended array is indistinguishable downstream and is how fake data escapes.
 * Every consumer takes EITHER the real source OR the demo source, never both.
 */
export function assertNotMixed<T extends { __synthetic?: boolean }>(rows: T[]): T[] {
  const synthetic = rows.filter((r) => r.__synthetic === true).length
  if (synthetic !== 0 && synthetic !== rows.length) {
    throw new Error(
      `[demo] Refusing a MIXED result set: ${synthetic}/${rows.length} rows are synthetic. ` +
        'Real and demo data must never share an array.'
    )
  }
  return rows
}

export interface DemoPayerRow {
  payer: string; payer_label: string
  p25: number; p50: number; p75: number
  n_npi: number; confidence: 'high' | 'medium' | 'low'
  __synthetic: true
}
export interface DemoRateRow {
  cbsa: string; cbsa_name: string
  cpt: string; service: string; category: string
  p10: number; p25: number; p50: number; p75: number; p90: number
  n_npi: number
  medicare_office: number
  site_of_care: {
    office_total: number | null
    asc_total: number | null
    hopd_total: number | null
    absence_reason: string | null
    __basis: string
  }
  by_payer: DemoPayerRow[]
  __synthetic: true
}
export interface DemoFixture {
  __MANIFEST: Record<string, unknown>
  metros: { cbsa: string; name: string; idx: number }[]
  payers: { slug: string; label: string; power: number }[]
  basket: { cpt: string; name: string; cat: string }[]
  providers: { npi: string; name: string; specialty: string; cbsa: string; __synthetic: true }[]
  rates: DemoRateRow[]
  /* Added by @BROKER-TOOLS 2026-08-06. The fixture already carried these; the
     interface did not declare them, so the surfaces that need them could not be
     typed. Declaring what the JSON actually holds, nothing invented. */
  brokerages: { id: string; name: string }[]
  facilities: unknown[]
  employer_groups: DemoEmployerGroup[]
  ga_book: DemoGaBook
  idr_exposure: unknown[]
  payer_notices: unknown[]
  trend: unknown[]
  data_quality_summary: Record<string, unknown>
}

export interface DemoDriver {
  cpt: string; service: string; cases: number; per_case: number; annual: number; __synthetic: true
}
export interface DemoEmployerGroup {
  group_id: string; name: string; lives: number; funding: string
  cbsa: string; cbsa_name: string; state: string; renewal_month: string
  current_payer: string; current_payer_label: string
  brokerage_id: string; brokerage_name: string
  annual_medical_spend: number; pmpm: number; trend_pct: number
  modeled_site_of_care_opportunity: number; opportunity_pct_of_spend: number
  top_drivers: DemoDriver[]
}
export interface DemoGaBook {
  ga_id: string; ga_name: string
  brokerages: { id: string; name: string; groups: number; lives: number; modeled_opportunity: number; avg_trend: number; __synthetic: true }[]
  total_groups: number; total_lives: number; total_spend: number; total_modeled_opportunity: number
  renewal_calendar: { month: string; groups: number; lives: number }[]
}
