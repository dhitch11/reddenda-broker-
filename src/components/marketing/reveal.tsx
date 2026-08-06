"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll-driven reveal.
 *
 * Two rules this component exists to honor:
 *
 * 1. IT MUST DEGRADE TO VISIBLE. The `.reveal` class starts at opacity 0. If this
 *    component never runs, the content would be permanently invisible, which is a
 *    blank page rather than an unanimated one. So the effect adds the class only
 *    after mount, meaning no-JS and pre-hydration both render fully visible. This
 *    is the opposite of the usual implementation and it is deliberate.
 *
 * 2. IT MUST RESPECT prefers-reduced-motion at the JS level, not only in CSS. A
 *    user with the setting on gets no observer at all, so there is no work done
 *    and nothing to fail.
 *
 * Transform and opacity only. Nothing here can trigger layout.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section" | "li" | "tr";
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    // Arm the hidden state only now that we know we can also un-hide it.
    el.classList.add("reveal");

    const timers: number[] = [];

    const io = new IntersectionObserver(
      (entries) => {
        // EVERY entry, not the first one.
        //
        // This loop used to `return` after handling the first intersecting entry.
        // When a fast scroll brought several sections into view inside a single
        // callback batch, the first revealed and the rest were dropped while
        // still observed. An IntersectionObserver only fires again when
        // intersection CHANGES, so those sections were already intersecting and
        // were never reported again: they stayed at opacity 0 permanently.
        //
        // It was invisible to every assertion, survived a slow scripted scroll,
        // and only appeared in a full-page screenshot taken after a fast one. A
        // real user who flicks down the page is exactly the fast case.
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const target = e.target;
          io.unobserve(target);
          timers.push(window.setTimeout(() => target.classList.add("is-in"), delay));
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.06 },
    );

    io.observe(el);

    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [delay]);

  return (
    // @ts-expect-error polymorphic ref across a small closed set of tags
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
