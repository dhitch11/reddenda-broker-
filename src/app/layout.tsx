import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { BRAND } from "@/components/marketing/brand";
import "./globals.css";

/**
 * FONTS ARE LOADED HERE, FOR REAL.
 *
 * The parent estate's two flagship rate tools declare exactly these three faces
 * and ship no @font-face, no stylesheet link and no preload, so every headline and
 * every dollar figure on them renders in system fallback while the woff2 files sit
 * unused on disk. A 41-agent design audit measured that as the single largest
 * source of cheapness in the estate. next/font self-hosts, subsets and preloads,
 * and provides a size-adjusted fallback, so it cannot regress the same way and it
 * costs no layout shift.
 *
 * Mono is the one voice unified across every Reddenda surface, and it is the one
 * that matters: every number, every CPT, every percentile renders in IBM Plex Mono.
 */

/*
 * TWO SANS FACES WAS THE DEFECT (BP1 typography order, 2026-08-24). Schibsted Grotesk
 * and IBM Plex Sans shipped together and competed on every screen; a visitor cannot
 * name the difference but reads it as cheapness. IBM Plex Sans is KILLED. Schibsted
 * is the one UI voice, loaded on its VARIABLE wght axis (400-900, no `weight` list)
 * so weight moves continuously instead of jumping 400/500/600/700/800 in cliffs --
 * the CSS tokens --w-med/--w-semi/--w-bold/--w-disp sit at 520/640/730/800.
 */
const display = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

/*
 * FRAUNCES IS THE DISPLAY SERIF, ON THE H1 AND THE SECTION LEADS ONLY. Everything
 * else stays Schibsted; a serif that spreads past the leads becomes a theme instead
 * of a voice. Variable wght + the optical-size axis, so at 88px it renders the
 * high-contrast display cut and at 17px lede size the sturdier text cut, from one file.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  /*
    WITHOUT THIS, EVERY SOCIAL CARD POINTS AT LOCALHOST.

    Measured on live prod: the served HTML carried
        og:image content="http://localhost:3000/opengraph-image?7f91931d1c613794"
    Next resolves image metadata against `metadataBase`, and with it unset it falls
    back to localhost:3000 — so every link anyone shared advertised an image on the
    sharer's own machine. It is one line, it was silent, and it made the whole
    open-graph surface inert no matter what was drawn on it.
  */
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://broker.reddenda.com"),
  title: {
    default: `${BRAND.name} . ${BRAND.tagline}`,
    template: `%s . ${BRAND.name}`,
  },
  /*
    CORRECTED 2026-08-24 by @BROKER-5. The previous line read "Every carrier, in
    every U.S. market, instantly."

    It is not true and our own product says so on its face. Kaiser and Sutter
    return ZERO rows in the peer distribution and structurally always will,
    because integrated staff models do not generate conventional negotiated
    in-network filings. Sacramento cannot serve 99213 or 99214 at metro grain at
    all: n=17 and n=20 against a floor of 100. A site whose centrepiece is a
    ledger of the rows it refused cannot carry "every carrier, in every market" in
    its own meta description. Estate rule 4 also governs: a scale figure is the
    universe indexed TOWARD, never a claim of live queryability.
  */
  description:
    "Rate intelligence for self-funded employer groups and the brokers who advise them. What plans have agreed to pay, with the sample size and the vintage on every number.",
  applicationName: BRAND.name,
  robots: {
    /*
      OPENED 2026-08-24 by @BROKER-5 under BUILD-ORDERS v3.

      This flag was set closed with the comment "the domain is not registered and
      the name is not final". Both premises expired: broker.reddenda.com serves
      live, and David re-bound the brand to Reddenda in the same order that put
      this site in front of a room of licensed brokers on Wednesday.

      Leaving it closed was also actively harmful. The 2026-08-07 note in the
      deleted middleware records NordVPN and Norton classifying this domain as
      malware, and the signature they matched was a young domain serving a code
      prompt on every path with noindex, nofollow and one character of readable
      text. The gate is gone and the copy is real, so the crawler directives
      should say the same thing the pages do.
    */
    index: true,
    follow: true,
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* The whole site is the dark register now, so the browser chrome is told the
     truth. A white status bar above a near-black page on every scroll bounce is
     the single cheapest way to look unfinished on a phone. */
  themeColor: "#06090B",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${fraunces.variable} ${mono.variable}`}>
      {/*
        THE REGISTER IS THE SITE, NOT ONE PAGE. Applied 2026-08-25 by @BROKER-5 on
        David's standard: "dark ultra-premium Linear on EVERY surface including the
        marketing site."

        WHY THIS IS ONE LINE AND NOT EIGHT PAGE EDITS. globals.css section 8 does
        not fork the design system, it RE-POINTS the same semantic tokens: --ink,
        --paper, --hair, --teal and the rest keep their meanings and change their
        values. Every component on this site was already written against those
        tokens (measured: exactly two hardcoded white hexes exist outside the
        opengraph routes, and both are handled). So moving the class from one page
        wrapper to the body turns the entire marketing surface dark at once, and
        no component needed a single edit. That is the payoff the token layer was
        built for and this is the first thing to collect it.

        Section 7.1's refusal still stands and is NOT reinstated: there is no
        prefers-color-scheme block in this file and there must never be one. This
        is a deliberate, measured register applied on purpose, not a palette that
        flips under half of all visitors.
      */}
      <body className="cine">{children}</body>
    </html>
  );
}
