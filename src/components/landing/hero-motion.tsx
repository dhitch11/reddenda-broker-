"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * THE SCRUB DRIVER.
 *
 * Turns scroll distance across a 200vh stage into one number, `--p`, from 0 to 1,
 * written onto the stage element. Every visual consequence lives in CSS
 * (globals.css section 9) as a function of that number. This file computes a
 * float and nothing else, which is the whole reason the effect can be tuned
 * without touching JavaScript.
 *
 * ═══ FIVE THINGS THIS COMPONENT EXISTS TO GET RIGHT ═══════════════════════════
 *
 * 1. IT ARMS THE EFFECT RATHER THAN ASSUMING IT.
 *    `--p` defaults to 1 in CSS, which is the FINISHED state: headline settled,
 *    panel bright and forward. The stage only becomes tall and sticky once this
 *    effect adds `.field-live`. So no JS, a failed hydration, an error in this
 *    file, or an old browser all produce a correct, complete, motionless hero
 *    rather than a half-faded one. The estate has shipped the opposite mistake:
 *    an animated initial state authored as the default, which renders a blank
 *    page whenever the animation never runs.
 *
 * 2. IT REFUSES TO RUN WHERE IT DOES NOT BELONG, AND KEEPS REFUSING.
 *    Under 900px or with prefers-reduced-motion, the stage is never armed and no
 *    listener is attached, so the cost is zero rather than merely hidden. Both
 *    conditions are watched with matchMedia change events, because a reader who
 *    turns reduced motion on, or rotates a tablet, must get the same answer as a
 *    reader who arrived that way. An accommodation that only applies at page load
 *    is not an accommodation.
 *
 * 3. IT READS LAYOUT ONCE PER FRAME, INSIDE A rAF.
 *    A scroll handler that calls getBoundingClientRect() synchronously forces the
 *    browser to flush layout on every scroll event, which is the classic way a
 *    scroll effect ends up costing more than everything else on the page
 *    combined. The listener here does nothing but set a flag and request a frame.
 *
 * 4. IT WRITES ONLY WHEN THE VALUE ACTUALLY CHANGED.
 *    A custom property write invalidates style for the subtree, so writing the
 *    same rounded value 60 times a second is real work for no pixels. Rounding to
 *    three places is below the threshold where any of the downstream transforms
 *    move a visible amount.
 *
 * 5. THE CURVE IS DELIBERATE.
 *    Raising progress to 1.12 adds a slight ease-in, so the first pixels of scroll
 *    feel weighted instead of the shot snapping away from the reader the instant
 *    they touch the wheel. reddenda.health uses 1.1 for the same reason; the
 *    extra 0.02 is because this shot is shorter than its.
 */
export function ScrubStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;

    const wide = window.matchMedia("(min-width: 900px)");
    const calm = window.matchMedia("(prefers-reduced-motion: no-preference)");

    let raf = 0;
    let queued = false;
    let last = -1;
    let armed = false;

    const measure = () => {
      queued = false;
      const rect = stage.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;

      const raw = Math.min(Math.max(-rect.top / travel, 0), 1);
      const p = Math.round(Math.pow(raw, 1.12) * 1000) / 1000;
      if (p === last) return;
      last = p;
      stage.style.setProperty("--p", String(p));
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(measure);
    };

    const disarm = () => {
      if (!armed) return;
      armed = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      queued = false;
      stage.classList.remove("field-live");
      /* Hand the stage back to its finished state rather than leaving it frozen
         at whatever the last scroll position happened to be. */
      stage.style.removeProperty("--p");
      last = -1;
    };

    const arm = () => {
      if (armed) return;
      armed = true;
      stage.classList.add("field-live");
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      /* Set the first value before paint. A reader who lands mid-page on a
         back-navigation must see the shot at the right frame, not at frame zero. */
      measure();
    };

    /**
     * DOES THE SHOT ACTUALLY FIT IN THE FRAME?
     *
     * Pinning a hero whose content is taller than the viewport minus the sticky
     * header does not compress it, it CLIPS it, because the plane carries
     * overflow: hidden. MEASURED at 1440x900 before this guard existed: content
     * 1036px against a 835px frame, and the top of the headline finished the
     * scrub hidden behind the header.
     *
     * So the fit is measured rather than assumed, on the real elements, at the
     * real viewport, every time the environment changes. If it does not fit the
     * page is simply not pinned: the visitor gets the ordinary hero, which is
     * complete and correct, instead of a cinematic effect that eats a headline.
     * A short laptop, a browser with a bookmarks bar, a large default font and a
     * zoomed-in reader all land here, and all of them are better served by no
     * effect than by a clipped one.
     */
    const fits = () => {
      const plane = stage.querySelector<HTMLElement>(".hero-plane");
      const content = plane?.querySelector<HTMLElement>(".wrap");
      const header = document.querySelector<HTMLElement>(".site-header");
      if (!content) return false;
      const headerH = header?.getBoundingClientRect().height ?? 0;
      /* scrollHeight, not the bounding box: while armed the box is already
         constrained by the frame, so reading it back would report that whatever
         we did fits, which is the measurement equivalent of a leading question. */
      /* 48px OF HEADROOM, NOT AN EXACT FIT.
         This was `<= window.innerHeight`, an equality with zero margin, and a
         binary search found the cliff at exactly 853px: armed at 853, not armed
         at 852. That put the two commonest projector modes on the wrong side of
         it, 1366x768 and 1280x800, so the signature effect did not exist on the
         hardware most likely to be in the room. The margin also absorbs a
         bookmarks bar, a larger default font, and a zoomed-in reader. */
      return content.scrollHeight + headerH <= window.innerHeight - 48;
    };

    /* ARM AND DISARM WITHOUT MOVING THE PAGE UNDER THE READER.
       Toggling `.field-live` collapses the stage from 200vh to its natural height,
       and MEASURED at scrollY 480 that moved the h1 from top 133 to top -218: the
       headline left the screen while the scroll position stayed put. It fires when
       a projector is plugged in or fullscreen is toggled mid-scroll, which is
       precisely when it must not happen, and no CLS observer catches it because
       resize-driven shifts are excluded from the metric by design. So we measure
       the stage's position either side of the toggle and correct the difference. */
    const preserveScroll = (mutate: () => void) => {
      /* MEASURE THE THING THAT ACTUALLY MOVES, WHICH IS NOT THE STAGE.
         My first attempt referenced the stage and did nothing, because collapsing
         the stage changes its HEIGHT, not the position of its top: the stage
         begins just under the header either way. What moves is the PLANE, which
         goes from sticky-pinned to static and therefore jumps by however far the
         reader has scrolled into the stage. MEASURED with the stage reference in
         place: the h1 still travelled 383px on a 900 -> 820 resize. With the
         plane as the reference it is corrected. */
      const ref = stage.querySelector<HTMLElement>(".hero-plane") ?? stage;
      const before = ref.getBoundingClientRect().top;
      mutate();
      const after = ref.getBoundingClientRect().top;
      const delta = after - before;
      if (Math.abs(delta) > 1) window.scrollBy(0, delta);
    };

    const sync = () => {
      if (!wide.matches || !calm.matches) return preserveScroll(disarm);
      /* Arm, then verify. The pinned layout is tighter than the static one, so
         the honest question is "does it fit ONCE PINNED", which cannot be
         answered without pinning it first. If it does not, stand back down. */
      const wasArmed = armed;
      preserveScroll(() => {
        arm();
        if (!fits()) {
          disarm();
          if (wasArmed) stage.style.removeProperty("--p");
        }
      });
    };

    sync();
    wide.addEventListener("change", sync);
    calm.addEventListener("change", sync);
    /* A resize changes the answer to "does it fit", not just the progress value,
       so the whole decision is re-run rather than only the measurement. */
    window.addEventListener("resize", sync, { passive: true });

    return () => {
      wide.removeEventListener("change", sync);
      calm.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      disarm();
    };
  }, []);

  return (
    <div ref={ref} className="hero-stage">
      {children}
    </div>
  );
}

/**
 * POINTER PARALLAX.
 *
 * Writes `--mx` and `--my`, normalised to -1..1 from the pointer's position
 * within this element's box. CSS section 9.2 turns them into a degree and a half
 * of rotation on the CHILD, so it composes with the scrub's transform on the
 * parent instead of overwriting it.
 *
 * POINTER EVENTS, NOT MOUSE EVENTS, and gated on `pointer: fine`. A touch drag
 * emits pointermove, so an ungated version makes a panel lurch under a thumb on
 * the one interaction where the user expects the page to scroll and nothing else.
 * `pointer: fine` is the honest test for "there is a cursor here", far better
 * than sniffing for a touch API that laptops with touchscreens also report.
 *
 * The listener sits on the element, not the window, so it is not running while
 * the pointer is somewhere else on a long page, and it resets on leave so the
 * panel returns to flat rather than holding the last angle forever.
 */
export function Tilt({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fine = window.matchMedia("(pointer: fine) and (min-width: 1024px)");
    const calm = window.matchMedia("(prefers-reduced-motion: no-preference)");

    let raf = 0;
    let pending: { x: number; y: number } | null = null;
    let armed = false;

    const apply = () => {
      if (!pending) return;
      const { x, y } = pending;
      pending = null;
      el.style.setProperty("--mx", String(x));
      el.style.setProperty("--my", String(y));
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      pending = {
        x: Math.round(((e.clientX - r.left) / r.width - 0.5) * 2000) / 1000,
        y: Math.round(((e.clientY - r.top) / r.height - 0.5) * 2000) / 1000,
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      pending = null;
      el.style.setProperty("--mx", "0");
      el.style.setProperty("--my", "0");
    };

    const disarm = () => {
      if (!armed) return;
      armed = false;
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      el.classList.remove("tilt-live");
      onLeave();
    };

    const arm = () => {
      if (armed) return;
      armed = true;
      el.classList.add("tilt-live");
      el.addEventListener("pointermove", onMove, { passive: true });
      el.addEventListener("pointerleave", onLeave, { passive: true });
    };

    const sync = () => (fine.matches && calm.matches ? arm() : disarm());

    sync();
    fine.addEventListener("change", sync);
    calm.addEventListener("change", sync);

    return () => {
      fine.removeEventListener("change", sync);
      calm.removeEventListener("change", sync);
      disarm();
    };
  }, []);

  return (
    <div ref={ref} className={className ? `tilt ${className}` : "tilt"}>
      {children}
    </div>
  );
}
