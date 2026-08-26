import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SCALE } from "@/lib/national";

/**
 * THE SITE-WIDE CARD. @BROKER-CANON.
 *
 * The per-market card handles the 4,641 `/rates` pages. This one covers everything
 * else a broker might paste: the home page, `/brokers`, `/general-agencies`,
 * `/employers`, the tools. Those unfurled blank too.
 *
 * It carries NO price. Deliberately. A site-wide card is served for a dozen different
 * URLs, so any figure on it would be decoration rather than an answer to the page
 * being shared — and a number with no market attached is exactly the shape that gets
 * screenshotted and quoted back wrong. Scale and capability language instead, which is
 * the bigger claim and needs no citation (Ruling 2), in plain words (Ruling 3).
 *
 * The scale figures are computed from the engine, never typed in, so this image cannot
 * drift from what the product can actually reach.
 */

export const runtime = "nodejs";
/* The alt carried the same "in every U.S. city" claim as the card body. Alt text is
   read aloud by a screen reader and indexed by search, so it is published copy. */
// ⛔ KILL LIST (President 17:26Z, legal-honesty §3.1). "What health plans have agreed
// to pay" describes an agreement we are not party to and cannot see the terms of. What
// we hold is what they FILED. The verb is the whole correction.
export const alt = "Reddenda. The rates health plans filed, with the sample size on every number";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0A0B0C";
const MUTED = "#5B6166";
const FAINT = "#6B7280";
const GHOST = "#8A9096";
const PAPER = "#FFFFFF";
const HAIR = "#EAEBEC";
const TEAL = "#0FB5A6";
const TEAL_DEEP = "#077A70";

async function font(file: string) {
  return readFile(join(process.cwd(), "src/app/_og-fonts", file));
}

export default async function Image() {
  const [display, mono, sans] = await Promise.all([
    font("SchibstedGrotesk-Bold.ttf"),
    font("IBMPlexMono-Medium.ttf"),
    font("IBMPlexSans-Regular.ttf"),
  ]);

  /*
     THIS USED `METROS.length` (928, the picker) RATHER THAN `SCALE.metros` (918, the
     engine), and the reasoning was sound at the time: a card claiming 918 beside a site
     claiming 928 is the "917 in the copy, 124 in the picker" defect in miniature, on the
     one surface that travels with no site next to it to reconcile against.

     That reasoning now points the other way. /tools was corrected to 918 because its
     sentence is a claim about what the TOOL answers, and the engine answers for 918
     (metros.txt: 918 entries; federal-catalog.metros: 918). So 928 here would be the
     card disagreeing with the site, which is the exact thing the original comment was
     protecting against. Both say 918, from the same computed constant, and the three
     metrics below now all come from one source instead of two.
  */
  const metros = SCALE.metros.toLocaleString("en-US");
  const procedures = SCALE.procedures.toLocaleString("en-US");
  const cells = SCALE.cells.toLocaleString("en-US");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: PAPER,
          padding: "62px 72px",
          fontFamily: "Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="46" height="20" viewBox="0 0 46 20">
            <rect x="0" y="4" width="2.5" height="12" fill={GHOST} />
            <rect x="43.5" y="4" width="2.5" height="12" fill={GHOST} />
            <rect x="2.5" y="9" width="41" height="2" fill={HAIR} />
            <rect x="11" y="6.5" width="19" height="7" rx="3.5" fill={TEAL} />
            <rect x="17" y="3" width="2.6" height="14" fill={INK} />
          </svg>
          <div style={{ fontFamily: "Display", fontSize: 30, color: INK, marginLeft: 14 }}>
            Reddenda
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div
            style={{
              fontFamily: "Mono",
              fontSize: 20,
              letterSpacing: 2.2,
              color: TEAL_DEEP,
              textTransform: "uppercase",
            }}
          >
            Healthcare price intelligence
          </div>
          <div
            style={{
              fontFamily: "Display",
              fontSize: 82,
              lineHeight: 1.03,
              color: INK,
              marginTop: 14,
              maxWidth: 1000,
            }}
          >
            Know what the market pays.
          </div>
          <div style={{ fontSize: 30, color: MUTED, marginTop: 18, maxWidth: 900, lineHeight: 1.4 }}>
            {/* WAS "What every carrier has agreed to pay providers, in every U.S. city."
                This is the site's main share card, the most-forwarded surface we publish,
                and it carried the broadest version of a claim the product refuses on its
                own screens. Kaiser and Sutter file zero conventional in-network rows by
                construction, and the engine answers for 918 metros, not every U.S. city. */}
            What health plans have agreed to pay providers, with the sample size on every number.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 44,
            paddingTop: 26,
            borderTop: `1px solid ${HAIR}`,
          }}
        >
          <div style={{ display: "flex" }}>
            {/* ★ "Every / carrier" STOOD HERE AS A STAT, and no text search could ever
                have found it: the claim was split across a value and a label, so greps for
                "every carrier" walked past it while it rendered in 40px type on the most
                forwarded surface we publish. A screenshot found it. Replaced with the
                third computed figure, so all three now come from SCALE and every one of
                them is a count we can produce on demand. */}
            <Metric value={metros} label="metro markets" />
            <Metric value={procedures} label="procedures" />
            <Metric value={cells} label="market cells" />
          </div>
          <div style={{ fontFamily: "Mono", fontSize: 21, color: FAINT }}>broker.reddenda.com</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Display", data: display, weight: 700 as const, style: "normal" as const },
        { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
        { name: "Sans", data: sans, weight: 400 as const, style: "normal" as const },
      ],
    },
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginRight: 56 }}>
      <div style={{ fontFamily: "Display", fontSize: 40, color: INK }}>{value}</div>
      <div
        style={{
          fontFamily: "Mono",
          fontSize: 16,
          letterSpacing: 1.5,
          color: FAINT,
          textTransform: "uppercase",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}
