import { NextRequest, NextResponse } from "next/server";
import { siteComparison, steerableBasket } from "@/lib/siteofservice";
import { isConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/site-of-service?service=45378&state=CA
 * GET /api/site-of-service?state=CA&basket=1
 *
 * Total cost of care at three sites, on the federal basis.
 *
 * Contract notes:
 *   - A site whose `total` is null is NORMAL and must be rendered as the
 *     `unavailable` sentence verbatim. Never coalesce a null facility fee to zero
 *     and never hide the row. The absence is informative.
 *   - `caveat` is set for OPPS status Q1 and Q3, which are separately payable only
 *     when billed alone. Render it next to the number, not in a footnote.
 *   - This endpoint reads Medicare, OPPS and ASC only. It touches no commercial
 *     rate table, so it is unaffected by the percentage contamination in the peer
 *     layer and needs no honesty filter of its own.
 */
export async function GET(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 503 });
  }

  const sp = req.nextUrl.searchParams;
  const service = (sp.get("service") ?? "").trim().toUpperCase();
  const state = (sp.get("state") ?? "").trim().toUpperCase();
  const wantBasket = sp.get("basket") === "1";

  if (!/^[A-Z]{2}$/.test(state)) {
    return NextResponse.json({ ok: false, error: "invalid_state" }, { status: 400 });
  }

  // Every parameter that changes the answer is in the URL, so the cache key is
  // complete. An undeclared parameter would silently serve a different state.
  const headers = {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  };

  try {
    if (wantBasket) {
      const basket = await steerableBasket(state);
      return NextResponse.json({ ok: true, state, ...basket, source: SOURCE }, { headers });
    }

    if (!/^\d{4,5}[A-Z]?$/.test(service)) {
      return NextResponse.json({ ok: false, error: "invalid_service" }, { status: 400 });
    }

    const result = await siteComparison(service, state);
    return NextResponse.json({ ok: true, result, source: SOURCE }, { headers });
  } catch (err) {
    console.error("[site-of-service]", err);
    return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });
  }
}

const SOURCE = {
  basis:
    "Medicare Physician Fee Schedule, OPPS addendum B and the ASC payment file. Federal allowed amounts.",
  note: "Federal rates. A commercial plan pays a multiple of these and the direction of the spread is what transfers, not the dollar amount.",
};
