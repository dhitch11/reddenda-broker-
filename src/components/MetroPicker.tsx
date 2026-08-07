"use client";

import { useState, useRef, useEffect, useMemo, useId } from "react";
import { createPortal } from "react-dom";
import { METROS, type Metro } from "@/lib/metros";

/**
 * MARKET PICKER. Searchable, keyboard-first, 928 markets.
 *
 * WHY THIS EXISTS
 * The metro reference went from 121 curated markets to every Core Based Statistical
 * Area in the United States, which is the correct scope and the claim the site makes.
 * A native <select> with 928 options is the wrong control for that: it adds roughly
 * 45KB to the server-rendered homepage, and a broker in Bend has to scroll past 900
 * markets to find their own. Scope went up and usability went down, which is not a
 * trade this product makes.
 *
 * So: type-ahead over the full national list, rendering at most 10 rows at a time.
 * The list is ordered by provider density, so an empty query shows the markets most
 * people want and typing three letters finds anyone else's.
 *
 * BUILT FOR THE ACTUAL USER
 * A broker types "Sacramento", not "40900". They type their state when they cannot
 * remember which CBSA their county sits in. Both work, and so does the code.
 *
 * ACCESSIBILITY
 * This is the ARIA 1.2 combobox pattern, not a div with a click handler. Arrow keys
 * move, Enter commits, Escape closes and restores, Tab commits the active option,
 * and the active row is announced through aria-activedescendant. It degrades to a
 * real form field: the value lives in a hidden input, so the surrounding form still
 * submits without JavaScript having to be involved.
 *
 * OWNERSHIP NOTE. New file, @BROKER-READY. It edits nobody's component. Offered to
 * @BROKER-MARKETING (lookup-form) and @BROKER-TOOLS (rate-check) to adopt rather
 * than dropped into their files.
 */

const MAX_ROWS = 10;

/** Ranked search. Prefix beats contains, and a two letter query is a state. */
function rank(query: string): Metro[] {
  const q = query.trim().toLowerCase();
  if (!q) return METROS.slice(0, MAX_ROWS);

  if (/^\d{2,5}$/.test(q)) {
    return METROS.filter((m) => m.cbsa.startsWith(q)).slice(0, MAX_ROWS);
  }

  const scored: { m: Metro; r: number }[] = [];
  for (const m of METROS) {
    const name = m.name.toLowerCase();
    let r: number;
    if (name.startsWith(q)) r = 0;
    else if (q.length === 2 && m.state.toLowerCase() === q) r = 1;
    else if (name.includes(q)) r = 2;
    else continue;
    scored.push({ m, r });
    // METROS is density ordered, so once we have plenty of exact prefix hits the
    // rest cannot outrank them and we can stop walking 928 rows on every keystroke.
    if (scored.length > 60) break;
  }
  return scored.sort((a, b) => a.r - b.r).slice(0, MAX_ROWS).map((x) => x.m);
}

export function MetroPicker({
  name = "market",
  defaultValue,
  onChange,
  label = "Market",
}: {
  name?: string;
  /** Initial CBSA. The component owns the selection from then on. */
  defaultValue: string;
  /** Optional. Only pass this from a client component. */
  onChange?: (cbsa: string) => void;
  label?: string;
}) {
  // SELF-MANAGED ON PURPOSE.
  //
  // The lookup form this drops into is a SERVER component: a plain GET form that
  // renders the answer on first paint and works with JavaScript disabled. That is a
  // deliberate design decision by the marketing lane and it is a good one. A server
  // component cannot pass an event handler to a client component, so a controlled
  // `value`/`onChange` pair would have made this component unusable in the one place
  // it is most needed.
  //
  // Holding the selection internally and writing it to a hidden input keeps the
  // native form submit intact: no JS means no combobox, but the field still carries
  // its default and the form still works. Progressive enhancement, not a rewrite.
  const [selectedCbsa, setSelectedCbsa] = useState(defaultValue);
  const selected = useMemo(
    () => METROS.find((m) => m.cbsa === selectedCbsa) ?? METROS[0],
    [selectedCbsa],
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const rows = useMemo(() => (open ? rank(query) : []), [open, query]);

  // THE LISTBOX IS PORTALLED TO document.body. THIS IS NOT OVER-ENGINEERING.
  //
  // The hero's entrance animation uses a `.rise` class, and `animation` CREATES A
  // STACKING CONTEXT. Any absolutely positioned child is trapped inside it, so the
  // dropdown was painted underneath the result card that follows in the DOM. No
  // z-index on the component or its root can escape an ancestor stacking context,
  // and I confirmed that by trying: z-index 50 on the root changed nothing.
  //
  // A portal to body is the only fix that holds regardless of what the host page
  // wraps this in. Position is measured from the input on open, on scroll and on
  // resize, so it tracks rather than drifting.
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = inputRef.current?.getBoundingClientRect();
      if (r) setRect({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  // Clicking away commits nothing and restores the current selection, which is the
  // behaviour people expect from a field they opened by accident.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      // The listbox is portalled to body, so it is NOT inside rootRef. Without this
      // second check every click on an option would count as a click outside.
      const inList = (t as HTMLElement)?.closest?.("[data-metro-listbox]");
      if (!rootRef.current?.contains(t) && !inList) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
  }

  function commit(m: Metro | undefined) {
    if (!m) return close();
    setSelectedCbsa(m.cbsa);
    onChange?.(m.cbsa);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, rows.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); commit(rows[active]); }
    else if (e.key === "Tab") { if (rows[active]) commit(rows[active]); }
    else if (e.key === "Escape") { e.preventDefault(); close(); inputRef.current?.blur(); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(rows.length - 1); }
  }

  return (
    // z-index goes on the ROOT, not just the listbox, and only while open.
    // A `position: relative` parent with z-index auto does not create a stacking
    // context, so the listbox competed with whatever card followed it in the DOM and
    // was painted over. Raising the listbox alone does not fix that: it is the
    // parent's stacking position that loses. Measured, not guessed: the dropdown
    // rendered underneath the result card directly beneath the form.
    <div ref={rootRef} style={{ position: "relative", zIndex: open ? 50 : undefined }}>
      {/* The real form value. Present whether or not the combobox is open. */}
      <input type="hidden" name={name} value={selected?.cbsa ?? ""} />

      <label htmlFor={`${listId}-input`} className="eyebrow" style={{ display: "block", marginBottom: 7 }}>
        {label}
      </label>

      <input
        id={`${listId}-input`}
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${listId}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && rows[active] ? `${listId}-opt-${rows[active].cbsa}` : undefined}
        autoComplete="off"
        spellCheck={false}
        value={open ? query : (selected?.name ?? "")}
        placeholder={open ? "Type a city, a state, or a CBSA code" : undefined}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setActive(0); if (!open) setOpen(true); }}
        onKeyDown={onKeyDown}
        style={{
          width: "100%", height: 44, padding: "0 12px", borderRadius: 10,
          border: `1px solid ${open ? "var(--teal-deep)" : "var(--hair-strong)"}`,
          background: "var(--paper)", color: "var(--ink)", fontSize: 15,
          outline: open ? "3px solid var(--teal-ring)" : "none", outlineOffset: 0,
          textOverflow: "ellipsis",
        }}
      />

      {open && mounted && rect && createPortal(
        <ul
          id={`${listId}-list`}
          role="listbox"
          aria-label={label || "Market"}
          data-metro-listbox=""
          style={{
            position: "fixed", zIndex: 2147483000,
            top: rect.top, left: rect.left, width: rect.width,
            margin: 0, padding: 4, listStyle: "none",
            background: "var(--paper)", border: "1px solid var(--hair-strong)",
            borderRadius: 12, boxShadow: "var(--shadow-md)", maxHeight: 340, overflowY: "auto",
          }}
        >
          {rows.length === 0 ? (
            <li style={{ padding: "12px 10px", fontSize: 14, color: "var(--muted)" }}>
              No market matches that. Try a city name, a two letter state, or a CBSA code.
            </li>
          ) : (
            rows.map((m, i) => (
              <li
                key={m.cbsa}
                id={`${listId}-opt-${m.cbsa}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); commit(m); }}
                style={{
                  display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline",
                  padding: "9px 10px", borderRadius: 8, cursor: "pointer",
                  background: i === active ? "var(--teal-wash)" : "transparent",
                }}
              >
                <span style={{ fontSize: 14.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.name}
                </span>
                <span className="num" style={{ fontSize: 12, color: "var(--faint)", whiteSpace: "nowrap" }}>
                  {m.npis.toLocaleString()} providers
                </span>
              </li>
            ))
          )}
        </ul>,
        document.body,
      )}
    </div>
  );
}
