/**
 * PER-IP ATTEMPT LIMITING FOR THE PRACTICE-AUDIO DOOR.
 *
 * ⛔ WHY THIS FILE EXISTS: THE COMMENT IT REPLACES WAS WRONG BY TWO ORDERS OF MAGNITUDE.
 *
 * `enter/route.ts` used to say: "Six digits is 1,000,000 possibilities, which a script
 * can walk in minutes over a fast endpoint. A flat ~400ms on every attempt, right or
 * wrong, turns that into weeks."
 *
 * It does not. A per-request sleep is not a rate limit, because nothing makes the
 * requests take turns. @BRK-HELP measured it on 2026-08-29 against live prod: twenty
 * concurrent attempts finished in 5.20s, where twenty serialised 400ms attempts have a
 * floor of 8.00s. The sleeps overlapped. At a concurrency of fifty a single laptop walks
 * 1,000,000 codes in about two hours, not weeks, and there was no counter of any kind to
 * notice it happening.
 *
 * That is the estate's own recurring shape: a control that looks like a control, is
 * described in a comment as a control, and gates nothing when measured. It is the fail
 * open family, wearing a delay instead of a 200.
 *
 * ═══ WHAT THIS ACTUALLY DOES ═══════════════════════════════════════════════════
 *
 * 1. IT SERIALISES PER IP. Attempts from one address queue behind each other on a
 *    promise chain, so the 400ms floor the old comment assumed is now real for a single
 *    source. MEASURED by scripts/check-attempt-limit.mjs: twenty concurrent attempts from
 *    one address take 30.8s and eight of them are refused outright, against 5.2s and zero
 *    refusals on prod before this. Twenty from twenty DIFFERENT addresses still take
 *    401ms, so the queue does not turn into a denial of service on ordinary visitors.
 * 2. IT COUNTS, AND IT BACKS OFF. Each failure from an address raises that address's
 *    delay geometrically to a ceiling, then locks it out entirely.
 * 3. IT KEEPS A GLOBAL FLOOR. A distributed attempt spread over many addresses trips a
 *    site-wide slowdown even though no single address looks abusive.
 * 4. A SUCCESS CLEARS THAT ADDRESS. One person typing their own code wrongly twice is
 *    not an attacker, and pays nothing once they get it right.
 *
 * ═══ WHAT IT HONESTLY DOES NOT DO ══════════════════════════════════════════════
 *
 * THIS STATE IS PER FUNCTION INSTANCE AND IT IS LOST ON A COLD START. Netlify runs many
 * instances and recycles them, so an attacker with real distribution gets more attempts
 * than the numbers below suggest, and the global floor is a per-instance floor. Saying
 * otherwise would repeat the exact mistake this file was written to correct.
 *
 * The durable version is a shared counter (a Supabase table keyed on address, or the
 * CDN's own rate limiting). That is a cross-lane change and a schema change; this is the
 * in-process control, matching the pattern already used by `/api/services`, and it turns
 * a two-hour offline walk into something that cannot be done quietly from one machine.
 * The real ceiling on this door is that the code is not six digits' worth of guessable
 * on its own: it is one page, for one person, for one conference day.
 */

/** The floor every attempt pays, right or wrong, so a correct code is not faster than a wrong one. */
export const BASE_DELAY_MS = 400;

/** After this many failures from one address, that address starts paying geometrically. */
const FREE_FAILURES = 3;

/** Each failure past the free ones doubles the wait, up to here. */
const MAX_DELAY_MS = 4_000;

/** Past this many failures an address is refused outright until its window rolls. */
const LOCKOUT_AFTER = 12;

/** How long an address's record lives with no activity. A window, not a ban. */
const WINDOW_MS = 15 * 60 * 1000;

/** Beyond this many failures across ALL addresses in a window, everyone pays the ceiling. */
const GLOBAL_ALARM = 60;

/** Hard cap on tracked addresses, so a spray of forged headers cannot grow this without bound. */
const MAX_TRACKED = 5_000;

type Record_ = { failures: number; last: number; chain: Promise<void> };

const seen = new Map<string, Record_>();
let globalFailures = 0;
let globalWindowStart = Date.now();

function sleep(ms: number): Promise<void> {
  return ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();
}

function sweep(now: number): void {
  for (const [k, v] of seen) if (now - v.last > WINDOW_MS) seen.delete(k);
  /* If a spray outran the sweep, drop the oldest rather than grow forever. An attacker
     who can forge 5,000 addresses can already outrun any per-address scheme; the point
     here is that our own memory is not the thing that fails first. */
  if (seen.size > MAX_TRACKED) {
    const oldest = [...seen.entries()].sort((a, b) => a[1].last - b[1].last);
    for (let i = 0; i < oldest.length - MAX_TRACKED; i++) seen.delete(oldest[i][0]);
  }
  if (now - globalWindowStart > WINDOW_MS) {
    globalWindowStart = now;
    globalFailures = 0;
  }
}

/**
 * The caller's address, from the headers a CDN actually sets.
 *
 * `x-nf-client-connection-ip` is Netlify's own and is not settable by the client.
 * `x-forwarded-for` IS client-settable when nothing upstream overwrites it, so it is a
 * fallback and only its FIRST hop is read. An address we cannot determine is treated as
 * one shared bucket rather than as unlimited: unknown callers throttle each other, which
 * is the failing-closed direction.
 */
export function callerKey(headers: Headers): string {
  const nf = headers.get("x-nf-client-connection-ip");
  if (nf) return nf.trim();
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

export type AttemptSlot = {
  /** False when this address is locked out. The caller must not even check the code. */
  allowed: boolean;
  /** Call after the code has been checked, with the verdict. Resolves when the slot is released. */
  settle: (ok: boolean) => Promise<void>;
};

/**
 * Take a slot for one attempt from `key`.
 *
 * Awaiting this queues behind any other in-flight attempt from the same address, which
 * is the whole point: the delay only limits anything if the attempts take turns.
 */
export async function takeSlot(key: string): Promise<AttemptSlot> {
  const now = Date.now();
  sweep(now);

  const rec = seen.get(key) ?? { failures: 0, last: now, chain: Promise.resolve() };
  rec.last = now;
  seen.set(key, rec);

  /* Queue behind this address's previous attempt. */
  const priorDone = rec.chain;
  let release!: () => void;
  rec.chain = priorDone.then(() => new Promise<void>((r) => (release = r)));
  await priorDone;

  if (rec.failures >= LOCKOUT_AFTER) {
    /* REFUSE IMMEDIATELY, DO NOT SLEEP. Measured 2026-08-29: sleeping the ceiling here as
       well held the address's queue for the whole refusal, and twenty concurrent attempts
       from one address took 117 SECONDS of function time. That is not a limiter, it is us
       paying an attacker's bill and blocking the queue behind them. The lockout IS the
       cost; adding a sleep to it only spends our own runtime. */
    release();
    return { allowed: false, settle: async () => {} };
  }

  return {
    allowed: true,
    settle: async (ok: boolean) => {
      if (ok) {
        rec.failures = 0;
      } else {
        rec.failures += 1;
        globalFailures += 1;
      }
      const over = Math.max(0, rec.failures - FREE_FAILURES);
      const perAddress = over === 0 ? BASE_DELAY_MS : Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** over);
      const floor = globalFailures >= GLOBAL_ALARM ? MAX_DELAY_MS : BASE_DELAY_MS;
      await sleep(Math.max(perAddress, floor));
      release();
    },
  };
}

/** Test seam. Never called by the route. */
export function __resetForTests(): void {
  seen.clear();
  globalFailures = 0;
  globalWindowStart = Date.now();
}
