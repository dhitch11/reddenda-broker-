#!/usr/bin/env node
/**
 * render-leo.mjs: the LEO voice pipeline for the broker.reddenda.com hero.
 * @BROKER-12, 2026-08-24.
 *
 * Renders /home/ubuntu/.broker-fleet/LEO-SCRIPT.md (or the fallback beside it)
 * to public/audio/leo.mp3 + public/audio/leo.json, one ElevenLabs call per beat,
 * concatenated with ffmpeg so each beat can breathe.
 *
 * THE KEY IS NEVER IN THIS FILE. It is read from process.env, which the caller
 * populates by name:  set -a; . ~/.reddenda/elevenlabs.env; set +a
 * Estate rule 10: secrets by name only. If you ever find a literal key below,
 * that is a bug and a security incident, not a convenience.
 *
 * VOICE: z0BOWBeixS6REJudB8Qi "David Thomas - CEO of Reddenda.com".
 * MODEL: eleven_multilingual_v2, NOT eleven_v3. This is not a preference. The
 * verified estate pattern (doorknock-build/render.py) special-cases this exact
 * voice id to multilingual_v2 because v3 does not carry it. Do not "upgrade" it.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "audio");
/* The beat cache lives OUTSIDE the repo, deliberately. This is a shared working
   tree that several lanes deploy from, and a deploy ships the whole tree; a
   cache directory inside it is one forgotten ignore rule away from being
   published. ~/.cache is nobody's deploy. */
const WORK = join(process.env.HOME || "/tmp", ".cache", "reddenda-leo-beats");
const VOICE = "z0BOWBeixS6REJudB8Qi";
const MODEL = "eleven_multilingual_v2";
const SETTINGS = { stability: 0.36, similarity_boost: 0.84, style: 0.47, use_speaker_boost: true };

const KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
if (!KEY) {
  console.error("NO KEY IN ENV. Run:  set -a; . ~/.reddenda/elevenlabs.env; set +a");
  process.exit(2);
}

const SRC = process.argv[2] || "/home/ubuntu/.broker-fleet/LEO-SCRIPT.md";
if (!existsSync(SRC)) { console.error("script not found:", SRC); process.exit(2); }

/**
 * Parse the war room's markdown into spoken beats.
 * Markdown chrome is stage direction, not speech: headings, rules, blockquotes,
 * bracketed cues and bold/italic markers are stripped rather than pronounced.
 * A blank line is a beat boundary. `[[PAUSE]]` on its own line forces one.
 */
function parseBeats(md) {
  /* THE SPOKEN SECTION IS THE ONLY SECTION.
     The war room ships the script with a metadata header and a "NOTES FOR THE
     RENDER" appendix carrying pacing, emphasis and the claim check. All of that
     is prose, and a parser that merely strips markdown would happily read the
     entire claim-check appendix aloud in David's voice. So when the file marks a
     spoken section, everything outside it is discarded before a single line is
     considered. */
  const head = md.match(/^#{1,6}[ \t]*SPOKEN SCRIPT[ \t]*$/im);
  if (head) {
    const from = head.index + head[0].length;
    const rest = md.slice(from);
    /* The next heading of ANY level ends the spoken section. Matched on `rest`
       rather than on the whole file so the offset needs no arithmetic, and with
       a real JS anchor: `\Z` is not one, it is an identity escape for the letter
       Z, which silently truncated this script at its first capital Z. */
    const next = rest.match(/^#{1,6}[ \t]+\S/m);
    md = next ? rest.slice(0, next.index) : rest;
  }
  const lines = md.split(/\r?\n/);
  const beats = [];
  let buf = [];
  const flush = () => { const t = buf.join(" ").trim(); if (t) beats.push(t); buf = []; };
  for (let raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (/^#{1,6}\s/.test(line)) { flush(); continue; }        // heading
    if (/^(-{3,}|={3,}|\*{3,})$/.test(line)) { flush(); continue; } // rule
    if (/^>/.test(line)) { flush(); continue; }               // blockquote = note
    if (/^\[\[PAUSE\]\]$/i.test(line)) { flush(); continue; }
    if (/^(\||`{3})/.test(line)) { flush(); continue; }       // table / fence
    let t = line
      .replace(/^[-*+]\s+/, "")                                // list bullet
      .replace(/^\d+[.)]\s+/, "")                              // ordered bullet
      .replace(/\*\*(.+?)\*\*/g, "$1")                         // bold
      .replace(/(^|\W)\*(.+?)\*(?=\W|$)/g, "$1$2")             // italic
      .replace(/_(.+?)_/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")                      // link
      .replace(/\[[^\]]*\]/g, "")                              // [stage direction]
      .replace(/\((?:beat|pause|music|sfx)[^)]*\)/gi, "")       // (beat)
      .replace(/^(LEO|NARRATOR|VO)\s*:\s*/i, "")               // speaker label
      .replace(/\s+/g, " ")
      .trim();
    if (t) buf.push(t);
  }
  flush();
  return beats.filter((b) => /[a-z]/i.test(b));
}

async function tts(text, out, prev, next) {
  const body = { text, model_id: MODEL, voice_settings: SETTINGS };
  if (prev) body.previous_text = prev;
  if (next) body.next_text = next;
  // Two retries: a 429 or a transient 5xx must not cost us the whole render.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`,
      { method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 2000) throw new Error(`suspiciously small render (${buf.length}b) for: ${text.slice(0, 60)}`);
      writeFileSync(out, buf);
      return buf.length;
    }
    const detail = (await res.text()).slice(0, 300);
    if (attempt === 3 || (res.status < 500 && res.status !== 429)) {
      throw new Error(`ElevenLabs ${res.status}: ${detail}`);
    }
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
}

const statSize = (f) => { try { return readFileSync(f).length; } catch { return 0; } };
const ffprobe = (f) =>
  parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

const md = readFileSync(SRC, "utf8");
const beats = parseBeats(md);
if (!beats.length) { console.error("no speakable beats parsed from", SRC); process.exit(2); }
const words = beats.join(" ").split(/\s+/).length;
console.log(`${beats.length} beats · ${words} words · ~${(words / 150).toFixed(1)} min at 150wpm`);

mkdirSync(WORK, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

/* THE BEATS ARE CACHED ON THEIR OWN CONTENT.
   A beat's audio is a pure function of its text, its two neighbours and the
   voice settings, so it is keyed on a hash of exactly those. Re-timing the
   piece, or changing one line of a ten line script, then costs nothing at the
   API and a second of ffmpeg. Getting the pacing right should not be rationed
   by an API bill. */
const parts = [];
let fresh = 0, cached = 0;
for (let i = 0; i < beats.length; i++) {
  const key = createHash("sha256")
    .update(JSON.stringify([beats[i], beats[i - 1] ?? "", beats[i + 1] ?? "", VOICE, MODEL, SETTINGS]))
    .digest("hex").slice(0, 16);
  const f = join(WORK, `beat-${key}.mp3`);
  let note = "cached";
  if (existsSync(f) && statSize(f) > 2000) { cached++; }
  else {
    await tts(beats[i], f, beats[i - 1], beats[i + 1]);
    fresh++; note = "rendered";
    await new Promise((r) => setTimeout(r, 250));
  }
  const d = ffprobe(f);
  parts.push({ file: f, text: beats[i], dur: d });
  console.log(`  beat ${i + 1}/${beats.length}  ${d.toFixed(2)}s  ${note}  ${beats[i].slice(0, 52)}`);
}
console.log(`  (${fresh} rendered, ${cached} from cache)`);

/* THE BREATH BETWEEN BEATS.
   The war room's direction is "treat every blank line as a full breath, 0.6 to
   0.9s", so that is the default and LEO_GAP overrides it. Rendered as real
   silence rather than left as a gap in the concat list, because a concat demuxer
   gap is a timestamp jump and Safari seeks it as a hole rather than as quiet. */
const GAP = Number(process.env.LEO_GAP || 0.78);
const SIL = join(WORK, `sil-${GAP}.mp3`);
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(GAP), "-c:a", "libmp3lame", "-b:a", "128k", SIL]);
const silDur = ffprobe(SIL);

const listPath = join(WORK, "list.txt");
const listLines = [];
const chapters = [];
let t = 0;
for (let i = 0; i < parts.length; i++) {
  chapters.push({ t: Number(t.toFixed(2)), text: parts[i].text });
  listLines.push(`file '${parts[i].file}'`);
  t += parts[i].dur;
  if (i < parts.length - 1) { listLines.push(`file '${SIL}'`); t += silDur; }
}
writeFileSync(listPath, listLines.join("\n") + "\n");

const finalMp3 = join(OUT_DIR, "leo.mp3");
/* Re-encode on concat, deliberately. A stream copy of N separately-encoded MP3s
   leaves N sets of encoder-delay frames in the stream, and the browser's decoder
   renders each as a click at the seam. Re-encoding costs a second and removes them. */
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", listPath,
  "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", "-ac", "1", finalMp3]);

const dur = ffprobe(finalMp3);
writeFileSync(join(OUT_DIR, "leo.json"), JSON.stringify({
  src: "/audio/leo.mp3",
  duration: Number(dur.toFixed(2)),
  voice: "David Thomas - CEO of Reddenda.com",
  model: MODEL,
  renderedFrom: SRC,
  renderedAt: new Date().toISOString(),
  chapters,
  transcript: beats.join("\n\n"),
}, null, 2) + "\n");

const mb = (readFileSync(finalMp3).length / 1048576).toFixed(2);
console.log(`\nDONE  ${finalMp3}  ${Math.floor(dur / 60)}:${String(Math.round(dur % 60)).padStart(2, "0")}  ${mb} MB`);
if (dur > 195) console.log(`WARNING: ${dur.toFixed(0)}s exceeds the 3:00 ceiling. Cut the script, do not speed the voice.`);
