import Link from "next/link";
import { BRAND, Wordmark, Mark } from "./brand";

/**
 * Site chrome.
 *
 * The header is deliberately quiet. This audience judges seriousness in the first
 * second and a loud nav bar reads as a startup landing page. Five links, one CTA,
 * no dropdowns, no announcement bar.
 *
 * A discovery call CTA is present on every surface and is never the only path
 * forward. That is an estate rule, not a preference.
 */

const NAV = [
  { href: "/brokers", label: "Brokers" },
  { href: "/general-agencies", label: "General agencies" },
  { href: "/employers", label: "Employers" },
  { href: "/methodology", label: "Methodology" },
];

export const DISCOVERY_URL = "https://calendly.com/reddenda/discovery";

export function SiteHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(255,255,255,.88)",
        backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)",
        borderBottom: "1px solid var(--hair)",
      }}
    >
      <div
        className="wrap"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          minHeight: 64,
        }}
      >
        <Link href="/" aria-label={`${BRAND.name} home`} style={{ flex: "none" }}>
          <Wordmark size={26} />
        </Link>

        <nav
          aria-label="Primary"
          style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}
        >
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              style={{
                padding: "8px 12px",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: "var(--muted)",
                borderRadius: "var(--r-xs)",
                whiteSpace: "nowrap",
              }}
            >
              {n.label}
            </Link>
          ))}
          <a
            href={DISCOVERY_URL}
            className="btn btn-primary"
            style={{ padding: "9px 16px", fontSize: "var(--text-sm)", marginLeft: 6 }}
          >
            Talk to us
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--hair)", background: "var(--band)", marginTop: 96 }}>
      <div className="wrap" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div
          style={{
            display: "grid",
            gap: 32,
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            alignItems: "start",
          }}
        >
          <div>
            <Wordmark size={24} />
            <p style={{ marginTop: 14, fontSize: "var(--text-sm)", color: "var(--muted)", maxWidth: 280, lineHeight: 1.6 }}>
              {BRAND.category}. A {BRAND.parent} product.
            </p>
          </div>

          <FooterCol
            title="Who it is for"
            links={[
              { href: "/brokers", label: "Brokers" },
              { href: "/general-agencies", label: "General agencies" },
              { href: "/employers", label: "Self-funded employers" },
            ]}
          />
          <FooterCol
            title="The data"
            links={[
              { href: "/methodology", label: "Methodology" },
              { href: "/methodology#sources", label: "Sources" },
              { href: "/methodology#limits", label: "What we do not have" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { href: DISCOVERY_URL, label: "Book a call" },
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
            ]}
          />
        </div>

        <div
          style={{
            marginTop: 40,
            paddingTop: 22,
            borderTop: "1px solid var(--hair-strong)",
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "var(--text-xs)",
            color: "var(--faint)",
          }}
        >
          <span>
            Price data modeled from public federal filings. Not a guaranteed rate, not medical advice, and
            not a claims dataset.
          </span>
          <span className="num">No PHI. Ever.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10.5,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "var(--track-eyebrow)",
          color: "var(--faint)",
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 9 }}>
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Small provenance line. Every number on this site sits above one of these. */
export function SourceLine({ updatedAt, scope }: { updatedAt?: string | null; scope?: string }) {
  const date = updatedAt ? new Date(updatedAt) : null;
  const stamp =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : null;

  return (
    <p style={{ fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.6, marginTop: 10 }}>
      Source: Transparency in Coverage filings, 45 CFR 147.212.
      {scope ? ` ${scope}.` : ""}
      {stamp ? ` Corpus built ${stamp}.` : ""} Modeled from public filings, not a guaranteed rate.
    </p>
  );
}

export function MarkOnly({ size = 20 }: { size?: number }) {
  return <Mark size={size} />;
}
