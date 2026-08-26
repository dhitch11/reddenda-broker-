/**
 * WHAT CALIFORNIA EMPLOYERS PAID THEIR BROKERS, FROM THE FILINGS.
 *
 * Measured 2026-08-26 by this lane, on this box, from the primary files. Not taken
 * on trust from a brief, and that mattered: the figure circulating in the fleet was
 * $947.2M and I could not reproduce it. What the files actually say is below, and
 * the method is printed with it so anyone can run the same two passes and get the
 * same number.
 *
 * THE METHOD, EXACTLY:
 *   1. `f_5500_2023_latest.csv` (231,725 filings), keep every ACK_ID whose
 *      SPONS_DFE_MAIL_US_STATE is CA  ->  25,573 filings.
 *   2. `F_SCH_A_PART1_2023_latest.csv`, sum INS_BROKER_COMM_PD_AMT and
 *      INS_BROKER_FEES_PD_AMT over the Schedule A rows joined to those ACK_IDs
 *      ->  52,415 rows, 52,268 of them carrying a broker name.
 *
 * ⛔ WHY THE HEADLINE SAYS "AT LEAST", AND IT IS NOT HEDGING.
 *
 * The state comes from the address the plan FILES from, and the fleet's own
 * do-not-claim list is explicit that geography must never be asserted from a sponsor
 * address: Intel's Folsom workforce files from Chandler, Arizona, and Dignity Health
 * files from San Francisco for hospitals all over the state. So this is a count of
 * plans that file from a California address, which UNDERCOUNTS Californians working
 * for employers that file from somewhere else. The error has a direction, the
 * direction is down, and the page says so rather than rounding it away.
 *
 * ⛔ AND WHAT IT IS NOT. It is not "what brokers earn in California", because plans
 * with fewer than 100 participants are exempt from filing entirely (29 CFR
 * 2520.104-20) and appear nowhere in it. The number is what was DISCLOSED, which is
 * the honest and much more useful claim: a broker reading this page can look up the
 * line for their own client.
 *
 * Regenerate rather than hand-edit, and if you regenerate, move the vintage with it.
 */

export type CaEmployerFacts = {
  /** Broker commissions disclosed on Schedule A, in dollars. */
  commissions: number;
  /** Broker fees disclosed on Schedule A, in dollars. Separate line, separate meaning. */
  fees: number;
  /** Schedule A rows that carry a broker name. This is the sample size. */
  brokerRows: number;
  /** Form 5500 filings from a California address that the rows join to. */
  filings: number;
  /** Plan year of the filings, not the year they were downloaded. */
  planYear: number;
  source: string;
  measuredOn: string;
};

export const CA_EMPLOYER: CaEmployerFacts = {
  commissions: 967_997_806,
  fees: 196_076_241,
  brokerRows: 52_268,
  filings: 25_573,
  planYear: 2023,
  source: "Form 5500 Schedule A, US Department of Labor",
  measuredOn: "2026-08-26",
};

/** "$968 million". Whole millions: the precision in this figure is not in its last digits. */
export function commissionsShort(): string {
  return `$${Math.round(CA_EMPLOYER.commissions / 1_000_000)} million`;
}
