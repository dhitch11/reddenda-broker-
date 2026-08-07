import { NextRequest, NextResponse } from "next/server";
import { serviceClient, isConfigured } from "@/lib/db";
import { judge } from "@/lib/honesty";
import { findMetro } from "@/lib/metros";
import { SERVICES, CATEGORY_LABEL, type Category } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/brief?metro=31080
 *
 * THE MARKET BRIEF. One metro, the whole basket, ranked by where the spread is
 * widest.
 *
 * This is the screen a broker walks into a renewal with, a GA hands to a downstream
 * agency, and a self-funded employer reads before deciding what to steer. It answers
 * the only question all three actually have: "where in my city is my money leaking?"
 *
 * Ranking is by the 25th-to-75th ratio, not by price. A service where the cheap and
 * expensive options are twenty dollars apart is not worth a plan design decision. A
 * service where they are five times apart is, and it does not matter whether the
 * absolute number is large.
 *
 * Two round trips total, not one per service. The whole basket is fetched with a
 * single `in` filter, then the Medicare anchors in a second. Anything else would put
 * 39 sequential queries behind one screen.
 */
export async function GET(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 503 });
  }

  const metroId = (req.nextUrl.searchParams.get("metro") ?? "31080").trim();
  const metro = findMetro(metroId);
  if (!metro) {
    return NextResponse.json({ ok: false, error: "unknown_market" }, { status: 400 });
  }

  const codes = SERVICES.map((s) => s.cpt);
  const sb = serviceClient();

  try {
    const [{ data: peer }, { data: mcare }] = await Promise.all([
      sb
        .from("cpt_peer_stats_cbsa")
        .select("cpt, p25, p50, p75, p90, n, updated_at")
        .eq("cbsa", metro.cbsa)
        .in("cpt", codes),
      sb
        .from("medicare_locality_cpt_rate")
        .select("cpt, nonfac_rate, fac_rate")
        .eq("state", metro.state)
        .in("cpt", codes),
    ]);

    const mc = new Map(
      (mcare ?? []).map((m) => [
        m.cpt,
        { office: num(m.nonfac_rate), facility: num(m.fac_rate) },
      ]),
    );
    const peerBy = new Map((peer ?? []).map((r) => [r.cpt, r]));

    const served: BriefRow[] = [];
    const unavailable: { cpt: string; plain: string; reason: string }[] = [];
    let updatedAt: string | null = null;

    for (const svc of SERVICES) {
      const row = peerBy.get(svc.cpt);
      if (!row) {
        unavailable.push({ cpt: svc.cpt, plain: svc.plain, reason: "no_filings" });
        continue;
      }
      const verdict = judge({
        p25: num(row.p25), p50: num(row.p50), p75: num(row.p75), p90: num(row.p90), n: row.n ?? null,
      });
      if (!verdict.ok) {
        unavailable.push({ cpt: svc.cpt, plain: svc.plain, reason: verdict.reason });
        continue;
      }
      updatedAt = updatedAt ?? row.updated_at ?? null;

      const m = mc.get(svc.cpt) ?? { office: null, facility: null };
      const cell = verdict.cell;

      // DELIBERATELY NOT COMPUTED HERE. A bare nonfac_rate/fac_rate ratio is NOT a
      // site-of-service comparison and reading it as one is backwards.
      // `fac_rate` is the PHYSICIAN professional fee when the service happens in a
      // facility. It is lower than `nonfac_rate` only because practice expense is
      // stripped out. The hospital then bills its OWN OPPS payment separately, on
      // top. So "office $478 vs facility $129" reads as "steer to the hospital",
      // which is the opposite of the truth: measured, a colonoscopy is $423 in an
      // office, $681 in an ASC and $1,121 in hospital outpatient, so the hospital is
      // +165%. Caught by @DATA-BROKER and @BROKER-MARKETING 2026-08-06 before it
      // reached a client. Correct total-cost math lives in /tools/site-of-service,
      // which is built on the OPPS and ASC schedules. This endpoint does not guess.
      const siteGap = null;

      served.push({
        cpt: svc.cpt,
        plain: svc.plain,
        name: svc.name,
        category: svc.category,
        categoryLabel: CATEGORY_LABEL[svc.category],
        cell,
        confidence: verdict.confidence,
        spread: Math.round((cell.p75 / cell.p25) * 100) / 100,
        // What the middle half of the market costs, per procedure, between a
        // 25th-percentile provider and a 75th-percentile one.
        gapPerCase: Math.round(cell.p75 - cell.p25),
        medicareOffice: m.office,
        medicareFacility: m.facility,
        vsMedicare: m.office ? Math.round((cell.p50 / m.office) * 100) : null,
        siteGap,
      });
    }

    served.sort((a, b) => b.spread - a.spread);

    const totalGap = served.reduce((n, r) => n + r.gapPerCase, 0);
    const widest = served[0] ?? null;
    const siteOfService = served.filter((r) => r.siteGap != null).sort((a, b) => (b.siteGap ?? 0) - (a.siteGap ?? 0));

    return NextResponse.json(
      {
        ok: true,
        market: { cbsa: metro.cbsa, name: metro.name, state: metro.state },
        rows: served,
        unavailable,
        summary: {
          servedCount: served.length,
          basketCount: SERVICES.length,
          widestService: widest ? { plain: widest.plain, spread: widest.spread } : null,
          medianSpread: served.length
            ? Math.round(
                [...served].sort((a, b) => a.spread - b.spread)[Math.floor(served.length / 2)].spread * 100,
              ) / 100
            : null,
          totalGapAcrossBasket: totalGap,
          siteOfServiceCount: siteOfService.length,
        },
        updatedAt,
        source: {
          basis: "Every carrier's negotiated price, in every U.S. market",
          note: "What plans have agreed to pay, not what a patient is billed.",
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    console.error("[brief]", err);
    return NextResponse.json({ ok: false, error: "brief_failed" }, { status: 500 });
  }
}

type BriefRow = {
  cpt: string;
  plain: string;
  name: string;
  category: Category;
  categoryLabel: string;
  cell: { p25: number; p50: number; p75: number; p90: number | null; n: number };
  confidence: "high" | "reported";
  spread: number;
  gapPerCase: number;
  medicareOffice: number | null;
  medicareFacility: number | null;
  vsMedicare: number | null;
  siteGap: number | null;
};

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
