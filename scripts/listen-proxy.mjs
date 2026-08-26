#!/usr/bin/env node
/**
 * THE LISTEN PROXY.  @BROKER-AUDIO, 2026-08-26.
 *   node scripts/listen-proxy.mjs public/audio/name.mp3 [--script ~/.broker-fleet/NAME.md]
 *
 * ═══ WHY A GATE THAT ALREADY PASSED ONCE IS NOT ENOUGH ═══════════════════════
 *
 * On 2026-08-25 an audio lane shipped with every gate green - LUFS, true peak, a
 * word-for-word transcript match, a tail gate proven by positive control - and
 * David rejected it in seconds. Those gates measure INTEGRITY. None of them
 * could see the thing he heard. Nobody had measured turn gaps, per-line
 * loudness, or pace.
 *
 * David 2026-08-25, verbatim: "You need to make sure you actually listen to it
 * and check it before sending it to me again."
 *
 * So the standing rule for this file is: before changing anything on a
 * perceptual surface, ask which measurement would catch it if this made the
 * experience WORSE. Where the answer is "none", the check does not belong here
 * and the item goes on the SAY-IT-PLAINLY list at the bottom of the report
 * instead, labelled as something only an ear can judge. This script never
 * prints the word "verified" about timbre, and it is not permitted to approve a
 * take. It can only refuse one.
 *
 * ═══ WHAT IT MEASURES, AND WHY EACH ONE IS HERE ══════════════════════════════
 *
 *  PACE        words per minute over the whole piece. The President measured
 *              LEO III at 179 wpm and ordered 105-125. This is the number.
 *  AIR         every silence in the file, its length and where it falls. The
 *              same LEO III had ZERO pauses of 0.8s or longer across 79
 *              seconds. A narration with no air is a person reading, not a
 *              person speaking.
 *  DROPOUT     any silence long enough to read as a fault rather than a beat.
 *              David's own words on a rejected take: "a 30 or 40 second gap" -
 *              which was a stalled progressive stream, not the file. Both are
 *              worth catching, in different places.
 *  LOUDNESS    integrated LUFS, loudness range, true peak.
 *  PITCH       mean F0, standard deviation and range over voiced frames.
 *              Expressly NOT a pass/fail on timbre: F0 measured CLOSER to
 *              David's real voice on the model he rejected. It is reported so a
 *              take can be compared against another take, never against an
 *              ideal.
 *  BLIND READ  an independent speech-to-text pass. The audio is transcribed
 *              with no sight of the script, and the result is diffed against
 *              the script. This is the only check that can catch the model
 *              speaking a bracket tag out loud, dropping a sentence, or saying
 *              a number wrong.
 *  BANNED      the blind transcript, not the script, is scanned for the
 *              estate's banned language. What matters is what a listener
 *              HEARS. A script can be clean and a render can still say
 *              "reimbursement" because the model expanded something.
 *
 * Exit 0 = nothing here refuses the take. Exit 1 = do not let anyone hear it.
 * Exit 2 = a check could not run, which is NOT a pass.
 */
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join, basename } from "node:path";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const MP3 = args.find((a) => !a.startsWith("--"));
const scriptFlag = args.find((a) => a.startsWith("--script="));
if (!MP3 || !existsSync(MP3)) {
  console.error("usage: listen-proxy.mjs <file.mp3> [--script=<script.md>]");
  process.exit(2);
}

const SR = 22050;              // plenty for F0 on a human voice, and a quarter of the samples
/* ── THE PACE BAND IS A FLAG, BECAUSE A MONOLOGUE AND A DIALOGUE ARE NOT THE
      SAME INSTRUMENT AND ONE BAND CANNOT JUDGE BOTH ─────────────────────────
   Default 105-125 wpm: the President's order for the cinematic hero cut, which
   reaches it by putting 26 seconds of deliberate air into 70 seconds of audio.
   A monologue is mostly beats and that is the point of it.

   A CONVERSATION CANNOT BE JUDGED THAT WAY. Measured on this pipeline, the
   voices read at 238 wpm at speed 1.0 and 180 wpm at speed 0.75. To drag a
   two-voice piece to 115 wpm OVERALL, roughly 40% of its runtime would have to
   be silence, which means about 1.5 seconds between every single turn - and
   that is the artifact David rejected in his own words on 08-25: "not like
   they're having a conversation". The listen-proxy memory puts conversational
   turn gaps at 0.2-0.7s and that is not negotiable against a pace number.

   So a dialogue is gated on --wpm=130,165 (natural speech, snapping turns) and
   --pauses=0, and the SPEAKING rate is the number that matters. Passing the
   flag is not lowering the bar; using the monologue band on a conversation
   would be measuring the wrong thing and calling it rigour. */
const bandFlag = (args.find((a) => a.startsWith("--wpm=")) ?? "").split("=")[1];
const TARGET_WPM = bandFlag ? bandFlag.split(",").map(Number) : [105, 125];
const pausesFlag = (args.find((a) => a.startsWith("--pauses=")) ?? "").split("=")[1];
const MIN_LONG_PAUSES = pausesFlag !== undefined ? Number(pausesFlag) : 6;
const LONG_PAUSE = 0.8;        // the President's own threshold
const DROPOUT = 2.6;           // longer than any beat a script here asks for
const gapFlag = (args.find((a) => a.startsWith("--turngaps=")) ?? "").split("=")[1];
const TURN_GAP_BAND = gapFlag ? gapFlag.split(",").map(Number) : null;
const LUFS_BAND = [-18.5, -14.5];
const TP_CEIL = -1.0;

const BANNED = [
  // payment language: TiC rates are CONTRACTED rates as filed, never payments
  "reimbursement", "reimburse", "allowed amount", "what they pay", "what the plan pays",
  // savings claims
  "save you", "savings", "recover", "recoup", "guaranteed",
  // legal-outcome words
  "compliant", "compliance", "fiduciary", "defensible", "audit proof", "audit-proof",
  // jargon the elementary-glossary ruling bans out loud
  "percentile", "cpt", "hcpcs", "qpa", "idr", "cbsa", "npi",
  // the persona and the disclosure line, both retired by order
  "i'm an ai", "i am an ai", "artificial intelligence",
];
const TAG_LEAK = /\[[^\]]{1,40}\]|\((?:pause|beat|sfx|music|laughs?|sighs?)[^)]*\)/gi;

const problems = [];
const notes = [];
const couldNotRun = [];


/* ffmpeg writes loudnorm's JSON and silencedetect's lines to STDERR, not stdout.
   execFileSync returns stdout, so capturing them with it silently yields null and
   the caller crashes on .toString() of nothing. spawnSync exposes both streams. */
function ffstderr(argv) {
  const r = spawnSync("ffmpeg", argv, { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
  return (r.stderr ?? "") + (r.stdout ?? "");
}

/* ── duration ──────────────────────────────────────────────────────────────── */
const duration = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
  "-of", "default=nw=1:nk=1", MP3]).toString().trim());

/* ── loudness, two-pass measurement only (nothing is written) ──────────────── */
let loud = {};
try {
  const out = ffstderr(["-v", "info", "-i", MP3, "-af",
    "loudnorm=I=-16.5:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"]);
  loud = JSON.parse((out.match(/\{[\s\S]*\}/) ?? ["{}"])[0]);
} catch (e) {
  couldNotRun.push(`loudness: ${String(e).slice(0, 90)}`);
}
const lufs = Number(loud.input_i);
const tp = Number(loud.input_tp);
const lra = Number(loud.input_lra);

/* ── air: every silence, measured ──────────────────────────────────────────── */
let pauses = [];
try {
  const sd = ffstderr(["-v", "info", "-i", MP3, "-af",
    "silencedetect=noise=-38dB:d=0.25", "-f", "null", "-"]);
  const starts = [...sd.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...sd.matchAll(/silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/g)]
    .map((m) => ({ end: Number(m[1]), dur: Number(m[2]) }));
  pauses = ends.map((e, i) => ({ at: starts[i] ?? e.end - e.dur, seconds: e.dur }));
} catch (e) {
  couldNotRun.push(`silence scan: ${String(e).slice(0, 90)}`);
}
const inner = pauses.filter((p) => p.at > 0.4 && p.at + p.seconds < duration - 0.4);
const longPauses = inner.filter((p) => p.seconds >= LONG_PAUSE);
const dropouts = inner.filter((p) => p.seconds >= DROPOUT);
const speechSeconds = duration - inner.reduce((a, p) => a + p.seconds, 0);

/* ── pitch, by autocorrelation over voiced frames ──────────────────────────── */
let f0 = { mean: NaN, sd: NaN, min: NaN, max: NaN, frames: 0 };
try {
  const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", MP3, "-f", "s16le", "-ar", String(SR), "-ac", "1", "-"],
    { maxBuffer: 1024 * 1024 * 400 });
  const n = Math.floor(pcm.length / 2);
  const frame = Math.round(SR * 0.04);          // 40 ms
  const hop = Math.round(SR * 0.02);
  const loMs = Math.round(SR / 320), hiMs = Math.round(SR / 60);   // 60-320 Hz search
  const vals = [];
  const buf = new Float32Array(frame);
  for (let s = 0; s + frame < n; s += hop) {
    let energy = 0;
    for (let i = 0; i < frame; i++) { const v = pcm.readInt16LE((s + i) * 2) / 32768; buf[i] = v; energy += v * v; }
    if (Math.sqrt(energy / frame) < 0.02) continue;               // unvoiced or silent
    let best = 0, bestLag = 0;
    for (let lag = loMs; lag < hiMs && lag < frame - 1; lag++) {
      let c = 0;
      for (let i = 0; i + lag < frame; i += 2) c += buf[i] * buf[i + lag];
      if (c > best) { best = c; bestLag = lag; }
    }
    if (bestLag) vals.push(SR / bestLag);
  }
  if (vals.length > 20) {
    vals.sort((a, b) => a - b);
    /* Trim the outer 5% each side: autocorrelation octave errors are real and
       they are not what a listener hears. */
    const t = vals.slice(Math.floor(vals.length * 0.05), Math.ceil(vals.length * 0.95));
    const mean = t.reduce((a, b) => a + b, 0) / t.length;
    const sd = Math.sqrt(t.reduce((a, b) => a + (b - mean) ** 2, 0) / t.length);
    f0 = { mean, sd, min: t[0], max: t[t.length - 1], frames: t.length };
  }
} catch (e) {
  couldNotRun.push(`pitch: ${String(e).slice(0, 90)}`);
}

/* ── the blind read ────────────────────────────────────────────────────────── */
function apiKey() {
  if (process.env.ELEVENLABS_PHONE_API_KEY) return process.env.ELEVENLABS_PHONE_API_KEY;
  const p = join(homedir(), "estate", "reimburseos-v3-build", "netlify", "functions", "lib", "voice-key.js");
  if (!existsSync(p)) return null;
  const module = { exports: {} };
  new Function("module", "exports", "require", readFileSync(p, "utf8"))(module, module.exports, () => ({}));
  return module.exports.ELEVENLABS_PHONE_API_KEY ?? null;
}
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

let heard = "";
try {
  const key = apiKey();
  if (!key) throw new Error("no ELEVENLABS_PHONE_API_KEY by name");
  const fd = new FormData();
  fd.append("file", new Blob([readFileSync(MP3)], { type: "audio/mpeg" }), basename(MP3));
  fd.append("model_id", "scribe_v1");
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST", headers: { "xi-api-key": key }, body: fd,
  });
  if (!r.ok) throw new Error(`scribe ${r.status}: ${(await r.text()).slice(0, 120)}`);
  heard = (await r.json()).text ?? "";
} catch (e) {
  couldNotRun.push(`blind transcription: ${String(e).slice(0, 120)}`);
}

const heardWords = heard ? norm(heard).split(" ").filter(Boolean) : [];
const wpm = heardWords.length ? heardWords.length / (duration / 60) : NaN;
const speechWpm = heardWords.length ? heardWords.length / (speechSeconds / 60) : NaN;

/* ── the diff against the script, if one was given ─────────────────────────── */
let scriptPath = scriptFlag ? scriptFlag.split("=").slice(1).join("=") : null;
if (scriptPath?.startsWith("~")) scriptPath = scriptPath.replace("~", homedir());
let missing = [], added = [];
if (scriptPath && existsSync(scriptPath) && heard) {
  const md = readFileSync(scriptPath, "utf8");
  const start = md.indexOf("## SPOKEN SCRIPT");
  let body = start >= 0 ? md.slice(start + 16) : md;
  const end = body.search(/\n##\s/);
  if (end > 0) body = body.slice(0, end);
  const scriptWords = norm(body.replace(/\{air:[^}]*\}/g, "")).split(" ").filter(Boolean);
  const hb = new Map(); for (const w of heardWords) hb.set(w, (hb.get(w) ?? 0) + 1);
  const sb = new Map(); for (const w of scriptWords) sb.set(w, (sb.get(w) ?? 0) + 1);
  for (const [w, c] of sb) { const d = c - (hb.get(w) ?? 0); if (d > 0) missing.push(`${w}×${d}`); }
  for (const [w, c] of hb) { const d = c - (sb.get(w) ?? 0); if (d > 0) added.push(`${w}×${d}`); }
}

/* ── the rules ─────────────────────────────────────────────────────────────── */
if (Number.isFinite(wpm)) {
  if (wpm < TARGET_WPM[0]) problems.push(`PACE ${wpm.toFixed(0)} wpm is below the ordered ${TARGET_WPM[0]}-${TARGET_WPM[1]}. It will read as slow, not as considered.`);
  if (wpm > TARGET_WPM[1]) problems.push(`PACE ${wpm.toFixed(0)} wpm is above the ordered ${TARGET_WPM[0]}-${TARGET_WPM[1]}. This is the LEO III defect: 179 wpm with nowhere to breathe.`);
} else couldNotRun.push("pace: no blind transcript, so no honest word count");

/* ── TURN GAPS. The measurement nobody made on 08-25. ─────────────────────── */
let turnGaps = [];
try {
  const side = MP3.replace(/\.mp3$/, ".json");
  if (existsSync(side)) {
    const spans = JSON.parse(readFileSync(side, "utf8")).speakerSpans;
    if (Array.isArray(spans)) {
      for (let i = 1; i < spans.length; i++) {
        turnGaps.push({ at: spans[i - 1].t1, seconds: +(spans[i].t0 - spans[i - 1].t1).toFixed(3),
                        from: spans[i - 1].speaker, to: spans[i].speaker });
      }
    }
  }
} catch { /* no spans is not an error; it just means this is not a dialogue */ }
const speakerChanges = turnGaps.filter((g) => g.from !== g.to);
if (TURN_GAP_BAND && speakerChanges.length) {
  const bad = speakerChanges.filter((g) => g.seconds < TURN_GAP_BAND[0] || g.seconds > TURN_GAP_BAND[1]);
  if (bad.length) problems.push(`TURN GAPS: ${bad.length} of ${speakerChanges.length} speaker changes fall outside ${TURN_GAP_BAND[0]}-${TURN_GAP_BAND[1]}s (worst ${Math.max(...bad.map((b) => b.seconds))}s at ${bad[0].at.toFixed(1)}s). This is the measurement nobody made on the take David rejected.`);
}

if (MIN_LONG_PAUSES > 0 && longPauses.length < MIN_LONG_PAUSES) {
  problems.push(`AIR only ${longPauses.length} pause(s) of ${LONG_PAUSE}s or longer, want at least ${MIN_LONG_PAUSES}. LEO III had ZERO across 79 seconds and that is exactly what "no real air" sounds like.`);
}
for (const d of dropouts) problems.push(`DROPOUT ${d.seconds.toFixed(2)}s of silence at ${d.at.toFixed(1)}s. Longer than any beat should be; it will read as a fault.`);

if (Number.isFinite(lufs)) {
  if (lufs < LUFS_BAND[0] || lufs > LUFS_BAND[1]) problems.push(`LOUDNESS ${lufs.toFixed(1)} LUFS is outside ${LUFS_BAND[0]}..${LUFS_BAND[1]}.`);
}
if (Number.isFinite(tp) && tp > TP_CEIL) problems.push(`TRUE PEAK ${tp.toFixed(1)} dBTP is above ${TP_CEIL}. It will clip on some devices.`);

if (heard) {
  const lower = " " + norm(heard) + " ";
  for (const b of BANNED) if (lower.includes(" " + norm(b) + " ")) problems.push(`BANNED PHRASE HEARD IN THE AUDIO: "${b}". The script may be clean; this is what a listener actually hears.`);
  const leaks = heard.match(TAG_LEAK);
  if (leaks) problems.push(`TAG LEAK: the voice spoke a direction out loud: ${leaks.slice(0, 3).join(" ")}`);
  if (missing.length) problems.push(`BLIND READ dropped or changed ${missing.length} word type(s) from the script: ${missing.slice(0, 12).join(" ")}`);
}

/* ── the report ────────────────────────────────────────────────────────────── */
const line = (k, v) => console.log(`  ${k.padEnd(16)} ${v}`);
console.log(`\nLISTEN PROXY · ${basename(MP3)}`);
line("duration", `${duration.toFixed(2)}s`);
line("heard words", heardWords.length || "—");
line("pace", Number.isFinite(wpm) ? `${wpm.toFixed(0)} wpm overall · ${speechWpm.toFixed(0)} wpm while actually speaking` : "—");
line("air", `${inner.length} pauses · ${longPauses.length} at ${LONG_PAUSE}s+ · longest ${inner.length ? Math.max(...inner.map((p) => p.seconds)).toFixed(2) : "0"}s · ${(duration - speechSeconds).toFixed(1)}s of silence total`);
line("loudness", Number.isFinite(lufs) ? `${lufs.toFixed(1)} LUFS · TP ${tp.toFixed(1)} dBTP · LRA ${lra.toFixed(1)}` : "—");
line("pitch", f0.frames ? `mean ${f0.mean.toFixed(1)} Hz · sd ${f0.sd.toFixed(1)} · range ${f0.min.toFixed(0)}-${f0.max.toFixed(0)} Hz over ${f0.frames} voiced frames` : "—");
if (speakerChanges.length) {
  const g = speakerChanges.map((x) => x.seconds).sort((a, b) => a - b);
  line("turn gaps", `${speakerChanges.length} speaker changes · median ${g[Math.floor(g.length / 2)].toFixed(2)}s · min ${g[0].toFixed(2)}s · max ${g[g.length - 1].toFixed(2)}s`);
}
if (longPauses.length) line("beats at", longPauses.map((p) => `${p.at.toFixed(1)}s/${p.seconds.toFixed(1)}`).join("  "));
if (added.length) line("heard extra", added.slice(0, 10).join(" "));

if (couldNotRun.length) {
  console.log(`\n  ⚠ COULD NOT RUN (not a pass, an unanswered question):`);
  for (const c of couldNotRun) console.log(`    · ${c}`);
}

console.log(`\n  ── what only an ear can judge, and what this script must never claim ──`);
console.log(`  Timbre and clone fidelity. Whether it sounds like a person or a reading.`);
console.log(`  Whether the beats fall where the meaning is. Whether the close lands warm.`);
console.log(`  F0 above is for comparing TAKE to TAKE. The model David rejected measured`);
console.log(`  CLOSER to his real pitch than the one he kept. Never argue a voice from it.`);

if (problems.length) {
  console.error(`\n✗ REFUSED — ${problems.length} problem(s). Do not let anyone hear this yet.\n`);
  for (const p of problems) console.error(`  · ${p}`);
  process.exit(1);
}
if (couldNotRun.length) {
  console.error(`\n? INCONCLUSIVE — every rule that ran passed, but ${couldNotRun.length} check could not run.`);
  process.exit(2);
}
console.log(`\n✓ Nothing here refuses this take. That is not approval: approval is David's ear.\n`);
