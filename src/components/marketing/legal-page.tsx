import Link from "next/link";
import { SiteHeader, SiteFooter, DISCOVERY_URL } from "./chrome";
import { BRAND } from "./brand";

/**
 * Shared chassis for the legal surfaces.
 *
 * These pages exist because the footer links to them and a link that 404s is a
 * defect, but they are not filler. This audience is regulated and reads them.
 * Everything here is written to be true of what the product actually does today,
 * in the same plain register as the rest of the site. No borrowed boilerplate
 * describing collection we do not perform or rights we do not administer.
 */

export type LegalSection = { h: string; body: string[] };

export function LegalPage({
  title,
  intro,
  updated,
  sections,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <SiteHeader />

      <main>
        <div className="wrap-tight" style={{ paddingTop: "clamp(38px, 6vw, 66px)", paddingBottom: 60 }}>
          <p className="eyebrow">{BRAND.name}</p>
          <h1 className="display" style={{ fontSize: "var(--display-sm)", marginTop: 12, maxWidth: "20ch" }}>
            {title}
          </h1>
          <p className="lede" style={{ marginTop: 16, maxWidth: "62ch" }}>
            {intro}
          </p>
          <p className="num" style={{ marginTop: 14, fontSize: "var(--text-xs)", color: "var(--faint)" }}>
            Last updated {updated}
          </p>

          <div style={{ marginTop: 8 }}>
            {sections.map((s) => (
              <section key={s.h} style={{ marginTop: 34 }}>
                <h2 className="display" style={{ fontSize: "var(--text-lg)", maxWidth: "30ch" }}>
                  {s.h}
                </h2>
                {s.body.map((p, i) => (
                  <p
                    key={i}
                    style={{
                      marginTop: 10,
                      fontSize: "var(--text-base)",
                      lineHeight: 1.75,
                      color: "var(--body)",
                      maxWidth: "68ch",
                    }}
                  >
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <div
            className="card"
            style={{ marginTop: 44, background: "var(--band)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}
          >
            <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", maxWidth: "46ch", lineHeight: 1.65 }}>
              If anything here is unclear, or you need a written answer for your own compliance file, ask us
              directly and we will put it in writing.
            </p>
            <span style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={DISCOVERY_URL} className="btn btn-primary">
                Book a call
              </a>
              <Link href="/methodology" className="btn btn-secondary">
                Methodology
              </Link>
            </span>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
