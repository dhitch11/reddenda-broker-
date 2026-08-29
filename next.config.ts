import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * DAVID RULING 2026-08-07: tools live on the console, never on marketing.
   * "All CTAs should not be separate marketing pages for the tools."
   *
   * REDIRECT, DO NOT DELETE. These URLs are already in the wild: they were linked
   * from the homepage, they are in browser histories, and this estate practises
   * alias-redirect-with-a-rationale in five other places. A 404 on a URL we
   * advertised is a worse failure than a redirect nobody notices.
   *
   * Permanent, because the move is permanent. The duplicate implementations under
   * src/app/tools/* stay on disk until @BROKER-MARKETING's Tools Explainer lands,
   * so nothing 404s mid-flight, and are deleted with that commit.
   */
  async redirects() {
    const CONSOLE = "https://app.reddenda.com/broker/console";
    return [
      { source: "/tools/rate-check", destination: `${CONSOLE}/rates`, permanent: true },
      { source: "/tools/site-of-service", destination: `${CONSOLE}/site-of-care`, permanent: true },
      { source: "/tools/market-brief", destination: `${CONSOLE}/brief`, permanent: true },
    ];
  },
  /**
   * The /practiceaudio sidecar is read with `fs` at request time, so it has to be
   * traced into the server bundle. Without this the page builds, deploys, returns
   * 200 and renders "the recording is not published yet" forever, because the file
   * it looks for was left behind in the publish directory.
   *
   * ★ CHANGED 2026-08-29. The old note said the mp3 was "deliberately NOT traced: it is
   * served by the CDN behind the proxy gate". That arrangement is what leaked: the CDN
   * served the take to anonymous callers through five path shapes the matcher never saw
   * (duplicate slash, leading double slash, two casings, %2F). The media now lives in
   * `private-media/`, OUTSIDE public/, so it has no URL at all, and the ONLY way to it is
   * `/practiceaudio/media/[file]`, which checks the cookie itself. That route reads the
   * bytes with `fs`, so the mp3s and vtts must now be traced too. If they are not, the
   * gate is perfect and the player is silent.
   */
  outputFileTracingIncludes: {
    "/practiceaudio": ["./private-media/*.json"],
    "/practiceaudio/media/[file]": ["./private-media/*.mp3", "./private-media/*.vtt"],
  },

  reactStrictMode: true,
  poweredByHeader: false,

  /**
   * Two lanes share this repo, so they were sharing one `.next` directory.
   * Measured 2026-08-06 by @BROKER-MARKETING: while a production server was
   * serving a verification run, the other lane's build replaced the manifest and
   * every static chunk started returning 500 with ERR_ABORTED. The page was
   * correct; the build directory had been swapped under it. A verification run in
   * that state accuses working code, which is the failure mode this estate has a
   * standing law about.
   *
   * Set NEXT_DIST_DIR to give a lane its own build directory:
   *   NEXT_DIST_DIR=.next-marketing npm run build && NEXT_DIST_DIR=.next-marketing npx next start -p 3200
   * Unset, behaviour is exactly as before. @BROKER-TOOLS: this is additive and
   * yours to use the same way.
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",

  /** Without this Next walks up and finds the lockfile in the home directory. */
  turbopack: { root: __dirname },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      /**
       * ADDITIVE, added 2026-08-06 22:0x by @BROKER-CONDUCTOR after measuring the
       * FIRST production deploy. @BROKER-TOOLS: this covers your route, please read.
       *
       * `dynamic = "force-dynamic"` stops Next from caching. It does NOT stop the
       * Netlify Durable CDN cache, which stored the reply as `cache-control: public`
       * and declared its cache key as:
       *
       *   netlify-vary: query=__nextDataReq|_rsc
       *
       * `service`, `state`, `metro` and `payers` were not in that key. Measured on
       * live prod: /api/lookup?service=70553&state=TX and ?service=99214&state=NY
       * BOTH returned Los Angeles brain MRI p50 $498.33, from one `Durable; hit`
       * with ttl=3564. Every visitor would have seen one market's number for an
       * hour whatever they typed, and the honesty filter would never have fired.
       * A cache-busting param did not help, because it was not in the key either.
       *
       * This is the estate's filed lesson `an_undeclared_query_param_is_not_in_the
       * _cache_key`. `no-store` is the correct answer for a per-query financial
       * lookup: it must never be shared between two visitors asking two questions.
       */
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
          { key: "Netlify-CDN-Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
