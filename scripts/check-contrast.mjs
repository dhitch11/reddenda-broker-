#!/usr/bin/env node
/**
 * Contrast validator for the token layer.
 *
 * WCAG 2.1 relative luminance and contrast ratio, computed from the hex values
 * actually declared in src/app/globals.css. It parses the file rather than taking
 * a hardcoded copy of the palette, so a token edited without re-running this is
 * caught the next time it runs.
 *
 * Why this exists: the ratios in the CSS comments started life as my own mental
 * arithmetic. This estate's standing law is that the instrument is the thing most
 * likely to be wrong, and a contrast claim in a comment is a claim about a
 * measurable property. Measure it.
 *
 *   node scripts/check-contrast.mjs
 *
 * Exit 1 if any pair declared as text fails its required ratio.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "src/app/globals.css"), "utf8");

/** Pull `--name: #HEX;` declarations straight out of the stylesheet. */
function tokens(source) {
  const out = {};
  const re = /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g;
  let m;
  while ((m = re.exec(source)) !== null) out[m[1]] = m[2].toUpperCase();
  return out;
}

function srgbToLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const T = tokens(css);

/**
 * Every pair the design system actually uses, with the bar it must clear.
 *   "small" 4.5   body copy and anything under 24px, or under 19px at 700
 *   "large" 3.0   24px+, or 19px+ at 700
 *   "ui"    3.0   borders, focus rings, icons, chart marks
 *   "none"  0     documented as decorative, must never carry text
 */
const PAIRS = [
  ["ink", "paper", "small", "headlines"],
  ["body", "paper", "small", "body copy"],
  ["muted", "paper", "small", "secondary copy"],
  ["faint", "paper", "small", "tertiary copy"],
  ["ghost", "paper", "none", "rules and ticks, NON-TEXT"],
  ["teal", "paper", "none", "fills and glows, NON-TEXT"],
  ["teal-mid", "paper", "large", "large display teal only"],
  ["teal-deep", "paper", "small", "links and small teal text"],
  ["exposure", "paper", "small", "the expensive tail"],
  ["efficient", "paper", "small", "the efficient end"],
  ["spread", "paper", "small", "the spread figure"],
  ["locked", "paper", "small", "gated depth label"],
  ["body", "band", "small", "body copy on a section band"],
  ["muted", "band", "small", "secondary on a section band"],
  ["muted", "sunken", "small", "the honest empty state"],
  ["body", "elev", "small", "stat card value"],
  ["ink", "teal-wash", "small", "copy on a tinted surface"],
  ["exposure", "exposure-wash", "small", "cost figure on its wash"],
  ["efficient", "efficient-wash", "small", "efficient figure on its wash"],
  ["spread", "spread-wash", "small", "spread figure on its wash"],
  ["locked", "locked-wash", "small", "locked label on its wash"],
  ["pro-ink", "pro-alt", "small", "PRO chip ink on its gradient midpoint"],
];

const BAR = { small: 4.5, large: 3.0, ui: 3.0, none: 0 };

// The PRO chip is a gradient, so test its ink against the WORST stop, not an
// average. #14E09A is the darker of the two ends.
T["pro-alt"] = "#14E09A";

let failed = 0;
const rows = [];

for (const [fg, bg, level, note] of PAIRS) {
  const a = T[fg];
  const b = T[bg];
  if (!a || !b) {
    rows.push([`${fg} on ${bg}`, "MISSING", "-", "-", `token not found in globals.css`]);
    failed++;
    continue;
  }
  const r = ratio(a, b);
  const bar = BAR[level];
  const pass = r >= bar;
  if (!pass) failed++;
  rows.push([
    `${fg} on ${bg}`,
    `${a} / ${b}`,
    `${r.toFixed(2)}:1`,
    level === "none" ? "decorative" : `${pass ? "PASS" : "FAIL"} ${level} ${bar}`,
    note,
  ]);
}

const w = (s, n) => String(s).padEnd(n);
console.log("");
console.log("CONTRAST . measured from src/app/globals.css");
console.log("=".repeat(104));
console.log(w("PAIR", 28) + w("HEX", 20) + w("RATIO", 10) + w("VERDICT", 18) + "NOTE");
console.log("-".repeat(104));
for (const r of rows) console.log(w(r[0], 28) + w(r[1], 20) + w(r[2], 10) + w(r[3], 18) + r[4]);
console.log("=".repeat(104));

if (failed) {
  console.log(`\n${failed} pair(s) failed. Fix the token or demote the pair to a level it clears.\n`);
  process.exit(1);
}
console.log(`\nAll ${rows.length} pairs clear their bar.\n`);
