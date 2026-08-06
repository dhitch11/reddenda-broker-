import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/chrome";
import { MarketBrief } from "./MarketBrief";

export const metadata: Metadata = {
  title: "Market brief",
  description:
    "Every service we hold for one metro, ranked by how far apart the cheap and expensive options are.",
};

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <MarketBrief />
      </main>
      <SiteFooter />
    </>
  );
}
