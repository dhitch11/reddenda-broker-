"use client";

import { useState, useRef, useEffect, useMemo, useId } from "react";
import { createPortal } from "react-dom";
import type { Service } from "@/lib/catalog";

/**
 * PROCEDURE PICKER. Searchable, keyboard-first, the full national catalog.
 *
 * WHY THIS EXISTS
 * The site claims every procedure in the country and the control offered 39 of them.
 * That is the same defect this project already fixed once on the geography axis, where
 * the copy said 917 metros and the picker held 124. A claim the control cannot honour
 * is a claim we are not making, so this reaches the whole catalog.
 *
 * THE ONE THING THIS DOES DIFFERENTLY FROM MetroPicker
 * MetroPicker imports its 928 markets outright, because that list is small. The federal
 * catalog seed is roughly 978KB of JSON. Shipping that into the browser to power a
 * type-ahead, on a phone, for a broker between meetings, is not a trade this product
 * makes either. So the data source is split:
 *
 *   - The curated basket arrives as a prop and is the default view. Those 39 carry the
 *     phrase a broker actually says out loud ("Brain MRI"), and they are what people
 *     reach for. They render instantly, with no network involved.
 *   - Anything else in the country comes from GET /api/services?q=, which ranks the
 *     curated basket first and then everything behind it.
 *
 * RACE CONDITIONS ARE THE WHOLE RISK IN A TYPE-AHEAD
 * Every keystroke aborts the request in flight and restarts a 150ms debounce, and each
 * response is checked against a sequence number before it is allowed to render. Without
 * both, a slow answer for "mr" lands after a fast answer for "mri" and the user reads a
 * confidently wrong list with no error anywhere. That class of bug ships silently, which
 * is exactly why it gets belt and braces here.
 *
 * FAILURE IS VISIBLE, NEVER BLANK
 * Loading, no matches and network failure are three different sentences. An empty list
 * and a dead endpoint look identical to the person typing, and "no such procedure" is a
 * demo-ending answer to give about a procedure that exists. On failure the curated
 * matches we can compute locally stay on screen underneath the error, so the control
 * still works for the codes most people want.
 *
 * NEVER LOWERCASE A SERVICE NAME. MRI, CT and EKG read as typos to this audience. No
 * text-transform touches these rows, in any state.
 *
 * ACCESSIBILITY
 * Same ARIA 1.2 combobox as MetroPicker, deliberately: arrow keys move, Enter commits,
 * Escape closes and restores, Tab commits the active option, the active row is announced
 * through aria-activedescendant, and the value lives in a hidden input so the surrounding
 * form still submits with JavaScript out of the picture.
 *
 * OWNERSHIP NOTE. New file. It edits nobody's component: not MetroPicker, not lookup-form,
 * not catalog.ts. Offered to the lanes that own those to adopt rather than dropped in.
 */

const DEBOUNCE_MS = 150;

/** A hung request is not a slow request the user should sit inside forever. */
const REQUEST_TIMEOUT_MS = 8000;

/** A bare code: 4 or 5 digits, optional trailing letter (HCPCS style). */
const CODE_RE = /^\d{4,5}[A-Za-z]?$/;

/** The row shape /api/services serves. */
type Row = { cpt: string; name: string; plain: string; featured: boolean };

/**
 * `expired` is separate from `error` on purpose. This site sits behind a PIN gate whose
 * middleware answers an unauthenticated API call with a 401, and a lapsed session is not
 * a broken search: the fix is to sign back in, not to retry. Measured, not assumed, by
 * calling /api/services without the cookie and getting {"error":"locked"} back.
 */
type Status = "idle" | "loading" | "ready" | "error" | "expired";

/**
 * Nothing that crossed the network is trusted by shape. A malformed payload renders as
 * a failure, not as an empty result set, because those two must never look alike.
 */
function looksLikeRow(v: unknown): v is { cpt: string; name: string; plain: string; featured?: unknown } {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.cpt === "string" && typeof r.name === "string" && typeof r.plain === "string";
}

function parsePayload(v: unknown): { results: Row[]; total: number | null; degraded: boolean } | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (o.ok !== true || !Array.isArray(o.results)) return null;
  return {
    results: o.results.filter(looksLikeRow).map<Row>((r) => ({
      cpt: r.cpt,
      name: r.name,
      plain: r.plain,
      featured: r.featured === true,
    })),
    total: typeof o.total === "number" ? o.total : null,
    degraded: o.degraded === true,
  };
}

/**
 * The instant local pass over the curated basket. Matched the same way the route matches
 * it, so the list a user sees while the fetch is in flight cannot contradict the list
 * that settles a moment later.
 */
function localMatches(featured: Service[], query: string): Row[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const up = q.toUpperCase();
  const out: Row[] = [];
  for (const s of featured) {
    const hit =
      s.cpt.startsWith(up) ||
      s.plain.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.aka ?? []).some((a) => a.toLowerCase().includes(q));
    if (hit) out.push({ cpt: s.cpt, name: s.name, plain: s.plain, featured: true });
  }
  return out;
}

export function ServicePicker({
  name = "service",
  label = "Procedure",
  featured,
  defaultCpt,
  onChange,
  catalogSize,
}: {
  name?: string;
  label?: string;
  /**
   * The curated basket, passed in rather than imported. Shown when the query is empty,
   * because these are the procedures brokers actually ask for.
   */
  featured: Service[];
  /** Initial CPT. The component owns the selection from then on. */
  defaultCpt?: string;
  /** Optional. Only pass this from a client component. */
  onChange?: (cpt: string) => void;
  /**
   * Optional. How many procedures the catalog holds, for the hint under the basket.
   * Pass a real measured count or leave it out; the control never invents one, and it
   * learns the true figure from the first search either way.
   */
  catalogSize?: number;
}) {
  // SELF-MANAGED ON PURPOSE, for the same reason MetroPicker is.
  //
  // The lookup form this drops into is a SERVER component: a plain GET form that renders
  // the answer on first paint and works with JavaScript disabled. A server component
  // cannot hand an event handler to a client component, so a controlled value/onChange
  // pair would make this unusable in the one place it matters most. The selection lives
  // here and is written to a hidden input, which keeps the native submit intact.
  const initialCpt = (defaultCpt ?? featured[0]?.cpt ?? "").trim();
  const [selected, setSelected] = useState<{ cpt: string; label: string }>(() => {
    const hit = featured.find((s) => s.cpt === initialCpt);
    // No curated entry means no plain phrase to show yet. The bare code is terse but
    // true, and the effect below asks the server for its real name.
    return { cpt: initialCpt, label: hit?.plain ?? initialCpt };
  });

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const [status, setStatus] = useState<Status>("idle");
  const [remote, setRemote] = useState<Row[]>([]);
  const [degraded, setDegraded] = useState(false);
  const [total, setTotal] = useState<number | null>(catalogSize ?? null);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef(0);
  const listId = useId();

  const featuredRows = useMemo<Row[]>(
    () => featured.map((s) => ({ cpt: s.cpt, name: s.name, plain: s.plain, featured: true })),
    [featured],
  );

  const trimmed = query.trim();
  const local = useMemo(() => localMatches(featured, trimmed), [featured, trimmed]);

  // WHAT THE LIST SHOWS, IN ORDER OF WHAT WE ACTUALLY KNOW.
  //
  //   empty query  the curated basket, no network involved
  //   settled      whatever the server returned, full stop
  //   in flight    the last settled list, held steady under a visible "searching" row.
  //                Dropping to the curated hits on every keystroke collapses a 12 row
  //                list to one and back, which reads as breakage while someone types.
  //                Holding a list that is explicitly labelled as still searching is not
  //                the staleness bug: that bug is an OLD answer landing over a NEW one
  //                with nothing on screen to say so, and the sequence check kills it.
  //   failed       the curated hits only. There is no incoming answer to wait for, so
  //                leaving a previous query's rows under an error message would imply
  //                they answer the query on screen. They do not.
  const rows = useMemo<Row[]>(() => {
    if (!open) return [];
    if (!trimmed) return featuredRows;
    if (status === "ready") return remote;
    if (status === "loading" && remote.length > 0) return remote;
    return local;
  }, [open, trimmed, featuredRows, status, remote, local]);

  // A result set can shrink under an arrow key that already moved. Clamping here keeps
  // aria-activedescendant pointing at a row that exists.
  const activeIdx = rows.length ? Math.min(active, rows.length - 1) : 0;

  // Resolve the name of a starting code we do not carry in the basket. This can only
  // ever rename the row on screen; it never changes the submitted value.
  const needsName = useMemo(
    () => initialCpt.length > 0 && !featured.some((s) => s.cpt === initialCpt),
    [initialCpt, featured],
  );
  useEffect(() => {
    if (!needsName) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/services?q=${encodeURIComponent(initialCpt)}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const parsed = parsePayload(await res.json());
        const hit = parsed?.results.find((r) => r.cpt.toUpperCase() === initialCpt.toUpperCase());
        if (!hit) return;
        setSelected((prev) => (prev.cpt === initialCpt ? { cpt: prev.cpt, label: hit.plain || hit.name } : prev));
      } catch {
        // The code stays on screen. Terse, but never wrong, and never a placeholder name.
      }
    })();
    return () => ctrl.abort();
  }, [needsName, initialCpt]);

  // THE SEARCH. Debounced, aborted on every keystroke, and sequence-checked on arrival.
  useEffect(() => {
    if (!open) return;
    if (!trimmed) {
      setStatus("idle");
      setRemote([]);
      setDegraded(false);
      return;
    }

    setStatus("loading");
    const seq = ++seqRef.current;
    const ctrl = new AbortController();
    let timedOut = false;

    const timer = setTimeout(() => {
      const killer = setTimeout(() => {
        timedOut = true;
        ctrl.abort();
      }, REQUEST_TIMEOUT_MS);

      (async () => {
        try {
          const res = await fetch(`/api/services?q=${encodeURIComponent(trimmed)}`, { signal: ctrl.signal });
          if (res.status === 401) {
            if (seq !== seqRef.current) return;
            setStatus("expired");
            setDegraded(false);
            return;
          }
          if (!res.ok) throw new Error(`services ${res.status}`);
          const parsed = parsePayload(await res.json());
          if (!parsed) throw new Error("services payload");
          // Aborts reject, so this is defence in depth rather than the only guard. It is
          // cheap, and a stale list rendered over a fresh one is a wrong answer with no
          // error attached to it.
          if (seq !== seqRef.current) return;
          setRemote(parsed.results);
          setDegraded(parsed.degraded);
          if (parsed.total !== null) setTotal(parsed.total);
          setActive(0);
          setStatus("ready");
        } catch {
          // A keystroke abort is not a failure and must not paint one.
          if (ctrl.signal.aborted && !timedOut) return;
          if (seq !== seqRef.current) return;
          setStatus("error");
          setDegraded(false);
        } finally {
          clearTimeout(killer);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [open, trimmed]);

  // THE LISTBOX IS PORTALLED TO document.body. THIS IS NOT OVER-ENGINEERING.
  //
  // The hero's entrance animation uses a `.rise` class, and `animation` CREATES A
  // STACKING CONTEXT. Any absolutely positioned child is trapped inside it, so a
  // dropdown gets painted underneath the card that follows it in the DOM. No z-index on
  // the component or its root escapes an ancestor stacking context; that was measured on
  // MetroPicker, not assumed, and the same host page wraps this control.
  //
  // Position is measured from the input on open, on scroll and on resize, so it tracks
  // rather than drifting.
  const [rect, setRect] = useState<{ top: number; left: number; width: number; maxH: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = inputRef.current?.getBoundingClientRect();
      if (!r) return;
      /*
        FLIP UP WHEN THERE IS NO ROOM BELOW.

        Measured on live prod at 1440x900: the lookup form sits at the bottom of the
        fold, so a listbox anchored to `r.bottom` opened at y=892 with 332 of its
        340px BELOW the viewport. You typed "colon", got 12 correct answers, and saw
        an 8px sliver of them. Every assertion passed: the options existed, the
        request succeeded, there was no horizontal scroll. Only looking caught it.
      */
      const GAP = 6;
      const EDGE = 8;
      const DESIRED = 340;
      const MIN = 160;
      const below = window.innerHeight - r.bottom - GAP - EDGE;
      const above = r.top - GAP - EDGE;

      if (below < MIN && above > below) {
        const maxH = Math.min(DESIRED, above);
        setRect({ top: r.top - GAP - maxH, left: r.left, width: r.width, maxH });
      } else {
        setRect({ top: r.bottom + GAP, left: r.left, width: r.width, maxH: Math.min(DESIRED, Math.max(below, MIN)) });
      }
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
      const inList = (t as HTMLElement)?.closest?.("[data-service-listbox]");
      if (!rootRef.current?.contains(t) && !inList) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
    setStatus("idle");
    setRemote([]);
    setDegraded(false);
    // Bump the sequence so an answer already in flight cannot land on a closed control.
    seqRef.current++;
  }

  function commit(r: Row | undefined) {
    if (!r) return close();
    setSelected({ cpt: r.cpt, label: r.plain || r.name });
    onChange?.(r.cpt);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") { e.preventDefault(); setActive(() => Math.min(activeIdx + 1, rows.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(() => Math.max(activeIdx - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); commit(rows[activeIdx]); }
    else if (e.key === "Tab") { if (rows[activeIdx]) commit(rows[activeIdx]); }
    else if (e.key === "Escape") { e.preventDefault(); close(); inputRef.current?.blur(); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(Math.max(rows.length - 1, 0)); }
  }

  const isCode = CODE_RE.test(trimmed);
  const busy = Boolean(trimmed) && status === "loading";

  return (
    // z-index goes on the ROOT, not just the listbox, and only while open.
    // A `position: relative` parent with z-index auto does not create a stacking context,
    // so the listbox competes with whatever card follows it in the DOM and loses. Raising
    // the listbox alone does not fix that: it is the parent's stacking position that loses.
    <div ref={rootRef} style={{ position: "relative", zIndex: open ? 50 : undefined }}>
      {/* The real form value. Present whether or not the combobox is open. */}
      <input type="hidden" name={name} value={selected.cpt} />

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
        aria-activedescendant={open && rows[activeIdx] ? `${listId}-opt-${rows[activeIdx].cpt}` : undefined}
        aria-busy={busy}
        autoComplete="off"
        spellCheck={false}
        value={open ? query : selected.label}
        placeholder={open ? "Type a procedure or a CPT code" : undefined}
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
          aria-label={label || "Procedure"}
          aria-busy={busy}
          data-service-listbox=""
          style={{
            position: "fixed", zIndex: 2147483000,
            top: rect.top, left: rect.left, width: rect.width,
            margin: 0, padding: 4, listStyle: "none",
            background: "var(--paper)", border: "1px solid var(--hair-strong)",
            borderRadius: 12, boxShadow: "var(--shadow-md)", maxHeight: rect.maxH, overflowY: "auto",
            // Opacity only, from the keyframe globals.css already ships. The global
            // prefers-reduced-motion block neutralises it with !important, so reduced
            // motion is honoured without a second rule living here.
            animation: "fade var(--dur-fast) var(--ease) both",
          }}
        >
          {rows.map((r, i) => (
            <li
              key={r.cpt}
              id={`${listId}-opt-${r.cpt}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); commit(r); }}
              style={{
                display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline",
                padding: "9px 10px", borderRadius: 8, cursor: "pointer",
                background: i === activeIdx ? "var(--teal-wash)" : "transparent",
              }}
            >
              {/* The human phrase leads. Never lowercased: MRI and CT are not typos. */}
              <span style={{ fontSize: 14.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.plain || r.name}
              </span>
              <span className="num" style={{ fontSize: 12, color: "var(--faint)", whiteSpace: "nowrap" }}>
                {r.cpt}
              </span>
            </li>
          ))}

          {/* THE THREE HONEST STATES. Each one says something different, because
              "searching", "nothing matched" and "the search is down" are three different
              facts and a blank list tells the user the wrong one. */}

          {busy && (
            <li style={{ padding: "10px", fontSize: 13, color: "var(--muted)" }}>
              Searching the national catalog.
            </li>
          )}

          {status === "error" && (
            <li
              style={{
                padding: "10px", fontSize: 13, lineHeight: 1.45, color: "var(--exposure)",
                background: "var(--exposure-wash)", borderRadius: 8,
                marginTop: rows.length > 0 ? 4 : 0,
              }}
            >
              {rows.length > 0
                ? "Procedure search is unavailable, so only the curated procedures are listed. Keep typing to retry."
                : "Procedure search is unavailable right now. Keep typing to retry, or enter the CPT code directly."}
            </li>
          )}

          {status === "expired" && (
            <li
              style={{
                padding: "10px", fontSize: 13, lineHeight: 1.45, color: "var(--exposure)",
                background: "var(--exposure-wash)", borderRadius: 8,
                marginTop: rows.length > 0 ? 4 : 0,
              }}
            >
              This session is no longer signed in, so only the curated procedures are listed.
              Reload the page to enter the access code again.
            </li>
          )}

          {status === "ready" && degraded && (
            <li
              style={{
                padding: "10px", fontSize: 13, lineHeight: 1.45, color: "var(--spread)",
                background: "var(--spread-wash)", borderRadius: 8, marginTop: rows.length > 0 ? 4 : 0,
              }}
            >
              The national catalog did not answer. These are the curated procedures only.
            </li>
          )}

          {status === "ready" && rows.length === 0 && (
            <li style={{ padding: "12px 10px", fontSize: 14, lineHeight: 1.45, color: "var(--muted)" }}>
              {isCode
                ? `No procedure in the catalog carries the code ${trimmed.toUpperCase()}.`
                : "No procedure matches that. Try a plain phrase like Knee MRI, or a CPT code."}
            </li>
          )}

          {!trimmed && (
            <li
              style={{
                padding: "9px 10px", marginTop: 2, fontSize: 12, lineHeight: 1.4,
                color: "var(--faint)", borderTop: "1px solid var(--hair)",
              }}
            >
              {total !== null
                ? <>Type to search all <span className="num">{total.toLocaleString()}</span> procedures nationally.</>
                : "Type to search every procedure in the national catalog."}
            </li>
          )}
        </ul>,
        document.body,
      )}
    </div>
  );
}
