/**
 * THE MARK AND THE WORDMARK
 *
 * THE NAME IS CENSENDA. David ruled it 2026-08-06, replacing the working mark
 * "Reddenda Broker". Latin `censeo`: to assess, to appraise, to rate, to value —
 * the verb behind `census`, which is the first word in every group quote this
 * audience writes. Verified before adoption: censenda.com free, ZERO trademark
 * registrations worldwide, GitHub/X/LinkedIn handles free.
 *
 * The site is served from broker.reddenda.com for now, which is deliberate and
 * not a contradiction: the URL is the parent estate's, the brand is Censenda.
 * `parent` below carries that relationship so the bridge is stated in the UI
 * rather than left for a visitor to puzzle out.
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
  /** Ruled by David 2026-08-06. */
  name: "Censenda",
  /** Used where the parent relationship matters. */
  parent: "Reddenda",
  /** The bridge line. The URL says reddenda, the brand says Censenda; this states why. */
  endorsement: "Built on the Reddenda rate platform",
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
 * One word, so it is set as one word. The earlier lockup split a two-part working
 * mark across two colours; Censenda has no seam to colour and faking one would be
 * decoration rather than structure.
 *
 * `endorsed` prints the parent-platform line beneath. Use it where a visitor first
 * meets the brand and the reddenda.com URL in the address bar needs explaining,
 * which today is the footer. The header stays clean.
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
