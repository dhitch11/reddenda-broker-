"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * THE EYE EXPLAINER. Built by @BROKER-CONDUCTOR so no lane has to stop and build it.
 *
 * David's requirement, verbatim: every tool carries "an eye with the circle around it,
 * with a short, not wordy, elementary explainer of what the tool is and what it does
 * in a few steps on how to use it."
 *
 * NEW FILE. It imports nothing of anyone's and edits nothing, so dropping it in
 * cannot collide with work in flight. Copy it byte-identical into
 * `reddenda-app/src/components/` for the app tools: ONE component, not five.
 *
 * USE (three lines at the top of any tool):
 *
 *   <ToolExplainer
 *     title="Rate Check"
 *     whatItIs="Shows what health plans pay for one service in one city."
 *     whatYouGet="The low, middle and high price, so you know if a quote is fair."
 *     steps={["Pick your city.", "Pick the procedure.", "Read the three prices."]}
 *   />
 *
 * THE WORD BUDGET IS PART OF THE SPEC, NOT A SUGGESTION. whatItIs <= 15 words,
 * whatYouGet <= 20, each step <= 10, three steps, 70 words total. If your copy does
 * not fit, the tool is too complicated; do not widen the box.
 *
 * ELEMENTARY MEANS ELEMENTARY. The reader is an HR director of one who has never
 * seen a CPT code. Say "your city" not CBSA, "the middle price" not median, "the
 * high end" not 90th percentile, "surgery center" not ASC. Read it once, understand
 * it once. Dev-only guards below shout if the budget or the jargon rule is broken.
 *
 * EVERY STEP MUST BE TRUE OF THE TOOL AS BUILT. Click through it before you ship.
 * A confident wrong explainer is worse than none for a buyer who is trusting us
 * precisely because they cannot check the underlying data themselves.
 */

const JARGON =
  /\b(CPT|CBSA|percentile|p25|p50|p75|p90|nonfac|HOPD|ASC|MRF|TiC|median)\b/i;

export function ToolExplainer({
  title,
  whatItIs,
  whatYouGet,
  steps,
}: {
  title: string;
  whatItIs: string;
  whatYouGet: string;
  steps: [string, string, string];
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();

  if (process.env.NODE_ENV !== "production") {
    const words = (s: string) => s.trim().split(/\s+/).length;
    const shout = (m: string) => console.warn(`[ToolExplainer:${title}] ${m}`);
    if (words(whatItIs) > 15) shout(`whatItIs is ${words(whatItIs)} words, budget is 15`);
    if (words(whatYouGet) > 20) shout(`whatYouGet is ${words(whatYouGet)} words, budget is 20`);
    steps.forEach((s, i) => {
      if (words(s) > 10) shout(`step ${i + 1} is ${words(s)} words, budget is 10`);
    });
    [whatItIs, whatYouGet, ...steps].forEach((s) => {
      const hit = s.match(JARGON);
      if (hit) shout(`"${hit[0]}" is banned. Say it in plain words a CFO would use.`);
    });
  }

  // Escape closes and focus returns to the trigger, so a keyboard user is never
  // stranded inside the panel. This is the failure mode that makes a popover
  // technically present and practically unusable.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <span style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={`What ${title} does`}
        style={{
          width: 44,
          height: 44,
          display: "grid",
          placeItems: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          color: "var(--faint, #5B6166)",
        }}
      >
        {/* The eye, inside its circle. 24px optical size in a 44px tap target. */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="10.25"
            stroke="currentColor"
            strokeWidth="1.4"
            opacity={open ? 1 : 0.55}
          />
          <path
            d="M6.4 12s2.2-3.4 5.6-3.4S17.6 12 17.6 12s-2.2 3.4-5.6 3.4S6.4 12 6.4 12Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="1.55" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          id={id}
          role="dialog"
          aria-label={`What ${title} does`}
          tabIndex={-1}
          className="tool-explainer-panel"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 60,
            width: "min(320px, calc(100vw - 32px))",
            background: "var(--paper, #fff)",
            border: "1px solid var(--hair-strong, #DDE1E3)",
            borderRadius: "var(--r-lg, 14px)",
            boxShadow: "var(--shadow-md, 0 12px 32px rgba(16,24,32,.13))",
            padding: 18,
            textAlign: "left",
            outline: "none",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              color: "var(--faint, #5B6166)",
              margin: 0,
            }}
          >
            {title}
          </p>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14.5,
              lineHeight: 1.55,
              color: "var(--ink, #101820)",
              fontWeight: 500,
            }}
          >
            {whatItIs}
          </p>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "var(--muted, #5B6166)",
            }}
          >
            {whatYouGet}
          </p>

          <ol
            style={{
              margin: "14px 0 0",
              padding: 0,
              listStyle: "none",
              display: "grid",
              gap: 8,
            }}
          >
            {steps.map((s, i) => (
              <li
                key={s}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "baseline",
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  color: "var(--ink, #101820)",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flex: "0 0 auto",
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    background: "var(--band, #F4F6F7)",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--faint, #5B6166)",
                    transform: "translateY(2px)",
                  }}
                >
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
    </span>
  );
}
