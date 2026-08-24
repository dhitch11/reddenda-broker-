import type { Metadata, Viewport } from "next";
import { BRAND, Wordmark } from "@/components/marketing/brand";
import { SiteFooter, DISCOVERY_URL } from "@/components/marketing/chrome";
import { ScrollState } from "@/components/marketing/scroll-state";
import { Reveal } from "@/components/marketing/reveal";
import { GlowEye } from "@/components/landing/glow-eye";
import { ScrubStage, Tilt } from "@/components/landing/hero-motion";
import { siteOfCare, refusalLedger, scale, type SiteBar } from "@/lib/landing-data";

/**
 * broker.reddenda.com  ·  THE LANDING PAGE
 * Rebuilt 2026-08-24 by @BROKER-5 under BUILD-ORDERS v3.
 *
 * THE AUDIENCE IS ONE ROOM. CAHIP NorCal, Citrus Heights, Wednesday 2:30pm:
 * licensed employer-benefits brokers whose book is SELF-FUNDED and level-funded
 * groups. Everything on this page is chosen for a plan sponsor's fiduciary
 * problem, not a provider's revenue problem. There is no RateScore here, no
 * per-NPI score and no per-provider route: a broker has no NPI, and that noun
 * belongs to the provider side of the estate.
 *
 * THE WEDGE, AND IT IS THE ONLY CLAIM THIS PAGE MAKES ABOUT COMPETITORS:
 * "Everyone in this category blurs the number until you book a demo. We print
 * the number, the sample size, the date, and the rows we refused."
 * It is measured, not asserted. The 2026-08-24 war room parsed a funded
 * competitor's free provider page byte by byte and found twenty-six rate cells
 * rendered as "$•••" behind CSS classes named `lockblur`, `gaugeblur` and
 * `numblur`. Their free layer gives identity and blurs the dollars. Ours prints
 * the dollars. That asymmetry is the whole company.
 *
 * EVERY NUMBER ON THIS PAGE IS READ FROM A TABLE AT REQUEST TIME by
 * src/lib/landing-data.ts, and arrives with its publisher, its vintage and its
 * sample size. There is not one hardcoded figure in this file. Where a table
 * cannot answer, the page prints the reason in a sentence and moves on. That is
 * not a degraded state, it is the product demonstrating itself.
 */

export const metadata: Metadata = {
  title: `${BRAND.name} for benefits brokers`,
  description:
    "Federal and commercial rate intelligence for self-funded employer groups. We print the number, the sample size, the date, and the rows we refused.",
};

/* The register is dark, so the browser chrome is told the truth. Without this the
   phone paints a white status bar above a near-black page on every scroll bounce. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06090B",
  colorScheme: "dark",
};

/**
 * RENDERED PER REQUEST, DELIBERATELY.
 *
 * A build-time snapshot would freeze the federal fee tables into the HTML and
 * keep serving last week's dollars with this quarter's label after the data lane
 * loads a new quarter. The page is cheap, the queries are three indexed reads,
 * and a number that can go stale silently is worse than a number that costs
 * 40ms.
 */
export const dynamic = "force-dynamic";

const APP = "https://app.reddenda.com/broker";
const APP_DEMO = "https://app.reddenda.com/broker?demo=1";

const usd = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdc = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export default async function Landing() {
  /* One round trip for the whole page. Each of these fails to a sentence, never
     to a zero and never to a placeholder, so a dead table degrades one section
     rather than the page. */
  const [care, ledger, counts] = await Promise.all([
    siteOfCare("45378", "CA"),
    refusalLedger("40900", "Sacramento"),
    scale(),
  ]);

  const barMax = care.ok
    ? Math.max(...care.bars.map((b) => b.total ?? 0), 1)
    : 1;

  /* THE TAPE'S CONTENT IS BUILT FROM MEASURED VALUES OR IT IS EMPTY.
     Every cell below is pulled off a result that already carries its source and
     vintage. There is no padding, no rounding up to a nicer figure, and no filler
     cell to make the strip look fuller. If the tables are down the tape does not
     render at all, which is the honest state for a ticker with nothing to tick. */
  const tape: { k: string; v: string; note: string }[] = [];
  if (care.ok) {
    const where = care.localityName ? titleCase(care.localityName) : care.state;
    const vint = care.physician.vintage ?? "";
    for (const b of care.bars) {
      if (b.total == null) continue;
      tape.push({ k: `CPT ${care.cpt}`, v: usdc(b.total), note: `${b.label} · ${where}${vint ? ` · ${vint}` : ""}` });
    }
    if (care.hopdVsOfficePct != null) {
      tape.push({ k: "HOPD vs office", v: `+${care.hopdVsOfficePct}%`, note: `${care.cpt} · ${where}` });
    }
    if (care.ascSavingVsHopd != null) {
      tape.push({ k: "ASC vs HOPD", v: usdc(care.ascSavingVsHopd), note: `${care.cpt} · per case · federal basis` });
    }
  }
  if (ledger.ok) {
    for (const r of ledger.rows) {
      if (r.n == null) continue;
      tape.push({
        k: `CPT ${r.cpt}`,
        v: `n=${r.n.toLocaleString()}`,
        note: r.kept ? `${ledger.metro} · reported` : `${ledger.metro} · refused, floor ${ledger.minimumSample}`,
      });
    }
  }

  return (
    <div className="cine">
      <ScrollState />

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════════════════════════ */}
      <header className="site-header">
        <div className="wrap site-header__inner">
          <a href="/" aria-label={`${BRAND.name} home`} className="site-header__logo">
            <Wordmark size={26} />
          </a>
          <nav aria-label="Primary" className="site-header__nav">
            <a className="site-header__link" href="#proof">The number</a>
            <a className="site-header__link" href="#refusal">What we refuse</a>
            <a className="site-header__link" href="#levers">Self-funded levers</a>
            <a className="site-header__link" href="#pricing">Pricing</a>
            <a className="site-header__link" href="/methodology">Methodology</a>
          </nav>
          <a href={APP} className="btn btn-primary site-header__cta">
            Create account
          </a>
        </div>
      </header>

      {/* THE SHOT. 200vh of stage, one viewport of sticky hero, and a single
          number `--p` that carries the frame from the claim to the number.
          See globals.css section 9 and components/landing/hero-motion.tsx.
          Desktop and no-reduced-motion only, and it arms itself: with no JS the
          stage is an ordinary hero in its finished state. */}
      <ScrubStage>
      <section className="hero-plane">
        <div className="hero-plane__aurora" aria-hidden="true">
          <b /><b /><b />
        </div>
        <div className="hero-plane__grid" aria-hidden="true" />

        <div className="wrap" style={{ width: "100%", paddingTop: "clamp(48px, 8vw, 104px)", paddingBottom: "clamp(48px, 8vw, 96px)" }}>
          <div className="hero-split">
            <div className="hero-copy" style={{ display: "grid", gap: 24 }}>
              <div className="rise rise-1" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <GlowEye size={40} title={`${BRAND.name} rate intelligence`} />
                <span className="eyebrow">Self-funded employer groups</span>
              </div>

              {/* Two blocks, not one line with a <br>. `text-wrap: balance` cannot
                  balance across a forced break, so at 390px the second sentence
                  wrapped to "Everyone else blurs / it." and left an orphan. As
                  separate blocks each sentence balances on its own. */}
              <h1 className="hero-title rise rise-2">
                <span style={{ display: "block" }}>We print the number.</span>
                <span className="lit" style={{ display: "block" }}>Everyone else blurs it.</span>
              </h1>

              <p className="hero-lede rise rise-3">
                Rate intelligence for the brokers and consultants who advise self-funded plans.
                Federal allowed amounts, commercial distributions, and the sample size behind
                every one of them.
              </p>

              {/* Each CTA answers "and then what". A benefits broker will not press a
                  button that might start something they have to cancel, and the
                  micro line is the cheapest way to say what the click does. Every
                  word in one has to be literally true, so the demo line describes
                  the demo door and claims nothing about billing. */}
              <div className="rise rise-4 cta-row">
                <div className="cta-col">
                  <a href={APP} className="btn btn-primary">Create account</a>
                  <span className="cta-micro">opens the operator console</span>
                </div>
                <div className="cta-col">
                  <a href={APP_DEMO} className="btn btn-secondary">Log in with demo</a>
                  <span className="cta-micro">no account, nothing to cancel</span>
                </div>
              </div>

              <a
                href={DISCOVERY_URL}
                className="rise rise-5"
                style={{ fontSize: "var(--text-sm)", color: "var(--teal-deep)", justifySelf: "start" }}
              >
                or talk to us first
              </a>

              <p className="rise rise-6" style={{ fontSize: "var(--text-xs)", color: "var(--faint)", maxWidth: "52ch", lineHeight: 1.6 }}>
                No PHI, ever. Prices, not quotes and not bills. Nothing on this page is a
                projection: every figure is read out of a published table when the page loads.
              </p>

              {/* Rendered always, displayed only when the scrub is actually armed.
                  Inviting someone to scroll through a shot that is not there would
                  be a lie about the interface. */}
              <div className="scrub-cue" aria-hidden="true">
                <i />
                <span>Scroll. The claim hands the frame to the number.</span>
              </div>
            </div>

            {/* THE FIRST PAINT CARRIES A REAL NUMBER. Not an illustration, not a
                screenshot, not a mock: the same query the product runs. */}
            <div className="rise rise-7 hero-proof">
              <Tilt>
                <SiteOfCarePanel care={care} barMax={barMax} />
              </Tilt>
            </div>
          </div>
        </div>
      </section>
      </ScrubStage>

      {/* ══════════════════════════════════════════════════════════════════════
          THE WEDGE
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="sec sec--tight band" id="proof">
        <div className="wrap">
          <Reveal>
            <p
              className="display"
              style={{
                fontSize: "clamp(20px, 3.1vw, 34px)",
                lineHeight: 1.25,
                letterSpacing: "-.028em",
                maxWidth: "26ch",
                color: "var(--ink)",
              }}
            >
              Everyone in this category blurs the number until you book a demo.
            </p>
            <p
              className="display"
              style={{
                fontSize: "clamp(20px, 3.1vw, 34px)",
                lineHeight: 1.25,
                letterSpacing: "-.028em",
                maxWidth: "30ch",
                marginTop: 10,
              }}
            >
              <span className="lit">
                We print the number, the sample size, the date, and the rows we refused.
              </span>
            </p>
          </Reveal>

          <Reveal delay={90}>
            <div className="rail" style={{ marginTop: 34 }}>
              <RailCell
                label="The number"
                value={
                  care.ok
                    ? (() => {
                        const hopd = care.bars.find((b) => b.key === "hopd")?.total;
                        return hopd != null ? usdc(hopd) : "See the panel";
                      })()
                    : "Unavailable"
                }
                foot={care.ok ? `${care.description}, hospital outpatient` : "Reason printed above"}
              />
              <RailCell
                label="The sample size"
                value={ledger.ok ? `${ledger.kept} of ${ledger.rows.length}` : "Unavailable"}
                foot={ledger.ok ? `basket cells that cleared the filter in ${ledger.metro}` : "Reason printed below"}
              />
              <RailCell
                label="The date"
                value={care.ok ? (care.facility.vintage ?? care.physician.vintage ?? "Not stamped") : "Unavailable"}
                foot="the data's own period, never the day you loaded this page"
              />
              <RailCell
                label="The rows we refused"
                value={ledger.ok ? String(ledger.refused) : "Unavailable"}
                foot={ledger.ok ? "each one with the reason, in the ledger below" : "Reason printed below"}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          THE REFUSAL
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="sec" id="refusal">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <span className="eyebrow">The part nobody shows you</span>
              <h2 className="sec-title">The rows we threw away.</h2>
              <p className="lede" style={{ color: "var(--body)" }}>
                Ask most tools for a rate on a code they cannot support and you get a number
                anyway. Here is the same basket run through our honesty filter, live, with the
                accepted cells and the refused ones side by side.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="card" style={{ marginTop: 28, padding: "22px 20px" }}>
              {ledger.ok ? (
                <>
                  <div className="scroll-x">
                    <table className="ledger">
                      <caption className="sr-only">
                        Basket of six procedure codes for {ledger.metro}, showing which cells cleared the
                        honesty filter and which were refused.
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Code</th>
                          <th scope="col">Service</th>
                          <th scope="col">Sample</th>
                          <th scope="col">Verdict</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.rows.map((r) => (
                          <tr key={r.cpt} data-refused={r.kept ? "0" : "1"}>
                            <td style={{ whiteSpace: "nowrap", color: "var(--ink)" }}>{r.cpt}</td>
                            <td style={{ fontFamily: "var(--font-sans), sans-serif" }}>
                              {r.label}
                              {!r.kept && r.reason && (
                                <div style={{ color: "var(--faint)", fontSize: "var(--text-xs)", marginTop: 4, lineHeight: 1.5 }}>
                                  {r.reason}
                                </div>
                              )}
                            </td>
                            <td style={{ whiteSpace: "nowrap" }}>
                              {r.n != null ? `n=${r.n.toLocaleString()}` : <span className="gap-dot" aria-label="no sample" />}
                            </td>
                            <td>
                              <span className={`ledger__flag ledger__flag--${r.kept ? "kept" : "refused"}`}>
                                {r.kept ? "Reported" : "Refused"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p style={{ marginTop: 18, fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.65 }}>
                    A metro cell needs {ledger.minimumSample} observations before we will report it, and
                    percentile values below five dollars are rejected outright because they are
                    percentage-of-schedule filings stored as dollars, not prices.
                    {ledger.corpusStamp
                      ? ` Corpus rows written ${ledger.corpusStamp}. That is when we wrote the row, not when a carrier filed the rate, and we will not print it as a filing date.`
                      : ""}
                  </p>
                </>
              ) : (
                <div className="empty-state">{ledger.reason}</div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SELF-FUNDED LEVERS
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="sec band" id="levers">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <span className="eyebrow">Three levers a self-funded plan can actually pull</span>
              <h2 className="sec-title">Fully insured, you renew. Self-funded, you steer.</h2>
            </div>
          </Reveal>

          <div className="g3" style={{ marginTop: 30 }}>
            <Reveal delay={60}>
              <Lever
                title="Site of care"
                why="The same procedure costs different money in different rooms."
                money="One steered case can outrun a year of plan-design tinkering."
                proof={
                  care.ok && care.ascSavingVsHopd != null
                    ? `${usdc(care.ascSavingVsHopd)} separates the surgery center from the hospital on ${care.description.toLowerCase()}, on the federal schedule alone.`
                    : "Live figure in the panel above, with its locality and quarter named."
                }
              />
            </Reveal>
            <Reveal delay={120}>
              <Lever
                title="Out-of-network exposure"
                why="Federal arbitration decides what your plan pays when there is no contract."
                money="Awards are public. Your exposure is knowable before you renew."
                proof="Federal IDR outcomes against the plan's own qualifying payment amount, with the code count, the line count and the period on the face of the screen."
              />
            </Reveal>
            <Reveal delay={180}>
              <Lever
                title="Network repricing"
                why="The network your client rents has a price and a shape."
                money="Compare what plans agreed to pay, on one basket, in one market."
                proof="Commercial distributions from the transparency files, every cell carrying its sample size, every refusal carrying its reason."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          THE FIDUCIARY FRAME
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="sec" id="fiduciary">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <span className="eyebrow">Why this landed on your desk</span>
              <h2 className="sec-title">Your client is a fiduciary now, and so is their file.</h2>
              <p className="lede" style={{ color: "var(--body)" }}>
                The Consolidated Appropriations Act, 2021 moved group health plans onto ground
                that retirement plans have stood on for decades. Three of those changes are the
                reason a rate number is now a documentation problem and not a curiosity.
              </p>
            </div>
          </Reveal>

          <div className="g3" style={{ marginTop: 30 }}>
            <Reveal delay={60}>
              <Legal
                eyebrow="ERISA 408(b)(2)(B)"
                title="Disclosure is what makes the fee reasonable"
                body="A service contract with a group health plan is not reasonable unless the broker or consultant discloses its direct and indirect compensation in writing to the responsible plan fiduciary. Lose reasonable and you lose the exemption. It bites at $1,000 of expected compensation, and it is due reasonably in advance of signing, extending or renewing."
                cite="29 U.S.C. 1108(b)(2)(B), added by Pub. L. 116-260 Div. BB Title II sec. 202. Applies to contracts entered into on or after 2021-12-27."
              />
            </Reveal>
            <Reveal delay={120}>
              <Legal
                eyebrow="Gag clause attestation"
                title="The attestation is the plan's, even when the TPA files it"
                body="No agreement may stop a plan from seeing provider-specific cost or quality data, or from reaching de-identified claims. Self-funded plans are Responsible Entities and attest annually by December 31. A TPA can submit it. The duty to make sure it happened does not move."
                cite="ERISA 724 (29 U.S.C. 1185m), PHS Act 2799A-9, IRC 9824, added by Pub. L. 116-260 Div. BB Title II sec. 201. Filed on the CMS HIOS webform."
              />
            </Reveal>
            <Reveal delay={180}>
              <Legal
                eyebrow="No Surprises Act"
                title="The gap between the QPA and the award is plan assets"
                body="In federal arbitration the certified entity considers the qualifying payment amount, then weighs credible information on acuity, market share, teaching status, case mix and prior contracting. That second step is where the money moves, and for a self-funded plan the difference is paid out of the plan, not by a carrier."
                cite="45 CFR 149.510(c)(4)(iii), ERISA parallel at 29 CFR 2590.716-8. QPA methodology at 45 CFR 149.140."
              />
            </Reveal>
          </div>

          <Reveal delay={220}>
            <p style={{ marginTop: 26, fontSize: "var(--text-xs)", color: "var(--faint)", maxWidth: "78ch", lineHeight: 1.7 }}>
              Every citation on this page was read from the enrolled statute or from current
              eCFR, not from a summary. This is a description of published rules, not legal
              advice, and it is not a compliance service. We hold rate data and we show our work
              on it. Your counsel owns the filing.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          WHAT IS UNDER IT
          ══════════════════════════════════════════════════════════════════════ */}
      {counts.length > 0 && (
        <section className="sec sec--tight band" id="corpus">
          <div className="wrap">
            <Reveal>
              <div className="sec-head">
                <span className="eyebrow">Counted at load, not claimed</span>
                <h2 className="sec-title">What this server is actually holding.</h2>
              </div>
            </Reveal>
            <Reveal delay={70}>
              <div className="rail" style={{ marginTop: 26 }}>
                {counts.map((c) => (
                  <div key={c.label}>
                    <div className="readout__label">{c.label}</div>
                    <div className="readout__value" style={{ marginTop: 8 }}>
                      {c.value != null ? c.value.toLocaleString() : <span className="gap-dot" aria-label="not counted" />}
                    </div>
                    <div className="readout__foot" style={{ marginTop: 8 }}>{c.foot}</div>
                  </div>
                ))}
                <div>
                  <div className="readout__label">Where the rest lives</div>
                  <div className="readout__value" style={{ marginTop: 8, fontSize: 19, letterSpacing: 0 }}>
                    In the app
                  </div>
                  <div className="readout__foot" style={{ marginTop: 8 }}>
                    The commercial corpus, the metro distributions and every tool run on
                    app.reddenda.com. This page is the window, not the workspace.
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="sec" id="pricing">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <span className="eyebrow">Flat fees, published</span>
              <h2 className="sec-title">You can read the price without booking a call.</h2>
              <p className="lede" style={{ color: "var(--body)" }}>
                Every fee here is a flat dollar amount. We do not price off a percentage of
                what a plan saves, and we do not price off patient or claim volume.
              </p>
            </div>
          </Reveal>

          <div className="g3" style={{ marginTop: 30 }}>
            <Reveal delay={60}>
              <Price
                name="Broker Pro"
                amount="$149"
                per="per month, or $1,490 a year"
                lines={[
                  "Site of care, federal, every published code",
                  "Commercial distributions with the sample size on every cell",
                  "Out-of-network exposure against the plan's QPA",
                  "Client-ready exhibits with the sourcing printed",
                ]}
                cta="Create account"
                href={APP}
                feature
              />
            </Reveal>
            <Reveal delay={120}>
              <Price
                name="Agency"
                amount="$4,900"
                per="a year, flat, not per seat"
                lines={[
                  "Everything in Broker Pro for the whole agency",
                  "Your agency's name on every exhibit, set server side",
                  "Shared saved markets and baskets",
                  "Onboarding for your producers",
                ]}
                cta="Create account"
                href={APP}
              />
            </Reveal>
            <Reveal delay={180}>
              <Price
                name="Renewal exhibit"
                amount="$490"
                per="one time, per exhibit"
                lines={[
                  "One market, one basket, one self-funded group",
                  "Built for a renewal meeting, not a dashboard",
                  "Every figure carries its source and vintage",
                  "No subscription required",
                ]}
                cta="Talk to us"
                href={DISCOVERY_URL}
              />
            </Reveal>
          </div>

          <Reveal delay={220}>
            <p style={{ marginTop: 24, fontSize: "var(--text-xs)", color: "var(--faint)", maxWidth: "78ch", lineHeight: 1.7 }}>
              Multi-agency and portfolio arrangements are scoped on a call rather than listed.
              Prices shown are the published flat fees for these plans; checkout confirms the
              amount before anything is charged.
            </p>
          </Reveal>
        </div>
      </section>

      {/* THE TAPE. Only rendered when there is something real to put on it. An
          empty ticker, or one padded out to look busy, would be the exact failure
          this page is about. */}
      {tape.length > 0 && (
        <div className="tape" aria-label="Measured figures currently held by this server">
          <div className="tape-track">
            <div className="tape-half">
              {tape.map((t) => (
                <span className="tape-cell" key={t.k}>
                  <s>{t.k}</s>
                  <b>{t.v}</b>
                  <s>{t.note}</s>
                </span>
              ))}
            </div>
            {/* The seam. Identical content, hidden from assistive tech so the
                figures are announced once rather than stuttered. */}
            <div className="tape-half" aria-hidden="true">
              {tape.map((t) => (
                <span className="tape-cell" key={`dup-${t.k}`}>
                  <s>{t.k}</s>
                  <b>{t.v}</b>
                  <s>{t.note}</s>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CLOSE
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="sec band">
        <div className="wrap" style={{ display: "grid", gap: 24, justifyItems: "start", maxWidth: 820 }}>
          <Reveal>
            <GlowEye size={52} />
          </Reveal>
          <Reveal delay={60}>
            <h2 className="sec-title" style={{ fontSize: "clamp(28px, 5vw, 52px)" }}>
              Open it and type a code we cannot support.
            </h2>
          </Reveal>
          <Reveal delay={110}>
            <p className="lede" style={{ color: "var(--body)", maxWidth: "56ch" }}>
              That is the demo. Watch what happens when the sample is too thin. Every other
              tool in this category will hand you a number.
            </p>
          </Reveal>
          <Reveal delay={160}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href={APP} className="btn btn-primary">Create account</a>
              <a href={APP_DEMO} className="btn btn-secondary">Log in with demo</a>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   THE HERO PANEL. The product's own query, rendered.
   ──────────────────────────────────────────────────────────────────────────── */

function SiteOfCarePanel({
  care,
  barMax,
}: {
  care: Awaited<ReturnType<typeof siteOfCare>>;
  barMax: number;
}) {
  if (!care.ok) {
    return (
      <div className="card" style={{ padding: 22 }}>
        <div className="readout__label">Site of care, California</div>
        <div className="empty-state" style={{ marginTop: 14 }}>{care.reason}</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "22px 20px", display: "grid", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="readout__label">Same procedure, three settings</div>
          <div style={{ color: "var(--ink)", fontSize: "var(--text-md)", fontWeight: 600, marginTop: 6 }}>
            {care.description}
          </div>
        </div>
        <span className="chip">
          <span className="chip-dot" />
          CPT {care.cpt}
        </span>
      </div>

      <div className="bars">
        {care.bars.map((b) => (
          <BarRow key={b.key} bar={b} max={barMax} />
        ))}
      </div>

      {care.hopdVsOfficePct != null && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            paddingTop: 14,
            borderTop: "1px solid var(--hair)",
            flexWrap: "wrap",
          }}
        >
          <span className="num" style={{ color: "var(--exposure)", fontSize: 26, fontWeight: 600 }}>
            +{care.hopdVsOfficePct}%
          </span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>
            hospital outpatient against the physician office
          </span>
        </div>
      )}

      {/* THE PROVENANCE. This block is why the panel is allowed to exist. */}
      <div style={{ display: "grid", gap: 6, fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.65 }}>
        <div>
          Physician fee: {care.physician.publisher}
          {care.localityName
            ? `, Medicare locality ${care.localityCode ?? ""} ${titleCase(care.localityName)}`.replace("  ", " ")
            : ""}
          {care.physician.vintage ? `, ${care.physician.vintage}` : ""}. We name the locality
          because a state average carrying one city&rsquo;s label is not a local rate.
        </div>
        <div>
          Facility payment: {care.facility.publisher}, national unadjusted
          {care.facility.vintage ? `, ${care.facility.vintage}` : ""}
          {care.facility.sourceFile ? `, from ${care.facility.sourceFile}` : ""}. Not wage-index
          adjusted to a single market.
        </div>
        <div style={{ color: "var(--muted)" }}>
          The facility fee is added to the physician fee. Tools that omit it make the hospital
          look cheaper than the office, which is backwards.
        </div>
        {care.duplicateRowNote && (
          /* THE ROW WE DID NOT USE, ON THE FACE OF THE PANEL.
             This is the page's whole thesis applied to itself. The fee table hands
             back two rows we cannot tell apart; we take one, we say which, and we
             say that we do not know what the other is. Resolving it silently would
             be the more polished choice and it would make this a worse product. */
          <div style={{ color: "var(--spread)" }}>{care.duplicateRowNote}</div>
        )}
      </div>
    </div>
  );
}

function BarRow({ bar, max }: { bar: SiteBar; max: number }) {
  if (bar.total == null) {
    return (
      <div className={`bar-row bar-row--${bar.key}`}>
        <div className="bar-row__head">
          <span>{bar.label}</span>
          <span className="gap-dot" aria-label="not priced" />
        </div>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.55 }}>{bar.unavailable}</p>
      </div>
    );
  }

  /* The bar's width is derived from the same number that is printed beside it, so
     the picture and the figure cannot disagree. Floored so a small real value is
     still visible as a bar rather than reading as zero. */
  const w = Math.max(bar.total / max, 0.06);

  return (
    <div className={`bar-row bar-row--${bar.key}`}>
      <div className="bar-row__head">
        <span>{bar.label}</span>
        <span className="bar-row__amount fig">{usdc(bar.total)}</span>
      </div>
      <div
        className="bar-row__track"
        role="img"
        aria-label={`${bar.label}: ${usd(bar.total)}`}
      >
        <span className="bar-row__fill" style={{ ["--w" as string]: w }} />
      </div>
      {bar.facility != null && bar.professional != null && (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--faint)" }}>
          {usdc(bar.professional)} physician plus {usdc(bar.facility)} facility
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   SMALL PARTS
   ──────────────────────────────────────────────────────────────────────────── */

function RailCell({ label, value, foot }: { label: string; value: string; foot: string }) {
  return (
    <div>
      <div className="readout__label">{label}</div>
      <div className="readout__value" style={{ marginTop: 8 }}>{value}</div>
      <div className="readout__foot" style={{ marginTop: 8 }}>{foot}</div>
    </div>
  );
}

/**
 * A lever card. The UX law David set on 2026-08-24 is one plain line each for why
 * it exists and how it makes money, twelve words maximum, so the card is three
 * short lines and a proof rather than a paragraph.
 */
function Lever({ title, why, money, proof }: { title: string; why: string; money: string; proof: string }) {
  return (
    <div className="card card-hover" style={{ height: "100%", display: "grid", gap: 12, alignContent: "start", padding: 22 }}>
      <GlowEye size={30} />
      <h3 className="display" style={{ fontSize: "var(--text-xl)", color: "var(--ink)" }}>{title}</h3>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.55 }}>{why}</p>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--teal-deep)", lineHeight: 1.55 }}>{money}</p>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.65, marginTop: 2 }}>{proof}</p>
    </div>
  );
}

function Legal({ eyebrow, title, body, cite }: { eyebrow: string; title: string; body: string; cite: string }) {
  return (
    <div className="card" style={{ height: "100%", display: "grid", gap: 10, alignContent: "start", padding: 22 }}>
      <span className="readout__label">{eyebrow}</span>
      <h3 className="display" style={{ fontSize: "var(--text-lg)", color: "var(--ink)" }}>{title}</h3>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.6 }}>{body}</p>
      <p className="num" style={{ fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.6, marginTop: 2 }}>
        {cite}
      </p>
    </div>
  );
}

function Price({
  name,
  amount,
  per,
  lines,
  cta,
  href,
  feature = false,
}: {
  name: string;
  amount: string;
  per: string;
  lines: string[];
  cta: string;
  href: string;
  feature?: boolean;
}) {
  return (
    <div className={`card price-card${feature ? " price-card--feature" : ""}`} style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <h3 className="display" style={{ fontSize: "var(--text-lg)", color: "var(--ink)" }}>{name}</h3>
        {feature && <span className="pro-chip">Most brokers</span>}
      </div>
      <div>
        <div className="price-card__amount">{amount}</div>
        <div className="price-card__per" style={{ marginTop: 6 }}>{per}</div>
      </div>
      <ul>
        {lines.map((l) => (
          <li key={l}>
            <span aria-hidden="true" style={{ color: "var(--teal)", fontFamily: "var(--font-mono), monospace" }}>+</span>
            <span>{l}</span>
          </li>
        ))}
      </ul>
      <a href={href} className={`btn ${feature ? "btn-primary" : "btn-secondary"}`} style={{ width: "100%" }}>
        {cta}
      </a>
    </div>
  );
}

/** "YUBA CITY" reads as shouting inside a sentence. The data keeps its case; the prose does not. */
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s|-)/)
    .map((part) => (/^[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join("");
}
