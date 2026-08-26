import type { Metadata } from "next";
import { RolePage, type RoleConfig } from "@/components/marketing/role-page";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "For brokers",
  description:
    "Walk into a renewal holding a market number the incumbent does not have. What plans have agreed to pay in your market, with the sample size and the vintage on every number.",
};

const config: RoleConfig = {
  slug: "brokers",
  eyebrow: "For brokers placing group health",
  h1: "Be the only person in the room with the market number.",
  lede:
    "Your client is being told their increase is what the market is doing. You can now check that. Metro level negotiated rates, filed by the payers themselves, for the services that actually drive a group's spend.",

  demo: {
    service: "45378",
    market: "16980",
    why:
      "A colonoscopy in Chicago. Change either field and the answer changes with it. This is the same query your client can watch you run on a screen share, and the source line under it is the one they will ask about.",
  },

  scenarios: [
    {
      when: "The renewal meeting",
      body:
        "The carrier report says the increase is trend. You put the market distribution for the services that drive this group on the screen and ask where their network sits in it. The conversation stops being about your commission and starts being about their spend.",
    },
    {
      when: "The finalist presentation",
      body:
        "Every competing broker brings the same carrier illustrations. You bring a number none of them has, from a source the prospect can verify themselves, with the filing count and the filings date printed on it.",
    },
    {
      when: "Defending an account",
      body:
        "An incumbent under attack has to prove they are still doing work. A dated market read on the client's own services is a piece of work with your name on it, and it is repeatable next year so the comparison compounds.",
    },
  ],

  deliverable: {
    title: "One page you can hand a client.",
    body:
      "The thing that travels is not a dashboard login. It is a single sourced view of what a market pays, in a form a CFO can read in thirty seconds and forward without you.",
    bullets: [
      "The distribution for the services that matter to that group, in the metro they actually buy care in, not a state average.",
      "A Medicare reference figure beside every service, because it is the one reference point this audience already has a feel for. It is a fixed line to read against, not a fair price.",
      "The filing count on every number, so a skeptical reader can judge the depth for themselves.",
      "The source, the filing count and the filings date on the page, so it survives being forwarded to someone who was not in the meeting.",
      "An honest gap where we do not have the data, rather than a number that would embarrass you later.",
    ],
  },

  limit: {
    title: "This will not tell you what a group will spend.",
    body:
      "We hold price, not utilization. We can show you that one market pays twice another for the same procedure, and we can show you where a network sits in that spread. We cannot tell you how often your client's population uses that procedure, so we cannot forecast a renewal and we will not let a page here imply we can. Anyone selling you a spend projection off transparency data alone is selling you an assumption wearing a number's clothes.",
  },

  closer: "Bring a number to the meeting.",
};

export default function Brokers() {
  return <RolePage config={config} />;
}
