import { NextResponse, type NextRequest } from "next/server";
import { PRACTICE_COOKIE, verify } from "@/lib/practice-gate";

/**
 * THE ONLY THING THIS PROXY GUARDS IS THE PRIVATE RECORDING.
 *
 * FILE NAME: `proxy.ts`, not `middleware.ts`. Next 16 deprecated the middleware
 * convention and renamed it; the old name still builds and prints a deprecation
 * warning on every deploy. Same API, same edge runtime, current name.
 *
 * ⚠️ READ THE MATCHER BEFORE YOU ADD TO IT. This repository used to carry a
 * site-wide PIN middleware. It was removed, and it is not coming back here: the
 * marketing site is public and gating it again would be a regression dressed as
 * security. The matcher below is deliberately two paths and nothing else.
 *
 * WHY THE MEDIA NEEDS THE PROXY AND THE PAGE DOES NOT.
 * `/practiceaudio` is a server component that reads the cookie itself and simply
 * does not write the player into the HTML without one, so its bytes are already
 * gated at the source. The mp3 is a static file, and a static file is served by
 * the CDN without ever consulting a React component. A proxy is the only layer
 * that sees that request. Without this, the page would be gated and the recording
 * would be a public URL, which is the /competitors defect exactly: a control in
 * front of the door and the window left open.
 *
 * WHY 404 AND NOT 403. A 403 confirms that something is there. This path is
 * supposed to be unknown to everyone but its owner, so an unauthenticated request
 * gets the same answer it would get for any path that does not exist.
 *
 * ⛔ THE PARAGRAPH THAT USED TO SIT HERE DESCRIBED THE DEFECT, NOT THE DESIGN.
 * It read: "WHY THE CDN STILL SERVES THE BYTES. The proxy decides, then hands off;
 * the file itself is delivered by Netlify with real HTTP Range support... The check
 * happens at the edge, the delivery stays on the CDN." That was measured false on
 * 2026-08-29. A matcher is compared against the LITERAL request path; Netlify's
 * static resolver collapses duplicate slashes, decodes %2F and resolves
 * case-insensitively. Five shapes never entered this function and the CDN served the
 * private 17.3-minute take, with working Range, to anonymous callers:
 *   /practice-audio-media//practiceaudio.mp3    206
 *   //practice-audio-media/practiceaudio.mp3    206
 *   /PRACTICE-AUDIO-MEDIA/practiceaudio.mp3     206
 *   /Practice-Audio-Media/practiceaudio.mp3     206
 *   /practice-audio-media%2Fpracticeaudio.mp3   200
 * while the canonical path returned a correct 404 the whole time, which is why both
 * sides of the gate had been "verified" and it was still open.
 *
 * THE MEDIA NO LONGER LIVES IN public/. It is in `private-media/`, outside the publish
 * directory, and it is served by `src/app/practiceaudio/media/[file]/route.ts`, which
 * checks the cookie itself. A file the CDN can see is a file the CDN will serve, and no
 * matcher fixes that in general.
 *
 * THE `/practice-audio-media/:path*` ENTRY BELOW STAYS, and it is now belt-and-braces
 * rather than the control: nothing is published at that prefix any more, so it should
 * never match. If it ever does, someone has put media back in public/ and this refuses
 * it on the canonical path while they find out why. Do NOT treat it as the gate.
 */
export const config = {
  matcher: ["/practiceaudio", "/practiceaudio/:path*", "/practice-audio-media/:path*"],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* The form post is how a visitor GETS the cookie, so it cannot require one. */
  if (pathname === "/practiceaudio/enter") return NextResponse.next();

  const ok = await verify(req.cookies.get(PRACTICE_COOKIE)?.value);

  if (pathname.startsWith("/practice-audio-media/")) {
    if (!ok) {
      /* Nothing here to find, as far as an anonymous request is concerned. */
      return new NextResponse("Not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex, nofollow" },
      });
    }
    const pass = NextResponse.next();
    /* A private recording is never a shared cache entry. */
    pass.headers.set("cache-control", "private, no-store, max-age=0, must-revalidate");
    pass.headers.set("netlify-cdn-cache-control", "no-store");
    pass.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
    return pass;
  }

  /* The page renders its own locked state; middleware only stops it being indexed
     or cached, because a cached authenticated page is the next way this leaks. */
  const res = NextResponse.next();
  res.headers.set("x-robots-tag", "noindex, nofollow, noarchive, nosnippet");
  res.headers.set("cache-control", "private, no-store, max-age=0, must-revalidate");
  res.headers.set("netlify-cdn-cache-control", "no-store");
  return res;
}
