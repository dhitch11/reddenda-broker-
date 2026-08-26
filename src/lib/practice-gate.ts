/**
 * THE PRACTICE-AUDIO GATE.
 *
 * One private page, one recording, one founder. Everything in this module exists
 * because of a defect this estate has already shipped once and wrote a rule about.
 *
 * ⛔ THE RULE THIS FILE OBEYS (CLAUDE.md rule 9, from the /competitors incident):
 * a CSS "PIN gate" protected a page for weeks and protected nothing. The markup
 * rendered "Enter the PIN" over a `.wrap` at `display: none` while the server sent
 * the whole file: 303,451 bytes to any anonymous curl. **If the bytes reach the
 * browser, the page is public.** So the check here is server side, it decides
 * whether the bytes are ever written, and the audio is behind the same check
 * rather than beside it.
 *
 * ⛔ AND IT FAILS CLOSED. Every early return in `verify` is `false`. A missing
 * secret, a malformed cookie, a clock problem, a bad signature: all of them refuse.
 * The estate's worst defects have been fail-open controls returning a cheerful 200,
 * and a gate that opens when it is confused is not a gate.
 *
 * WHY WEB CRYPTO AND NOT `node:crypto`: this runs in middleware, which is an edge
 * runtime on Netlify. `node:crypto` is not available there. `crypto.subtle` is, and
 * it is available in the node runtime too, so one implementation serves both.
 *
 * WHY HMAC AND NOT "the cookie equals the PIN": a cookie carrying the PIN is the
 * PIN, readable in devtools and forwardable in a screenshot. The cookie here proves
 * that a correct PIN was presented to the server at a known time and proves nothing
 * else. It cannot be turned back into the PIN.
 */

export const PRACTICE_COOKIE = "rbk_practice";

/** Eight hours. Long enough for a conference day, short enough that a borrowed laptop forgets. */
const TTL_SECONDS = 8 * 60 * 60;

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const byte of b) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
}

/**
 * The secret, BY NAME ONLY, and never a literal in this repo.
 *
 * `PRACTICE_AUDIO_SECRET` first so this gate can be rotated without touching the
 * rest of the site; `GATE_SECRET` is the existing site-level name and is the
 * fallback. If neither is set, every caller of this module refuses, which is the
 * correct behaviour: an unsigned cookie is not a credential.
 */
function secret(): string | null {
  const s = process.env.PRACTICE_AUDIO_SECRET || process.env.GATE_SECRET;
  return s && s.length >= 16 ? s : null;
}

/** Mint the cookie value for a request that presented the right code. */
export async function mint(): Promise<string | null> {
  const s = secret();
  if (!s) return null;
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = String(exp);
  const sig = await crypto.subtle.sign("HMAC", await key(s), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

/**
 * Is this cookie value a real one that has not expired?
 *
 * Constant-time compare on the signature. A timing oracle on an eight-hour cookie
 * is a small risk, and writing the loop is cheaper than arguing about how small.
 */
export async function verify(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const s = secret();
  if (!s) return false;

  const dot = value.lastIndexOf(".");
  if (dot <= 0) return false;

  const payload = value.slice(0, dot);
  const given = value.slice(dot + 1);

  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return false;

  let expected: string;
  try {
    expected = b64url(await crypto.subtle.sign("HMAC", await key(s), enc.encode(payload)));
  } catch {
    return false;
  }

  if (expected.length !== given.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

/**
 * Does this submitted code open the gate?
 *
 * The code lives in the environment under `PRACTICE_AUDIO_PIN`, never in this
 * repository. A code committed to a git remote is a code in every clone of that
 * remote forever, and rule 10 is explicit that secrets are referred to by name.
 * No fallback: if the variable is unset the page refuses everybody, loudly, rather
 * than quietly accepting a default that someone could guess.
 */
export async function opens(code: string | undefined | null): Promise<boolean> {
  const want = process.env.PRACTICE_AUDIO_PIN;
  if (!want || !code) return false;
  if (want.length !== code.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ code.charCodeAt(i);
  return diff === 0;
}

/** True when the environment can actually run this gate. Used to refuse rather than to explain. */
export function configured(): boolean {
  return Boolean(secret() && process.env.PRACTICE_AUDIO_PIN);
}
