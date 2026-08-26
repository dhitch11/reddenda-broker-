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
    "You are accountable for a number to someone senior, and almost everything you are shown about it comes from a party with a position in the outcome. This is the same underlying data, published by the plans themselves, read in plain English.",

  demo: {
    service: "73721",
    market: "26420",
    why:
      "A knee MRI in Houston. You do not need to know what a CPT code is to read this. The spread between the low and high end of one market is usually the part that surprises people, and it is the part you can actually do something about.",
  },

  scenarios: [
    {
      when: "Before the renewal presentation",
      body:
        "You are about to be told what your increase is and why. Knowing the range your market pays for the handful of services that drive your spend changes what questions you are able to ask, and it changes them before the meeting rather than after.",
    },
    {
      when: "Evaluating a network or a plan design change",
      body:
        "Narrower networks, tiering and steering are all sold on the promise of price. You can look at the actual distribution in your metro and see how much room there is between the low and high end before anyone models a saving for you.",
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
       unit is worse than no drug price. */
    {
      when: "When somebody offers you pharmacy savings",
      body:
        "We hold no pharmacy benefit manager contract, no rebate data and no point-of-sale pricing, so we will tell you nothing about your pharmacy benefit. The federal government collects rebate totals and says in writing that it cannot publish them in a form that identifies a plan or a drug, so anybody selling you a pharmacy number built from public data should be asked which file it came from. What is public is the other half of drug spend: the drugs given in a clinic - the infusions and the injections - are billed under the medical benefit at a negotiated rate, and those rates are filed like every other one. They are in our corpus, and they are not yet in the lookup: the tools cover imaging, scopes and procedures today, and putting a drug price on screen means getting its unit right, which is a thing to do properly rather than quickly. Ask us for the drug your plan actually spends on and we will show you what we hold.",
    },
    {
      when: "When someone asks whether you could build your own network",
      body:
        "The honest answer is a yes and a boundary. The prices exist, provider by provider, for the plans an employer in your market can actually buy, and nobody who has ever built a network has started with the full price map in front of them. What we will not do is pretend the rest of it is a data problem: we do not sign contracts, we do not run a plan, and steering patients is not something this product will ever help with. We measure. What you build from the measurement is yours, and it is a conversation with counsel and an administrator, not a report.",
    },
    {
      when: "Answering the CFO",
      body:
        "The question is always some version of how do we know this is a good deal. A sourced market figure with its filing count and its filings date on it is an answer you can put in a file and still defend a year later.",
    },
  ],

  deliverable: {
    title: "A file you can defend.",
    body:
      "Not a dashboard you will stop logging into. A dated, sourced view of what your market pays, in language that does not require a benefits background to read.",
    bullets: [
      "Plain English throughout. An MRI is called an MRI, and the procedure code sits behind it as detail rather than in front of it as jargon.",
      "Your metro, not a national or state average, because the market you buy care in is local.",
      "A Medicare reference beside each service, which is the comparison most finance teams already understand.",
      "The source, the filing count and the filings date printed on every figure.",
      "An explicit statement of what the data cannot tell you, so nothing in your file overstates what you knew at the time.",
    ],
  },

  limit: {
    title: "We are a price dataset, and we are not your advisor.",
    body:
      "We hold what plans have contracted to pay providers. We do not hold your claims, your enrollment or your utilization, so we cannot project your spend, model your renewal or tell you what a plan change would save. We hold no protected health information and there is no path by which any would enter this product. Nothing here is legal, actuarial or benefits advice, and using it does not by itself satisfy any obligation you may have. What it does is let you see the market for yourself, from the filings, with the source attached.",
  },

  closer: "See the market before someone explains it to you.",
};

export default function Employers() {
  return <RolePage config={config} />;
}
