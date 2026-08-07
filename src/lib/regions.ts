import { serviceClient } from "./db";
import { METROS } from "./metros";

/**
 * THE CONTROL CONDITION.
 *
 * The product's whole thesis is that the money is not between geographies, it is
 * inside one market. That claim is only worth making if the boring half is shown
 * first and shown honestly, so this computes the four US Census region medians for
 * one service from OUR OWN corpus.
 *
 * It deliberately comes from the same query as every other figure on the page. An
 * external survey statistic would be a stronger-sounding number and a weaker
 * argument, because it would not be apples to apples with the metro figure it is
 * being compared against.
 *
 * Median of metro medians, not a pooled median: a pooled figure would let the few
 * enormous metros speak for their whole region, which is the opposite of what a
 * regional control is for.
 */

const REGIONS: Record<string, string[]> = {
  Northeast: ["CT", "ME", "MA", "NH", "RI", "VT", "NJ", "NY", "PA"],
  Midwest: ["IL", "IN", "MI", "OH", "WI", "IA", "KS", "MN", "MO", "NE", "ND", "SD"],
  South: ["DE", "FL", "GA", "MD", "NC", "SC", "VA", "DC", "WV", "AL", "KY", "MS", "TN", "AR", "LA", "OK", "TX"],
  West: ["AZ", "CO", "ID", "MT", "NV", "NM", "UT", "WY", "AK", "CA", "HI", "OR", "WA"],
};

const regionOf = (state: string) =>
  Object.keys(REGIONS).find((r) => REGIONS[r].includes(state)) ?? null;

export type RegionRow = { region: string; median: number; metros: number };

export type RegionSpread = {
  rows: RegionRow[];
  /** Highest region median over lowest. The number the section exists to print. */
  ratio: number;
  cpt: string;
  metrosCounted: number;
};

export async function regionSpread(cpt: string): Promise<RegionSpread | null> {
  const sb = serviceClient();
  const { data } = await sb
    .from("cpt_peer_stats_cbsa")
    .select("cbsa, p50, n")
    .eq("cpt", cpt)
    .limit(1000);

  if (!data?.length) return null;

  const stateOf = new Map(METROS.map((m) => [m.cbsa, m.state]));
  const buckets: Record<string, number[]> = {};

  for (const r of data) {
    // The same floor the honesty filter uses. A thin cell must not be allowed to
    // drag a regional median, especially in the control condition.
    if (!(r.p50 > 0) || (r.n ?? 0) < 30) continue;
    const st = stateOf.get(r.cbsa);
    if (!st) continue;
    const reg = regionOf(st);
    if (!reg) continue;
    (buckets[reg] ??= []).push(r.p50);
  }

  const median = (a: number[]) => {
    const s = [...a].sort((x, y) => x - y);
    return s[Math.floor(s.length / 2)];
  };

  const rows = Object.entries(buckets)
    .filter(([, v]) => v.length >= 5)
    .map(([region, v]) => ({ region, median: Math.round(median(v)), metros: v.length }))
    .sort((a, b) => b.median - a.median);

  // Three regions minimum. Two would make "barely move" an assertion about a
  // single pair rather than a property of the country.
  if (rows.length < 3) return null;

  const hi = rows[0].median;
  const lo = rows[rows.length - 1].median;
  if (!(lo > 0)) return null;

  return {
    rows,
    ratio: Math.round((hi / lo) * 100) / 100,
    cpt,
    metrosCounted: rows.reduce((n, r) => n + r.metros, 0),
  };
}
