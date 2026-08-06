import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { METROS } from "@/lib/metros";
import { SERVICES, CATEGORY_LABEL, type Category } from "@/lib/catalog";
import { SiteHeader, SiteFooter, DISCOVERY_URL } from "@/components/marketing/chrome";
import { Reveal } from "@/components/marketing/reveal";
import { LookupForm } from "@/components/marketing/lookup-form";
import { findMetroBySlug, metroSlug, metroShort, ratePath } from "@/components/marketing/slugs";

/**
 * One market, every service. The second hub in the link graph.
 *
 * Like the market index this runs no per-service queries. It is a directory, and
 * the measured figure lives one click down where it belongs.
 */

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return METROS.slice(0, 30).map((m) => ({ market: metroSlug(m) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string }>;
}): Promise<Metadata> {
  const { market } = await params;
  const m = findMetroBySlug(market);
  if (!m) return { title: "Market not found" };
  return {
    title: `${metroShort(m)} market rates`,
    description: `What health plans pay providers across ${SERVICES.length} services in the ${m.name} market, from federal transparency filings.`,
    alternates: { canonical: `/rates/${metroSlug(m)}` },
  };
}

const ORDER: Category[] = [
  "imaging", "surgery", "office", "diagnostic", "lab",
  "therapy", "maternity", "behavioral", "cardiac", "pain", "emergency",
];

export default async function MarketPage({ params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  const metro = findMetroBySlug(market);
  if (!metro) notFound();

  const groups = ORDER.map((c) => ({
    key: c,
    label: CATEGORY_LABEL[c],
    items: SERVICES.filter((s) => s.category === c),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <SiteHeader />
      <main>
        <div className="wrap" style={{ paddingTop: 22 }}>
          <nav aria-label="Breadcrumb">
            <ol
              style={{
                listStyle: "none", padding: 0, display: "flex", gap: 8, flexWrap: "wrap",
                fontSize: "var(--text-xs)", color: "var(--faint)", fontFamily: "var(--font-mono), monospace",
              }}
            >
              <li><Link href="/rates">Markets</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" style={{ color: "var(--muted)" }}>{metroShort(metro)}</li>
            </ol>
          </nav>
        </div>

        <section style={{ paddingTop: 18, paddingBottom: "clamp(28px, 4vw, 44px)" }}>
          <div className="wrap">
            <p className="eyebrow">Metro market · CBSA {metro.cbsa}</p>
            <h1 className="display" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "20ch" }}>
              What plans pay in {metroShort(metro)}.
            </h1>
            <p className="lede" style={{ marginTop: 14, maxWidth: "60ch" }}>
              {metro.name}. Pick a service below for the full distribution, or run a lookup directly.
            </p>

            <div style={{ marginTop: 22, maxWidth: 880 }}>
              <LookupForm action="/" market={metro.cbsa} />
            </div>
          </div>
        </section>

        <section className="band" style={{ paddingBlock: "clamp(40px, 5vw, 68px)" }}>
          <div className="wrap">
            {groups.map((g, i) => (
              <Reveal key={g.key} delay={Math.min(i * 30, 150)}>
                <div style={{ marginTop: i === 0 ? 0 : 30 }}>
                  <h2
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 11, fontWeight: 600, letterSpacing: ".1em",
                      textTransform: "uppercase", color: "var(--faint)",
                      paddingBottom: 10, borderBottom: "1px solid var(--hair-strong)",
                    }}
                  >
                    {g.label}
                  </h2>
                  <ul
                    style={{
                      listStyle: "none", padding: 0, marginTop: 12, display: "grid", gap: 8,
                      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    }}
                  >
                    {g.items.map((s) => (
                      <li key={s.cpt}>
                        <Link href={ratePath(metro, s)} className="card card-hover" style={{ display: "block", padding: 14 }}>
                          <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink)" }}>{s.plain}</p>
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>
                            {s.name}
                          </p>
                          <p className="num" style={{ fontSize: "var(--text-xs)", color: "var(--faint)", marginTop: 5 }}>
                            CPT {s.cpt}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section style={{ paddingBlock: "clamp(44px, 6vw, 72px)" }}>
          <div className="wrap-tight" style={{ textAlign: "center" }}>
            <h2 className="display" style={{ fontSize: "var(--display-sm)", maxWidth: "24ch", marginInline: "auto" }}>
              Working a renewal in {metroShort(metro)}?
            </h2>
            <p className="lede" style={{ marginTop: 14, maxWidth: "50ch", marginInline: "auto" }}>
              Tell us the services that drive the group and we will show you what we hold, and what we do not.
            </p>
            <p style={{ marginTop: 20 }}>
              <a href={DISCOVERY_URL} className="btn btn-primary">Book a call</a>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
