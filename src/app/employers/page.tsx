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
    {
      when: "Answering the CFO",
      body:
        "The question is always some version of how do we know this is a good deal. A sourced market figure with a regulation cite and a build date on it is an answer you can put in a file and still defend a year later.",
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
      "The source, the federal regulation and the corpus build date printed on every figure.",
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
