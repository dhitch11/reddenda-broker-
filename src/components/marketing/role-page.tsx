import Link from "next/link";
import { marketRate } from "@/lib/rates";
import { findMetro } from "@/lib/metros";
import { findService } from "@/lib/catalog";
import { isConfigured } from "@/lib/db";
import { SiteHeader, SiteFooter, DISCOVERY_URL } from "./chrome";
import { LookupForm } from "./lookup-form";
import { RatePanel } from "./rate-panel";
import { Reveal } from "./reveal";
import { GlowEye } from "@/components/landing/glow-eye";

/**
 * The shared chassis for /brokers, /general-agencies and /employers.
 *
 * Same product, three jobs. The handoff is explicit that the General Agency page
 * is the one most likely to be written wrong, because it is not a smaller broker
 * page: a GA's conversion metric is downstream broker adoption, not their own
 * usage. So the shape here forces each page to declare its own scenarios, its own
 * deliverable and its own honest limit rather than inheriting a generic set.
 *
 * Every role page carries a LIVE lookup with a role-appropriate default, so the
 * fifteen-second number rule holds on every entry point into the site, not only
 * on the home page.
 */

export type RoleConfig = {
  slug: string;
  eyebrow: string;
  h1: string;
  lede: string;
  /** Defaults for the embedded live lookup. Chosen to be relevant to this role. */
  demo: { service: string; market: string; why: string };
  scenarios: { when: string; body: string }[];
  deliverable: { title: string; body: string; bullets: string[] };
  /** The thing this role should NOT expect from us. Stated on their own page. */
  limit: { title: string; body: string };
  closer: string;
};

export async function RolePage({ config }: { config: RoleConfig }) {
  const svc = findService(config.demo.service);
  const metro = findMetro(config.demo.market);

  const result =
    isConfigured() && metro
      ? await marketRate(config.demo.service, {
          cbsa: metro.cbsa,
          state: metro.state,
          metroName: metro.name,
        })
      : null;

  return (
    <>
      <SiteHeader />

      <main>
        {/* ---------------- hero ----------------
             REBUILT 2026-08-25 by @BROKER-5 on David's standard, and it closes a
             defect this repo's own CSS documents from 2026-08-07: "at 1440 the
             hero text capped at 760px inside a 1092px content grid and roughly
             47% of the first screen was empty on five routes, including all three
             persona landing pages. The audit named filling it the single
             highest-leverage change on the site."

             It was still empty. Now the same two-column hero the landing uses
             carries the LIVE measured rate this page was already fetching for a
             panel further down. The number was on the page the whole time, three
             screens below the fold, on the pages whose entire job is to prove we
             have it. Same query, same component, moved to where a visitor
             actually meets it.

             The plane behind it is the landing's: aurora and survey grid, one
             register across the site rather than a flagship and four siblings. -->
          */}
        <section className="hero-plane">
          <div className="hero-plane__aurora" aria-hidden="true">
            <b /><b /><b />
          </div>
          <div className="hero-plane__grid" aria-hidden="true" />

          <div className="wrap" style={{ paddingTop: "clamp(40px, 6vw, 76px)", paddingBottom: "clamp(40px, 6vw, 72px)" }}>
            <div className="hero-split hero-split--top">
              <div style={{ display: "grid", gap: 20 }}>
                <div className="rise" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <GlowEye size={34} />
                  <span className="eyebrow">{config.eyebrow}</span>
                </div>
                <h1 className="hero-title rise rise-1" style={{ fontSize: "clamp(32px, 5.4vw, 62px)" }}>
                  {config.h1}
                </h1>
                <p className="hero-lede rise rise-2">{config.lede}</p>
                <div className="rise rise-3" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a href="https://app.reddenda.com/broker" className="btn btn-primary">
                    Create account
                  </a>
                  <a href="https://app.reddenda.com/broker?demo=1" className="btn btn-secondary">
                    Log in with demo
                  </a>
                  <a href={DISCOVERY_URL} style={{ fontSize: "var(--text-sm)", color: "var(--teal-deep)", padding: "8px 4px" }}>
                    or book a call
                  </a>
                </div>
              </div>

              {/* The proof, above the fold, measured. Or an honest empty state
                  that names its exit rather than apologising. */}
              <div className="rise rise-4">
                {result ? (
                  <RatePanel result={result} plainName={svc?.plain ?? null} />
                ) : (
                  <div className="card" style={{ padding: 22 }}>
                    <div className="readout__label">Live market rate</div>
                    <div className="empty-state" style={{ marginTop: 14 }}>
                      The rate corpus is not reachable from this server right now, so there is no number
                      here. Nothing on this page is estimated to fill the gap.{" "}
                      <Link href="/methodology" style={{ color: "var(--teal-deep)" }}>
                        Read what we hold and what we do not
                      </Link>
                      .
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- the moments ---------------- */}
        <section className="band" style={{ paddingBlock: "clamp(44px, 6vw, 80px)" }}>
          <div className="wrap">
            <Reveal>
              <p className="eyebrow">When it matters</p>
              <h2 className="display" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "20ch" }}>
                Three moments in your year.
              </h2>
            </Reveal>

            <div
              style={{
                marginTop: 28,
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fit, minmax(258px, 1fr))",
              }}
            >
              {config.scenarios.map((s, i) => (
                <Reveal key={s.when} delay={i * 70}>
                  <div className="card" style={{ height: "100%" }}>
                    <p className="eyebrow" style={{ color: "var(--faint)" }}>
                      {`0${i + 1}`}
                    </p>
                    <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--ink)", marginTop: 8 }}>
                      {s.when}
                    </h3>
                    <p style={{ marginTop: 9, fontSize: "var(--text-sm)", color: "var(--muted)", lineHeight: 1.7 }}>
                      {s.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- live proof ---------------- */}
        <section style={{ paddingBlock: "clamp(44px, 6vw, 80px)" }}>
          <div className="wrap">
            <Reveal>
              <p className="eyebrow">Live, right now</p>
              <h2 className="display" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "22ch" }}>
                Change it. It is a query, not a screenshot.
              </h2>
              <p className="lede" style={{ marginTop: 14, maxWidth: "60ch" }}>
                {config.demo.why}
              </p>
            </Reveal>

            {/* The panel itself now lives in the hero, so this section is the
                CONTROL rather than a second copy of the same readout. Rendering
                the identical panel twice on one page taught a visitor that the
                lookup does not do anything, because the answer was already on
                screen before they touched it. */}
            <div style={{ marginTop: 24, maxWidth: 880 }}>
              <LookupForm service={config.demo.service} market={config.demo.market} />
            </div>
          </div>
        </section>

        {/* ---------------- deliverable ---------------- */}
        <section className="band" style={{ paddingBlock: "clamp(44px, 6vw, 80px)" }}>
          <div className="wrap">
            <div style={{ display: "grid", gap: 36, gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}>
              <Reveal>
                <p className="eyebrow">What you walk out with</p>
                <h2 className="display" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "18ch" }}>
                  {config.deliverable.title}
                </h2>
                <p className="lede" style={{ marginTop: 14 }}>
                  {config.deliverable.body}
                </p>
              </Reveal>

              <Reveal delay={80}>
                <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
                  {config.deliverable.bullets.map((b) => (
                    <li
                      key={b}
                      className="card"
                      style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "start", padding: 16 }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "var(--teal)",
                          marginTop: 7,
                          boxShadow: "0 0 0 3px var(--teal-ring)",
                          flex: "none",
                        }}
                      />
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.7 }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------- the honest limit ---------------- */}
        <section style={{ paddingBlock: "clamp(40px, 5vw, 68px)" }}>
          <div className="wrap-tight">
            <Reveal>
              <div
                className="card"
                style={{ padding: "clamp(20px, 3.5vw, 30px)", borderLeft: "3px solid var(--spread)" }}
              >
                <p className="eyebrow" style={{ color: "var(--spread)" }}>
                  Before you ask
                </p>
                <h2 className="display" style={{ fontSize: "var(--text-xl)", marginTop: 10 }}>
                  {config.limit.title}
                </h2>
                <p style={{ marginTop: 10, fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.75, maxWidth: "64ch" }}>
                  {config.limit.body}
                </p>
                <p style={{ marginTop: 14 }}>
                  <Link href="/methodology#limits" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--teal-deep)" }}>
                    Everything we do not have →
                  </Link>
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------------- close ---------------- */}
        <section style={{ paddingBottom: "clamp(52px, 7vw, 88px)" }}>
          <div className="wrap-tight" style={{ textAlign: "center" }}>
            <Reveal>
              <h2 className="display" style={{ fontSize: "var(--display-sm)", maxWidth: "22ch", marginInline: "auto" }}>
                {config.closer}
              </h2>
              <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <a href={DISCOVERY_URL} className="btn btn-primary">
                  Book a call
                </a>
                {/* WAS href="/". See the note in methodology/page.tsx: the home
                    page carries no form, so this promised a lookup and delivered a
                    page without one. */}
                <Link href="/rates" className="btn btn-secondary">
                  Run your own lookup
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
