/**
 * THE MARK AND THE WORDMARK
 *
 * The name is NOT final. David is registering a domain and the working mark is
 * "Reddenda Broker". Every name string on the site resolves through BRAND below,
 * so a rename is one edit in one file and never a search-and-replace across pages.
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
 * The median sits left of centre on purpose. Real healthcare price distributions
 * are right-skewed: the mean is dragged by a long expensive tail, which is the
 * single fact this company exists to make visible. The logo is a true chart.
 */

export const BRAND = {
  /** Working mark. Not final. */
  name: "Reddenda Broker",
  /** Used where the parent relationship matters. */
  parent: "Reddenda",
  /** One line, under 60 characters, for the header and the document footer. */
  tagline: "Know what the market pays",
  /** The category we are naming, used in metadata and the methodology page. */
  category: "Healthcare price intelligence for benefits professionals",
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
      <line x1="3" y1="16" x2="29" y2="16" stroke="var(--hair-strong)" strokeWidth="1.5" strokeLinecap="round" />
      {/* extremes */}
      <line x1="3" y1="11" x2="3" y2="21" stroke="var(--ghost)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="11" x2="29" y2="21" stroke="var(--ghost)" strokeWidth="1.5" strokeLinecap="round" />
      {/* interquartile range, the part of the market that is actually competitive */}
      <rect x="7" y="12" width="12" height="8" rx="2.5" fill="var(--teal)" />
      {/* the median, left of centre because the distribution is right-skewed */}
      <line x1="11.5" y1="10.5" x2="11.5" y2="21.5" stroke="var(--teal-deep)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ size = 28, muted = false }: { size?: number; muted?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <Mark size={size} />
      <span
        className="display"
        style={{
          fontSize: Math.round(size * 0.62),
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: muted ? "var(--muted)" : "var(--ink)",
          whiteSpace: "nowrap",
        }}
      >
        {BRAND.parent}
        <span style={{ color: "var(--teal-deep)", fontWeight: 600 }}> Broker</span>
      </span>
    </span>
  );
}
