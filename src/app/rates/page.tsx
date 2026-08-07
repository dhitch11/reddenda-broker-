import type { Metadata } from "next";
import Link from "next/link";
import { METROS } from "@/lib/metros";
import { SERVICES } from "@/lib/catalog";
import { SiteHeader, SiteFooter, DISCOVERY_URL } from "@/components/marketing/chrome";
import { Reveal } from "@/components/marketing/reveal";
import { marketPath, metroShort } from "@/components/marketing/slugs";

/**
 * The market index. The hub of the internal link graph.
 *
 * No per-market queries here on purpose. This page's job is navigation and link
 * equity, and running 119 database reads to render a directory would make the
 * cheapest page on the site the slowest. The numbers live one click down.
 */

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Markets",
  description:
    "Negotiated rate distributions by metropolitan market, from federal Transparency in Coverage filings.",
  alternates: { canonical: "/rates" },
};

export default function MarketIndex() {
  const byState = new Map<string, typeof METROS>();
  for (const m of METROS) {
    const list = byState.get(m.state) ?? [];
    list.push(m);
    byState.set(m.state, list);
  }
  const states = [...byState.keys()].sort();

  return (
    <>
      <SiteHeader />
      <main>
        <section style={{ paddingTop: "clamp(38px, 6vw, 64px)", paddingBottom: 28 }}>
          <div className="wrap">
            <p className="eyebrow">Markets</p>
            <h1 className="display" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "20ch" }}>
              Every market we hold, and what it pays.
            </h1>
            <p className="lede" style={{ marginTop: 14, maxWidth: "60ch" }}>
              {METROS.length} metropolitan markets, {SERVICES.length} services in each. Pick a market to see
              what plans have contracted to pay there, or go straight to a service.
            </p>
          </div>
        </section>

        <section style={{ paddingBottom: 40 }}>
          <div className="wrap">
            {/* ★ NOT WRAPPED IN <Reveal>. Reveal is a client component, so everything
                inside it becomes its `children` prop and is SERIALISED INTO THE RSC
                PAYLOAD in addition to the HTML. With 928 metro links that duplication
                was 344KB of the page's 551KB - 62% of the bytes, for an animation.
                Measured: 928 anchors = 170KB of real HTML, scripts = 344KB.
                The links are the SEO asset and all 928 stay. The reveal is decoration
                and it is the thing that goes. Server-rendered, the payload collapses. */}
            {states.map((st) => (
              <div key={st}>
                <div style={{ marginTop: 26 }}>
                  <h2
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: "var(--faint)",
                      paddingBottom: 10,
                      borderBottom: "1px solid var(--hair)",
                    }}
                  >
                    {st}
                  </h2>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      marginTop: 12,
                      display: "grid",
                      gap: 6,
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    }}
                  >
                    {byState.get(st)!.map((m) => (
                      <li key={m.cbsa}>
                        {/* ★ A CLASS, NOT AN INLINE STYLE OBJECT. Seven style properties
                            on 928 links serialise SEVEN TIMES 928 into both the HTML and
                            the RSC payload. Measured: that duplication was the single
                            biggest contributor to a 551KB page - the three largest script
                            blocks were 83KB, 81KB and 77KB of repeated
                            {"marginTop":26,...} objects. One class costs ~14 bytes a link
                            instead of ~180. */}
                        <Link href={marketPath(m)} className="rate-market-link">
                          {metroShort(m)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ paddingBottom: "clamp(48px, 6vw, 80px)" }}>
          <div className="wrap-tight" style={{ textAlign: "center" }}>
            <p className="lede" style={{ maxWidth: "52ch", marginInline: "auto" }}>
              Not seeing a market you write in? Tell us and we will say plainly whether we hold it.
            </p>
            <p style={{ marginTop: 18 }}>
              <a href={DISCOVERY_URL} className="btn btn-primary">Book a call</a>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
