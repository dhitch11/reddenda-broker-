"use client";

import type { CleanCell } from "@/lib/honesty";
import s from "./Distribution.module.css";

/**
 * The distribution bar.
 *
 * This is the one visual that has to work. A benefits professional must feel the
 * spread in under a second, without reading a legend and without being an analyst.
 *
 * Decisions and why:
 *   - Position on a real linear scale, not four equal segments. A p75 that sits far
 *     right MUST look far right. Equal segments would flatten the whole point.
 *   - Every marker is labelled with its value. Never hover-only. A broker showing
 *     this on a screen share cannot hover on behalf of their audience.
 *   - Meaning never carried by color alone. Every marker carries a text label.
 *   - No count-up animation on the numbers. This sits inside a tool where someone is
 *     reading a figure they will repeat out loud, and animated digits are a defect.
 *   - Below 420px the values move to a stacked grid, because the positioned labels
 *     provably collide at 320. See the module CSS for the measurement.
 */

type Mark = {
  key: string;
  value: number;
  caption: string;
  tone: string;
  primary?: boolean;
};

export function Distribution({
  cell,
  medicare,
  label,
}: {
  cell: CleanCell;
  medicare?: number | null;
  label?: string;
}) {
  // Scale spans the data plus the Medicare anchor when it falls outside, so the
  // anchor is never clipped off the end of the track.
  const hi = Math.max(cell.p90 ?? cell.p75, cell.p75, medicare ?? 0);
  const lo = Math.min(cell.p25, medicare ?? cell.p25);
  const span = hi - lo || 1;
  const pos = (v: number) => Math.max(0, Math.min(100, ((v - lo) / span) * 100));

  const marks: Mark[] = [
    { key: "p25", value: cell.p25, caption: "25th", tone: "var(--dist-25)" },
    { key: "p50", value: cell.p50, caption: "Median", tone: "var(--dist-50)", primary: true },
    { key: "p75", value: cell.p75, caption: "75th", tone: "var(--dist-75)" },
    ...(cell.p90 != null
      ? [{ key: "p90", value: cell.p90, caption: "90th", tone: "var(--dist-90)" }]
      : []),
  ];

  return (
    <figure className={s.wrap} aria-label={label ?? "Price distribution"}>
      <div className={s.track}>
        {/* The filled span from 25th to 75th: where the middle half of the market sits. */}
        <div
          className={s.fill}
          style={{
            left: `${pos(cell.p25)}%`,
            width: `${pos(cell.p75) - pos(cell.p25)}%`,
          }}
        />

        {medicare != null && (
          <div className={s.medicare} style={{ left: `${pos(medicare)}%` }}>
            <span className={s.medicareLabel}>Medicare</span>
          </div>
        )}

        {marks.map((m) => (
          <div key={m.key} className={s.marker} style={{ left: `${pos(m.value)}%` }}>
            <div
              className={`${s.dot} ${m.primary ? s.dotPrimary : ""}`}
              style={m.primary ? undefined : { background: m.tone }}
            />
            <div
              className={s.label}
              style={{ top: m.primary ? 26 : 22, ...edgeAlign(pos(m.value)) }}
            >
              <div className={`num ${m.primary ? s.valuePrimary : s.value}`}>
                {money(m.value)}
              </div>
              <div className={s.caption}>{m.caption}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Narrow-width read. CSS decides which of the two is visible. */}
      <div className={s.stacked}>
        {marks.map((m) => (
          <div key={m.key} className={s.stackedItem}>
            <span className={`num ${m.primary ? s.stackedValue : s.stackedValueMuted}`}>
              {money(m.value)}
            </span>
            <span className={s.stackedCaption}>{m.caption}</span>
          </div>
        ))}
        {medicare != null && (
          <div className={s.stackedItem}>
            <span className={`num ${s.stackedValueMuted}`}>{money(medicare)}</span>
            <span className={s.stackedCaption}>Medicare</span>
          </div>
        )}
      </div>
    </figure>
  );
}

/**
 * Keep a marker's label inside the track's box.
 *
 * The marker is a zero-width point on the track, so the label is placed by how far
 * it is pulled back from that point rather than by anchoring to a container edge.
 * translateX(-100%) puts the label's right edge on the dot, translateX(0) puts its
 * left edge there, and -50% centers it.
 */
function edgeAlign(pct: number): React.CSSProperties {
  if (pct >= 88) return { left: "50%", transform: "translateX(-100%)", textAlign: "right" };
  if (pct <= 12) return { left: "50%", transform: "translateX(0)", textAlign: "left" };
  return { left: "50%", transform: "translateX(-50%)", textAlign: "center" };
}

export function money(v: number | null | undefined): string {
  // En dash, not em. Estate rule 8 bans the em dash in net-new copy and a table
  // null glyph still counts as copy on the page.
  if (v == null) return "\u2013";
  return "$" + Math.round(v).toLocaleString("en-US");
}
