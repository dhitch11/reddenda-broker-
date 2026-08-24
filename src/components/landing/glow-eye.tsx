/**
 * THE MARK. An eye inside a ring, glowing.
 *
 * Ordered by David 2026-08-24 (BUILD-ORDERS v3 section 6): one shared eye-in-a-
 * glowing-circle marker on every tool, the door, the console rail and the
 * marketing hero. @BROKER-4 owns the canonical component in the app repo at
 * `src/components/broker/GlowEye.tsx`. THIS IS THE MIRROR for reddenda-broker.
 *
 * ═══ THE GEOMETRY IS THE CONTRACT. DO NOT DRIFT IT. ═══════════════════════════
 * Two files in two repos have to draw the same mark, and the only way that
 * survives contact with two lanes is for the numbers to be written down:
 *
 *   viewBox      0 0 48 48
 *   ring         circle, centre 24,24, r 21, stroke 1.5
 *   eye          two mirrored quadratic arcs, span x 9 to 39, apex offset 10.5
 *   iris         circle, centre 24,24, r 6.2
 *   pupil        circle, centre 24,24, r 2.4, solid
 *   highlight    circle, centre 26.4,21.6, r 1.15
 *
 * A mark that is 1px different between the marketing site and the console reads
 * as two companies. If either side changes, both change, in the same hour.
 *
 * ═══ WHY IT IS AN EYE AND NOT A CHART ════════════════════════════════════════
 * The wordmark is already a distribution, drawn at brand scale in brand.tsx. The
 * eye is the other half of the same sentence: the distribution is what we hold,
 * the eye is what we do with it. It marks a surface where a number is being
 * LOOKED AT rather than asserted, which is the product.
 *
 * ═══ MOTION ═════════════════════════════════════════════════════════════════
 * The glow is one animated element and it moves on OPACITY AND TRANSFORM ONLY.
 * Nothing here animates a filter, a radius, a stroke width or a colour stop:
 * those repaint on the main thread and this mark sits in a hero that has to hold
 * 60fps on a phone on conference wifi. `prefers-reduced-motion` stops it dead
 * rather than compressing it, because a pulse compressed to a millisecond is
 * still a pulse, just an ugly one.
 *
 * The glow is drawn as a real SVG element rather than a CSS box-shadow so the
 * mark survives being pasted into an email, a PDF or an export, exactly like the
 * wordmark's hex fallbacks in brand.tsx. Nothing about this file depends on a
 * :root token existing.
 */

export function GlowEye({
  size = 44,
  title,
  className,
  still = false,
}: {
  size?: number;
  /** Give it a title only where it carries meaning alone. Otherwise it is decorative. */
  title?: string;
  className?: string;
  /** Hard off switch for contexts that must not animate, such as an OG image. */
  still?: boolean;
}) {
  const id = title ? `glow-eye-${title.replace(/\W+/g, "-").toLowerCase()}` : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-labelledby={id}
      focusable="false"
      style={{ overflow: "visible" }}
    >
      {title && <title id={id}>{title}</title>}

      <defs>
        <radialGradient id="ge-halo" cx="50%" cy="50%" r="50%">
          <stop offset="45%" stopColor="#14E09A" stopOpacity="0" />
          <stop offset="78%" stopColor="#14E09A" stopOpacity=".45" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ge-ring" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14E09A" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
      </defs>

      {/* The glow. One element, opacity and scale only. */}
      <circle cx="24" cy="24" r="23" fill="url(#ge-halo)" className={still ? undefined : "ge-halo"} />

      {/* The ring. */}
      <circle cx="24" cy="24" r="21" stroke="url(#ge-ring)" strokeWidth="1.5" />

      {/* The eye: two mirrored arcs meeting at 9,24 and 39,24. */}
      <path
        d="M9 24 Q24 13.5 39 24 Q24 34.5 9 24 Z"
        stroke="url(#ge-ring)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />

      <circle cx="24" cy="24" r="6.2" stroke="url(#ge-ring)" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="24" r="2.4" fill="#14E09A" />
      <circle cx="26.4" cy="21.6" r="1.15" fill="#C9FFF6" />
    </svg>
  );
}
