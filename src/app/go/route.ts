import { NextResponse, type NextRequest } from "next/server";
import { findMetro } from "@/lib/metros";
import { findService } from "@/lib/catalog";
import { metroSlug, serviceSlug } from "@/components/marketing/slugs";

/**
 * THE LOOKUP'S DESTINATION.
 *
 * WHY THIS ROUTE EXISTS, AND IT IS NOT A NICETY.
 *
 * `LookupForm` is a plain GET form, deliberately: it works with JavaScript off and
 * nothing beats a form submit for getting a number in fifteen seconds. But a GET
 * form can only append a query string, and the pages that actually ANSWER a lookup
 * live at path segments: `/rates/<market>/<service>`. So the form was pointed at
 * `/` and `/` reads neither parameter.
 *
 * MEASURED ON LIVE PROD 2026-08-24, which is how this was caught:
 *   GET /                                    -> Diagnostic colonoscopy, CPT 45378
 *   GET /?service=73721&market=35620         -> Diagnostic colonoscopy, CPT 45378
 * Identical. Every lookup on three role pages and 928 market pages returned the
 * same hardcoded Sacramento colonoscopy no matter what a visitor chose, and the
 * destination has no form on it, so they could not even retry where they landed.
 *
 * That is bad on any site. On THIS site it was a lie: the headline directly above
 * the form reads "Change it. It is a query, not a screenshot." A page whose entire
 * thesis is that we print what we can support cannot ship a control that pretends
 * to answer. It is the exact behaviour the page accuses the category of.
 *
 * This route is the missing hop. It resolves the two ids to their canonical slugs
 * and redirects to the page that genuinely answers, so the form stays a real GET
 * form, no-JS keeps working, and the claim above it becomes true.
 *
 * 307, NOT 308. The mapping from ids to slugs is ours and may change; a permanent
 * redirect would be cached in the visitor's browser forever and could not be
 * corrected. This is a routing hop, not a moved resource.
 *
 * EVERY FAILURE LANDS SOMEWHERE REAL. An unknown service, an unknown metro, a
 * missing parameter, a hand-edited URL: all of them fall back to the market index
 * or the home page rather than a 404. A visitor who mistypes should not be
 * punished with a dead end.
 *
 * THE LOCATION IS RELATIVE, AND THAT IS NOT A STYLE CHOICE.
 * My first version built an absolute URL from `req.nextUrl.origin`. MEASURED on
 * live prod immediately after deploying it:
 *   GET /go?service=73721&market=35620
 *   -> 307 https://6a8ccf82a6cefc0d9b56daad--reddenda-broker.netlify.app/rates/...
 * On Netlify that origin is the DEPLOY-SPECIFIC host, not the branded one, so a
 * broker who used the lookup was thrown off broker.reddenda.com and onto a
 * hashed netlify.app URL, visible in the address bar, on a page being presented
 * from a stage. RFC 7231 permits a relative Location and every browser resolves
 * it against the requested host, which is exactly the behaviour we want: whatever
 * host they arrived on is the host they stay on.
 */
function go(path: string) {
  return new NextResponse(null, { status: 307, headers: { location: path, "cache-control": "no-store" } });
}

export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const svc = findService((searchParams.get("service") ?? "").trim());
  const metro = findMetro((searchParams.get("market") ?? "").trim());

  if (svc && metro) return go(`/rates/${metroSlug(metro)}/${serviceSlug(svc)}`);

  /* One half resolved. Send them to the most specific real page we can build,
     which is the market's own index: it lists every service we hold there. */
  if (metro) return go(`/rates/${metroSlug(metro)}`);

  return go("/rates");
}
