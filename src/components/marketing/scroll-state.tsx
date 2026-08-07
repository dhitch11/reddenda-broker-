"use client";

import { useEffect } from "react";

/**
 * Marks the document once the page has scrolled, so the sticky header can grow
 * a separating hairline instead of floating over content with no edge.
 *
 * A class on <body> rather than React state, because this fires on every scroll
 * frame and re-rendering a tree for a boolean would be the most expensive way
 * possible to draw a 1px line. The listener is passive and does nothing but
 * compare a boolean, so it cannot block scrolling.
 */
export function ScrollState() {
  useEffect(() => {
    let on = false;
    const check = () => {
      const next = window.scrollY > 8;
      if (next === on) return;
      on = next;
      document.body.classList.toggle("is-scrolled", on);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);
  return null;
}
