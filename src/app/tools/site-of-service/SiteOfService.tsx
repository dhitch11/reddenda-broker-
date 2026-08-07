"use client";

import { useState, useCallback, useEffect } from "react";
import { SERVICES, type Service } from "@/lib/catalog";
import { STATES } from "@/lib/metros";
import { ToolExplainer } from "@/components/ToolExplainer";

/**
 * SITE OF SERVICE. The tool.
 *
 * Design intent, in one line: three sites, one bar each, drawn to the same scale,
 * so the difference is a length before it is a number. A broker should feel the
 * answer before reading it.
 *
 * The empty state is a first-class citizen here. A site we cannot price renders
 * its sentence in the slot where its number would have gone, at full weight. It
 * is not greyed out, not collapsed, not a footnote. The absence is part of the
 * argument, and with this audience the admission converts better than the claim.
 */

type Site = {
  total: number | null;
  professional: number | null;
  facility: number | null;
  unavailable: string | null;
  note?: string | null;
};

type Result = {
  found: boolean;
  cpt: string;
  name: string;
  plain: string;
  state: string;
  office?: Site;
  asc?: Site;
  hopd?: Site;
  hopdVsOfficePct?: number | null;
  ascSavingVsHopd?: number | null;
  caveat?: string | null;
  vintage?: string | null;
  message?: string;
};

const money = (v: number) => "$" + Math.round(v).toLocaleString("en-US");

const SITE_LABEL = {
  office: "Doctor's office",
  asc: "Surgery centre",
  hopd: "Hospital outpatient",
} as const;

const SITE_SUB = {
  office: "Physician fee, practice expense included",
  asc: "Physician fee plus the centre's facility fee",
  hopd: "Physician fee plus the hospital's facility fee",
} as const;

export function SiteOfService({
  initialService = "45378",
  initialState = "CA",
}: { initialService?: string; initialState?: string }) {
  const [service, setService] = useState<Service>(
    () => SERVICES.find((s) => s.cpt === initialService) ?? SERVICES[0],
  );
  const [state, setState] = useState(initialState);
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const run = useCallback(async (s: Service, st: string) => {
    setLoading(true);
    setFailed(false);
    try {
      const r = await fetch(`/api/site-of-service?service=${s.cpt}&state=${st}`);
      const j = await r.json();
      if (!r.ok || !j.ok) { setFailed(true); setData(null); }
      else setData(j.result as Result);
    } catch {
      setFailed(true); setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { run(service, state); }, [service, state, run]);

  // Only services that can carry a facility fee belong in this picker. Offering a
  // lab test here would produce a screen full of honest empty states and teach the
  // wrong lesson about whether site of service matters.
  const steerable = SERVICES.filter((s) => s.siteOfService);

  const sites = data?.found
    ? ([
        ["office", data.office!],
        ["asc", data.asc!],
        ["hopd", data.hopd!],
      ] as const)
    : [];

  const max = Math.max(...sites.map(([, s]) => s.total ?? 0), 1);
  const priced = sites.filter(([, s]) => s.total != null).sort((a, b) => a[1].total! - b[1].total!);
  // "Lowest total" is only a claim if there is something to be lower than. With one
  // priced site the badge would be true and meaningless, which reads as a boast.
  const cheapest = priced.length >= 2 ? priced[0][0] : undefined;

  return (
    <div>
      {/* ---------- controls ---------- */}
      <div
        className="card"
        style={{
          display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end",
          padding: "16px 18px",
        }}
      >
        <label style={{ flex: "1 1 260px", minWidth: 0 }}>
          <span className="eyebrow" style={{ display: "block", marginBottom: 7 }}>Service</span>
          <select
            value={service.cpt}
            onChange={(e) => setService(SERVICES.find((s) => s.cpt === e.target.value)!)}
            style={selectStyle}
          >
            {steerable.map((s) => (
              <option key={s.cpt} value={s.cpt}>{s.plain} ({s.cpt})</option>
            ))}
          </select>
        </label>

        <label style={{ flex: "0 1 200px", minWidth: 0 }}>
          <span className="eyebrow" style={{ display: "block", marginBottom: 7 }}>State</span>
          <select value={state} onChange={(e) => setState(e.target.value)} style={selectStyle}>
            {Object.entries(STATES).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* ---------- result ---------- */}
      <div style={{ marginTop: 18 }} aria-live="polite">
        {failed ? (
          <Empty
            title="The federal rate service did not respond"
            body="We would rather show you nothing than a number we cannot source. Try again in a moment."
          />
        ) : loading && !data ? (
          <div className="card" style={{ padding: 28 }}>
            <span className="eyebrow">Reading the federal fee schedules</span>
          </div>
        ) : data && !data.found ? (
          <Empty title={data.plain} body={data.message ?? ""} />
        ) : data ? (
          <div className="card" style={{ padding: "clamp(18px, 3vw, 26px)", opacity: loading ? 0.55 : 1, transition: "opacity 160ms" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <span className="eyebrow">Total cost of care · {STATES[data.state] ?? data.state}</span>

                <h2 className="display" style={{ fontSize: "clamp(24px, 3.4vw, 34px)", marginTop: 6 }}>
                  {data.plain}
                
                  <ToolExplainer
                  title="Site of Service"
                  whatItIs="Prices the same procedure in an office, a hospital, and a surgery center."
                  whatYouGet="The gap between the three, which is where plan design saves real money."
                  steps={["Pick the procedure.", "Pick your state.", "Compare the three places."]}
                />
                </h2>
                <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                  {data.name} · CPT {data.cpt}
                </p>
              </div>
              {data.hopdVsOfficePct != null && (
                <div style={{ textAlign: "right" }}>
                  <span className="eyebrow">Hospital vs office</span>
                  <div className="num" style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 700, color: "var(--ink)" }}>
                    {data.hopdVsOfficePct > 0 ? "+" : ""}{data.hopdVsOfficePct}%
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
              {sites.map(([key, s]) => (
                <SiteRow
                  key={key}
                  label={SITE_LABEL[key]}
                  sub={SITE_SUB[key]}
                  site={s}
                  max={max}
                  best={cheapest === key}
                />
              ))}
            </div>

            {data.ascSavingVsHopd != null && data.ascSavingVsHopd > 0 && (
              <p style={{ marginTop: 18, fontSize: 15, color: "var(--body)", lineHeight: 1.55 }}>
                Moving one {data.plain.toLowerCase()} out of the hospital outpatient department and into a
                surgery centre is <strong className="num">{money(data.ascSavingVsHopd)}</strong> on the
                federal schedule. A commercial plan pays a multiple of these rates, so the dollar figure
                is larger and the direction is the same.
              </p>
            )}

            {data.caveat && (
              <p style={{ marginTop: 12, fontSize: 13, color: "var(--faint)" }}>
                {data.caveat}. Billed alongside a related service on the same claim, this one is packaged
                into the larger payment rather than paid on its own.
              </p>
            )}

            <p style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--hair)", fontSize: 12.5, color: "var(--faint)", lineHeight: 1.6 }}>
              Medicare Physician Fee Schedule, OPPS addendum B and the ASC payment file
              {data.vintage ? `, ${data.vintage}` : ""}. Federal allowed amounts, not commercial rates and
              not a guaranteed price. Where a site has no total, the reason is stated in place of the
              number: a service can be bundled into another payment, paid under a different federal
              schedule, inpatient only, or not payable in that setting. Those are different facts and we
              do not collapse them into one.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** One site. The bar is the argument; the number confirms it. */
function SiteRow({
  label, sub, site, max, best,
}: { label: string; sub: string; site: Site; max: number; best: boolean }) {
  const pct = site.total != null ? Math.max(2, (site.total / max) * 100) : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{label}</span>
          {best && (
            <span className="chip" style={{ marginLeft: 8, fontSize: 11 }}>Lowest total</span>
          )}
          <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 2 }}>{sub}</div>
        </div>
        {site.total != null && (
          <span className="num" style={{ fontSize: "clamp(19px, 2.6vw, 24px)", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>
            {money(site.total)}
          </span>
        )}
      </div>

      {site.total != null ? (
        <>
          <div
            style={{ marginTop: 8, height: 12, borderRadius: 6, background: "var(--elev)", overflow: "hidden" }}
            role="img"
            aria-label={`${label}: ${money(site.total)}`}
          >
            <div
              style={{
                width: `${pct}%`, height: "100%", borderRadius: 6,
                background: best ? "var(--teal-deep)" : "var(--ghost)",
                transition: "width 520ms cubic-bezier(.2,.7,.2,1)",
              }}
            />
          </div>
          {site.note && (
            <p style={{ marginTop: 6, fontSize: 12.5, color: "var(--faint)", lineHeight: 1.5 }}>{site.note}</p>
          )}
        </>
      ) : (
        <p
          style={{
            marginTop: 8, padding: "10px 12px", borderRadius: 8,
            background: "var(--sunken)", border: "1px solid var(--hair-sunken)",
            fontSize: 13.5, color: "var(--body)", lineHeight: 1.5,
          }}
        >
          {site.unavailable}
        </p>
      )}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="card" style={{ padding: "clamp(20px, 3vw, 28px)", background: "var(--sunken)" }}>
      <span className="eyebrow">No figure published</span>
      <h2 className="display" style={{ fontSize: "clamp(20px, 2.6vw, 26px)", marginTop: 6 }}>{title}</h2>
      <p style={{ marginTop: 8, color: "var(--body)", fontSize: 15, lineHeight: 1.55, maxWidth: "62ch" }}>{body}</p>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid var(--hair-strong)",
  background: "var(--paper)",
  color: "var(--ink)",
  fontSize: 15,
};
