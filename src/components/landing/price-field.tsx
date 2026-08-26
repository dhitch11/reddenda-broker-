"use client";

import { useEffect, useRef, useState } from "react";

/**
 * THE PRICE FIELD. The hero's substrate, and the first of the M2 showcase
 * effects. @BROKER-MARKETING, 2026-08-26.
 *
 * Every particle is a real U.S. county from the live geographic spine, sized by
 * real population, colored by what Medicare actually allowed for CPT 45378 in
 * that county's state (2024 CMS geographic PUF). As the reader scrolls the
 * pinned hero, the whole country CONDENSES onto one readable dollar axis and
 * the Sacramento site-of-care trio rises out of the right end of it: the same
 * three totals, from the same tables, as the panel beside it. The claim hands
 * the frame to the number, and the substrate acts the same story out.
 *
 * LIFTED, NOT REINVENTED: the engine is adapted from the estate's own
 * reddenda.health hero (reddenda-main-build/site/assets/js/price-field.js),
 * whose hard requirement reads "the American county field NEVER leaves this
 * hero. Every particle is a real U.S. county." Same doctrine here, translated
 * to React, the broker's dark register, and the broker's own featured example.
 *
 * THE HONESTY RULES, IN PIXELS:
 *   - Data comes from /field-data.json, baked from the live tables by
 *     scripts/bake-field-data.mjs. If the file is missing or partial the
 *     component renders NOTHING: empty ink, never a synthetic field.
 *   - One code on one axis. Counties land by their state's 2024 Medicare
 *     allowed for 45378; the trio is the 2026 Sacramento fee-schedule total
 *     for 45378. Two vintages share the axis and BOTH are printed on it.
 *   - No number animates: the axis labels render at full value the frame they
 *     appear. What moves is geometry, never a figure.
 *
 * MOTION DISCIPLINE:
 *   - The scrub value is READ from the stage's `--p` (written by ScrubStage as
 *     an inline property), so the canvas, the copy choreography and the CSS
 *     consequences all follow one number. No stage armed = ambient field only.
 *   - prefers-reduced-motion: one static frame, no loop, no twinkle. The field
 *     still renders because it is information (the corpus), not decoration.
 *   - The rAF loop pauses when the hero scrolls out of view.
 *   - DPR capped at 2 (1.5 under 768px), matching the lifted engine's budget.
 */

type FieldData = {
  bakedAt: string;
  counties: [lat: number, lng: number, pop: number, state: string][];
  states: Record<string, number>;
  trio: {
    office: number;
    asc: number;
    hopd: number;
    locality: string;
    pfsYear: number | null;
    facilityVintage: string | null;
  };
  meta: { cpt: string; name: string; pufYear: number | null; source: string };
};

/* CONUS bounds, from the lifted engine. Alaska, Hawaii and the territories fall
   outside and are simply not drawn, exactly as reddenda.health draws it. */
const LAT_MIN = 24.3, LAT_MAX = 49.5, LNG_MIN = -125, LNG_MAX = -66.5;

type P = {
  mx: number; my: number;   // map position
  ax: number; ay: number;   // axis landing position
  r: number;                // radius, from real population
  hue: string;              // resolved fill color
  tw: number;               // twinkle phase
  tws: number;              // twinkle speed
  dly: number;              // morph delay, by axis position (left fills first)
  bright: boolean;          // link-eligible
};

const smooth = (q: number) => (q <= 0 ? 0 : q >= 1 ? 1 : q * q * (3 - 2 * q));

export function PriceField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dead, setDead] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lite = window.matchMedia("(max-width: 767px)");

    let raf = 0;
    let running = false;
    let inView = true;
    let disposed = false;
    let particles: P[] = [];
    let links: { a: number; b: number; t0: number; life: number }[] = [];
    let comets: { x: number; y: number; vx: number; vy: number; t0: number; life: number }[] = [];
    let W = 0, H = 0, DPR = 1;
    let data: FieldData | null = null;

    const stage = canvas.closest<HTMLElement>(".hero-stage");
    const host = canvas.parentElement;

    /* The register's own colors, read from the cascade so the canvas can never
       drift from the token layer. Fallbacks are the .cine values. */
    const css = getComputedStyle(canvas);
    const col = (name: string, fb: string) => (css.getPropertyValue(name) || fb).trim() || fb;
    const TEAL = col("--teal", "#2AD9C4");
    const EXPOSURE = col("--exposure", "#FF8A5B");
    const INK = col("--ink", "#F4F8F8");
    const MUTED = col("--muted", "#94A3A6");
    const FAINT = col("--faint", "#7C8A8D");
    const HAIR = "rgba(255,255,255,.13)";
    const MONO = `500 ${11}px ${css.getPropertyValue("--font-mono") || "IBM Plex Mono"}, monospace`;

    /* teal -> exposure by where the state's dollar sits in the national range.
       Interpolated in RGB from the two resolved tokens, so a token change
       recolors the field on the next deploy without touching this file. */
    const rgb = (hex: string): [number, number, number] => {
      const h = hex.replace("#", "");
      const s = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
      return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
    };
    const T = rgb(TEAL), X = rgb(EXPOSURE);
    const ramp = (t: number, a: number) => {
      const m = (i: number) => Math.round(T[i] + (X[i] - T[i]) * t);
      return `rgba(${m(0)},${m(1)},${m(2)},${a})`;
    };

    const size = () => {
      if (!host) return;
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      DPR = Math.min(lite.matches ? 1.5 : 2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (data) build(data);
    };

    /* Axis geometry. The strip sits in the lower band of the frame, clear of
       the copy column, with room for the trio labels above it. */
    const axis = () => {
      const y = H - Math.max(84, H * 0.12);
      const x0 = Math.max(28, W * 0.06);
      const x1 = W - Math.max(28, W * 0.05);
      return { y, x0, x1 };
    };

    let DMIN = 0, DMAX = 1;

    const build = (d: FieldData) => {
      const { y: ay0, x0, x1 } = axis();
      const vals = Object.values(d.states);
      DMIN = Math.min(...vals);
      DMAX = Math.max(...vals, d.trio.hopd);
      const pad = (DMAX - DMIN) * 0.04;
      DMIN -= pad; DMAX += pad;
      const dollarX = (v: number) => x0 + ((v - DMIN) / (DMAX - DMIN)) * (x1 - x0);

      const mid = (DMIN + DMAX) / 2;
      const popMax = Math.max(...d.counties.map((c) => c[2]), 1);

      particles = [];
      /* THE MOBILE BUDGET. The field used to be `display:none` below 900px, so the
         hero's ONE signature effect did not exist for half the audience. It exists
         now, thinned rather than deleted: every 2nd county on a phone, which keeps
         the country's shape (the coasts and the Great Lakes still read) while
         halving the per-frame arc count. Never sample below this - at 1-in-3 the
         Mountain West falls apart and it stops being a map. */
      const stride = lite.matches ? 2 : 1;
      let seen = -1;
      for (const [lat, lng, pop, st] of d.counties) {
        seen += 1;
        if (seen % stride !== 0) continue;
        if (lat < LAT_MIN || lat > LAT_MAX || lng < LNG_MIN || lng > LNG_MAX) continue;
        const mx = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W;
        const my = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (H * 0.86) + H * 0.02;
        const v = d.states[st];
        const t = v == null ? 0.5 : (Math.min(Math.max(v, DMIN), DMAX) - DMIN) / (DMAX - DMIN);
        const axv = v ?? mid;
        const axX = dollarX(axv) + (Math.random() - 0.5) * 6;
        /* ⛔ MEASURED 2026-08-26: THIS FIELD LIT 0.89% OF ITS OWN CANVAS.
           reddenda.health lights 11.27%, which is why theirs reads as a glowing
           county map and ours read as near-black emptiness across the left 60% of
           the hero. The cause was not particle COUNT - we draw every real county,
           and we out-count health on every other effect metric. It was radius: a
           0.5px floor means most of the 3,000 counties were a single antialiased
           pixel at roughly a quarter alpha, which is a dot the eye never resolves.
           The floor is what moved, not the ceiling: the biggest counties grow a
           little, the smallest ones grow a lot, and the map keeps its shape. */
        const r = 0.95 + Math.sqrt(pop / popMax) * 2.35;
        particles.push({
          mx, my,
          ax: axX, ay: ay0 + 14 + Math.random() * 10,
          r,
          hue: ramp(t, 1),
          tw: Math.random() * Math.PI * 2,
          tws: 0.4 + Math.random() * 0.9,
          dly: ((axX - x0) / (x1 - x0)) * 0.5,
          bright: r > 1.9,
        });
      }
    };

    const scrub = (): number => {
      if (!stage || !stage.classList.contains("field-live")) return 0;
      const v = parseFloat(stage.style.getPropertyValue("--p"));
      return Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : 0;
    };

    const usd = (v: number) =>
      "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const draw = (now: number) => {
      if (!data) return;
      const t = now / 1000;
      const P0 = scrub();
      ctx.clearRect(0, 0, W, H);

      const anim = !reduced.matches;

      /* THE FIELD, MORPHING. Two passes now, and the halo is the one that matters.
         The audit measured LIT AREA (alpha > 8/255), and area goes as the square of
         the radius, so a halo at 2.9x the core radius lights roughly eight times the
         pixels for a fraction of the ink. It is drawn UNDER the core in the same
         loop pair rather than as a shadowBlur, because shadowBlur on three thousand
         arcs drops the frame rate off a cliff and this hero is pinned while it
         scrubs. The halo twinkles with its core, which is also what lifts the
         changing-pixel share the audit measured at 0.565% against health's 1.316%. */
      for (const p of particles) {
        const q = smooth((P0 - p.dly) / (1 - p.dly));
        const x = p.mx + (p.ax - p.mx) * q;
        const y = p.my + (p.ay - p.my) * q;
        const twinkle = anim ? 0.66 + 0.34 * Math.sin(p.tw + t * p.tws) : 0.8;
        const rr = p.r * (1 - q * 0.35);
        ctx.globalAlpha = (0.098 + 0.096 * twinkle) * (0.9 - q * 0.3);
        ctx.fillStyle = p.hue;
        ctx.beginPath();
        ctx.arc(x, y, rr * 2.9, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of particles) {
        const q = smooth((P0 - p.dly) / (1 - p.dly));
        const x = p.mx + (p.ax - p.mx) * q;
        const y = p.my + (p.ay - p.my) * q;
        const twinkle = anim ? 0.66 + 0.34 * Math.sin(p.tw + t * p.tws) : 0.8;
        ctx.globalAlpha = (0.36 + 0.52 * twinkle) * (0.9 - q * 0.25);
        ctx.fillStyle = p.hue;
        ctx.beginPath();
        ctx.arc(x, y, p.r * (1 - q * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* constellation links among bright counties, ambient state only */
      if (anim && P0 < 0.15) {
        if (links.length < 3 && Math.random() < 0.012) {
          const bright = particles.filter((p) => p.bright);
          if (bright.length > 2) {
            const a = Math.floor(Math.random() * bright.length);
            let b = Math.floor(Math.random() * bright.length);
            if (a !== b) links.push({ a: particles.indexOf(bright[a]), b: particles.indexOf(bright[b]), t0: t, life: 2.6 });
          }
        }
        links = links.filter((l) => t - l.t0 < l.life);
        for (const l of links) {
          const k = (t - l.t0) / l.life;
          const fade = k < 0.5 ? k * 2 : (1 - k) * 2;
          const A = particles[l.a], B = particles[l.b];
          if (!A || !B) continue;
          ctx.globalAlpha = 0.16 * fade;
          ctx.strokeStyle = TEAL;
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(A.mx, A.my); ctx.lineTo(B.mx, B.my); ctx.stroke();
        }
        /* ingest comets: a streak drawn toward a real county, never from nowhere */
        if (comets.length < 2 && Math.random() < 0.008) {
          const target = particles[Math.floor(Math.random() * particles.length)];
          if (target) comets.push({ x: target.mx, y: target.my, vx: -(40 + Math.random() * 60), vy: -(24 + Math.random() * 40), t0: t, life: 1.4 });
        }
        comets = comets.filter((c) => t - c.t0 < c.life);
        for (const c of comets) {
          const k = (t - c.t0) / c.life;
          const fade = k < 0.4 ? k / 0.4 : 1 - (k - 0.4) / 0.6;
          ctx.globalAlpha = 0.35 * fade;
          ctx.strokeStyle = TEAL;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(c.x + c.vx * (1 - k), c.y + c.vy * (1 - k));
          ctx.lineTo(c.x, c.y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      /* The field's own caption, in the canvas so it costs the pinned column
         zero height (the scrub's fits() guard measures the DOM). It fades as
         the morph begins and the axis labels take over the same job. */
      if (P0 < 0.3) {
        ctx.globalAlpha = (1 - P0 / 0.3) * 0.9;
        ctx.font = MONO;
        ctx.fillStyle = FAINT;
        ctx.textAlign = "left";
        ctx.fillText(
          `${particles.length.toLocaleString("en-US")} REAL U.S. COUNTIES · MEDICARE ALLOWED, ${data.meta.name.toUpperCase()} · ${data.meta.pufYear ?? ""} CMS`,
          Math.max(28, W * 0.06),
          H - 16,
        );
        ctx.globalAlpha = 1;
      }

      /* THE AXIS. Appears as the condensation lands; every label is a real
         figure from the bake, printed at full value the frame it appears. */
      if (P0 > 0.45 && data) {
        const { y, x0, x1 } = axis();
        const a = Math.min((P0 - 0.45) / 0.25, 1);
        const dollarX = (v: number) => x0 + ((v - DMIN) / (DMAX - DMIN)) * (x1 - x0);

        ctx.globalAlpha = a;
        ctx.strokeStyle = HAIR;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + (x1 - x0) * a, y); ctx.stroke();

        ctx.font = MONO;
        ctx.fillStyle = FAINT;
        ctx.textAlign = "left";
        ctx.fillText(
          `MEDICARE ALLOWED, ${data.meta.name.toUpperCase()} · STATE AVERAGES · ${data.meta.pufYear ?? ""} CMS`,
          x0, y + 30,
        );

        /* the trio rises out of the right half, one marker per setting */
        if (P0 > 0.62) {
          const b = Math.min((P0 - 0.62) / 0.3, 1);
          const trio = [
            { v: data.trio.office, label: "OFFICE" },
            { v: data.trio.asc, label: "SURGERY CENTER" },
            { v: data.trio.hopd, label: "HOSPITAL OUTPATIENT" },
          ];
          trio.forEach((m, i) => {
            const k = smooth(Math.min(Math.max((b - i * 0.18) / 0.6, 0), 1));
            if (k <= 0) return;
            const x = dollarX(m.v);
            const rise = 34 + i * 26;
            ctx.globalAlpha = k;
            ctx.strokeStyle = i === 2 ? EXPOSURE : TEAL;
            ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - rise * k); ctx.stroke();
            if (k > 0.75) {
              ctx.fillStyle = i === 2 ? EXPOSURE : INK;
              ctx.textAlign = x > W - 190 ? "right" : "left";
              const tx = x > W - 190 ? x - 6 : x + 6;
              ctx.fillText(`${m.label}  ${usd(m.v)}`, tx, y - rise - 5);
            }
          });
          if (b > 0.85) {
            ctx.globalAlpha = (b - 0.85) / 0.15;
            ctx.fillStyle = MUTED;
            ctx.textAlign = "right";
            ctx.fillText(
              `SACRAMENTO FEE SCHEDULE · ${data.trio.pfsYear ?? ""}${data.trio.facilityVintage ? ` + ${data.trio.facilityVintage} FACILITY` : ""}`,
              x1, y + 30,
            );
          }
        }
        ctx.globalAlpha = 1;
      }
    };

    const loop = (now: number) => {
      if (disposed) return;
      draw(now);
      /* Reduced motion holds a single correct frame per scrub value; a scroll
         still updates it through the scroll listener below, so the information
         survives with zero continuous movement. */
      if (!reduced.matches && inView) {
        raf = requestAnimationFrame(loop);
        running = true;
      } else {
        running = false;
      }
    };

    const wake = () => {
      if (disposed || running || !data) return;
      raf = requestAnimationFrame(loop);
      running = true;
    };

    const io = new IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? true;
      if (inView) wake();
    });
    io.observe(canvas);

    const onScroll = () => { if (reduced.matches && data) draw(performance.now()); };
    window.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => { size(); if (data) draw(performance.now()); });
    if (host) ro.observe(host);

    fetch("/field-data.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: FieldData | null) => {
        if (disposed) return;
        if (!d || !Array.isArray(d.counties) || d.counties.length < 1000 || !d.trio) {
          /* Empty ink. The page is complete without the field; a synthetic
             field would be a fabricated corpus, which is the one thing this
             canvas exists to never be. */
          setDead(true);
          return;
        }
        data = d;
        size();
        draw(performance.now());
        wake();
      })
      .catch(() => setDead(true));

    reduced.addEventListener("change", wake);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      reduced.removeEventListener("change", wake);
    };
  }, []);

  if (dead) return null;
  return <canvas ref={canvasRef} className="price-field" aria-hidden="true" />;
}
