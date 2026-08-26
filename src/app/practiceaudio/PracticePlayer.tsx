"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Cue = { t0: number; t1: number; text: string; speaker?: string };
export type Chapter = { t: number; text: string };

/**
 * THE TRANSPORT.
 *
 * Built from the hero-audio pattern and hardened against the three failures this
 * estate has actually measured on audio surfaces:
 *
 * 1. ⛔ IT NEVER ERASES ITSELF. LEO III shipped a capability check that compared
 *    `canPlayType('audio/mpeg')` against `'probably'`. Firefox correctly answers
 *    `'maybe'` for mp3 without a codecs parameter, so every Firefox visitor pressed
 *    play and watched the player vanish. There is no capability check here at all:
 *    the element is the source of truth, `error` and `canplay` are events, and a
 *    control that cannot play says so in words while staying on the page.
 *
 * 2. ⛔ IT IS BUILT FOR SAFARI, WHICH IS THE ONLY BROWSER THAT MATTERS HERE, because
 *    this gets opened on a phone in a conference centre. `playsInline` stops iOS
 *    taking the audio full screen. `preload="metadata"` gets a duration without
 *    pulling twenty megabytes over a hotel network. Playback starts from a real tap
 *    and the returned promise is caught, because iOS rejects it whenever it decides
 *    the gesture was not good enough and an uncaught rejection there leaves the UI
 *    lying about its state. Seeking works because the file is served by the CDN with
 *    byte ranges; iOS will not scrub a stream it cannot range-request.
 *
 * 3. ⛔ THE DURATION IS ARMED FROM THE SIDECAR. `preload="metadata"` means duration
 *    is `NaN` until the network answers, and a progress bar divided by NaN renders
 *    as an empty rail that looks broken. The measured duration comes in as a prop
 *    and the element's own value replaces it once it is real.
 *
 * The waveform is the sidecar's measured peaks, not a decorative sine. If there are
 * no peaks it renders a plain rail rather than inventing a shape, because a made-up
 * waveform is a picture of a recording that does not exist.
 */

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

export function PracticePlayer({
  src,
  duration: known,
  captions,
  chapters,
  peaks,
  transcript,
}: {
  src: string;
  duration: number;
  captions: Cue[];
  chapters: Chapter[];
  peaks: number[];
  transcript: string;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  /**
   * HOW MANY BARS ACTUALLY FIT, MEASURED.
   *
   * The sidecar carries 220 peaks. At a 1px floor with a 2px gap that is a 660px
   * minimum, and MEASURED at 390px it pushed the page into horizontal scroll: the
   * flex children could not shrink below their own minimum, so the rail grew instead.
   * Rendering every peak on a phone is not more information, it is sub-pixel mush and
   * a broken layout. So the waveform is subsampled to what the rail can actually show,
   * remeasured when the rail resizes. The shape is preserved because we take evenly
   * spaced samples of the real peaks rather than the first N of them.
   */
  const [bars, setBars] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(known > 0 ? known : 0);
  const [failed, setFailed] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);

  const total = dur > 0 ? dur : known;
  const at = scrub ?? t;
  const pct = total > 0 ? Math.min(100, Math.max(0, (at / total) * 100)) : 0;

  /* Which caption is on screen. A linear scan over a few hundred cues costs
     nothing and is easier to be sure about than a binary search off by one. */
  const cueIndex = useMemo(() => {
    for (let i = 0; i < captions.length; i++) {
      if (at >= captions[i].t0 && at < captions[i].t1) return i;
    }
    return -1;
  }, [at, captions]);

  /**
   * THE LINE THAT STAYS ON SCREEN THROUGH A PAUSE IN THE SPEECH.
   *
   * Cues have gaps between them, which is what a breath is. Keying the caption to
   * "is there a cue at exactly this millisecond" made the text vanish and the prompt
   * "Press play" reappear every time the speaker took a beat, mid-playback, which
   * looks like the player has lost its place. Measured at t=2.43s between two real
   * cues. The last cue that started stays up until the next one does.
   */
  const shownCue = useMemo(() => {
    if (captions.length === 0) return null;
    if (cueIndex >= 0) return captions[cueIndex];
    let last: Cue | null = null;
    for (const c of captions) if (at >= c.t0) last = c;
    return last;
  }, [at, captions, cueIndex]);

  const chapterIndex = useMemo(() => {
    let found = -1;
    for (let i = 0; i < chapters.length; i++) if (at >= chapters[i].t) found = i;
    return found;
  }, [at, chapters]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const BAR = 3; // 1px bar + 2px gap
    const fit = () => setBars(Math.max(24, Math.floor(rail.clientWidth / BAR)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(rail);
    return () => ro.disconnect();
  }, []);

  /* Evenly spaced samples of the real peaks. Never the first N, which would draw the
     opening seconds of the recording and call it the whole shape. */
  const shownPeaks = useMemo(() => {
    if (peaks.length === 0 || bars <= 0) return [];
    if (peaks.length <= bars) return peaks;
    const out: number[] = [];
    for (let i = 0; i < bars; i++) out.push(peaks[Math.floor((i * peaks.length) / bars)]);
    return out;
  }, [peaks, bars]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTime = () => setT(el.currentTime);
    const onMeta = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) setDur(el.duration);
    };
    const onPlay = () => { setPlaying(true); setFailed(null); };
    const onPause = () => setPlaying(false);
    const onEnd = () => { setPlaying(false); setT(0); };
    const onErr = () =>
      setFailed("This browser could not load the recording. The file is there; the connection is not.");
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnd);
    el.addEventListener("error", onErr);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onErr);
    };
  }, []);

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      const p = el.play();
      /* iOS returns a promise and rejects it more often than anyone expects. */
      if (p && typeof p.catch === "function") {
        p.catch(() => setFailed("Playback did not start. Tap the button once more."));
      }
    } else {
      el.pause();
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const el = ref.current;
    if (!el || !Number.isFinite(seconds)) return;
    el.currentTime = Math.max(0, seconds);
    setT(Math.max(0, seconds));
  }, []);

  const skip = useCallback((by: number) => seekTo((ref.current?.currentTime ?? 0) + by), [seekTo]);

  const onRail = (e: React.MouseEvent<HTMLDivElement>) => {
    if (total <= 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    seekTo(((e.clientX - r.left) / r.width) * total);
  };

  return (
    <section className="pap" aria-label="Practice audio player">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- the transcript below IS the caption
          track, rendered on the page and synced; a <track> is added when the VTT is cut. */}
      <audio ref={ref} src={src} preload="metadata" playsInline crossOrigin="anonymous" />

      <div className="pap__transport">
        <button
          type="button"
          className="pap__play"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1.2" fill="currentColor" />
              <rect x="14" y="4" width="4" height="16" rx="1.2" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M8 5.2v13.6L19 12z" fill="currentColor" />
            </svg>
          )}
        </button>

        <div className="pap__mid">
          <div
            className="pap__rail"
            ref={railRef}
            onClick={onRail}
            onMouseLeave={() => setScrub(null)}
            onMouseMove={(e) => {
              if (total <= 0) return;
              const r = e.currentTarget.getBoundingClientRect();
              setScrub(((e.clientX - r.left) / r.width) * total);
            }}
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(total)}
            aria-valuenow={Math.round(at)}
            aria-valuetext={`${fmt(at)} of ${fmt(total)}`}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") { e.preventDefault(); skip(5); }
              if (e.key === "ArrowLeft") { e.preventDefault(); skip(-5); }
              if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); }
            }}
          >
            {shownPeaks.length > 0 ? (
              <div className="pap__wave" aria-hidden="true">
                {shownPeaks.map((p, i) => (
                  <i
                    key={i}
                    className={i / shownPeaks.length <= pct / 100 ? "on" : undefined}
                    style={{ height: `${Math.max(8, Math.min(100, p))}%` }}
                  />
                ))}
              </div>
            ) : (
              <div className="pap__plain" aria-hidden="true">
                <span style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>

          <div className="pap__meta">
            <span className="pap__time">
              {fmt(at)} <span className="pap__slash">/</span> {fmt(total)}
            </span>
            <span className="pap__spacer" />
            <button type="button" className="pap__skip" onClick={() => skip(-15)} aria-label="Back 15 seconds">
              15 back
            </button>
            <button type="button" className="pap__skip" onClick={() => skip(15)} aria-label="Forward 15 seconds">
              15 on
            </button>
            {transcript ? (
              <button type="button" className="pap__skip" onClick={() => setShowText((v) => !v)} aria-expanded={showText}>
                {showText ? "Hide the text" : "Read it instead"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {failed ? (
        <p className="pap__failed" role="alert">
          {failed}
        </p>
      ) : null}

      {captions.length > 0 ? (
        <p className="pap__caption" aria-live="polite">
          {shownCue ? (
            <>
              {shownCue.speaker ? <span className="pap__who">{shownCue.speaker}</span> : null}
              {shownCue.text}
            </>
          ) : (
            <span className="pap__hint">Press play. The words follow along here.</span>
          )}
        </p>
      ) : null}

      {chapters.length > 0 ? (
        <ol className="pap__chapters">
          {chapters.map((c, i) => (
            <li key={`${c.t}-${i}`}>
              <button
                type="button"
                onClick={() => seekTo(c.t)}
                className={i === chapterIndex ? "on" : undefined}
                aria-current={i === chapterIndex ? "true" : undefined}
              >
                <span className="pap__ch-t">{fmt(c.t)}</span>
                <span className="pap__ch-x">{c.text}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}

      {showText && transcript ? (
        <div className="pap__transcript">
          {transcript.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
