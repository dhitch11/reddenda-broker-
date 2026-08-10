"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Distribution, money } from "@/components/Distribution";
import { SERVICES, searchServices, type Service } from "@/lib/catalog";
import { METROS, searchMetros, type Metro } from "@/lib/metros";
import { ToolExplainer } from "@/components/ToolExplainer";
import { BasisChip } from "@/components/BasisChip";
import { type CellBasis } from "@/lib/basis";

type LookupResponse = {
  ok: boolean;
  result?: {
    found: boolean;
    cpt: string;
    description: string;
    scope?: "metro" | "state";
    geoName?: string;
    fellBackFrom?: { metro: string; reason: string };
    cell?: { p25: number; p50: number; p75: number; p90: number | null; n: number };
    confidence?: "high" | "reported";
    medicare?: { nonFacility: number | null; facility: number | null; year: number | null } | null;
    updatedAt?: string | null;
    message?: string;
    /** Demo simulation flag (David ruling 2026-08-10): true when this market is modeled, not measured. */
    synthetic?: boolean;
    /**
     * THE PER-ROW RATE BASIS (David ruling 2026-08-10), computed server-side in rates.ts / national.ts
     * from the real geography this cell resolved from. The chip renders only what this says, so a scaled
     * or statewide number can never wear a "local" label. Optional only for old cached payloads.
     */
    basis?: CellBasis;
  };
  plainName?: string | null;
  payers?: {
    rows: {
      payer: string; label: string; brand: string; n: number;
      cell: { p25: number; p50: number; p75: number; p90: number | null; n: number };
      flatSchedule: boolean;
    }[];
    suppressedContaminated: number;
    excludedOutOfState: number;
  } | null;
  source?: { basis: string; peerUpdatedAt: string | null; note: string };
};

export function RateCheck({
  initialMetro = "31080",
  initialService = "70553",
}: { initialMetro?: string; initialService?: string }) {
  const [metro, setMetro] = useState<Metro>(
    () => METROS.find((m) => m.cbsa === initialMetro) ?? METROS[0],
  );
  const [service, setService] = useState<Service>(
    () => SERVICES.find((s) => s.cpt === initialService) ?? SERVICES[0],
  );
  const [data, setData] = useState<LookupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const reqId = useRef(0);

  const run = useCallback(async (m: Metro, s: Service) => {
    const id = ++reqId.current;
    setLoading(true);
    setFailed(false);
    try {
      const r = await fetch(`/api/lookup?service=${s.cpt}&metro=${m.cbsa}&payers=1`);
      const j: LookupResponse = await r.json();
      if (id !== reqId.current) return; // a newer request already went out
      if (!r.ok || !j.ok) { setFailed(true); setData(null); }
      else setData(j);
    } catch {
      if (id === reqId.current) { setFailed(true); setData(null); }
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { run(metro, service); }, [metro, service, run]);

  const res = data?.result;

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "var(--sp-5) var(--sp-4) var(--sp-8)" }}>
      <header style={{ marginBottom: "var(--sp-6)" }}>

        <h1 style={{ fontSize: "clamp(26px, 5vw, 38px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 var(--sp-2)" }}>
          What plans have agreed to pay
        
          <ToolExplainer
          title="Rate Check"
          whatItIs="Shows what health plans pay for one service in one city."
          whatYouGet="The low, middle and high price, so you know whether a quote is fair."
          steps={["Pick your city.", "Pick the procedure.", "Read the three prices."]}
        />
        </h1>
        <p style={{ color: "var(--text-2)", margin: 0, fontSize: 16 }}>
          Pick your city and a procedure. See the low, middle and high price.
        </p>
      </header>

      <div style={{ display: "grid", gap: "var(--sp-3)", gridTemplateColumns: "1fr", marginBottom: "var(--sp-5)" }}>
        <Picker label="Market" value={metro.name} onPick={setMetro} search={searchMetros} render={(m) => m.name} keyOf={(m) => m.cbsa} />
        <Picker label="Service" value={`${service.plain}`} hint={service.cpt} onPick={setService} search={searchServices} render={(s) => `${s.plain}`} secondary={(s) => `${s.cpt} · ${s.name}`} keyOf={(s) => s.cpt} />
      </div>

      <section
        aria-live="polite"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          background: "var(--surface)",
          padding: "var(--sp-5) var(--sp-5) var(--sp-4)",
          minHeight: 240,
        }}
      >
        {loading && <Skeleton />}

        {!loading && failed && (
          <Empty
            title="We could not reach the rate service"
            body="This is on us, not on your search. Try again in a moment."
          />
        )}

        {!loading && !failed && res && !res.found && (
          <Empty title="No defensible number for this market" body={res.message ?? ""} />
        )}

        {!loading && !failed && res?.found && res.cell && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)", alignItems: "baseline", justifyContent: "space-between", marginBottom: "var(--sp-2)" }}>
              <div>
                <div style={{ fontSize: 19, fontWeight: 650, letterSpacing: "-0.01em" }}>
                  {data?.plainName ?? res.description}
                </div>
                <div style={{ color: "var(--text-3)", fontSize: 13 }}>
                  CPT {res.cpt} · {res.geoName}
                  {res.scope === "state" && " · statewide"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {/*
                  THE ONE basis chip (David ruling 2026-08-10), upgrading the old "Demo simulation" note.
                  It carries the real per-row basis + peer sample n + the shared confidence bucket, so it
                  supersedes the ad-hoc synthetic badge (demo is now a basis tone) and the honesty-based
                  "Limited sample" badge (the thin cue now uses the one formula, n<20).
                */}
                {res.basis && (
                  <BasisChip
                    basis={res.basis.basis}
                    n={res.basis.n}
                    confidence={res.basis.confidence}
                    scaleFactor={res.basis.scaleFactor}
                  />
                )}
                <Badge tone="soft">Every carrier in this market</Badge>
              </div>
            </div>

            {res.scope === "state" && res.fellBackFrom && (
              <Note>
                We do not have enough filings for {res.fellBackFrom.metro} on this service, so this is the
                statewide figure. It is not your metro.
              </Note>
            )}

            <Distribution
              cell={res.cell}
              medicare={res.medicare?.nonFacility ?? null}
              label={`${res.description} in ${res.geoName}`}
            />

            <div style={{ display: "flex", gap: "var(--sp-6)", flexWrap: "wrap", paddingTop: "var(--sp-4)", marginTop: "var(--sp-2)", borderTop: "1px solid var(--border)" }}>
              <Stat label="Spread, 25th to 75th" value={`${(res.cell.p75 / res.cell.p25).toFixed(1)}x`} />
              {res.medicare?.nonFacility != null && (
                <Stat label="Median vs Medicare" value={`${Math.round((res.cell.p50 / res.medicare.nonFacility) * 100)}%`} />
              )}
              {res.medicare?.facility != null && res.medicare.nonFacility != null &&
                res.medicare.facility !== res.medicare.nonFacility && (
                <Stat
                  label="Medicare, office vs facility"
                  value={`${money(res.medicare.nonFacility)} / ${money(res.medicare.facility)}`}
                />
              )}
            </div>

            {data?.payers && <Payers payers={data.payers} state={res.geoName ?? ""} />}

            <footer style={{ marginTop: "var(--sp-4)", paddingTop: "var(--sp-3)", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
              {data?.source?.basis}. {data?.source?.note} These are prices, not bills. They do not
              show how often anyone needs the procedure.
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

function Payers({ payers, state }: { payers: NonNullable<LookupResponse["payers"]>; state: string }) {
  if (!payers.rows.length) {
    return (
      <div style={{ marginTop: "var(--sp-4)", paddingTop: "var(--sp-3)", borderTop: "1px solid var(--border)" }}>
        <SectionLabel>By plan</SectionLabel>
        <p style={{ color: "var(--text-2)", fontSize: 14, margin: "var(--sp-2) 0 0" }}>
          No plan filed in this market has enough usable data for a per-plan figure.
          {payers.excludedOutOfState > 0 &&
            ` ${payers.excludedOutOfState} filings here came from out-of-state plans covering local providers, so they describe a different market and are not counted.`}
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "var(--sp-4)", paddingTop: "var(--sp-3)", borderTop: "1px solid var(--border)" }}>
      <SectionLabel>By plan</SectionLabel>
      <div style={{ overflowX: "auto", marginTop: "var(--sp-2)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 420 }}>
          <thead>
            <tr style={{ color: "var(--text-3)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              <th align="left" style={{ padding: "6px 8px 6px 0", fontWeight: 600 }}>Plan</th>
              <th align="right" style={{ padding: "6px 8px", fontWeight: 600 }}>Median</th>
              <th align="right" style={{ padding: "6px 0 6px 8px", fontWeight: 600 }}>Filings</th>
            </tr>
          </thead>
          <tbody>
            {payers.rows.map((p) => (
              <tr key={p.payer} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "9px 8px 9px 0" }}>
                  {p.label}
                  {p.flatSchedule && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: "var(--caution)" }}>
                      standard schedule
                    </span>
                  )}
                </td>
                <td align="right" className="num" style={{ padding: "9px 8px", fontWeight: 600 }}>{money(p.cell.p50)}</td>
                <td align="right" className="num" style={{ padding: "9px 0 9px 8px", color: "var(--text-3)" }}>{p.n.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payers.excludedOutOfState > 0 && (
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: "var(--sp-3) 0 0", lineHeight: 1.6 }}>
          {payers.excludedOutOfState} filings from out-of-state plans covering providers in {state} are not
          counted here. They are real filings, but they describe a plan an employer in this market cannot buy.
        </p>
      )}
    </div>
  );
}

function Picker<T>({
  label, value, hint, onPick, search, render, secondary, keyOf,
}: {
  label: string; value: string; hint?: string;
  onPick: (v: T) => void;
  search: (q: string, limit?: number) => T[];
  render: (v: T) => string;
  secondary?: (v: T) => string;
  keyOf: (v: T) => string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const results = search(q, 8);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={box} style={{ position: "relative" }}>
      <label style={{ display: "block", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 5, fontWeight: 600 }}>
        {label}
      </label>
      <input
        value={open ? q : value}
        placeholder={value}
        onFocus={() => { setOpen(true); setQ(""); }}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        aria-label={label}
        aria-expanded={open}
        role="combobox"
        aria-controls={`${label}-list`}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-strong)", background: "var(--bg)", fontSize: 15,
        }}
      />
      {hint && !open && (
        <span className="num" style={{ position: "absolute", right: 14, top: 38, fontSize: 13, color: "var(--text-3)", pointerEvents: "none" }}>
          {hint}
        </span>
      )}
      {open && (
        <ul
          id={`${label}-list`}
          role="listbox"
          style={{
            position: "absolute", zIndex: 20, top: "100%", left: 0, right: 0, marginTop: 4,
            listStyle: "none", padding: 4, background: "var(--bg)",
            border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 300, overflowY: "auto",
          }}
        >
          {results.length === 0 && (
            <li style={{ padding: "10px 12px", color: "var(--text-3)", fontSize: 14 }}>No match</li>
          )}
          {results.map((r) => (
            <li key={keyOf(r)}>
              <button
                role="option"
                aria-selected={false}
                onClick={() => { onPick(r); setOpen(false); setQ(""); }}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "9px 12px",
                  background: "transparent", border: "none", cursor: "pointer",
                  borderRadius: "var(--radius-sm)", fontSize: 14,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontWeight: 550 }}>{render(r)}</div>
                {secondary && (
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{secondary(r)}</div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", fontWeight: 600 }}>
    {children}
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="num" style={{ fontSize: 18, fontWeight: 650 }}>{value}</div>
    <div style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-3)" }}>{label}</div>
  </div>
);

const Badge = ({ children, tone }: { children: React.ReactNode; tone: "solid" | "soft" }) => (
  <span
    className="num"
    style={{
      fontSize: 12, padding: "4px 9px", borderRadius: 999,
      background: tone === "solid" ? "var(--accent-soft)" : "var(--surface-2)",
      color: tone === "solid" ? "var(--accent)" : "var(--text-2)",
      border: "1px solid var(--border)", whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 12px", fontSize: 13, color: "var(--text-2)", margin: "var(--sp-3) 0 0" }}>
    {children}
  </div>
);

const Empty = ({ title, body }: { title: string; body: string }) => (
  <div style={{ padding: "var(--sp-5) 0", textAlign: "center" }}>
    <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{title}</div>
    <p style={{ color: "var(--text-2)", fontSize: 14, maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>{body}</p>
  </div>
);

const Skeleton = () => (
  <div aria-hidden style={{ paddingTop: 8 }}>
    {[38, 8, 60].map((h, i) => (
      <div key={i} style={{ height: h, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", marginBottom: 16 }} />
    ))}
  </div>
);
