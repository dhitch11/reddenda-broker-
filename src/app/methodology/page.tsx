import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter, DISCOVERY_URL } from "@/components/marketing/chrome";
import { Reveal } from "@/components/marketing/reveal";
import { freshness } from "@/lib/rates";
import { isConfigured } from "@/lib/db";
import { SERVICES } from "@/lib/catalog";
import { METROS } from "@/lib/metros";
import { DOLLAR_FLOOR, N_MINIMUM, N_CONFIDENT, MAX_SPREAD_RATIO } from "@/lib/honesty";
import { MEASURED_COVERAGE } from "@/lib/coverage-measured";
import { SCALE } from "@/lib/national";

/**
 * METHODOLOGY.
 *
 * With this audience a rigorous methodology page converts better than a features
 * page, so it is a first-class surface and it is linked from the primary nav.
 *
 * Two rules govern every sentence here:
 *   1. Every threshold quoted on this page is IMPORTED from the code that enforces
 *      it. Nothing is typed in as prose. If the tools lane changes the dollar floor
 *      or the sample minimum, this page changes with it and cannot drift into a
 *      documented lie.
 *   2. The limits section is not a disclaimer at the bottom. It is the middle of
 *      the page, because the fastest way to earn a licensed professional's trust is
 *      to tell them what you cannot do before they find out themselves.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "Where the numbers come from, what we filter out of the federal filings and why, and exactly what this dataset cannot tell you.",
};

export default async function Methodology() {
  const meta = isConfigured() ? await freshness() : { builtAt: null, label: null };
  const built = meta.builtAt ? new Date(meta.builtAt) : null;
  const builtLabel =
    built && !Number.isNaN(built.getTime())
      ? built.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : null;

  return (
    <>
      <SiteHeader />

      <main>
        <section style={{ paddingTop: "clamp(38px, 6vw, 66px)", paddingBottom: 8 }}>
          <div className="wrap-tight">
            <p className="eyebrow rise">Methodology</p>
            <h1 className="display rise rise-1" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "19ch" }}>
              How we get to a number, and when we refuse to.
            </h1>
            <p className="lede rise rise-2" style={{ marginTop: 16, maxWidth: "62ch" }}>
              This page is longer than a marketing page should be. That is deliberate. You are going to put
              our figures in front of your own client, and you should be able to defend where each one came
              from before you do.
            </p>
          </div>
        </section>

        <div className="wrap-tight" style={{ paddingBottom: 40 }}>
          {/* ---------------- SOURCE ---------------- */}
          <Section id="sources" eyebrow="The source" title="Federal transparency filings, nothing else">
            <P>
              The Transparency in Coverage rule, 45 CFR 147.212, requires health plans and issuers to publish
              machine-readable files listing the negotiated rate they hold with every in-network provider for
              every covered item and service. Files are republished monthly. They are public, and no login,
              contract or vendor relationship is required to read them.
            </P>
            <P>
              That is the entire basis of this product. We hold no claims, no enrollment, no utilization and
              no member information of any kind. We report what plans have contracted to pay. We do not know,
              and never claim to know, how often anyone actually used a service.
            </P>
            <Callout tone="live" title="What a figure on this site means">
              A distribution of negotiated rates for one procedure code, in one market, across the plans that
              filed rates in that market. It is a measurement of contracted prices. It is not a quote, not a
              prediction of your renewal, and not a guarantee of what anyone will pay.
            </Callout>
          </Section>

          {/* ---------------- WHY IT IS HARD ---------------- */}
          <Section
            id="filters"
            eyebrow="The hard part"
            title="Four ways a naive reading of these files produces a confident, wrong number"
          >
            <P>
              Publishing the files was the easy part of the rule. Reading them correctly is the product. Each
              of the following is a real failure mode that a straightforward percentile over the raw data
              walks directly into.
            </P>

            <Numbered
              items={[
                {
                  h: "A percentage is not a dollar",
                  b: `Rates carry a negotiated_type. Most are dollar amounts, but some are filed as a percentage of another basis, where 0.95 means ninety-five percent, not ninety-five cents. Pooled into a dollar column those rows drag the bottom of the distribution to nonsense. We measured this in the upstream corpus and it is the single largest contamination class we have found. Any cell whose lower quartile or median falls below $${DOLLAR_FLOOR} is refused outright rather than published.`,
                },
                {
                  h: "A rate belongs to a contracting entity, not to a doctor",
                  b: "Rates attach to the entity that signed the contract, which is often a group, a system or a TIN rather than an individual provider. Treating a filed rate as a specific physician's rate misstates who agreed to what.",
                },
                {
                  h: "One carrier brand is many separate plans",
                  b: "A national brand is a family of separately contracting entities, and they do not pay the same. Two files under one logo are two relationships, not one, and averaging them together invents a rate that nobody actually pays.",
                },
                {
                  h: "An out-of-state plan's file contains in-state providers",
                  b: "When a member of one Blues plan is treated in another state, the host plan's arrangement can appear in filings for a market that plan does not sell in. Attributing those rows to the local market makes a national default schedule look like a local negotiation. We resolve every payer to a home market and exclude out-of-market host filings from a market's comparison, which is why some markets legitimately return nothing.",
                },
              ]}
            />
          </Section>

          {/* ---------------- THE FILTER ---------------- */}
          <Section id="filter" eyebrow="The gate" title="Every cell passes the same test before it renders">
            <P>
              One function decides whether a measured cell is fit to show a human being, and nothing reaches a
              screen without going through it. These are the actual thresholds, imported from the code that
              enforces them rather than typed into this page.
            </P>

            <Table
              head={["Test", "Threshold", "What it catches"]}
              rows={[
                ["Dollar floor", `p25 and median at or above $${DOLLAR_FLOOR}`, "Percentage rows read as dollar amounts"],
                ["Ordering", "p25 ≤ median ≤ p75", "A distribution that did not resolve coherently"],
                ["Spread ceiling", `p75 ÷ p25 at or below ${MAX_SPREAD_RATIO}x`, "Filings too dispersed to describe as one market"],
                ["Sample floor", `${N_MINIMUM.toLocaleString()} filings minimum`, "A market too thin to characterise"],
                ["Confidence", `${N_CONFIDENT.toLocaleString()} filings for an unqualified figure`, "Reported below that, and labelled as limited"],
              ]}
            />

            <Callout tone="spread" title="When a cell fails, you get a sentence, not a blank">
              A refused cell renders the reason in plain language. There is no placeholder, no zero, no
              specialty average and no estimate standing in for a measurement. An empty result on this site is
              the product working correctly, and it is the behavior we would want if we were the ones
              repeating the number.
            </Callout>
          </Section>

          {/* ---------------- GHOST RATES ---------------- */}
          <Section
            id="ghost-rates"
            eyebrow="The biggest problem in this data"
            title="Most published rates are for services the provider would never perform"
          >
            <P>
              This is the largest known defect in the Transparency in Coverage files and we would rather you
              heard it from us. Payers publish a rate for a provider and a billing code even where that
              provider would never furnish that service. The federal government&apos;s own example, in the
              December 2025 proposed rule, is rates for podiatrists to perform heart surgery. These are
              called ghost rates.
            </P>
            <P>
              A peer-reviewed study of 61 insurers found that 91.8% of all published negotiated rates were
              ghost rates, with the median insurer&apos;s file at 84.3%. Restricted to the hundred most common
              billing codes the share fell, but only to 70.3%. Estimates across the field range from roughly
              60% to 96.5%, and there is no agreed definition of what counts, so anyone quoting a single
              figure as settled is overstating what is known.
            </P>
            <Callout tone="spread" title="What this means for a figure on this site, stated plainly">
              A ghost rate is an irrelevant row rather than a wrong number, so its effect is on the shape of
              a distribution and on the filing count beside it, not on whether a given rate is real. It
              matters most in the tails: a rate filed under a facility that would never perform the
              procedure can sit at the top of a distribution and look like the expensive end of the market.
              <strong> We do not currently apply a ghost-rate filter.</strong> The peer-reviewed method for
              building one links rates to providers with billed claims for the procedure, and we hold no
              claims data, so that method is closed to us. We are evaluating a specialty-to-code plausibility
              test, which is a weaker proxy, and we will say so on this page when it is in force. Until then,
              read the filing count as a measure of how much was filed, not of how much care was delivered.
            </Callout>
            <P>
              The Departments have proposed requiring payers to strip these combinations from the files.
              That rule is proposed and not final, so nothing about it is in effect and we do not treat it as
              a fix that has already happened.
            </P>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.7, maxWidth: "68ch" }}>
              Sources: Muhlestein DB, &ldquo;High prevalence of ghost rates in transparency in coverage
              data,&rdquo; Health Affairs Scholar 3(11):qxaf212, 2025. Congressional Research Service report
              R48570, &ldquo;Technical Challenges with Private Health Insurance Price Transparency
              Data,&rdquo; June 13, 2025. Transparency in Coverage proposed rule CMS-9882-P, 90 FR 60432,
              December 23, 2025.
            </p>
          </Section>

          {/* ---------------- GEOGRAPHY ---------------- */}
          <Section id="geography" eyebrow="Geography" title="Metro first, and we always tell you which one you got">
            <P>
              A state average hides the market you actually sell in. Prices inside one state vary more than
              prices between states, so we report at the metropolitan statistical area level wherever the
              filings support it. When a metro cell does not pass the gate we fall back to the state, and the
              result says so, naming the metro it fell back from. A broker in Fresno is never shown a
              California number labelled as theirs.
            </P>
            <P>
              One limit you should know about how a rate becomes a market. The transparency files carry no
              provider address. They identify providers by NPI and tax identifier, so metro assignment is
              derived by joining those identifiers to the national provider registry, and that registry can
              lag a provider&apos;s actual practice location. The Congressional Research Service flags this
              directly. It means metro assignment is a well-founded inference rather than something stated in
              the source file, and a provider who has moved may be counted in the market they left.
            </P>
          </Section>

          {/* ---------------- LIMITS ---------------- */}
          <Section id="limits" eyebrow="The limits" title="What this dataset cannot tell you">
            <P>
              This is the section we would want to read first, so it is not at the bottom in small type.
            </P>

            <Numbered
              items={[
                {
                  h: "We have no claims and no utilization",
                  b: "We know what a service costs under contract. We do not know how often your population uses it. Price without utilization cannot produce a plan spend forecast, and we will not pretend otherwise.",
                },
                {
                  h: "We cannot give you a total cost by site of service",
                  b: "Medicare publishes a physician fee for an office setting and a lower physician fee for a facility setting. The lower figure is not the cost of care in a hospital: when a service is performed in a hospital outpatient department the facility bills its own payment separately, and that facility payment is not in this dataset. Anyone showing you those two Medicare figures side by side as a site of service saving is showing you something backwards. We publish the comparison only with that caveat attached, and we will not publish a total until we hold the facility side.",
                },
                {
                  h: "Filed does not always mean used",
                  b: "Files can contain rates for services a provider does not perform, and rosters that do not perfectly reflect who is actually contracted. Volume of filings is a measure of how much was filed, not how much care was delivered. We publish the filing count beside every figure so you can judge it yourself.",
                },
                {
                  h: "The corpus has a build date, not a live feed",
                  b: builtLabel
                    ? `Figures are computed from a corpus built ${builtLabel}. Plans republish monthly, so a rate negotiated after that date is not in what you are seeing. The date is printed under every number on this site.`
                    : "Figures are computed from a dated corpus build, and that date is printed under every number on this site. Plans republish monthly, so a rate negotiated after the build date is not reflected.",
                },
                {
                  h: "We hold no protected health information",
                  b: "There is no PHI in this product, there is no path by which member data could enter it, and there never will be. This is price data about contracts between plans and providers.",
                },
              ]}
            />
          </Section>

          {/* ---------------- COVERAGE ---------------- */}
          <Section id="coverage" eyebrow="Coverage" title="What is in the picker today">
            <P>
              {SERVICES.length} services chosen because a commercially insured working-age population actually
              uses them and because the price dispersion is wide enough to matter to a plan decision. The
              picker currently offers the {METROS.length} largest metropolitan statistical areas, which is
              what you can look up today. The underlying corpus computes distributions across a far larger
              set of metros, and we open them as we verify each one rather than listing a headline number you
              cannot actually query. A market outside the picker resolves to its state and the result says so.
              Coverage is deeper in dense markets and thinner in small ones, which is a property of how much
              was filed there, and the filing count on every figure tells you which you are looking at.
            </P>
            {meta.label && (
              <p style={{ marginTop: 14, fontSize: "var(--text-sm)", color: "var(--muted)" }}>
                Current corpus: <span className="num">{meta.label}</span>
              </p>
            )}

            {/* ★ FOUR NUMBERS, ONE QUESTION, AND UNTIL NOW NO PAGE SAID WHICH WAS WHICH.
                Reconciled 2026-08-26 after an audit found /tools claiming 918 metros,
                /rates claiming 928, and the tooling able to answer for neither figure
                exactly. None of them was invented. They count DIFFERENT THINGS, and
                the honest move is to say so on the page rather than pick the flattering
                one. "Indexed" and "answers locally" are both true and the gap between
                them is the product: a corpus that refuses when it cannot defend a cell.
                Every row is computed. The two measured rows carry the date they were
                measured, because what survives a filter is true on a day. */}
            <div style={{ marginTop: 26, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)", minWidth: 460 }}>
                <caption style={{ captionSide: "top", textAlign: "left", paddingBottom: 10, color: "var(--muted)", lineHeight: 1.6 }}>
                  What each number counts. They are different questions, so they have
                  different answers.
                </caption>
                <thead>
                  <tr>
                    {["Count", "What it counts", "Where it shows"].map((h) => (
                      <th key={h} style={{
                        textAlign: "left", padding: "8px 10px 8px 0", borderBottom: "1px solid var(--hair)",
                        fontFamily: "var(--font-mono), monospace", fontSize: 10.5, letterSpacing: ".1em",
                        textTransform: "uppercase", color: "var(--faint)", fontWeight: 600,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    [SCALE.metros.toLocaleString("en-US"), "metropolitan areas the corpus indexes", "the platform page"],
                    [MEASURED_COVERAGE.publishedMetros.toLocaleString("en-US"), "market pages published on this site", "the markets index"],
                    [MEASURED_COVERAGE.metrosAnsweringLocally.toLocaleString("en-US"),
                      `of those markets hold enough of their own filings to answer at metro grain (measured ${MEASURED_COVERAGE.measuredAt})`,
                      "every market page"],
                    [SCALE.procedures.toLocaleString("en-US"), "procedures the corpus indexes", "the platform page"],
                    [SERVICES.length.toLocaleString("en-US"), "services in the public picker here", "this page, the markets index"],
                    [MEASURED_COVERAGE.metroServicePagesAnsweringLocally.toLocaleString("en-US"),
                      `of the ${MEASURED_COVERAGE.publishedPages.toLocaleString("en-US")} market and service pages answer at metro grain (measured ${MEASURED_COVERAGE.measuredAt})`,
                      "every market page"],
                    [MEASURED_COVERAGE.statesAnswering.toLocaleString("en-US"), "states and territories that answer when a metro cannot", "the fallback line on a market page"],
                  ].map(([n, what, where]) => (
                    <tr key={String(n) + String(what)}>
                      <td className="num" style={{
                        padding: "10px 10px 10px 0", borderBottom: "1px solid var(--hair)",
                        fontWeight: 650, whiteSpace: "nowrap", verticalAlign: "top", color: "var(--ink)",
                      }}>{n}</td>
                      <td style={{ padding: "10px 10px 10px 0", borderBottom: "1px solid var(--hair)", color: "var(--body)", lineHeight: 1.6 }}>{what}</td>
                      <td style={{ padding: "10px 0", borderBottom: "1px solid var(--hair)", color: "var(--muted)", lineHeight: 1.6 }}>{where}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Reveal>
            <div
              className="card"
              style={{
                marginTop: 44,
                padding: "clamp(22px, 4vw, 34px)",
                background: "var(--teal-wash)",
                borderColor: "var(--teal)",
              }}
            >
              <h2 className="display" style={{ fontSize: "var(--text-xl)" }}>
                Ask us something this page does not answer.
              </h2>
              <p style={{ marginTop: 10, fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.7, maxWidth: "58ch" }}>
                If you want to know whether we hold a specific market, a specific service, or a figure you
                could stand behind in front of a client, ask. We would rather tell you we do not have it.
              </p>
              <p style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a href={DISCOVERY_URL} className="btn btn-primary">
                  Book a call
                </a>
                {/* WAS href="/". The home page has no form on it, so a button
                    labelled "Run a lookup" landed a visitor somewhere they could
                    not run one. /rates is the market index and carries the real
                    control. Measured on live prod: `grep -c "<form" /` returns 0. */}
                <Link href="/rates" className="btn btn-secondary">
                  Run a lookup
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

/* ------------------------------------------------------------------ pieces */

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal as="section">
      <section id={id} style={{ paddingTop: "clamp(34px, 5vw, 54px)", scrollMarginTop: 90 }}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="display" style={{ fontSize: "var(--text-2xl)", marginTop: 10, maxWidth: "24ch" }}>
          {title}
        </h2>
        <div style={{ marginTop: 16 }}>{children}</div>
      </section>
    </Reveal>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "var(--text-base)", lineHeight: 1.75, color: "var(--body)", maxWidth: "68ch", marginBottom: 14 }}>
      {children}
    </p>
  );
}

function Numbered({ items }: { items: { h: string; b: string }[] }) {
  return (
    <ol style={{ listStyle: "none", padding: 0, margin: "18px 0 0", display: "grid", gap: 14, counterReset: "n" }}>
      {items.map((it) => (
        <li
          key={it.h}
          className="card"
          style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "start" }}
        >
          <span
            className="num"
            aria-hidden="true"
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "var(--teal-wash)",
              color: "var(--teal-deep)",
              fontSize: 12,
              fontWeight: 700,
              display: "grid",
              placeItems: "center",
              flex: "none",
            }}
          >
            {items.indexOf(it) + 1}
          </span>
          <div>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink)" }}>{it.h}</h3>
            <p style={{ marginTop: 6, fontSize: "var(--text-sm)", lineHeight: 1.7, color: "var(--muted)" }}>{it.b}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", marginTop: 18 }}>
      <table
        style={{
          width: "100%",
          minWidth: 560,
          borderCollapse: "separate",
          borderSpacing: 0,
          border: "1px solid var(--hair)",
          borderRadius: "var(--r)",
          overflow: "hidden",
          background: "var(--paper)",
        }}
      >
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                style={{
                  textAlign: "left",
                  padding: "12px 15px",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10.5,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: ".07em",
                  color: "var(--faint)",
                  background: "var(--elev)",
                  borderBottom: "1px solid var(--hair)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td
                  key={i}
                  style={{
                    padding: "12px 15px",
                    fontSize: "var(--text-sm)",
                    color: i === 0 ? "var(--ink)" : "var(--muted)",
                    fontWeight: i === 0 ? 600 : 400,
                    borderBottom: "1px solid var(--hair)",
                    lineHeight: 1.6,
                  }}
                >
                  {i === 1 ? <span className="num">{c}</span> : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: "live" | "spread";
  title: string;
  children: React.ReactNode;
}) {
  const color = tone === "live" ? "var(--teal-deep)" : "var(--spread)";
  const wash = tone === "live" ? "var(--teal-wash)" : "var(--spread-wash)";
  return (
    <div
      style={{
        marginTop: 18,
        padding: "16px 18px",
        borderRadius: "var(--r-sm)",
        background: wash,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color, marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7, color: "var(--body)", maxWidth: "64ch" }}>{children}</p>
    </div>
  );
}
