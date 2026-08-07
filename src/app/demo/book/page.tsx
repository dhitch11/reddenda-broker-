import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/chrome";
import { loadDemoData, isDemoMode, DEMO_BANNER } from "@/demo";
import { BookScan } from "./BookScan";

export const metadata: Metadata = { title: "Book scan (demo environment)", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function Page() {
  if (!isDemoMode()) {
    return (
      <>
        <SiteHeader />
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Demo environment is off</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
            This surface reads a synthetic fixture and is only available when the demo environment is
            explicitly enabled. Nothing here is real contracted rate data, which is exactly why it does not
            load by default.
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }
  const d = loadDemoData();
  return (
    <>
      <SiteHeader />
      <main>
        <BookScan book={d.ga_book} groups={d.employer_groups} banner={DEMO_BANNER} />
      </main>
      <SiteFooter />
    </>
  );
}
