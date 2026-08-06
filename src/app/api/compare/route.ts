import { NextRequest, NextResponse } from "next/server";
import { marketRate, medicareAnchor } from "@/lib/rates";
import { findMetro, METROS } from "@/lib/metros";
import { findService } from "@/lib/catalog";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hard ceiling. Each market is a separate round trip, so this bounds the fan-out. */
const MAX_MARKETS = 8;

/**
 * GET /api/compare?service=70553&metros=31080,35620,16980,26420
 *
 * One service, several markets, side by side. This is the argument the whole
 * product rests on: the same scan costs wildly different amounts depending only on
 * where it happens.
 *
 * Markets that fail the honesty filter come back with `found: false` and their
 * reason. They are NOT dropped from the response. A broker who asked about Fresno
 * must be told we have nothing defensible for Fresno, not silently handed a list
 * that quietly omits it.
 */
export async function GET(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 503 });
  }

  const sp = req.nextUrl.searchParams;
  const service = (sp.get("service") ?? "").trim().toUpperCase();

  if (!/^\d{4,5}[A-Z]?$/.test(service)) {
    return NextResponse.json({ ok: false, error: "invalid_service" }, { status: 400 });
  }

  const requested = (sp.get("metros") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Default set is the four largest markets, which is also the strongest example.
  const ids = (requested.length ? requested : ["31080", "35620", "16980", "26420"]).slice(0, MAX_MARKETS);

  const metros = ids.map(findMetro).filter(Boolean) as NonNullable<ReturnType<typeof findMetro>>[];
  if (!metros.length) {
    return NextResponse.json({ ok: false, error: "no_valid_markets" }, { status: 400 });
  }

  try {
    const rows = await Promise.all(
      metros.map(async (m) => {
        const r = await marketRate(service, { cbsa: m.cbsa, state: m.state, metroName: m.name });
        return {
          cbsa: m.cbsa,
          name: m.name,
          state: m.state,
          ...(r.found
            ? {
                found: true as const,
                scope: r.scope,
                cell: r.cell,
                confidence: r.confidence,
                fellBack: Boolean(r.fellBackFrom),
              }
            : { found: false as const, reason: r.reason, message: r.message }),
        };
      }),
    );

    // Medicare is national in structure but locality-adjusted, so anchor on the
    // first market that resolved rather than pretending there is one national number.
    const anchorState = metros[0].state;
    const medicare = await medicareAnchor(service, anchorState);

    const served = rows.filter((r) => r.found) as Extract<(typeof rows)[number], { found: true }>[];

    // The headline: how much more the priciest market's median is than the cheapest.
    let ratio: number | null = null;
    let cheapest: string | null = null;
    let priciest: string | null = null;
    if (served.length >= 2) {
      const sorted = [...served].sort((a, b) => a.cell.p50 - b.cell.p50);
      const lo = sorted[0];
      const hi = sorted[sorted.length - 1];
      ratio = Math.round((hi.cell.p50 / lo.cell.p50) * 100) / 100;
      cheapest = lo.name;
      priciest = hi.name;
    }

    const catalog = findService(service);

    return NextResponse.json(
      {
        ok: true,
        service: {
          cpt: service,
          plain: catalog?.plain ?? null,
          name: catalog?.name ?? null,
        },
        rows,
        medicare: medicare ? { ...medicare, basisState: anchorState } : null,
        summary: {
          servedCount: served.length,
          requestedCount: rows.length,
          ratio,
          cheapest,
          priciest,
        },
        source: {
          basis: "Transparency in Coverage machine-readable files, 45 CFR 147.212",
          note: "Modeled from public filings. Not a guaranteed rate.",
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    console.error("[compare]", err);
    return NextResponse.json({ ok: false, error: "compare_failed" }, { status: 500 });
  }
}

/** Exposed so a picker can offer the largest markets first. */
export const TOP_MARKETS = METROS.slice(0, 40);
