import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/chrome";
import { RateCheck } from "./RateCheck";

export const metadata: Metadata = {
  title: "Rate check",
  description: "What plans have agreed to pay for one procedure in your city. Every carrier, instantly.",
};

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <RateCheck />
      </main>
      <SiteFooter />
    </>
  );
}
