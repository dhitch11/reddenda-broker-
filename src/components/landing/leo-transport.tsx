"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * THE TRANSPORT. The client half of LEO.
 * @BROKER-12, 2026-08-24.
 *
 * The server half (leo-player.tsx) has already proven the file exists and is not
 * a stub. This half proves the browser can actually decode it, and refuses to
 * present a transport until it has. `ready` is set by `loadedmetadata` with a
 * finite duration and by nothing else. Until then the surface is a single
 * non-interactive line that says it is loading, which is true, and carries no
 * control that could be pressed to no effect.
 *
 * ═══ WHAT THIS GETS RIGHT, DELIBERATELY ══════════════════════════════════════
 *
 * 1. THE SCRUBBER IS A REAL SLIDER, NOT A DIV THAT LOOKS LIKE ONE.
 *    role="slider" with aria-valuemin / max / now / text, tabbable, and driven by
 *    the same arrow keys a native range input answers to. A keyboard reader gets
 *    the position read out as "1 minute 12 seconds of 3 minutes 2 seconds",
 *    because a percentage is meaningless when what you want is a timecode.
 *
 * 2. IT SCRUBS ON POINTER CAPTURE, SO THE DRAG SURVIVES LEAVING THE TRACK.
 *    Releasing over the page body still commits the seek. During a drag the
 *    thumb follows the pointer while the audio element is left alone, and the
 *    seek is committed once on release: seeking a compressed stream on every
 *    pointermove is what makes a scrubber feel like it is fighting back.
 *
 * 3. REDUCED MOTION IS AN ANSWER, NOT A DECORATION.
 *    The only animation here is the equalizer beside the title, and it is gated
 *    in CSS on prefers-reduced-motion: no-preference. Nothing in the transport
 *    itself moves except as the direct result of an input or of time passing.
 *
 * 4. AN ERROR REMOVES THE CONTROL. It does not disable it.
 *    If the media element errors at any point, this returns null. A visitor never
 *    meets a play button that has stopped being able to play.
 */

type Chapter = { t: number; text: string };

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

export function LeoTransport({
  src,
  duration: knownDuration,
  transcript,
  chapters,
}: {
  src: string;
  duration: number | null;
  transcript: string;
  chapters: Chapter[];
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [ready, setReady] = useState(false);
  const [dead, setDead] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(knownDuration ?? 0);
  const [buffered, setBuffered] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const [openTranscript, setOpenTranscript] = useState(false);

  const transcriptId = useId();

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
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setCurrent(0); el.currentTime = 0; };
    const onWaiting = () => setWaiting(true);
    const onPlaying = () => setWaiting(false);
    const onProgress = () => {
      try {
        if (el.buffered.length) setBuffered(el.buffered.end(el.buffered.length - 1));
      } catch { /* buffered can throw before any data arrives */ }
    };
    /* A decode failure is indistinguishable, to a visitor, from a button that
       does nothing. So it removes the control rather than disabling it. */
    const onError = () => { setDead(true); setReady(false); setPlaying(false); };

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

    /* THE LOAD DEADLINE.
       MEASURED: with the audio request aborted at the network layer, the media
       element fires no `error` at all. It simply never loads, and without this
       the surface sits under the words "Loading the audio" for the rest of the
       session. That is a sentence the page cannot keep, and a component that
       lies quietly is worse than one that fails loudly, so an audio file that
       has not produced a duration within the deadline is treated exactly like
       one that errored: the whole component leaves the page. */
    const deadline = window.setTimeout(() => {
      if (el.readyState < 1) setDead(true);
    }, 12000);

    return () => {
      window.clearTimeout(deadline);
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
      /* play() rejects on an autoplay policy or a decode fault. An unhandled
         rejection here would leave the button reading "pause" over silence. */
      void el.play().catch(() => { setPlaying(false); setDead(true); });
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

  if (dead) return null;

  const shown = scrub ?? current;
  const pct = duration ? Math.max(0, Math.min(100, (shown / duration) * 100)) : 0;
  const bufPct = duration ? Math.max(0, Math.min(100, (buffered / duration) * 100)) : 0;
  const total = duration || knownDuration || 0;

  return (
    <div className="leo" data-ready={ready ? "1" : "0"}>
      {/* preload="metadata" and not "auto": the duration has to be known before a
          control may render, but a visitor who never presses play should not pay
          for three minutes of audio on a phone. */}
      <audio ref={audioRef} src={src} preload="metadata" playsInline />

      {/* ONE LINE, NOT TWO. The pinned hero column runs to exactly its height
          budget at 1440x900 (see the measured note in page.tsx), so every pixel
          this component spends is a pixel taken from the scrub effect. The
          subtitle that used to sit under the title is now the button's
          accessible name, where it costs nothing and says more. */}
      <div className="leo__head">
        <span className="leo__eq" aria-hidden="true"><i /><i /><i /><i /></span>
        <span className="leo__title">Meet Leo</span>
        <span className="leo__sub">why we built this, in three minutes</span>
      </div>

      {!ready ? (
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
              aria-label={playing ? "Pause Leo" : "Play Leo: why we built this, in three minutes"}
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
                className="leo__track"
                role="slider"
                tabIndex={0}
                aria-label="Seek through Leo"
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
                <span className="leo__buf" style={{ width: `${bufPct}%` }} aria-hidden="true" />
                <span className="leo__fill" style={{ width: `${pct}%` }} aria-hidden="true" />
                {/* Beat marks, so a listener can see the shape of the three minutes
                    rather than only its length. Purely visual: seeking is the track's. */}
                {chapters.length > 1 && total
                  ? chapters.slice(1).map((c) => (
                      <span key={c.t} className="leo__mark" style={{ left: `${(c.t / total) * 100}%` }} aria-hidden="true" />
                    ))
                  : null}
                <span className="leo__thumb" style={{ left: `${pct}%` }} aria-hidden="true" />
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
