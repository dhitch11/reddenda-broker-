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
    "Cache-Control": "no-store, max-age=0, must-revalidate", "Netlify-CDN-Cache-Control": "no-store",
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
