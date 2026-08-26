import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/chrome";
import { RateCheck } from "./RateCheck";

export const metadata: Metadata = {
  title: "Rate check",
  description: "What plans have agreed to pay for one procedure in your city, from the carriers that filed, with the sample size on every number.",
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
