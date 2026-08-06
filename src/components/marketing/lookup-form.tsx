import { METROS } from "@/lib/metros";
import { SERVICES, CATEGORY_LABEL, type Category } from "@/lib/catalog";

/**
 * The lookup.
 *
 * A plain GET form. No JavaScript, no client-side state, no data fetching in the
 * browser. The server reads the query string and renders the answer.
 *
 * Why this shape and not a React search widget:
 *   - It works cold, on the first paint, before hydration, and with JS disabled.
 *     The single conversion event for this site is a real number on screen inside
 *     fifteen seconds, and nothing beats a form submit for that.
 *   - Every result is a real URL, so a broker can send it to a client, and so the
 *     programmatic market pages and the hero share one rendering path.
 *   - No rate query can leak into the client bundle, because there is no client
 *     data code at all. The estate has shipped client-side padlocks over fully
 *     served payloads before.
 *
 * The service list is grouped and phrased the way a benefits professional speaks.
 * They do not know what a CPT code is. The code is secondary detail, shown after
 * the plain name, never instead of it.
 */

const ORDER: Category[] = [
  "imaging",
  "surgery",
  "office",
  "diagnostic",
  "lab",
  "therapy",
  "maternity",
  "behavioral",
  "cardiac",
  "pain",
  "emergency",
];

export function LookupForm({
  action = "/",
  service,
  market,
  compact = false,
}: {
  action?: string;
  service?: string;
  market?: string;
  compact?: boolean;
}) {
  const grouped = ORDER.map((c) => ({
    category: c,
    label: CATEGORY_LABEL[c],
    items: SERVICES.filter((s) => s.category === c),
  })).filter((g) => g.items.length > 0);

  return (
    <form
      method="get"
      action={action}
      style={{
        display: "grid",
        gap: 10,
        gridTemplateColumns: compact ? "1fr" : "minmax(0,1.15fr) minmax(0,1fr) auto",
        alignItems: "end",
        background: "var(--paper)",
        border: "1px solid var(--hair-strong)",
        borderRadius: "var(--r-lg)",
        padding: 12,
        boxShadow: "var(--shadow-md)",
      }}
    >
      <Field label="Service" htmlFor="service">
        <select id="service" name="service" defaultValue={service ?? "70553"} style={selectStyle}>
          {grouped.map((g) => (
            <optgroup key={g.category} label={g.label}>
              {g.items.map((s) => (
                <option key={s.cpt} value={s.cpt}>
                  {s.plain} ({s.cpt})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      <Field label="Market" htmlFor="market">
        <select id="market" name="market" defaultValue={market ?? "31080"} style={selectStyle}>
          {METROS.map((m) => (
            <option key={m.cbsa} value={m.cbsa}>
              {m.name}
            </option>
          ))}
        </select>
      </Field>

      <button type="submit" className="btn btn-primary" style={{ height: 46, whiteSpace: "nowrap" }}>
        Show the market
      </button>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
      <label
        htmlFor={htmlFor}
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "var(--track-eyebrow)",
          color: "var(--faint)",
          paddingLeft: 2,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 46,
  padding: "0 12px",
  borderRadius: "var(--r-sm)",
  border: "1px solid var(--hair)",
  background: "var(--paper)",
  color: "var(--ink)",
  fontSize: "var(--text-base)",
  appearance: "none",
  // The native chevron differs per platform and one of them is an emoji glyph.
  // Draw our own so the control is identical everywhere.
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1.5L6 6.5L11 1.5' stroke='%235B6166' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 34,
};
