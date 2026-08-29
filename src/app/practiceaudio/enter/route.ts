import { NextResponse, type NextRequest } from "next/server";
import { PRACTICE_COOKIE, mint, opens, configured } from "@/lib/practice-gate";
import { callerKey, takeSlot } from "@/lib/attempt-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WHERE THE CODE IS CHECKED. On the server, once, and nowhere else.
 *
 * A wrong code and an unconfigured environment both come back as the same thing:
 * a redirect to the page with `?bad=1`. The page then says one sentence. It does
 * not say which of the two happened, because "the secret is not set" tells an
 * attacker the shape of the lock.
 *
 * ⛔ THE DELAY THAT USED TO BE DESCRIBED HERE DID NOT DO WHAT THIS COMMENT CLAIMED.
 *
 * It said: "Six digits is 1,000,000 possibilities... A flat ~400ms on every attempt,
 * right or wrong, turns that into weeks." It does not, because a per-request sleep is
 * not a rate limit: nothing made the requests take turns, so the sleeps simply
 * overlapped. @BRK-HELP measured it on live prod 2026-08-29 — twenty concurrent
 * attempts finished in 5.20s against a serial floor of 8.00s — and there was no counter
 * of any kind. At a concurrency of fifty, one laptop walks the space in about two hours.
 *
 * A control that is only a control in its own comment is this estate's most repeated
 * defect, and this was one. The limiter now lives in `@/lib/attempt-limit`: attempts
 * from one address SERIALISE, failures raise that address's delay geometrically and
 * then lock it out, and a distributed spread trips a global floor. Read that file for
 * what it honestly does not cover (the state is per function instance).
 */
export async function POST(req: NextRequest) {
  /* The slot is taken BEFORE the body is read and before the code is checked. An address
     that is locked out never reaches `opens()` at all, so a lockout cannot be probed for
     timing differences between a right and a wrong code. */
  const slot = await takeSlot(callerKey(req.headers));

  if (!slot.allowed) {
    /* A distinct flag, not `bad=1`. Telling someone they are rate limited reveals nothing
       about the code, and the alternative is a real visitor being told their correct code
       is wrong, which is the failure this route has already shipped once. */
    return new NextResponse(null, { status: 303, headers: { location: "/practiceaudio?wait=1" } });
  }

  let ok = false;
  let value: string | null = null;
  try {
    const form = await req.formData().catch(() => null);
    const code = typeof form?.get("code") === "string" ? String(form.get("code")).trim() : "";
    ok = configured() && (await opens(code));
    value = ok ? await mint() : null;
  } finally {
    /* ALWAYS. A slot that is never settled deadlocks that address's queue forever, which
       would turn this limiter into a self-inflicted denial of service on one visitor. */
    await slot.settle(ok);
  }

  /**
   * ⛔ RELATIVE LOCATION, NEVER AN ABSOLUTE ONE BUILT FROM `nextUrl.origin`.
   *
   * MEASURED in headless Chrome: the visitor was on `127.0.0.1:3890`, typed the right
   * code, the server minted the cookie correctly, and `nextUrl.origin` resolved to
   * `localhost:3890`. The redirect crossed origins, the browser held the cookie on the
   * origin it was set for, and the gate served the lock again with an EMPTY field and NO
   * error, which is indistinguishable from a wrong code. curl never saw it, because curl
   * does not enforce origin on a cookie jar the way a browser does.
   *
   * That is not a localhost quirk to shrug at. This runs behind a CDN where the host a
   * function sees is not always the host the visitor typed, and the failure mode is
   * David, on his phone, in a conference centre, typing the right code and being told
   * nothing. A relative Location is resolved by the browser against the URL it is
   * actually on, so it cannot leave the origin and cannot lose the cookie.
   */
  const redirect = (to: string, cookie?: string) => {
    const res = new NextResponse(null, { status: 303, headers: { location: to } });
    return { res, cookie };
  };

  if (!value) return redirect("/practiceaudio?bad=1").res;

  const { res } = redirect("/practiceaudio");
  /* `Secure` follows the actual protocol rather than being hardcoded true. Production
     is always https so the flag is always set there, and pinning it on unconditionally
     meant a browser on a plain-http preview silently dropped the cookie and bounced the
     visitor back to an empty form with no error, which reads exactly like a wrong code.
     Measured in headless Chrome before this line existed. */
  res.cookies.set(PRACTICE_COOKIE, value, {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return res;
}

/** A GET here is somebody poking at the endpoint. Send them to the door. */
export async function GET() {
  return new NextResponse(null, { status: 303, headers: { location: "/practiceaudio" } });
}
