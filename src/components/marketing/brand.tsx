/**
 * THE MARK AND THE WORDMARK
 *
 * THE NAME IS REDDENDA. Ruled by David and re-bound by BUILD-ORDERS v3
 * (2026-08-24): "Brand is Reddenda." This replaces the 2026-08-06 working mark
 * "Censenda", which was a separate name on a reddenda.com domain and required a
 * bridge line to explain itself. One estate, one name. The broker product is
 * Reddenda for benefits professionals, served at broker.reddenda.com and
 * continuing into the operator console at app.reddenda.com/broker.
 *
 * Every name string on the site resolves through BRAND below, so a rename is one
 * edit in one file and never a search-and-replace across pages.
 *
 * THE MARK
 * No cross, no heartbeat, no stethoscope, no swoosh. Health iconography would put
 * us in the consumer category this audience distrusts, and it would say nothing
 * true about the product.
 *
 * The mark is the product's own data object: a distribution. A hairline rule for
 * the full observed range, end caps at the extremes, a weighted bar across the
 * interquartile range, and a median tick. It is the compact strip that appears on
 * every row of every tool we ship, drawn once at brand scale.
 *
 * EVERY var() CARRIES A HEX FALLBACK. Without one the mark cannot leave the app:
 * pasted into an email, a PDF, an export or any context with no :root tokens,
 * every stroke and fill resolves to nothing and the logo renders invisible.
 *
 * The median sits left of centre on purpose. Real healthcare price distributions
 * are right-skewed: the mean is dragged by a long expensive tail, which is the
 * single fact this company exists to make visible. The logo is a true chart.
 */

export const BRAND = {
  /** Ruled by David; re-bound by BUILD-ORDERS v3, 2026-08-24. */
  name: "Reddenda",
  /** The product line inside the estate. Used where the surface matters. */
  parent: "Reddenda",
  /** The line under the wordmark. States what the data actually is. */
  endorsement: "Healthcare Intelligence Infrastructure",
  /** One line, under 60 characters, for the header and the document footer. */
  tagline: "We print the number",
  /** The category we are naming, used in metadata and the methodology page. */
  category: "Rate intelligence for self-funded employer groups and the brokers who advise them",
} as const;

export function Mark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* full observed range */}
      <line x1="3" y1="16" x2="29" y2="16" stroke="var(--hair-strong, #D6DADC)" strokeWidth="1.5" strokeLinecap="round" />
      {/* extremes */}
      <line x1="3" y1="11" x2="3" y2="21" stroke="var(--ghost, #8A9096)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="11" x2="29" y2="21" stroke="var(--ghost, #8A9096)" strokeWidth="1.5" strokeLinecap="round" />
      {/* interquartile range, the part of the market that is actually competitive */}
      <rect x="7" y="12" width="12" height="8" rx="2.5" fill="var(--teal, #0FB5A6)" />
      {/* the median, left of centre because the distribution is right-skewed */}
      <line x1="11.5" y1="10.5" x2="11.5" y2="21.5" stroke="var(--teal-deep, #077A70)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The wordmark.
 *
 * One word, so it is set as one word. A two-part lockup coloured across a seam
 * would be decoration rather than structure, and Reddenda has no seam.
 *
 * `endorsed` prints the platform line beneath. Use it where a visitor first meets
 * the brand, which today is the footer. The header stays clean.
 */
export function Wordmark({
  size = 28,
  muted = false,
  endorsed = false,
}: {
  size?: number;
  muted?: boolean;
  endorsed?: boolean;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <Mark size={size} />
      <span style={{ display: "grid", gap: 1 }}>
        <span
          className="display"
          style={{
            fontSize: Math.round(size * 0.62),
            fontWeight: 700,
            letterSpacing: "-0.022em",
            color: muted ? "var(--muted)" : "var(--ink)",
            whiteSpace: "nowrap",
            lineHeight: 1.1,
          }}
        >
          {BRAND.name}
        </span>
        {endorsed && (
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9.5,
              letterSpacing: ".05em",
              color: "var(--faint)",
              whiteSpace: "nowrap",
            }}
          >
            {BRAND.endorsement}
          </span>
        )}
      </span>
    </span>
  );
}
