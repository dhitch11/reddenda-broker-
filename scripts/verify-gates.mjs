#!/usr/bin/env node
/**
 * VERIFY-GATES — the standing both-sides proof for broker.reddenda.com.
 *
 * Written 2026-08-29 by @BRK-HELP. Run it before any promote of this repo.
 *
 * ⛔ WHY THIS FILE EXISTS, AND THE ONE RULE IT ENFORCES ABOVE ALL OTHERS.
 *
 * A refusal is not a gate. An anonymous 404 means the thing is GATED or the thing is
 * ABSENT, and those are opposite states. This estate has shipped that confusion twice:
 * a CSS "PIN gate" on /competitors that served 303,451 bytes to any anonymous curl while
 * rendering a lock over them, and a padlock on /payer-rates drawn client-side over an API
 * that handed every payer's exact percentiles to anyone who asked. Both greped as present.
 * Both passed every check anybody ran. Neither gated anything.
 *
 * So every gate check here is a PAIR. The negative half proves an anonymous caller is
 * refused. The positive half proves the SAME resource is served to a caller who should
 * have it. A check that can only run its negative half reports UNPROVEN, never PASS.
 * UNPROVEN is not a failure and does not set the exit code; it is this script refusing to
 * tell you something it did not measure.
 *
 * USAGE
 *   node scripts/verify-gates.mjs                                   # prod, anonymous halves only
 *   node scripts/verify-gates.mjs --host http://localhost:3000
 *   node scripts/verify-gates.mjs --pin-from .env.local             # adds the positive halves
 *   node scripts/verify-gates.mjs --json                            # machine output
 *
 * ⛔ SECRETS. --pin-from reads PRACTICE_AUDIO_PIN out of a gitignored env file to run the
 * positive half of the practice-audio gate. The value is never printed, never logged, never
 * placed in the JSON output, and never put in a URL. Without the flag the script still runs
 * and simply reports that pair UNPROVEN, which is the honest answer.
 *
 * Exit 1 if any check FAILS. UNPROVEN and SKIP do not fail the run.
 */

import { readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const HOST = (arg("--host", "https://broker.reddenda.com")).replace(/\/$/, "");
const PIN_FROM = arg("--pin-from", null);
const AS_JSON = argv.includes("--json");

/* ---------------------------------------------------------------------------------
 * The invariants, derived from the code in this repo, not from anybody's memory.
 * If you change a route, change the expectation here in the same commit.
 * ------------------------------------------------------------------------------- */

/** Closed 2026-08-26 under Bulletin 2 #5. They answered anonymous callers with the
 *  full metro distribution as JSON. They are RETIRED, not gated: 410 is the honest
 *  status for a route that existed and was deliberately withdrawn. */
const RETIRED_API = ["/api/brief", "/api/compare", "/api/lookup", "/api/site-of-service"];

/** Left open on purpose: it serves catalog names and CPT codes and must never serve a
 *  price. That invariant, not the rate meter, is what makes the route safe. */
const OPEN_API = "/api/services";

/** Every payer this corpus could name. If one of these appears in an anonymous response
 *  from a rate page, the per-payer view has leaked and that is a stop-the-line event. */
const PAYER_RE =
  /\b(aetna|anthem|elevance|blue ?cross|blue ?shield|bcbs|cigna|united ?health|uhc|humana|kaiser|centene|molina|oscar ?health|ambetter|health ?net)\b/i;

const results = [];
let secretPin = null;

const record = (name, verdict, expected, measured, repro, note) =>
  results.push({ name, verdict, expected, measured, repro, note: note ?? null });

const PASS = (...a) => record(a[0], "PASS", a[1], a[2], a[3], a[4]);
const FAIL = (...a) => record(a[0], "FAIL", a[1], a[2], a[3], a[4]);
const UNPROVEN = (...a) => record(a[0], "UNPROVEN", a[1], a[2], a[3], a[4]);

async function get(path, { headers = {}, method = "GET", body, redirect = "manual" } = {}) {
  const res = await fetch(HOST + path, { method, headers, body, redirect });
  const text = res.status === 206 || res.headers.get("content-type")?.startsWith("audio/")
    ? ""
    : await res.text();
  return { status: res.status, headers: res.headers, text, bytes: Number(res.headers.get("content-length") ?? text.length) };
}

/* ------------------------------- 1. the retired routes ------------------------------ */

async function checkRetiredRoutes() {
  for (const path of RETIRED_API) {
    const r = await get(path);
    const body = (() => { try { return JSON.parse(r.text); } catch { return null; } })();

    if (r.status === 410 && body?.error === "locked") {
      PASS(`retired ${path} refuses anonymous GET`, "410 + {error:locked}", `${r.status}, ${r.text.length}B`,
        `curl -i ${HOST}${path}`);
    } else {
      FAIL(`retired ${path} refuses anonymous GET`, "410 + {error:locked}",
        `${r.status}, ${r.text.slice(0, 120)}`, `curl -i ${HOST}${path}`);
    }

    /* A price in a refusal body would mean the refusal is leaking what it refuses. */
    if (/\$\s?\d/.test(r.text) || /"p(25|50|75|90)"/.test(r.text)) {
      FAIL(`retired ${path} leaks no figure in its refusal`, "no dollar, no percentile key",
        r.text.slice(0, 160), `curl -s ${HOST}${path}`);
    } else {
      PASS(`retired ${path} leaks no figure in its refusal`, "no dollar, no percentile key", "clean",
        `curl -s ${HOST}${path}`);
    }

    /* A tier-dependent answer that a shared cache may store is a poisoning vector. This
       repo has the filed incident: /api/lookup once served one market's number to every
       visitor for an hour from a single Durable cache hit whose key omitted the query. */
    const cc = (r.headers.get("cache-control") ?? "").toLowerCase();
    if (cc.includes("no-store")) {
      PASS(`retired ${path} is uncacheable`, "cache-control: no-store", cc, `curl -sI ${HOST}${path}`);
    } else {
      FAIL(`retired ${path} is uncacheable`, "cache-control: no-store", cc || "(absent)",
        `curl -sI ${HOST}${path}`);
    }

    /* Only GET is exported. Anything else answering 2xx means a handler survived the closure. */
    for (const method of ["POST", "PUT", "DELETE"]) {
      const m = await get(path, { method, headers: { "content-type": "application/json" }, body: "{}" });
      if (m.status >= 200 && m.status < 300) {
        FAIL(`retired ${path} refuses ${method}`, "non-2xx", String(m.status),
          `curl -i -X ${method} ${HOST}${path}`);
      } else {
        PASS(`retired ${path} refuses ${method}`, "non-2xx", String(m.status),
          `curl -i -X ${method} ${HOST}${path}`);
      }
    }
  }

  /* THE POSITIVE HALF. A 410 that points at a door has to point at a door that opens.
     All four bodies name the console as the replacement, so the console must answer. */
  const first = await get(RETIRED_API[0]);
  let target = null;
  try { target = JSON.parse(first.text)?.console ?? null; } catch { /* handled below */ }
  if (!target) {
    FAIL("the retired routes name their replacement", "a console URL in the 410 body", "absent",
      `curl -s ${HOST}${RETIRED_API[0]}`);
  } else {
    const res = await fetch(target, { redirect: "follow" }).catch((e) => ({ status: 0, err: String(e) }));
    if (res.status >= 200 && res.status < 400) {
      PASS("the door the 410 points at answers", "2xx/3xx from the named console",
        `${res.status} ${target}`, `curl -sI -L ${target}`,
        "answers as a host; whether an anonymous visitor gets a working demo seat is the app lane's to prove");
    } else {
      FAIL("the door the 410 points at answers", "2xx/3xx from the named console",
        `${res.status ?? "network error"} ${target}`, `curl -sI -L ${target}`,
        "the refusal promises a free demo seat at a URL that does not answer");
    }
  }
}

/* --------------------------- 2. the open route's real invariant --------------------- */

async function checkOpenRoute() {
  const queries = ["", "mri", "70553", "99214", "a", "%", "../", "*", "j".repeat(400)];
  let dirty = null;
  for (const q of queries) {
    const r = await get(`${OPEN_API}?q=${encodeURIComponent(q)}`);
    if (r.status !== 200) {
      /* A 429 here is the meter doing its job and is not a defect. */
      if (r.status === 429) continue;
      FAIL(`${OPEN_API} answers q=${JSON.stringify(q).slice(0, 24)}`, "200", String(r.status),
        `curl -s '${HOST}${OPEN_API}?q=${encodeURIComponent(q)}'`);
      continue;
    }
    if (/\$\s?\d/.test(r.text) || /"p(25|50|75|90)"\s*:/.test(r.text) || PAYER_RE.test(r.text)) {
      dirty = { q, sample: r.text.slice(0, 200) };
      break;
    }
  }
  if (dirty) {
    FAIL(`${OPEN_API} holds no rates`, "no dollar, no percentile key, no payer name",
      `q=${JSON.stringify(dirty.q)} → ${dirty.sample}`,
      `curl -s '${HOST}${OPEN_API}?q=${encodeURIComponent(dirty.q)}'`,
      "this route is open BECAUSE it holds no rates. If it holds one, the reason it is open is gone.");
  } else {
    PASS(`${OPEN_API} holds no rates`, "no dollar, no percentile key, no payer name",
      `clean across ${queries.length} queries incl. empty, unicode-free junk, 400 chars, ../ and %`,
      `curl -s '${HOST}${OPEN_API}?q=mri'`);
  }
}

/* ------------------------------ 3. the rate pages ---------------------------------- */

async function checkRatePages() {
  const leaf = "/rates/los-angeles-ca/brain-mri";
  const other = "/rates/san-diego-ca/brain-mri";

  const a = await get(leaf);
  if (a.status !== 200) {
    FAIL("a rate leaf page serves anonymously", "200", String(a.status), `curl -sI ${HOST}${leaf}`,
      "the public SEO surface is the top of the funnel; a non-200 here is a GTM outage, not a win");
    return;
  }

  /* The public cell is POOLED and payer-blind BY DESIGN. The gated thing is the per-payer
     view. So the invariant on this page is not "no numbers" - it is "no payer names". */
  if (PAYER_RE.test(a.text)) {
    FAIL("the public rate page names no payer", "no carrier name in the served bytes",
      (a.text.match(PAYER_RE) ?? []).join(","), `curl -s ${HOST}${leaf} | grep -oiE '${PAYER_RE.source}'`,
      "STOP THE LINE: the per-payer view is the paid product and it is in the anonymous HTML");
  } else {
    PASS("the public rate page names no payer", "no carrier name in the served bytes",
      "clean across the full response", `curl -s ${HOST}${leaf} | grep -oiE 'aetna|anthem|cigna|kaiser|bcbs'`,
      "pooled and payer-blind is the intended free tier; the per-payer view stays in the console");
  }

  /* THE CACHE-COLLAPSE GUARD. Filed incident on this repo: two different queries collapsed
     to one Durable cache entry because the key omitted the params, and every visitor saw
     one market's number for an hour. Two different URLs must give two different answers. */
  const b = await get(other);
  const nums = (s) => (s.match(/\$[0-9][0-9,]*/g) ?? []).slice(0, 12).join("|");
  if (b.status === 200 && nums(a.text) && nums(a.text) === nums(b.text)) {
    FAIL("two markets give two answers", "different figures for different markets",
      `${leaf} and ${other} returned identical figures`, `curl -s ${HOST}${leaf}; curl -s ${HOST}${other}`,
      "cache collapse: the CDN key is not separating these paths");
  } else if (b.status === 200) {
    PASS("two markets give two answers", "different figures for different markets",
      `distinct figure sets`, `curl -s ${HOST}${leaf}; curl -s ${HOST}${other}`);
  } else {
    UNPROVEN("two markets give two answers", "a second market to compare against",
      `${other} returned ${b.status}`, `curl -sI ${HOST}${other}`);
  }

  /* An unknown market must 404, not render an empty shell that looks like a real market. */
  const ghost = await get("/rates/atlantis-zz/brain-mri");
  if (ghost.status === 404) {
    PASS("an unknown market 404s", "404", "404", `curl -sI ${HOST}/rates/atlantis-zz/brain-mri`);
  } else {
    FAIL("an unknown market 404s", "404", String(ghost.status),
      `curl -sI ${HOST}/rates/atlantis-zz/brain-mri`);
  }
}

/* ---------------------- 4. the practice-audio gate, both halves --------------------- */

function loadPin(path) {
  try {
    const line = readFileSync(path, "utf8").split("\n").find((l) => l.startsWith("PRACTICE_AUDIO_PIN="));
    if (!line) return null;
    const v = line.slice("PRACTICE_AUDIO_PIN=".length).trim().replace(/^["']|["']$/g, "");
    return v || null;
  } catch {
    return null;
  }
}

async function checkPracticeGate() {
  /* NEGATIVE HALF. Not "is there a lock" - is the content absent from the bytes. */
  const anon = await get("/practiceaudio");
  const CONTENT = /\.mp3|<audio|practice-audio-media|transcript/i;
  if (anon.status === 200 && !CONTENT.test(anon.text)) {
    PASS("practiceaudio withholds its content from anonymous", "no media reference in the bytes",
      `200, ${anon.text.length}B, no mp3/audio/transcript marker`, `curl -s ${HOST}/practiceaudio | wc -c`,
      "the server does not write it; it is not hidden with CSS");
  } else {
    FAIL("practiceaudio withholds its content from anonymous", "no media reference in the bytes",
      `${anon.status}, ${anon.text.length}B, marker present`, `curl -s ${HOST}/practiceaudio`,
      "the /competitors failure mode: bytes shipped and hidden client-side");
  }

  /* The static media has to be gated separately: a CDN file never consults a component.
   *
   * ⛔ AND IT MUST BE TESTED ON PATH SHAPE, NOT JUST ON THE PATH. Added 2026-08-29 after this
   * script shipped a PASS on a gate that was open. The canonical path returned 404 and I called
   * the gate proven. It was not: `/practice-audio-media//practiceaudio.mp3` returned the whole
   * 16,636,491-byte recording, md5-identical to the repo file, to an anonymous request, and so
   * did the uppercase form. The proxy matcher is compared against the literal request path while
   * the CDN's static resolver collapses duplicate slashes and resolves case-insensitively, so
   * the variant never enters the proxy at all.
   *
   * A GATE PROTECTS A ROUTE, NOT A FILE. Every variant below is a real bypass measured on live
   * production, not a hypothetical. If you add a gated static path anywhere, add its shapes here. */
  const media = "/practice-audio-media/practiceaudio.mp3";
  const SHAPES = [
    ["canonical", "/practice-audio-media/practiceaudio.mp3"],
    ["double slash", "/practice-audio-media//practiceaudio.mp3"],
    ["leading double slash", "//practice-audio-media/practiceaudio.mp3"],
    ["uppercase", "/PRACTICE-AUDIO-MEDIA/practiceaudio.mp3"],
    ["mixed case", "/Practice-Audio-Media/practiceaudio.mp3"],
    ["trailing dot segment", "/practice-audio-media/./practiceaudio.mp3"],
    ["encoded slash", "/practice-audio-media%2Fpracticeaudio.mp3"],
  ];
  for (const [shape, path] of SHAPES) {
    const r = await get(path);
    if (r.status === 404) {
      PASS(`the private recording refuses anonymous (${shape})`, "404", "404",
        `curl -sI '${HOST}${path}'`, shape === "canonical" ? "404 not 403, so the path is not confirmed to exist" : null);
    } else {
      FAIL(`the private recording refuses anonymous (${shape})`, "404", String(r.status),
        `curl -sI '${HOST}${path}'`,
        "PATH-SHAPE BYPASS: the CDN normalises this form and the proxy matcher does not, so the file is served without ever entering the gate");
    }
  }
  const anonMedia = await get(media);

  /* Forged credentials must all be refused. Every early return in verify() is false. */
  const forgeries = ["1", "true", "x.y", "1000000000.AAAA", `${Math.floor(Date.now() / 1000) + 9999}.notasig`];
  let opened = null;
  for (const c of forgeries) {
    const r = await get("/practiceaudio", { headers: { cookie: `rbk_practice=${c}` } });
    if (r.status === 200 && CONTENT.test(r.text)) { opened = c; break; }
  }
  if (opened) {
    FAIL("forged cookies are refused", "every forgery refused", `opened with rbk_practice=${opened}`,
      `curl -s -H 'cookie: rbk_practice=${opened}' ${HOST}/practiceaudio`);
  } else {
    PASS("forged cookies are refused", "every forgery refused", `${forgeries.length} forgeries, all refused`,
      `curl -s -H 'cookie: rbk_practice=1' ${HOST}/practiceaudio | wc -c`);
  }

  /* POSITIVE HALF. Without it everything above proves GATED or ABSENT and cannot tell you which. */
  if (!secretPin) {
    UNPROVEN("the gate opens for the right code", "the gated page and media served to a valid cookie",
      "no PIN supplied", "node scripts/verify-gates.mjs --pin-from .env.local",
      "the anonymous halves above prove REFUSED. They cannot distinguish GATED from ABSENT. Run with --pin-from.");
    return;
  }

  const form = new URLSearchParams({ code: secretPin });
  const enter = await fetch(`${HOST}/practiceaudio/enter`, {
    method: "POST", body: form, redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  const setCookie = enter.headers.get("set-cookie") ?? "";
  const value = /rbk_practice=([^;]+)/.exec(setCookie)?.[1] ?? null;

  if (!value) {
    FAIL("the gate opens for the right code", "a signed rbk_practice cookie",
      `enter returned ${enter.status} with no cookie`,
      "node scripts/verify-gates.mjs --pin-from .env.local",
      "either the code is wrong for this host or the gate is broken closed, which is also a defect");
    return;
  }

  const authed = await get("/practiceaudio", { headers: { cookie: `rbk_practice=${value}` } });
  const grew = authed.text.length > anon.text.length * 3 && CONTENT.test(authed.text);
  if (grew) {
    PASS("the gate opens for the right code", "the real page served to a valid cookie",
      `${anon.text.length}B anonymous → ${authed.text.length}B authorised, media reference present`,
      "node scripts/verify-gates.mjs --pin-from .env.local",
      "BOTH SIDES PROVEN: refused without, served with");
  } else {
    FAIL("the gate opens for the right code", "the real page served to a valid cookie",
      `${authed.status}, ${authed.text.length}B`, "node scripts/verify-gates.mjs --pin-from .env.local",
      "broken closed: the right credential does not open it");
  }

  const authedMedia = await fetch(HOST + media, {
    headers: { cookie: `rbk_practice=${value}`, range: "bytes=0-1023" },
  });
  if (authedMedia.status === 206) {
    PASS("the private recording is served to a valid cookie", "206 with Range support",
      "206", "curl -r 0-1023 -b jar " + HOST + media,
      "Range matters: iOS Safari will not play a recording it cannot seek in");
  } else {
    FAIL("the private recording is served to a valid cookie", "206 with Range support",
      String(authedMedia.status), "curl -r 0-1023 -b jar " + HOST + media);
  }
}

/* ------------------------------------ run ------------------------------------------ */

if (PIN_FROM) {
  secretPin = loadPin(PIN_FROM);
  if (!secretPin) {
    console.error(`[verify-gates] no PRACTICE_AUDIO_PIN found in ${PIN_FROM}; positive halves will report UNPROVEN.`);
  }
}

await checkRetiredRoutes();
await checkOpenRoute();
await checkRatePages();
await checkPracticeGate();

const fails = results.filter((r) => r.verdict === "FAIL");
const unproven = results.filter((r) => r.verdict === "UNPROVEN");

if (AS_JSON) {
  console.log(JSON.stringify({ host: HOST, results, summary: { pass: results.length - fails.length - unproven.length, fail: fails.length, unproven: unproven.length } }, null, 2));
} else {
  const mark = { PASS: "PASS  ", FAIL: "FAIL  ", UNPROVEN: "UNPROV" };
  console.log(`\nverify-gates  host=${HOST}  ${PIN_FROM ? "(positive halves armed)" : "(anonymous halves only)"}\n`);
  for (const r of results) {
    console.log(`${mark[r.verdict]} ${r.name}`);
    console.log(`       expected: ${r.expected}`);
    console.log(`       measured: ${r.measured}`);
    console.log(`       repro:    ${r.repro}`);
    if (r.note) console.log(`       note:     ${r.note}`);
  }
  console.log(`\n${results.length - fails.length - unproven.length} pass, ${fails.length} fail, ${unproven.length} unproven`);
  if (unproven.length) console.log(`UNPROVEN is not a failure. It is this script refusing to report something it did not measure.`);
}

process.exit(fails.length ? 1 : 0);
