import { NextResponse, type NextRequest } from "next/server";
import { PRACTICE_COOKIE, mint, opens, configured } from "@/lib/practice-gate";

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
 * THE DELAY IS DELIBERATE. Six digits is 1,000,000 possibilities, which a script
 * can walk in minutes over a fast endpoint. A flat ~400ms on every attempt, right
 * or wrong, turns that into weeks and costs the one person who knows the code
 * four tenths of a second, once.
 */
export async function POST(req: NextRequest) {
  const started = Date.now();
  const form = await req.formData().catch(() => null);
  const code = typeof form?.get("code") === "string" ? String(form.get("code")).trim() : "";

  const ok = configured() && (await opens(code));
  const value = ok ? await mint() : null;

  const wait = 400 - (Date.now() - started);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));

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
