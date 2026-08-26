import type { Metadata } from "next";
import { RolePage, type RoleConfig } from "@/components/marketing/role-page";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "For general agencies",
  description:
    "Equip a downstream broker network with market rate intelligence under your name.",
};

/**
 * THE GENERAL AGENCY PAGE.
 *
 * The handoff flags this as the page most likely to be written wrong, and the
 * reason is precise: a GA is not a large broker. A GA's product is a reason for a
 * broker to quote through them rather than through someone else, and their
 * conversion metric is DOWNSTREAM ADOPTION, not their own usage.
 *
 * So this page never says "look up a price". It says "arm your network". Every
 * scenario is about a downstream broker winning, and the deliverable is a thing a
 * GA distributes rather than a thing a GA reads.
 */

const config: RoleConfig = {
  slug: "general-agencies",
  eyebrow: "For general agencies and wholesalers",
  h1: "Give your brokers a reason to quote through you.",
  lede:
    "They can get carrier illustrations anywhere. They cannot usually get metro-level filed rates from their GA. Put it in their hands under your name and it becomes a reason to bring you the case.",

  demo: {
    service: "70553",
    market: "35620",
    why:
      "This is what one of your brokers would run before a New York case. The value to you is not that you can run it. It is that two hundred of them can, on your platform, and that the one who does walks into a renewal better armed than the one who does not.",
  },

  scenarios: [
    {
      when: "Recruiting a broker who writes elsewhere",
      body:
        "Commission is table stakes and every wholesaler quotes the same carriers. A capability their current GA cannot match is a real reason to move a case, and it is one that does not cost you basis points.",
    },
    {
      when: "Activating the middle of your book",
      body:
        "Most GA value sits in the top decile of producers. A tool that makes an average broker look prepared in a renewal meeting lifts the ones who are not calling you, which is where the unclaimed revenue actually is.",
    },
    {
      when: "Q4, when your phones do not stop",
      body:
        "Renewal season is when your team is least able to give individual support and when your brokers most need to look prepared. Self-serve market data absorbs a category of question that would otherwise land on your account managers.",
    },
  ],

  deliverable: {
    title: "A capability you distribute, not a seat you consume.",
    body:
      "The measure that matters to you is how many of your downstream brokers actually use it and whether it shows up in a renewal conversation. So it is built to be handed out, branded and reported on.",
    bullets: [
      "Access for your downstream brokers, so the capability arrives as something you gave them.",
      "Artifacts a broker hands to a client, carrying a source line that survives being forwarded.",
      "Coverage across every metro your network writes in, with the honest gaps visible rather than hidden.",
      "The same methodology page your brokers can send to a skeptical client, so your team is not the one defending the data.",
      "A view of which markets and services your network is actually asking about, which is a real signal about where your book is under pressure.",
    ],
  },

  limit: {
    title: "We do not touch your compensation or your carrier relationships.",
    body:
      "This is a price dataset built from public federal filings. It does not quote, it does not bind, it does not rate, and it does not sit between you and a carrier. It also holds no claims and no member data, so it cannot produce a spend projection for a downstream group. If a broker in your network needs that, they need utilization data we do not have and do not claim to have.",
  },

  closer: "Arm the network, not just the top producers.",
};

export default function GeneralAgencies() {
  return <RolePage config={config} />;
}
