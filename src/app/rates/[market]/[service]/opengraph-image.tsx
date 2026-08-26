import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { marketRate } from "@/lib/rates";
import { type Basis } from "@/lib/basis";
import { findMetroBySlug, findServiceBySlug, metroShort } from "@/components/marketing/slugs";

/**
 * THE FORWARDED-LINK CARD. @BROKER-CANON, closing gap G6.
 *
 * WHY THIS IS THE HIGHEST-LEVERAGE IMAGE ON THE ESTATE
 *
 * The most-seen surface this product owns is not a page we designed. It is a link a
 * broker pastes into an email to a client, or into a Slack channel full of other
 * brokers. Until now all 4,641 of those links unfurled BLANK: no image, no title card,
 * nothing. The single artifact most likely to travel without us was empty.
 *
 * @BROKER-MARKETING specified this on 08-06 as "PACKAGE A", nobody claimed it, and that
 * lane has been dead 22h. Verified unowned three ways before I wrote a line.
 *
 * THE RULES THIS FILE OBEYS, AND WHY EACH ONE IS NOT NEGOTIABLE
 *
 *  1. IT READS THE LIVE CELL AND HONOURS THE HONESTY FILTER. Real corpus first, the
 *     national engine second, exactly as /api/lookup and the homepage resolve — so a
 *     card can never disagree with the page it points at.
 *
 *  2. A REFUSED CELL RENDERS A CARD WITH NO FIGURE. This is the one surface that gets
 *     SCREENSHOTTED, and a screenshot outlives every correction we could ever publish.
 *     A placeholder number here would be quoted back at us in a renewal meeting by a
 *     broker who has no way to know it was invented. So when we cannot stand behind a
 *     price, the card says so in words and shows nothing.
 *
 *  3. CANON APPLIES, HARDER HERE THAN ANYWHERE. Ruling 2: no filing counts, no
 *     citations, no dated stamps. Ruling 3: plain English. A card is read by someone who
 *     never visited the site, has no context, and will not click through to find out what
 *     a percentile is. Every word here passes the reading test on its own.
 *
 *  4. THE VISUAL IS THE BRAND'S OWN IDEA, NOT DECORATION. The distribution strip -
 *     hairline range, end caps, a thick bar across the middle half, a median tick sitting
 *     LEFT of centre because real healthcare price distributions are right-skewed - is
 *     the Reddenda mark at scale. The same figure the card is about IS the card's image.
 *
 * FONT NOTE: ImageResponse cannot use next/font variables, so the real brand faces are
 * committed as TTF under `_og-fonts` and read from disk. Satori does not support woff2,
 * which is what next/font self-hosts, so these are deliberately TTF and deliberately not
 * fetched at request time: a network dependency inside an image route means a blank
 * unfurl the day Google is slow, which is the exact defect this file exists to fix.
 */

export const runtime = "nodejs";
export const alt = "What health plans have agreed to pay in this market";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0A0B0C";
const BODY = "#191D21";
const MUTED = "#5B6166";
const FAINT = "#6B7280";
const GHOST = "#8A9096";
const PAPER = "#FFFFFF";
const BAND = "#F5F8F7";
const HAIR = "#EAEBEC";
const TEAL = "#0FB5A6";
const TEAL_DEEP = "#077A70";

const money = (v: number) => "$" + Math.round(v).toLocaleString("en-US");

async function font(file: string) {
  return readFile(join(process.cwd(), "src/app/_og-fonts", file));
}

export default async function Image({
  params,
}: {
  params: Promise<{ market: string; service: string }>;
}) {
  const { market, service } = await params;
  const metro = findMetroBySlug(market);
  const svc = findServiceBySlug(service);

  const [display, mono, sans] = await Promise.all([
    font("SchibstedGrotesk-Bold.ttf"),
    font("IBMPlexMono-Medium.ttf"),
    font("IBMPlexSans-Regular.ttf"),
  ]);

  const fonts = [
    { name: "Display", data: display, weight: 700 as const, style: "normal" as const },
    { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
    { name: "Sans", data: sans, weight: 400 as const, style: "normal" as const },
  ];

  // Same resolution order as /api/lookup and the homepage. A card that disagreed with
  // the page it links to would be worse than no card.
  let cell: { p25: number; p50: number; p75: number; p90: number | null } | null = null;
  // THE PER-ROW BASIS ON THE MOST-FORWARDED SURFACE (David ruling 2026-08-10, upgrading the old
  // synthetic-only tag). The share card is the surface a link preview renders and gets
  // screenshotted, so it must disclose the REAL basis: a scaled, statewide or modeled number can never
  // unfurl as a measured metro cell. Same resolution order as the page it points at.
  let basis: Basis | null = null;
  if (metro && svc) {
    try {
      let r = await marketRate(svc.cpt, {
        cbsa: metro.cbsa,
        state: metro.state,
        metroName: metro.name,
      });
      /* ★ NO FALLBACK HERE, AND THAT IS THE WHOLE POINT.
         This block called `nationalRate` when the corpus refused. `page.tsx` for this
         exact route does NOT: it resolves through `marketRate` alone. So the page and its
         own share card resolved differently, and the divergence is not theoretical.
         MEASURED on live prod: `/rates/new-york-ny/longer-office-visit` renders
         "NO PUBLISHABLE FIGURE", while this card rendered $80 / $99 / $130 / $166 for the
         same market and code.

         The card carried a "Demo simulation" tag, so it was labelled rather than bare.
         That is not enough. A share card is the surface that gets pasted into Slack and
         screenshotted, and it outlives every correction; a reader sees four dollar figures
         and a headline, clicks through, and finds the site refusing to show them. The
         comment at the top of this block already said a card that disagreed with the page
         it links to would be worse than no card. It was right, and the fallback was the
         disagreement.

         Now the card resolves exactly as the page does. Where the page refuses, the card
         carries the mark, the market and the service with no figures, which is the honest
         unfurl for a question we decline to answer. */
      if (r.found) { cell = r.cell; basis = r.basis.basis; }
    } catch {
      // A corpus hiccup renders the honest card, never a guessed one.
      cell = null;
    }
  }

  // Tag copy + colors mirror the <BasisChip> tones (satori cannot read CSS vars, so the hex is inlined;
  // demo stays the more explicit "Demo simulation" wording because a card outlives every correction).
  // A clean local_metro cell needs no tag: it IS this metro's own measured filings.
  const OG_TAG: Partial<Record<Basis, { label: string; color: string; dashed?: boolean }>> = {
    demo: { label: "Demo simulation", color: "#6D5BD6", dashed: true },
    localized_estimate: { label: "Localized estimate", color: "#077A70" },
    statewide: { label: "Statewide", color: "#5B6166" },
    national: { label: "National", color: "#8A6414" },
  };
  const tag = basis ? OG_TAG[basis] : undefined;

  const title = svc ? svc.plain : "This procedure";
  const where = metro ? metroShort(metro) : "";

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
        {/* wordmark: the distribution glyph, then the name */}
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
          {tag && (
            <div
              style={{
                marginLeft: 16, padding: "6px 14px", borderRadius: 8, fontSize: 20,
                color: tag.color, border: `1px ${tag.dashed ? "dashed" : "solid"} ${tag.color}`,
                display: "flex", alignItems: "center",
              }}
            >
              {tag.label}
            </div>
          )}
        </div>

        {/* the question this card answers, in the words a client would use */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
          <div
            style={{
              fontFamily: "Mono",
              fontSize: 20,
              letterSpacing: 2.2,
              color: TEAL_DEEP,
              textTransform: "uppercase",
            }}
          >
            {where}
          </div>
          {/*
            THE SERVICE NAME IS THE HEADLINE, VERBATIM.

            An earlier draft read `What plans pay for a ${title.toLowerCase()}`, which
            rendered "brain mri" — and lowercasing a service name is a defect this repo
            has ALREADY filed and fixed once, because MRI, CT and EKG read as typos to a
            professional audience. Putting the name in the headline slot instead of a
            sentence removes the temptation entirely: nothing has to be case-folded to
            fit grammar, and the thing a broker recognises gets the biggest type.
          */}
          <div
            style={{
              fontFamily: "Display",
              fontSize: title.length > 26 ? 60 : 76,
              lineHeight: 1.04,
              color: INK,
              marginTop: 10,
              maxWidth: 1010,
            }}
          >
            {title}
          </div>
          {cell && (
            <div style={{ fontSize: 27, color: MUTED, marginTop: 14 }}>
              What health plans have agreed to pay here.
            </div>
          )}
        </div>

        {cell ? (
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            {/*
              THE MARK, AT SCALE. Range hairline, end caps, the middle half as a solid
              bar, and the middle price as a tick that sits LEFT of centre because these
              distributions are right-skewed. The image of the card IS its subject.
            */}
            <Strip p25={cell.p25} p50={cell.p50} p75={cell.p75} p90={cell.p90} />

            <div style={{ display: "flex", marginTop: 30 }}>
              <Figure label="Low end" value={money(cell.p25)} />
              <Figure label="Middle price" value={money(cell.p50)} strong />
              <Figure label="High end" value={money(cell.p75)} />
              {/* A national basis cannot claim a local P90 target, so suppress the priciest figure. The
                  broker never emits `national` today (see rates.ts / national.ts); this keeps the
                  standard true on the most-forwarded surface the moment a national source is added. */}
              {cell.p90 != null && basis !== "national" && <Figure label="Priciest" value={money(cell.p90)} tone={TEAL_DEEP} />}
            </div>
          </div>
        ) : (
          /*
            THE HONEST CARD. No number, no placeholder, no greyed-out shape implying a
            figure exists behind a paywall. Just the sentence, which is the product's
            whole differentiator and reads well even to someone who never clicks.
          */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "auto",
              padding: "30px 34px",
              backgroundColor: BAND,
              borderRadius: 18,
              borderLeft: `5px solid ${GHOST}`,
            }}
          >
            <div style={{ fontSize: 30, color: BODY, lineHeight: 1.4, maxWidth: 980 }}>
              We do not publish a price here we could stand behind, so we are not showing one.
            </div>
            <div style={{ fontSize: 23, color: MUTED, marginTop: 12 }}>
              Other markets for this procedure are on the site.
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 34,
            paddingTop: 24,
            borderTop: `1px solid ${HAIR}`,
          }}
        >
          <div style={{ fontSize: 23, color: MUTED }}>
            What plans have agreed to pay, with the sample size shown.
          </div>
          <div style={{ fontFamily: "Mono", fontSize: 21, color: FAINT }}>
            broker.reddenda.com
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

/** The brand mark rendered against real values. Positions are proportional to price. */
function Strip({
  p25,
  p50,
  p75,
  p90,
}: {
  p25: number;
  p50: number;
  p75: number;
  p90: number | null;
}) {
  const W = 1056;
  /*
     The domain is PADDED past the values on both sides so the end caps sit OUTSIDE the
     middle-half bar. Without the padding the bar starts flush against the left cap and
     the whole thing reads as one solid rule rather than as a distribution — which is
     the brand mark, and getting it wrong here means the most-forwarded image we own
     stops looking like us.
  */
  const rawHi = p90 ?? p75;
  const pad = (rawHi - p25 || 1) * 0.1;
  const lo = p25 - pad;
  const hi = rawHi + pad;
  const span = hi - lo || 1;
  const x = (v: number) => Math.max(0, Math.min(W, ((v - lo) / span) * W));

  const x25 = x(p25);
  const x50 = x(p50);
  const x75 = x(p75);

  return (
    <div style={{ display: "flex", width: W, height: 46, position: "relative" }}>
      {/* the full range, hairline */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 21,
          width: W,
          height: 4,
          backgroundColor: HAIR,
          borderRadius: 2,
        }}
      />
      {/* end caps */}
      <div style={{ position: "absolute", left: 0, top: 12, width: 4, height: 22, backgroundColor: GHOST }} />
      <div style={{ position: "absolute", left: W - 4, top: 12, width: 4, height: 22, backgroundColor: GHOST }} />
      {/* the middle half */}
      <div
        style={{
          position: "absolute",
          left: x25,
          top: 16,
          width: Math.max(6, x75 - x25),
          height: 14,
          backgroundColor: TEAL,
          borderRadius: 7,
        }}
      />
      {/* the middle price */}
      <div style={{ position: "absolute", left: Math.max(0, x50 - 2), top: 6, width: 5, height: 34, backgroundColor: INK, borderRadius: 2 }} />
    </div>
  );
}

function Figure({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginRight: 66 }}>
      <div
        style={{
          fontFamily: "Mono",
          fontSize: 17,
          letterSpacing: 1.6,
          color: FAINT,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "Display",
          fontSize: strong ? 62 : 44,
          color: tone ?? (strong ? INK : BODY),
          marginTop: 6,
        }}
      >
        {value}
      </div>
    </div>
  );
}
