#!/usr/bin/env node
/**
 * THE PRACTICE-AUDIO DOOR'S RATE LIMITER, MEASURED.
 *
 *   node --experimental-strip-types scripts/check-attempt-limit.mjs
 *
 * This exists because the control it tests was, until 2026-08-29, a comment claiming a
 * property the code did not have: "a flat 400ms turns 1,000,000 codes into weeks."
 * A per-request sleep is not a rate limit, and @BRK-HELP measured twenty concurrent
 * attempts finishing in 5.20s on live prod against a serial floor of 8.00s.
 *
 * So every assertion below measures BEHAVIOUR under concurrency, not the presence of a
 * delay in the source. Both directions are checked: the limiter must slow ONE address
 * down, and it must NOT slow twenty different addresses down, because a limiter that
 * cross-blocks strangers is a denial of service we wrote ourselves.
 *
 * Takes about 35 seconds. It is supposed to: the thing under test is a delay.
 */
import { takeSlot, callerKey, BASE_DELAY_MS, __resetForTests } from "../src/lib/attempt-limit.ts";
const ms=()=>Number(process.hrtime.bigint()/1000000n);
async function attempt(key, ok){ const s=await takeSlot(key); if(!s.allowed) return "LOCKED"; await s.settle(ok); return "ok"; }

// 1. TWENTY CONCURRENT WRONG ATTEMPTS FROM ONE IP MUST SERIALISE
__resetForTests();
let t0=ms();
let r=await Promise.all(Array.from({length:20},()=>attempt("1.2.3.4",false)));
let elapsed=ms()-t0;
const locked=r.filter(x=>x==="LOCKED").length;
console.log(`20 concurrent from ONE ip : ${elapsed}ms, ${locked} refused outright`);
console.log(`   serial floor at base    : ${20*BASE_DELAY_MS}ms   -> ${elapsed>=20*BASE_DELAY_MS?"PASS (serialised)":"FAIL (overlapped)"}`);

// 2. TWENTY CONCURRENT FROM TWENTY DIFFERENT IPS MUST NOT SERIALISE (no self-DoS)
__resetForTests();
t0=ms();
await Promise.all(Array.from({length:20},(_,i)=>attempt("10.0.0."+i,false)));
elapsed=ms()-t0;
console.log(`20 concurrent from 20 ips  : ${elapsed}ms -> ${elapsed<2*BASE_DELAY_MS?"PASS (independent)":"FAIL (cross-blocked)"}`);

// 3. LOCKOUT ENGAGES
__resetForTests();
let outcomes=[];
for(let i=0;i<15;i++) outcomes.push(await attempt("9.9.9.9",false));
console.log(`15 sequential failures     : ${outcomes.filter(x=>x==="LOCKED").length} refused -> ${outcomes.includes("LOCKED")?"PASS (lockout engages)":"FAIL (never locks)"}`);

// 4. A SUCCESS CLEARS THE ADDRESS
__resetForTests();
for(let i=0;i<5;i++) await attempt("8.8.8.8",false);
await attempt("8.8.8.8",true);
t0=ms(); await attempt("8.8.8.8",false); const after=ms()-t0;
console.log(`delay after a success      : ${after}ms -> ${after<2*BASE_DELAY_MS?"PASS (counter cleared)":"FAIL (still escalated)"}`);

// 5. callerKey precedence + unknown
const h=(o)=>new Headers(o);
console.log(`callerKey nf wins          : ${callerKey(h({"x-nf-client-connection-ip":"5.5.5.5","x-forwarded-for":"1.1.1.1, 2.2.2.2"}))} -> ${callerKey(h({"x-nf-client-connection-ip":"5.5.5.5","x-forwarded-for":"1.1.1.1"}))==="5.5.5.5"?"PASS":"FAIL"}`);
console.log(`callerKey xff first hop    : ${callerKey(h({"x-forwarded-for":"1.1.1.1, 2.2.2.2"}))} -> ${callerKey(h({"x-forwarded-for":"1.1.1.1, 2.2.2.2"}))==="1.1.1.1"?"PASS":"FAIL"}`);
console.log(`callerKey no headers       : ${callerKey(h({}))} -> ${callerKey(h({}))==="unknown"?"PASS (shared bucket, fails closed)":"FAIL"}`);

console.log("\nEvery line above must read PASS. This is a behavioural test under real concurrency;\na grep for setTimeout in the route would have passed against the broken version too.");
