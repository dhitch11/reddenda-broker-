"use client";

import { useState, useRef, useEffect } from "react";
import { Wordmark } from "@/components/marketing/brand";
import s from "./enter.module.css";

/**
 * THE ENTRY GATE.
 *
 * The first surface anyone sees: a prospect David hands the URL to on a call, a GA
 * principal, an investor. It is also the only page an unauthenticated visitor can
 * reach, so it carries the whole first impression on its own.
 *
 * WHAT IT SAYS: the brand, and nothing else. No product claims, no metrics, no
 * payer or rate language, no "coming soon". Someone without the code should learn
 * nothing about what is behind the door beyond who owns it. That constraint is a
 * security property, not a style choice, and the visual design has to work inside it.
 *
 * SO THE AMBIENT FIELD IS THE BRAND MARK, AT SCALE.
 * The mark is a real distribution: a hairline for the observed range, a weighted
 * bar across the interquartile range, a median tick sitting left of centre because
 * healthcare price distributions are right-skewed. The background is that same
 * object repeated at different scales, drifting. It reads as a living market and
 * discloses nothing, because no strip is labelled and no strip is a real figure.
 * A stock "abstract health" background would have said less and meant nothing.
 *
 * MOTION RULES THAT BIND THIS FILE:
 * - Transform and opacity only. No layout-affecting animation, so no CLS.
 * - The input is focused on mount and is usable during every animation. Motion
 *   never gates interaction; a person who knows the code can type it immediately
 *   and never see the entrance finish.
 * - prefers-reduced-motion removes all drift and the success choreography, and
 *   keeps the page fully functional.
 */

const CELLS = 6;

/**
 * The ambient strips. Deterministic, not random: a fixed table means server and
 * client markup match, and it means the composition was designed rather than
 * whatever Math.random produced on one load. Values are pure geometry, expressed
 * as percentages of the strip. None of them is a rate.
 */
const STRIPS = [
  { top:  9, w: 40, p25: 18, p75: 62, med: 31, dur: 23, delay: 0.0, o: 0.16 },
  { top: 21, w: 66, p25: 24, p75: 71, med: 38, dur: 31, delay: 1.4, o: 0.10 },
  { top: 33, w: 29, p25: 12, p75: 54, med: 26, dur: 27, delay: 0.7, o: 0.14 },
  { top: 47, w: 78, p25: 29, p75: 79, med: 43, dur: 35, delay: 2.1, o: 0.08 },
  { top: 61, w: 35, p25: 16, p75: 58, med: 29, dur: 25, delay: 1.0, o: 0.13 },
  { top: 74, w: 58, p25: 22, p75: 68, med: 35, dur: 29, delay: 0.3, o: 0.10 },
  { top: 87, w: 24, p25: 14, p75: 49, med: 24, dur: 33, delay: 1.8, o: 0.15 },
];

function AmbientField({ state }: { state: "idle" | "checking" | "wrong" | "in" }) {
  return (
    <div className={`${s.field} ${state === "in" ? s.fieldResolve : ""}`} aria-hidden="true">
      {STRIPS.map((st, i) => (
        <div
          key={i}
          className={s.strip}
          style={
            {
              top: `${st.top}%`,
              width: `${st.w}%`,
              "--o": st.o,
              "--drift-dur": `${st.dur}s`,
              "--delay": `${st.delay}s`,
              "--i": i,
            } as React.CSSProperties
          }
        >
          <span className={s.range} />
          <span className={s.cap} style={{ left: 0 }} />
          <span className={s.cap} style={{ right: 0 }} />
          <span className={s.iqr} style={{ left: `${st.p25}%`, width: `${st.p75 - st.p25}%` }} />
          <span className={s.median} style={{ left: `${st.med}%` }} />
        </div>
      ))}
    </div>
  );
}

export default function EnterForm() {
  const [digits, setDigits] = useState<string[]>(Array(CELLS).fill(""));
  const [state, setState] = useState<"idle" | "checking" | "wrong" | "in">("idle");
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  /**
   * Refocus AFTER the failed render, not during it.
   *
   * The first version called focus() in the same synchronous tick as
   * setState("wrong"), while the inputs were still disabled from the in-flight
   * check, so the browser dropped the focus request and the next keystroke went
   * nowhere. An effect runs after the inputs re-render enabled.
   *
   * The digits are kept and selected rather than cleared, so the error colour
   * stays attached to the characters that actually caused it and the next
   * keystroke replaces them. Six reddened empty boxes tell you nothing.
   */
  useEffect(() => {
    if (state !== "wrong") return;
    const el = refs.current[0];
    el?.focus();
    el?.select();
  }, [state]);

  const pin = digits.join("");
  const complete = pin.length === CELLS && !digits.includes("");

  /**
   * SUBMIT IS DRIVEN OFF STATE, NOT OFF THE KEYSTROKE THAT COMPLETED IT.
   *
   * The first version fired submit from inside the change handler using the value
   * it had just computed. That reads fine and is wrong: the handler closes over
   * `digits`, so when six characters arrive faster than React re-renders — a paste,
   * a password manager, or simply fast typing — the last handler sees a stale array,
   * never observes a full code, and silently does nothing.
   *
   * Caught by screenshotting the wrong-code state: all six cells were filled and no
   * error had appeared, because submit had never run. A unit test on the handler
   * would have passed, since it passes its own value in.
   */
  useEffect(() => {
    if (complete && state === "idle") void submit(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, pin, state]);

  async function submit(value: string) {
    setState("checking");
    try {
      const r = await fetch("/api/gate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin: value }),
      });
      if (r.ok) {
        // The payoff. The strips converge, then we reload. A full reload rather
        // than a router push because the cookie has to be presented to the
        // middleware on a fresh request for the real page to render.
        setState("in");
        const reduced =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.setTimeout(() => window.location.reload(), reduced ? 0 : 620);
        return;
      }
    } catch {
      /* same failure state either way; never reveal which step failed */
    }
    setState("wrong");
  }

  function setAt(i: number, v: string) {
    const clean = v.replace(/\D/g, "");
    // Functional update: every keystroke composes on the LATEST array, never on
    // whatever this closure captured. Six fast keystrokes cannot drop one.
    setDigits((prev) => {
      const next = [...prev];
      if (!clean) {
        next[i] = "";
        return next;
      }
      // Handles typing one digit and pasting the whole code into any cell.
      for (let k = 0; k < clean.length && i + k < CELLS; k++) next[i + k] = clean[k];
      return next;
    });
    if (!clean) return;
    if (state === "wrong") setState("idle");
    refs.current[Math.min(i + clean.length, CELLS - 1)]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < CELLS - 1) refs.current[i + 1]?.focus();
    if (e.key === "Enter" && pin.length === CELLS) void submit(pin);
  }

  const locked = state === "checking" || state === "in";

  return (
    <main className={s.root}>
      <AmbientField state={state} />

      <div className={`${s.card} ${state === "in" ? s.cardOut : ""}`}>
        <div className={s.mark}>
          <Wordmark size={36} />
        </div>

        <p className={s.label}>
          {state === "in" ? "Welcome back" : "Enter access code"}
        </p>

        <div className={`${s.cells} ${state === "wrong" ? s.shake : ""}`}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              autoComplete="one-time-code"
              type="text"
              pattern="[0-9]*"
              maxLength={CELLS}
              aria-label={`Access code digit ${i + 1} of ${CELLS}`}
              disabled={locked}
              className={`${s.cell} ${d ? s.cellFilled : ""} ${state === "wrong" ? s.cellWrong : ""} ${state === "in" ? s.cellIn : ""}`}
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Fixed height so nothing reflows when the message changes. */}
        <div className={s.msg} role="status" aria-live="polite">
          {state === "wrong" && <span className={s.wrong}>Not a valid code</span>}
          {state === "checking" && <span className={s.checking}>Checking</span>}
          {state === "in" && <span className={s.ok}>Opening</span>}
        </div>
      </div>
    </main>
  );
}
