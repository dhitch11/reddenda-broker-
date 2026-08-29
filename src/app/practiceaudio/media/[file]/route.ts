import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { cookies } from "next/headers";
import { PRACTICE_COOKIE, verify } from "@/lib/practice-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * THE PRIVATE RECORDING IS SERVED FROM HERE, AND FROM NOWHERE ELSE.
 *
 * ═══ WHY THIS ROUTE EXISTS: THE GATE IN FRONT OF IT WAS OPEN FOR FIVE SHAPES ═══
 *
 * Until 2026-08-29 these files lived in `public/practice-audio-media/` and were gated
 * by `src/proxy.ts` matching that path prefix. Measured on live prod, anonymous, no
 * cookie, by @BRK-HELP and re-measured independently by @BRK-LEAD:
 *
 *   /practice-audio-media/practiceaudio.mp3      404      9 B   canonical, refused
 *   /practice-audio-media//practiceaudio.mp3     206  served    the real 17.3-min take
 *   //practice-audio-media/practiceaudio.mp3     206  served
 *   /PRACTICE-AUDIO-MEDIA/practiceaudio.mp3      206  served
 *   /Practice-Audio-Media/practiceaudio.mp3      206  served
 *   /practice-audio-media%2Fpracticeaudio.mp3    200  served
 *
 * Range worked on every one of them, so it streamed and seeked. The `.json` sidecar
 * came back at 200 with 48,153 bytes naming two real people as speakers.
 *
 * THE CAUSE, and it is not a typo in a matcher: a proxy matcher is compared against the
 * LITERAL request path, while Netlify's static resolver collapses duplicate slashes,
 * decodes %2F and resolves case-insensitively. The variant never entered `proxy()` at
 * all, so the CDN answered from the publish directory with nothing consulted.
 *
 * ⛔ THE FIX IS NOT A BROADER MATCHER. Broadening it is a deny-list on path shape, and a
 * deny-list on path shape is precisely what just failed; there would have been a sixth
 * shape and nobody would have been looking for it. The estate already has this law
 * written down and it is the one that applies here:
 *
 *     A FILE THE CDN CAN SEE IS A FILE THE CDN WILL SERVE.
 *     A GATE PROTECTS A ROUTE, NOT A FILE. ASK WHERE THE DATA LIVES.
 *
 * So the data moved. `private-media/` sits outside `public/`, is never copied into the
 * publish directory, and has no URL of its own at any casing, any slash count, any
 * encoding. The only way to these bytes is this handler, and this handler checks the
 * cookie itself rather than trusting that something upstream did.
 *
 * ═══ WHAT WE GAVE UP, HONESTLY ════════════════════════════════════════════════
 *
 * The old arrangement had a real advantage and the old comment was right about it: the
 * CDN delivers with native Range support, and iOS Safari will not play a recording it
 * cannot seek in. So this handler implements Range itself rather than pretending the
 * requirement went away. It answers 206 with a correct `content-range`, advertises
 * `accept-ranges: bytes`, and caps any single response at MAX_CHUNK so one request
 * cannot pull sixteen megabytes through a function. Returning fewer bytes than asked
 * for is explicitly allowed for a 206, and every player handles it: that is how a
 * progressive download works.
 */

/**
 * EXACT SET MEMBERSHIP, NEVER A PATTERN, AND NEVER A JOIN ON USER INPUT.
 *
 * The filename arrives from the URL. If it were interpolated into a path this would be
 * a traversal bug, and `..%2f..%2fetc%2fpasswd` is the same class of decoding trick that
 * defeated the matcher above. So the parameter is not a path component: it is a KEY,
 * looked up in this object, and anything that is not a key here does not exist.
 */
const SERVED = {
  "practiceaudio.mp3": "audio/mpeg",
  "practiceaudio.vtt": "text/vtt; charset=utf-8",
  "meetingbrief.mp3": "audio/mpeg",
  "meetingbrief.vtt": "text/vtt; charset=utf-8",
  "stagefour.mp3": "audio/mpeg",
  "stagefour.vtt": "text/vtt; charset=utf-8",
} as const;

/**
 * The `.json` sidecars are NOT in that list, deliberately.
 *
 * They were the worse half of this leak: `practiceaudio.json` served 48,153 bytes of
 * full transcript naming two real people, to anyone. The page already reads them
 * server-side with `fs` and renders what it needs, so nothing requires them to have a
 * URL at all. Not being reachable is a stronger property than being gated.
 * See the memory `a-withdrawn-take-sidecar-is-a-public-document`.
 */

const MEDIA_ROOT = join(process.cwd(), "private-media");

/** One response never carries more than this, whatever the client asks for. */
const MAX_CHUNK = 2 * 1024 * 1024;

/** The same answer an unknown path gets. A 403 would confirm the file exists. */
function notFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "cache-control": "private, no-store, max-age=0, must-revalidate",
    },
  });
}

export async function GET(req: Request, ctx: { params: Promise<{ file: string }> }): Promise<Response> {
  /* THE CHECK IS FIRST AND IT IS OURS. Not the proxy's, not the CDN's. This handler is
     reachable at a path the proxy also matches, and that redundancy is deliberate, but
     redundancy is not the same as delegation: if the check only lived upstream we would
     be repeating the mistake that produced this file. */
  const jar = await cookies();
  if (!(await verify(jar.get(PRACTICE_COOKIE)?.value))) return notFound();

  const { file } = await ctx.params;
  if (!Object.prototype.hasOwnProperty.call(SERVED, file)) return notFound();
  const type = SERVED[file as keyof typeof SERVED];

  const path = join(MEDIA_ROOT, file);
  let size: number;
  try {
    const s = await stat(path);
    if (!s.isFile()) return notFound();
    size = s.size;
  } catch {
    /* The file is not on disk in this deploy. That is our failure, not the visitor's,
       but it is still a 404 to them: there is nothing to serve and nothing to say. It
       shows up as a broken player, which is why the acceptance test asserts the
       AUTHORISED half returns 206 and not only that the anonymous half returns 404.
       An anonymous 404 alone means GATED or ABSENT, and those are opposite states. */
    return notFound();
  }

  const base: Record<string, string> = {
    "content-type": type,
    "accept-ranges": "bytes",
    /* A private recording is never a shared cache entry, at the CDN or anywhere else. */
    "cache-control": "private, no-store, max-age=0, must-revalidate",
    "netlify-cdn-cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow, noarchive",
    "content-disposition": `inline; filename="${file}"`,
  };

  const range = req.headers.get("range");
  const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;

  if (!m) {
    /* No Range: hand back the head of the file as a 206 rather than the whole thing as
       a 200. Every player follows up with real ranges once it has the header, and this
       keeps a single request from pulling the entire take through a function. */
    const end = Math.min(size - 1, MAX_CHUNK - 1);
    return streamRange(path, 0, end, size, base);
  }

  const [, rawStart, rawEnd] = m;
  let start: number;
  let end: number;

  if (rawStart === "") {
    /* `bytes=-N` means the LAST n bytes, not "up to n". Getting this backwards serves
       the wrong audio from the wrong offset and sounds like a corrupt file. */
    const n = Number(rawEnd);
    if (!Number.isFinite(n) || n <= 0) return unsatisfiable(size, base);
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? size - 1 : Number(rawEnd);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= size || end < start) {
      return unsatisfiable(size, base);
    }
    end = Math.min(end, size - 1);
  }

  end = Math.min(end, start + MAX_CHUNK - 1);
  return streamRange(path, start, end, size, base);
}

function unsatisfiable(size: number, base: Record<string, string>): Response {
  return new Response(null, {
    status: 416,
    headers: { ...base, "content-range": `bytes */${size}` },
  });
}

function streamRange(
  path: string,
  start: number,
  end: number,
  size: number,
  base: Record<string, string>,
): Response {
  const node = createReadStream(path, { start, end });
  /* Readable.toWeb so the body streams instead of being buffered. Buffering a sixteen
     megabyte take into memory to hand it back is how a function runs out of it. */
  const body = Readable.toWeb(node) as unknown as ReadableStream<Uint8Array>;
  return new Response(body, {
    status: 206,
    headers: {
      ...base,
      "content-range": `bytes ${start}-${end}/${size}`,
      "content-length": String(end - start + 1),
    },
  });
}

/** Anything but a GET on a private recording is somebody poking at it. */
export async function HEAD(): Promise<Response> {
  return notFound();
}
