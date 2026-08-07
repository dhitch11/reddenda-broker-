import { NextResponse } from "next/server";
import { GATE_COOKIE, GATE_TTL_SECONDS, mintToken, pinMatches } from "@/lib/gate";

export const dynamic = "force-dynamic";

/**
 * PIN check. Returns ok/!ok and nothing else — no hints, no remaining-attempts
 * count, no distinction between "wrong PIN" and "no PIN configured". The cookie is
 * set here, server side, httpOnly, so the client never holds anything it could
 * forge or replay into another browser by copying a localStorage value.
 *
 * Deliberately slow to brute force in the only ways that matter without state:
 * the response is delayed on failure, and the token is signed rather than guessable.
 * A 6-digit PIN over the public internet is a soft control by nature — it keeps an
 * unlaunched site out of the hands of crawlers, competitors and forwarded links.
 * It is NOT an authentication system and must never gate PHI, rates tied to a named
 * customer, or anything a real account should protect.
 */
export async function POST(req: Request) {
  let pin = "";
  try {
    const body = await req.json();
    pin = typeof body?.pin === "string" ? body.pin : "";
  } catch {
    pin = "";
  }

  if (!pin || !pinMatches(pin)) {
    // Constant-ish delay so a timing difference cannot separate the failure modes.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ok: false }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const res = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  res.cookies.set({
    name: GATE_COOKIE,
    value: await mintToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_TTL_SECONDS,
  });
  return res;
}
