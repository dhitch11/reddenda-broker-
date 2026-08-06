"use client";

import { useState, useEffect, useMemo } from "react";
import { METROS, searchMetros, type Metro } from "@/lib/metros";
import { money } from "@/components/Distribution";
import s from "./MarketBrief.module.css";

type Row = {
  cpt: string; plain: string; name: string; categoryLabel: string;
  cell: { p25: number; p50: number; p75: number; p90: number | null; n: number };
  confidence: "high" | "reported";
  spread: number; gapPerCase: number;
  medicareOffice: number | null; medicareFacility: number | null;
  vsMedicare: number | null; siteGap: number | null;
};

type Brief = {
  ok: boolean;
  market: { cbsa: string; name: string; state: string };
  rows: Row[];
  unavailable: { cpt: string; plain: string; reason: string }[];
  summary: {
    servedCount: number; basketCount: number;
    widestService: { plain: string; spread: number } | null;
    medianSpread: number | null; siteOfServiceCount: number;
  };
  updatedAt: string | null;
  source: { basis: string; note: string };
};

export function MarketBrief({ initial = "31080" }: { initial?: string }) {
  const [metro, setMetro] = useState<Metro>(() => METROS.find((m) => m.cbsa === initial) ?? METROS[0]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true); setFailed(false);
    fetch(`/api/brief?metro=${metro.cbsa}`)
      .then((r) => r.json())
      .then((j: Brief) => { if (!live) return; j.ok ? setData(j) : setFailed(true); })
      .catch(() => { if (live) setFailed(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [metro]);

  const results = useMemo(() => searchMetros(q, 8), [q]);
  const siteRows = useMemo(
    () => (data?.rows ?? []).filter((r) => r.siteGap != null).sort((a, b) => (b.siteGap ?? 0) - (a.siteGap ?? 0)).slice(0, 6),
    [data],
  );

  return (
    <div className={s.page}>
      <header className={s.head}>
        <p className={s.eyebrow}>Market brief</p>
        <h1 className={s.title}>Where the money leaks in one market.</h1>
        <p className={s.lede}>
          Every service we hold for this metro, ranked by how far apart the cheap and expensive options
          are. Not by price. A service where the ends are twenty dollars apart is not worth a plan
          design decision. One where they are five times apart is.
        </p>
      </header>

      <div className={s.picker}>
        <label className={s.pickerLabel} htmlFor="mb-market">Market</label>
        <div className={s.pickerBox}>
          <input
            id="mb-market"
            className={s.input}
            role="combobox"
            aria-expanded={open}
            aria-controls="mb-market-list"
            aria-label="Market"
            value={open ? q : metro.name}
            placeholder={metro.name}
            onFocus={() => { setOpen(true); setQ(""); }}
            onBlur={() => window.setTimeout(() => setOpen(false), 140)}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          />
          {open && (
            <ul id="mb-market-list" role="listbox" className={s.list}>
              {results.length === 0 && <li className={s.noMatch}>No match</li>}
              {results.map((m) => (
                <li key={m.cbsa}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={m.cbsa === metro.cbsa}
                    className={s.option}
                    onMouseDown={(e) => { e.preventDefault(); setMetro(m); setOpen(false); setQ(""); }}
                  >
                    <span className={s.optionName}>{m.name}</span>
                    <span className={s.optionMeta}>{m.npis.toLocaleString()} providers</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div aria-live="polite">
        {loading && <div className={s.skeleton} aria-hidden />}

        {!loading && failed && (
          <div className={s.empty}>
            <h2 className={s.emptyTitle}>We could not build the brief</h2>
            <p className={s.emptyBody}>This is on us, not on your search. Try again in a moment.</p>
          </div>
        )}

        {!loading && !failed && data && (
          <>
            <div className={s.stats}>
              <Stat
                value={`${data.summary.servedCount} of ${data.summary.basketCount}`}
                label="Services with defensible data"
              />
              <Stat value={`${data.summary.medianSpread}x`} label="Typical spread, 25th to 75th" />
              <Stat
                value={data.summary.widestService ? `${data.summary.widestService.spread}x` : "—"}
                label={data.summary.widestService ? `Widest: ${data.summary.widestService.plain}` : "Widest service"}
                tone="wide"
              />
              <Stat value={String(data.summary.siteOfServiceCount)} label="With a site of service gap" />
            </div>

            <section className={s.section}>
              <h2 className={s.h2}>Ranked by spread</h2>
              <p className={s.sub}>
                The gap column is what one procedure costs between a 25th percentile provider and a 75th
                percentile one, in this metro.
              </p>
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th className={s.thLeft}>Service</th>
                      <th className={s.thNum}>25th</th>
                      <th className={s.thNum}>Median</th>
                      <th className={s.thNum}>75th</th>
                      <th className={s.thNum}>Spread</th>
                      <th className={s.thNum}>Gap per case</th>
                      <th className={s.thNum}>vs Medicare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.cpt}>
                        <td className={s.tdService}>
                          <span className={s.svcName}>{r.plain}</span>
                          <span className={s.svcMeta}>
                            <span className="num">{r.cpt}</span> · {r.categoryLabel}
                            {r.confidence === "reported" && <span className={s.limited}> · limited sample</span>}
                          </span>
                        </td>
                        <td className={`num ${s.tdNum}`}>{money(r.cell.p25)}</td>
                        <td className={`num ${s.tdNumStrong}`}>{money(r.cell.p50)}</td>
                        <td className={`num ${s.tdNum}`}>{money(r.cell.p75)}</td>
                        <td className={`num ${s.tdSpread}`}>
                          <span className={s.bar} style={{ width: `${Math.min(100, (r.spread / 6) * 100)}%` }} />
                          <span className={s.spreadVal}>{r.spread}x</span>
                        </td>
                        <td className={`num ${s.tdNum}`}>{money(r.gapPerCase)}</td>
                        <td className={`num ${s.tdNum}`}>{r.vsMedicare ? `${r.vsMedicare}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {siteRows.length > 0 && (
              <section className={s.section}>
                <h2 className={s.h2}>Site of service</h2>
                <p className={s.sub}>
                  Medicare pays a different amount for the same service in an office than in a hospital
                  outpatient department. These are the widest gaps in this basket, and they are the lever an
                  employer can pull this plan year.
                </p>
                <div className={s.siteGrid}>
                  {siteRows.map((r) => (
                    <div key={r.cpt} className={s.siteCard}>
                      <div className={s.siteName}>{r.plain}</div>
                      <div className={s.siteRow}>
                        <div>
                          <div className={`num ${s.siteVal}`}>{money(r.medicareOffice)}</div>
                          <div className={s.siteCap}>Office</div>
                        </div>
                        <div className={s.siteX}>{r.siteGap}x</div>
                        <div>
                          <div className={`num ${s.siteVal}`}>{money(r.medicareFacility)}</div>
                          <div className={s.siteCap}>Facility</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className={s.footnote}>
                  Medicare allowed amounts for {data.market.state}. Commercial plans set their own site
                  differentials, and we do not publish a commercial split until the underlying filings can
                  be separated by billing class.
                </p>
              </section>
            )}

            {data.unavailable.length > 0 && (
              <section className={s.section}>
                <h2 className={s.h2}>Not shown</h2>
                <p className={s.sub}>
                  {data.unavailable.length} {data.unavailable.length === 1 ? "service has" : "services have"} no
                  defensible number in this market: {data.unavailable.map((u) => u.plain).join(", ")}. We would
                  rather show you nothing than a figure we cannot stand behind.
                </p>
              </section>
            )}

            <footer className={s.source}>
              {data.source.basis}. {data.source.note}
              {data.updatedAt &&
                ` Filings as of ${new Date(data.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`}{" "}
              This is price data, not claims. It does not include how often a service is used.
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: "wide" }) {
  return (
    <div className={s.stat}>
      <div className={`num ${s.statValue} ${tone === "wide" ? s.statWide : ""}`}>{value}</div>
      <div className={s.statLabel}>{label}</div>
    </div>
  );
}
