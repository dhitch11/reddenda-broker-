import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/marketing/legal-page";
import { BRAND } from "@/components/marketing/brand";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What this product holds and what it does not. There is no protected health information in it, and no path by which any could enter.",
};

const sections: LegalSection[] = [
  {
    h: "There is no protected health information in this product",
    body: [
      "This is the most important sentence on the page, so it is first. We hold prices that health plans have contracted to pay providers, published by those plans under a federal transparency rule. We do not hold claims, enrollment, eligibility, diagnoses, treatment records, or any information about any individual patient.",
      "There is no path by which protected health information could enter this product, because we never ingest a source that contains any. We are not a covered entity and we are not acting as a business associate. If a vendor in this category asks you to send member level data, that is a materially different product from this one.",
    ],
  },
  {
    h: "You do not need an account to see a number",
    body: [
      "The market lookup on this site works without signing in and without giving us an email address. We do that deliberately, because a gate placed in front of proof is a reason to distrust the proof.",
      "The service and market you select travel in the page address, which is what makes a result shareable. Those are procedure and geography selections. They are not information about you or about any patient.",
    ],
  },
  {
    h: "What we collect when you contact us",
    body: [
      "If you book a call or write to us, we hold what you send: your name, your business contact details, and the substance of the conversation, so that we can follow up and so that our own records are accurate. We use it to talk to you about this product. We do not sell it.",
      "Scheduling is handled by a third-party booking tool, and what you enter into that tool is also held by that provider under its own terms.",
    ],
  },
  {
    h: "Operational data",
    body: [
      "Our servers keep ordinary technical logs of requests, which is how any hosted service is operated and secured. We do not run third-party advertising trackers on this site and we do not build advertising profiles.",
    ],
  },
  {
    h: "Retention and access",
    body: [
      "We keep business contact information for as long as we have a live relationship or a reasonable prospect of one, and we remove it on request. Write to us and we will tell you exactly what we hold about you and delete it if you ask.",
    ],
  },
  {
    h: "Who operates this",
    body: [
      `${BRAND.name} is operated by ${BRAND.parent}, a TwinFlame Group company. The rate platform behind it is the same one that serves our provider-side products, and the underlying corpus is built from public federal filings rather than from any customer's data.`,
    ],
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy"
      intro="Short, because there is not much to say. This product is built from public federal filings, not from anybody's members."
      updated="August 6, 2026"
      sections={sections}
    />
  );
}
