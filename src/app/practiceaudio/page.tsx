import type { Metadata } from "next";
import { cookies } from "next/headers";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PRACTICE_COOKIE, verify, configured } from "@/lib/practice-gate";
import { PracticePlayer, type Cue, type Chapter } from "./PracticePlayer";

/**
 * THE PRIVATE REHEARSAL PAGE.
 *
 * One recording, one listener, one afternoon. It is linked from nowhere, it is not
 * in the sitemap, it carries noindex on the response and in the metadata, and the
 * recording behind it is guarded by a server-side proxy rather than by an unguessable name.
 *
 * ⛔ THE ONE THING THAT MUST NOT BE REFACTORED AWAY. When the cookie is absent this
 * component returns the lock and NOTHING ELSE. Not the player with a disabled
 * button, not the transcript inside a collapsed element, not the media URL in a
 * data attribute. This estate has already shipped a page that rendered its whole
 * body under `display: none` behind a PIN prompt and served every byte to curl.
 * The test that matters is `curl` with no cookie, and the only way to pass it is
 * for the words never to be written.
 *
 * WHY THERE IS NO PLAY BUTTON BEFORE THERE IS A RECORDING. Rule 5's surviving
 * clause: a media element must never render a control that cannot play. The
 * sidecar is the proof that a take exists, so no sidecar means no transport, and
 * the page says plainly that the recording is still being cut.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Practice audio",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

const MEDIA_DIR = "practice-audio-media";
const SIDECAR = "practiceaudio.json";
const BRIEF_SIDECAR = "meetingbrief.json";
/* The four stage questions as their own take, by David's direct order 2026-08-26
   ("the audio with just the three questions or four max... as a separate play
   button. THAT IS MY PRIORITY"). Cut verbatim from the full rehearsal script. */
const STAGEFOUR_SIDECAR = "stagefour.json";

type Sidecar = {
  title?: string;
  duration?: number;
  seconds?: number;
  words?: number;
  voice?: string;
  renderedAt?: string;
  loudness?: string;
  claimCheck?: string;
  src?: string;
  transcript?: string;
  captions?: Cue[];
  chapters?: Chapter[];
  peaks?: number[];
};

async function loadSidecar(name: string): Promise<Sidecar | null> {
  try {
    const raw = await readFile(join(process.cwd(), "public", MEDIA_DIR, name), "utf8");
    const j = JSON.parse(raw) as Sidecar;
    /* A sidecar with no duration is a half-written file, not a recording. */
    const secs = Number(j.duration ?? j.seconds ?? 0);
    if (!Number.isFinite(secs) || secs <= 0) return null;
    return j;
  } catch {
    return null;
  }
}

/* The renderer writes `src` as a path ("/audio/x.mp3"); this page serves from the
   gated media dir only. Basename it rather than trusting either convention. */
const mediaSrc = (sc: Sidecar, fallback: string) =>
  `/${MEDIA_DIR}/${(sc.src ?? fallback).split("/").pop() ?? fallback}`;

export default async function PracticeAudio({
  searchParams,
}: {
  searchParams: Promise<{ bad?: string; wait?: string }>;
}) {
  const { bad, wait } = await searchParams;
  const jar = await cookies();
  const unlocked = await verify(jar.get(PRACTICE_COOKIE)?.value);

  if (!unlocked) return <Lock bad={bad === "1"} waiting={wait === "1"} live={configured()} />;

  const [rehearsal, brief, stagefour] = await Promise.all([loadSidecar(SIDECAR), loadSidecar(BRIEF_SIDECAR), loadSidecar(STAGEFOUR_SIDECAR)]);

  /* Each take renders only if its sidecar is complete: no sidecar, no transport,
     and never a play button in front of a recording that does not exist. */
  const takes = [
    stagefour && {
      key: "stagefour",
      sc: stagefour,
      fallback: "stagefour.mp3",
      eyebrow: "First · the four stage questions",
      heading: stagefour.title ?? "The four questions, straight through",
      sub: "Just the four numbered challenges from the packet, in order, and the answers worth being quoted on.",
    },
    rehearsal && {
      key: "rehearsal",
      sc: rehearsal,
      fallback: "practiceaudio.mp3",
      eyebrow: "Take one · the rehearsal",
      heading: rehearsal.title ?? "The room, end to end",
      sub: "Blair asks what the floor will ask. David Thomas answers, end to end.",
    },
    brief && {
      key: "brief",
      sc: brief,
      fallback: "meetingbrief.mp3",
      eyebrow: "Take two · the Q&A drill",
      heading: brief.title ?? "Any question, the answer",
      sub: "Short questions, fast, the way a broker will actually ask them. Each answer is the one worth keeping.",
    },
  ].filter(Boolean) as Array<{
    key: string; sc: Sidecar; fallback: string; eyebrow: string; heading: string; sub: string;
  }>;

  return (
    <main className="pa">
      <div className="pa__wrap">
        <header className="pa__head">
          <span className="pa__eyebrow">Private rehearsal audio</span>
          <h1 className="pa__title">
            {takes.length > 1 ? `${takes.length} takes for this afternoon` : takes[0]?.heading ?? "The room, end to end"}
          </h1>
          <p className="pa__lede">
            Blair asks what the floor will ask. David Thomas answers. Every figure spoken here is one
            we hold, with its sample size and its date, so it can be said out loud and defended.
          </p>
        </header>

        {takes.length > 0 ? (
          takes.map((take) => (
            <section key={take.key} className="pa__take" aria-label={take.heading}>
              {takes.length > 1 ? (
                <div className="pa__takehead">
                  <span className="pa__eyebrow">{take.eyebrow}</span>
                  <h2 className="pa__taketitle">{take.heading}</h2>
                  <p className="pa__takesub">{take.sub}</p>
                </div>
              ) : null}
              <PracticePlayer
                src={mediaSrc(take.sc, take.fallback)}
                duration={Number(take.sc.duration ?? take.sc.seconds ?? 0)}
                captions={Array.isArray(take.sc.captions) ? take.sc.captions : []}
                chapters={Array.isArray(take.sc.chapters) ? take.sc.chapters : []}
                peaks={Array.isArray(take.sc.peaks) ? take.sc.peaks : []}
                transcript={typeof take.sc.transcript === "string" ? take.sc.transcript : ""}
              />
            </section>
          ))
        ) : (
          <div className="pa__pending">
            <strong>The recording is not published yet.</strong>
            <p>
              The page is live and the gate is working, so the take drops straight in when it is cut.
              There is no player here because there is nothing to play, and a button that cannot play
              is worse than an empty space.
            </p>
          </div>
        )}

        <footer className="pa__foot">
          <p>
            Private to David. Not linked from anywhere, not in the sitemap, not indexable. The voice is
            a synthetic David Thomas voice built for this estate; the words are ours.
          </p>
          {takes.map((take) =>
            take.sc.claimCheck ? (
              <p key={take.key} className="pa__claim">
                {take.sc.claimCheck}
              </p>
            ) : null,
          )}
        </footer>
      </div>
    </main>
  );
}

/**
 * THE LOCK.
 *
 * A form that posts to a route handler. No client JavaScript, so it works on a
 * phone with a flaky connection in a conference centre, which is the only place
 * this page will ever actually be opened.
 */
function Lock({ bad, waiting, live }: { bad: boolean; waiting: boolean; live: boolean }) {
  return (
    <main className="pa pa--lock">
      <div className="pa__lockbox">
        <span className="pa__eyebrow">Reddenda</span>
        <h1 className="pa__locktitle">This page is private.</h1>
        <form method="POST" action="/practiceaudio/enter" className="pa__form">
          <label htmlFor="code" className="pa__label">
            Code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            spellCheck={false}
            className="pa__input"
            aria-describedby={bad || waiting ? "pa-err" : undefined}
          />
          <button type="submit" className="pa__submit">
            Open
          </button>
        </form>
        {bad && !waiting ? (
          <p id="pa-err" role="alert" className="pa__err">
            That code did not open it.
          </p>
        ) : null}
        {waiting ? (
          <p id="pa-err" role="alert" className="pa__err">
            Too many tries from this connection. Wait a minute, then try again. Your code is fine if it
            was right; this is the door slowing down, not rejecting you.
          </p>
        ) : null}
        {!live ? (
          <p className="pa__err">
            This gate is not configured on the server, so nothing will open it. That is deliberate: it
            refuses rather than letting anyone through.
          </p>
        ) : null}
      </div>
    </main>
  );
}
