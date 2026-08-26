import { NextRequest, NextResponse } from "next/server";
import { marketRate, medicareAnchor } from "@/lib/rates";
import { findMetro } from "@/lib/metros";
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
                // Per-row basis rides along so a side-by-side comparison never paints one flag across
                // markets that resolved differently (one metro real, one scaled, one statewide).
                basis: r.basis,
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
          /* Deleted, same as /api/lookup and /api/brief: a constant scope claim cannot
             describe an answer that varies, and this one was false in both halves. */
          note: "What plans have agreed to pay, not what a patient is billed.",
        },
      },
      /* ★ DECLARED SHARED-CACHE HEADER REMOVED, AND IT WAS A LANDMINE RATHER THAN A BUG.
         This route declared `public, s-maxage=3600`, and the CDN in front of it was
         MEASURED on 2026-08-26 returning:
           netlify-vary: query=__nextDataReq|_rsc
         `service`, `metro` and `state` are NOT in that cache key. A shared cache
         honouring the declared header would therefore collapse every query string onto
         ONE entry and serve one market's rates for all 928 of them, which is exactly
         the defect that hit /broker/api/repricing on the app.
         It is not firing today: Netlify overrides these to `no-store` and the measured
         response carries `cache-status: fwd=bypass`. So this changes nothing anybody can
         observe. It removes a header that is wrong on its face and would become a
         uniformly-false rate map the day that override changes.
         If shared caching is ever wanted here, the query params must be in the Netlify
         vary list EXPLICITLY and re-measured with two different markets first. */
      { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate", "Netlify-CDN-Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[compare]", err);
    return NextResponse.json({ ok: false, error: "compare_failed" }, { status: 500 });
  }
}
