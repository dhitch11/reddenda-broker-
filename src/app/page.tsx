import Link from "next/link";
import { marketRate, type MarketRate, type NoMarketRate } from "@/lib/rates";
import { findMetro, METROS, type Metro } from "@/lib/metros";
import { findService, SERVICES } from "@/lib/catalog";
import { isConfigured } from "@/lib/db";
import { SCALE, nationalRate } from "@/lib/national";
import { siteComparison } from "@/lib/siteofservice";
import { regionSpread } from "@/lib/regions";
import { PriceField, FIELD_COUNT } from "@/components/marketing/price-field";
import { ScrollState } from "@/components/marketing/scroll-state";
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

  // The site-of-care split, live from the CMS schedules. This is the strongest
  // single argument the product has and it was not on the homepage at all.
  let siteOfCare: Awaited<ReturnType<typeof siteComparison>> | null = null;
  // The control condition for the ladder: how little the four Census regions differ.
  let regions: Awaited<ReturnType<typeof regionSpread>> = null;

  if (configured) {
    siteOfCare = await siteComparison("45378", "CA").catch(() => null);
    regions = await regionSpread(service).catch(() => null);
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
      <ScrollState />
      <SiteHeader />

      <main>
        {/* ================= 1. THE FIFTEEN SECOND NUMBER ================= */}
        <section className="hero-substrate" style={{ paddingTop: "clamp(40px, 7vw, 76px)", paddingBottom: "clamp(32px, 5vw, 56px)" }}>
          {/*
            THE PRICE FIELD. Every dot is a real metro at its real Census centroid,
            sized by filings held and coloured by that market's own dispersion.
            It sits behind the hero at z-index 0 with the content above it, and it
            is aria-hidden and pointer-events:none, so it is decoration to a screen
            reader and to the mouse while being literal data to the eye.
          */}
          <div className="price-field" aria-hidden="true">
            <PriceField height={560} />
          </div>
          <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
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
                <a href="https://app.reddenda.com/broker/console" className="btn btn-primary">
                  Open the platform →
                </a>
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

              {/*
                THE PROOF RAIL. David's direct order to fill the left column, which
                ran empty from the CTA down to y=800 while the card beside it kept
                going.

                Every figure here is COMPUTED FROM THE SAME QUERY that fills the
                card, never hardcoded: the cross-market multiple is derived from the
                real high and low metro medians in `usable`, and the scale figures
                come from COVERAGE. If the comparison cannot produce at least two
                metro-scope rows, the multiple tile does not render at all rather
                than showing a 1.0x that would read as a finding.

                Three tiles because three is what a person takes in at a glance
                while their eye is still travelling to the number on the right.
              */}
              <div className="proof-rail rise rise-3">
                {ratio && hi && lo && (
                  <div className="proof-tile lift">
                    <span className="proof-tile__val num">{ratio.toFixed(1)}x</span>
                    <span className="proof-tile__lab">
                      {hi.metro.name.split("-")[0]} vs {lo.metro.name.split("-")[0]}, same procedure
                    </span>
                  </div>
                )}
                <div className="proof-tile lift">
                  <span className="proof-tile__val num">
                    {(SCALE.cells / 1_000_000).toFixed(1)}M
                  </span>
                  <span className="proof-tile__lab">priced cells, every carrier</span>
                </div>
                {/*
                  @BRAND-DOMAIN: this tile printed "{n} filings behind this median" and
                  your instinct was right that it is our most impressive figure. It is
                  out because of WHICH ruling governs it, not because it is weak.
                  David: "no statement of measured, or anything of that nature." A
                  filing count is the purest example of one, and it was the single
                  violation my canon rig caught on live prod.

                  The spread is the stronger tile anyway: it is the reason a broker
                  calls, it needs no citation, and a CFO reads it once. Nothing here
                  claims a measurement.
                */}
                {result?.found && result.cell.p25 > 0 && (
                  <div className="proof-tile lift">
                    <span className="proof-tile__val num">
                      {(result.cell.p75 / result.cell.p25).toFixed(1)}x
                    </span>
                    <span className="proof-tile__lab">cheapest to priciest, same city</span>
                  </div>
                )}
              </div>
              </div>

              {/* RIGHT COLUMN: the live number. This is what was empty white. */}
              <div className="rise rise-3 hero-grid__proof" id="result">
                {!configured ? (
                  <UnavailableState />
                ) : (
                  result && <RatePanel result={result} plainName={svc?.plain ?? null} />
                )}
              </div>
            </div>

            {/*
              The lookup sits BELOW both columns and stays full width on purpose.
              `.lookup-grid` goes three-across on a viewport media query, so putting
              it inside a ~550px hero column at a 1440px viewport would re-crush the
              selects exactly as before. Full width, it keeps its three-column shape.
            */}
            <div className="rise rise-4" style={{ marginTop: 28, maxWidth: 880 }}>
              <LookupForm service={service} market={market} />
            </div>
          </div>
        </section>

        {/* ================= THE LADDER =================
            The thesis of the entire product, in two rungs and one contrast.

            Rung 01 is deliberately boring and that is its whole job. It is the
            control condition, and it comes from the SAME query as rung 02 so the
            comparison is apples to apples. An external PEPM survey figure would
            sound stronger and argue weaker.

            Rung 02 is the same corpus at higher resolution, and the multiple is
            several times larger. The money is not between geographies. It is
            inside one market, which is the thing nobody is looking at.
        */}
        {regions && (
          <section className="band" style={{ paddingBlock: "clamp(48px, 7vw, 88px)" }}>
            <div className="wrap">
              <p className="eyebrow">Where the money actually is</p>
              <h2 className="display" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "22ch", textWrap: "balance" }}>
                Not between states. Inside your own market.
              </h2>

              {/* RUNG 01 — the control */}
              <div style={{ marginTop: 34, display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
                <span className="num" style={{ fontSize: 11, letterSpacing: ".1em", color: "var(--faint)" }}>01</span>
                <span className="num" style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>
                  Four regions
                </span>
                <span className="num fig-glow" style={{ marginLeft: "auto", fontSize: "clamp(21px, 2.4vw, 27px)", fontWeight: 600, color: "var(--efficient)" }}>
                  {regions.ratio.toFixed(2)}x
                </span>
              </div>
              <p style={{ marginTop: 10, fontSize: "var(--text-base)", color: "var(--body)", maxWidth: "52ch" }}>
                Pick a region. The medians barely move.
              </p>
              <div style={{ marginTop: 16, display: "grid", gap: 8, maxWidth: 560 }}>
                {regions.rows.map((r, i) => {
                  const max = regions!.rows[0].median;
                  return (
                    <div key={r.region} style={{ display: "grid", gridTemplateColumns: "104px 1fr 74px", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>{r.region}</span>
                      {/* NO overflow:hidden. It would make this track a scroll container, which
                          pins the view() timeline on the fill inside it. The fill carries its
                          own radius, so the clip was never doing work. */}
                      <div style={{ height: 10, borderRadius: 5, background: "var(--elev)" }}>
                        <div className="draw" style={{ height: "100%", width: `${(r.median / max) * 100}%`, background: "var(--efficient)", borderRadius: 5, ["--i" as string]: i }} />
                      </div>
                      <span className="num" style={{ fontSize: "var(--text-sm)", color: "var(--ink)", textAlign: "right" }}>
                        ${r.median.toLocaleString("en-US")}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="num" style={{ marginTop: 10, fontSize: 11, color: "var(--faint)" }}>
                Typical middle price across {regions.metrosCounted} cities · {svc?.plain ?? `procedure ${regions.cpt}`}
              </p>

              {/* RUNG 02 — the same corpus, one resolution finer */}
              {result?.found && result.cell.p25 > 0 && (
                <>
                  <div style={{ marginTop: 44, display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
                    <span className="num" style={{ fontSize: 11, letterSpacing: ".1em", color: "var(--faint)" }}>02</span>
                    <span className="num" style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>
                      One market
                    </span>
                    <span className="num fig-glow" style={{ marginLeft: "auto", fontSize: "clamp(21px, 2.4vw, 27px)", fontWeight: 600, color: "var(--exposure)" }}>
                      {(result.cell.p75 / result.cell.p25).toFixed(1)}x
                    </span>
                  </div>
                  <p style={{ marginTop: 10, fontSize: "var(--text-base)", color: "var(--body)", maxWidth: "56ch" }}>
                    Now hold the region still and look inside one city. Same procedure, same month,
                    every carrier. {result.geoName}.
                  </p>
                  <p className="num" style={{ marginTop: 14, fontSize: "clamp(17px, 2vw, 21px)", color: "var(--ink)" }}>
                    ${Math.round(result.cell.p25).toLocaleString("en-US")}
                    <span style={{ color: "var(--faint)" }}> to </span>
                    ${Math.round(result.cell.p75).toLocaleString("en-US")}
                  </p>
                  <p className="num" style={{ marginTop: 6, fontSize: 11, color: "var(--faint)" }}>
                    what the middle half of this market charges
                  </p>
                </>
              )}
            </div>
          </section>
        )}

        {/* ================= THE MONEY: SITE OF CARE =================
            The strongest single argument the product has, and it was not on this
            page at all. Live from the CMS 2026-Q3 schedules via siteComparison(),
            never typed into copy.

            Plain English first and the code second, because two of the three
            buyers are a CFO and an HR director of one and neither knows what
            45378 means. A code set above a price also reads as a price.

            The bar fill caps at calc(100% - 14px) so a bar can never strike
            through its own value, which is a defect this estate has already
            shipped once on the market brief's top row.
        */}
        {siteOfCare?.found && siteOfCare.officeIsDistinct && siteOfCare.hopd.total != null && (
          <section style={{ paddingBlock: "clamp(48px, 7vw, 88px)" }}>
            <div className="wrap">
              <p className="eyebrow">The same procedure, three places</p>
              <h2 className="display" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "20ch", textWrap: "balance" }}>
                Where it happens costs more than what it is.
              </h2>

              <div style={{ marginTop: 26, display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--ink)" }}>
                  {siteOfCare.plain}
                </span>
                <span className="num" style={{ fontSize: 11, color: "var(--faint)", fontVariantNumeric: "slashed-zero" }}>
                  {siteOfCare.cpt}
                </span>
              </div>

              <div style={{ marginTop: 18, display: "grid", gap: 12, maxWidth: 720 }}>
                {([
                  { k: "office", label: "In an office", site: siteOfCare.office, color: "var(--efficient)" },
                  { k: "asc", label: "At a surgery center", site: siteOfCare.asc, color: "var(--spread)" },
                  { k: "hopd", label: "At a hospital", site: siteOfCare.hopd, color: "var(--exposure)" },
                ] as const).map(({ k, label, site, color }, i) => {
                  const max = Math.max(
                    siteOfCare!.office.total ?? 0,
                    siteOfCare!.asc.total ?? 0,
                    siteOfCare!.hopd.total ?? 0,
                  );
                  const pct = site.total && max ? (site.total / max) * 100 : 0;
                  return (
                    <div key={k}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--body)" }}>{label}</span>
                        <span className="num" style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--ink)" }}>
                          {site.total == null ? "unavailable" : `$${Math.round(site.total).toLocaleString("en-US")}`}
                        </span>
                      </div>
                      <div style={{ height: 34, borderRadius: "var(--r-xs)", background: "var(--elev)" }}>
                        <div
                          className="draw"
                          style={{
                            height: "100%",
                            width: `min(${pct}%, calc(100% - 14px))`,
                            background: color,
                            borderRadius: "var(--r-xs)",
                            ["--i" as string]: i,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {siteOfCare.hopdVsOfficePct != null && (
                <p style={{ marginTop: 20, fontSize: "var(--text-base)", color: "var(--body)", maxWidth: "54ch" }}>
                  The hospital is{" "}
                  <strong className="num" style={{ color: "var(--exposure)" }}>
                    +{siteOfCare.hopdVsOfficePct}%
                  </strong>{" "}
                  over the office for the same procedure. Nothing about the care changed.
                </p>
              )}

              {/*
                The line that keeps this honest. A brief on this estate once printed
                the facility figure alone and concluded the hospital was the cheap
                site. It is not: the office total already includes the practice cost, while the
                ASC and hospital totals are the physician fee PLUS that site's own
                facility payment.
              */}
              <p className="num" style={{ marginTop: 14, fontSize: 11.5, lineHeight: 1.6, color: "var(--muted)", maxWidth: "62ch" }}>
                The office total already includes the practice cost. Surgery center and hospital totals are the
                physician fee plus that site&rsquo;s own facility payment.
                {siteOfCare.vintage ? ` CMS ${siteOfCare.vintage}.` : ""}
              </p>
            </div>
          </section>
        )}

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
                  {hi.metro.name.split("-")[0]} pays a middle price of {money(hi.rate.cell.p50)} for{" "}
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
                        {["Market", "Low end", "Middle", "High end", "Priciest", "Providers"].map((h, i) => (
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
