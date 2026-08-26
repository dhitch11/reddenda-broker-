/**
 * THE PUBLISHED LADDER, AS ONE STRUCTURED FACT PER PLAN.
 *
 * WHY THIS FILE EXISTS. The four amounts on the homepage were four string literals inside
 * JSX. They are CORRECT - verified against the live Stripe catalogue by lookup_key on
 * 2026-08-25: broker_pro_monthly $149/month, broker_pro_annual $1,490/year,
 * broker_agency_annual $4,900/year, broker_exhibit_once $490 one time, all active. The
 * problem was never the numbers, it was that nothing could TELL you if they stopped being
 * correct. Stripe is the pricing authority and a reprice there is deliberately a no-deploy
 * operation, which is exactly the condition under which a hardcoded marketing page goes
 * quietly stale and starts advertising a price the checkout will not honour.
 *
 * WHY THIS IS NOT A LIVE FETCH, WHICH WAS THE OBVIOUS ANSWER AND IS THE WRONG ONE TODAY.
 * The app resolves its prices from Stripe at request time and should; it is the surface
 * that takes money, so a price it cannot resolve is a plan it must not sell, and it
 * correctly omits the card rather than printing a remembered number. Copying that here
 * would mean putting a Stripe credential on the marketing host and placing a third-party
 * network call in the critical render path of the page a room full of brokers will load,
 * hours before that room exists. That trades a drift risk which is currently measured at
 * zero for a live failure mode which is currently impossible. The wrong way round.
 *
 * SO THE GUARANTEE IS MOVED TO DEPLOY TIME INSTEAD. `scripts/check-pricing-drift.mjs`
 * resolves these same lookup_keys against live Stripe and exits non-zero if any displayed
 * amount disagrees. Run it before promoting. The numbers stay static in the served HTML,
 * which is what a marketing page wants, and they cannot silently diverge from what a
 * customer is actually charged, which is what honesty wants.
 *
 * WHEN THE ROOM IS OVER, the better shape is a public, cached, unauthenticated pricing
 * endpoint on the app (the app already holds the credential and the resolver), which
 * marketing reads with a short revalidate and a static fallback. That needs an app deploy
 * slot and a new public route, and neither belongs in the last day before a presentation.
 *
 * `lookupKey` is the join to Stripe. It is the stable name: attaching it to a new price
 * detaches it from the old one, which is what makes a reprice a Stripe-only operation.
 */

export type LadderPlan = {
  /** The Stripe `lookup_key`. The guard resolves the live price through this. */
  lookupKey: string;
  /** Exactly as printed on the page. Whole dollars, because these prices have no cents. */
  display: string;
  /** Cents, so the guard compares integers to Stripe's `unit_amount` and never a string. */
  unitAmount: number;
  /** "month" | "year" | null for one-time. Checked against Stripe's recurring interval. */
  interval: "month" | "year" | null;
};

export const LADDER = {
  proMonthly: { lookupKey: "broker_pro_monthly", display: "$149", unitAmount: 14900, interval: "month" },
  proAnnual: { lookupKey: "broker_pro_annual", display: "$1,490", unitAmount: 149000, interval: "year" },
  agencyAnnual: { lookupKey: "broker_agency_annual", display: "$4,900", unitAmount: 490000, interval: "year" },
  exhibitOnce: { lookupKey: "broker_exhibit_once", display: "$490", unitAmount: 49000, interval: null },
} satisfies Record<string, LadderPlan>;

/** The sentence under the Broker Pro card. Built here so the two figures cannot drift apart. */
export const PRO_PER = `per month, or ${LADDER.proAnnual.display} a year`;

/**
 * THE ANNUAL SAVING, DERIVED. Never typed.
 *
 * The conductor's instruction was explicit and it is the right instinct: show the real
 * arithmetic, and COMPUTE it from the resolved amounts rather than writing "$298" into
 * copy. A saving is the one number on a pricing page a buyer checks with their own
 * phone calculator, so it has to be the subtraction the prices actually make. If Stripe
 * repriced either plan and someone updated only the display strings, a hardcoded saving
 * would keep advertising a discount that no longer exists, and the drift guard would not
 * catch it because the guard checks PRICES against Stripe, not the arithmetic between them.
 *
 * Integer cents throughout. `Math.round` on the percentage only, and only for display.
 */
const TWELVE_MONTHS = LADDER.proMonthly.unitAmount * 12;
const SAVED = TWELVE_MONTHS - LADDER.proAnnual.unitAmount;
const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US")}`;

export const ANNUAL_SAVING = {
  /** What twelve monthly payments actually come to. */
  twelveMonths: usd(TWELVE_MONTHS),
  /** The difference, in dollars. Zero or negative means there is no discount to claim. */
  saved: usd(SAVED),
  savedCents: SAVED,
  percent: Math.round((SAVED / TWELVE_MONTHS) * 100),
  /** True only when annual is genuinely cheaper. Guard every "save" claim on this. */
  worthIt: SAVED > 0,
} as const;
