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
    // ── ONE PIN, BOTH HOSTS. ────────────────────────────────────────────────
    // Added 2026-08-07 by @BROKER-CONDUCTOR. Without a Domain the cookie is
    // host-only, so a PIN entered on broker.reddenda.com does not carry to
    // app.reddenda.com and the visitor is challenged a second time on the same
    // product. Measured on live prod:
    //   set-cookie: csnd_entry=…; Path=/; Secure; HttpOnly; SameSite=lax
    // I told David the double prompt was inherent to two hosts. It was not — it
    // was this missing attribute, and I was wrong.
    //
    // Scoped to .reddenda.com deliberately: both gated hosts are subdomains of it,
    // the token is HMAC-signed against GATE_SECRET and verified server side, and it
    // still fails CLOSED when the secret is absent. This widens WHERE a valid
    // session is presented, never WHO can mint one.
    domain: ".reddenda.com",
    path: "/",
    maxAge: GATE_TTL_SECONDS,
  });
  return res;
}
