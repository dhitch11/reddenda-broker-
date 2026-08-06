import { SiteHeader, SiteFooter } from "@/components/marketing/chrome";
import { SiteOfService } from "./SiteOfService";

export const metadata = {
  title: "Site of service · what the same procedure costs in three places",
  description:
    "Office, surgery centre and hospital outpatient totals for the same procedure, on the federal fee schedules. Where Medicare does not price a site separately we publish nothing for it.",
};

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <section style={{ paddingTop: "clamp(32px, 5vw, 56px)", paddingBottom: "clamp(40px, 6vw, 72px)" }}>
          <div className="wrap">
            <div style={{ maxWidth: 720 }}>
              <p className="eyebrow">
                <span className="chip-dot" style={{ display: "inline-block", marginRight: 8, verticalAlign: "middle" }} />
                Federal fee schedules · 2026
              </p>
              <h1 className="display" style={{ fontSize: "var(--display)", marginTop: 14, maxWidth: "18ch" }}>
                The same procedure, three places, three prices.
              </h1>
              <p className="lede" style={{ marginTop: 18, maxWidth: "60ch" }}>
                Where care happens changes what it costs more than almost anything else a plan controls.
                The physician bills the same either way. The building does not. Pick a procedure and see
                all three totals, with the facility fee shown rather than assumed.
              </p>
            </div>

            <div style={{ marginTop: 26, maxWidth: 880 }}>
              <SiteOfService />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
