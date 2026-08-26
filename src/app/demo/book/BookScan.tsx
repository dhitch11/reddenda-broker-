"use client";

import { useState, useMemo, Fragment } from "react";
import s from "./BookScan.module.css";

/**
 * THE BOOK SCAN — the demo environment's hero screen.
 *
 * This is the screen that makes a General Agent lean forward, because it is the
 * shape of their actual life: a book, split by downstream brokerage, split by
 * employer group, with a renewal calendar running down the side.
 *
 * EVERY COMMERCIAL NUMBER ON THIS PAGE IS FABRICATED. It is authorised demo data,
 * it never touches the real corpus, and the banner is not dismissible. The federal
 * reference figures inside the fixture are real public CMS 2026-Q3 values, which is
 * why the shape of the thing is believable rather than arbitrary.
 *
 * Design follows Addendum A: mono means machine-produced fact, sans means editorial
 * claim. Tabular numerals on every figure. Density is the trust signal for this
 * audience, so this is a real table and not a card wall.
 */

type Driver = { cpt: string; service: string; cases: number; per_case: number; annual: number };
type Group = {
  group_id: string; name: string; lives: number; funding: string;
  cbsa_name: string; state: string; renewal_month: string;
  current_payer_label: string; brokerage_id: string; brokerage_name: string;
  annual_medical_spend: number; pmpm: number; trend_pct: number;
  modeled_site_of_care_opportunity: number; opportunity_pct_of_spend: number;
  top_drivers: Driver[];
};
type Brokerage = { id: string; name: string; groups: number; lives: number; modeled_opportunity: number; avg_trend: number };
type Book = {
  ga_name: string; brokerages: Brokerage[];
  total_groups: number; total_lives: number; total_spend: number;
  total_modeled_opportunity: number;
  renewal_calendar: { month: string; groups: number; lives: number }[];
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function BookScan({ book, groups, banner }: { book: Book; groups: Group[]; banner: string }) {
  const [brokerage, setBrokerage] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const shown = useMemo(
    () => (brokerage ? groups.filter((g) => g.brokerage_id === brokerage) : groups)
      .slice()
      .sort((a, b) => b.modeled_site_of_care_opportunity - a.modeled_site_of_care_opportunity),
    [brokerage, groups],
  );

  const peak = Math.max(...book.renewal_calendar.map((m) => m.groups), 1);
  const active = brokerage ? book.brokerages.find((b) => b.id === brokerage) : null;

  return (
    <div className={s.page}>
      <div className={s.banner} role="note">
        <span className={s.bannerDot} aria-hidden />
        {banner}
      </div>

      <header className={s.head}>
        <p className={s.eyebrow}>Book scan</p>
        <h1 className={s.title}>{book.ga_name}</h1>
        <p className={s.lede}>
          {book.total_groups} groups across {book.brokerages.length} downstream agencies,
          ranked by where the site of care is costing them the most.
        </p>
      </header>

      <div className={s.kpis}>
        <Kpi label="Groups" value={String(book.total_groups)} />
        <Kpi label="Covered lives" value={book.total_lives.toLocaleString()} />
        <Kpi label="Annual medical spend" value={usd(book.total_spend)} />
        <Kpi label="Modeled opportunity" value={usd(book.total_modeled_opportunity)} tone="accent" />
      </div>

      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.h2}>Downstream agencies</h2>
          {brokerage && (
            <button className={s.clear} onClick={() => { setBrokerage(null); setOpenGroup(null); }}>
              Show all {book.total_groups} groups
            </button>
          )}
        </div>
        <div className={s.agencyGrid}>
          {book.brokerages.map((b) => {
            const on = brokerage === b.id;
            return (
              <button
                key={b.id}
                className={`${s.agency} ${on ? s.agencyOn : ""}`}
                aria-pressed={on}
                onClick={() => { setBrokerage(on ? null : b.id); setOpenGroup(null); }}
              >
                <span className={s.agencyName}>{b.name}</span>
                <span className={s.agencyStats}>
                  <span className="num">{b.groups}</span> groups
                  <span className={s.dot} aria-hidden>·</span>
                  <span className="num">{b.lives.toLocaleString()}</span> lives
                </span>
                <span className={`num ${s.agencyOpp}`}>{usd(b.modeled_opportunity)}</span>
                <span className={s.agencyOppCap}>modeled opportunity</span>
                <span className={s.trendRow}>
                  <span className={s.trendBar} style={{ width: `${Math.min(100, (b.avg_trend / 12) * 100)}%` }} />
                  <span className={`num ${s.trendVal}`}>{b.avg_trend.toFixed(1)}%</span>
                  <span className={s.trendCap}>avg trend</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>Renewal calendar</h2>
        <p className={s.sub}>
          When the work lands. Q4 carries {q4(book.renewal_calendar)} of the book.
        </p>
        <div className={s.calendar}>
          {MONTHS.map((m) => {
            const row = book.renewal_calendar.find((x) => x.month === m);
            const g = row?.groups ?? 0;
            return (
              <div key={m} className={s.calMonth}>
                <div className={s.calBarWrap}>
                  <div
                    className={`${s.calBar} ${g === 0 ? s.calBarEmpty : ""}`}
                    style={{ height: `${g === 0 ? 3 : Math.max(12, (g / peak) * 100)}%` }}
                  />
                </div>
                <div className={`num ${s.calCount}`}>{g || ""}</div>
                <div className={s.calLabel}>{m}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>
          {active ? active.name : "Every group"}
          <span className={s.count}> {shown.length}</span>
        </h2>
        <p className={s.sub}>Ranked by modeled site of care opportunity. Open a row for the drivers.</p>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.thLeft}>Group</th>
                <th className={s.thNum}>Lives</th>
                <th className={s.thLeft}>Funding</th>
                <th className={s.thNum}>PMPM</th>
                <th className={s.thNum}>Trend</th>
                <th className={s.thNum}>Opportunity</th>
                <th className={s.thNum}>% of spend</th>
                <th className={s.thLeft}>Renews</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((g) => {
                const open = openGroup === g.group_id;
                return (
                  <Fragment key={g.group_id}>
                    <tr
                      className={`${s.row} ${open ? s.rowOpen : ""}`}
                      onClick={() => setOpenGroup(open ? null : g.group_id)}
                      tabIndex={0}
                      role="button"
                      aria-expanded={open}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenGroup(open ? null : g.group_id); }
                      }}
                    >
                      <td className={s.tdGroup}>
                        <span className={s.chev} aria-hidden>{open ? "▾" : "▸"}</span>
                        <span>
                          <span className={s.groupName}>{g.name}</span>
                          <span className={s.groupMeta}>{g.cbsa_name} · {g.current_payer_label}</span>
                        </span>
                      </td>
                      <td className={`num ${s.tdNum}`}>{g.lives.toLocaleString()}</td>
                      <td className={s.tdText}>
                        <span className={g.funding === "self-funded" ? s.pillSelf : s.pillFully}>{g.funding}</span>
                      </td>
                      <td className={`num ${s.tdNum}`}>${g.pmpm.toFixed(0)}</td>
                      <td className={`num ${s.tdNum} ${g.trend_pct >= 10 ? s.hot : ""}`}>{g.trend_pct.toFixed(1)}%</td>
                      <td className={`num ${s.tdOpp}`}>{usd(g.modeled_site_of_care_opportunity)}</td>
                      <td className={`num ${s.tdNum}`}>{g.opportunity_pct_of_spend.toFixed(2)}%</td>
                      <td className={s.tdText}>{g.renewal_month}</td>
                    </tr>
                    {open && (
                      <tr className={s.detailRow}>
                        <td colSpan={8}>
                          <div className={s.detail}>
                            <div className={s.detailHead}>
                              Top drivers · {g.name} · {g.lives.toLocaleString()} lives · {usd(g.annual_medical_spend)} annual spend
                            </div>
                            <table className={s.driverTable}>
                              <thead>
                                <tr>
                                  <th className={s.thLeft}>Service</th>
                                  <th className={s.thNum}>Cases</th>
                                  <th className={s.thNum}>Per case</th>
                                  <th className={s.thNum}>Annual</th>
                                </tr>
                              </thead>
                              <tbody>
                                {g.top_drivers.map((d) => (
                                  <tr key={d.cpt}>
                                    <td className={s.tdText}>
                                      <span className={s.driverName}>{d.service}</span>
                                      <span className={`num ${s.driverCpt}`}>{d.cpt}</span>
                                    </td>
                                    <td className={`num ${s.tdNum}`}>{d.cases}</td>
                                    <td className={`num ${s.tdNum}`}>{exact(d.per_case)}</td>
                                    <td className={`num ${s.tdOpp}`}>{usd(d.annual)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className={s.foot}>
        {banner} Federal reference figures inside this environment are real public CMS 2026-Q3 values.
        Every commercial figure is fabricated, deterministic, and isolated from the production corpus.
        Provider identifiers here are checksum invalid by construction and cannot match a real provider.
      </footer>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "accent" }) {
  return (
    <div className={s.kpi}>
      <div className={`num ${s.kpiValue} ${tone === "accent" ? s.kpiAccent : ""}`}>{value}</div>
      <div className={s.kpiLabel}>{label}</div>
    </div>
  );
}

/* Abbreviated on purpose: these are book-level aggregates, not cited rates.
   TRUNCATED, NEVER ROUNDED UP (2026-08-26 ruling). Every figure here is a MODELED
   opportunity, so rounding up inflates our own claim, which is the direction that
   costs us credibility rather than the direction that costs us a sale. $1.29M
   shows as $1.29M and $1.296M shows as $1.29M, never $1.3M. */
const floorTo = (n: number, dp: number) => {
  const f = 10 ** dp;
  return Math.floor(n * f + 1e-6) / f;
};

function usd(n: number): string {
  if (n >= 1_000_000) {
    const dp = n >= 10_000_000 ? 1 : 2;
    return "$" + floorTo(n / 1_000_000, dp).toFixed(dp) + "M";
  }
  if (n >= 1_000) return "$" + Math.floor(n / 1000) + "K";
  return "$" + Math.floor(n).toLocaleString();
}

/** Per-case figures are read out loud in a meeting. They get real dollars, never $1K.
    Whole dollars because these are MODELED per-case figures rather than a cited
    fee-schedule line, which is the thing that carries its cents. Floored, not
    rounded: same asymmetry as everywhere else, a modeled figure never rounds up. */
function exact(n: number): string {
  return "$" + Math.floor(n).toLocaleString("en-US");
}

function q4(cal: { month: string; groups: number }[]): string {
  const total = cal.reduce((n, m) => n + m.groups, 0) || 1;
  const q = cal.filter((m) => ["Oct", "Nov", "Dec", "Jan"].includes(m.month)).reduce((n, m) => n + m.groups, 0);
  return `${Math.round((q / total) * 100)}%`;
}
