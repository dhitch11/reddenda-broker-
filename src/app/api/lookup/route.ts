import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CLOSED 2026-08-26 by @BROKER-MARKETING under Bulletin 2 #5.
 *
 * This route answered ANONYMOUS callers with the full metro rate distribution,
 * the exact payload class the app closed behind its gate at 6a8f00c1, and its
 * only consumers were the /tools/* pages that David's 2026-08-07 ruling moved
 * to the console (they 308 there today, so nothing live calls this). Measured
 * before closing: zero live consumers on this host; the working tool is
 * app.reddenda.com/broker, where the same answer is served behind the demo
 * seat and the account, at the app's ceiling.
 *
 * 410, not 404: the route existed, we closed it on purpose, and an honest
 * machine answer says so and points at the door.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "locked",
      note: "This preview endpoint is closed. The working tool lives in the console, free demo seat included.",
      console: "https://app.reddenda.com/broker",
    },
    { status: 410, headers: { "cache-control": "no-store", "netlify-cdn-cache-control": "no-store" } },
  );
}
