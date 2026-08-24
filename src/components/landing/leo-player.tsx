import { existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LeoTransport } from "./leo-transport";

/**
 * LEO. The three minute pitch that lives on a play button in the hero.
 * @BROKER-12, 2026-08-24.
 *
 * ═══ THE GUARD IS THE POINT OF THIS FILE ══════════════════════════════════════
 *
 * HARD RULE: A MEDIA CONTROL MUST NEVER RENDER IF IT CANNOT PLAY.
 *
 * On 2026-08-05 this estate shipped a homepage whose play button did nothing,
 * because the guard checked for a poster image while the mp4 it was supposed to
 * gate was gitignored. The control rendered, a visitor pressed it, and the
 * product lied about itself on its own front door.
 *
 * So this component gates on the ONE artifact that has to exist for playback to
 * happen, at the path the browser will actually request, and it gates at build
 * and request time on the server where the answer is knowable. If the audio is
 * not there, or is a truncated stub, or its sidecar is unreadable, this returns
 * null and the hero renders as though the player were never written. There is no
 * degraded state, no disabled button and no "audio coming soon", because every
 * one of those is a control that cannot play.
 *
 * The client half re-checks: the transport stays inert until the browser fires
 * `loadedmetadata` with a finite duration. A file that exists but will not decode
 * is the same failure as a file that is absent, and it is caught in the one place
 * that can see it.
 */

const AUDIO_PUBLIC_PATH = "/audio/leo.mp3";
const MIN_PLAUSIBLE_BYTES = 32 * 1024; // a truncated or error-body mp3 is not audio

type Sidecar = {
  duration?: number;
  chapters?: { t: number; text: string }[];
  transcript?: string;
  voice?: string;
  renderedAt?: string;
};

export function LeoPlayer() {
  const publicDir = join(process.cwd(), "public");
  const mp3 = join(publicDir, "audio", "leo.mp3");
  const sidecar = join(publicDir, "audio", "leo.json");

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

  /* The sidecar carries the measured duration, the beat marks and the transcript.
     It is optional: without it the player still works and simply learns the
     duration from the browser. The audio is the requirement, not the metadata. */
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
     The first cut of this used the file's mtime. MEASURED on live prod: the
     served URL was `?v=315532800000`, which is 1980-01-01, because Netlify
     normalises every file's mtime at build for reproducible bundles. So the
     "version" was a constant, and a swapped take would have been served stale
     from every CDN edge and browser cache behind today's transcript. The render
     stamps `renderedAt` into the sidecar and the byte count changes with every
     take, so those are the version. mtime is kept only as a last resort. */
  const renderedAtMs = typeof meta.renderedAt === "string" ? Date.parse(meta.renderedAt) : NaN;
  const version = Number.isFinite(renderedAtMs) && renderedAtMs > 0
    ? `${Math.floor(renderedAtMs / 1000)}-${bytes}`
    : `${bytes}-${Math.floor(mtimeMs)}`;
  const src = `${AUDIO_PUBLIC_PATH}?v=${version}`;

  const transcript = typeof meta.transcript === "string" ? meta.transcript.trim() : "";

  return (
    <LeoTransport
      src={src}
      duration={duration}
      transcript={transcript}
      chapters={Array.isArray(meta.chapters) ? meta.chapters : []}
    />
  );
}
