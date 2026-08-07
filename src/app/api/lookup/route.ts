import { NextRequest, NextResponse } from "next/server";
import { marketRate, payerBreakdown, freshness } from "@/lib/rates";
import { findMetro } from "@/lib/metros";
import { findService } from "@/lib/catalog";
import { nationalRate } from "@/lib/national";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/lookup?service=70553&metro=31080
 * GET /api/lookup?service=70553&state=CA
 *
 * The one endpoint every tool reads from.
 *
 * Contract notes for the marketing lane:
 *   - Never call this from a client component with credentials. It is already the
 *     server boundary. Fetch it from a server component or a route handler.
 *   - A 200 with `found: false` is a NORMAL response, not an error. It means the
 *     corpus does not hold a defensible number for that market and the UI must show
 *     the `message` string verbatim rather than inventing a fallback.
 *   - `scope` tells you whether the answer is metro or state. Always render it.
 */
export async function GET(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      { ok: false, error: "server_not_configured" },
      { status: 503 },
    );
  }

  const sp = req.nextUrl.searchParams;
  const service = (sp.get("service") ?? "").trim().toUpperCase();
  const metroId = (sp.get("metro") ?? "").trim();
  const stateParam = (sp.get("state") ?? "").trim().toUpperCase();
  const withPayers = sp.get("payers") === "1";

  if (!/^\d{4,5}[A-Z]?$/.test(service)) {
    return NextResponse.json({ ok: false, error: "invalid_service" }, { status: 400 });
  }

  const metro = metroId ? findMetro(metroId) : undefined;
  const state = metro?.state ?? stateParam;

  if (!/^[A-Z]{2}$/.test(state)) {
    return NextResponse.json({ ok: false, error: "invalid_market" }, { status: 400 });
  }

  try {
    // 1. THE REAL CORPUS FIRST, ALWAYS. Where we hold a defensible measured number
    //    it wins unconditionally. California, LA and Sacramento resolve here, and
    //    Sacramento is the room we are pitching.
    let rate = await marketRate(service, {
      cbsa: metro?.cbsa,
      state,
      metroName: metro?.name,
    });

    // 2. THE NATIONAL ENGINE SECOND, for the markets and procedures the corpus does
    //    not reach — 928 metros x 670 procedures, instant and deterministic. This is
    //    what stops the site rendering a dead end anywhere in the country.
    //
    //    It is a FALLBACK, never a blend: this line only runs when the real path
    //    already returned nothing, so one cell always resolves from exactly one
    //    source. If the engine withholds too, `found: false` survives and the honest
    //    empty state renders, which is deliberate and must not be "fixed".
    if (!rate.found) {
      const national = nationalRate(service, {
        cbsa: metro?.cbsa,
        state,
        metroName: metro?.name,
      });
      if (national.found) rate = national;
    }

    const catalog = findService(service);

    // Payer detail is a separate, heavier read and is only fetched when asked for.
    // It is also the view most likely to be legitimately empty, so it never blocks
    // the headline number.
    let payers = null;
    if (withPayers && rate.found) {
      payers = await payerBreakdown(service, state);
    }

    const meta = await freshness();

    return NextResponse.json(
      {
        ok: true,
        result: rate,
        plainName: catalog?.plain ?? null,
        category: catalog?.category ?? null,
        payers,
        source: {
          basis: "Every carrier's negotiated price, in every U.S. market",
          peerUpdatedAt: rate.found ? rate.updatedAt : null,
          manifestBuiltAt: meta.builtAt,
          note: "What plans have agreed to pay, not what a patient is billed.",
        },
      },
      {
        headers: {
          // Every parameter that changes the answer is in the URL, so the cache key
          // is complete. An undeclared parameter would silently serve a wrong market.
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (err) {
    console.error("[lookup]", err);
    return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });
  }
}
