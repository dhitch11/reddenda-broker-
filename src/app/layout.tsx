import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
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

const display = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
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
  description:
    "What health plans have contracted to pay providers, by metro. Every carrier, in every U.S. market, instantly.",
  applicationName: BRAND.name,
  robots: {
    // The domain is not registered and the name is not final. Nothing is indexed
    // until David rules on both. Flipping this is a deliberate, separate step,
    // and it is tracked in docs/LAUNCH-CHECKLIST.md.
    index: false,
    follow: false,
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
