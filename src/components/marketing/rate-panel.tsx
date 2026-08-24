import { Distribution } from "@/components/Distribution";
import type { MarketRate, NoMarketRate } from "@/lib/rates";
import { BasisChip } from "@/components/BasisChip";
import { BASIS_META, type Basis } from "@/lib/basis";
import { SourceLine } from "./chrome";

/**
 * The result panel. The most important surface on the site.
 *
 * Every honesty decision this product makes is visible here:
 *
 *   - The scope is always stated. A broker in Fresno must never see a California
 *     number quietly labelled as theirs.
 *   - A fallback says so, in words, naming the metro it fell back from and why.
 *   - A rejected cell renders the reason, not a blank and not a zero.
 *   - The Medicare anchor carries the one caveat that stops a broker from saying
 *     something false out loud in a renewal meeting. See MEDICARE NOTE below.
 *   - Percent of Medicare is a ratio of two measured numbers, which is the fluent
 *     metric in this market. It is derived, so it is labelled as derived.
 *
 * MEDICARE NOTE, measured 2026-08-06 by scripts/probe-site-of-service.mjs.
 * `fac_rate` is the PHYSICIAN fee when the service is performed in a facility. It
 * is lower than the office rate because the practice expense is stripped out and
 * the facility bills its own payment separately under OPPS. That facility payment
 * is not in this dataset. So "facility $170" is NOT the cost of care in a hospital.
 * Printing the two side by side without that sentence would tell a broker the
 * hospital is the cheap site, which is backwards. We print the sentence.
 */

const money = (v: number) => "$" + Math.round(v).toLocaleString("en-US");

// D8/D9 (David 2026-08-10): the eyebrow and the SourceLine geo copy are driven by the REAL resolved basis
// (result.basis.basis), never by result.scope. A localized_estimate carries scope:"metro" (rates.ts) yet is
// state rates adjusted to the metro, so a scope-driven eyebrow wrongly read "Metro market" and the source
// line wrongly claimed "for your city". Keyed by basis, the same key BASIS_META uses, so the chip and these
// two labels can never disagree.
const EYEBROW_BY_BASIS: Record<Basis, string> = {
  local_metro: "Metro market",
  localized_estimate: "Localized estimate",
  statewide: "State market",
  national: "National",
  demo: "Demo",
};

const SOURCE_GEO_BY_BASIS: Record<Basis, string> = {
  local_metro: "For your city, not a statewide average",
  localized_estimate: "Adjusted to your metro's price level from statewide filings",
  statewide: "Statewide peer distribution, not a single-city sample",
  national: "National schedule only, local peers still indexing",
  demo: "Modeled demo market, not live filings",
};

export function RatePanel({
  result,
  plainName,
}: {
  result: MarketRate | NoMarketRate;
  plainName?: string | null;
}) {
  if (!result.found) return <EmptyResult result={result} plainName={plainName} />;

  const { cell, medicare } = result;
  const pctOfMedicare =
    medicare?.nonFacility && medicare.nonFacility > 0
      ? Math.round((cell.p50 / medicare.nonFacility) * 100)
      : null;

  const spreadX = cell.p25 > 0 ? cell.p75 / cell.p25 : null;

  // The unified basis standard: a national basis cannot claim a local position, so it suppresses the P90
  // target. The broker's data layer does not currently emit `national` (marketRate -> local_metro /
  // localized_estimate / statewide; national.ts -> demo / local_metro / statewide), so this is the
  // standard's defensive guard, and it keeps the rule true the moment any national source is added.
  const showsPct = BASIS_META[result.basis.basis].showsPercentile;

  return (
    <section
      className="card"
      style={{ padding: "clamp(18px, 3vw, 30px)", borderColor: "var(--hair-strong)" }}
      aria-live="polite"
    >
      {result.synthetic && (
        <div
          role="note"
          style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "10px 14px",
            borderRadius: 10, fontSize: "var(--text-sm)", lineHeight: 1.4,
            color: "var(--spread)", borderColor: "var(--spread)", border: "1px solid var(--spread)",
            background: "var(--spread-wash)",
          }}
        >
          <strong>Demo simulation</strong>
          <span style={{ color: "var(--muted)" }}>
            This market is modeled for demonstration. We show real measured rates where we hold them.
          </span>
        </div>
      )}
      <header style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>
            {EYEBROW_BY_BASIS[result.basis.basis]}
          </p>
          <h2 className="display" style={{ fontSize: "var(--text-xl)", lineHeight: 1.15 }}>
            {plainName ?? result.description}
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", marginTop: 4 }}>
            {result.geoName} <span style={{ color: "var(--ghost)" }}>·</span>{" "}
            <span className="num">procedure code {result.cpt}</span>
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/*
            THE ONE basis chip (David ruling 2026-08-10). It carries the real per-row basis, the peer
            sample n and the shared confidence bucket, so it supersedes both the old standalone "Demo
            simulation" chip (demo is now a basis tone) and the honesty-based "Limited sample" chip (the
            thin cue now uses the one confidence formula, n<20). The explanatory demo banner above stays.
          */}
          <BasisChip
            basis={result.basis.basis}
            n={result.basis.n}
            confidence={result.basis.confidence}
            scaleFactor={result.basis.scaleFactor}
          />
          {/* WAS "Every carrier in this market", then briefly "Carriers that filed,
              pooled". Both were wrong and the second was wrong in a subtler way.
              Corrected 2026-08-25 by @BROKER-5 after MEASURING the table.

              `cpt_peer_stats_cbsa` has EIGHT columns and not one of them is a
              payer: cbsa, cpt, p25, p50, p75, p90, n, updated_at. So this cut
              cannot tell you how many carriers are behind n, and any label that
              implies a count is unsupported by the row it sits on. @BROKER-8
              separately measured the upstream lake at 59.64 BILLION rows and found
              it 99.9999997% a SINGLE carrier, which means "carriers" plural was
              not merely unsupported, it was probably false.

              So the chip now says the one thing the row can support. Naming the
              limit is also the product: a visitor learns more from "we will not
              tell you what we cannot see" than from a confident plural. */}
          <span className="chip">
            <span className="chip-dot" />
            Pooled filings, payers not identified
          </span>
        </div>
      </header>

      {result.fellBackFrom && (
        <p
          style={{
            marginTop: 16,
            padding: "11px 14px",
            borderRadius: "var(--r-sm)",
            background: "var(--sunken)",
            border: "1px solid var(--hair-sunken)",
            fontSize: "var(--text-sm)",
            color: "var(--muted)",
          }}
        >
          We do not have a publishable distribution for {result.fellBackFrom.metro}, so this is the{" "}
          {result.geoName} market instead. The label above says so on purpose.
        </p>
      )}

      <div style={{ marginTop: 8 }}>
        <Distribution
          cell={cell}
          medicare={medicare?.nonFacility ?? null}
          label={`${plainName ?? result.description} price distribution in ${result.geoName}`}
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(158px, 1fr))",
          marginTop: 4,
        }}
      >
        <Stat label="Middle price" value={money(cell.p50)} tone="ink" sub="Half of this market is above it, half below" />
        <Stat
          label="Middle half spans"
          value={`${money(cell.p25)} to ${money(cell.p75)}`}
          tone="ink"
          sub={spreadX ? `${spreadX.toFixed(1)}x from low to high` : undefined}
        />
        {!showsPct ? (
          // A national basis cannot claim a local P90 target. Suppress it and say the peers are indexing.
          <Stat label="The expensive end" value="gap" tone="gap" sub="National schedule only; local peers still indexing" />
        ) : cell.p90 != null ? (
          <Stat label="The expensive end" value={money(cell.p90)} tone="exposure" sub="What the priciest providers charge" />
        ) : (
          <Stat label="The expensive end" value="gap" tone="gap" sub="Not published for this market" />
        )}
        {pctOfMedicare != null ? (
          <Stat label="Middle price vs Medicare" value={`${pctOfMedicare}%`} tone="spread" sub="Derived from the two figures shown" />
        ) : (
          <Stat label="Middle price vs Medicare" value="gap" tone="gap" sub="No Medicare rate for this market" />
        )}
      </div>

      {medicare && <MedicareAnchorBlock medicare={medicare} />}

      <SourceLine
        updatedAt={result.updatedAt}
        scope={SOURCE_GEO_BY_BASIS[result.basis.basis]}
      />
    </section>
  );
}

function MedicareAnchorBlock({
  medicare,
}: {
  medicare: { nonFacility: number | null; facility: number | null; year: number | null };
}) {
  const { nonFacility, facility } = medicare;
  if (nonFacility == null && facility == null) return null;

  // A split only exists where the two figures actually differ. For 22 of the 39
  // services in the basket they are identical, and printing "office $332,
  // facility $332" as if it were a finding teaches the reader that site of
  // service does not matter. So we only open the comparison when it is real.
  const hasSplit = nonFacility != null && facility != null && Math.abs(nonFacility - facility) > 0.5;

  return (
    <div
      style={{
        marginTop: 18,
        padding: 16,
        borderRadius: "var(--r-sm)",
        background: "var(--band)",
        border: "1px solid var(--hair)",
      }}
    >
      <p className="eyebrow" style={{ color: "var(--muted)", marginBottom: 10 }}>
        Medicare reference
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 26, alignItems: "flex-start" }}>
        {nonFacility != null && (
          <div>
            <p className="num" style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--ink)" }}>
              {money(nonFacility)}
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginTop: 2 }}>
              Performed in an office
            </p>
          </div>
        )}
        {hasSplit && facility != null && (
          <div>
            <p className="num" style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--ink)" }}>
              {money(facility)}
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginTop: 2 }}>
              Physician fee in a facility
            </p>
          </div>
        )}
      </div>

      {hasSplit && (
        <p
          style={{
            marginTop: 12,
            fontSize: "var(--text-xs)",
            lineHeight: 1.65,
            color: "var(--muted)",
            borderLeft: "2px solid var(--spread)",
            paddingLeft: 11,
          }}
        >
          <strong style={{ color: "var(--spread)", fontWeight: 600 }}>Read this carefully.</strong> The
          facility figure is the physician fee only. When the same service happens in a hospital outpatient
          department, the hospital bills its own facility payment on top, and that amount is not in this
          dataset. So the lower number here does not mean the hospital is the cheaper site. It usually is
          not. We will not publish a total cost by site of service until we hold the facility payment.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "ink" | "exposure" | "spread" | "gap";
}) {
  const color =
    tone === "exposure" ? "var(--exposure)" : tone === "spread" ? "var(--spread)" : "var(--ink)";

  return (
    <div
      style={{
        background: "var(--elev)",
        border: "1px solid var(--hair)",
        borderRadius: "var(--r-sm)",
        padding: "13px 14px",
      }}
    >
      <p
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: ".05em",
          color: "var(--faint)",
          fontFamily: "var(--font-mono), monospace",
        }}
      >
        {label}
      </p>
      {tone === "gap" ? (
        <p style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="gap-dot" />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>Not available</span>
        </p>
      ) : (
        <p className="num" style={{ marginTop: 5, fontSize: 21, fontWeight: 700, color, lineHeight: 1.2 }}>
          {value}
        </p>
      )}
      {sub && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--faint)", marginTop: 4, lineHeight: 1.45 }}>{sub}</p>
      )}
    </div>
  );
}

function EmptyResult({ result, plainName }: { result: NoMarketRate; plainName?: string | null }) {
  return (
    <section className="empty-state" style={{ padding: "clamp(18px, 3vw, 30px)" }} aria-live="polite">
      <p className="eyebrow" style={{ color: "var(--muted)", marginBottom: 10 }}>
        No publishable figure
      </p>
      <h2
        className="display"
        style={{ fontSize: "var(--text-lg)", color: "var(--ink)", marginBottom: 10 }}
      >
        {plainName ?? result.description} in {result.geoName}
      </h2>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.65, maxWidth: "62ch" }}>
        {result.message}
      </p>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginTop: 14, lineHeight: 1.65, maxWidth: "62ch" }}>
        This is the product working, not the product failing. We publish a number when the filings support
        one and we say nothing when they do not. Try another market or another service.
      </p>
    </section>
  );
}
