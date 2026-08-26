/**
 * WHAT OUR FEE IS A FRACTION OF.
 *
 * Nothing on this site told a reader the denominator. A price with no denominator is
 * just a number, and the buyer supplies their own denominator anyway; better that they
 * use ours, stated, than guess.
 *
 * ⛔ THIS IS MODELLED AND IT SAYS SO EVERYWHERE IT RENDERS. It is derived from the
 * federal MEPS-IC (Medical Expenditure Panel Survey, insurance component) California
 * 2024 survey. It is NOT a measurement of any one plan, it is not from our corpus, and
 * it must never be printed as though it were either. Rule 1 does not stop applying
 * because a figure is useful: the honest form of a modelled number is the modelled
 * number WITH its derivation, not the number alone.
 *
 * The band is real and it is wide on purpose. A single point estimate would imply a
 * precision the survey does not carry, so the national range renders alongside.
 */

/** Per covered employee per YEAR, California, modelled from MEPS-IC 2024. */
export const PEPY_CA = 15_800;

/** The honest national range. Never collapse this to one number. */
export const PEPY_NATIONAL_BAND: readonly [number, number] = [15_800, 18_500];

/** The reference group size. 250 lives is the low end of self-funding, not the average. */
export const REFERENCE_LIVES = 250;

const dollars = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export const PLAN_SPEND = {
  lives: REFERENCE_LIVES,
  pepy: dollars(PEPY_CA),
  /** Derived, not typed: the two figures cannot disagree. */
  pepm: dollars(PEPY_CA / 12),
  annual: dollars(PEPY_CA * REFERENCE_LIVES),
  annualMillions: (PEPY_CA * REFERENCE_LIVES / 1_000_000).toFixed(2),
  bandLow: dollars(PEPY_NATIONAL_BAND[0]),
  bandHigh: dollars(PEPY_NATIONAL_BAND[1]),
  source: "Modelled from the federal MEPS-IC California 2024 survey and trended. Not a measurement of any one plan.",
  /* An independent third party at the top of the band, named and dated. A modelled
     figure standing alone invites "says who"; a modelled figure next to somebody
     else's published measurement answers it before it is asked. */
  corroboration: { source: "Mercer", value: "$17,496", year: "2025" },
} as const;

/**
 * PHARMACY: THE GAP WE REFUSE TO FILL.
 *
 * The highest-trust sentence available to us, and it costs nothing to say because it is
 * simply true. Pharmacy is roughly a quarter of plan spend and the fastest-growing line
 * on it, and we hold NO PBM contract and NO rebate data. So we say nothing about it.
 * Anyone quoting a pharmacy number off transparency files is quoting an assumption.
 */
export const PHARMACY_GAP = {
  shareOfSpend: "23%",
  growth: "+14.8%",
  /* Named in full at least once on every surface that carries this card. "PBM" is
     industry shorthand and a CFO reading a forwarded page may not expand it, and the
     whole point of the card is that it is legible to somebody outside the trade. */
  pbm: "pharmacy benefit manager",
  /* All three, because they are three different absences and naming only one implies
     we hold the other two. */
  weDoNotHold: ["a pharmacy benefit manager contract", "rebate data", "point-of-sale pricing"],
} as const;
