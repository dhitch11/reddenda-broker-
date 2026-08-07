import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marketRate, type MarketRate, type NoMarketRate } from "@/lib/rates";
import { METROS, type Metro } from "@/lib/metros";
import { SERVICES, CATEGORY_LABEL, type Service } from "@/lib/catalog";
import { isConfigured } from "@/lib/db";
import { SiteHeader, SiteFooter, DISCOVERY_URL } from "@/components/marketing/chrome";
import { RatePanel } from "@/components/marketing/rate-panel";
import { Reveal } from "@/components/marketing/reveal";
import { BRAND } from "@/components/marketing/brand";
import {
  findMetroBySlug,
  findServiceBySlug,
  metroSlug,
  serviceSlug,
  metroShort,
  ratePath,
  marketPath,
  rateTitle,
} from "@/components/marketing/slugs";

/**
 * THE ACQUISITION LEVER.
 *
 * One page per market per service. 119 metros x 39 services = 4,641 pages, each
 * carrying a real measured distribution. This is the largest organic acquisition
 * surface we own and it is entirely gated on real data.
 *
 * WHY THIS IS NOT THIN CONTENT, stated plainly because the objection is fair:
 * every page here is built from a DIFFERENT measurement. The distribution, the
 * spread multiple, the position against Medicare, the peer-market comparison and
 * the sample depth are all computed per page from the corpus. Nothing is a
 * template sentence with a city name substituted into it. Where we hold no
 * defensible figure the page says so in words and offers the markets we do hold,
 * rather than publishing a page whose only content is the absence of content.
 *
 * BUILD STRATEGY. A seed of the largest markets is prerendered so the first crawl
 * is instant, and the long tail renders on demand and is then cached. Prerendering
 * all 4,641 at build time would add several minutes to every deploy for pages that
 * revalidate daily anyway, and this repo deploys continuously.
 */

export const revalidate = 86400;
export const dynamicParams = true;

const PEER_COUNT = 5;
const RELATED_SERVICES = 6;

/** Seed: the 12 largest markets across the 8 most-searched services. */
export function generateStaticParams() {
  const seedMetros = METROS.slice(0, 12);
  const seedServices = SERVICES.filter((s) =>
    ["70553", "73721", "72148", "45378", "99214", "29881", "27447", "76700"].includes(s.cpt),
  );
  return seedMetros.flatMap((m) =>
    seedServices.map((s) => ({ market: metroSlug(m), service: serviceSlug(s) })),
  );
}

type Params = { market: string; service: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { market, service } = await params;
  const m = findMetroBySlug(market);
  const s = findServiceBySlug(service);
  if (!m || !s) return { title: "Market not found" };

  const title = rateTitle(m, s);
  return {
    title,
    description: `What health plans have contracted to pay for ${s.plain} in ${metroShort(m)}, Every carrier, the low end to the high end, with a Medicare reference beside it.`,
    alternates: { canonical: ratePath(m, s) },
    openGraph: {
      title: `${title} . ${BRAND.name}`,
      description: `Negotiated rate distribution for ${s.plain} (CPT ${s.cpt}) in ${metroShort(m)}.`,
      type: "article",
    },
  };
}

const money = (v: number) => "$" + Math.round(v).toLocaleString("en-US");

export default async function RatePage({ params }: { params: Promise<Params> }) {
  const { market, service } = await params;
  const metro = findMetroBySlug(market);
  const svc = findServiceBySlug(service);
  if (!metro || !svc) notFound();

  const configured = isConfigured();

  const result: MarketRate | NoMarketRate | null = configured
    ? await marketRate(svc.cpt, { cbsa: metro.cbsa, state: metro.state, metroName: metro.name })
    : null;

  // Peer markets for the same service. The comparison IS the insight: a number
  // alone tells a broker nothing, a number beside four other markets tells them
  // whether their client is buying in an expensive one.
  const peers = METROS.filter((m) => m.cbsa !== metro.cbsa).slice(0, PEER_COUNT);
  const peerRates = configured
    ? await Promise.all(
        peers.map(async (m) => ({
          metro: m,
          rate: await marketRate(svc.cpt, { cbsa: m.cbsa, state: m.state, metroName: m.name }),
        })),
      )
    : [];

  const usablePeers = peerRates.filter(
    (p): p is { metro: Metro; rate: MarketRate } => p.rate.found && p.rate.scope === "metro",
  );

  const related = SERVICES.filter((s) => s.category === svc.category && s.cpt !== svc.cpt)
    .concat(SERVICES.filter((s) => s.category !== svc.category))
    .slice(0, RELATED_SERVICES);

  const found = result?.found ? result : null;
  const spreadX = found && found.cell.p25 > 0 ? found.cell.p75 / found.cell.p25 : null;
  const vsMedicare =
    found && found.medicare?.nonFacility && found.medicare.nonFacility > 0
      ? Math.round((found.cell.p50 / found.medicare.nonFacility) * 100)
      : null;

  // Where this market sits among the peers we measured. Only stated when there are
  // enough real peers to make a ranking meaningful.
  const ranked = found
    ? [...usablePeers.map((p) => p.rate.cell.p50), found.cell.p50].sort((a, b) => b - a)
    : [];
  const position = found && ranked.length >= 4 ? ranked.indexOf(found.cell.p50) + 1 : null;

  return (
    <>
      <SiteHeader />

      <main>
        <div className="wrap" style={{ paddingTop: 22 }}>
          <nav aria-label="Breadcrumb">
            <ol
              style={{
                listStyle: "none",
                padding: 0,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                fontSize: "var(--text-xs)",
                color: "var(--faint)",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              <li><a href="https://app.reddenda.com/broker/console">Markets</a></li>
              <li aria-hidden="true">/</li>
              <li><Link href={marketPath(metro)}>{metroShort(metro)}</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" style={{ color: "var(--muted)" }}>{svc.plain}</li>
            </ol>
          </nav>
        </div>

        {/* ---------------- the answer ---------------- */}
        <section style={{ paddingTop: 18, paddingBottom: "clamp(30px, 4vw, 48px)" }}>
          <div className="wrap">
            <div style={{ maxWidth: 760 }}>
              <p className="eyebrow">
                {CATEGORY_LABEL[svc.category]} · CPT {svc.cpt}
              </p>
              <h1 className="display" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "18ch" }}>
                {rateTitle(metro, svc)}
              </h1>
              <p className="lede" style={{ marginTop: 14, maxWidth: "60ch" }}>
                What health plans have contracted to pay providers for {svc.name} in the{" "}
                {metro.name.split(",")[0]} market, from the machine-readable files those plans publish under
                federal law. Not billed charges, and not an estimate.
              </p>
            </div>

            <div style={{ marginTop: 24, maxWidth: 880 }}>
              {result ? (
                <RatePanel result={result} plainName={svc.plain} />
              ) : (
                <div className="empty-state">
                  The rate corpus is not reachable right now. Nothing on this page is estimated to fill the gap.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ---------------- what it means, computed ---------------- */}
        {found && (
          <section className="band" style={{ paddingBlock: "clamp(40px, 5vw, 68px)" }}>
            <div className="wrap">
              <Reveal>
                <p className="eyebrow">Reading it</p>
                <h2 className="display" style={{ fontSize: "var(--text-2xl)", marginTop: 12, maxWidth: "24ch" }}>
                  What this distribution actually says.
                </h2>
              </Reveal>

              <Reveal delay={70}>
                <div
                  style={{
                    marginTop: 22,
                    display: "grid",
                    gap: 14,
                    gridTemplateColumns: "repeat(auto-fit, minmax(262px, 1fr))",
                  }}
                >
                  <Insight
                    label="The spread"
                    body={
                      spreadX
                        ? `The middle half of this market runs from ${money(found.cell.p25)} to ${money(
                            found.cell.p75,
                          )}, a ${spreadX.toFixed(1)}x difference for the same procedure code in the same city. That gap is between contracts, not between quality.`
                        : `The middle half of this market runs from ${money(found.cell.p25)} to ${money(found.cell.p75)}.`
                    }
                  />
                  <Insight
                    label="Against Medicare"
                    body={
                      vsMedicare != null
                        ? `The median sits at ${vsMedicare}% of the Medicare rate for the same service in this state. Medicare is a fixed reference line most finance teams already have a feel for, which is why we print it beside every figure. It is not a fair price and not what anything should cost.`
                        : `We do not hold a Medicare rate for this service in this state, so we do not show a comparison. The distribution above stands on its own.`
                    }
                  />
                  <Insight
                    label="The expensive end"
                    body={
                      found.cell.p90 != null
                        ? `One in ten filings sits at or above ${money(
                            found.cell.p90,
                          )}. If a plan's network is weighted toward that end, the difference does not show up in a premium quote. It shows up in the claims.`
                        : `The 90th percentile is not published for this cell, so we show nothing there rather than an approximation.`
                    }
                  />
                  <Insight
                    label="How wide the data runs"
                    body={`Every carrier writing this procedure in this market${found.confidence === "reported" ? ", though this is a smaller market and we mark it as one" : ""}. What each plan has agreed to pay, side by side. These are prices, not bills, so they do not show how often anyone needs it.`}
                  />
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* ---------------- peer markets ---------------- */}
        {usablePeers.length >= 2 && (
          <section style={{ paddingBlock: "clamp(40px, 5vw, 68px)" }}>
            <div className="wrap">
              <Reveal>
                <p className="eyebrow">The same service elsewhere</p>
                <h2 className="display" style={{ fontSize: "var(--text-2xl)", marginTop: 12, maxWidth: "26ch" }}>
                  {svc.plain} across other markets.
                </h2>
                {position && found && (
                  <p className="lede" style={{ marginTop: 12, maxWidth: "58ch" }}>
                    Of the {ranked.length} markets compared here, {metroShort(metro)} has the{" "}
                    {ordinal(position)} highest median.
                  </p>
                )}
              </Reveal>

              <Reveal delay={70}>
                <div style={{ marginTop: 22, overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      minWidth: 560,
                      borderCollapse: "separate",
                      borderSpacing: 0,
                      background: "var(--paper)",
                      border: "1px solid var(--hair)",
                      borderRadius: "var(--r)",
                      overflow: "hidden",
                    }}
                  >
                    <thead>
                      <tr>
                        {["Market", "25th", "Median", "75th", "Filings"].map((h, i) => (
                          <th
                            key={h}
                            scope="col"
                            style={{
                              textAlign: i === 0 ? "left" : "right",
                              padding: "12px 15px",
                              fontFamily: "var(--font-mono), monospace",
                              fontSize: 10.5,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: ".07em",
                              color: "var(--faint)",
                              background: "var(--elev)",
                              borderBottom: "1px solid var(--hair)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {found && (
                        <PeerRow metro={metro} rate={found} svc={svc} current />
                      )}
                      {usablePeers.map((p) => (
                        <PeerRow key={p.metro.cbsa} metro={p.metro} rate={p.rate} svc={svc} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* ---------------- other services here ---------------- */}
        <section className="band" style={{ paddingBlock: "clamp(40px, 5vw, 68px)" }}>
          <div className="wrap">
            <Reveal>
              <p className="eyebrow">Same market</p>
              <h2 className="display" style={{ fontSize: "var(--text-2xl)", marginTop: 12, maxWidth: "26ch" }}>
                Other services in {metroShort(metro)}.
              </h2>
            </Reveal>
            <Reveal delay={60}>
              <div
                style={{
                  marginTop: 20,
                  display: "grid",
                  gap: 10,
                  gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                }}
              >
                {related.map((s) => (
                  <Link key={s.cpt} href={ratePath(metro, s)} className="card card-hover" style={{ padding: 15 }}>
                    <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink)" }}>{s.plain}</p>
                    <p className="num" style={{ fontSize: "var(--text-xs)", color: "var(--faint)", marginTop: 4 }}>
                      CPT {s.cpt}
                    </p>
                  </Link>
                ))}
              </div>
              <p style={{ marginTop: 16 }}>
                <Link href={marketPath(metro)} style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--teal-deep)" }}>
                  Every service we hold for {metroShort(metro)} →
                </Link>
              </p>
            </Reveal>
          </div>
        </section>

        {/* ---------------- close ---------------- */}
        <section style={{ paddingBlock: "clamp(44px, 6vw, 72px)" }}>
          <div className="wrap-tight" style={{ textAlign: "center" }}>
            <Reveal>
              <h2 className="display" style={{ fontSize: "var(--display-sm)", maxWidth: "22ch", marginInline: "auto" }}>
                Put this in front of a client.
              </h2>
              <p className="lede" style={{ marginTop: 14, maxWidth: "52ch", marginInline: "auto" }}>
                Every figure on this page carries its source, its scope and the date the corpus was built, so
                it survives being forwarded to someone who was not in the meeting.
              </p>
              <div style={{ marginTop: 22, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <a href={DISCOVERY_URL} className="btn btn-primary">Book a call</a>
                <Link href="/methodology" className="btn btn-secondary">How we compute this</Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/*
        Structured data. Dataset is the honest type for what this is: a measured
        distribution derived from a public government dataset. We deliberately do
        NOT emit Product or Offer markup, which would represent these figures as
        prices being offered to a consumer, and we emit no rating or review markup
        of any kind because none exists.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Markets", item: "/rates" },
                  { "@type": "ListItem", position: 2, name: metroShort(metro), item: marketPath(metro) },
                  { "@type": "ListItem", position: 3, name: svc.plain, item: ratePath(metro, svc) },
                ],
              },
              {
                "@type": "Dataset",
                name: rateTitle(metro, svc),
                description: `Distribution of negotiated rates for ${svc.name} (CPT ${svc.cpt}) among health plans filing in the ${metro.name} market.`,
                creator: { "@type": "Organization", name: BRAND.name },
                isBasedOn: {
                  "@type": "Dataset",
                  name: "Transparency in Coverage machine-readable files",
                  description: "Prices health plans have agreed to pay providers, by city and procedure.",
                },
                measurementTechnique: "Percentile distribution of in-network negotiated rates",
                spatialCoverage: { "@type": "Place", name: metro.name },
                ...(found?.updatedAt ? { dateModified: found.updatedAt } : {}),
                ...(found
                  ? { variableMeasured: [{ "@type": "PropertyValue", name: "Median negotiated rate", value: Math.round(found.cell.p50), unitCode: "USD" }] }
                  : {}),
              },
            ],
          }),
        }}
      />
    </>
  );
}

function PeerRow({
  metro,
  rate,
  svc,
  current,
}: {
  metro: Metro;
  rate: MarketRate;
  svc: Service;
  current?: boolean;
}) {
  return (
    <tr style={current ? { background: "var(--teal-wash)" } : undefined}>
      <th
        scope="row"
        style={{
          textAlign: "left",
          padding: "13px 15px",
          fontWeight: current ? 700 : 500,
          fontSize: "var(--text-sm)",
          borderBottom: "1px solid var(--hair)",
        }}
      >
        {current ? (
          <span style={{ color: "var(--ink)" }}>
            {metroShort(metro)}{" "}
            <span className="num" style={{ color: "var(--teal-deep)", fontSize: "var(--text-xs)" }}>
              this page
            </span>
          </span>
        ) : (
          <Link href={ratePath(metro, svc)} style={{ color: "var(--teal-deep)" }}>
            {metroShort(metro)}
          </Link>
        )}
      </th>
      <Td v={money(rate.cell.p25)} />
      <Td v={money(rate.cell.p50)} strong />
      <Td v={money(rate.cell.p75)} />
      <Td v={rate.cell.n.toLocaleString("en-US")} faint />
    </tr>
  );
}

function Td({ v, strong, faint }: { v: string; strong?: boolean; faint?: boolean }) {
  return (
    <td
      className="num"
      style={{
        textAlign: "right",
        padding: "13px 15px",
        borderBottom: "1px solid var(--hair)",
        fontSize: strong ? "var(--text-base)" : "var(--text-sm)",
        fontWeight: strong ? 700 : 500,
        color: faint ? "var(--faint)" : "var(--ink)",
        whiteSpace: "nowrap",
      }}
    >
      {v}
    </td>
  );
}

function Insight({ label, body }: { label: string; body: string }) {
  return (
    <div className="card" style={{ height: "100%" }}>
      <p
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10.5,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: ".06em",
          color: "var(--faint)",
        }}
      >
        {label}
      </p>
      <p style={{ marginTop: 8, fontSize: "var(--text-sm)", lineHeight: 1.7, color: "var(--body)" }}>{body}</p>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
