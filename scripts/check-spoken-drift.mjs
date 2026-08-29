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
/* THE DEFAULT IS THE SCRIPT OF THE TAKE THAT ACTUALLY SHIPS, AND IT LIVES IN THIS REPO.
   It used to default to ~/.broker-fleet/LEO4-SCRIPT.md. LEO IV was retired on 2026-08-27
   when pitch-v6 shipped, and nobody moved the default, so from 08-27 to 08-29 this guard
   ran against a script for a take that is not served and reported a failure that meant
   nothing. A gate that always fails is a gate everyone learns to skip, which is worse than
   no gate: it was red for two days while a real drift went through underneath it.
   It also pointed OUTSIDE the repo, at a directory a fleet can rotate. The shipped script
   is a versioned artifact and belongs beside the audio it produced. Keep them together:
   public/audio/<basename>.json carries `renderedFrom`, and that is the file named here. */
const SHIPPED_SCRIPT = join(process.cwd(), "hero-pitch-final.md");
let SCRIPT = flag("script", SHIPPED_SCRIPT);
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
  if (kind === "register") return { ok: "async", table: "broker_employer_register", filter: rest };
  if (kind === "manifest") return { ok: "async", manifest: rest[0] };
  if (kind === "untraced") {
    return { ok: false, why: `NOT YET TRACED TO A SOURCE. The script speaks it as a fact about ${rest.join(":") || "our data"} and nobody has named the table it comes from. An undeclared source is an unanswered question, and this guard reports unanswered as unanswered.` };
  }
  return { ok: false, why: `unknown recompute handler "${kind}"` };
}

/* ── the table is an authority too, and for a SCALE figure it is the better one ──
   The primary law of this guard is that a spoken figure must be printed by the page
   that carries the player, so the page can correct the recording when reality moves.
   That law is right for a figure the page prints: a price, a percentage on a card.
   It cannot reach a figure that describes the SIZE of the corpus behind the product.
   "Eight thousand four hundred sixty seven employers" is not a card, it is the row
   count of the register this site serves, and no page prints it.
   So a row may declare `-` as its page ONLY when it declares a real database
   recompute. That is strictly STRONGER than the page check, not weaker: the page is
   itself derived from these tables, so checking the table skips a hop. A row with
   page `-` AND recompute `none`/`untraced` is not exempt from anything; it fails.  */
const SB_URL = (readEnv("NEXT_PUBLIC_SUPABASE_URL") || "").replace(/\/$/, "");
const SB_KEY = readEnv("SUPABASE_SERVICE_ROLE_KEY");

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    const m = raw.match(new RegExp(`^${name}=(.*)$`, "m"));
    return m ? m[1].trim() : null;
  } catch { return null; }
}

async function dbCount(table, filter) {
  if (!SB_URL || !SB_KEY) return { ok: false, why: "no Supabase credentials in env or .env.local; the table check cannot run" };
  let q = `${SB_URL}/rest/v1/${table}?select=*`;
  if (filter && filter.length === 2 && filter[0] !== "*") q += `&${filter[0]}=eq.${encodeURIComponent(filter[1])}`;
  try {
    const r = await fetch(q, { headers: { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}`, prefer: "count=exact", range: "0-0" } });
    const cr = r.headers.get("content-range");
    const n = cr ? Number(cr.split("/")[1]) : NaN;
    if (!Number.isFinite(n)) return { ok: false, why: `${table} returned no exact count (HTTP ${r.status})` };
    const how = filter && filter[0] !== "*" ? `count of ${table} where ${filter[0]} = ${filter[1]}` : `row count of ${table}`;
    return { ok: true, value: n, how };
  } catch (e) { return { ok: false, why: `${table}: ${String(e).slice(0, 90)}` }; }
}

async function manifestCount(metric) {
  if (!SB_URL || !SB_KEY) return { ok: false, why: "no Supabase credentials; the manifest check cannot run" };
  try {
    const r = await fetch(`${SB_URL}/rest/v1/data_manifest?select=row_count,built_at&metric=eq.${encodeURIComponent(metric)}&order=built_at.desc&limit=1`, {
      headers: { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}` },
    });
    const rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) return { ok: false, why: `data_manifest has no metric "${metric}"` };
    return { ok: true, value: rows[0].row_count, how: `data_manifest.${metric}.row_count, built ${String(rows[0].built_at).slice(0, 10)}` };
  } catch (e) { return { ok: false, why: `data_manifest: ${String(e).slice(0, 90)}` }; }
}

/* ── run every declared figure ─────────────────────────────────────────────── */
console.log(`SPOKEN FIGURE DRIFT GUARD`);
console.log(`  script  ${SCRIPT}`);
console.log(`  against ${BASE}`);
console.log(`  ${rows.length} declared figure(s)\n`);

for (const row of rows) {
  const html = row.page === "-" ? null : await fetchPage(row.page);

  /* 1. the script really does say it */
  const saysIt = spoken.toLowerCase().includes(row.spokenAs.toLowerCase());
  /* 2. the page really does print it */
  const pageExempt = row.page === "-";
  const dbBacked = /^(register|manifest):/.test(row.recompute);
  const onPage = pageExempt ? null : html ? html.includes(row.onScreen) : null;
  /* 3. the source still produces it */
  let rc = recompute(row.recompute);
  if (rc.ok === "async") rc = rc.manifest ? await manifestCount(rc.manifest) : await dbCount(rc.table, rc.filter);
  const rcMatches =
    rc.ok && rc.value !== null
      ? String(row.onScreen).replace(/[^\d.-]/g, "") === String(rc.value)
      : rc.ok;

  const mark = (b) => (b === null ? "?" : b ? "✓" : "✗");
  console.log(`  ${row.onScreen}`);
  console.log(`    spoken as   ${mark(saysIt)}  "${row.spokenAs}"`);
  console.log(
    pageExempt
      ? `    on page     -  declared as a scale figure no page prints; the table is its authority`
      : `    on ${row.page.padEnd(10)} ${mark(onPage)}  served HTML contains "${row.onScreen}"`,
  );
  console.log(`    recomputed  ${mark(rc.ok ? rcMatches : null)}  ${rc.ok ? `${rc.value ?? "n/a"} · ${rc.how}` : rc.why}`);

  if (!saysIt) problems.push(`"${row.onScreen}": the script does not contain the spoken form "${row.spokenAs}". The declaration and the script have diverged.`);
  if (onPage === false) problems.push(`"${row.onScreen}": the audio speaks it and ${BASE}${row.page} DOES NOT PRINT IT. The page has moved and the recording has not. Re-verify, edit the script, re-render.`);
  if (onPage === null && !pageExempt) unanswered.push(`could not read ${BASE}${row.page} to check "${row.onScreen}"`);
  if (pageExempt && !dbBacked) problems.push(`"${row.onScreen}": declared page "-" (no page prints it) but its recompute is "${row.recompute}". The page exemption exists ONLY for a figure whose authority is a real table. With neither a page nor a table this figure has no authority at all, which is the exact thing this guard refuses to wave through.`);
  if (rc.ok && !rcMatches) problems.push(`"${row.onScreen}": the source now computes ${rc.value} (${rc.how}). This is WHY the page moved.`);
  if (!rc.ok) unanswered.push(`could not recompute "${row.onScreen}": ${rc.why}`);
  console.log();
}

/* ── the sidecar must agree with the script it claims to be ────────────────── */
const audioDir = join(process.cwd(), "public", "audio");
if (existsSync(audioDir)) {
  const SHIPPED_SIDECAR = (() => {
    try {
      const tsx = readFileSync(join(process.cwd(), "src", "components", "landing", "hero-audio.tsx"), "utf8");
      const m = tsx.match(/AUDIO_BASENAME\s*=\s*"([^"]+)"/);
      return m ? `${m[1]}.json` : null;
    } catch { return null; }
  })();
  for (const f of readdirSync(audioDir).filter((f) => f.endsWith(".json"))) {
    let meta;
    try { meta = JSON.parse(readFileSync(join(audioDir, f), "utf8")); } catch { continue; }
    const t = String(meta.transcript ?? "");
    /* The sidecar transcript is a PUBLIC document. It is served at 200 to anyone
       and it is indexable. On 2026-08-26 two of them named a real person, one of
       them three times in its first sentence. This check is cheap and it is why. */
    const named = t.match(/\b(?:David|Thomas)\b/g);
    if (named) problems.push(`public/audio/${f} names a person in its public transcript (${named.length} hit(s)). Sidecars are served at 200; scrub or delete it.`);
    /* Only the SHIPPED take has to match the shipped script. Any other sidecar in
       here is a take nobody plays, and the correct verdict on one of those is not
       "it disagrees with the script" but "why is it still on a public host at all".
       Seven of them were, on 2026-08-27 through 08-29. See hero-audio.tsx. */
    if (SHIPPED_SIDECAR && f !== SHIPPED_SIDECAR) {
      problems.push(`public/audio/${f} is not the shipped take (${SHIPPED_SIDECAR}) and is served at 200 to anyone. A take on a public host is a take a listener can hear. Delete the .mp3, the .json and the .vtt together.`);
      continue;
    }
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
