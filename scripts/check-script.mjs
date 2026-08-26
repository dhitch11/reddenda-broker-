#!/usr/bin/env node
/**
 * THE SCRIPT GATE.  @BROKER-AUDIO, 2026-08-26.
 *   node scripts/check-script.mjs <script.md> [--dialogue] [--maxanswer=70]
 *
 * Runs on the WORDS, before a single character reaches the vendor. The listen
 * proxy runs on the AUDIO, after. Both exist because they catch different
 * things and neither can see the other's failures.
 *
 * ═══ THE DECISIVE METRIC IS SENTENCE LENGTH, AND IT WAS MEASURED ═════════════
 *
 * The 2026-08-26 copy audit settled an argument this estate had been having
 * from intuition. Vocabulary is NOT the problem anywhere on this site; syllables
 * per word are modest on every page. What separates a page that reads easily
 * from one that does not is the SHARE OF WORDS SITTING INSIDE SENTENCES OF 20
 * WORDS OR MORE:
 *
 *     reddenda.health benchmark   8.4%      homepage      10.5%   (fine)
 *     /general-agencies          40.8%      /brokers      42.7%
 *     /methodology               50.9%      /employers    56.6%   (worst)
 *
 * That audit also killed the "cut the word count" instinct: the homepage is a
 * full grade EASIER and 103 words SHORTER than the benchmark it was being told
 * to cut toward. The fix was never fewer words. It was breaking every 30-to-40
 * word sentence into two, and keeping the rigour.
 *
 * ★ SPOKEN COPY IS THE STRICTEST CASE OF THAT RULE, because a listener cannot
 * re-read a sentence and a founder cannot repeat one he could not follow. So
 * the ceiling here is TIGHTER than the benchmark, not equal to it.
 *
 * ═══ AND ONE METRIC THAT ONLY MATTERS FOR SPEECH ═════════════════════════════
 *
 * --dialogue adds the repeatability check on the answering voice. This piece
 * exists so a founder can perform it on a conference floor, once, from memory,
 * holding a coffee. An answer he cannot reproduce is worth nothing to him no
 * matter how well it reads, so any single DAVID turn over the cap is reported
 * with its length. That is a measurement of usefulness, not of style.
 *
 * Exit 0 = ships. Exit 1 = fix the words first.
 */
import { readFileSync, existsSync } from "node:fs";
import { basename } from "node:path";

const args = process.argv.slice(2);
const SRC = args.find((a) => !a.startsWith("--"));
const DIALOGUE = args.includes("--dialogue");
/* ── THE REPEATABILITY CAP IS TWO DIFFERENT RULES AND ONE NUMBER CANNOT BE BOTH.
   A HALLWAY answer has to come back word for word while he is holding a coffee
   and someone is walking past: that is a ~60 word ceiling, and past it he will
   paraphrase and lose the sourced specifics that are the whole point.
   A STAGE CHALLENGE answer is delivered with the packet in front of him to a
   room that asked a technical question, and it has to carry a denominator, a
   reconciliation or a refusal. Capping those at 60 does not make him crisper,
   it makes him wrong. Default 100 for a full piece; pass --maxanswer=60 when
   gating the hallway set on its own. */
const MAX_ANSWER = Number((args.find((a) => a.startsWith("--maxanswer=")) ?? "--maxanswer=100").split("=")[1]);
if (!SRC || !existsSync(SRC)) { console.error("usage: check-script.mjs <script.md> [--dialogue]"); process.exit(2); }

const LONG_SENTENCE = 20;
const LONG_SHARE_CEIL = 12;    // percent of words inside 20+ word sentences. Benchmark 8.4, homepage 10.5.
const HARD_SENTENCE = 30;      // no spoken sentence may exceed this, at all
const FK_CEIL = 6;

const md = readFileSync(SRC, "utf8");
const start = md.indexOf("## SPOKEN SCRIPT");
let body = start >= 0 ? md.slice(start + "## SPOKEN SCRIPT".length) : md;
const end = body.search(/\n##\s(?!#)/);
if (end > 0) body = body.slice(0, end);

const lines = body.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  .filter((l) => !/^###?\s/.test(l))
  .map((l) => l.replace(/\{air:[^}]*\}/g, "").replace(/[*_`]/g, "").trim())
  .filter(Boolean);

const turns = [];
for (const l of lines) {
  const m = l.match(/^(BLAIR|DAVID)\s*:\s*(.+)$/i);
  if (m) turns.push({ speaker: m[1].toUpperCase(), text: m[2].trim() });
  else if (!DIALOGUE) turns.push({ speaker: "NARRATOR", text: l });
}
const spoken = turns.map((t) => t.text).join(" ");
if (!spoken) { console.error("no spoken text found"); process.exit(2); }

/* ── measurement ───────────────────────────────────────────────────────────── */
const sentences = spoken.match(/[^.!?]+[.!?]+["')\]]*/g) ?? [spoken];
const sentWords = sentences.map((s) => s.trim().split(/\s+/).filter(Boolean));
const words = spoken.split(/\s+/).filter(Boolean);
const syl = (w) => {
  const c = w.toLowerCase().replace(/[^a-z]/g, "");
  if (!c) return 0;
  let n = 0, prev = false;
  for (const ch of c) { const v = "aeiouy".includes(ch); if (v && !prev) n++; prev = v; }
  if (c.endsWith("e") && n > 1) n--;
  return Math.max(1, n);
};
const syllables = words.reduce((a, w) => a + syl(w), 0);
const fk = 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;

const longSents = sentWords.filter((s) => s.length >= LONG_SENTENCE);
const wordsInLong = longSents.reduce((a, s) => a + s.length, 0);
const longShare = (wordsInLong / words.length) * 100;
const overHard = sentWords.filter((s) => s.length > HARD_SENTENCE);

const problems = [];
const notes = [];

if (longShare > LONG_SHARE_CEIL) {
  problems.push(`SENTENCE LENGTH: ${longShare.toFixed(1)}% of words sit inside sentences of ${LONG_SENTENCE}+ words, ceiling ${LONG_SHARE_CEIL}%. This is the decisive metric from the 08-26 copy audit and it is the one that separates /employers (56.6%) from the benchmark (8.4%). Break the long ones in two; do not cut words.`);
}
for (const s of overHard) {
  problems.push(`SENTENCE OF ${s.length} WORDS, over the hard ceiling of ${HARD_SENTENCE} for spoken copy: "${s.join(" ").slice(0, 110)}..."`);
}
if (fk > FK_CEIL) problems.push(`READING GRADE ${fk.toFixed(2)}, ceiling ${FK_CEIL}.`);

/* ── the bans, on the words this time ──────────────────────────────────────── */
const BANS = [
  ["payment language", /\breimburs\w*|allowed amount|what they pay|what the plan pays\b/gi],
  ["savings claim", /\bsav(e|es|ing|ings)\b|\brecover\w*|\brecoup\w*|\bguarantee\w*/gi],
  ["legal outcome", /\bcomplian\w*|\bfiduciar\w*|\bdefensib\w*|audit[- ]proof/gi],
  ["percentile jargon", /\bpercentile\b|\bp25\b|\bp50\b|\bp75\b|\bp90\b/gi],
  ["unglossed acronym", /\b(HCPCS|QPA|IDR|CBSA|MRF|TiC|HOPD|ASC)\b/g],
  ["em dash", /—/g],
  ["exclamation", /!/g],
  ["AI self-reference", /\bI'?m an AI\b|\bartificial intelligence\b/gi],
  /* LAW 5, the geography law. Every example is Sacramento, Roseville or the
     greater Bay Area. Other markets stay selectable by a user for their own
     book; they never appear as OUR example, and an audio example is the most
     permanent example there is. */
  ["LAW 5 geography", /\b(Houston|New York|Atlanta|St\.? ?Louis|Chicago|Phoenix|Denver|Miami|Seattle|Boston)\b/gi],
];
for (const [name, re] of BANS) {
  const hits = spoken.match(re);
  if (hits) problems.push(`${name.toUpperCase()}: ${[...new Set(hits)].slice(0, 6).join(", ")}`);
}

/* CPT is allowed ONLY where a plain name precedes it, per LAW 3. */
const bareCpt = [...spoken.matchAll(/\bCPT\b/g)];
if (bareCpt.length) notes.push(`"CPT" spoken ${bareCpt.length}x. LAW 3 wants the plain name first and the code last; check each by ear.`);

/* ── dialogue-only ─────────────────────────────────────────────────────────── */
if (DIALOGUE) {
  const david = turns.filter((t) => t.speaker === "DAVID");
  const blair = turns.filter((t) => t.speaker === "BLAIR");
  const dWords = david.reduce((a, t) => a + t.text.split(/\s+/).length, 0);
  const bWords = blair.reduce((a, t) => a + t.text.split(/\s+/).length, 0);
  const longAnswers = david.map((t) => ({ n: t.text.split(/\s+/).length, t: t.text })).filter((x) => x.n > MAX_ANSWER);
  for (const a of longAnswers.slice(0, 6)) {
    problems.push(`ANSWER OF ${a.n} WORDS, over the ${MAX_ANSWER}-word repeatability cap. He has to say this at a booth from memory: "${a.t.slice(0, 90)}..."`);
  }
  if (longAnswers.length > 6) problems.push(`...and ${longAnswers.length - 6} more answers over the cap.`);
  /* An interviewer who talks as much as the founder is a co-host, not a question. */
  const share = (bWords / (bWords + dWords)) * 100;
  if (share > 32) problems.push(`BLAIR SPEAKS ${share.toFixed(0)}% of the words. She asks; she does not co-present. Cut her lines before his.`);
  console.log(`  speakers         Blair ${bWords} words (${share.toFixed(0)}%) · David ${dWords} words`);
  console.log(`  turns            ${turns.length} · longest answer ${Math.max(...david.map((t) => t.text.split(/\s+/).length))} words`);
}

/* ── report ────────────────────────────────────────────────────────────────── */
console.log(`\nSCRIPT GATE · ${basename(SRC)}`);
console.log(`  words            ${words.length}`);
console.log(`  sentences        ${sentences.length} · mean ${(words.length / sentences.length).toFixed(1)} words · longest ${Math.max(...sentWords.map((s) => s.length))}`);
console.log(`  20+ word share   ${longShare.toFixed(1)}%  (benchmark 8.4 · homepage 10.5 · ceiling ${LONG_SHARE_CEIL})`);
console.log(`  reading grade    ${fk.toFixed(2)}  (ceiling ${FK_CEIL})`);
console.log(`  est. runtime     ${(words.length / 140).toFixed(1)} min at 140 wpm measured`);
for (const n of notes) console.log(`  note: ${n}`);

if (problems.length) {
  console.error(`\n✗ SCRIPT REFUSED — ${problems.length} problem(s). Fix the words before spending a character at the vendor.\n`);
  for (const p of problems) console.error(`  · ${p}`);
  process.exit(1);
}
console.log(`\n✓ Script gate passes. Render it.\n`);
