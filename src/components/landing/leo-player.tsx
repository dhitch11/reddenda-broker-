/**
 * COMPATIBILITY SHIM, @BROKER-AUDIO 2026-08-26.
 *
 * The player was renamed to hero-audio by David's order (the pitch is no longer
 * "Leo the story"; it is the hero pitch). The real component lives in
 * ./hero-audio.tsx + ./hero-audio-transport.tsx. This file exists only so the
 * hero's current `import { LeoPlayer } from ".../leo-player"` keeps resolving
 * until @BROKER-MARKETING swaps that one import per the contract in
 * ~/.broker-fleet/FINDINGS.md. When the import site says `hero-audio`, delete
 * this file in the same commit.
 */
export { HeroAudio as LeoPlayer, default } from "./hero-audio";
