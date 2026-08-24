import { METROS } from "@/lib/metros";
import { SERVICES } from "@/lib/catalog";
import { ServicePicker } from "@/components/ServicePicker";

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

export function LookupForm({
  /*
    DEFAULT CHANGED FROM "/" TO "/go" 2026-08-25 by @BROKER-5.

    "/" reads neither `service` nor `market`, so every submission from every role
    page and all 928 market pages returned the same hardcoded Sacramento
    colonoscopy. MEASURED on live prod: the rendered hero for `/` and for
    `/?service=73721&market=35620` was byte-identical, and the destination has no
    form on it, so a visitor could not even retry where they landed.

    `/go` resolves the two ids and redirects to `/rates/<market>/<service>`, which
    is a page that actually answers. See src/app/go/route.ts for why the hop
    exists rather than making "/" read the params.
  */
  action = "/go",
  service,
  market,
  compact = false,
}: {
  action?: string;
  service?: string;
  market?: string;
  compact?: boolean;
}) {
  return (
    <form
      method="get"
      action={action}
      /*
        Grid moved to a class so it can carry a breakpoint. Inline styles cannot
        hold a media query, so the three-column layout applied at 390px too and
        crushed both selects to about 85px ("Bra", "Lo"). See globals.css.
        @BROKER-MARKETING: chrome below is untouched, only the grid moved out.
      */
      className={`lookup-grid${compact ? " lookup-grid--compact" : ""}`}
      style={{
        background: "var(--paper)",
        border: "1px solid var(--hair-strong)",
        borderRadius: "var(--r-lg)",
        padding: 12,
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/*
        SERVICE is a searchable combobox rather than a native <select>, because the
        catalog is the whole national one (7,647 procedures) and not the 39-item
        basket. A native select cannot hold that, and the copy claims the full number,
        so the control has to actually reach it. This is the same "917 markets in the
        copy, 124 in the picker" defect this site already fixed once, prevented rather
        than disclaimed.

        It still degrades to a real form field: the CPT lives in a hidden input, so an
        unhydrated submit sends the default exactly as the old select did. The curated
        basket is the default view, so the first thing a broker sees is still the plain
        phrase they would say out loud, with the whole country behind it on a keystroke.
      */}
      <ServicePicker
        name="service"
        label="Service"
        featured={SERVICES}
        defaultCpt={service ?? "70553"}
      />

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
