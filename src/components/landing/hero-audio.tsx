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
   LEO III, "The Two Numbers Cut": 79 seconds, 236 words, the buy-side pitch.
   It replaces the 7:14 second cut, which named a real person in its second
   sentence against David's 08-26 order and ran far past "not wordy". The
   script, the three-candidate war room and the claim check live in
   ~/.broker-fleet/LEO3-SCRIPT.md. Rendered on the seamless PCM path
   (scripts/render-audio.mjs), mastered to -16.5 LUFS integrated with true
   peak below -1.5 dBTP, and gated through the listen-proxy (blind transcript
   match, turn-gap scan, waveform inspection) before it was allowed here.

   ONE NAME, THREE FILES OF HISTORY. The .mp3 and the .json derive from this
   basename. leo.mp3 and leo2.mp3 stay on disk and are deliberately NOT
   fallbacks: falling back would mean a listener silently hears a withdrawn
   take. If leo3 is absent the hero renders with no player, the honest state.
   ═════════════════════════════════════════════════════════════════════════════ */
const AUDIO_BASENAME = "leo3";
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
      variant={variant}
    />
  );
}

export default HeroAudio;
