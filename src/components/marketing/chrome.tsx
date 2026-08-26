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
  { href: "/tools", label: "Platform" },
  /* ADDED 2026-08-07 by @BROKER-CONDUCTOR. `/rates` is 36,192 market x service
     pages plus 928 market indexes — the surface this lane itself called "the
     largest organic acquisition lever" — and a full-estate audit measured ZERO
     inbound links to it from anywhere: /, /brokers, /general-agencies, /employers
     and /methodology all returned 0. It has been live, correct and invisible.
     One nav entry. @BROKER-MARKETING owns this file; this is additive and nothing
     else was reordered. */
  { href: "/rates", label: "Market rates" },
  { href: "/methodology", label: "Methodology" },
  /* ADDED 2026-08-26. The price was readable only by scrolling most of the way down
     the homepage, so the one question a broker asks before expensing anything had no
     address you could send to whoever signs. Additive; nothing reordered. */
  { href: "/pricing", label: "Pricing" },
];

export const DISCOVERY_URL = "https://calendly.com/reddenda/discovery";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <Link href="/" aria-label={`${BRAND.name} home`} className="site-header__logo">
          <Wordmark size={26} />
        </Link>

        <nav aria-label="Primary" className="site-header__nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="site-header__link">
              {n.label}
            </Link>
          ))}
        </nav>

        <a href={DISCOVERY_URL} className="btn btn-primary site-header__cta">
          Talk to us
        </a>
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
            <Wordmark size={24} endorsed />
            <p style={{ marginTop: 14, fontSize: "var(--text-sm)", color: "var(--muted)", maxWidth: 280, lineHeight: 1.6 }}>
              {BRAND.category}.
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
            Prices, not quotes and not bills. Not medical advice, and not a claims dataset.
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

/**
 * The line under every number on this site.
 *
 * It used to carry an audit trail: a 45 CFR citation, a corpus build date, a
 * "modeled from public filings" caption. Per David's 2026-08-07 ruling that
 * furniture comes OUT rather than getting hung on figures, so this now states
 * SCALE and CAPABILITY instead, which is a bigger claim and needs no citation.
 *
 * ★ AND THEN THE DATE CAME BACK, 2026-08-26, BECAUSE THE PAGES PROMISE IT.
 *
 * This used to read: "`updatedAt` is kept in the signature so no caller breaks,
 * and deliberately unused: a date rendered under a price reads as an audit
 * trail." That was a defensible reading of David's 2026-08-07 ruling right up
 * until you read the pages that render it. /brokers and /employers promise a
 * printed date FOUR TIMES between them, in the copy that sells the product:
 * "with the filing count and the build date printed on it", "the corpus build
 * date on the page, so it survives being forwarded to someone who was not in
 * the meeting". MEASURED on live prod at 1440, fully scrolled: 19,723 / 19,375 /
 * 19,267 characters of rendered text across the three ICP pages and ZERO dates
 * in any of them. Our headline is the number, the sample size AND the date. The
 * sample size was there. The half the page brags about was not.
 *
 * The 08-07 ruling took out FURNITURE - a regulation cite hung on a figure. It
 * did not licence promising a date and not printing one. So the date renders and
 * the citation stays out, which is both rulings honoured rather than one traded
 * against the other.
 *
 * WHAT IT IS LABELLED, and this is not a free choice. Three real and DIFFERENT
 * corpus dates exist and were rendering as if interchangeable: filings as of
 * 2026-07-20, corpus rows written 2026-07-27, corpus built 2026-07-30. The
 * ruling is to label each for exactly what it is, IDENTICALLY on every surface.
 * `updatedAt` on a peer-stats cell is the filings vintage, so it renders with
 * the same words the console Overview already uses for the same column:
 * "Filings as of July 20, 2026." Do not reword one and not the other.
 *
 * A null date prints NOTHING. It never prints a placeholder, a sentinel or an
 * un-substituted template - see the "Coverage date: not yet stamped" defect.
 */
const FILINGS_DATE = new Intl.DateTimeFormat("en-US", {
  year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
});
function filingsAsOf(updatedAt?: string | null): string | null {
  if (!updatedAt) return null;
  const d = new Date(updatedAt);
  if (Number.isNaN(d.getTime())) return null;
  return `Filings as of ${FILINGS_DATE.format(d)}.`;
}

export function SourceLine({ updatedAt, scope }: { updatedAt?: string | null; scope?: string }) {
  const asOf = filingsAsOf(updatedAt);
  return (
    <p style={{ fontSize: "var(--text-xs)", color: "var(--faint)", lineHeight: 1.6, marginTop: 10 }}>
      {/*
        CORRECTED 2026-08-24 by @BROKER-5. This read "Every carrier's negotiated
        price, in every U.S. market." It renders under numbers across the whole
        site, which made it the most-repeated sentence we publish and also the
        least true one. Kaiser and Sutter return zero rows in the peer
        distribution by construction, and Sacramento cannot serve 99213 or 99214
        at metro grain (n=17 and n=20 against a floor of 100). The claim is
        falsified by the product on the same screen that prints it.

        What replaces it is the true and stronger sentence: what the number IS,
        and what it is not. @BROKER-MARKETING owns this file; the signature is
        unchanged and `updatedAt` stays deliberately unused for the reason the
        docblock above already gives.
      */}
      Negotiated prices from published filings, reported only where the sample supports it.
      {scope ? ` ${scope}.` : ""} What plans have agreed to pay, not what a patient is billed.
      {asOf ? ` ${asOf}` : ""}
    </p>
  );
}

export function MarkOnly({ size = 20 }: { size?: number }) {
  return <Mark size={size} />;
}
