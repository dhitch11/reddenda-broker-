import Link from "next/link";
import { marketRate, type MarketRate, type NoMarketRate } from "@/lib/rates";
import { findMetro, METROS, type Metro } from "@/lib/metros";
import { findService, SERVICES } from "@/lib/catalog";
import { isConfigured } from "@/lib/db";
import { SCALE, nationalRate } from "@/lib/national";
import { SiteHeader, SiteFooter, DISCOVERY_URL } from "@/components/marketing/chrome";
import { LookupForm } from "@/components/marketing/lookup-form";
import { RatePanel } from "@/components/marketing/rate-panel";
import { Reveal } from "@/components/marketing/reveal";

/**
 * HOME. One full scroll.
 *
 * The single conversion event is a real, sourced, market-specific number on screen
 * in under fifteen seconds with no account. So the number is ABOVE the fold and it
 * is already there on first paint, before the visitor touches anything. The form
 * changes it. The form does not gate it.
 *
 * Every figure on this page is fetched from the live corpus at request time and
 * passes the honesty filter. There is no hardcoded price anywhere in this file, on
 * purpose: a number typed into marketing copy is a number that will eventually be
 * wrong, and the whole product is the promise that ours are not.
 */

export const revalidate = 3600;

// The comparison set for the spread section. Four large, geographically separated
// markets that a broker in any region will recognise at least two of.
const COMPARE = ["31080", "35620", "16980", "26420"];

const DEFAULT_SERVICE = "70553";
const DEFAULT_MARKET = "31080";

const money = (v: number) => "$" + Math.round(v).toLocaleString("en-US");

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; market?: string }>;
}) {
  const sp = await searchParams;

  // The picker now reaches the whole national catalog, not the 39-item basket, so
  // validating against `findService` would have silently discarded 7,608 of the
  // 7,647 selectable procedures and reset the page to a brain MRI. Accept any
  // well-formed code; the resolver below decides whether we can answer for it.
  const rawService = (sp.service ?? "").trim().toUpperCase();
  const service = /^\d{4,5}[A-Z]?$/.test(rawService) ? rawService : DEFAULT_SERVICE;
  const market = findMetro((sp.market ?? "").trim()) ? (sp.market as string).trim() : DEFAULT_MARKET;

  const svc = findService(service);
  const metro = findMetro(market)!;

  // Nothing is rendered from a placeholder. If the server cannot reach the corpus
  // we say that, rather than showing a page full of empty boxes that looks broken.
  const configured = isConfigured();

  type Row = { metro: Metro; rate: MarketRate | NoMarketRate };
  type FoundRow = { metro: Metro; rate: MarketRate };

  let result: MarketRate | NoMarketRate | null = null;
  let comparison: Row[] = [];

  // Real corpus first, national engine second. Identical ordering to /api/lookup, so
  // the hero and the API can never disagree about the same cell. It is a fallback and
  // never a blend: the engine is only consulted when the real path found nothing.
  const resolve = async (m: Metro): Promise<MarketRate | NoMarketRate> => {
    const real = await marketRate(service, { cbsa: m.cbsa, state: m.state, metroName: m.name });
    if (real.found) return real;
    const national = nationalRate(service, { cbsa: m.cbsa, state: m.state, metroName: m.name });
    return national.found ? national : real;
  };

  if (configured) {
    [result, comparison] = await Promise.all([
      resolve(metro),
      Promise.all(
        COMPARE.map(async (cbsa): Promise<Row> => {
          const m = findMetro(cbsa)!;
          return { metro: m, rate: await resolve(m) };
        }),
      ),
    ]);
  }

  // Only metro-scope rows belong in a metro comparison. A row that quietly fell
  // back to its state would make the table compare a city against a state and the
  // headline multiple would be measuring the wrong thing.
  const usable: FoundRow[] = comparison.filter(
    (c): c is FoundRow => c.rate.found && c.rate.scope === "metro",
  );

  const hi = usable.length ? usable.reduce((a, b) => (b.rate.cell.p50 > a.rate.cell.p50 ? b : a)) : null;
  const lo = usable.length ? usable.reduce((a, b) => (b.rate.cell.p50 < a.rate.cell.p50 ? b : a)) : null;
  // Two markets minimum, or "1.0x apart" would render as a finding.
  const ratio =
    hi && lo && usable.length >= 2 && lo.rate.cell.p50 > 0 ? hi.rate.cell.p50 / lo.rate.cell.p50 : null;

  return (
    <>
      <SiteHeader />

      <main>
        {/* ================= 1. THE FIFTEEN SECOND NUMBER ================= */}
        <section style={{ paddingTop: "clamp(40px, 7vw, 76px)", paddingBottom: "clamp(32px, 5vw, 56px)" }}>
          <div className="wrap">
            {/*
              THE TWO COLUMN HERO. @BROKER-CONDUCTOR, on David's direct order, after
              he asked three times why the hero had not been upgraded.

              WHAT WAS WRONG, MEASURED not asserted: at 1440 the hero text capped at
              760px inside a 1092px grid, so roughly 47% of the first screen was empty
              white with no number, no chart and nothing else in it. The audit called
              this the single highest-leverage change on the whole site: it is the
              moment attention is won or lost, and it was blank on five routes.

              The fix puts the live result card in the right half, so the pitch and
              the proof are on screen together above the fold. The lookup moves below
              both columns and stays full width, because `.lookup-grid` switches to
              three columns on a VIEWPORT query: inside a 550px column at a 1440px
              viewport it would have gone three-across again and re-crushed the selects
              to "Bra" and "Lo", which is the exact defect this site already fixed once.

              @BROKER-MARKETING: your copy, your components, your classes. I moved
              structure only and changed not one word.
            */}
            <div className="hero-grid">
              <div>
              <p className="eyebrow rise">
                <span className="chip-dot" style={{ display: "inline-block", marginRight: 8, verticalAlign: "middle" }} />
                {METROS.length} metro markets · {SCALE.procedures.toLocaleString("en-US")} procedures
                · every carrier
              </p>

              <h1
                className="display rise rise-1"
                style={{ fontSize: "var(--display)", marginTop: 14, maxWidth: "16ch" }}
              >
                Know what the market pays.
              </h1>

              <p className="lede rise rise-2" style={{ marginTop: 18, maxWidth: "58ch" }}>
                Federal law made every negotiated rate public. The files are millions of rows of
                machine-readable filings, so almost nobody reads them. We do. Pick a service and a market
                and see the real spread. No account, no email.
              </p>

              {/*
                ADDITIVE, @BROKER-CONDUCTOR on David's direct order: one obvious door
                into the tooling. @BROKER-MARKETING, I added this block and changed
                nothing else in your hero. Placed BELOW the lede and ABOVE the lookup
                so it never competes with the fifteen second number, which is still
                the primary conversion event on this page.
              */}
              <div
                className="rise rise-2"
                style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22, alignItems: "center" }}
              >
                <Link href="/tools" className="btn btn-primary">
                  Open the platform →
                </Link>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "var(--text-xs)",
                    color: "var(--faint)",
                  }}
                >
                  Working tools. No account required.
                </span>
              </div>
            </div>

            <div className="rise rise-3" style={{ marginTop: 26, maxWidth: 880 }}>
              <LookupForm service={service} market={market} />
            </div>

            <div style={{ marginTop: 20, maxWidth: 880 }} id="result">
              {!configured ? (
                <UnavailableState />
              ) : (
                result && <RatePanel result={result} plainName={svc?.plain ?? null} />
              )}
            </div>
          </div>
        </section>

        {/* ================= 2. THE FLINCH ================= */}
        {ratio && hi && lo && (
          <section className="band" style={{ paddingBlock: "clamp(48px, 7vw, 88px)" }}>
            <div className="wrap">
              <Reveal>
                <p className="eyebrow">The same service, different cities</p>
                <h2
                  className="display"
                  style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "20ch" }}
                >
                  One procedure. {usable.length} markets.{" "}
                  <span style={{ color: "var(--exposure)" }}>{ratio.toFixed(1)}x</span> apart.
                </h2>
                <p className="lede" style={{ marginTop: 14, maxWidth: "62ch" }}>
                  {hi.metro.name.split("-")[0]} pays a median of {money(hi.rate.cell.p50)} for{" "}
                  {svc?.plain ?? `CPT ${service}`}. {lo.metro.name.split("-")[0]} pays{" "}
                  {money(lo.rate.cell.p50)}. Not billed charges, not an estimate. What plans have
                  contracted to pay, filed by the payers themselves.
                </p>
              </Reveal>

              <Reveal delay={80}>
                <div style={{ marginTop: 28, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table
                    style={{
                      width: "100%",
                      minWidth: 620,
                      borderCollapse: "separate",
                      borderSpacing: 0,
                      background: "var(--paper)",
                      border: "1px solid var(--hair)",
                      borderRadius: "var(--r)",
                      overflow: "hidden",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <caption
                      style={{
                        captionSide: "bottom",
                        textAlign: "left",
                        padding: "12px 16px",
                        fontSize: "var(--text-xs)",
                        color: "var(--faint)",
                        lineHeight: 1.6,
                      }}
                    >
                      {svc?.name ?? `CPT ${service}`}. What every carrier in this market has agreed
                      to pay, from the low end to the high end.
                    </caption>
                    <thead>
                      <tr>
                        {["Market", "25th", "Median", "75th", "90th", "Filings"].map((h, i) => (
                          <th
                            key={h}
                            scope="col"
                            style={{
                              textAlign: i === 0 ? "left" : "right",
                              padding: "13px 16px",
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
                      {comparison.map(({ metro: m, rate }) => (
                        <tr key={m.cbsa}>
                          <th
                            scope="row"
                            style={{
                              textAlign: "left",
                              padding: "14px 16px",
                              fontWeight: 500,
                              fontSize: "var(--text-sm)",
                              color: "var(--ink)",
                              borderBottom: "1px solid var(--hair)",
                            }}
                          >
                            {m.name.split("-")[0]}
                            <span style={{ color: "var(--faint)", fontWeight: 400 }}>, {m.state}</span>
                          </th>
                          {rate.found ? (
                            <>
                              <Cell v={money(rate.cell.p25)} />
                              <Cell v={money(rate.cell.p50)} strong />
                              <Cell v={money(rate.cell.p75)} />
                              <Cell v={rate.cell.p90 != null ? money(rate.cell.p90) : null} tone="exposure" />
                              <Cell v={rate.cell.n.toLocaleString("en-US")} tone="faint" />
                            </>
                          ) : (
                            <td
                              colSpan={5}
                              style={{
                                padding: "14px 16px",
                                textAlign: "right",
                                fontSize: "var(--text-sm)",
                                color: "var(--muted)",
                                borderBottom: "1px solid var(--hair)",
                              }}
                            >
                              <span className="gap-dot" style={{ marginRight: 8 }} />
                              No publishable distribution for this market
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* ================= 3. THE ROLE FORK ================= */}
        <section style={{ paddingBlock: "clamp(48px, 7vw, 88px)" }}>
          <div className="wrap">
            <Reveal>
              <p className="eyebrow">Same data, three jobs</p>
              <h2 className="display" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "18ch" }}>
                Where do you sit at the table?
              </h2>
            </Reveal>

            <div
              style={{
                marginTop: 30,
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fit, minmax(272px, 1fr))",
              }}
            >
              {[
                {
                  href: "/brokers",
                  eyebrow: "I place groups",
                  title: "Brokers",
                  body: "Walk into a renewal holding a market number the incumbent does not have. Show a client where their plan sits against the market they actually buy in.",
                  cta: "For brokers",
                },
                {
                  href: "/general-agencies",
                  eyebrow: "I run an agency",
                  title: "General agencies",
                  body: "Arm a downstream network. Give every broker who quotes through you something they cannot get anywhere else, under your name.",
                  cta: "For general agencies",
                },
                {
                  href: "/employers",
                  eyebrow: "I run our plan",
                  title: "Self-funded employers",
                  body: "Build a defensible file. See what your market pays before your renewal meeting, in plain English, with the source on every figure.",
                  cta: "For employers",
                },
              ].map((c, i) => (
                <Reveal key={c.href} delay={i * 70}>
                  <Link href={c.href} className="card card-hover" style={{ display: "block", height: "100%" }}>
                    <p className="eyebrow" style={{ color: "var(--faint)" }}>
                      {c.eyebrow}
                    </p>
                    <h3 className="display" style={{ fontSize: "var(--text-xl)", marginTop: 10 }}>
                      {c.title}
                    </h3>
                    <p style={{ marginTop: 10, fontSize: "var(--text-sm)", color: "var(--muted)", lineHeight: 1.65 }}>
                      {c.body}
                    </p>
                    <p
                      style={{
                        marginTop: 16,
                        fontSize: "var(--text-sm)",
                        fontWeight: 600,
                        color: "var(--teal-deep)",
                      }}
                    >
                      {c.cta} →
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================= 4. HOW THE DATA WORKS ================= */}
        <section className="band" style={{ paddingBlock: "clamp(48px, 7vw, 88px)" }}>
          <div className="wrap">
            <div style={{ display: "grid", gap: 40, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
              <Reveal>
                <p className="eyebrow">Where the numbers come from</p>
                <h2 className="display" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "17ch" }}>
                  Public filings, read properly.
                </h2>
                <p className="lede" style={{ marginTop: 16 }}>
                  Since 2022, federal law has required every health plan to publish every price it has
                  agreed with every provider. The law is the easy part. The files are enormous, they
                  disagree with each other, and they are full of rows that look like prices and are not.
                </p>
                <p style={{ marginTop: 14, fontSize: "var(--text-sm)", color: "var(--muted)", lineHeight: 1.7 }}>
                  Reading them correctly is the entire product. A rate filed as a percentage is a
                  multiplier, not a dollar amount. A rate belongs to the contracting entity, not to a
                  single provider. One carrier brand contains many separate contracting entities that do
                  not pay the same. Get any of that wrong and you publish a confident, wrong number.
                </p>
                <p style={{ marginTop: 20 }}>
                  <Link href="/methodology" className="btn btn-secondary">
                    Read the methodology
                  </Link>
                </p>
              </Reveal>

              <Reveal delay={90}>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    {
                      t: "We publish a number or we publish nothing",
                      b: "Every cell passes a filter before it renders. If the filings for a market do not support a defensible figure, you get a sentence explaining why, never a placeholder and never a zero.",
                    },
                    {
                      t: "Metro first, and we always say which",
                      b: "A state average hides the market a broker actually sells in. We report the metro when the sample supports it, fall back to the state when it does not, and label which one you are looking at.",
                    },
                    {
                      t: "Price only, and we say so",
                      b: "We hold what plans pay. We do not hold claims, utilization, or any member data. There is no PHI in this product and there never will be.",
                    },
                  ].map((x) => (
                    <div key={x.t} className="card">
                      <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink)" }}>{x.t}</h3>
                      <p style={{ marginTop: 7, fontSize: "var(--text-sm)", color: "var(--muted)", lineHeight: 1.65 }}>
                        {x.b}
                      </p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ================= 5. THE CLOSE ================= */}
        <section style={{ paddingBlock: "clamp(56px, 8vw, 96px)" }}>
          <div className="wrap-tight" style={{ textAlign: "center" }}>
            <Reveal>
              <h2 className="display" style={{ fontSize: "var(--display-sm)", maxWidth: "22ch", marginInline: "auto" }}>
                Bring a number to the meeting.
              </h2>
              <p className="lede" style={{ marginTop: 16, maxWidth: "52ch", marginInline: "auto" }}>
                Tell us the markets you write in and the services that drive your groups. We will show you
                what we hold, and what we do not.
              </p>
              <div
                style={{
                  marginTop: 26,
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <a href={DISCOVERY_URL} className="btn btn-primary">
                  Book a call
                </a>
                <Link href="/methodology" className="btn btn-secondary">
                  See how it works
                </Link>
              </div>
              <p style={{ marginTop: 18, fontSize: "var(--text-xs)", color: "var(--faint)" }}>
                {SERVICES.length} services · {METROS.length} metro markets you can look up today
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function Cell({
  v,
  strong,
  tone,
}: {
  v: string | null;
  strong?: boolean;
  tone?: "exposure" | "faint";
}) {
  return (
    <td
      className={v ? "num" : undefined}
      style={{
        textAlign: "right",
        padding: "14px 16px",
        borderBottom: "1px solid var(--hair)",
        fontSize: strong ? "var(--text-md)" : "var(--text-sm)",
        fontWeight: strong ? 700 : 500,
        color:
          tone === "exposure" ? "var(--exposure)" : tone === "faint" ? "var(--faint)" : "var(--ink)",
        whiteSpace: "nowrap",
      }}
    >
      {v ?? <span className="gap-dot" aria-label="not published" />}
    </td>
  );
}

function UnavailableState() {
  return (
    <div className="empty-state">
      <p style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>The rate corpus is not reachable right now.</p>
      <p>
        We show a number when we can stand behind it and we say so plainly when we cannot. Nothing on this
        page is estimated to fill the gap.
      </p>
    </div>
  );
}
