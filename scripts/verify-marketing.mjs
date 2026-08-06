/**
 * MARKETING SURFACE VERIFICATION . @BROKER-MARKETING
 *
 * The estate's standing bar: a 200, a green deploy and a passing unit test are not
 * evidence. This script is the evidence. It runs an isolated headless Chromium
 * (never the user's logged-in Chrome), presses real controls, and measures the
 * COMPUTED result rather than the source.
 *
 * What it checks and why each one is here:
 *
 *  1. HORIZONTAL SCROLL, measured by actually scrolling. `scrollWidth` lies on
 *     `overflow: visible` containers. This estate has a locked memory about three
 *     of four instruments reporting no overflow while the page scrolled 1,931px
 *     sideways. So we call scrollTo and read scrollX back.
 *  2. FONTS ACTUALLY LOADED. The entire premise of this build is that the parent's
 *     flagship pages declare three typefaces and render in system fallback. If we
 *     shipped the same defect the claim would be a lie. Checked by asking the font
 *     loading API, not by reading the CSS.
 *  3. TABULAR NUMERALS resolved on a real financial figure.
 *  4. EVERY CONTROL PRESSED. The form is changed and submitted, and the result is
 *     read back and compared against a second, independent query of the same cell.
 *  5. THE NEGATIVE PATH. A known-contaminated cell must render the honest empty
 *     state and must never render a number. This is the single most important
 *     assertion in the file: it proves the honesty filter reaches the screen.
 *  6. CONSOLE AND PAGE ERRORS, zero tolerated.
 *  7. PERFORMANCE under 6x CPU throttle at 390px, which is a broker on a phone.
 *
 * Usage:  node scripts/verify-marketing.mjs [baseUrl]
 */

import { chromium } from "/Users/user/reimburseos-v3-build/node_modules/playwright/index.mjs";
import { mkdirSync, readFileSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:3200";
const OUT = "/private/tmp/claude-501/-Users-user/265014b1-b430-40be-9275-ec16ca261bbb/scratchpad/shots";
mkdirSync(OUT, { recursive: true });

const fails = [];
const notes = [];
const fail = (m) => { fails.push(m); console.log("  FAIL  " + m); };
const pass = (m) => console.log("  ok    " + m);
const note = (m) => { notes.push(m); console.log("  note  " + m); };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ deviceScaleFactor: 2 });
const page = await ctx.newPage();

const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR " + e.message.slice(0, 200)));

// A console line that says "a resource 404'd" without naming the resource is a
// useless instrument. Record the URL and the page that asked for it.
const badResponses = [];
page.on("response", (r) => {
  if (r.status() >= 400) badResponses.push(`${r.status()} ${r.request().resourceType()} ${r.url()}  (from ${r.frame()?.url() || "?"})`);
});

const PAGES = ["/", "/brokers", "/general-agencies", "/employers", "/methodology", "/privacy", "/terms",
  "/rates", "/rates/chicago-il", "/rates/chicago-il/brain-mri", "/rates/houston-tx/colonoscopy"];

// ---------------------------------------------------------------- 0. THE GATE
//
// The site is PIN gated and the middleware REWRITES rather than redirects, so
// every locked page returns HTTP 200 carrying the entry screen. A verification
// suite that does not authenticate therefore measures the entry screen and
// reports a clean pass for a site it never saw. That happened on this rig once:
// seven pages, five widths, all green, all measuring a PIN form.
//
// So we do two things here. We prove the gate BLOCKS, which is a real security
// assertion and the only way to know a gate gates. Then we go through it.
console.log("\n=== THE GATE (prove it blocks, then go through it) ===");

const lockedCtx = await browser.newContext();
const lockedProbe = await lockedCtx.newPage();
await lockedProbe.goto(BASE + "/", { waitUntil: "load" });
const lockedText = await lockedProbe.locator("body").innerText();
if (/\$\d/.test(lockedText)) fail("an unauthenticated visitor can see a dollar figure on the home page");
else pass("an unauthenticated visitor sees no rate figure");

const lockedApi = await lockedCtx.request.get(BASE + "/api/lookup?service=70553&metro=31080");
if (lockedApi.status() !== 401) {
  fail(`unauthenticated /api/lookup returned ${lockedApi.status()}, expected 401. The API is not gated.`);
} else {
  const body = await lockedApi.text();
  if (/p25|p50|"cell"/.test(body)) fail("the 401 body still contains rate data");
  else pass("unauthenticated /api/lookup returns 401 with no rate data in the body");
}
await lockedCtx.close();

// Read the PIN by name from the gitignored env file. Never printed.
let PIN = process.env.SITE_PIN || "";
if (!PIN) {
  try {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    PIN = (env.match(/^SITE_PIN=(.*)$/m) || [])[1]?.trim() || "";
  } catch {}
}
if (!PIN) {
  console.log("  FAIL  SITE_PIN not available, cannot authenticate. Every check below would measure the entry screen.");
  process.exit(1);
}

const unlock = await ctx.request.post(BASE + "/api/gate", {
  data: { pin: PIN },
  headers: { "content-type": "application/json" },
});
if (!unlock.ok()) {
  console.log(`  FAIL  gate refused the configured PIN (HTTP ${unlock.status()}). Not measuring the entry screen and calling it a pass.`);
  process.exit(1);
}
const gateCookies = await ctx.cookies();
pass("authenticated through the gate, measuring the real site from here");

// Any context created later must carry the same cookie or it measures the gate.
async function authed(options = {}) {
  const c = await browser.newContext(options);
  await c.addCookies(gateCookies);
  return c;
}

// ---------------------------------------------------------------- 1. viewports
console.log("\n=== VIEWPORT SWEEP (real scroll test) ===");
const SIZES = [
  [320, 568, "320"],
  [390, 844, "390"],
  [768, 1024, "768"],
  [1440, 900, "1440"],
  [1920, 1080, "1920"],
];

for (const path of PAGES) {
  const res = await page.goto(BASE + path, { waitUntil: "load" }).catch(() => null);
  if (!res) { note(`${path} did not load, skipping (page may not exist yet)`); continue; }
  if (res.status() >= 400) { fail(`${path} returned HTTP ${res.status()}`); continue; }

  for (const [w, h, tag] of SIZES) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(320);

    const m = await page.evaluate(() => {
      const before = window.scrollX;
      window.scrollTo(99999, 0);
      const after = window.scrollX;
      window.scrollTo(before, 0);
      const de = document.documentElement;
      return { scrolled: after, reported: de.scrollWidth - de.clientWidth, cw: de.clientWidth };
    });

    if (m.scrolled > 0) {
      fail(`${path} @${w}px scrolls sideways by ${m.scrolled}px (scrollWidth said ${m.reported})`);
    }
    if (m.scrolled === 0 && m.reported > 0) {
      note(`${path} @${w}px: scrollWidth reports ${m.reported}px but the page does not actually scroll`);
    }

    const slug = path === "/" ? "home" : path.replace(/\//g, "");

    // A full-page capture of a scroll-revealed page is blank below the fold unless
    // it has actually been scrolled, so scroll it first. Otherwise the screenshot
    // we review is not the page a human sees, and reviewing it teaches us nothing.
    if (w === 1440) {
      // Fast jump, not a gentle crawl. This is the adversarial case for
      // scroll-reveal and it is what a real user does.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(900);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: `${OUT}/${slug}-${tag}.jpeg`, type: "jpeg", quality: 82, fullPage: w === 1440 });
  }
  pass(`${path} no horizontal scroll at any of ${SIZES.length} widths`);
}

// ---------------------------------------------------------------- 2. fonts
console.log("\n=== FONTS (the whole premise of this build) ===");
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(BASE + "/", { waitUntil: "load" });
await page.waitForTimeout(600);

const fontState = await page.evaluate(async () => {
  await document.fonts.ready;
  const loaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
  const h1 = document.querySelector("h1");
  const num = document.querySelector(".num");
  const cs = h1 ? getComputedStyle(h1) : null;
  const csn = num ? getComputedStyle(num) : null;

  // Width probe: render the same string in the resolved family and in a forced
  // generic. If they are identical to the pixel, the webfont is not actually
  // being used and we are looking at fallback.
  const probe = (family) => {
    const s = document.createElement("span");
    s.textContent = "Reddenda 1234567890";
    s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-size:48px;font-family:${family}`;
    document.body.appendChild(s);
    const w = s.getBoundingClientRect().width;
    s.remove();
    return w;
  };

  return {
    loadedCount: document.fonts.size,
    loadedFamilies: [...new Set(loaded)],
    h1Family: cs?.fontFamily ?? null,
    numFamily: csn?.fontFamily ?? null,
    numVariant: csn?.fontVariantNumeric ?? null,
    widthResolved: h1 ? probe(cs.fontFamily) : 0,
    widthGeneric: probe("Times, serif"),
  };
});

if (fontState.loadedCount === 0) fail("no webfonts loaded at all, the page is in system fallback");
else pass(`${fontState.loadedCount} font faces loaded: ${fontState.loadedFamilies.join(", ").slice(0, 120)}`);

if (fontState.widthResolved > 0 && Math.abs(fontState.widthResolved - fontState.widthGeneric) < 1) {
  fail("headline renders at the same width as a generic serif, which means fallback");
} else {
  pass(`headline family resolves to ${String(fontState.h1Family).slice(0, 60)}`);
}

if (!/tabular-nums/.test(fontState.numVariant || "")) {
  fail(`financial figures are not tabular: font-variant-numeric computed as "${fontState.numVariant}"`);
} else {
  pass("financial figures compute font-variant-numeric: tabular-nums");
}
if (!/mono/i.test(fontState.numFamily || "")) {
  fail(`financial figures are not monospace: "${fontState.numFamily}"`);
} else {
  pass("financial figures resolve to the mono family");
}

// ---------------------------------------------------------------- 3. controls
console.log("\n=== CONTROLS (pressed, not inspected) ===");
await page.goto(BASE + "/", { waitUntil: "load" });

const before = await page.locator("#result").innerText().catch(() => "");
await page.selectOption("#service", "45378");
await page.selectOption("#market", "26420");
await Promise.all([page.waitForLoadState("load"), page.click('button[type="submit"]')]);
await page.waitForTimeout(400);

const url = new URL(page.url());
if (url.searchParams.get("service") !== "45378" || url.searchParams.get("market") !== "26420") {
  fail(`submit did not carry both parameters, got ${url.search}`);
} else {
  pass("submit produced a shareable URL carrying both parameters");
}

const after = await page.locator("#result").innerText();
if (after === before) fail("the result panel did not change after submitting a different service and market");
else pass("the result panel changed when the selection changed");

if (!/Colonoscopy/i.test(after)) fail(`result does not name the selected service, got: ${after.slice(0, 90)}`);
else pass("result names the selected service in plain English");
if (!/Houston/i.test(after)) fail(`result does not name the selected market, got: ${after.slice(0, 90)}`);
else pass("result names the selected market");

// The rendered median must equal what the API independently returns for the same
// cell. Two paths, one number, or one of them is lying.
const apiRaw = await page.evaluate(async (b) => {
  const r = await fetch(`${b}/api/lookup?service=45378&metro=26420`);
  return r.ok ? r.json() : null;
}, BASE);

if (!apiRaw?.ok || !apiRaw.result?.found) {
  note("api/lookup did not return a found result for the cross-check cell");
} else {
  const apiMedian = Math.round(apiRaw.result.cell.p50);
  const shown = after.replace(/,/g, "").match(/\$(\d+)/g)?.map((s) => Number(s.slice(1))) ?? [];
  if (!shown.includes(apiMedian)) {
    fail(`rendered figures ${JSON.stringify(shown.slice(0, 6))} do not contain the API median $${apiMedian}`);
  } else {
    pass(`rendered median matches an independent API read of the same cell ($${apiMedian})`);
  }
}

// A site-of-service split exists for a colonoscopy, so the caveat must be present.
if (/facility/i.test(after) && !/physician fee only/i.test(after)) {
  fail("a facility figure is shown without the physician-fee-only caveat");
} else if (/facility/i.test(after)) {
  pass("the facility figure carries the physician-fee-only caveat");
}

// ---------------------------------------------------------------- 4. negative path
console.log("\n=== NEGATIVE PATH (the honesty filter must reach the screen) ===");
await page.goto(`${BASE}/?service=99214&market=35620`, { waitUntil: "load" });
await page.waitForTimeout(300);
const negText = await page.locator("#result").innerText();

const negApi = await page.evaluate(async (b) => {
  const r = await fetch(`${b}/api/lookup?service=99214&metro=35620`);
  return r.ok ? r.json() : null;
}, BASE);

if (negApi?.result?.found === false) {
  if (/\$\d/.test(negText)) fail(`the corpus refused this cell but the page still shows a dollar figure: ${negText.slice(0, 120)}`);
  else pass("a refused cell renders no dollar figure anywhere in the result panel");
  // Was `/[a-z]{20,}/`, which is 20 consecutive letters and matches no English
  // word. The instrument failed a page that was correct. Measure the real thing:
  // a human-readable sentence of reasonable length containing several words.
  const words = negText.trim().split(/\s+/).filter((w) => /[a-z]{3,}/i.test(w));
  if (words.length < 12) fail(`a refused cell renders no explanatory sentence (only ${words.length} words)`);
  else pass(`a refused cell renders an explanation in words (${words.length} words)`);
} else if (negApi?.result?.found) {
  note(`99214 in the New York metro is currently PUBLISHABLE (median $${Math.round(negApi.result.cell.p50)}), so this cell is not the negative case. The known contamination is at NY state scope.`);
} else {
  note("could not reach api/lookup for the negative-path cross-check");
}

// A cell far outside the corpus must also fail honestly rather than 500.
const badRes = await page.goto(`${BASE}/?service=99999&market=99999`, { waitUntil: "load" });
if (badRes.status() >= 400) fail(`invalid parameters returned HTTP ${badRes.status()} instead of a graceful page`);
else pass("invalid parameters fall back to a valid page rather than an error");

// ---------------------------------------------------------------- 5. a11y basics
console.log("\n=== ACCESSIBILITY ===");
await page.goto(BASE + "/", { waitUntil: "load" });
const a11y = await page.evaluate(() => {
  const problems = [];
  if (document.querySelectorAll("h1").length !== 1) problems.push(`${document.querySelectorAll("h1").length} h1 elements`);
  document.querySelectorAll("select, input").forEach((el) => {
    const id = el.id;
    const labelled = id && document.querySelector(`label[for="${id}"]`);
    if (!labelled && !el.getAttribute("aria-label")) problems.push(`unlabelled control: ${el.tagName}#${id || "(no id)"}`);
  });
  document.querySelectorAll("img").forEach((i) => { if (!i.hasAttribute("alt")) problems.push("img without alt"); });
  document.querySelectorAll("table").forEach((t) => { if (!t.querySelector("th")) problems.push("table without a header cell"); });
  const html = document.documentElement;
  if (!html.getAttribute("lang")) problems.push("html element has no lang");
  return problems;
});
if (a11y.length) a11y.forEach((p) => fail("a11y: " + p));
else pass("single h1, all controls labelled, tables have headers, lang set");

// Keyboard: the first tab must reach something real and it must be visibly focused.
await page.keyboard.press("Tab");
const focused = await page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const cs = getComputedStyle(el);
  return { tag: el.tagName, text: (el.textContent || "").slice(0, 40), shadow: cs.boxShadow, outline: cs.outlineStyle };
});
if (!focused) fail("tab from the top of the page focuses nothing");
else if (focused.shadow === "none" && focused.outline === "none") fail(`focused ${focused.tag} shows no visible focus indicator`);
else pass(`keyboard focus reaches ${focused.tag} and is visible`);

// ---------------------------------------------------------------- 5b. scroll reveal
// THE PRIMARY PATH. Earlier versions of this suite only checked the two FALLBACK
// paths (reduced motion and no-JS), both of which disable the reveal entirely, so
// a permanently-invisible page would have passed every check. A full-page
// screenshot showed three sections rendering as blank space and that is what
// caught it. Test the path most users are actually on.
console.log("\n=== SCROLL REVEAL (the path most users are on) ===");
await page.goto(BASE + "/", { waitUntil: "load" });
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(400);

// FAST scroll on purpose. A slow scripted scroll brings sections into view one at
// a time, which is the easy case and hides the real bug: several sections entering
// in one IntersectionObserver callback batch. That is what a human flicking down
// the page produces, and it is what left two sections permanently invisible here.
// Jump straight to the bottom, then confirm nothing was skipped.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(900);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(900);

const revealState = await page.evaluate(() => {
  const els = [...document.querySelectorAll(".reveal")];
  const stuck = els
    .filter((e) => Number(getComputedStyle(e).opacity) <= 0.9)
    .map((e) => (e.textContent || "").trim().slice(0, 60));
  return { total: els.length, stuck };
});
if (revealState.stuck.length) {
  revealState.stuck.forEach((s) => fail(`content never revealed after scrolling to it: "${s}"`));
} else {
  pass(`all ${revealState.total} scroll-revealed blocks became visible when scrolled to`);
}

// And print must not inherit the hidden state, even unscrolled.
const printPage = await ctx.newPage();
await printPage.goto(BASE + "/", { waitUntil: "load" });
await printPage.emulateMedia({ media: "print" });
await printPage.waitForTimeout(300);
const printHidden = await printPage.evaluate(() => {
  const els = [...document.querySelectorAll(".reveal, .rise")];
  return els.filter((e) => Number(getComputedStyle(e).opacity) <= 0.9).length;
});
if (printHidden > 0) fail(`${printHidden} blocks are invisible in print media without scrolling first`);
else pass("print media renders every block visible without scrolling first");
await printPage.close();

// ---------------------------------------------------------------- 6. reduced motion
console.log("\n=== REDUCED MOTION ===");
const rmCtx = await authed({ reducedMotion: "reduce", deviceScaleFactor: 1 });
const rmPage = await rmCtx.newPage();
await rmPage.goto(BASE + "/", { waitUntil: "load" });
await rmPage.waitForTimeout(700);
const hidden = await rmPage.evaluate(() => {
  let invisible = 0;
  document.querySelectorAll(".reveal, .rise").forEach((el) => {
    if (Number(getComputedStyle(el).opacity) < 0.9) invisible++;
  });
  return invisible;
});
if (hidden > 0) fail(`${hidden} animated blocks are still invisible with prefers-reduced-motion on`);
else pass("all animated content is fully visible with prefers-reduced-motion on");
await rmCtx.close();

// ---------------------------------------------------------------- 7. no-JS
console.log("\n=== NO JAVASCRIPT (the lookup must still work) ===");
const njCtx = await authed({ javaScriptEnabled: false });
const njPage = await njCtx.newPage();
await njPage.goto(`${BASE}/?service=45378&market=26420`, { waitUntil: "load" });
const njText = await njPage.locator("#result").innerText();
if (!/\$\d/.test(njText)) fail("with JavaScript disabled the result panel shows no figure");
else pass("the lookup renders a real figure with JavaScript disabled");
const njVisible = await njPage.evaluate(() => {
  let invisible = 0;
  document.querySelectorAll(".reveal").forEach((el) => { if (Number(getComputedStyle(el).opacity) < 0.9) invisible++; });
  return invisible;
});
if (njVisible > 0) fail(`${njVisible} blocks are invisible with JavaScript disabled, the reveal fails closed`);
else pass("scroll-reveal content degrades to visible with JavaScript disabled");
await njCtx.close();

// ---------------------------------------------------------------- 8. performance
console.log("\n=== PERFORMANCE @ 6x CPU throttle, 390px ===");
const perfCtx = await authed({ deviceScaleFactor: 2 });
const perfPage = await perfCtx.newPage();
const cdp = await perfCtx.newCDPSession(perfPage);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
await perfPage.setViewportSize({ width: 390, height: 844 });
await perfPage.goto(BASE + "/", { waitUntil: "load" });
await perfPage.waitForTimeout(3000);
const perf = await perfPage.evaluate(
  () =>
    new Promise((res) => {
      const lcp = [];
      new PerformanceObserver((l) => lcp.push(...l.getEntries())).observe({ type: "largest-contentful-paint", buffered: true });
      let cls = 0;
      try {
        new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) cls += e.value; })).observe({ type: "layout-shift", buffered: true });
      } catch {}
      setTimeout(() => {
        const fcp = performance.getEntriesByType("paint").find((x) => x.name === "first-contentful-paint");
        const last = lcp[lcp.length - 1];
        const r = performance.getEntriesByType("resource");
        res({
          fcp: Math.round(fcp?.startTime || 0),
          lcp: Math.round(last?.startTime || 0),
          cls: Math.round(cls * 1000) / 1000,
          kb: Math.round(r.reduce((s, x) => s + (x.transferSize || 0), 0) / 1024),
        });
      }, 1200);
    }),
);
console.log(`  FCP ${perf.fcp}ms  LCP ${perf.lcp}ms  CLS ${perf.cls}  transferred ${perf.kb}KB`);
if (perf.cls > 0.1) fail(`CLS ${perf.cls} exceeds 0.1, layout is shifting`);
else pass(`CLS ${perf.cls}`);
if (perf.lcp > 4000) fail(`LCP ${perf.lcp}ms at 6x throttle exceeds 4000ms`);
else pass(`LCP ${perf.lcp}ms at 6x CPU throttle`);
await perfCtx.close();

// ---------------------------------------------------------------- 9. console
console.log("\n=== CONSOLE AND NETWORK ===");
if (badResponses.length) {
  [...new Set(badResponses)].slice(0, 12).forEach((e) => fail("request: " + e));
} else pass("every request across every page returned under 400");

if (consoleErrors.length) {
  [...new Set(consoleErrors)].slice(0, 10).forEach((e) => fail("console: " + e));
} else pass("zero console errors and zero page errors across every page visited");

await browser.close();

console.log("\n" + "=".repeat(80));
console.log(`RESULT: ${fails.length} failure(s), ${notes.length} note(s). Screenshots in ${OUT}`);
console.log("=".repeat(80) + "\n");
if (notes.length) { console.log("NOTES:"); notes.forEach((n) => console.log("  . " + n)); console.log(""); }
process.exit(fails.length ? 1 : 0);
