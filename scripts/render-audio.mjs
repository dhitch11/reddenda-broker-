#!/usr/bin/env node
/**
 * SEAMLESS NARRATION RENDERER.
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT render-leo.mjs.
 * The first Leo render was choppy and clipped every section's tail. Three causes,
 * all in the pipeline rather than the voice:
 *
 *   1. ONE MP3 PER BEAT, ~30 OF THEM. Every MP3 carries encoder delay at the head
 *      and padding at the tail. Concatenating N of them stacks N truncation
 *      artifacts, which is exactly the "cut off at the end of each section" sound.
 *   2. DELIBERATE SILENCE INSERTED BETWEEN BEATS. A gap track was generated and
 *      spliced in, so the piece stopped and restarted ~30 times by construction.
 *   3. TOO MANY BOUNDARIES. Each boundary is a chance for prosody to reset.
 *
 * THE FIX, IN THE SAME ORDER:
 *   1. Render PCM, not MP3. Raw samples have no encoder delay and no padding, so
 *      concatenation is sample-exact and lossless. Encode to MP3 ONCE, at the end.
 *   2. No synthetic silence. The model already breathes at sentence ends; adding
 *      digital silence on top is what made it sound assembled rather than spoken.
 *   3. Chunk at ~3500 characters on SENTENCE boundaries instead of on blank lines,
 *      so a fifteen-minute script is four or five chunks rather than thirty. Each
 *      chunk still passes previous_text and next_text so the model carries prosody
 *      across the seam it cannot hear.
 *
 * Usage: node scripts/render-audio.mjs <script.md> <public/audio/name.mp3>
 * Speaks only the `## SPOKEN SCRIPT` section. Key by name from ~/.reddenda/elevenlabs.env.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";

const SRC = process.argv[2];
const OUT = process.argv[3];
if (!SRC || !OUT) { console.error("usage: render-audio.mjs <script.md> <out.mp3>"); process.exit(2); }

const KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
if (!KEY) { console.error("no ELEVENLABS_API_KEY in env; source ~/.reddenda/elevenlabs.env"); process.exit(2); }
const VOICE = process.env.DAVID_THOMAS_VOICE_ID || "z0BOWBeixS6REJudB8Qi";
const MODEL = "eleven_multilingual_v2";   // the model this cloned voice was tuned on
const MAX = 3500;                          // chars per request, sentence-aligned

/* Take only what is meant to be spoken. Headings, notes and claim-checks are for
   humans reading the file and must never reach the voice. */
function spoken(md) {
  const start = md.indexOf("## SPOKEN SCRIPT");
  let body = start >= 0 ? md.slice(start + "## SPOKEN SCRIPT".length) : md;
  const end = body.search(/\n##\s/);
  if (end > 0) body = body.slice(0, end);
  return body
    .split(/\r?\n/)
    .filter((l) => !/^\s*(#|\*\*|\||>|-{3,})/.test(l))
    .map((l) => l
      .replace(/\[\[[^\]]*\]\]/g, "")
      .replace(/\((?:beat|pause|music|sfx|cut to)[^)]*\)/gi, "")
      .replace(/[*_`]/g, "")
      .trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Split on sentence ends, never mid-sentence. A seam inside a clause is audible;
   a seam between sentences is not, because the model was already going to breathe. */
function chunk(text) {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*/g) || [text];
  const out = []; let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > MAX && cur) { out.push(cur.trim()); cur = s; }
    else cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function tts(text, prev, next) {
  const body = {
    text, model_id: MODEL,
    voice_settings: { stability: 0.42, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true },
  };
  if (prev) body.previous_text = prev;
  if (next) body.next_text = next;
  for (let a = 1; a <= 4; a++) {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=pcm_44100`,
      { method: "POST", headers: { "xi-api-key": KEY, "content-type": "application/json" }, body: JSON.stringify(body) },
    );
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    const msg = await r.text();
    if (a === 4) throw new Error(`TTS ${r.status}: ${msg.slice(0, 200)}`);
    await new Promise((res) => setTimeout(res, 1500 * a));
  }
}

const md = readFileSync(SRC, "utf8");
const text = spoken(md);
const parts = chunk(text);
const words = text.split(/\s+/).length;
console.log(`${words} words · ${parts.length} chunks · ~${(words / 150).toFixed(1)} min at 150wpm`);

const pcm = [];
for (let i = 0; i < parts.length; i++) {
  const prev = i > 0 ? parts[i - 1].slice(-400) : undefined;
  const next = i < parts.length - 1 ? parts[i + 1].slice(0, 400) : undefined;
  process.stdout.write(`  chunk ${i + 1}/${parts.length} (${parts[i].length} chars) ... `);
  const buf = await tts(parts[i], prev, next);
  pcm.push(buf);
  console.log(`${(buf.length / 1024 / 1024).toFixed(1)} MB pcm`);
}

/* Sample-exact join, then a single encode. This is the whole reason it is smooth. */
const raw = Buffer.concat(pcm);
mkdirSync(dirname(OUT), { recursive: true });
const tmp = join("/tmp", `narration-${Date.now()}.pcm`);
writeFileSync(tmp, raw);
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "s16le", "-ar", "44100", "-ac", "1", "-i", tmp,
  "-c:a", "libmp3lame", "-b:a", "160k", OUT]);

const secs = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
  "-of", "default=nw=1:nk=1", OUT]).toString().trim());
const bytes = statSync(OUT).size;
writeFileSync(OUT.replace(/\.mp3$/, ".json"), JSON.stringify({
  renderedAt: new Date().toISOString(), bytes, seconds: Math.round(secs),
  words, chunks: parts.length, voice: VOICE, model: MODEL,
}, null, 2));
console.log(`\n${OUT}  ${(bytes / 1024 / 1024).toFixed(2)} MB  ${Math.floor(secs / 60)}m${String(Math.round(secs % 60)).padStart(2, "0")}s`);
if (secs < 60) { console.error("REFUSING: under a minute, something truncated"); process.exit(1); }
