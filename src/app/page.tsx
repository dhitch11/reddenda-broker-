import type { Metadata, Viewport } from "next";
import { BRAND, Wordmark } from "@/components/marketing/brand";
import { SiteHeader, SiteFooter, DISCOVERY_URL } from "@/components/marketing/chrome";
import { ScrollState } from "@/components/marketing/scroll-state";
import { Reveal } from "@/components/marketing/reveal";
import { GlowEye } from "@/components/landing/glow-eye";
import { ScrubStage, Tilt } from "@/components/landing/hero-motion";
import { PriceField } from "@/components/landing/price-field";
import { HeroAudio } from "@/components/landing/hero-audio";
import { siteOfCare, refusalLedger, scale, type SiteBar } from "@/lib/landing-data";
import { CA_EMPLOYER, commissionsShort } from "@/lib/ca-employer";
import { LADDER, PRO_PER, AGENCY_PER_GROUP } from "@/lib/pricing-ladder";
import { PLAN_SPEND, PHARMACY_GAP } from "@/lib/plan-spend";
import { APP, APP_DEMO, BUY_PRO_MONTHLY, BUY_AGENCY } from "@/lib/buy-links";

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


/* ★ ONE MONEY FORMATTER, AND IT NEVER ROUNDS UP. 2026-08-26.
   There were two. `usd` printed whole dollars, `usdc` printed cents, and the SAME
   figure went through both: the bar rendered $1,119.53 as its visible text and
   $1,120 in its aria-label, so the screen and the screen reader disagreed about a
   federal fee-schedule amount on a page whose brand line is "we print the number".
   Measured on live prod: $417.65 next to $418, $1,119.53 next to $1,120.

   THE DISTINCTION, and it is a distinction and not a house style:
     A MEASURED RATE PRINTS TO THE CENT. It is a measurement we are attributing to
     somebody else, so it carries its cents and it carries all of them.
     OUR OWN SKU PRICES PRINT IN WHOLE DOLLARS. $149 / $1,490 / $4,900 are ours,
     they have no cents, and they resolve from Stripe by lookup_key regardless.
   So `usd` is gone rather than kept for "compact" places: the compact place was an
   accessibility label, which is the one copy of the figure a sighted reviewer never
   checks.

   AND THE ASYMMETRY. Truncated toward zero, never rounded. Rounding $1,119.535 to
   $1,119.54 inflates a price we are attributing to a payer by half a cent, and the
   estate's rule is that a cited figure rounds DOWN or not at all, never up. The
   epsilon absorbs binary float representations of exact cent values, so $417.65
   does not become $417.64. */
const usdc = (v: number) =>
  (Math.floor(v * 100 + 1e-6) / 100).toLocaleString("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

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
    /* ★ THE TICKER WAS UNDOING THE PANEL'S OWN DISCLOSURE.
       Twenty lines further down the panel says, in as many words: "Facility payment:
       national unadjusted. Not wage-index adjusted to a single market." The ticker
       then took the SAME totals and labelled them with the locality name, so a strip
       of chips scrolling past the reader attributed a national figure to
       Sacramento-Roseville-Folsom. The chips travel further than the panel: they are
       above the fold and they are what somebody screenshots.

       A total is only a local number where every component of it is local. The office
       bar is physician-only (`facility` is null by construction) and IS local. ASC and
       hospital outpatient are physician-local plus facility-national, so they get a
       mixed-grain label rather than a locality. It is longer and it is the truth. */
    for (const b of care.bars) {
      if (b.total == null) continue;
      const grain = b.facility != null ? `physician ${where}, facility national unadjusted` : where;
      tape.push({ k: `CPT ${care.cpt}`, v: usdc(b.total), note: `${b.label} · ${grain}${vint ? ` · ${vint}` : ""}` });
    }
    if (care.hopdVsOfficePct != null) {
      // Compares a mixed-grain total against a local one, so it cannot claim the locality.
      tape.push({ k: "HOPD vs office", v: `+${care.hopdVsOfficePct}%`, note: `${care.cpt} · physician ${where}, facility national` });
    }
    if (care.ascSavingVsHopd != null) {
      /* "federal basis" was vague rather than wrong. This difference is ENTIRELY the
         facility component, since the physician fee is identical on both sides and
         cancels, so it is a purely national figure and says so. */
      tape.push({ k: "ASC vs HOPD", v: usdc(care.ascSavingVsHopd), note: `${care.cpt} · per case · facility fees, national unadjusted` });
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
      {/* ★ QA-018. THE SHARED SITE HEADER, not a second hand-rolled one.
          This used to be five in-page anchors, and MEASURED across the whole served
          homepage: `href="/pricing"` ZERO times, `/tools` ZERO, `/rates` ZERO. A
          visitor who typed the domain could not reach the pricing page at all, and
          that is the page carrying the free tier, the denominator, the MEPS-IC
          disclosure, the pharmacy refusal and all four live prices. They never saw a
          wrong price. They never saw the page.
          One header for every page now, so the two cannot drift apart again. The
          jump list lives in the body below, which is where a jump list belongs. */}
      <SiteHeader cta={{ href: APP, label: "Create account" }} />

      {/* ⬆ THE TAPE, MOVED UNDER THE NAV. Measured hero audit, 2026-08-26.
          It was at y=6,760 of a 7,777px page: 87% down, which is to say nobody ever
          saw it. reddenda.health puts the same device at y=99, directly under its
          nav, and it is the first thing that tells a visitor the data is alive. We
          already had the better version of it - a 64s loop of real Sacramento
          prices with their vintages, refusing to render at all when the tables are
          down - and we were hiding it below the pricing section.

          This is a position change and nothing else. Same component, same figures,
          same honest empty state. It is the highest value-per-minute fix on the
          audit's list precisely because there was nothing to build. */}
      {/* THE TAPE. Only rendered when there is something real to put on it. An
          empty ticker, or one padded out to look busy, would be the exact failure
          this page is about. */}
      {tape.length > 0 && (
        <div className="tape" aria-label="Measured figures currently held by this server">
          <div className="tape-track">
            {/* ★ KEYED BY POSITION, NOT BY CPT. The care panel contributes three
                cells that all carry k="CPT 45378", and the ledger contributes the
                same code again, so keying on `t.k` produced duplicate React keys.
                The defect was invisible for as long as the data failed to load:
                the first fetch that succeeded surfaced six console errors. The
                list is rebuilt whole per render, so the index is a stable key. */}
            <div className="tape-half">
              {tape.map((t, i) => (
                <span className="tape-cell" key={i}>
                  <s>{t.k}</s>
                  <b>{t.v}</b>
                  <s>{t.note}</s>
                </span>
              ))}
            </div>
            {/* The seam. Identical content, hidden from assistive tech so the
                figures are announced once rather than stuttered. */}
            <div className="tape-half" aria-hidden="true">
              {tape.map((t, i) => (
                <span className="tape-cell" key={`dup-${i}`}>
                  <s>{t.k}</s>
                  <b>{t.v}</b>
                  <s>{t.note}</s>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* The in-page anchors, kept as a SECONDARY strip. They are genuinely useful on
          a page this long; they were never a substitute for site navigation. */}
      {/* ⛔ THE "ON THIS PAGE" JUMP STRIP IS DELETED, not hidden.
          code-marketing section 3.1 row 2 is explicit and it is the binding budget:
          target 0 words, "Delete. It duplicates the nav and is the first thing a
          phone shows." It also cost the hero 47px of the first screen on every
          viewport, and the first screen is the whole argument on this page. The five
          anchors it carried are all still reachable: the nav covers the two that are
          pages, and the rest are one scroll away on a page that is one scroll. */}

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
        {/* THE PRICE FIELD. Real counties, real Medicare dollars, condensing
            onto the same axis the panel's trio lives on as the shot scrubs.
            After the grid so it paints above it; negative z keeps it under
            every word. See components/landing/price-field.tsx. */}
        <PriceField />

        {/* THE PADDING IS A CLASS, NOT AN INLINE STYLE, AND THAT IS THE WHOLE POINT.
            It was inline. An inline style beats any selector without !important, so
            section 9's `.field-live` padding override shipped, grepped as present,
            and DID NOTHING. Measured: after adding .field-live the computed padding
            was still 104px/96px, the content stayed 944px against an 835px frame,
            and the pin silently refused to arm on every 900px-tall display. The
            rule was correct, the cascade was not, and only reading the COMPUTED
            value found it. */}
        <div className="wrap hero-wrap">
          <div className="hero-split">
            {/* ⛔ THE GAP LIVES IN CSS, NOT HERE. It was an inline `gap: 24`, and an inline
                style beats a stylesheet rule at any specificity, so the armed rule
                `.hero-stage.field-live .hero-copy { gap: 14px }` (globals.css) had shipped and
                done nothing since the pin was built. That silent 40px is most of the reason the
                shot refused to arm at 1366x768. Base and armed values are both in the stylesheet
                now, where the cascade can actually choose between them. */}
            <div className="hero-copy">
              <div className="rise rise-1" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <GlowEye size={40} title={`${BRAND.name} rate intelligence`} />
                <span className="eyebrow">California self-funded employer groups</span>
              </div>

              {/* Two blocks, not one line with a <br>. `text-wrap: balance` cannot
                  balance across a forced break, so at 390px the second sentence
                  wrapped to "Everyone else blurs / it." and left an orphan. As
                  separate blocks each sentence balances on its own. */}
              <h1 className="hero-title rise rise-2">
                <span style={{ display: "block" }}>We print the number.</span>
                <span className="lit" style={{ display: "block" }}>Everyone else blurs it.</span>
              </h1>

              {/* 13 words, down from 31. code-marketing section 3.1 row 3 sets the hero
                  lede at 12 and the copy audit is explicit that the hero is the ONLY
                  homepage change: the rest of this page already reads a full grade
                  easier than the benchmark and cutting it would move us away from the
                  bar, not toward it. The words that left are the ones the line below
                  now says better, with a number attached. */}
              <p className="hero-lede rise rise-3">
                What health plans really pay in California, with the sample size on every number.
              </p>

              {/* ⛔ CALIFORNIA AND EMPLOYER DATA, IN THE HERO. David's ask, 2026-08-26.
                  Before this the word California did not appear above the fold once,
                  while national framing appeared nine times on the page.

                  THE NUMBER IS MEASURED BY THIS LANE FROM THE PRIMARY FILES, not taken
                  from a brief. The figure circulating in the fleet was $947.2M and it
                  did not reproduce; two passes over the DOL's own CSVs give $968.0M.
                  See src/lib/ca-employer.ts for the exact method. It is rendered from
                  that module rather than typed here, so it cannot drift out of step
                  with its own provenance line. */}
              <p className="rise rise-3 hero-ca">
                {/* "of it" had no antecedent: the lede above is about what plans pay
                    PROVIDERS, and this is what employers pay BROKERS. Two different
                    pockets, and the first draft quietly implied one came out of the
                    other. Caught by reading the rendered hero, not the source. */}
                <b>{commissionsShort()}</b> in broker commission is already public too, on{" "}
                {CA_EMPLOYER.brokerRows.toLocaleString()} California filings.
                <span className="hero-ca__src">
                  {CA_EMPLOYER.source}, plan year {CA_EMPLOYER.planYear}. At least that, not
                  exactly that: under 100 people, nobody files.
                </span>
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
                <div className="cta-col cta-col--tertiary">
                  <a href={DISCOVERY_URL} style={{ fontSize: "var(--text-sm)", color: "var(--teal-deep)" }}>
                    or talk to us first
                  </a>
                </div>
                {/* @BROKER-13 2026-08-24, David's order: the conversational-AI example plays FROM the
                    hero. A fourth column, not a new row: the pinned column's height budget is spent
                    to the pixel (see the note below), and width is the dimension with slack. The cue
                    is server-gated on the mp3 and renders nothing if the artifact cannot play. */}
              </div>

              {/* THE PINNED COLUMN IS ON A HEIGHT BUDGET, so the two things that
                  do not have to be inside the shot are not.

                  MEASURED: the pinned frame at 1440x900 is 900 minus a 65px sticky
                  header, so 835, and the copy column was 982. The shot therefore
                  refused to arm on the single most common laptop resolution there
                  is. The trust line moved to its own band directly under the hero,
                  where it still reads within the first screen of scroll, and the
                  tertiary link joined the CTA row where it belonged anyway. That
                  is 147px, which is exactly what the budget was short. */}
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
              {/* LEO, IN THE HERO, BY DAVID'S DIRECT ORDER 2026-08-25 ("the
                  conversational AI example play button on the hero page"). The
                  hero variant compacts to ~56px at >=900px so the pinned column
                  still fits an 835px frame and the scrub keeps arming at
                  1440x900 and 1536x864 (measured before and after; the numbers
                  are in .terminal-claims.md). The right column carries it
                  because it is 68px shorter than the copy column, so the wrap
                  grows ~2px. Same no-dead-button guard as always: no file, no
                  render. */}
              <HeroAudio variant="hero" />
            </div>
          </div>
        </div>
      </section>
      </ScrubStage>

      {/* THE BAND UNDER THE SHOT: Leo, then the trust line.

          LEO IS @BROKER-12's, and it stays. They mounted the player inside the
          pinned hero column and asked me in .terminal-claims.md to keep it and
          ping them if I restructured, so this is that: kept, working, moved one
          band down, and posted to FINDINGS.md.

          WHY IT MOVED, MEASURED: the pinned frame at 1440x900 is 900 minus a 65px
          sticky header, so 835. The player is 107px and it took the hero column to
          915, which put it back over budget and silently disarmed the pin on the
          commonest laptop resolution there is. Below the hero it costs the shot
          nothing and it is still on the first screen after the shot resolves.

          It also reads BETTER here. In the hero it competed with the two CTAs for
          the same click. Here the order is the argument: the claim, the number,
          then "and here is the audio on why". Nobody presses play before they
          have seen the number. */}
      <div className="trust-band">
        <div className="wrap">
          {/* "…when the page loads" became conditionally false once the baked
              second source existed, so the sentence now claims only what is true
              on BOTH paths: the figure came out of a published table and wears
              that table's own date. */}
          <p>
            No PHI, ever. Prices, not quotes and not bills. Nothing on this page is a
            projection: every figure comes out of a published table and carries that
            table&rsquo;s own date.
          </p>
        </div>
      </div>

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
                Most tools hand you a number no matter what. We do not. Here is one basket of
                codes, with the cells we kept and the ones we refused.
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
                      {/* Explicit columns so the table is sized by role, not by
                          whichever refusal sentence happens to be longest. */}
                      <colgroup>
                        <col className="c-code" />
                        <col className="c-svc" />
                        <col className="c-n" />
                        <col className="c-verdict" />
                      </colgroup>
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
                    A cell needs {ledger.minimumSample} filed prices before we report it. Values under
                    five dollars are percent-of-schedule filings, not prices, so we refuse them.
                    {ledger.corpusStamp
                      ? ` Rows written ${ledger.corpusStamp}: that is our date, not a filing date.`
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
              <span className="eyebrow">Three levers a self-funded plan can actually pull, largest first</span>
              <h2 className="sec-title">Fully insured, the price sits inside the premium. Self-funded, the plan pays the price itself, so where care happens shows up in its own spend.</h2>
            </div>
          </Reveal>

          {/* ★ REORDERED 2026-08-26 AGAINST THE MEASUREMENT, and the old order was
              backwards. It led with Site of care, which is the best DEMO and the
              SMALLEST paid lever: the clinically shiftable pool is 4.41% of
              facility-delivered spend, and surgical codes are already 98-100%
              facility, so there is very little left to move. It is not gone, it
              just is not a lever here: the site-of-care panel sits higher up the
              page, which is its correct job.

              What leads instead is the largest measured lever, and it is not the
              one every RFP is about. Inside ONE metro at ONE carrier, moving
              facility volume from the median-priced facility to the 25th
              percentile removes 53.25% of facility spend. Carrier choice, the
              thing the RFP actually decides, is worth 4.94% on the same basket
              once per-code spreads are weighted by utilization; the impressive
              1.32x per-code median is noise that cancels.

              ⛔ NO SAVINGS DOLLAR ON ANY LEVER, deliberately. The capture rate is
              unmeasured, so a dollar here would be an assumption wearing a
              measurement's clothes. Percentages of spend are what was measured and
              they are labelled as a reallocation, not as money we promise. */}
          <div className="g3" style={{ marginTop: 30 }}>
            <Reveal delay={60}>
              <Lever
                title="Which facility, not which room"
                why="Inside one metro, at one carrier, for the same code, facilities are not priced alike."
                money="The spread between facilities is wider than the spread between carriers."
                proof="Anthem's Sacramento book, 55 codes with 100+ filed prices each: the filed prices for the same code at different facilities spread from the median down to the 25th percentile by 53%. Blue Shield's book spreads 59% across 694 codes. That is measured dispersion between facilities. What any plan would capture from it depends on where its volume actually goes, which we do not hold."
              />
            </Reveal>
            <Reveal delay={120}>
              <Lever
                title="Network repricing"
                why="The network your client rents has a price and a shape."
                money="See the spread on one basket, in one market, before you renew."
                proof="Commercial prices from the transparency files, each with its sample size. The carriers' filed medians differ by 4.94% on this basket, weighted by Medicare Part B volumes as a proxy. Real, and smaller than the headline spreads suggest."
              />
            </Reveal>
            <Reveal delay={180}>
              <Lever
                title="Out-of-network exposure"
                why="Federal arbitration decides what your plan pays when there is no contract."
                money="Awards are public. Your exposure is knowable before you renew."
                proof="Arbitration results against the plan's own benchmark price, with the counts and the period on the face of the screen."
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
              {/* ★ REWRITTEN 2026-08-26. The old H2 put "fiduciary" in a page
                  heading, which the buyer lane's hard constraint bans (a heading
                  is a cover), and the lede was a statute recital at grade 12+.
                  The claim is the same; the words are the reader's. */}
              <span className="eyebrow">Why this landed on your desk</span>
              <h2 className="sec-title">The rules changed. The file is the proof.</h2>
              {/* ⛔ KILL LIST (President 17:26Z, legal-honesty §3.1): the four legal-conclusion
                  sentences in this frame. Each one told the reader what the law REQUIRES OF THEM.
                  We are a price dataset. Describing a statute is reporting; telling a plan sponsor
                  what their duty is, is advice, and a plaintiff's lawyer reads a marketing page in
                  exactly that light. Every sentence here now says what the text says and attributes
                  it, and the citation under each card is what a reader checks it against. */}
              <p className="lede" style={{ color: "var(--body)" }}>
                In 2021, Congress added three requirements to the law that governs group health
                plans. Each one turns on a price your client has to be able to show. The statutes
                are below with their citations, so your counsel can read them rather than take
                our word for what they mean.
              </p>
            </div>
          </Reveal>

          <div className="g3" style={{ marginTop: 30 }}>
            <Reveal delay={60}>
              <Legal
                eyebrow="ERISA 408(b)(2)(B)"
                title="The law asks for the fee in writing"
                body="The statute has a covered service provider describe its compensation to the plan fiduciary in writing. It reaches arrangements expected to pay $1,000 a year or more, and it sets the timing as reasonably in advance of the contract being entered into, extended or renewed."
                cite="29 U.S.C. 1108(b)(2)(B), added by Pub. L. 116-260, Div. BB, Title II, sec. 202 (2020); covered-service headings broadened by Pub. L. 119-75, sec. 6702 (Feb. 3, 2026). Applies to contracts entered into on or after 2021-12-27."
              />
            </Reveal>
            <Reveal delay={120}>
              <Legal
                eyebrow="Gag clause attestation"
                title="Gag clauses are barred, and plans attest each year"
                body="The statute bars agreements that would keep a plan from seeing its own cost and quality data, and it calls for an annual attestation. CMS sets the December 31 date on its webform. A vendor can file it; the statute puts the attestation on the plan."
                cite="ERISA 724 (29 U.S.C. 1185m), PHS Act 2799A-9, IRC 9824, added by Pub. L. 116-260 Div. BB Title II sec. 201. Filed on the CMS HIOS webform."
              />
            </Reveal>
            <Reveal delay={180}>
              <Legal
                eyebrow="No Surprises Act"
                title="Arbitration starts from the plan's own benchmark"
                body="Where there is no contract, a federal arbitrator chooses between the two offers, and the regulation makes the plan's own qualifying payment amount one of the factors. A self-funded plan pays an award out of plan assets, because that is what self-funded means."
                cite="45 CFR 149.510(c)(4)(iii), ERISA parallel at 29 CFR 2590.716-8. QPA methodology at 45 CFR 149.140."
              />
            </Reveal>
          </div>

          <Reveal delay={220}>
            <p style={{ marginTop: 26, fontSize: "var(--text-xs)", color: "var(--faint)", maxWidth: "78ch", lineHeight: 1.7 }}>
              Every citation was read from the statute itself, not a summary. This is not legal
              advice. We hold the rate data; your counsel owns the filing.
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
                <span className="eyebrow">Counted, not claimed</span>
                <h2 className="sec-title">What the tables hold.</h2>
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
      {/* ══════════════════════════════════════════════════════════════════════
          THE DENOMINATOR, AND THE GAP WE REFUSE TO FILL.
          Placed immediately BEFORE pricing on purpose. Nothing on this page told a
          reader what our fee is a fraction of, so every visitor supplied their own
          denominator and we never got to choose it. And the pharmacy card sits here
          rather than in the methodology, because a refusal is only worth anything
          where somebody is deciding whether to pay us.
          ⛔ BOTH ARE LABELLED MODELLED ON THEIR FACE. That is not caution, it is what
          makes the number survive a CFO reading it in a forwarded page.
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="sec" id="denominator">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <span className="eyebrow">What this is a fraction of</span>
              <h2 className="sec-title">
                A {PLAN_SPEND.lives} life plan in California spends about ${PLAN_SPEND.annualMillions} million a year.
              </h2>
              <p className="lede" style={{ color: "var(--body)" }}>
                That is <span className="num">{PLAN_SPEND.pepy}</span>{" "}
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "var(--text-xs)",
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(191,138,26,.45)",
                    background: "rgba(191,138,26,.10)",
                    color: "#8a6412",
                    verticalAlign: "middle",
                  }}
                >
                  modelled
                </span>{" "}
                per employee per year, in a range of{" "}
                <span className="num">{PLAN_SPEND.bandLow}</span> to{" "}
                <span className="num">{PLAN_SPEND.bandHigh}</span>. We print
                it because a fee means nothing without the number under it.
              </p>
            </div>
          </Reveal>
          <div className="g2" style={{ marginTop: 24 }}>
            <Reveal delay={60}>
              <div className="card" style={{ padding: 22, display: "grid", gap: 10, height: "100%" }}>
                <h3 className="display" style={{ fontSize: "var(--text-base)", color: "var(--ink)" }}>
                  Where that figure comes from
                </h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.7 }}>
                  <b>{PLAN_SPEND.source}</b> The honest range is{" "}
                  <span className="num">{PLAN_SPEND.bandLow}</span> to{" "}
                  <span className="num">{PLAN_SPEND.bandHigh}</span> per employee per year.{" "}
                  {PLAN_SPEND.corroboration.source} measured{" "}
                  <span className="num">{PLAN_SPEND.corroboration.value}</span> in{" "}
                  {PLAN_SPEND.corroboration.year}, near the top of it.
                </p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.6 }}>
                  Every other dollar on this page is measured. This one is modeled, and we say so.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="card" style={{ padding: 22, display: "grid", gap: 10, height: "100%" }}>
                <h3 className="display" style={{ fontSize: "var(--text-base)", color: "var(--ink)" }}>
                  Pharmacy is about {PHARMACY_GAP.shareOfSpend} of that. We hold none of it.
                </h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.7 }}>
                  It grows about <span className="num">{PHARMACY_GAP.growth}</span> a year. We hold no{" "}
                  {PHARMACY_GAP.pbm} contract, no rebate data and no drug prices, so we will tell you
                  nothing about pharmacy.
                </p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--teal-deep)", lineHeight: 1.6, fontWeight: 500 }}>
                  Anyone selling you a pharmacy figure off transparency in coverage files is selling you an
                  assumption.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="sec" id="pricing">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <span className="eyebrow">Flat fees, published</span>
              <h2 className="sec-title">You can read the price without booking a call.</h2>
              <p className="lede" style={{ color: "var(--body)" }}>
                Every fee is flat. Never a cut of savings. Never per patient.
              </p>
            </div>
          </Reveal>

          <div className="g3" style={{ marginTop: 30 }}>
            <Reveal delay={60}>
              <Price
                name="Broker Pro"
                amount={LADDER.proMonthly.display}
                per={PRO_PER}
                lines={[
                  "Office vs surgery center vs hospital, every published code",
                  "What plans pay, low to high, with the sample size shown",
                  "Out-of-network exposure against the plan's own benchmark",
                  "Client-ready exhibits with the sourcing printed",
                ]}
                /* ★ PRESS THE PRICE, LAND ON THE PLAN. These two cards sent a
                   buyer who pressed a price to the signup door while /pricing
                   already deep-linked the buy page per plan. Same rail now:
                   live Checkout on the app, amount resolved server-side from
                   Stripe by lookup_key, never from this link. */
                cta="Buy Broker Pro"
                href={BUY_PRO_MONTHLY}
                feature
              />
            </Reveal>
            <Reveal delay={120}>
              <Price
                name="Agency"
                amount={LADDER.agencyAnnual.display}
                per="a year, flat, not per seat"
                lines={[
                  "Everything in Broker Pro for the whole agency",
                  "Your agency's name on every exhibit, set server side",
                  "Shared saved markets and baskets",
                  "Onboarding for your producers",
                  `Twenty groups? That is ${AGENCY_PER_GROUP(20)} a group a year. Hiring does not change it`,
                ]}
                cta="Buy for your agency"
                href={BUY_AGENCY}
              />
            </Reveal>
            <Reveal delay={180}>
              <Price
                name="Renewal exhibit"
                amount={LADDER.exhibitOnce.display}
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
              Portfolio setups are scoped on a call. Checkout confirms every amount before
              anything is charged.
            </p>
          </Reveal>
        </div>
      </section>

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

  /* Padding and gap live in CSS (`.hero-proof-card`) for the same reason the copy column's
     gap does: an inline style cannot be overridden by a stylesheet, so the short-frame rules
     in globals.css 8.16b could not touch this card while these were declared here. */
  return (
    <div className="card hero-proof-card">
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

      {/* THE PROVENANCE, COMPACTED 2026-08-26 (M3). The hero column lives on a
          hard height budget: at 1440x900 the pinned frame is 835px, and four
          paragraphs of provenance here disarmed the shot on the commonest
          laptop there is. Every FACT survives: the locality is named, the
          facility basis is named, the duplicate row is disclosed, and the full
          reasoning lives one click away on the methodology page. What left is
          the explanation prose, not the disclosure. */}
      <div style={{ display: "grid", gap: 6, fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.6 }}>
        <div className="num">
          {care.physician.publisher}
          {care.localityCode ? `, locality ${care.localityCode}` : ""}
          {care.localityName ? ` ${titleCase(care.localityName)}` : ""}
          {care.physician.vintage ? ` ${care.physician.vintage}` : ""} · facility national
          {care.facility.vintage ? ` ${care.facility.vintage}` : ""}
        </div>
        {care.duplicateRowNote && (
          /* The row we did not use stays ON the face, in one sentence. */
          <div style={{ color: "var(--spread)" }}>
            The fee table returns two identical rows here. We print the full one and say so.
          </div>
        )}
        <a href="/methodology#limits" style={{ color: "var(--muted)" }}>
          How this number is built &rarr;
        </a>
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
        aria-label={`${bar.label}: ${usdc(bar.total)}`}
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
