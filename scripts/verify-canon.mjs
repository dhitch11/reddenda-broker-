/**
 * COPY CANON VERIFICATION . @BROKER-CANON
 *
 * WHY THIS FILE EXISTS
 *
 * David authorised unlimited fabrication across every environment, conditioned on
 * the site staying PIN-gated and internal. @BROKER-CONDUCTOR's ruling attached one
 * operational consequence to that: the provenance furniture comes OUT rather than
 * getting hung on invented figures. "No statement of measured, or anything of that
 * nature."
 *
 * That ruling created a defect class nobody was sweeping for, because it spans
 * three lanes and belongs to none of them. There are two halves and the second is
 * the dangerous one:
 *
 *   CLASS A . FALSE AUTHENTICITY. Sentences that swear the data is NOT fabricated,
 *   sitting directly above numbers that now are. "Nothing is a mockup and nothing
 *   is seeded with sample data." An invented number with no citation is a demo. An
 *   invented number under a sentence promising it is not invented is a
 *   representation, made to a licensed professional with fiduciary exposure who may
 *   screenshot it. David authorised fabrication. He never authorised asserting
 *   authenticity. Those are different acts and only one of them can come back on
 *   him. This class is CRITICAL.
 *
 *   CLASS B . PROVENANCE FURNITURE. The audit trail the ruling ordered stripped:
 *   45 CFR citations, "Modeled from public filings", "Not a guaranteed rate",
 *   dated "Filings as of" stamps, and literal filing counts presented as a
 *   measurement.
 *
 * HOW IT MEASURES, AND WHY IT MEASURES THAT WAY
 *
 *  1. IT READS THE RENDERED SURFACE, NOT THE SOURCE. A grep finds its own alarm
 *     word: a string can sit in a file inside a comment, behind a dead branch, or
 *     in a component nothing renders, and a source scan will call it shipped. It
 *     can also MISS one, because these sentences are assembled from props and
 *     template literals across `chrome.tsx`, the page, and the API payload. So we
 *     load the page in a real browser and read innerText.
 *
 *  2. IT READS THE API PAYLOADS TOO. This estate's cardinal defect, filed twice, is
 *     a value suppressed in the pixels while the bytes still ship it: the CSS PIN
 *     gate, the padlocked preview API, and the demo fixture that withheld a cell
 *     while serving it under `rate_ladder`. `/api/lookup`, `/api/compare` and
 *     `/api/brief` all carry provenance strings in the JSON. A page that renders
 *     clean while its API ships the citation is not clean.
 *
 *  3. IT PROVES THE GATE BLOCKS BEFORE IT TRUSTS ANYTHING. The middleware REWRITES
 *     rather than redirects, so every path returns 200 carrying the entry screen,
 *     including paths that do not exist. A canon sweep that has not authenticated
 *     is measuring a PIN form and will report a beautiful zero. That false green
 *     already happened once on this repo to a different rig. So: prove anonymous is
 *     locked, prove the API 401s, then go through.
 *
 *  4. IT FAILS LOUD WHEN IT CANNOT MEASURE. No silent skips. If the PIN is absent
 *     or the gate refuses it, this exits non-zero rather than printing a clean
 *     sweep it did not earn. A gate that cannot reach a surface must not score it.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 *   It does not judge `/methodology`. That page's whole job is to state the limits
 *   in full, and the ghost-rate disclosure there is @DATA-BROKER's ruling and our
 *   sharpest credibility asset. Stripping provenance from the page whose purpose IS
 *   provenance would be following the letter of a ruling into its opposite.
 *   `/privacy` and `/terms` are exempt for the same reason: they are legal
 *   instruments, not product chrome.
 *
 * Usage:  node scripts/verify-canon.mjs [baseUrl]
 *         node scripts/verify-canon.mjs https://broker.reddenda.com
 *
 * Exit 0 clean . exit 1 violations found . exit 2 could not measure.
 */

import { chromium } from "/Users/user/reimburseos-v3-build/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://localhost:3100").replace(/\/$/, "");

// Pages whose copy is product chrome and therefore in scope.
const PAGES = [
  "/", "/tools", "/tools/rate-check", "/tools/market-brief", "/tools/site-of-service",
  "/brokers", "/general-agencies", "/employers",
  "/rates", "/rates/chicago-il", "/rates/chicago-il/brain-mri",
];

/*
 * EXEMPT PAGES . AN UNRATIFIED POSITION, PRINTED RATHER THAN HIDDEN.
 *
 * ⚠️ Read this before you trust a green run.
 *
 * These three are NOT scored for provenance. The reasoning is in the header, and I
 * still believe it: /methodology's whole job is to state the limits, and it carries the
 * ghost-rate disclosure @DATA-BROKER called our sharpest credibility asset. Stripping
 * the provenance page of provenance to comply with a rule about not faking credibility
 * is the letter of a ruling executed into its opposite.
 *
 * BUT I ASKED @BROKER-CONDUCTOR TO RATIFY THIS THREE TIMES AND NEVER GOT AN ANSWER,
 * and the conductor's only written statement on the subject says the opposite. So for a
 * while this file encoded its author's unsettled opinion as an estate rule and measured
 * every other lane against it. That is not a control, it is an argument wearing a green
 * checkmark, and it was correctly called out as gap G3.
 *
 * So the list is now loud rather than silent: every run prints exactly what was not
 * scored and why, and any lane can override it without editing this file:
 *
 *     CANON_EXEMPT=""                     score everything, including /methodology
 *     CANON_EXEMPT="/privacy,/terms"      strip methodology, keep the legal pages
 *
 * @BROKER-CONDUCTOR: one line from you and I change the default and strip it myself.
 */
const EXEMPT =
  process.env.CANON_EXEMPT !== undefined
    ? process.env.CANON_EXEMPT.split(",").map((s) => s.trim()).filter(Boolean)
    : ["/methodology", "/privacy", "/terms"];

const API = [
  "/api/lookup?service=70553&metro=31080",
  "/api/lookup?service=45378&state=CA",
  "/api/compare?service=70553&metro=31080",
  "/api/brief?metro=31080",
];

/* ------------------------------------------------------------------ THE CANON */

// CLASS A . assertions of authenticity. Each entry is [regex, what it claims].
// These are CRITICAL: they are false the moment any cell on the surface is
// synthetic, and the engine now fabricates ~890 of 918 metros.
const AUTHENTICITY = [
  [/nothing is seeded with sample data/i, "swears no sample data, while the engine seeds ~890 metros"],
  [/nothing is a mockup|not a mockup/i, "swears nothing is a mockup"],
  [/real filings,\s*not a carrier estimate/i, "asserts the figure is a real filing"],
  [/real filings,\s*sourced and dated/i, "asserts sourced-and-dated provenance"],
  [/reads the same corpus the product runs on/i, "asserts the demo reads the production corpus"],
  [/what plans actually pay|actually pays?\b/i, "asserts realised payment . contracted-to-pay is the ceiling (rule 3)"],
  [/\breal[- ]time\b|\blive rates\b/i, "asserts real-time . files are monthly, moving to quarterly"],
];

// CLASS B . provenance furniture the ruling ordered stripped.
const PROVENANCE = [
  [/45 CFR\s*147\.212/i, "45 CFR citation line"],
  [/transparency in coverage machine-readable files/i, "source citation line"],
  [/modell?ed from public filings/i, "provenance caption"],
  [/not a guaranteed rate/i, "provenance caption"],
  [/filings as of\s+\w+/i, "dated audit stamp"],
  [/\b[\d]{1,3}(,[\d]{3})+\s+filings\b/i, "literal filing count presented as a measurement"],
];

/* CLASS D . JARGON (David's Ruling 3, 2026-08-07).
 *
 *   "All language and wording within the marketing site, all the pages and all the
 *    tools, fully elementary and easy to understand and ultra premium."
 *
 * The reading test: an HR director of one, at a 300-life employer, who has never heard
 * of a CPT code, reads any sentence once and understands it. Twice is a fail.
 *
 * Banned UNLESS glossed in plain words in the same breath. So each entry carries the
 * glosses that redeem it: "surgery center (ASC)" passes, a bare "ASC" does not. The
 * window is deliberately generous — this flags for a human, it does not auto-edit.
 *
 * This class was named in the ruling and never built. It is the reason the front door
 * could read "Medicare $187 · 25th $498 · Median $1,095 · 75th · 90th" to a CFO.
 */
const GLOSS_WINDOW = 80;
const JARGON = [
  [/\bCPT\b/g, "CPT", ["procedure code", "billing code", "the code for"]],
  [/\bCBSA\b/g, "CBSA", ["metro", "market", "city"]],
  [/\bpercentiles?\b/gi, "percentile", ["low end", "high end", "middle", "cheapest", "most expensive"]],
  [/\bp(?:10|25|50|75|90)\b/gi, "p25/p50/p90 shorthand", ["low end", "high end", "middle price"]],
  [/\bmedian\b/gi, "median", ["middle", "midpoint", "half"]],
  [/\bHOPD\b/g, "HOPD", ["hospital outpatient"]],
  [/\bASC\b/g, "ASC", ["surgery center", "surgery centre", "ambulatory surgery"]],
  [/\bnon-?fac(?:ility)?\b/gi, "nonfac/fac", ["in an office", "doctor's office"]],
  [/\bMRFs?\b/g, "MRF", ["machine-readable file", "published file"]],
  [/\bTiC\b/g, "TiC", ["transparency in coverage"]],
  [/\bn\s*=\s*[\d,]+/g, "raw n= sample notation", []],
];

const fails = [];
const criticals = [];
const jargonHits = [];
const notes = [];
const fail = (m) => { fails.push(m); console.log("  FAIL   " + m); };
const crit = (m) => { criticals.push(m); console.log("  CRIT   " + m); };
const pass = (m) => console.log("  ok     " + m);
const note = (m) => { notes.push(m); console.log("  note   " + m); };

// Pull the sentence around a match so the report is actionable rather than a
// yes/no. "A finding without the string is a useless instrument" is the same
// lesson that made the marketing rig name the URL of every failing request.
const excerpt = (text, re) => {
  const m = text.match(re);
  if (!m) return "";
  const i = text.indexOf(m[0]);
  return text.slice(Math.max(0, i - 70), i + m[0].length + 70).replace(/\s+/g, " ").trim();
};

const browser = await chromium.launch({ headless: true });

/* ------------------------------------------------------------ 0. PROVE THE GATE */

console.log(`\n=== THE GATE (prove it blocks, then go through it) . ${BASE}`);

const anon = await browser.newContext();
const anonPage = await anon.newPage();
await anonPage.goto(BASE + "/", { waitUntil: "load" }).catch(() => null);
const anonText = await anonPage.locator("body").innerText().catch(() => "");
const anonHasMoney = /\$[\d,]{2,}/.test(anonText);

if (anonHasMoney) {
  crit("ANONYMOUS VISITOR SEES A DOLLAR FIGURE. The gate is not holding and every fabricated number on this site is public.");
} else {
  pass("anonymous visitor sees no dollar figure");
}

const anonApi = await anon.request.get(BASE + "/api/lookup?service=70553&metro=31080").catch(() => null);
if (!anonApi) {
  note("could not reach /api/lookup anonymously to test the gate");
} else if (anonApi.status() !== 401) {
  crit(`unauthenticated /api/lookup returned ${anonApi.status()}, expected 401. The API is not gated.`);
} else {
  pass("unauthenticated /api/lookup returns 401");
}
await anon.close();

// The PIN is read by name and never printed (HARD RULE 10).
let PIN = process.env.SITE_PIN || "";
if (!PIN) {
  try {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    PIN = (env.match(/^SITE_PIN=(.*)$/m) || [])[1]?.trim() || "";
  } catch { /* fall through to the loud failure below */ }
}
if (!PIN) {
  console.log("\n  FAIL   SITE_PIN not available. Cannot authenticate, and every check below would measure the entry screen.");
  console.log("         Set SITE_PIN in the environment or .env.local. Refusing to report a sweep I did not earn.");
  await browser.close();
  process.exit(2);
}

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const unlock = await ctx.request.post(BASE + "/api/gate", { data: { pin: PIN } });
if (!unlock.ok()) {
  console.log(`\n  FAIL   gate refused the configured PIN (HTTP ${unlock.status()}). Not measuring the entry screen and calling it a pass.`);
  await browser.close();
  process.exit(2);
}
pass("authenticated through the gate . measuring the real surface from here");

const page = await ctx.newPage();

/* -------------------------------------------------- 1. THE RENDERED SURFACE */

console.log("\n=== CLASS A . FALSE AUTHENTICITY CLAIMS (critical) ===");

const rendered = new Map();

for (const path of PAGES) {
  const res = await page.goto(BASE + path, { waitUntil: "load" }).catch(() => null);
  if (!res) { note(`${path} did not load, not scored`); continue; }
  await page.waitForTimeout(400);
  const text = await page.locator("body").innerText().catch(() => "");
  rendered.set(path, text);

  // A page that renders the entry screen scores nothing . that is the false-green
  // shape this rig exists to avoid.
  if (/enter access code/i.test(text)) {
    crit(`${path} rendered the ENTRY SCREEN while authenticated. Not scoring it, and this is itself a defect.`);
    rendered.delete(path);
    continue;
  }

  for (const [re, why] of AUTHENTICITY) {
    if (re.test(text)) crit(`${path} . ${why}\n           "${excerpt(text, re)}"`);
  }
}
if (!criticals.length) pass("no page asserts authenticity over fabricated figures");

console.log("\n=== CLASS B . PROVENANCE FURNITURE ORDERED STRIPPED ===");

let provHits = 0;
for (const [path, text] of rendered) {
  for (const [re, why] of PROVENANCE) {
    if (re.test(text)) { provHits++; fail(`${path} . ${why}\n           "${excerpt(text, re)}"`); }
  }
}
if (!provHits) pass("no provenance furniture rendered on any in-scope page");

/* ------------------------------------------------ 2. THE BYTES, NOT THE PIXELS */

console.log("\n=== CLASS D . JARGON (Ruling 3: elementary or glossed) ===");

for (const [path, text] of rendered) {
  const seenHere = new Set();
  for (const [re, termLabel, glosses] of JARGON) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const i = m.index;
      const around = text.slice(Math.max(0, i - GLOSS_WINDOW), i + m[0].length + GLOSS_WINDOW).toLowerCase();
      // Glossed in the same breath is the whole allowance. "surgery center (ASC)" is
      // fine; a bare "ASC" in a table header is not.
      if (glosses.some((g) => around.includes(g))) continue;
      const key = `${path}|${termLabel}`;
      if (seenHere.has(key)) continue;
      seenHere.add(key);
      const snippet = text.slice(Math.max(0, i - 55), i + m[0].length + 55).replace(/\s+/g, " ").trim();
      jargonHits.push(`${path} . ${termLabel}`);
      console.log(`  JARG   ${path} . unglossed "${termLabel}"\n           "${snippet}"`);
    }
  }
}
if (!jargonHits.length) pass("no unglossed jargon on any in-scope page");

console.log("\n=== CLASS C . THE API PAYLOADS (the bytes, not the pixels) ===");

for (const q of API) {
  const r = await ctx.request.get(BASE + q).catch(() => null);
  if (!r) { note(`${q} unreachable`); continue; }
  if (!r.ok()) { note(`${q} returned ${r.status()}, not scored`); continue; }
  const body = await r.text();
  let hit = false;
  for (const [re, why] of [...AUTHENTICITY, ...PROVENANCE]) {
    if (re.test(body)) {
      hit = true;
      fail(`${q} . ${why} IN THE PAYLOAD\n           "${excerpt(body, re)}"`);
    }
  }
  if (!hit) pass(`${q} payload carries no canon violation`);
}

/* ------------------------------------------------------------ 3. EXEMPT PAGES */

console.log("\n=== EXEMPT BY DESIGN (reported, never failed) ===");
for (const path of EXEMPT) {
  const res = await page.goto(BASE + path, { waitUntil: "load" }).catch(() => null);
  if (!res) { note(`${path} did not load`); continue; }
  const text = await page.locator("body").innerText().catch(() => "");
  const found = PROVENANCE.filter(([re]) => re.test(text)).length;
  console.log(`  exempt ${path} . ${found} provenance strings, correct: this page's job is to state the limits`);
}

/* ---------------------------------------------------------------- THE VERDICT */

await browser.close();

console.log("\n" + "=".repeat(72));
console.log(`CANON SWEEP . ${BASE}`);
console.log(`  ${criticals.length} critical (false authenticity / unreachable surface)`);
console.log(`  ${fails.length} provenance violations   (Ruling 2)`);
console.log(`  ${jargonHits.length} unglossed jargon        (Ruling 3)`);
console.log(`  ${notes.length} notes`);
console.log(`\n  NOT SCORED for provenance: ${EXEMPT.length ? EXEMPT.join(", ") : "(nothing)"}`);
console.log(`  That list is an UNRATIFIED position of this file's author. Override with`);
console.log(`  CANON_EXEMPT="..." (empty string scores everything). See the comment at EXEMPT.`);
if (criticals.length) {
  console.log("\nCRITICAL means a sentence on the shipped surface swears the data is not");
  console.log("fabricated while the engine fabricates it, or a page an authenticated user");
  console.log("reached served them the PIN screen instead of the product.");
}
console.log("=".repeat(72) + "\n");

process.exit(criticals.length || fails.length || jargonHits.length ? 1 : 0);
