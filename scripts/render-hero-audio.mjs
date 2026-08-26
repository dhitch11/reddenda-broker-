#!/usr/bin/env node
/**
 * THE HERO AUDIO RENDERER.  @BROKER-AUDIO, 2026-08-26.
 *
 * Usage:
 *   node scripts/render-hero-audio.mjs <script.md> <public/audio/name.mp3> --take=locked|fleet
 *
 * Produces, from one command and one script file:
 *   name.mp3    the master, one encode, loudness-normalised
 *   name.json   the sidecar: measured duration, real waveform peaks, captions
 *               timed from the render's own character alignment, transcript
 *   name.vtt    a real WebVTT track built from the same alignment
 *
 * ═══ WHY THIS EXISTS AND WHAT IT FIXES ═══════════════════════════════════════
 *
 * render-audio.mjs rendered LEO III and it was measured at 179 words per minute
 * with ZERO pauses of 0.8s or longer. The President's order is 105 to 125 wpm
 * "with real air". It is worth being precise about why the old path could not
 * get there, because the obvious answer is wrong.
 *
 * IT WAS NOT THE VOICE SETTINGS. Its `spoken()` reducer ends with
 *     .join(" ").replace(/\s+/g, " ")
 * which collapses EVERY blank line in the script into a single space. The
 * writer's paragraph breaks, the beats, the whole shape of the air, were
 * deleted before the text ever reached the model. It was then handed ~3,500
 * characters of unbroken run-on prose and asked to breathe. It did what anyone
 * would do with a wall of text: it read it at pace.
 *
 * So a lane could have spent a day at the stability knob and never moved the
 * number, because the defect was in a regular expression. The estate's own rule
 * applies exactly: measure the COMPUTED result, and ask which measurement would
 * have caught this. A word count would not. A LUFS reading would not. Only
 * counting the pauses did.
 *
 * ═══ HOW AIR IS MADE HERE ════════════════════════════════════════════════════
 *
 * 1. ONE TTS CALL PER BEAT, not one per script and not one per sentence.
 *    A beat is a paragraph. Beats are the unit the writer wrote in.
 * 2. EVERY CALL CARRIES `previous_text` AND `next_text`. The model sees the
 *    sentences on both sides of a seam it cannot hear, so prosody carries
 *    across the join. This is what stopped LEO I sounding assembled and it is
 *    kept exactly.
 * 3. EACH BEAT IS TRIMMED, THEN PADDED. The model's own leading and trailing
 *    silence is measured off the samples and removed, then exactly the air the
 *    script asks for is added. Without the trim, model silence and scripted
 *    silence stack and the piece drags unpredictably; with it, the air is what
 *    the writer wrote, to the millisecond.
 * 4. THE JOIN IS ON RAW PCM. No MP3 is concatenated, so no encoder delay or
 *    padding stacks at any seam. One encode happens, once, at the end.
 *
 * The script controls its own air:  a blank line between beats is DEFAULT_AIR;
 * `{air:1.4}` at the end of a beat overrides it for that seam. Nothing else in
 * the file is spoken: headings, notes and claim checks are for humans.
 *
 * ═══ CAPTIONS ARE MEASURED, NEVER ASSUMED ════════════════════════════════════
 *
 * The `/with-timestamps` endpoint returns per-character start and end times for
 * the audio it just generated. Captions and the VTT are built from THAT, offset
 * by each beat's real position in the master. They therefore describe the file
 * that shipped rather than the script's hopes about it. If the endpoint does
 * not return an alignment, this script emits NO captions rather than spacing
 * them evenly, because an evenly-spaced caption is a fabricated measurement.
 *
 * ═══ THE KEY, BY NAME ════════════════════════════════════════════════════════
 *
 * ELEVENLABS_PHONE_API_KEY, read BY NAME out of the estate's voice-key.js. The
 * main ELEVENLABS_API_KEY has 0 characters of credit and is not a fallback: a
 * render that silently used it would fail at the vendor, not here. No key value
 * is printed by this script, on any path, including on failure.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { homedir } from "node:os";

/* ── arguments ─────────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const SRC = args.find((a) => !a.startsWith("--"));
const OUT = args.filter((a) => !a.startsWith("--"))[1];
const takeArg = (args.find((a) => a.startsWith("--take=")) ?? "--take=locked").split("=")[1];
if (!SRC || !OUT) {
  console.error("usage: render-hero-audio.mjs <script.md> <out.mp3> [--take=locked|fleet]");
  process.exit(2);
}

/* ── THE TWO TAKES ─────────────────────────────────────────────────────────────
   Both are rendered for David's ear, because the estate's standing law is that
   this voice is locked BY EAR and not by any metric this script can compute.
   Neither is "the right one" until he says which.

   locked = reference_david_thomas_voice_the_estate_wide_recipe.md, verbatim:
            stability 0.42 · similarity 0.80 · style 0.28 · speaker_boost true.
            style 0.28 and speaker_boost true are the two that sat wrong for a
            week and are the whole ballgame; stability is NOT a calmness knob and
            LOWER is calmer on this clone, so 0.42 is not a typo.
   fleet  = the settings this fleet rendered LEO III on: similarity 0.85,
            style 0.35. Kept so the comparison is against something he has
            already heard rather than against a hypothetical.

   MODEL IS eleven_multilingual_v2 AND IS NOT A VARIABLE. Never write "flash"
   without a version: eleven_flash_v2_5's fine-tune of this clone FAILED, and it
   renders successfully while not being his voice at all. It does not error. */
const TAKES = {
  locked: { stability: 0.42, similarity_boost: 0.80, style: 0.28, use_speaker_boost: true },
  fleet:  { stability: 0.42, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true },
};
const VOICE_SETTINGS = TAKES[takeArg];
if (!VOICE_SETTINGS) {
  console.error(`unknown --take=${takeArg}. known: ${Object.keys(TAKES).join(", ")}`);
  process.exit(2);
}

const VOICE = process.env.DAVID_THOMAS_VOICE_ID || "z0BOWBeixS6REJudB8Qi";
const MODEL = "eleven_multilingual_v2";
const SR = 44100;                 // samples per second, mono s16le throughout
const DEFAULT_AIR = 0.70;         // seconds between beats when the script says nothing
const TRIM_FLOOR = 0.006;         // amplitude below this is silence for trimming (about -44 dBFS)
const TARGET_LUFS = -16.5;        // web hero loudness. SEE THE NOTE BELOW BEFORE CHANGING THIS.
const TARGET_TP = -1.5;           // dBTP ceiling

/* ⚠️ DO NOT "CORRECT" TARGET_LUFS TO -20.1. That figure is real and it belongs to
   a DIFFERENT MEDIUM: the 8 kHz telephone duplex path, where it was measured
   against a band-limited reference and where raw ElevenLabs at -16.8 was
   rejected by ear as "too loud and too fake". This is a 44.1 kHz web asset
   played through laptop speakers next to a page of text. -16.5 LUFS is the web
   norm and is what LEO III shipped at. Two true statements about two different
   worlds; do not read one against the other. */

/* ── the key, by name, never printed ───────────────────────────────────────── */
function apiKey() {
  const byEnv = process.env.ELEVENLABS_PHONE_API_KEY;
  if (byEnv) return { key: byEnv, from: "ELEVENLABS_PHONE_API_KEY (environment)" };
  const vaultPaths = [
    join(homedir(), "estate", "reimburseos-v3-build", "netlify", "functions", "lib", "voice-key.js"),
    join(homedir(), "estate", "dental-mkt-wt", "netlify", "functions", "lib", "voice-key.js"),
  ];
  for (const p of vaultPaths) {
    if (!existsSync(p)) continue;
    const mod = require_(p);
    if (mod?.ELEVENLABS_PHONE_API_KEY) {
      return { key: mod.ELEVENLABS_PHONE_API_KEY, from: `ELEVENLABS_PHONE_API_KEY (voice-key.js)` };
    }
  }
  console.error("no ELEVENLABS_PHONE_API_KEY by that name in the environment or in voice-key.js.");
  console.error("  the main ELEVENLABS_API_KEY has 0 characters and is deliberately NOT a fallback.");
  process.exit(2);
}
function require_(p) {
  /* voice-key.js is CommonJS and this file is ESM. Reading + evaluating it in a
     tiny sandbox keeps the value in memory and out of every log this run writes. */
  const src = readFileSync(p, "utf8");
  const module = { exports: {} };
  new Function("module", "exports", "require", src)(module, module.exports, () => ({}));
  return module.exports;
}

/* ── the script: beats and their air ───────────────────────────────────────── */
function beatsOf(md) {
  const start = md.indexOf("## SPOKEN SCRIPT");
  let body = start >= 0 ? md.slice(start + "## SPOKEN SCRIPT".length) : md;
  const end = body.search(/\n##\s/);
  if (end > 0) body = body.slice(0, end);

  return body
    .split(/\n\s*\n/)                             // ★ blank lines SURVIVE. They are the air.
    .map((block) =>
      block
        .split(/\r?\n/)
        .filter((l) => !/^\s*(#|\*\*|\||>|-{3,})/.test(l))
        .map((l) => l.replace(/\[\[[^\]]*\]\]/g, "").replace(/[*_`]/g, "").trim())
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean)
    .map((text) => {
      const m = text.match(/\{air:\s*([\d.]+)\s*\}\s*$/);
      const air = m ? Number(m[1]) : DEFAULT_AIR;
      return { text: text.replace(/\{air:[^}]*\}\s*$/, "").replace(/\s+/g, " ").trim(), air };
    })
    .filter((b) => b.text);
}

/* ── PCM helpers. Everything is mono s16le at SR. ──────────────────────────── */
const bytesPerSample = 2;
function silence(seconds) {
  return Buffer.alloc(Math.round(seconds * SR) * bytesPerSample);
}
/** Measure the model's own head and tail silence and return the voiced span,
    plus how much was cut, so the caption offsets can be corrected by the head. */
function trimSilence(pcm) {
  const n = Math.floor(pcm.length / bytesPerSample);
  const loud = (i) => Math.abs(pcm.readInt16LE(i * bytesPerSample)) / 32768;
  const win = Math.round(SR * 0.01); // 10 ms windows
  const rms = (from) => {
    let s = 0, c = 0;
    for (let i = from; i < Math.min(from + win, n); i++) { const v = loud(i); s += v * v; c++; }
    return c ? Math.sqrt(s / c) : 0;
  };
  let head = 0;
  while (head + win < n && rms(head) < TRIM_FLOOR) head += win;
  let tail = n - win;
  while (tail > head && rms(tail) < TRIM_FLOOR) tail -= win;
  const startS = Math.max(0, head - Math.round(SR * 0.02));   // keep 20 ms of breath in
  const endS = Math.min(n, tail + win + Math.round(SR * 0.04));
  return {
    pcm: pcm.subarray(startS * bytesPerSample, endS * bytesPerSample),
    headCutSeconds: startS / SR,
  };
}

/* ── the vendor call ───────────────────────────────────────────────────────── */
const { key: KEY, from: KEY_SOURCE } = apiKey();

async function tts(text, prev, next) {
  const body = {
    text,
    model_id: MODEL,
    voice_settings: VOICE_SETTINGS,
    ...(prev ? { previous_text: prev } : {}),
    ...(next ? { next_text: next } : {}),
  };
  let lastErr = "";
  for (let attempt = 1; attempt <= 4; attempt++) {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`,
      { method: "POST", headers: { "xi-api-key": KEY, "content-type": "application/json" }, body: JSON.stringify(body) },
    );
    if (r.ok) {
      const j = await r.json();
      if (!j.audio_base64) throw new Error("with-timestamps returned no audio_base64");
      const mp3 = Buffer.from(j.audio_base64, "base64");
      const tmp = join("/tmp", `hero-${process.pid}-${attempt}-${Math.round(performance.now())}.mp3`);
      writeFileSync(tmp, mp3);
      const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", tmp, "-f", "s16le", "-ar", String(SR), "-ac", "1", "-"],
        { maxBuffer: 1024 * 1024 * 512 });
      try { unlinkSync(tmp); } catch {}
      return { pcm, alignment: j.alignment ?? j.normalized_alignment ?? null };
    }
    lastErr = (await r.text()).slice(0, 200);
    /* Never echo a header or a body that could carry the key back out. */
    if (attempt === 4) throw new Error(`TTS ${r.status} after 4 attempts: ${lastErr}`);
    await new Promise((res) => setTimeout(res, 1500 * attempt));
  }
}

/* ── sentence-level cues from character-level alignment ────────────────────── */
function cuesFromAlignment(text, alignment, offsetSeconds, headCutSeconds) {
  if (!alignment?.characters?.length) return null;
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds ?? [];
  const ends = alignment.character_end_times_seconds ?? [];
  if (starts.length !== chars.length || ends.length !== chars.length) return null;

  /* The alignment is over the string the vendor spoke, which may differ from our
     input in whitespace. Walk both together rather than trusting index equality. */
  const spoken = chars.join("");
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*/g) ?? [text];
  const cues = [];
  let cursor = 0;
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    const idx = spoken.indexOf(s, cursor);
    if (idx < 0) continue;                       // could not locate it: emit nothing for it
    const last = idx + s.length - 1;
    const t0 = starts[idx] - headCutSeconds + offsetSeconds;
    const t1 = ends[last] - headCutSeconds + offsetSeconds;
    if (Number.isFinite(t0) && Number.isFinite(t1) && t1 > t0) {
      cues.push({ t0: Math.max(0, Number(t0.toFixed(2))), t1: Number(t1.toFixed(2)), text: s });
    }
    cursor = last + 1;
  }
  return cues;
}

/* ── run ───────────────────────────────────────────────────────────────────── */
const md = readFileSync(SRC, "utf8");
const beats = beatsOf(md);
const fullText = beats.map((b) => b.text).join(" ");
const words = fullText.split(/\s+/).filter(Boolean).length;
const scriptedAir = beats.slice(0, -1).reduce((a, b) => a + b.air, 0);

console.log(`take        ${takeArg}  ${JSON.stringify(VOICE_SETTINGS)}`);
console.log(`key         ${KEY_SOURCE}`);
console.log(`script      ${basename(SRC)}  ${beats.length} beats  ${words} words`);
console.log(`scripted air ${scriptedAir.toFixed(2)}s across ${beats.length - 1} seams\n`);

const pieces = [];
const cues = [];
let cursorSeconds = 0;
let alignmentMissing = 0;

for (let i = 0; i < beats.length; i++) {
  const prev = i > 0 ? beats[i - 1].text.slice(-400) : undefined;
  const next = i < beats.length - 1 ? beats[i + 1].text.slice(0, 400) : undefined;
  process.stdout.write(`  beat ${String(i + 1).padStart(2)}/${beats.length}  ${String(beats[i].text.length).padStart(4)} chars ... `);

  const { pcm: raw, alignment } = await tts(beats[i].text, prev, next);
  const { pcm, headCutSeconds } = trimSilence(raw);
  const seconds = pcm.length / bytesPerSample / SR;

  const beatCues = cuesFromAlignment(beats[i].text, alignment, cursorSeconds, headCutSeconds);
  if (beatCues) cues.push(...beatCues); else alignmentMissing++;

  pieces.push(pcm);
  cursorSeconds += seconds;

  const isLast = i === beats.length - 1;
  if (!isLast) {
    pieces.push(silence(beats[i].air));
    cursorSeconds += beats[i].air;
  }
  console.log(`${seconds.toFixed(2)}s voiced` + (isLast ? "" : ` + ${beats[i].air.toFixed(2)}s air`) +
    (beatCues ? `  ${beatCues.length} cues` : "  NO ALIGNMENT"));
}

if (alignmentMissing) {
  console.warn(`\n⚠ ${alignmentMissing} beat(s) returned no usable alignment.`);
  console.warn("  Captions are emitted ONLY for beats that did align. No cue is ever spaced evenly");
  console.warn("  to fill a gap: an invented timing is a fabricated measurement.");
}

/* ── one encode, then master ───────────────────────────────────────────────── */
mkdirSync(dirname(OUT), { recursive: true });
const rawPcm = Buffer.concat(pieces);
const tmpPcm = join("/tmp", `hero-master-${process.pid}.pcm`);
const tmpMp3 = join("/tmp", `hero-master-${process.pid}.mp3`);
writeFileSync(tmpPcm, rawPcm);

/* Two-pass loudnorm: measure, then correct. A single-pass loudnorm is a dynamic
   guess and moves the level while the piece plays, which is audible on a 75s
   read with deliberate silence in it. */
const measure = JSON.parse(
  (execFileSync("ffmpeg", ["-v", "info", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", tmpPcm,
    "-af", `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=11:print_format=json`, "-f", "null", "-"],
    { stdio: ["ignore", "ignore", "pipe"] }).toString().match(/\{[\s\S]*\}/) ?? ["{}"])[0],
);
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", tmpPcm,
  "-af", `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=11:measured_I=${measure.input_i}:measured_TP=${measure.input_tp}:measured_LRA=${measure.input_lra}:measured_thresh=${measure.input_thresh}:offset=${measure.target_offset}:linear=true`,
  "-ar", String(SR), "-c:a", "libmp3lame", "-b:a", "160k", tmpMp3]);
execFileSync("cp", [tmpMp3, OUT]);
try { unlinkSync(tmpPcm); unlinkSync(tmpMp3); } catch {}

const duration = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
  "-of", "default=nw=1:nk=1", OUT]).toString().trim());
const bytes = statSync(OUT).size;

/* ── the waveform, decoded from the SHIPPED file ───────────────────────────── */
const shipped = execFileSync("ffmpeg", ["-v", "error", "-i", OUT, "-f", "s16le", "-ar", String(SR), "-ac", "1", "-"],
  { maxBuffer: 1024 * 1024 * 512 });
const BUCKETS = 220;
const total = Math.floor(shipped.length / bytesPerSample);
const per = Math.max(1, Math.floor(total / BUCKETS));
const peaks = [];
for (let b = 0; b < BUCKETS; b++) {
  let sum = 0, c = 0;
  for (let i = b * per; i < Math.min((b + 1) * per, total); i += 3) {
    const v = shipped.readInt16LE(i * bytesPerSample) / 32768; sum += v * v; c++;
  }
  peaks.push(c ? Number(Math.sqrt(sum / c).toFixed(4)) : 0);
}
const loudest = Math.max(...peaks, 1e-6);
const normPeaks = peaks.map((p) => Number(Math.min(1, p / loudest).toFixed(4)));

/* ── the VTT, from the same cues the sidecar carries ───────────────────────── */
function vttTime(s) {
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(Math.floor(s % 60)).padStart(2, "0");
  const ms = String(Math.round((s % 1) * 1000)).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}
const vttPath = OUT.replace(/\.mp3$/, ".vtt");
if (cues.length) {
  writeFileSync(vttPath, "WEBVTT\n\n" + cues.map((c, i) =>
    `${i + 1}\n${vttTime(c.t0)} --> ${vttTime(Math.min(c.t1, duration))}\n${c.text}\n`).join("\n"));
} else if (existsSync(vttPath)) {
  unlinkSync(vttPath); // never leave a stale track beside a new take
}

/* ── the sidecar ───────────────────────────────────────────────────────────── */
writeFileSync(OUT.replace(/\.mp3$/, ".json"), JSON.stringify({
  renderedAt: new Date().toISOString(),
  renderedFrom: basename(SRC),
  take: takeArg,
  voiceSettings: VOICE_SETTINGS,
  voiceId: VOICE,
  model: MODEL,
  src: `/audio/${basename(OUT)}`,
  bytes,
  duration: Number(duration.toFixed(2)),
  seconds: Math.round(duration),
  words,
  beats: beats.length,
  scriptedAirSeconds: Number(scriptedAir.toFixed(2)),
  wpm: Number((words / (duration / 60)).toFixed(1)),
  loudness: { targetLufs: TARGET_LUFS, targetTruePeakDb: TARGET_TP, measuredInputLufs: Number(measure.input_i) },
  transcript: beats.map((b) => b.text).join("\n\n"),
  captions: cues,
  peaks: normPeaks,
  peaksNote: "RMS per 1/220th of the SHIPPED mp3, decoded to PCM after mastering. Not drawn.",
  /* NO `voice` STRING DESCRIBING A PERSON. The predecessor sidecars carried a
     prose `voice` field and one of them named a real human being three times in
     a file served publicly at 200. This sidecar carries a voice ID and settings,
     which is what a render needs, and no biography. */
}, null, 2));

console.log(`\n${OUT}`);
console.log(`  ${(bytes / 1024 / 1024).toFixed(2)} MB · ${duration.toFixed(2)}s · ${words} words · ${(words / (duration / 60)).toFixed(1)} wpm`);
console.log(`  ${cues.length} caption cues · ${normPeaks.length} peaks · vtt ${cues.length ? "written" : "NOT written"}`);
console.log(`  input loudness ${Number(measure.input_i).toFixed(1)} LUFS → mastered to ${TARGET_LUFS} LUFS, TP ceiling ${TARGET_TP} dBTP`);
console.log(`\nNothing ships unlistened. Run: node scripts/listen-proxy.mjs ${OUT}`);
