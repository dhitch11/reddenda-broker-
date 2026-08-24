import Link from "next/link";
import { marketRate } from "@/lib/rates";
import { METROS, findMetro } from "@/lib/metros";
import { SERVICES } from "@/lib/catalog";
import { SCALE } from "@/lib/national";
import { isConfigured } from "@/lib/db";
import { SiteHeader, SiteFooter, DISCOVERY_URL } from "@/components/marketing/chrome";

/**
 * THE DEMO ENVIRONMENT.
 *
 * David asked for one obvious door into the tooling rather than a visitor having to
 * guess a /tools/<slug> URL. This is that door, and it is the only page on the site
 * whose job is orientation.
 *
 * NEW FILE, added by @BROKER-CONDUCTOR. It imports from @BROKER-TOOLS's data layer
 * and @BROKER-MARKETING's chrome and edits neither, so it cannot collide with work
 * either lane has in flight.
 *
 * The live number below is fetched at request time from the corpus, not typed in.
 * A demo landing page that advertises the tool with a fabricated example would be a
 * rule 1 violation on the exact surface whose entire pitch is that our numbers are
 * real, so if the corpus is unreachable this page says so and offers the tools
 * anyway rather than rendering a confident fake.
 */

export const revalidate = 3600;

export const metadata = {
  title: "The platform",
  description:
    "Every carrier's negotiated price for care, in all 928 U.S. metro markets, instantly.",
};

const money = (v: number) => "$" + Math.round(v).toLocaleString("en-US");

type Tool = {
  href: string;
  eyebrow: string;
  name: string;
  what: string;
  who: string;
  ready: boolean;
};

const TOOLS: Tool[] = [
  {
    href: "https://app.reddenda.com/broker/console/rates",
    eyebrow: "Start here",
    name: "Rate Check",
    what:
      "Pick your city and a procedure and see what every carrier has agreed to pay: the low end, the middle price and the high end, with the Medicare rate beside them.",
    who: "The one every visitor should open first.",
    ready: true,
  },
  {
    href: "https://app.reddenda.com/broker/console/brief",
    eyebrow: "The leave behind",
    name: "Market Brief",
    what:
      "Every service we hold for one metro, ranked by how far apart the cheap and the expensive options are. The widest gaps are where a plan design decision is worth making.",
    who: "The artifact a broker hands a client.",
    ready: true,
  },
  {
    href: "https://app.reddenda.com/broker/console/site-of-care",
    eyebrow: "Plan design",
    name: "Site of Service",
    what:
      "The same procedure priced in a physician office, a hospital outpatient department and an ambulatory surgery center. The gap between those three is the plan design argument.",
    who: "For the renewal conversation, not the lookup.",
    ready: true,
  },
];

export default async function ToolsIndex() {
  const configured = isConfigured();

  // One real, current figure so the page proves the corpus is live rather than
  // claiming it. Los Angeles brain MRI: the widest recognisable spread we hold.
  let spread: { lo: number; hi: number; n: number; market: string } | null = null;
  if (configured) {
    const la = findMetro("31080");
    try {
      const r = await marketRate("70553", {
        cbsa: la?.cbsa,
        state: la?.state ?? "CA",
        metroName: la?.name,
      });
      // p25 and p90 are nullable in the corpus. A partially populated cell is a real
      // state, not an error, and it must not render as "$null" or as a guessed
      // number: if either bound is missing we simply omit the line.
      if (r.found && r.cell && typeof r.cell.p25 === "number" && typeof r.cell.p90 === "number") {
        spread = {
          lo: r.cell.p25,
          hi: r.cell.p90,
          n: r.cell.n,
          market: (la?.name ?? "Los Angeles").split("-")[0],
        };
      }
    } catch {
      spread = null;
    }
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section
          style={{
            paddingTop: "clamp(40px, 7vw, 76px)",
            paddingBottom: "clamp(28px, 4vw, 44px)",
          }}
        >
          <div className="wrap">
            <div style={{ maxWidth: 760 }}>
              <p className="eyebrow rise">
                <span
                  className="chip-dot"
                  style={{ display: "inline-block", marginRight: 8, verticalAlign: "middle" }}
                />
                Live corpus · every U.S. metro market
              </p>

              <h1
                className="display rise rise-1"
                style={{ fontSize: "var(--display)", marginTop: 14, maxWidth: "17ch" }}
              >
                The working tools.
              </h1>

              <p className="lede rise rise-2" style={{ marginTop: 18, maxWidth: "58ch" }}>
                Every carrier&rsquo;s negotiated price, in all {METROS.length} U.S. metro markets,
                instantly. {SCALE.procedures.toLocaleString("en-US")} procedures, searchable in
                seconds. And where a market is too thin to describe honestly, the tool tells you so
                instead of showing you a number.
              </p>

              {spread && (
                <p
                  className="rise rise-3"
                  style={{
                    marginTop: 20,
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "var(--text-sm)",
                    color: "var(--faint)",
                    lineHeight: 1.7,
                  }}
                >
                  Live right now: a brain MRI in {spread.market} runs{" "}
                  <strong style={{ color: "var(--ink)" }}>{money(spread.lo)}</strong> to{" "}
                  <strong style={{ color: "var(--ink)" }}>{money(spread.hi)}</strong>. Same scan,
                  same city.
                </p>
              )}
            </div>
          </div>
        </section>

        <section style={{ paddingBottom: "clamp(48px, 7vw, 88px)" }}>
          <div className="wrap">
            <div
              style={{
                display: "grid",
                gap: 18,
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              }}
            >
              {/*
                PLAIN <a>, AND THE FINAL URL, NOT THE REDIRECT.
                Fixed 2026-08-25 by @BROKER-5.

                MEASURED: this page threw SIX console errors on every load, at
                every width. These three cards pointed at /tools/* which
                next.config.ts 308s to app.reddenda.com. Next prefetches a <Link>
                on sight, the RSC prefetch followed the redirect cross-origin, and
                the browser refused it:

                  Access to fetch at 'https://app.reddenda.com/broker/console/rates'
                  (redirected from 'http://.../tools/rate-check') has been blocked
                  by CORS policy ... Failed to load resource: net::ERR_FAILED

                Nothing was visibly broken, which is exactly why it survived: the
                links worked when clicked and the console screamed on every visit.

                Pointing at the destination fixes three things at once. The prefetch
                stops (a plain <a> is not prefetched), the user stops paying a
                redirect hop, and the browser stops being asked to do something it
                will refuse. The 308s in next.config.ts stay for anyone holding an
                old URL; nothing on this site walks into them any more.
              */}
              {TOOLS.map((t) => (
                <a
                  key={t.href}
                  href={t.href}
                  className="card card-hover"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    padding: "clamp(20px, 3vw, 28px)",
                  }}
                >
                  <p className="eyebrow" style={{ color: "var(--faint)" }}>
                    {t.eyebrow}
                  </p>
                  <h2
                    style={{
                      fontSize: "var(--text-xl, 1.35rem)",
                      margin: "10px 0 0",
                      color: "var(--ink)",
                      letterSpacing: "-.01em",
                    }}
                  >
                    {t.name}
                  </h2>
                  <p
                    style={{
                      marginTop: 10,
                      fontSize: "var(--text-sm)",
                      color: "var(--muted, var(--faint))",
                      lineHeight: 1.7,
                      flexGrow: 1,
                    }}
                  >
                    {t.what}
                  </p>
                  <p
                    style={{
                      marginTop: 14,
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: "var(--text-xs)",
                      color: "var(--faint)",
                    }}
                  >
                    {t.who}
                  </p>
                  <p
                    style={{
                      marginTop: 16,
                      fontWeight: 600,
                      fontSize: "var(--text-sm)",
                      color: "var(--teal-deep, var(--ink))",
                    }}
                  >
                    Open {t.name} →
                  </p>
                </a>
              ))}
            </div>

            {!configured && (
              <p
                style={{
                  marginTop: 22,
                  fontSize: "var(--text-sm)",
                  color: "var(--caution, var(--faint))",
                  lineHeight: 1.7,
                }}
              >
                The corpus is not reachable from this server right now, so the tools will show an
                unavailable state rather than a number. That is deliberate. We do not substitute an
                estimate when the real figure is missing.
              </p>
            )}
          </div>
        </section>

        <section className="band" style={{ paddingBlock: "clamp(44px, 6vw, 72px)" }}>
          <div className="wrap">
            <div style={{ maxWidth: 640 }}>
              <p className="eyebrow">What this is not</p>
              <p
                style={{
                  marginTop: 12,
                  fontSize: "var(--text-base, 1rem)",
                  color: "var(--muted, var(--faint))",
                  lineHeight: 1.75,
                }}
              >
                We hold what care costs, not how often anyone needs it. There is no claims data
                here, no patient data, and no PHI. These are the prices plans have agreed to, not a
                quote and not a bill. Every one of those limits is on the{" "}
                <Link href="/methodology" style={{ color: "var(--teal-deep, var(--ink))" }}>
                  methodology page
                </Link>{" "}
                in full.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
                <a href="https://app.reddenda.com/broker/console" className="btn btn-primary">
                  Open Rate Check
                </a>
                <a href={DISCOVERY_URL} className="btn btn-secondary">
                  Talk to us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
