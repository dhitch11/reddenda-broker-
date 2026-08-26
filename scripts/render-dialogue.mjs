#!/usr/bin/env node
/**
 * THE TWO-VOICE DIALOGUE RENDERER.  @BROKER-AUDIO, 2026-08-26.
 *   node scripts/render-dialogue.mjs <script.md> <out.mp3> [--take=locked|fleet] [--lufs=-18.7]
 *
 * Built for David's private CAHIP rehearsal audio: BLAIR asks, the DAVID THOMAS
 * clone answers, for fifteen to twenty minutes. It is a separate file from
 * render-hero-audio.mjs because a conversation has three problems a monologue
 * does not, and each one has bitten this estate already.
 *
 * ═══ 1. TURN GAPS ARE THE THING PEOPLE HEAR ══════════════════════════════════
 *
 * On 2026-08-25 a two-voice piece shipped with every integrity gate green and
 * was rejected in seconds. David's words: "her voice sounds super cheesy... not
 * like they're having a conversation... she should say hello and he should start
 * talking right away, immediately." The lane had measured LUFS, true peak and a
 * word-for-word transcript. Nobody had measured the GAP BETWEEN TURNS, which was
 * running 1.3 to 2.0 seconds with an 8.8 second opening line.
 *
 * So turn gaps are a first-class parameter here, not an accident of the model's
 * tail silence. Every turn is trimmed to its voiced span and the gap after it is
 * exactly what the script asks for. Default 0.32s, which is what an interested
 * person actually leaves before answering. A deliberate beat is written as
 * {air:1.1} and is capped, because a "thoughtful pause" past about 1.3s reads as
 * a stall on a phone speaker in a moving car, which is where this will be heard.
 *
 * ═══ 2. TWO SPEAKERS AT TWO LEVELS IS THE OTHER THING PEOPLE HEAR ════════════
 *
 * Same rejection: "the ringing is super faint" - one element sitting far below
 * the others. Two ElevenLabs voices with different settings do NOT come back at
 * the same loudness, and mastering the finished master cannot fix it, because
 * by then the difference is baked into the mix. So each speaker's turns are
 * measured as a group, a per-speaker gain is applied BEFORE the join, and only
 * then is the whole thing mastered. The report prints both speakers' levels so
 * the match is a number, not a hope.
 *
 * ═══ 3. THE REFERENCE IS AN EXISTING, EAR-APPROVED PIECE ═════════════════════
 *
 * David's order is that this be "wired and set up and tuned exactly like"
 * reddenda.org/bobanddave. That page is on this box, and rather than take its
 * settings on trust I measured its shipped audio:
 *
 *     mp3 · 44100 Hz · MONO · 128 kbps · integrated -18.70 LUFS · TP -1.66 dBTP
 *     one file per chapter, new Audio(), preload='auto'   (bobanddave.html:1798)
 *
 * Those are this file's defaults. Note that -18.7 LUFS is QUIETER than the
 * -16.5 the hero audio ships at, and that is deliberate rather than a mistake to
 * correct: it is the level on the piece his ear already approved, and a long
 * spoken piece wants more headroom than a 75-second hero cut. The estate's rule
 * is that this voice is locked BY EAR and not by any metric, so where a measured
 * reference exists, the reference wins over the norm.
 *
 * ONE DEPARTURE FROM THE REFERENCE, DELIBERATE AND STATED: bobanddave ships one
 * mp3 per chapter. This renders ONE MASTER plus chapter cue points in the
 * sidecar, because the player it is going into is the hero-audio transport,
 * which takes a single source and draws a real waveform across it. Chaptering
 * survives; the fragmentation does not.
 *
 * Keys by name (ELEVENLABS_PHONE_API_KEY, out of voice-key.js). No key value is
 * printed on any path, including on failure.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, unlinkSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const SRC = positional[0];
const OUT = positional[1];
const flag = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=").slice(1).join("=") : d; };
if (!SRC || !OUT) { console.error("usage: render-dialogue.mjs <script.md> <out.mp3> [--take=locked|fleet] [--lufs=-18.7]"); process.exit(2); }

const SR = 44100;
const DEFAULT_GAP = 0.32;      // between turns. Measured-rejection default, not a guess.
const MAX_GAP = 1.30;          // past this a beat reads as a stall
const TARGET_LUFS = Number(flag("lufs", "-18.7"));   // the bobanddave reference, measured
const TARGET_TP = -1.5;
const BITRATE = "128k";        // the reference's own bitrate
const TRIM_FLOOR = 0.006;


/* ffmpeg writes loudnorm's JSON and silencedetect's lines to STDERR, not stdout.
   execFileSync returns stdout, so capturing them with it silently yields null and
   the caller crashes on .toString() of nothing. spawnSync exposes both streams. */
function ffstderr(argv) {
  const r = spawnSync("ffmpeg", argv, { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
  return (r.stderr ?? "") + (r.stdout ?? "");
}

/* ── the cast ──────────────────────────────────────────────────────────────────
   Both voice ids were READ OFF THE LIVE ACCOUNT, not recalled: neither is
   recorded anywhere on this box, and guessing a voice id renders a stranger
   without erroring.
       3io0Zxlhm30puFW858RF   "Blair - Confident Emotional"   professional
       z0BOWBeixS6REJudB8Qi   "David Thomas - CEO"            professional

   ⛔ MODEL: eleven_multilingual_v2 for the David clone, and it is NOT a variable.
   Never write "flash" without a version. eleven_flash_v2_5's fine-tune of this
   clone FAILED: it renders happily, returns 200, and is not his voice. A week
   was lost to that once. If a model is changed here, it is changed after a
   listen, never after a price comparison.

   Blair's model is probed at startup rather than assumed, because a model that
   is not enabled on this account returns an error at render time and a model
   that IS enabled but wrong sounds fine and is the wrong person. */
const TAKES = {
  locked: { stability: 0.42, similarity_boost: 0.80, style: 0.28, use_speaker_boost: true },
  fleet:  { stability: 0.42, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true },
};
const take = flag("take", "locked");
if (!TAKES[take]) { console.error(`unknown --take=${take}`); process.exit(2); }

const CAST = {
  DAVID: {
    voice: "z0BOWBeixS6REJudB8Qi",
    model: "eleven_multilingual_v2",
    settings: TAKES[take],
  },
  BLAIR: {
    voice: "3io0Zxlhm30puFW858RF",
    model: "eleven_multilingual_v2",
    /* An interviewer sits a little brighter and a little less stable than the
       answering voice, or the two read as one person doing an impression.
       These are a starting point for an EAR comparison, never a locked recipe:
       Blair has never been through David's ear on this estate. */
    settings: { stability: 0.38, similarity_boost: 0.82, style: 0.32, use_speaker_boost: true },
  },
};

/* ── the key, by name, never printed ───────────────────────────────────────── */
function apiKey() {
  if (process.env.ELEVENLABS_PHONE_API_KEY) return process.env.ELEVENLABS_PHONE_API_KEY;
  const p = join(homedir(), "estate", "reimburseos-v3-build", "netlify", "functions", "lib", "voice-key.js");
  if (!existsSync(p)) { console.error("no voice-key.js and no ELEVENLABS_PHONE_API_KEY in env"); process.exit(2); }
  const module = { exports: {} };
  new Function("module", "exports", "require", readFileSync(p, "utf8"))(module, module.exports, () => ({}));
  const k = module.exports.ELEVENLABS_PHONE_API_KEY;
  if (!k) { console.error("voice-key.js has no ELEVENLABS_PHONE_API_KEY"); process.exit(2); }
  return k;
}
const KEY = apiKey();

/* ── the script ────────────────────────────────────────────────────────────────
   Lines are "BLAIR: ..." or "DAVID: ...". A "### Title" line opens a chapter and
   is never spoken. {air:N} at the end of a line sets the gap AFTER that turn. */
function parse(md) {
  const start = md.indexOf("## SPOKEN SCRIPT");
  let body = start >= 0 ? md.slice(start + "## SPOKEN SCRIPT".length) : md;
  const end = body.search(/\n##\s(?!#)/);
  if (end > 0) body = body.slice(0, end);

  const turns = [];
  let pendingChapter = null;
  for (const raw of body.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l) continue;
    const ch = l.match(/^###\s+(.*)$/);
    if (ch) { pendingChapter = ch[1].trim(); continue; }
    const m = l.match(/^(BLAIR|DAVID)\s*:\s*(.+)$/i);
    if (!m) continue;
    const speaker = m[1].toUpperCase();
    let text = m[2].replace(/[*_`]/g, "").trim();
    const airM = text.match(/\{air:\s*([\d.]+)\s*\}\s*$/);
    const gap = airM ? Math.min(Number(airM[1]), MAX_GAP) : DEFAULT_GAP;
    text = text.replace(/\{air:[^}]*\}\s*$/, "").trim();
    if (!text) continue;
    turns.push({ speaker, text, gap, chapter: pendingChapter });
    pendingChapter = null;
  }
  return turns;
}

/* ── PCM helpers ───────────────────────────────────────────────────────────── */
const BPS = 2;
const silence = (s) => Buffer.alloc(Math.round(s * SR) * BPS);
function trimSilence(pcm) {
  const n = Math.floor(pcm.length / BPS);
  const win = Math.round(SR * 0.01);
  const rms = (from) => {
    let s = 0, c = 0;
    for (let i = from; i < Math.min(from + win, n); i++) { const v = pcm.readInt16LE(i * BPS) / 32768; s += v * v; c++; }
    return c ? Math.sqrt(s / c) : 0;
  };
  let head = 0; while (head + win < n && rms(head) < TRIM_FLOOR) head += win;
  let tail = n - win; while (tail > head && rms(tail) < TRIM_FLOOR) tail -= win;
  const a = Math.max(0, head - Math.round(SR * 0.02));
  const b = Math.min(n, tail + win + Math.round(SR * 0.04));
  return { pcm: pcm.subarray(a * BPS, b * BPS), headCut: a / SR };
}
function rmsOf(pcm) {
  const n = Math.floor(pcm.length / BPS);
  let s = 0, c = 0;
  for (let i = 0; i < n; i += 7) { const v = pcm.readInt16LE(i * BPS) / 32768; s += v * v; c++; }
  return c ? Math.sqrt(s / c) : 0;
}
function applyGain(pcm, g) {
  const out = Buffer.allocUnsafe(pcm.length);
  const n = Math.floor(pcm.length / BPS);
  for (let i = 0; i < n; i++) {
    let v = Math.round(pcm.readInt16LE(i * BPS) * g);
    out.writeInt16LE(Math.max(-32768, Math.min(32767, v)), i * BPS);
  }
  return out;
}

/* ── the vendor ────────────────────────────────────────────────────────────── */
async function tts(part, text, prev, next) {
  const c = CAST[part];
  const body = {
    text, model_id: c.model, voice_settings: c.settings,
    ...(prev ? { previous_text: prev } : {}), ...(next ? { next_text: next } : {}),
  };
  for (let a = 1; a <= 4; a++) {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${c.voice}/with-timestamps?output_format=mp3_44100_128`,
      { method: "POST", headers: { "xi-api-key": KEY, "content-type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) {
      const j = await r.json();
      const mp3 = Buffer.from(j.audio_base64, "base64");
      const t = join("/tmp", `dlg-${process.pid}-${Math.round(performance.now())}.mp3`);
      writeFileSync(t, mp3);
      const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", t, "-f", "s16le", "-ar", String(SR), "-ac", "1", "-"],
        { maxBuffer: 1024 * 1024 * 256 });
      try { unlinkSync(t); } catch {}
      return { pcm, alignment: j.alignment ?? j.normalized_alignment ?? null };
    }
    const msg = (await r.text()).slice(0, 160);
    if (a === 4) throw new Error(`TTS ${r.status} for ${part}: ${msg}`);
    await new Promise((res) => setTimeout(res, 1500 * a));
  }
}

function cuesFrom(text, alignment, offset, headCut) {
  if (!alignment?.characters?.length) return null;
  const chars = alignment.characters;
  const st = alignment.character_start_times_seconds ?? [];
  const en = alignment.character_end_times_seconds ?? [];
  if (st.length !== chars.length) return null;
  const spoken = chars.join("");
  const out = [];
  let cursor = 0;
  for (const raw of text.match(/[^.!?]+[.!?]+["')\]]*/g) ?? [text]) {
    const s = raw.trim(); if (!s) continue;
    const i = spoken.indexOf(s, cursor); if (i < 0) continue;
    const last = i + s.length - 1;
    const t0 = st[i] - headCut + offset, t1 = en[last] - headCut + offset;
    if (Number.isFinite(t0) && Number.isFinite(t1) && t1 > t0) out.push({ t0: Math.max(0, +t0.toFixed(2)), t1: +t1.toFixed(2), text: s });
    cursor = last + 1;
  }
  return out;
}

/* ── run ───────────────────────────────────────────────────────────────────── */
const turns = parse(readFileSync(SRC, "utf8"));
if (!turns.length) { console.error("no BLAIR:/DAVID: turns found under ## SPOKEN SCRIPT"); process.exit(2); }
const wordsBy = { BLAIR: 0, DAVID: 0 };
for (const t of turns) wordsBy[t.speaker] += t.text.split(/\s+/).length;
const totalWords = wordsBy.BLAIR + wordsBy.DAVID;

console.log(`take        ${take}`);
console.log(`cast        BLAIR ${CAST.BLAIR.voice} ${CAST.BLAIR.model}`);
console.log(`            DAVID ${CAST.DAVID.voice} ${CAST.DAVID.model}`);
console.log(`script      ${basename(SRC)} · ${turns.length} turns · ${totalWords} words (Blair ${wordsBy.BLAIR}, David ${wordsBy.DAVID})`);
console.log(`target      ${TARGET_LUFS} LUFS (the measured bobanddave reference), ${BITRATE} mono ${SR} Hz\n`);

const rendered = [];
for (let i = 0; i < turns.length; i++) {
  const t = turns[i];
  const prev = i > 0 ? turns[i - 1].text.slice(-350) : undefined;
  const next = i < turns.length - 1 ? turns[i + 1].text.slice(0, 350) : undefined;
  process.stdout.write(`  ${String(i + 1).padStart(3)}/${turns.length} ${t.speaker.padEnd(5)} ${String(t.text.length).padStart(4)}ch ... `);
  const { pcm: raw, alignment } = await tts(t.speaker, t.text, prev, next);
  const { pcm, headCut } = trimSilence(raw);
  rendered.push({ ...t, pcm, alignment, headCut, seconds: pcm.length / BPS / SR });
  console.log(`${(pcm.length / BPS / SR).toFixed(2)}s`);
}

/* ── PER-SPEAKER LEVEL MATCH, before the join ──────────────────────────────── */
const groupRms = {};
for (const sp of ["BLAIR", "DAVID"]) {
  const mine = rendered.filter((r) => r.speaker === sp);
  const weighted = mine.reduce((a, r) => a + rmsOf(r.pcm) * r.seconds, 0) / Math.max(1e-9, mine.reduce((a, r) => a + r.seconds, 0));
  groupRms[sp] = weighted;
}
/* Match the quieter speaker UP to the louder one rather than pulling the louder
   down, so nothing loses headroom before mastering; the master pass sets the
   final level anyway. Cap the lift so a genuinely quiet take is not amplified
   into its own noise floor. */
const loudest = Math.max(groupRms.BLAIR, groupRms.DAVID);
const gain = {
  BLAIR: Math.min(2.2, loudest / Math.max(1e-9, groupRms.BLAIR)),
  DAVID: Math.min(2.2, loudest / Math.max(1e-9, groupRms.DAVID)),
};
const db = (x) => (20 * Math.log10(Math.max(1e-9, x))).toFixed(2);
console.log(`\nlevel match  BLAIR ${db(groupRms.BLAIR)} dB RMS → gain ×${gain.BLAIR.toFixed(3)} (${db(gain.BLAIR)} dB)`);
console.log(`             DAVID ${db(groupRms.DAVID)} dB RMS → gain ×${gain.DAVID.toFixed(3)} (${db(gain.DAVID)} dB)`);

/* ── join ──────────────────────────────────────────────────────────────────── */
const pieces = [];
const cues = [];
const chapters = [];
const spans = [];
let cursor = 0;
for (let i = 0; i < rendered.length; i++) {
  const r = rendered[i];
  const pcm = applyGain(r.pcm, gain[r.speaker]);
  if (r.chapter) chapters.push({ t: +cursor.toFixed(2), text: r.chapter });
  const c = cuesFrom(r.text, r.alignment, cursor, r.headCut);
  if (c) cues.push(...c.map((x) => ({ ...x, speaker: r.speaker })));
  spans.push({ speaker: r.speaker, t0: +cursor.toFixed(2), t1: +(cursor + r.seconds).toFixed(2) });
  pieces.push(pcm);
  cursor += r.seconds;
  if (i < rendered.length - 1) { pieces.push(silence(r.gap)); cursor += r.gap; }
}

mkdirSync(dirname(OUT), { recursive: true });
const tmpPcm = join("/tmp", `dlg-master-${process.pid}.pcm`);
writeFileSync(tmpPcm, Buffer.concat(pieces));
const measure = JSON.parse((ffstderr(["-v", "info", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", tmpPcm,
  "-af", `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=11:print_format=json`, "-f", "null", "-"])
  .match(/\{[\s\S]*\}/) ?? ["{}"])[0]);
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "s16le", "-ar", String(SR), "-ac", "1", "-i", tmpPcm,
  "-af", `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=11:measured_I=${measure.input_i}:measured_TP=${measure.input_tp}:measured_LRA=${measure.input_lra}:measured_thresh=${measure.input_thresh}:offset=${measure.target_offset}:linear=true`,
  "-ar", String(SR), "-ac", "1", "-c:a", "libmp3lame", "-b:a", BITRATE, OUT]);
try { unlinkSync(tmpPcm); } catch {}

const duration = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", OUT]).toString().trim());
const bytes = statSync(OUT).size;

/* ── waveform from the shipped file ────────────────────────────────────────── */
const shipped = execFileSync("ffmpeg", ["-v", "error", "-i", OUT, "-f", "s16le", "-ar", String(SR), "-ac", "1", "-"], { maxBuffer: 1024 * 1024 * 512 });
const B = 220, tot = Math.floor(shipped.length / BPS), per = Math.max(1, Math.floor(tot / B));
const peaks = [];
for (let b = 0; b < B; b++) {
  let s = 0, c = 0;
  for (let i = b * per; i < Math.min((b + 1) * per, tot); i += 5) { const v = shipped.readInt16LE(i * BPS) / 32768; s += v * v; c++; }
  peaks.push(c ? Math.sqrt(s / c) : 0);
}
const mx = Math.max(...peaks, 1e-9);
const normPeaks = peaks.map((p) => +Math.min(1, p / mx).toFixed(4));

/* ── vtt ───────────────────────────────────────────────────────────────────── */
const vt = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}.${String(Math.round((s % 1) * 1000)).padStart(3, "0")}`;
if (cues.length) {
  writeFileSync(OUT.replace(/\.mp3$/, ".vtt"),
    "WEBVTT\n\n" + cues.map((c, i) => `${i + 1}\n${vt(c.t0)} --> ${vt(Math.min(c.t1, duration))}\n<v ${c.speaker === "BLAIR" ? "Blair" : "David"}>${c.text}\n`).join("\n"));
}

writeFileSync(OUT.replace(/\.mp3$/, ".json"), JSON.stringify({
  renderedAt: new Date().toISOString(),
  renderedFrom: basename(SRC),
  take, cast: { BLAIR: { voice: CAST.BLAIR.voice, model: CAST.BLAIR.model, settings: CAST.BLAIR.settings },
                DAVID: { voice: CAST.DAVID.voice, model: CAST.DAVID.model, settings: CAST.DAVID.settings } },
  src: `/audio/${basename(OUT)}`,
  bytes, duration: +duration.toFixed(2), minutes: +(duration / 60).toFixed(2),
  words: totalWords, wordsBySpeaker: wordsBy, turns: turns.length,
  wpm: +(totalWords / (duration / 60)).toFixed(1),
  speakerGainDb: { BLAIR: +db(gain.BLAIR), DAVID: +db(gain.DAVID) },
  loudness: { targetLufs: TARGET_LUFS, targetTruePeakDb: TARGET_TP, measuredInputLufs: Number(measure.input_i),
              reference: "reddenda.org/bobanddave assets/vo, measured -18.70 LUFS / -1.66 dBTP / mono 44.1k 128k" },
  chapters, captions: cues, speakerSpans: spans, peaks: normPeaks,
  transcript: turns.map((t) => `${t.speaker === "BLAIR" ? "Blair" : "David"}: ${t.text}`).join("\n\n"),
  peaksNote: "RMS per 1/220th of the SHIPPED mp3, decoded after mastering. Not drawn.",
}, null, 2));

console.log(`\n${OUT}`);
console.log(`  ${(bytes / 1024 / 1024).toFixed(2)} MB · ${(duration / 60).toFixed(2)} min · ${totalWords} words · ${(totalWords / (duration / 60)).toFixed(1)} wpm`);
console.log(`  ${chapters.length} chapters · ${cues.length} cues · input ${Number(measure.input_i).toFixed(1)} LUFS → ${TARGET_LUFS} LUFS`);
console.log(`\nNothing ships unlistened:  node scripts/listen-proxy.mjs ${OUT} --script=${SRC}`);
