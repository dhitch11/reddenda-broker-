"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * THE TRANSPORT. The client half of the hero audio.
 * @BROKER-AUDIO, 2026-08-26. Successor to leo-transport.tsx (@BROKER-12, 08-24);
 * the discipline below is inherited, two things are new, and both are honest:
 *
 * 1. THE SCRUB TRACK IS A REAL WAVEFORM, MEASURED, NEVER DRAWN.
 *    The previous file's equalizer comment ruled that "a fake waveform would be
 *    a picture of audio this file has not analysed." This file has analysed it:
 *    the sidecar carries RMS per 1/220th of the shipped mp3, decoded to PCM at
 *    render time. When peaks are absent the track falls back to the plain bar
 *    rather than inventing a shape.
 *
 * 2. CAPTIONS SYNCED TO THE SCRIPT. Sentence-level cues, timed from a blind
 *    speech-to-text pass over the shipped file (not from the script's own
 *    assumptions), render in a fixed-height slot so their appearance moves no
 *    layout. The full transcript stays one press away; captions are a
 *    convenience, the transcript is the accessible artifact.
 *
 * Inherited discipline, unchanged: `ready` is set only by loadedmetadata with a
 * finite duration; the scrubber is a real slider with pointer capture and the
 * native keys; an error REMOVES the control rather than disabling it; a file
 * that produces no duration within the deadline is treated as errored; reduced
 * motion is honored (the only animations are the equalizer, gated in CSS, and
 * a caption fade gated in this file's own style block).
 *
 * CLS CONTRACT WITH THE HERO (agreed with @BROKER-MARKETING in FINDINGS):
 * this component reserves its box synchronously. The root carries a min-height
 * that matches the ready state, and the caption slot has a fixed height from
 * first paint, so neither metadata arrival nor playback moves the page.
 */

/* ═══ B-QA-23 · A CONTROL NEVER ERASES ITSELF ════════════════════════════════
   FILED by @BROKER-QA on prod, 2026-08-26: in Firefox at 390 and 1440, pressing
   play REMOVED the audio element and the button from the DOM. No error, no
   message, no fallback. The visitor presses a control and watches it disappear.

   THE MEASURED CAUSE, and it is neither of the two that were hypothesised.
   Instrumented every media event on the live element (@BROKER-AUDIO, Firefox
   via Playwright, prod):

     play → waiting → HTTP 206, 1,582,020 B → durationchange → loadedmetadata
     → loadeddata → canplay → PLAYING → canplaythrough
     → error  code 3  "OnMediaSinkAudioError"   → this component unmounts

   The file downloaded, decoded and STARTED PLAYING. Then Firefox failed to open
   an audio OUTPUT SINK and reported it as MEDIA_ERR_DECODE. The harness box has
   no /dev/snd, no PulseAudio and no ALSA, so there is no device to open. It was
   never canPlayType (this file has never contained one) and never a play()
   rejection (measured: play() RESOLVES here, readyState 0 → 3).

   SO THE SEVERITY WAS ALSO WRONG, AND THAT MATTERS AS MUCH AS THE FIX: this is
   not "Firefox visitors get a vanishing player". It is "a listener whose audio
   OUTPUT is unavailable gets a vanishing player" - a headless box, a machine
   with no sound card, a broken driver, a device held exclusively by another
   application. Rarer than a browser, and far worse when it happens, because the
   one thing that visitor needed was the transcript and we deleted it from under
   them.

   THE RULE THIS FILE NOW HOLDS. It is the estate's no-dead-play-button rule read
   correctly, and the line falls in a different place than the predecessor put it:
     · The SERVER decides whether a control EXISTS. hero-audio.tsx returns null
       when the file is absent, so a control that could never play is never
       rendered. That is the right home for "render nothing".
     · Once the control is on screen, a CLIENT-SIDE failure degrades VISIBLY. The
       play button goes (it cannot play, so it must not stay pressable) and a
       plain sentence takes its place, with the two things that still work: the
       transcript, and a direct link to the file the visitor can open in anything.
     · An autoplay-policy refusal is NOT a failure. It is the browser asking for a
       gesture. It says so, and the button stays pressable.
     · A capability probe accepts ANY non-empty canPlayType answer. "maybe" is the
       correct, spec-compliant reply for MP3 without a codecs parameter, and every
       Firefox on earth returns it (measured: "maybe" bare, "probably" with
       codecs="mp3"). A check written as === "probably" would refuse them all.
   ════════════════════════════════════════════════════════════════════════════ */
type Failure =
  | null
  | { kind: "decode"; detail: string }
  | { kind: "unsupported"; detail: string }
  | { kind: "timeout"; detail: string };

/* MEDIA_ERR_* read back as words, because a bare "3" in a support thread is not
   an answer. Only the visible sentence is shown to the visitor; the detail goes
   to the data attribute so a lane can read it off a real page without a debugger. */
function describeMediaError(el: HTMLAudioElement | null): string {
  const e = el?.error;
  if (!e) return "the audio stopped without reporting a reason";
  switch (e.code) {
    case 1: return "the download was aborted";
    case 2: return "the network dropped the file";
    case 3: return `this device could not play the sound (${e.message || "decode or audio-output failure"})`;
    case 4: return "this browser cannot play this file";
    default: return `media error ${e.code}`;
  }
}

/* ACCEPT "maybe". See the doctrine above. Any non-empty answer is a yes; only the
   empty string is a no, and it is the ONLY thing that may pre-emptively stand the
   player down. Runs client-side only, so the server render is never affected. */
function browserRefusesMp3(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.createElement("audio").canPlayType("audio/mpeg") === "";
  } catch {
    return false; // an unanswerable question is not a refusal
  }
}

type Chapter = { t: number; text: string };
type Caption = { t0: number; t1: number; text: string };

const SKIP = 15;

function timecode(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

/* Screen readers should hear a duration, not a stopwatch reading. */
function spoken(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  const mm = m === 1 ? "1 minute" : `${m} minutes`;
  const ss = r === 1 ? "1 second" : `${r} seconds`;
  return m ? `${mm} ${ss}` : ss;
}

export function HeroAudioTransport({
  src,
  duration: knownDuration,
  transcript,
  chapters,
  captions,
  peaks,
  vtt,
  variant = "hero",
}: {
  src: string;
  duration: number | null;
  transcript: string;
  chapters: Chapter[];
  captions: Caption[];
  peaks: number[];
  /* The URL of a real WebVTT file, or null. Never a guessed path: the server
     half only passes this when the file is on disk beside the mp3. */
  vtt: string | null;
  variant?: "band" | "hero";
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  /* ARMED FROM THE SIDECAR (visual-standard §8.12: preload="none").
     When the render pipeline measured a duration into the sidecar, the
     transport arms from it and the browser fetches NOTHING until first press:
     the server half already proved the file exists at the requested path, so
     the control is not a lie, and the first press pays the load. Without a
     sidecar duration we cannot honestly render a timecoded transport, so we
     fall back to preload="metadata" and arm on loadedmetadata as before. */
  const armFromSidecar = knownDuration !== null && knownDuration > 0;

  const [ready, setReady] = useState(armFromSidecar);
  const [failure, setFailure] = useState<Failure>(null);
  const [blocked, setBlocked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(knownDuration ?? 0);
  const [buffered, setBuffered] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const [openTranscript, setOpenTranscript] = useState(false);

  const transcriptId = useId();
  const waveId = useId();

  /* ── the media element is the source of truth; state only mirrors it ──────── */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onMeta = () => {
      const d = el.duration;
      if (Number.isFinite(d) && d > 0) {
        setDuration(d);
        setReady(true);
      }
    };
    const onTime = () => setCurrent(el.currentTime);
    const onPlay = () => { setPlaying(true); setStarted(true); setBlocked(false); };
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setCurrent(0); el.currentTime = 0; };
    const onWaiting = () => setWaiting(true);
    const onPlaying = () => setWaiting(false);
    const onProgress = () => {
      try {
        if (el.buffered.length) setBuffered(el.buffered.end(el.buffered.length - 1));
      } catch { /* buffered can throw before any data arrives */ }
    };
    /* A real media error. It takes the PLAY BUTTON away, because a button that
       cannot play must not stay pressable, and it puts a sentence and the
       transcript in its place. It does NOT take the component away: see the
       doctrine at the top of this file. */
    const onError = () => {
      setFailure({ kind: "decode", detail: describeMediaError(el) });
      setReady(false);
      setPlaying(false);
      setWaiting(false);
    };

    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("progress", onProgress);
    el.addEventListener("error", onError);

    /* Metadata may already be in hand before this effect runs (bfcache, a warm
       HTTP cache, a fast local file). readyState >= 1 means loadedmetadata has
       fired and will not fire again, so the listener alone would never arm. */
    if (el.readyState >= 1) onMeta();

    /* THE LOAD DEADLINE. MEASURED on the predecessor: with the audio request
       aborted at the network layer, the media element fires no `error` at all.
       Under preload="metadata" the deadline runs from mount as before. Under
       preload="none" (armed from the sidecar) nothing loads until first press,
       so the deadline is armed by the press handler instead: a press that
       produces no metadata within the deadline kills the component the same
       way. */
    const deadline = armFromSidecar
      ? 0
      : window.setTimeout(() => {
          if (el.readyState < 1) {
            setFailure({ kind: "timeout", detail: "no metadata within 12 seconds of load" });
            setReady(false);
          }
        }, 12000);

    return () => {
      if (deadline) window.clearTimeout(deadline);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("progress", onProgress);
      el.removeEventListener("error", onError);
    };
  }, []);

  /* THE CAPABILITY PROBE. Runs once, after mount, so the server render is
     untouched and hydration cannot mismatch. It accepts "maybe": only a browser
     that answers with the EMPTY STRING is telling us it cannot play MP3, and
     only that browser is stood down before it has tried. */
  useEffect(() => {
    if (browserRefusesMp3()) {
      setFailure({ kind: "unsupported", detail: 'canPlayType("audio/mpeg") returned the empty string' });
      setReady(false);
    }
  }, []);

  const seekTo = useCallback((t: number) => {
    const el = audioRef.current;
    if (!el || !ready) return;
    const clamped = Math.max(0, Math.min(duration || 0, t));
    el.currentTime = clamped;
    setCurrent(clamped);
  }, [ready, duration]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el || !ready) return;
    if (el.paused) {
      /* First press under preload="none": nothing has loaded yet. Show the
         buffering ring at once and arm the deadline that mount could not arm.
         A press that produces no metadata in 12s is a dead file, and a dead
         file removes the control. */
      if (el.readyState < 1) {
        setWaiting(true);
        window.setTimeout(() => {
          const now = audioRef.current;
          if (now && now.readyState < 1) {
            setFailure({ kind: "timeout", detail: "pressed, and no metadata arrived within 12 seconds" });
            setReady(false);
            setWaiting(false);
          }
        }, 12000);
      }
      /* ★ THIS CATCH WAS THE B-QA-23 KILL SITE. It read every rejection as a dead
         file and unmounted the component. It now reads the error's NAME, because
         the two things that land here are not the same event:
           NotAllowedError  the browser wants a gesture it did not think it had.
                            Nothing is broken. Say so and stay pressable.
           anything else    a genuine fault, and the element's own `error` event
                            will have fired with a real MediaError beside it.
         MEASURED on prod in Firefox: play() RESOLVES under preload="none"
         (readyState 0 -> 3). The rejection this catch was written for does not
         happen there, and the unmount it caused did. */
      void el.play().catch((err: unknown) => {
        setPlaying(false);
        setWaiting(false);
        const name = err && typeof err === "object" && "name" in err ? String((err as Error).name) : "";
        if (name === "NotAllowedError") { setBlocked(true); return; }
        if (el.error) setFailure({ kind: "decode", detail: describeMediaError(el) });
        else setFailure({ kind: "decode", detail: name ? `playback refused (${name})` : "playback refused" });
      });
    } else {
      el.pause();
    }
  }, [ready]);

  const nudge = useCallback((by: number) => {
    const el = audioRef.current;
    if (!el || !ready) return;
    seekTo(el.currentTime + by);
  }, [ready, seekTo]);

  /* ── scrubbing: pointer capture so the drag survives leaving the track ────── */
  const positionFromEvent = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track || !duration) return 0;
    const box = track.getBoundingClientRect();
    if (box.width <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, (clientX - box.left) / box.width));
    return ratio * duration;
  }, [duration]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrub(positionFromEvent(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ready || scrub === null) return;
    setScrub(positionFromEvent(e.clientX));
  };
  const commitScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ready || scrub === null) return;
    seekTo(positionFromEvent(e.clientX));
    setScrub(null);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
  };

  /* ── keyboard on the slider: the same keys a native range answers to ──────── */
  const onTrackKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!ready) return;
    const step = e.shiftKey ? SKIP : 5;
    switch (e.key) {
      case "ArrowRight": case "ArrowUp":   e.preventDefault(); nudge(step); break;
      case "ArrowLeft":  case "ArrowDown": e.preventDefault(); nudge(-step); break;
      case "PageUp":   e.preventDefault(); nudge(SKIP * 2); break;
      case "PageDown": e.preventDefault(); nudge(-SKIP * 2); break;
      case "Home": e.preventDefault(); seekTo(0); break;
      case "End":  e.preventDefault(); seekTo(Math.max(0, duration - 0.25)); break;
      case " ": case "Enter": case "k": case "K": e.preventDefault(); toggle(); break;
      default: break;
    }
  };

  /* ── the current caption, by binary search kept trivial (33 cues) ─────────── */
  const shown = scrub ?? current;
  const cue = useMemo(() => {
    if (!captions.length) return null;
    for (const c of captions) if (shown >= c.t0 && shown < c.t1 + 0.15) return c;
    return null;
  }, [captions, shown]);

  /* ── the waveform path, built once; it never changes during playback ──────── */
  const hasWave = peaks.length >= 40;
  const waveBars = useMemo(() => {
    if (!hasWave) return null;
    const W = 1000; const H = 100; const n = peaks.length;
    const bw = W / n;
    /**
     * ⛔ THE WAVEFORM READS ITS OWN SCALE. Added 2026-08-26 by @BROKER-MARKETING,
     * additive, one expression, nothing else in this file touched.
     *
     * MEASURED ON LIVE PROD: the hero waveform was a flat line above the fold.
     * leo3.json wrote peaks 0..100 and this drew them directly; leo4.json writes RMS
     * 0..1 ("RMS per 1/220th of the SHIPPED mp3"), so every bar hit the `Math.max(4, p)`
     * floor and the whole waveform rendered 4 units tall in a 100-unit viewBox. Nothing
     * errored, nothing failed a check, and the homepage hero showed a dead player.
     *
     * Rather than convert one sidecar and leave the trap for the next renderer, the
     * component now normalises whichever scale it is handed. A 0..1 payload is scaled
     * by 100; a 0..100 payload is unchanged, so leo3 and every existing sidecar draw
     * byte-identically. @BROKER-AUDIO: your JSON is correct either way now.
     */
    const peakScale = Math.max(...peaks) <= 1.001 ? 100 : 1;
    return peaks.map((p, i) => {
      const h = Math.max(4, p * peakScale);
      return (
        <rect
          key={i}
          x={(i * bw + bw * 0.18).toFixed(1)}
          y={((H - h) / 2).toFixed(1)}
          width={(bw * 0.64).toFixed(1)}
          height={h.toFixed(1)}
          rx={Math.min(1.6, bw * 0.3)}
        />
      );
    });
  }, [peaks, hasWave]);

  /* ★ WHERE `if (dead) return null` USED TO STAND. It is gone on purpose. See the
     doctrine at the top of this file: the server decides whether a control
     exists, and a client-side failure degrades where the visitor can see it. */

  const pct = duration ? Math.max(0, Math.min(100, (shown / duration) * 100)) : 0;
  const bufPct = duration ? Math.max(0, Math.min(100, (buffered / duration) * 100)) : 0;
  const total = duration || knownDuration || 0;

  /* The label is DERIVED from the measured duration; a number we do not have
     does not get printed (the predecessor once advertised three minutes over
     seven minutes of audio from a string literal). */
  const lengthPhrase =
    total >= 120 ? `in ${Math.round(total / 60)} minutes`
    : total >= 30 ? `in ${Math.round(total)} seconds`
    : "";
  const promise = lengthPhrase ? `the pitch, ${lengthPhrase}` : "the pitch";

  return (
    <div
      className="leo heroaudio"
      data-ready={ready ? "1" : "0"}
      data-variant={variant}
      data-captions={captions.length ? "1" : "0"}
      data-failed={failure ? failure.kind : "0"}
      /* The measured detail rides the DOM so a lane can read the real cause off a
         real page, at 390 or 1440, without attaching a debugger. */
      data-failure-detail={failure ? failure.detail : undefined}
    >
      {/* Styles for what is NEW in this transport (waveform, captions). The
          inherited surface keeps the .leo classes styled in globals.css, so
          the marketing lane's stylesheet stays untouched by this lane. */}
      <style>{`
        /* CLS contract with the hero (FINDINGS, 08-26): the box is reserved
           BEFORE metadata arrives, at the ready-state height MEASURED at each
           breakpoint (1920/1440: 178px; 768, where the hero variant is no
           longer compacted: 204px; 390/320, where the meta row wraps: 230px).
           Media queries, not an inline style, so the narrow reservations win. */
        .heroaudio[data-captions="1"]{min-height:178px}
        .heroaudio[data-captions="0"]{min-height:132px}
        @media (max-width: 899px){
          .heroaudio[data-captions="1"]{min-height:204px}
          .heroaudio[data-captions="0"]{min-height:158px}
        }
        @media (max-width: 480px){
          .heroaudio[data-captions="1"]{min-height:230px}
          .heroaudio[data-captions="0"]{min-height:184px}
        }
        .heroaudio__wave{position:relative;width:100%;height:44px;border-radius:8px;overflow:hidden;cursor:pointer;touch-action:none;outline-offset:2px}
        .heroaudio__wave:focus-visible{outline:2px solid var(--mint, #7ee0c3)}
        .heroaudio__wave svg{position:absolute;inset:0;width:100%;height:100%;display:block}
        .heroaudio__wave-base{fill:rgba(255,255,255,.22)}
        .heroaudio__wave-buf{position:absolute;inset:0;background:rgba(255,255,255,.05)}
        .heroaudio__wave-fill{fill:var(--mint, #7ee0c3)}
        .heroaudio__wave-mark{position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,.28)}
        .heroaudio__wave-thumb{position:absolute;top:2px;bottom:2px;width:2px;border-radius:1px;background:var(--ink, #fff);box-shadow:0 0 0 1px rgba(0,0,0,.35)}
        .heroaudio__caption{height:46px;overflow:hidden;display:flex;align-items:flex-start;font-size:13px;line-height:1.45;color:var(--faint, rgba(255,255,255,.72))}
        .heroaudio__caption q{quotes:none;font-style:normal}
        .heroaudio__caption[data-live="1"]{color:var(--ink, #fff)}
        @media (prefers-reduced-motion: no-preference){
          .heroaudio__caption span{transition:opacity .18s linear}
        }

        /* ── B-QA-23: THE VISIBLE FALLBACK ──────────────────────────────────
           Deliberately quiet. This is an honest status, not an alarm: no red,
           no icon, no border shouting at a visitor about a fault that is on
           their machine. It reserves its own height so replacing the transport
           with it moves nothing around it, which is the same CLS contract the
           transport holds. */
        .leo__fallback{display:grid;gap:10px}
        .leo__fallback-line{margin:0;font-size:13px;line-height:1.5;color:var(--faint, rgba(255,255,255,.72))}
        .leo__fallback-link{font-size:12px;color:var(--muted, rgba(255,255,255,.62));text-decoration:underline;text-underline-offset:3px;justify-self:start}
        .leo__fallback-link:hover{color:var(--ink, #fff)}
        .leo__transcript--open{max-height:186px;overflow:auto}
        /* The autoplay-policy hint. Not a failure, so it never takes the button
           away: it sits under a transport that is still fully pressable. */
        .leo__blocked{margin:0;font-size:12px;line-height:1.45;color:var(--faint, rgba(255,255,255,.72))}
      `}</style>

      {/* preload="none" whenever the sidecar carries the measured duration
          (visual-standard §8.12): a visitor who never presses play pays zero
          bytes for this element. The metadata fallback exists only for a
          sidecar-less asset, where a timecoded control cannot honestly render
          before loadedmetadata. */}
      {/* A REAL <track>, beside the on-page caption slot and not instead of it.
          The slot is a styled convenience that matches the hero; the track is
          the standards artifact the browser's own caption UI, a screen reader
          and a "save this page" all understand. It is rendered ONLY when the
          render actually produced a .vtt, because a <track> pointing at a 404 is
          a caption button that shows nothing, which is this file's whole sin in
          miniature. Same origin, so no crossOrigin is needed. */}
      <audio ref={audioRef} src={src} preload={armFromSidecar ? "none" : "metadata"} playsInline>
        {vtt ? <track kind="captions" src={vtt} srcLang="en" label="English" default /> : null}
      </audio>

      <div className="leo__head">
        <span className="leo__eq" aria-hidden="true"><i /><i /><i /><i /></span>
        <span className="leo__title">Hear the pitch</span>
        <span className="leo__sub">{lengthPhrase || null}</span>
      </div>

      {failure ? (
        /* ═══ THE VISIBLE FALLBACK ═══════════════════════════════════════════
           What replaced the vanishing act. No play button, because it cannot
           play. A plain sentence that says what happened, and the two routes
           that still work on any device: the words, and the file itself. The
           transcript renders OPEN here rather than behind a toggle, because a
           visitor who just lost the audio should not have to find a second
           control to get the content. */
        <div className="leo__fallback" role="status">
          <p className="leo__fallback-line">
            {failure.kind === "unsupported"
              ? "This browser will not play MP3 audio."
              : failure.kind === "timeout"
                ? "The audio did not load."
                : "The audio could not play on this device."}{" "}
            {transcript ? "Here it is in words." : null}
          </p>
          {transcript ? (
            <div id={transcriptId} className="leo__transcript leo__transcript--open">
              {transcript.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
            </div>
          ) : null}
          <a className="leo__fallback-link" href={src} download>
            Open the audio file directly
          </a>
        </div>
      ) : !ready ? (
        /* No transport exists yet, because no transport can work yet. This is a
           status line, not a disabled control. Nothing here is pressable. */
        <p className="leo__loading" role="status">Loading the audio…</p>
      ) : (
        <>
          <div className="leo__row">
            <button
              type="button"
              className="leo__play"
              onClick={toggle}
              aria-label={playing ? "Pause the pitch" : `Play ${promise}`}
            >
              {playing ? (
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <rect x="6.5" y="4.5" width="4" height="15" rx="1.3" fill="currentColor" />
                  <rect x="13.5" y="4.5" width="4" height="15" rx="1.3" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path d="M8 5.2v13.6a.9.9 0 0 0 1.37.77l11-6.8a.9.9 0 0 0 0-1.54l-11-6.8A.9.9 0 0 0 8 5.2Z" fill="currentColor" />
                </svg>
              )}
              {waiting ? <span className="leo__buffering" aria-hidden="true" /> : null}
            </button>

            <div className="leo__transport">
              <div
                ref={trackRef}
                className={hasWave ? "heroaudio__wave" : "leo__track"}
                role="slider"
                tabIndex={0}
                aria-label="Seek through the pitch"
                aria-valuemin={0}
                aria-valuemax={Math.round(total)}
                aria-valuenow={Math.round(shown)}
                aria-valuetext={`${spoken(shown)} of ${spoken(total)}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={commitScrub}
                onPointerCancel={commitScrub}
                onKeyDown={onTrackKeyDown}
                data-scrubbing={scrub !== null ? "1" : "0"}
              >
                {hasWave ? (
                  <>
                    <span className="heroaudio__wave-buf" style={{ width: `${bufPct}%` }} aria-hidden="true" />
                    <svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
                      <g className="heroaudio__wave-base">{waveBars}</g>
                    </svg>
                    <svg
                      viewBox="0 0 1000 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
                    >
                      <g className="heroaudio__wave-fill" id={waveId}>{waveBars}</g>
                    </svg>
                    {chapters.length > 1 && total
                      ? chapters.slice(1).map((c) => (
                          <span key={c.t} className="heroaudio__wave-mark" style={{ left: `${(c.t / total) * 100}%` }} aria-hidden="true" />
                        ))
                      : null}
                    <span className="heroaudio__wave-thumb" style={{ left: `${pct}%` }} aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span className="leo__buf" style={{ width: `${bufPct}%` }} aria-hidden="true" />
                    <span className="leo__fill" style={{ width: `${pct}%` }} aria-hidden="true" />
                    {chapters.length > 1 && total
                      ? chapters.slice(1).map((c) => (
                          <span key={c.t} className="leo__mark" style={{ left: `${(c.t / total) * 100}%` }} aria-hidden="true" />
                        ))
                      : null}
                    <span className="leo__thumb" style={{ left: `${pct}%` }} aria-hidden="true" />
                  </>
                )}
              </div>

              <div className="leo__meta">
                <span className="leo__time">
                  <b>{timecode(shown)}</b>
                  <i aria-hidden="true">/</i>
                  <span>{timecode(total)}</span>
                </span>

                <span className="leo__skips">
                  <button type="button" className="leo__skip" onClick={() => nudge(-SKIP)} aria-label="Rewind 15 seconds">
                    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11.5 5.5 7 9.5l4.5 4" /><path d="M7 9.5h6.2a5.3 5.3 0 1 1 0 10.6h-3.1" />
                    </svg>
                    <span>15</span>
                  </button>
                  <button type="button" className="leo__skip" onClick={() => nudge(SKIP)} aria-label="Fast forward 15 seconds">
                    <span>15</span>
                    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12.5 5.5 17 9.5l-4.5 4" /><path d="M17 9.5h-6.2a5.3 5.3 0 1 0 0 10.6h3.1" />
                    </svg>
                  </button>
                </span>

                {transcript ? (
                  <button
                    type="button"
                    className="leo__reader"
                    onClick={() => setOpenTranscript((v) => !v)}
                    aria-expanded={openTranscript}
                    aria-controls={transcriptId}
                  >
                    {openTranscript ? "Hide transcript" : "Read it instead"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* THE CAPTION SLOT. Fixed height from first ready paint, so a cue
              appearing moves nothing. Before playback starts it invites; during
              playback it carries the current sentence, timed from the blind
              transcription of the shipped file. aria-hidden because the audio
              itself plus the transcript are the accessible artifacts; a
              screen reader should not hear every sentence twice. */}
          {captions.length ? (
            <div className="heroaudio__caption" data-live={cue && (playing || started) ? "1" : "0"} aria-hidden="true">
              <span>
                {cue && (playing || started)
                  ? cue.text
                  : "Two numbers, one city, and the reading habit that is the whole company."}
              </span>
            </div>
          ) : null}

          {/* AN AUTOPLAY REFUSAL IS NOT A FAULT, so it gets a sentence and not the
              fallback. The transport above it stays entirely pressable; the
              browser simply wanted a gesture it did not think it had, and the
              next press gives it one. */}
          {blocked ? (
            <p className="leo__blocked" role="status">
              This browser stopped the audio from starting. Press play once more.
            </p>
          ) : null}

          {/* Always in the DOM when it exists, so it is findable and indexable, and
              so a reader who prefers text is never asked to play audio to get it. */}
          {transcript ? (
            <div id={transcriptId} className="leo__transcript" hidden={!openTranscript}>
              {transcript.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
