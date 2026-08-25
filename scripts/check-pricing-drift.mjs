#!/usr/bin/env node
/**
 * PRICING DRIFT GUARD.  Run before promoting:  node scripts/check-pricing-drift.mjs
 *
 * Stripe is the pricing authority, and repricing there is deliberately a no-deploy
 * operation. That is a good property for the app, which resolves live at request time,
 * and a hazard for this marketing site, which prints the numbers into static HTML. The
 * failure it creates is silent by construction: the page keeps serving 200 and keeps
 * advertising a price the checkout will not honour.
 *
 * So this resolves every lookup_key in src/lib/pricing-ladder.ts against LIVE Stripe and
 * compares the integer cent amount and the billing interval. It does not compare strings,
 * because "$1,490" and 149000 are not the same kind of thing and only one of them is what
 * a customer is charged.
 *
 * Credentials by name: STRIPE_RESTRICTED_KEY, from ~/.reddenda/stripe.env. Read-only, and
 * no key value is ever printed by this script, including on failure.
 *
 * Exit 0 = every displayed price matches live Stripe. Exit 1 = do not promote.
 * Exit 2 = could not ask Stripe, which is NOT a pass. An unanswerable question about
 * money is reported as unanswered rather than waved through.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "src", "lib", "pricing-ladder.ts"), "utf8");

/* Parsed out of the module rather than imported, so this script stays dependency-free and
   runs without a TypeScript loader in any deploy shell. */
const plans = [...src.matchAll(
  /lookupKey:\s*"([^"]+)",\s*display:\s*"([^"]+)",\s*unitAmount:\s*(\d+),\s*interval:\s*(?:"(month|year)"|null)/g
)].map((m) => ({ lookupKey: m[1], display: m[2], unitAmount: Number(m[3]), interval: m[4] ?? null }));

if (!plans.length) {
  console.error("DRIFT GUARD: parsed ZERO plans out of pricing-ladder.ts. The file shape changed; fix this script rather than skipping the check.");
  process.exit(2);
}

const key = process.env.STRIPE_RESTRICTED_KEY || process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("DRIFT GUARD: no Stripe key in the environment (STRIPE_RESTRICTED_KEY or STRIPE_SECRET_KEY).");
  console.error("  set -a; . ~/.reddenda/stripe.env; set +a   then run again.");
  process.exit(2);
}

const params = new URLSearchParams({ active: "true", limit: "20" });
for (const p of plans) params.append("lookup_keys[]", p.lookupKey);

let rows;
try {
  const r = await fetch(`https://api.stripe.com/v1/prices?${params}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}` },
  });
  const j = await r.json();
  if (!r.ok || j.error) {
    console.error(`DRIFT GUARD: Stripe refused the request (HTTP ${r.status}). ${j?.error?.message ?? ""}`);
    process.exit(2);
  }
  rows = j.data ?? [];
} catch (e) {
  console.error(`DRIFT GUARD: could not reach Stripe. ${String(e).slice(0, 140)}`);
  process.exit(2);
}

const live = new Map(rows.filter((r) => r.lookup_key).map((r) => [r.lookup_key, r]));
const problems = [];

for (const p of plans) {
  const r = live.get(p.lookupKey);
  if (!r) { problems.push(`${p.lookupKey}: NOT FOUND as an active price in Stripe. The page advertises ${p.display} for a plan that cannot be bought.`); continue; }
  if (Number(r.unit_amount) !== p.unitAmount) {
    problems.push(`${p.lookupKey}: page says ${p.display} (${p.unitAmount} cents), Stripe charges ${r.unit_amount} cents. The page is advertising a price the checkout will not honour.`);
  }
  const liveInterval = r.recurring?.interval ?? null;
  if (liveInterval !== p.interval) {
    problems.push(`${p.lookupKey}: page says ${p.interval ?? "one time"}, Stripe says ${liveInterval ?? "one time"}.`);
  }
}

if (problems.length) {
  console.error(`DRIFT GUARD FAIL: ${problems.length} price(s) disagree with live Stripe. DO NOT PROMOTE.\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error("\nFix src/lib/pricing-ladder.ts to match Stripe, or fix Stripe. Stripe wins.");
  process.exit(1);
}

console.log(`DRIFT GUARD PASS. ${plans.length} published prices match live Stripe by lookup_key:`);
for (const p of plans) console.log(`  ${p.lookupKey.padEnd(24)} ${p.display.padEnd(8)} ${p.interval ?? "one time"}`);
