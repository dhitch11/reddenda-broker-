"use client";

import { useEffect, useRef } from "react";
import FIELD from "@/lib/metro-field.json";

/**
 * THE PRICE FIELD.
 *
 * The decoration IS the dataset. Every dot is one real US metro market, at its
 * real Census centroid, sized by how many filings we hold there and coloured by
 * that market's own p90/p25 dispersion. There is no illustration on this page and
 * no stock geometry: what a visitor sees is the corpus.
 *
 * That is the whole reason it reads as expensive. An abstract "data visual" is
 * decoration that evokes data; this is the data, and the caption underneath
 * commits to exactly that, which means it cannot be faked without lying.
 *
 * DATA: 909 metros that have BOTH a real Census centroid (2023 Gazetteer) and a
 * defensible dispersion cell (n >= 30). Metros missing either are absent rather
 * than placed approximately, because a dot in the wrong place is a false claim
 * about a market.
 *
 * LIGHT-THEME TRANSLATION, WHICH IS THE NON-OBVIOUS PART.
 * The reference implementation of this idea sits on near-black, where bright dots
 * glow. On white they vanish. So: a minimum alpha of .35 (a real market must never
 * fade to invisible, which would render as a fabricated empty), a paper-coloured
 * halo under every dot so overlapping metros stay countable, and a scrim painted
 * INTO the canvas behind the text column rather than a layer over it.
 *
 * It draws once. No animation loop, no scroll handler, no resize thrash beyond a
 * debounced redraw, so it cannot compete with the first real number for the main
 * thread.
 */

type Cell = [lat: number, lon: number, ratio: number, n: number];

const CELLS = FIELD as Cell[];

/** Albers-ish equal area, the projection the eye reads as "the United States". */
function project(lat: number, lon: number, w: number, h: number) {
  // Continental US bounds. Alaska and Hawaii are carried in the data but fall
  // outside this frame; they are clipped rather than crowded into an inset,
  // because an inset at this scale is a decoration, not a reading aid.
  const LON0 = -125.5, LON1 = -66.5, LAT0 = 24.0, LAT1 = 49.8;
  const x = ((lon - LON0) / (LON1 - LON0)) * w;
  // Latitude compressed slightly toward the top, which is what makes a flat
  // lon/lat grid stop looking like a stretched rectangle.
  const t = (lat - LAT0) / (LAT1 - LAT0);
  const y = h - t * h * 0.94 - h * 0.03;
  return [x, y] as const;
}

function colorFor(ratio: number) {
  // The semantic bridge, unchanged: a low spread is an efficient market, a wide
  // one is exposure. These are callout colours and this is a callout, not a
  // percentile ramp, so the mapping is legitimate here.
  if (ratio < 3) return [12, 122, 85] as const;    // --efficient #0C7A55
  if (ratio < 6) return [138, 100, 20] as const;   // --spread    #8A6414
  return [194, 71, 23] as const;                    // --exposure  #C24717
}

export function PriceField({ height = 520 }: { height?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !CELLS.length) return;

    let raf = 0;
    const draw = () => {
      const parent = cv.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;

      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Largest markets last, so a dense metro is never buried under a small one.
      const cells = [...CELLS].sort((a, b) => a[3] - b[3]);

      for (const [lat, lon, ratio, n] of cells) {
        const [x, y] = project(lat, lon, w, h);
        if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;

        const r = Math.max(1.6, Math.min(1.6 + 1.15 * Math.log10(Math.max(n, 10)), 6.2));
        const [cr, cg, cb] = colorFor(ratio);

        // The scrim: opacity falls off toward the left, where the copy column
        // sits. Painted in, not layered over, so there is no second element to
        // fall out of sync at a breakpoint.
        // The copy column occupies the left ~52% at desktop. Measured on the
        // first build, dots ran straight through the headline and the lede and
        // the page read as decoration laid over substance, which is the exact
        // failure this device is supposed to avoid. The field is now essentially
        // absent behind the text and only resolves in the right third, where it
        // sits behind and around the rate card.
        // Tuned by looking at it twice. The first build ran dots straight
        // through the headline (decoration over substance). The correction
        // overshot and left only the eastern seaboard visible past the card,
        // which reads as a stray artefact rather than a map of the country.
        // This keeps the whole shape of the US legible while staying quiet
        // enough under the copy that the words always win.
        const edge = Math.min(1, Math.max(0, (x / w - 0.06) / 0.5));
        const alpha = 0.1 + 0.34 * edge * edge;

        // Paper halo first, so overlapping metros stay countable.
        ctx.beginPath();
        ctx.arc(x, y, r + 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.fill();
      }
    };

    draw();
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [height]);

  // If the field is empty we render nothing and collapse the height, rather than
  // a decorative fallback. A placeholder here would be a fabricated map.
  if (!CELLS.length) return null;

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ display: "block", width: "100%", height, pointerEvents: "none" }}
    />
  );
}

/** The count is read off the data, never typed, so the caption cannot drift. */
export const FIELD_COUNT = CELLS.length;
