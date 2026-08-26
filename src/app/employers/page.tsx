import type { Metadata } from "next";
import { RolePage, type RoleConfig } from "@/components/marketing/role-page";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "For self-funded employers",
  description:
    "See what your market pays before your renewal meeting, in plain English, with the source on every figure.",
};

/**
 * THE EMPLOYER PAGE.
 *
 * This audience is the one where benefits vendors overstate the most, especially
 * about fiduciary exposure. The estate's own rule is that we read every sentence
 * as a plaintiff's lawyer would.
 *
 * So this page deliberately makes NO claim about what any court has held, no
 * claim that using this product discharges any duty, and no claim of savings. It
 * speaks to the practical job: walking into a renewal able to say where your
 * market sits, and being able to show where the number came from. Legal framing
 * stays out until it has been verified from primary sources and adversarially
 * checked, and even then it belongs in careful language rather than a headline.
 */

const config: RoleConfig = {
  slug: "employers",
  eyebrow: "For self-funded and level-funded employers",
  h1: "Walk into your renewal knowing what the market pays.",
  lede:
    "You answer for a number to someone senior, and almost everyone explaining it has a stake in the outcome. This is the same data, published by the plans, in plain English.",

  demo: {
    service: "45378",
    market: "40900",
    why:
      "A screening colonoscopy in Sacramento. No codes required. The spread inside one market surprises people, and it is the part you can act on.",
  },

  scenarios: [
    {
      when: "Before the renewal presentation",
      body:
        "You are about to be told what your increase is and why. Knowing what your market pays for the services that drive your spend changes your questions, before the meeting instead of after.",
    },
    {
      when: "Evaluating a network or a plan design change",
      body:
        "Narrower networks, tiering and steering are all sold on price. See the real spread in your metro before anyone models a saving for you.",
    },
    /* ── THE THREE QUESTIONS A SELF-FUNDED GROUP ACTUALLY ASKED US ──────────────────────
       Added 2026-08-26 after a call with a self-funded employer group: pharmacy and
       rebates, pass-through and transparency, and whether a plan could design its own
       network from this data. THIS PAGE - THE ONE BUILT FOR THAT EXACT AUDIENCE - DID NOT
       MENTION ANY OF THE THREE. Measured: zero occurrences of pharmacy, rebate, PBM,
       pass-through or network design anywhere on it.
       Both scenarios below are written to be TRUE FIRST and useful second, and neither
       prints a figure: static prose quoting a table it cannot see is a number that decays
       silently, and this repo has the scar. The figures live in the tool, where they are
       computed on the request.

       ⛔ AND THE PHARMACY ONE WAS CORRECTED WITHIN THE HOUR, BY ME, BEFORE ANYONE READ IT.
       The first draft said of clinic-administered drugs: "We hold them, by market, with the
       sample size beside them." TRUE ABOUT THE DATA - 659,681 J-code rows, and in Sacramento
       J9173 carries n=12,835 - AND FALSE ABOUT THE PRODUCT. MEASURED: the service catalog is
       75 codes in the app and 12 on this site, and NOT ONE OF THEM IS A J-CODE.
       /api/lookup?service=J9173 returns invalid_service. A reader who acted on that sentence
       would have gone looking and found nothing.
       ★ IT IS THE SAME DEFECT I SPENT THE MORNING REMOVING FROM OTHER PEOPLE'S SURFACES: A
       CLAIM THE PRODUCT CANNOT HONOUR. "We hold it" and "you can see it" are different
       sentences, and the gap between them is exactly where a marketing page turns into a
       promise nobody kept. It now says both halves - what is in the corpus, and what is not
       yet in the lookup - and names the reason, which is that a drug price without the right
       unit is worse than no drug price.

       ↩︎ UPDATED 2026-08-26, AND THE UPDATE IS THE SAME DEFECT POINTING THE OTHER WAY.
       "They are not in the lookup yet" was true when it was written and is now FALSE:
       clinic-administered drugs are in the lookup, every figure carries its billing unit,
       the carrier whose book it came from, and the Medicare benchmark or an honest line
       saying none is wired. This page was telling an employer we cannot do a thing we do.
       ★ A PAGE THAT UNDERSTATES THE PRODUCT IS THE SAME CLASS OF ERROR AS ONE THAT
       OVERSTATES IT: both are a sentence the product does not match. Stale honesty is
       still stale. Whoever ships the next drug capability edits this paragraph in the
       same commit. */
    {
      when: "When somebody offers you pharmacy savings",
      body:
        "We hold no pharmacy benefit manager contract, no rebate data, no point-of-sale pricing. So we will tell you nothing about your pharmacy benefit. The government collects rebate totals and says in writing it cannot publish them by plan or drug. If someone sells you a pharmacy number from public data, ask which file. The other half of drug spend is public: clinic-administered drugs, infusions and injections, billed under the medical benefit at a filed negotiated rate. Those are in the lookup now, each with its billing unit, because a drug price without one is off by the dose. Each names its carrier and shows the Medicare benchmark, or says we hold none.",
    },
    {
      when: "When someone asks whether you could build your own network",
      body:
        "A yes and a boundary. The prices exist, provider by provider, for the plans your market can buy, and nobody building a network has started with the full map. We will not pretend the rest is a data problem. We do not sign contracts, run plans, or help steer patients. We measure. What you build from it is yours, with counsel and an administrator.",
    },
    {
      when: "Answering the CFO",
      body:
        "The question is always some version of how do we know this is a good deal. A market figure carrying its filing count and date is an answer you can still defend a year later.",
    },
  ],

  deliverable: {
    title: "A file you can defend.",
    body:
      "Not a dashboard you stop opening. A dated, sourced view of what your market pays, readable without a benefits background.",
    bullets: [
      "Plain English throughout. An MRI is called an MRI, with the code behind it as detail, not in front as jargon.",
      "Your metro, not a national or state average, because the market you buy care in is local.",
      "A Medicare reference beside each service, which is the comparison most finance teams already understand.",
      "The source, the filing count and the filings date printed on every figure.",
      "An explicit statement of what the data cannot tell you, so nothing in your file overstates what you knew at the time.",
    ],
  },

  limit: {
    title: "We are a price dataset, and we are not your advisor.",
    body:
      "We hold what plans contracted to pay providers. We do not hold your claims, enrollment or utilization, so we cannot project your spend, model your renewal, or say what a plan change would save. We hold no protected health information and there is no path for any to enter this product. Nothing here is legal, actuarial or benefits advice. It lets you see the market for yourself, from the filings, with the source attached.",
  },

  closer: "See the market before someone explains it to you.",
};

export default function Employers() {
  return <RolePage config={config} />;
}
