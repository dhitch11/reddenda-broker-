import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter, DISCOVERY_URL } from "@/components/marketing/chrome";
import { Reveal } from "@/components/marketing/reveal";
import { LADDER, ANNUAL_SAVING, AGENCY_PER_GROUP } from "@/lib/pricing-ladder";
import { PLAN_SPEND, PHARMACY_GAP } from "@/lib/plan-spend";

/**
 * /pricing — THE PRICE, READABLE WITHOUT BOOKING A CALL.
 *
 * WHY A PAGE AND NOT JUST THE HOMEPAGE SECTION. The homepage prices three plans in a
 * band most visitors scroll past on the way to the demo. A broker deciding whether to
 * expense this needs a page they can send to whoever signs, and a page that survives
 * being opened cold with no other context.
 *
 * EVERY AMOUNT COMES FROM `pricing-ladder.ts` AND IS JOINED TO STRIPE BY `lookup_key`.
 * Not one number is typed into this file. `scripts/check-pricing-drift.mjs` resolves the
 * same lookup_keys against the live catalogue and exits non-zero if any displayed amount
 * disagrees, and it runs before a promote. Hard rule 7: Stripe is the authority, this
 * page is a renderer.
 *
 * THE SAVING IS SUBTRACTION, NOT COPY. `ANNUAL_SAVING` is computed from the two resolved
 * amounts. A buyer will check it on their phone, so it has to be the arithmetic the
 * prices actually make, and it has to stop claiming a discount the moment there is not
 * one (`worthIt`).
 *
 * WHAT IS FREE IS STATED EXACTLY, because it is our best argument and because
 * overstating it would be the one lie that costs us the room. Verified in the app's own
 * entitlement ladder (`src/lib/broker/tier.ts`) rather than assumed:
 *   public  a stranger. The market aggregate and its sample size, for any market and
 *           service we hold. Real measured numbers, not a teaser.
 *   demo    gave an email. The same data PLUS the per-payer breakdown and the console.
 *   pro     bought Broker Pro. Mints the client-facing exhibit.
 *   agency  bought Agency. Everything Pro has, firm-wide, agency name set server side.
 * So: the dollars are free and identity is not, which is the honest sentence and also
 * the true one.
 *
 * THE $490 EXHIBIT HAS NO CHECKOUT LINK ON PURPOSE. Nothing mints it yet. Linking a
 * price to a checkout that cannot deliver the thing is the defect class this estate
 * just finished removing from its share links, so it takes a call until a mint exists.
 */

const APP = "https://app.reddenda.com/broker";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Flat published fees. The market figures are free to read; a seat adds the payer detail and the client-ready exhibit.",
  alternates: { canonical: "/pricing" },
};

type Plan = {
  name: string;
  amount: string;
  per: string;
  blurb: string;
  lines: string[];
  cta: string;
  href: string;
  note?: string;
  feature?: boolean;
  chip?: string;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    amount: "$0",
    per: "no card, no trial clock",
    blurb: "Read the market. This is not a teaser tier and the numbers in it are the real ones.",
    lines: [
      "The negotiated-rate distribution for any market and service we hold",
      "The filing count on every figure, so you can see how thin or deep it is",
      "The federal Medicare anchor beside it",
      "A refusal, in writing, wherever the sample cannot support a number",
    ],
    cta: "Look up a market",
    href: APP,
    note: "The dollars are free. Identity is not: the per-payer breakdown and the console open once you give an email, still at no charge.",
    chip: "Start here",
  },
  {
    name: "Broker Pro",
    amount: LADDER.proMonthly.display,
    per: "per seat, per month",
    blurb: "For the producer who walks into renewals. Everything free has, plus the document you hand the client.",
    lines: [
      "Which carrier pays what, by name, not just the market spread",
      "Site of care: the same procedure priced across settings",
      "Out-of-network exposure against the plan's own QPA",
      "Client-ready exhibits, with the source and the vintage printed on them",
      "A share link that opens for whoever you send it to, with no account",
    ],
    cta: "Create your account",
    href: APP,
    feature: true,
    chip: "Most brokers",
  },
  {
    name: "Agency",
    amount: LADDER.agencyAnnual.display,
    per: "a year, flat for the whole firm",
    blurb: "One fee for the firm. It does not go up when you hire, and it is not counted per seat.",
    lines: [
      "Everything in Broker Pro, for every producer at the firm",
      "Your agency's name on every exhibit, set server side so it cannot be edited out",
      "Shared saved markets and baskets across the team",
      "Onboarding for your producers",
      /* Divided by the buyer's OWN BOOK, never by a client's plan spend. "$4,900
         against a $3.95M plan" is a favourable denominator and any broker with four
         accounts catches it. */
      `A firm advising twenty self-funded groups pays ${AGENCY_PER_GROUP(20)} a group a year`,
    ],
    cta: "Create your account",
    href: APP,
    note: "Flat and firm-wide. Not per seat, and it does not meter on producers, clients, claims or lives.",
  },
  {
    name: "Renewal exhibit",
    amount: LADDER.exhibitOnce.display,
    per: "one time, per exhibit",
    blurb: "One market, one basket, one self-funded group, built for a meeting rather than a dashboard.",
    lines: [
      "Scoped to a single renewal conversation",
      "Every figure carries its source, its sample size and its date",
      "Yours to forward; the link opens without an account",
      "No subscription required",
    ],
    cta: "Arrange one on a call",
    href: DISCOVERY_URL,
    note: "This one is set up with us rather than bought from a button, so we scope the market and the basket with you first.",
  },
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section style={{ paddingTop: "clamp(38px, 6vw, 64px)", paddingBottom: 10 }}>
          <div className="wrap">
            <p className="eyebrow">Pricing</p>
            <h1 className="display" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "18ch" }}>
              You can read the price without booking a call.
            </h1>
            <p className="lede" style={{ marginTop: 14, maxWidth: "62ch" }}>
              Flat dollar amounts, published. We do not price off a percentage of what a plan
              saves, and we do not price off patient, claim or life counts. What you pay does not
              change because a client's renewal went well.
            </p>
          </div>
        </section>

        <section style={{ paddingBottom: 34 }}>
          <div className="wrap">
            <div className="g4" style={{ marginTop: 22, alignItems: "stretch" }}>
              {PLANS.map((p, i) => (
                <Reveal key={p.name} delay={60 * i}>
                  <PlanCard plan={p} />
                </Reveal>
              ))}
            </div>

            <Reveal delay={260}>
              {/* THE SAVING, AS THE SUBTRACTION IT IS. Rendered only when there is one. */}
              {ANNUAL_SAVING.worthIt && (
                <div
                  className="card"
                  style={{ marginTop: 22, padding: "clamp(18px, 3vw, 24px)", display: "grid", gap: 8 }}
                >
                  <h2 className="display" style={{ fontSize: "var(--text-lg)", color: "var(--ink)" }}>
                    Paying for the year, in full
                  </h2>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.7, maxWidth: "70ch" }}>
                    Broker Pro is <span className="num">{LADDER.proMonthly.display}</span> a month, which
                    comes to <span className="num">{ANNUAL_SAVING.twelveMonths}</span> over twelve months.
                    The annual price is <span className="num">{LADDER.proAnnual.display}</span>. That is{" "}
                    <span className="num">{ANNUAL_SAVING.saved}</span> less,{" "}
                    <span className="num">{ANNUAL_SAVING.percent}%</span>, and it is the whole of the
                    difference. There is no setup fee, no per-exhibit charge inside a seat and no
                    minimum term on the monthly plan.
                  </p>
                </div>
              )}
            </Reveal>
          </div>
        </section>

        {/* ── THE DENOMINATOR ──────────────────────────────────────────────
            A price with no denominator is just a number, and the buyer supplies
            one anyway. Better they use ours, stated and sourced, than guess.
            MODELLED, and it says so on the face of it in three places. */}
        <section style={{ paddingBottom: 30 }}>
          <div className="wrap">
            <Reveal>
              <div className="card" style={{ padding: "clamp(20px, 3.5vw, 28px)", display: "grid", gap: 12 }}>
                <span className="eyebrow">What this is a fraction of</span>
                <h2 className="display" style={{ fontSize: "var(--text-lg)", color: "var(--ink)" }}>
                  A {PLAN_SPEND.lives} life self-funded plan in California spends about{" "}
                  <span className="num">${PLAN_SPEND.annualMillions} million</span> a year.
                </h2>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.7, maxWidth: "72ch" }}>
                  That is <span className="num">{PLAN_SPEND.pepy}</span> per covered employee per year, or{" "}
                  <span className="num">{PLAN_SPEND.pepm}</span> per covered employee per month, on{" "}
                  <span className="num">{PLAN_SPEND.lives}</span> lives. We publish it because a fee is
                  meaningless without the number underneath it, and because you would estimate one anyway.
                </p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.65, maxWidth: "72ch" }}>
                  <b>{PLAN_SPEND.source}</b> Nationally the honest band is{" "}
                  <span className="num">{PLAN_SPEND.bandLow}</span> to{" "}
                  <span className="num">{PLAN_SPEND.bandHigh}</span> per covered employee per year, and it
                  is a band rather than a figure because the survey does not support a point estimate.{" "}
                  {PLAN_SPEND.corroboration.source} measured{" "}
                  <span className="num">{PLAN_SPEND.corroboration.value}</span> in{" "}
                  {PLAN_SPEND.corroboration.year}, near the top of it. It does not come from our corpus,
                  and we will not print it as though it did.
                </p>
              </div>
            </Reveal>

            {/* ── THE GAP WE REFUSE TO FILL ─────────────────────────────────
                The highest-trust sentence available to us, and it costs nothing
                to say because it is simply true. */}
            <Reveal delay={80}>
              <div className="card" style={{ marginTop: 18, padding: "clamp(20px, 3.5vw, 28px)", display: "grid", gap: 10 }}>
                <span className="eyebrow">What we will not sell you</span>
                <h2 className="display" style={{ fontSize: "var(--text-lg)", color: "var(--ink)" }}>
                  Pharmacy is about {PHARMACY_GAP.shareOfSpend} of plan spend. We hold none of it.
                </h2>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.7, maxWidth: "72ch" }}>
                  It is also the fastest-growing line on the plan at roughly{" "}
                  <span className="num">{PHARMACY_GAP.growth}</span> a year, which is exactly why you should
                  expect somebody to quote you a number for it. We hold no {PHARMACY_GAP.pbm} contract, no
                  rebate data and no point-of-sale pricing, so we will tell you nothing about pharmacy.
                  Anyone selling you a pharmacy figure off transparency in coverage files is selling you an
                  assumption.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── WHAT FREE ACTUALLY MEANS ─────────────────────────────────────── */}
        <section className="sec" style={{ paddingTop: 8 }}>
          <div className="wrap">
            <Reveal>
              <div className="sec-head">
                <span className="eyebrow">The free tier</span>
                <h2 className="sec-title">The dollars are free. Identity is not.</h2>
                <p className="lede" style={{ color: "var(--body)" }}>
                  Most of this market sells the number. We do not, because a number nobody can
                  check is worth nothing in a renewal meeting. Anyone can read what plans have
                  agreed to pay in a market, with the filing count beside it, without paying us
                  and without an account.
                </p>
              </div>
            </Reveal>
            <div className="g3" style={{ marginTop: 26 }}>
              {[
                {
                  t: "Free, and no account",
                  b: "The rate distribution for a market and a service, the sample size behind it, and the federal Medicare anchor. Also the refusals: where the filings will not support a figure, the page says so instead of printing one.",
                },
                {
                  t: "Free, with an email",
                  b: "The same figures, plus which carrier pays what by name, plus the console you work in. No card, and nothing expires. The email exists so we know who is asking, not so we can start a clock.",
                },
                {
                  t: "What a seat is actually for",
                  b: "The document. A seat mints the client-ready exhibit and the share link that opens for whoever you forward it to. That is the thing worth money, so that is the thing behind the price.",
                },
              ].map((c) => (
                <Reveal key={c.t}>
                  <div className="card" style={{ padding: 22, display: "grid", gap: 8, height: "100%" }}>
                    <h3 className="display" style={{ fontSize: "var(--text-base)", color: "var(--ink)" }}>{c.t}</h3>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.7 }}>{c.b}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── THE THINGS PEOPLE ASK BEFORE THEY BUY ────────────────────────── */}
        <section className="sec" style={{ paddingTop: 4 }}>
          <div className="wrap">
            <Reveal>
              <div className="sec-head">
                <span className="eyebrow">Before you buy</span>
                <h2 className="sec-title">The answers we would give you on the call.</h2>
              </div>
            </Reveal>
            <div className="g2" style={{ marginTop: 24 }}>
              {[
                {
                  q: "Is this priced on what we save a client?",
                  a: "No. Every fee here is a flat dollar amount and none of it moves with a client's outcome, their claim count, their headcount or their renewal result. A fee that rises with someone's savings gives us a reason to prefer one answer over another, and this product only works if we do not have one.",
                },
                {
                  q: "Do you need our claims data?",
                  a: "No, and we do not want it. Nothing here needs protected health information to work. The figures come from the machine-readable files health plans publish under the federal Transparency in Coverage rule.",
                },
                {
                  q: "Is Agency per seat?",
                  a: `No. Agency is ${LADDER.agencyAnnual.display} a year, flat, for the whole firm. Broker Pro is the per-seat plan; Agency is not. Add a producer in March and it is the same price. A firm advising twenty self-funded groups is paying ${AGENCY_PER_GROUP(20)} a group a year, and there is no usage meter underneath it.`,
                },
                {
                  q: "What happens if we cancel?",
                  a: "The monthly plan has no minimum term. Exhibits you have already minted keep working for the people you sent them to, because the link is signed at mint time and does not check your subscription to open.",
                },
                {
                  q: "Can we see it before we pay?",
                  a: "Yes, and not as a guided tour. The free tier is the real product against the real corpus. Look up your own market and your own procedure codes, and check a number you already know before you believe any of the ones you do not.",
                },
                {
                  q: "We are a multi-agency or a portfolio.",
                  a: "That is scoped on a call rather than listed, because the shape differs enough that a published number would be wrong for most of the people reading it.",
                },
              ].map((f) => (
                <Reveal key={f.q}>
                  <div className="card" style={{ padding: 22, display: "grid", gap: 8, height: "100%" }}>
                    <h3 className="display" style={{ fontSize: "var(--text-base)", color: "var(--ink)" }}>{f.q}</h3>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.7 }}>{f.a}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120}>
              <div
                className="card"
                style={{
                  marginTop: 30,
                  padding: "clamp(22px, 4vw, 34px)",
                  background: "var(--teal-wash)",
                  borderColor: "var(--teal)",
                  display: "grid",
                  gap: 12,
                }}
              >
                <h2 className="display" style={{ fontSize: "var(--text-xl)" }}>
                  Start on the free tier and check us against a rate you already know.
                </h2>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.7, maxWidth: "62ch" }}>
                  It is the fastest way to find out whether this is worth a seat, and it costs
                  nothing. If you would rather have someone walk you through a live renewal, we
                  will do that instead.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                  <a href={APP} className="btn btn-primary">Open the free tier</a>
                  <a href={DISCOVERY_URL} className="btn btn-secondary">Book a discovery call</a>
                </div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.6, marginTop: 2 }}>
                  Prices shown are the published flat fees for these plans. Checkout confirms the
                  amount before anything is charged. See{" "}
                  <Link href="/methodology">how we get to a number</Link> for what sits behind them.
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div className={`card price-card${plan.feature ? " price-card--feature" : ""}`} style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
        <h2 className="display" style={{ fontSize: "var(--text-lg)", color: "var(--ink)" }}>{plan.name}</h2>
        {plan.chip && <span className="pro-chip">{plan.chip}</span>}
      </div>
      <div>
        <div className="price-card__amount">{plan.amount}</div>
        <div className="price-card__per" style={{ marginTop: 6 }}>{plan.per}</div>
      </div>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.6, margin: 0 }}>{plan.blurb}</p>
      <ul>
        {plan.lines.map((l) => (
          <li key={l}>
            <span aria-hidden="true" style={{ color: "var(--teal)", fontFamily: "var(--font-mono), monospace" }}>+</span>
            <span>{l}</span>
          </li>
        ))}
      </ul>
      <div style={{ display: "grid", gap: 10 }}>
        {plan.note && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.6, margin: 0 }}>{plan.note}</p>
        )}
        <a href={plan.href} className={`btn ${plan.feature ? "btn-primary" : "btn-secondary"}`} style={{ width: "100%" }}>
          {plan.cta}
        </a>
      </div>
    </div>
  );
}
