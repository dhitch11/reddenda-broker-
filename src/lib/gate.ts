/**
 * THE ENTRY GATE — SERVER SIDE, AND IT HAS TO BE.
 *
 * David asked for a PIN at the entrance to broker.reddenda.com so nobody can get
 * onto it without one. This file is the crypto behind that, and the reason it is
 * shaped this way is a real incident on this estate, not caution.
 *
 * A CSS-only "PIN gate" guarded an internal page here for weeks and guarded
 * nothing: it rendered "Enter the PIN" over a hidden wrapper while the server
 * shipped the entire 303,451-byte document to any anonymous curl. THE RULE THAT
 * CAME OUT OF IT: if the bytes reach the browser, the page is public. So the gate
 * lives in middleware and rejects before a page is ever rendered. Nothing here is
 * enforced in the client, and no page component may assume otherwise.
 *
 * WHY AN HMAC AND NOT A FLAG COOKIE
 * A cookie like `unlocked=1` is forgeable by anyone who opens devtools once. The
 * cookie we set is `<expiry>.<hmac(expiry)>`, signed with GATE_SECRET, so it can be
 * read but not minted. The expiry is inside the signed payload, which means it
 * cannot be extended by editing the cookie.
 *
 * WHY WEB CRYPTO AND NOT node:crypto
 * Middleware runs on the edge runtime, where node:crypto is unavailable. Web Crypto
 * is present in both runtimes, so this one module serves the middleware and the
 * route handler and there is no second implementation to drift.
 *
 * THE PIN AND THE SECRET ARE ENV-ONLY. Never inline them, never log them, never
 * commit them, never put them in a client component or a page's props.
 */

const enc = new TextEncoder();

/** Cookie name. Short, opaque, says nothing about what it unlocks. */
export const GATE_COOKIE = "csnd_entry";

/** How long one successful entry lasts. Long enough to survive a live demo. */
export const GATE_TTL_SECONDS = 60 * 60 * 24 * 30;

function keyMaterial(): string {
  const secret = process.env.GATE_SECRET;
  if (!secret || secret.length < 16) {
    // Fail CLOSED. A missing secret must never mean "everyone is allowed in" —
    // that is the exact fail-open shape that has produced this estate's worst defects.
    throw new Error("GATE_SECRET missing or too short; refusing to run an unsigned gate");
  }
  return secret;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(keyMaterial()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time comparison. A plain `===` on a secret leaks its prefix through
 * timing; with a 6-digit PIN that is a small leak, but the fix costs nothing.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Mint a signed token that expires. */
export async function mintToken(): Promise<string> {
  const expiry = String(Date.now() + GATE_TTL_SECONDS * 1000);
  return `${expiry}.${await hmac(expiry)}`;
}

/** Verify a token. Returns false for anything malformed, forged or expired. */
export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const expiry = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(expiry)) return false;
  let expected: string;
  try {
    expected = await hmac(expiry);
  } catch {
    return false; // no secret configured -> nobody gets in
  }
  if (!safeEqual(sig, expected)) return false;
  return Number(expiry) > Date.now();
}

/** Check a submitted PIN against the configured one. Fails closed if unset. */
export function pinMatches(submitted: string): boolean {
  const real = process.env.SITE_PIN;
  if (!real) return false;
  return safeEqual(submitted.trim(), real.trim());
}
