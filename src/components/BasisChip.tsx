// BasisChip - THE ONE rate-basis affordance (David ruling 2026-08-10).
// Every displayed percentile / contracted rate carries a plain-language basis chip + sample size, driven
// by the REAL per-row basis (never a constant). The LOGIC is byte-identical to the app's src/lib/basis.ts
// (shared confidenceFor + BASIS_META + summarize); only the skin differs, because the broker is its own
// design system (light-theme only, the CSS tokens in globals.css section 2) rather than the app's Tailwind.
// The estate's constant-label bug (an Idaho provider told "local" when all cells were national) is exactly
// what a data-driven chip prevents: it renders only what `basis` says.
//
//   <BasisChip basis="localized_estimate" n={412} confidence="moderate" scaleFactor={0.94} />
//
// No "use client": this is a pure presentational component, so it renders inside the server-rendered
// marketing surfaces (rate-panel) and the client tools (RateCheck) alike.

import { type CSSProperties } from "react";
import { BASIS_META, summarize, type Basis, type BasisMeta, type BasisSummary, type Confidence } from "@/lib/basis";

export type BasisChipProps = {
  basis: Basis;
  /** Peer sample size of the rung that produced the number. Omitted from the chip only when unknown. */
  n?: number | null;
  confidence: Confidence;
  /** Only meaningful for localized_estimate; shown in the tooltip so the adjustment is never hidden. */
  scaleFactor?: number;
  className?: string;
  style?: CSSProperties;
};

/**
 * Tone -> broker CSS tokens (globals.css section 2, light-theme only). Same five semantic tones the app
 * maps to Tailwind classes, re-skinned onto this site's palette so a rate reads the same everywhere:
 *   positive = the strongest real local number  · info = a real number adjusted to this metro
 *   neutral  = statewide, honest and unglamorous · muted = national floor (reads as "less than local")
 *   demo     = dashed, distinct from every real state so a modeled cell can never pass as measured.
 */
const TONE: Record<BasisMeta["tone"], { color: string; bg: string; border: string; dashed?: boolean }> = {
  positive: { color: "var(--efficient)", bg: "var(--efficient-wash)", border: "var(--efficient)" },
  info: { color: "var(--teal-deep)", bg: "var(--teal-wash)", border: "var(--teal)" },
  neutral: { color: "var(--muted)", bg: "var(--band)", border: "var(--hair-strong)" },
  muted: { color: "var(--spread)", bg: "var(--spread-wash)", border: "var(--spread)" },
  demo: { color: "var(--locked)", bg: "var(--locked-wash)", border: "var(--locked)", dashed: true },
};

export function BasisChip({ basis, n, confidence, scaleFactor, className, style }: BasisChipProps) {
  const meta = BASIS_META[basis];
  const tone = TONE[meta.tone];
  const thin = confidence === "thin";
  const nStr = typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en-US") : null;
  const tip =
    meta.tooltip +
    (basis === "localized_estimate" && scaleFactor ? ` (x${scaleFactor.toFixed(2)})` : "") +
    (nStr ? ` Peer sample n=${nStr}.` : "") +
    (thin ? " Limited sample: read as directional." : "");

  return (
    <span
      title={tip}
      className={className}
      style={{
        display: "inline-flex",
        maxWidth: "100%",
        minWidth: 0,
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: "var(--pill)",
        border: `1px solid ${tone.border}`,
        borderStyle: tone.dashed ? "dashed" : "solid",
        background: tone.bg,
        color: tone.color,
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: 11,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        lineHeight: 1.3,
        opacity: thin ? 0.82 : 1,
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", flex: "none", opacity: 0.75 }}
      />
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{meta.label}</span>
      {nStr && <span style={{ flex: "none", opacity: 0.72 }}>· n={nStr}</span>}
      {thin && <span style={{ flex: "none", opacity: 0.85 }}>· limited sample</span>}
    </span>
  );
}

// The weakest (most conservative) confidence in a set, so a header chip never reads stronger than the
// thinnest row it summarizes. thin beats moderate beats high.
function weakestConfidence(cs: Confidence[]): Confidence {
  if (cs.some((c) => c === "thin")) return "thin";
  if (cs.some((c) => c === "moderate")) return "moderate";
  return "high";
}

/**
 * HeaderBasisChip - the aggregate chip for a table whose rows can differ in basis (the FLINCH table, the
 * peer-market table, the per-payer table). It renders summarize()'s DOMINANT basis (the most common one,
 * never the single strongest row, so 19 national + 1 local never headlines "Local"), plus the local mix
 * when it is genuinely mixed. Per-row n stays on the per-row chips, so this one omits n. Its confidence is
 * the weakest among the dominant-basis rows, so the header never overstates certainty. Pass the FOUND rows
 * only: each row is { basis, confidence } read from that row's real CellBasis, never a constant.
 */
export function HeaderBasisChip({
  rows,
  className,
  style,
}: {
  rows: { basis: Basis; confidence: Confidence }[];
  className?: string;
  style?: CSSProperties;
}) {
  if (!rows.length) return null;
  const summary: BasisSummary = summarize(rows);
  const dominantRows = rows.filter((r) => r.basis === summary.dominantBasis);
  const confidence = weakestConfidence(dominantRows.map((r) => r.confidence));
  const mixed = summary.localCells > 0 && summary.localCells < summary.totalCells;
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", ...style }}
    >
      <BasisChip basis={summary.dominantBasis} confidence={confidence} />
      {mixed && (
        <span style={{ fontFamily: "var(--font-mono), ui-monospace, monospace", fontSize: 11, color: "var(--faint)" }}>
          {summary.localCells} of {summary.totalCells} measured locally
        </span>
      )}
    </span>
  );
}
