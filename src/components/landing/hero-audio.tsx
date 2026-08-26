import { existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { HeroAudioTransport } from "./hero-audio-transport";

/**
 * HERO AUDIO. The pitch that lives on a play button in the hero.
 * @BROKER-AUDIO, 2026-08-26. Successor to leo-player.tsx (@BROKER-12, 08-24),
 * renamed by David's order; the guard doctrine below is inherited unchanged.
 *
 * ═══ THE GUARD IS THE POINT OF THIS FILE ══════════════════════════════════════
 *
 * HARD RULE: A MEDIA CONTROL MUST NEVER RENDER IF IT CANNOT PLAY.
 *
 * On 2026-08-05 this estate shipped a homepage whose play button did nothing,
 * because the guard checked for a poster image while the mp4 it was supposed to
 * gate was gitignored. So this component gates on the ONE artifact that has to
 * exist for playback to happen, at the path the browser will actually request,
 * and it gates at build and request time on the server where the answer is
 * knowable. If the audio is not there, or is a truncated stub, this returns
 * null and the hero renders as though the player were never written. There is
 * no degraded state, no disabled button and no "audio coming soon", because
 * every one of those is a control that cannot play.
 *
 * The client half re-checks: the transport stays inert until the browser fires
 * `loadedmetadata` with a finite duration.
 */

/* ═══ WHICH CUT PLAYS ═════════════════════════════════════════════════════════
   LEO IV, "THE BUILDING": 69 seconds, 140 words, Spine B, ordered by the
   President 17:26Z on 2026-08-26. Script, war room and claim check in
   ~/.broker-fleet/LEO4-SCRIPT.md.

   WHY IT REPLACED LEO III, and the second reason is the one worth keeping:
     1. LEO III was measured at 179 wpm with ZERO pauses of 0.8s or longer, and
        it opened "Hey. I'm Leo. I'm an AI" against the never-say-AI rule.
     2. ★ ITS NUMBERS WERE NOT ON THE PAGE IT PLAYED ON. It spoke two prices for
        a brain MRI while the card beside it showed a colonoscopy site-of-care
        panel, and its second headline figure appeared ZERO times in the served
        homepage HTML. Nobody erred: the page moved to the site-of-care hero
        after the audio was cut, and a recording cannot follow. That is why
        scripts/check-spoken-drift.mjs now exists and runs before a promote.

   LEO IV lands on +168%, which this same page prints four times in the card
   121px away, and it names Medicare as the basis out loud because the card's
   own provenance line is where the local-office / national-facility split is
   disclosed.

   Rendered by scripts/render-hero-audio.mjs (one call per beat, prosody carried
   across each seam, each beat trimmed then padded with exactly the air the
   script asks for), mastered to -16.5 LUFS with true peak under -1.5 dBTP, and
   gated: 124 wpm, 17 pauses at 0.8s+, longest 2.26s, and a blind Scribe read
   that came back word-perfect against the script.

   ⚠️ leo4-take-b.mp3 sits beside this file. It is the SAME SCRIPT on the fleet's
   settings, published only so David can A/B two URLs. It is NOT a fallback and
   nothing here may ever point at it. When he rules, the loser is deleted.

   ONE NAME. The .mp3, the .json and the .vtt all derive from this basename.
   THERE IS NO FALLBACK TAKE, and there is no longer a withdrawn take on disk to
   fall back TO. leo.mp3 / leo.json / leo2.mp3 / leo2.json were deleted on
   2026-08-26: all four were serving 200 on prod, and BOTH sidecars named a real
   person in a public JSON body (leo.json three times, in its first sentence,
   beside a statement that his voice was cloned). Falling back would mean a
   listener silently hears a withdrawn take; keeping the files at all meant
   anyone could curl one. If this basename is absent the hero renders with no
   player, which is the honest state.
   ═════════════════════════════════════════════════════════════════════════════ */
/* ▶ OFF HOLD. The 18:10-18:15Z "stop" was David switching accounts, not a ruling
   (President, 18:25Z, from David direct). LEO IV gates on quality only, and it
   beats LEO III on every axis that was measured rather than felt:

     LEO III   179 wpm · ZERO pauses >= 0.8s · opens "Hey. I'm Leo. I'm an AI"
               speaks brain-MRI prices while the card beside it shows a
               colonoscopy, and its second headline figure appears ZERO times
               in the served homepage HTML
     LEO IV    124 wpm · 17 pauses >= 0.8s · no persona, no "I", no AI line,
               no name, no price · lands on +168%, which this page prints four
               times in the card 121px away · drift gate PASSES
*/
const AUDIO_BASENAME = "leo4";
const AUDIO_PUBLIC_PATH = `/audio/${AUDIO_BASENAME}.mp3`;
const MIN_PLAUSIBLE_BYTES = 32 * 1024; // a truncated or error-body mp3 is not audio

type Sidecar = {
  duration?: number;
  chapters?: { t: number; text: string }[];
  captions?: { t0: number; t1: number; text: string }[];
  peaks?: number[];
  transcript?: string;
  voice?: string;
  renderedAt?: string;
};

export function HeroAudio({ variant = "hero" }: { variant?: "band" | "hero" } = {}) {
  const publicDir = join(process.cwd(), "public");
  const mp3 = join(publicDir, "audio", `${AUDIO_BASENAME}.mp3`);
  const sidecar = join(publicDir, "audio", `${AUDIO_BASENAME}.json`);
  const vttPath = join(publicDir, "audio", `${AUDIO_BASENAME}.vtt`);

  if (!existsSync(mp3)) return null;

  let bytes = 0;
  let mtimeMs = 0;
  try {
    const st = statSync(mp3);
    bytes = st.size;
    mtimeMs = st.mtimeMs;
  } catch {
    return null;
  }
  if (bytes < MIN_PLAUSIBLE_BYTES) return null;

  /* The sidecar carries the measured duration, the synced captions, the real
     waveform peaks and the transcript. It is optional: without it the player
     still works and simply learns the duration from the browser. The audio is
     the requirement, not the metadata. */
  let meta: Sidecar = {};
  try {
    if (existsSync(sidecar)) meta = JSON.parse(readFileSync(sidecar, "utf8")) as Sidecar;
  } catch {
    meta = {};
  }

  const duration =
    typeof meta.duration === "number" && Number.isFinite(meta.duration) && meta.duration > 0
      ? meta.duration
      : null;

  /* CACHE BUST ON SOMETHING THAT ACTUALLY CHANGES.
     Netlify normalises every file's mtime at build (measured: ?v=315532800000,
     which is 1980), so mtime is a constant and only a last resort. The render
     stamps `renderedAt` into the sidecar and the byte count changes with every
     take; those are the version. */
  const renderedAtMs = typeof meta.renderedAt === "string" ? Date.parse(meta.renderedAt) : NaN;
  const version = Number.isFinite(renderedAtMs) && renderedAtMs > 0
    ? `${Math.floor(renderedAtMs / 1000)}-${bytes}`
    : `${bytes}-${Math.floor(mtimeMs)}`;
  const src = `${AUDIO_PUBLIC_PATH}?v=${version}`;

  const transcript = typeof meta.transcript === "string" ? meta.transcript.trim() : "";

  /* The waveform is drawn ONLY from measured peaks in the sidecar. If they are
     absent the transport falls back to the plain track: a waveform shape that
     does not describe the actual signal would be the same class of lie as a
     placeholder number. */
  const peaks = Array.isArray(meta.peaks) && meta.peaks.length >= 40
    ? meta.peaks.filter((p) => typeof p === "number" && Number.isFinite(p))
    : [];

  /* THE CAPTION TRACK, GATED THE SAME WAY THE AUDIO IS. A <track> whose src
     404s renders a caption button that shows nothing, which is the dead-control
     defect in miniature. So the file is checked on the server, where the answer
     is knowable, and the transport is handed null when it is not there. */
  const vtt = existsSync(vttPath) ? `/audio/${AUDIO_BASENAME}.vtt?v=${version}` : null;

  const captions = Array.isArray(meta.captions)
    ? meta.captions.filter(
        (c) =>
          c && typeof c.t0 === "number" && typeof c.t1 === "number" &&
          typeof c.text === "string" && c.t1 > c.t0,
      )
    : [];

  return (
    <HeroAudioTransport
      src={src}
      duration={duration}
      transcript={transcript}
      chapters={Array.isArray(meta.chapters) ? meta.chapters : []}
      captions={captions}
      peaks={peaks}
      vtt={vtt}
      variant={variant}
    />
  );
}

export default HeroAudio;
