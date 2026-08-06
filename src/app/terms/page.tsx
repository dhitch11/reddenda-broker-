import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/marketing/legal-page";
import { BRAND } from "@/components/marketing/brand";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "What the figures on this site are, what they are not, and the limits of what you should rely on them for.",
};

const sections: LegalSection[] = [
  {
    h: "What a figure on this site is",
    body: [
      "A distribution of negotiated rates for one procedure code in one market, computed from machine-readable files that health plans publish under the federal Transparency in Coverage rule, 45 CFR 147.212. Every figure carries its scope, its filing count and the date the corpus was built.",
      "It is a measurement of what plans have contracted to pay. It is not a quote, not an offer, not a prediction of your renewal, and not a guarantee that any particular party will pay any particular amount.",
    ],
  },
  {
    h: "What it is not, and what you should not rely on it for",
    body: [
      "This is price data only. We hold no claims and no utilization, so nothing here can tell you what a population will spend. Any spend projection built on price alone rests on an assumption about volume that we have not made and cannot support.",
      `Nothing on this site is legal, actuarial, tax, medical or benefits advice, and using ${BRAND.name} does not by itself discharge any duty you may owe to anyone. We are a data source. Decisions, and the professional judgment behind them, remain yours.`,
    ],
  },
  {
    h: "Accuracy, and how we handle the limits of it",
    body: [
      "The underlying filings are produced by third parties and contain known defects, including rows that are not dollar amounts, rosters that do not perfectly reflect who is contracted, and rates for services a provider may not perform. Our methodology page describes what we filter and why.",
      "Where the filings do not support a defensible figure we publish nothing and say so, rather than publishing an estimate. We do not warrant that the underlying filings are complete or correct, because they are not ours. We do warrant that we will not invent a number to fill a gap in them.",
    ],
  },
  {
    h: "Acceptable use",
    body: [
      "Use the figures in your own work, including in materials you give to your clients, and we would prefer you carry the source line with them. Do not scrape the site or attempt to reconstruct the underlying corpus in bulk, and do not remove or alter provenance from an artifact you pass on.",
      "Do not present a figure from this site as a quote, as a guarantee, or as anything other than what the source line says it is.",
    ],
  },
  {
    h: "Availability",
    body: [
      "This surface is under active development and access is currently limited. Content, coverage and packaging will change. Where a market or service is not yet available you will see an explicit statement to that effect rather than an empty screen.",
    ],
  },
  {
    h: "Who you are contracting with",
    body: [
      `${BRAND.name} is operated by ${BRAND.parent}, a TwinFlame Group company. For anything requiring a written commitment, including a data use question from your own compliance team, contact us and we will answer in writing rather than by pointing at this page.`,
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms"
      intro="What the numbers are, what they are not, and where our responsibility begins and ends."
      updated="August 6, 2026"
      sections={sections}
    />
  );
}
