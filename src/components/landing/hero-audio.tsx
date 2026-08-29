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

   ONE NAME. The .mp3, the .json and the .vtt all derive from this basename.
   THERE IS NO FALLBACK TAKE, and there is no withdrawn take on disk to fall
   back TO. leo.mp3 / leo.json / leo2.mp3 / leo2.json were deleted on 2026-08-26:
   all four were serving 200 on prod, and BOTH sidecars named a real person in a
   public JSON body (leo.json three times, in its first sentence, beside a
   statement that his voice was cloned). Falling back would mean a listener
   silently hears a withdrawn take; keeping the files at all meant anyone could
   curl one. If this basename is absent the hero renders with no player, which
   is the honest state.

   ⚠️ THE PARAGRAPH ABOVE WAS FALSE FOR TWO DAYS AND IS TRUE AGAIN AS OF
   2026-08-29. Between 08-26 and 08-29 SEVEN withdrawn takes sat on disk and
   served 200 to anonymous curl on prod: pitch-v1 through pitch-v5 (the
   superseded hero pitches, 6:27 to 9:35 each) plus leo4 and leo4-take-b (the
   69-second A/B pair, whose own note here said "when he rules, the loser is
   deleted" and he ruled by shipping pitch-v6, yet neither was deleted). 21 files,
   51,422,525 bytes, every one of them carrying a FULL TRANSCRIPT of a pitch
   this site no longer makes, as plain crawlable JSON. Nothing in the repo
   referenced any of them; "nothing references it" is not "nobody can reach it",
   which is the exact lesson leo.json taught on 08-26. All 21 are deleted.
   The rule, restated so the next lane does not relearn it: A TAKE ON A PUBLIC
   HOST IS A TAKE A LISTENER CAN HEAR. Retire the .mp3, the .json and the .vtt
   in ONE commit, and curl the sidecar afterwards, not just the media. History
   belongs in the script file and in git, never in the publish directory.
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
/* ▶ PITCH V2, by David's order 2026-08-26: the full 7:35 cinematic pitch replaces the
   70-second LEO IV ("all there is is some weird 1-minute thing... IT'S A PITCH!!!").
   Rendered by render-hero-audio.mjs in the ear-locked David Thomas recipe at speed
   0.86 with scripted air. Listen-proxy measured: 455.21s, 136 wpm overall, 160 while
   speaking, 98 pauses (35 at 0.8s+, longest 1.64s), -17.0 LUFS, TP -1.9.
   THE 105-125 BAND IS OVERRULED FOR THIS PIECE, ON THE RECORD: David's later order
   asked for hyped, exciting, addictive energy with "no gaps, no pauses", which is a
   faster profile than the band. LEO III's defect was 179 wpm with ZERO pauses; this
   has 67 seconds of real air placed where the writer put it. The gate did its job by
   forcing the question; the answer is David's stated ear, not the number. */
/* ▶ PITCH V3 (David, 2026-08-26): national max scale, every data class spoken as held
   including pharmacy end to end, delivered "normal and fast" by his direct order.
   speed 1.0, air 0.8 + scripted holds. Measured: 435.64s, 162 wpm overall / 191
   speaking, 29 pauses at 0.8s+, -17.0 LUFS. The monologue band stays overruled for
   this piece on the same order; v1/v2 kept on disk for the record. */
/* ▶ PITCH V4 (David, 2026-08-27): the general-agency offering rebuilt around the Form
   5500 at max scale, written to be exciting to listen to: every employer with 100+ on a
   plan files who insures them, who their broker is and what that broker was paid; the
   government publishes it and nobody reads it; we read every one, every state, every
   year, and hand a producer the whole territory sorted by renewal month, with the plan
   administrator, the accounting firm that prepared the filing, and the phone number off
   the filing. Same voice, same pace law as v3. */
/* ▶ PITCH V5 (2026-08-27): v4 spoke two fields as promises that the filing does not carry
   for us today (preparer_firm is null on every in-scope row; admin_name on 2%). The
   showcase voice covers capabilities fulfilled at onboarding, not a claim about a specific
   public form. The beat now stands on what the view actually holds at scale: the phone off
   the filing (99%), the broker of record and their pay (90%), carrier, participants, funding
   class, plan year; the administrator only where the filing names one. */
/* ▶ PITCH V6 (2026-08-27): the signer beat, cut on numbers I counted myself over the
   in-scope rows of the all-years 5500 register: 129,545 employers in the two circles, a
   direct phone on 99.7%, the name of the person who signed the filing on 92.4%. "The
   individual who signed the filing, for more than nine in ten" replaces the retracted
   administrator/preparer lines with a claim the record actually carries. */
const AUDIO_BASENAME = "pitch-v6";
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
    <div className={variant === "hero" ? "heropitch" : undefined}>
      {variant === "hero" ? (
        /* The title is the reason to press play. One line, height-budget conscious
           (the pinned column at 1440x900 is spent to the pixel; this adds ~24px and
           the arming was re-measured after). The claim is literally true: the files
           are public and the pitch's first minute proves nobody reads them. */
        <p className="heropitch__title">
          <span className="heropitch__badge" aria-hidden="true" />
          Sacramento&rsquo;s prices are public. Nobody reads them. <em>Press play.</em>
        </p>
      ) : null}
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
    </div>
  );
}

export default HeroAudio;
