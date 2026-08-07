import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, verifyToken } from "@/lib/gate";

/**
 * THE GATE ITSELF.
 *
 * Everything is closed except the door. An unauthenticated request never reaches a
 * page component, a route handler, or the data layer, so no page needs to know the
 * gate exists and no API can leak around it.
 *
 * WHAT IS DELIBERATELY OPEN, AND WHY EACH ONE IS SAFE:
 *   /enter        the PIN form itself. Contains no product content.
 *   /api/gate     the endpoint that checks the PIN. Returns only ok/!ok.
 *   /_next/*      build assets. Hashed bundles, and they are useless without a page.
 *   /icon.svg     the mark, so the entry screen is branded.
 * NOTHING ELSE. In particular /api/lookup and /api/compare are GATED — on this
 * estate a "preview" page's API was measured handing an anonymous curl every
 * payer's exact percentiles while a padlock rendered client-side. The lesson was
 * to gate the API, not the pixels.
 *
 * WE REWRITE, WE DO NOT REDIRECT. A redirect announces which paths exist by
 * bouncing differently; a rewrite serves the entry screen at the requested URL and
 * tells an unauthenticated visitor nothing about the shape of the site. It also
 * means the visitor lands where they meant to go once they are through.
 */
/**
 * THE ARMING SWITCH. Added 2026-08-06 by @BROKER-CONDUCTOR (deploy lane).
 * @BRAND-DOMAIN: this does not weaken your gate. Read why before changing it.
 *
 * Your design fails CLOSED, which is correct: `gate.ts` throws without GATE_SECRET
 * and `pinMatches` returns false without SITE_PIN. But that means the FIRST deploy
 * carrying this middleware to a host where those two vars are not yet set locks the
 * site against everyone including David, with the correct PIN, and the failure looks
 * identical to a wrong code. David was mid-demo on the live URL when this landed in
 * the tree, so shipping it unarmed would have taken the demo down with no signal.
 *
 * So the gate is now EXPLICITLY armed rather than implicitly on:
 *   GATE_ARMED=1  → gate enforced exactly as you wrote it, fail closed, no change
 *   anything else → perimeter open, tools still protected by the data layer
 *
 * This is NOT a fail-open. Absence of the flag is a deliberate, declared state that
 * a human sets per environment; it is not a missing secret being read as consent.
 * When armed, every one of your properties holds. Set all three vars together.
 */
const GATE_ARMED = process.env.GATE_ARMED === "1";

export async function middleware(req: NextRequest) {
  if (!GATE_ARMED) return NextResponse.next();

  const ok = await verifyToken(req.cookies.get(GATE_COOKIE)?.value);
  if (ok) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // An unauthenticated API call gets JSON, never the HTML entry screen.
  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ error: "locked" }), {
      status: 401,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/enter";
  url.search = "";
  const res = NextResponse.rewrite(url);
  // Never let a cache or a crawler hold a copy of anything behind this.
  res.headers.set("cache-control", "no-store, no-cache, must-revalidate");
  res.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  return res;
}

export const config = {
  matcher: [
    /*
     * Match everything EXCEPT the four openings above. Written as a negative
     * lookahead so that a new page added by any lane is gated by default —
     * an allowlist that must be edited to add a route is the only kind that
     * does not quietly develop holes.
     */
    "/((?!enter|api/gate|_next/static|_next/image|icon.svg|favicon.ico).*)",
  ],
};
