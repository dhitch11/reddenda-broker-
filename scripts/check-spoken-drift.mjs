#!/usr/bin/env node
/**
 * SPOKEN FIGURE DRIFT GUARD.  Run before promoting:
 *   node scripts/check-spoken-drift.mjs [--url=https://broker.reddenda.com] [--script=<script.md>]
 *
 * ═══ WHY THIS EXISTS ═════════════════════════════════════════════════════════
 *
 * Every other number on this site is rendered. It is read out of a table at
 * request time, it carries that table's own date, and when the table moves the
 * page moves with it. That is the whole design and it works.
 *
 * A number spoken in an MP3 does none of that. It was true at 17:00 on the day
 * someone rendered it and it will say the same thing for as long as the file is
 * served. When the index rolls and the page starts printing a different figure,
 * the audio keeps confidently speaking the old one - and the two sit six
 * inches apart in the hero, disagreeing, both looking authoritative. Nothing
 * errors. The build is green. The deploy is green. It is the exact silent
 * failure mode the pricing drift guard was written for, in a medium where the
 * page cannot correct itself.
 *
 * So this is the same doctrine as scripts/check-pricing-drift.mjs, applied to
 * the audio, and it takes the same hard line: an unanswerable question about a
 * spoken number is reported as unanswered, never waved through.
 *
 * ═══ IT CHECKS THE COMPUTED RESULT, NOT THE SOURCE ═══════════════════════════
 *
 * The estate's rule is that a grep in a file is not evidence, because a rule can
 * ship and change nothing. So the primary assertion here is not "the fixture
 * still holds 417.65". It is:
 *
 *     THE FIGURE THE AUDIO SPEAKS IS ON THE PAGE THAT CARRIES THE PLAYER,
 *     IN THE HTML THAT WAS ACTUALLY SERVED.
 *
 * That cannot drift from the product by construction: if the page changes its
 * mind, this fails, whatever any table or fixture says. The source recompute
 * runs as well, second, because when it fails it tells you WHY the page moved.
 *
 * The script file declares what it speaks, in a SPOKEN FIGURES table. A script
 * with no such table and no numbers in it passes trivially; a script with a
 * number and no table FAILS, because an undeclared spoken figure is exactly the
 * one nobody will re-check.
 *
 * Exit 0 = every spoken figure is still on the page.
 * Exit 1 = drift. Do not promote; re-verify, edit the script, re-render.
 * Exit 2 = a check could not run. Not a pass.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split("=").slice(1).join("=") : d;
};
const BASE = flag("url", "https://broker.reddenda.com").replace(/\/$/, "");
let SCRIPT = flag("script", join(homedir(), ".broker-fleet", "LEO4-SCRIPT.md"));
if (SCRIPT.startsWith("~")) SCRIPT = SCRIPT.replace("~", homedir());

if (!existsSync(SCRIPT)) {
  console.error(`DRIFT GUARD: no script at ${SCRIPT}. Pass --script=<path>.`);
  console.error("  A spoken figure with no script to declare it cannot be checked, and an");
  console.error("  unchecked spoken figure is the whole reason this file exists.");
  process.exit(2);
}

const md = readFileSync(SCRIPT, "utf8");

/* ── what does the script actually SAY out loud ────────────────────────────── */
function spokenText(src) {
  const start = src.indexOf("## SPOKEN SCRIPT");
  let body = start >= 0 ? src.slice(start + "## SPOKEN SCRIPT".length) : src;
  const end = body.search(/\n##\s/);
  if (end > 0) body = body.slice(0, end);
  return body
    .split(/\r?\n/)
    .filter((l) => !/^\s*(#|\*\*|\||>|-{3,})/.test(l))
    .join(" ")
    .replace(/\{air:[^}]*\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
const spoken = spokenText(md);

/* ── the declaration table ─────────────────────────────────────────────────── */
/*  | onScreen | spokenAs | page | recompute |
    e.g.
    | +168% | one hundred sixty eight percent | / | hopdVsOfficePct:45378 |   */
const section = md.slice(md.indexOf("## SPOKEN FIGURES"));
const rows = [...section.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm)]
  .map((m) => ({ onScreen: m[1].trim(), spokenAs: m[2].trim(), page: m[3].trim(), recompute: m[4].trim() }))
  .filter((r) => !/^-+$/.test(r.onScreen) && r.onScreen.toLowerCase() !== "on screen");

/* ── an undeclared number in the spoken text is a failure, not a pass ──────── */
const NUMBER_WORDS = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)\b/gi;
const digitRuns = spoken.match(/\d[\d,.]*/g) ?? [];
const wordRuns = spoken.match(NUMBER_WORDS) ?? [];
const speaksNumbers = digitRuns.length > 0 || wordRuns.length > 0;

const problems = [];
const unanswered = [];

if (speaksNumbers && rows.length === 0) {
  problems.push(
    `The script speaks numbers (${[...digitRuns, ...wordRuns].slice(0, 8).join(", ")}) and declares NONE in a SPOKEN FIGURES table. ` +
    `Every spoken figure must be declared so it can be re-checked when the index rolls.`,
  );
}

/* ── PRIMARY: is the figure on the page that carries the player ────────────── */
const pages = new Map();
async function fetchPage(path) {
  const url = BASE + (path.startsWith("/") ? path : `/${path}`);
  if (pages.has(url)) return pages.get(url);
  try {
    const r = await fetch(url, { headers: { "user-agent": "reddenda-spoken-drift-guard" } });
    if (!r.ok) { unanswered.push(`${url} returned HTTP ${r.status}`); pages.set(url, null); return null; }
    const html = await r.text();
    pages.set(url, html);
    return html;
  } catch (e) {
    unanswered.push(`${url}: ${String(e).slice(0, 100)}`);
    pages.set(url, null);
    return null;
  }
}

/* ── SECONDARY: recompute from the same bake the page renders from ─────────── */
const fixturePath = join(process.cwd(), "src", "lib", "landing-fixture.json");
let fixture = null;
try { fixture = JSON.parse(readFileSync(fixturePath, "utf8")); }
catch (e) { unanswered.push(`landing-fixture.json unreadable: ${String(e).slice(0, 80)}`); }

function recompute(expr) {
  const [kind, ...rest] = expr.split(":");
  if (kind === "none") return { ok: true, value: null, how: "declared as not derived from a table" };
  if (!fixture) return { ok: false, why: "no fixture" };

  if (kind === "hopdVsOfficePct") {
    const care = fixture.care;
    if (!care || care.cpt !== rest[0]) return { ok: false, why: `fixture holds ${care?.cpt}, not ${rest[0]}` };
    const office = Number(care.pfsRows?.[0]?.nonfac_rate);
    const hopd = Number(care.pfsRows?.[0]?.fac_rate) + Number(care.opps?.payment_rate);
    if (!Number.isFinite(office) || !Number.isFinite(hopd) || office <= 0) return { ok: false, why: "office or hospital-outpatient leg missing" };
    return {
      ok: true,
      value: Math.round((hopd / office - 1) * 100),
      how: `(${hopd.toFixed(2)} hospital outpatient ÷ ${office.toFixed(2)} office − 1) × 100`,
    };
  }
  if (kind === "ledger") {
    const [cpt, field] = rest;
    const row = fixture.ledger?.rows?.find((r) => r.cpt === cpt);
    if (!row) return { ok: false, why: `no ledger row for ${cpt}` };
    const v = row[field];
    if (v == null) return { ok: false, why: `ledger row ${cpt} has no ${field}` };
    return { ok: true, value: v, how: `${fixture.ledger.metro} ${cpt} ${field}, stamped ${row.updated_at}` };
  }
  return { ok: false, why: `unknown recompute handler "${kind}"` };
}

/* ── run every declared figure ─────────────────────────────────────────────── */
console.log(`SPOKEN FIGURE DRIFT GUARD`);
console.log(`  script  ${SCRIPT}`);
console.log(`  against ${BASE}`);
console.log(`  ${rows.length} declared figure(s)\n`);

for (const row of rows) {
  const html = await fetchPage(row.page);

  /* 1. the script really does say it */
  const saysIt = spoken.toLowerCase().includes(row.spokenAs.toLowerCase());
  /* 2. the page really does print it */
  const onPage = html ? html.includes(row.onScreen) : null;
  /* 3. the source still produces it */
  const rc = recompute(row.recompute);
  const rcMatches =
    rc.ok && rc.value !== null
      ? String(row.onScreen).replace(/[^\d.-]/g, "") === String(rc.value)
      : rc.ok;

  const mark = (b) => (b === null ? "?" : b ? "✓" : "✗");
  console.log(`  ${row.onScreen}`);
  console.log(`    spoken as   ${mark(saysIt)}  "${row.spokenAs}"`);
  console.log(`    on ${row.page.padEnd(10)} ${mark(onPage)}  served HTML contains "${row.onScreen}"`);
  console.log(`    recomputed  ${mark(rc.ok ? rcMatches : null)}  ${rc.ok ? `${rc.value ?? "n/a"} · ${rc.how}` : rc.why}`);

  if (!saysIt) problems.push(`"${row.onScreen}": the script does not contain the spoken form "${row.spokenAs}". The declaration and the script have diverged.`);
  if (onPage === false) problems.push(`"${row.onScreen}": the audio speaks it and ${BASE}${row.page} DOES NOT PRINT IT. The page has moved and the recording has not. Re-verify, edit the script, re-render.`);
  if (onPage === null) unanswered.push(`could not read ${BASE}${row.page} to check "${row.onScreen}"`);
  if (rc.ok && !rcMatches) problems.push(`"${row.onScreen}": the source now computes ${rc.value} (${rc.how}). This is WHY the page moved.`);
  if (!rc.ok) unanswered.push(`could not recompute "${row.onScreen}": ${rc.why}`);
  console.log();
}

/* ── the sidecar must agree with the script it claims to be ────────────────── */
const audioDir = join(process.cwd(), "public", "audio");
if (existsSync(audioDir)) {
  for (const f of readdirSync(audioDir).filter((f) => f.endsWith(".json"))) {
    let meta;
    try { meta = JSON.parse(readFileSync(join(audioDir, f), "utf8")); } catch { continue; }
    const t = String(meta.transcript ?? "");
    /* The sidecar transcript is a PUBLIC document. It is served at 200 to anyone
       and it is indexable. On 2026-08-26 two of them named a real person, one of
       them three times in its first sentence. This check is cheap and it is why. */
    const named = t.match(/\b(?:David|Thomas)\b/g);
    if (named) problems.push(`public/audio/${f} names a person in its public transcript (${named.length} hit(s)). Sidecars are served at 200; scrub or delete it.`);
    for (const row of rows) {
      if (!t) break;
      if (!t.toLowerCase().includes(row.spokenAs.toLowerCase())) {
        problems.push(`public/audio/${f} is the shipped sidecar and its transcript does not contain "${row.spokenAs}". The file on disk is not this script.`);
      }
    }
  }
}

if (problems.length) {
  console.error(`✗ DRIFT GUARD FAIL: ${problems.length} problem(s). DO NOT PROMOTE.\n`);
  for (const p of problems) console.error(`  · ${p}`);
  console.error(`\nA spoken number cannot correct itself. Fix the script and re-render, or fix the page.`);
  process.exit(1);
}
if (unanswered.length) {
  console.error(`? DRIFT GUARD INCONCLUSIVE: ${unanswered.length} check could not run. That is not a pass.\n`);
  for (const u of unanswered) console.error(`  · ${u}`);
  process.exit(2);
}
console.log(`✓ DRIFT GUARD PASS. Every spoken figure is still printed by the page that carries the player.`);
