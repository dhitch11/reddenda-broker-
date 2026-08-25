# THE FULL PICTURE — REDDENDA BROKER ESTATE
**Compiled by an independent auditor. Every claim below is measured by me at 2026-08-07 20:31–20:33 UTC, or cited to a file:line / commit / claims-file line.**

**Three corrections to the briefing I was given, up front:**
1. **"The 301s are committed but not deployed" is FALSE.** All three return **308 to the console right now**, authenticated. Section 5 is a post-hoc GO, not a decision.
2. **@BROKER-CONVERT is no longer at zero lines.** `src/app/broker/tools/my-rate/` now holds **4 files, 53,344 B** (`Combobox.tsx`, `MyRate.tsx`, `parse.ts`, `placement.ts`), mtimes 13:25–13:30 PDT. **Untracked — not in git.**
3. **The homepage canon violation is 6 classes, not 1.** See §4.

---

## 1. THE BOARD

| Lane | Alive? | Shipped | Doing now | Next | Owns |
|---|---|---|---|---|---|
| **@BROKER-TOOLS** `b21483e9` | ✅ **HOT** — newest commit `1bb1651` | The whole console (9 routes, all 200 authed, titles verified), 15 `lib/broker` modules, `hybridBrief()`, the 3 CTA→console 301s (`8cb3bb0`), provider detail, the 8s post-PIN overture | Saved views; just landed `1bb1651` "metros.ts npis was not a provider count. Sacramento read 17. It is 70,569" | Saved views (`broker_saved_views`, spec'd in `docs/HANDOFF-DATA-CONSOLE.md §7.1`, unimplemented); network-view workspace inheritance | `reddenda-app/src/lib/broker/**`, `src/app/broker/console/**`, `src/app/broker/api/**`, `src/components/broker/**`; `reddenda-broker/next.config.ts` |
| **@BRAND-DOMAIN** `d62737ad` | ⚠️ **IDLE since 20:03Z** (~2.5h) | Brand (Censenda), the PIN gate, the DNS cutover, 15 marketing commits incl. the craft layer `4f931bb` + mobile 44px `1fb95ae`, 6 broker promotes | Nothing. Awaiting David | Three role pages, GA console preview, three-door role switch — all spec'd, none started | `reddenda-broker` marketing: `page.tsx`, `globals.css`, `middleware.ts`, `lib/gate.ts`, `enter/*`, `components/marketing/*`; **the Namecheap zone + the broker Netlify site** |
| **@BROKER-LAUNCH** `fbaf78b0` | ❌ **DEAD since 17:30Z** (3h) | The app-side PIN gate (`ffa4645` — `/broker/*` had **none**), 928-metro national engine, opportunity model, IDR/OON, the 670→7,647 catalog, **pushed 13 commits of five lanes' work to GitHub** | Nothing | — | `src/demo/national*.ts/json`, `lib/broker/{resolve,opportunity,idr}.ts`, `lib/gate.ts`, `proxy.ts`, `broker/tools/{national,opportunity,out-of-network}` |
| **@DATA-BROKER** `a64c79a8` | ⚠️ **IDLE since 16:58Z** | Eficens last mile unblocked (3 independent faults), 7,019,946-cell engine, `ca-locality.json` (4.74 MB), the ghost-rate ruling, the `fac_rate` reversal | Nothing. Holding a promote request the conductor already fulfilled without telling it | `peer_rate_dist` rebuild (its own stated #1); post the peer swap when `peer_swap_READY.sql` lands | `reddenda-broker/src/demo/{engine,book,index,seed/*}`, `scripts/*.mjs`, **the OVH box + ClickHouse `tic.*` + Supabase read authority** |
| **@BROKER-CANON** `11d75041` | ❌ **DEAD since 17:31Z** | `scripts/verify-canon.mjs` (the estate's only live-surface canon instrument), the provenance strip `94e0ed8`, `deploy-isolated.sh`, the 7,647-code `ServicePicker`, committed the PIN gate that was staged-but-absent from HEAD | Nothing | Jargon class for the canon rig — **never started** | `verify-canon.mjs`, `deploy-isolated.sh`, `lib/national.ts`, `api/services/route.ts`, `ServicePicker.tsx` |
| **@BROKER-MARKETING** `265014b1` | ❌ **DEAD 22h** (last record 2026-08-06T22:35Z) | 7 marketing pages, the 4,641-page `/rates` surface, `verify-marketing.mjs`, `NEXT_DIST_DIR`, the ghost-rate alarm | Nothing. **Three lanes are still addressing it in the claims file** | — | `methodology/page.tsx` (**untouched since `541f07c` — the only file still as it left it**), `rates/**`, `components/marketing/**`, `sitemap.ts` |
| **@BROKER-CONVERT** `3c0a7582` | ✅ **HOT** | 3 claims-only commits; retracted a false Futureful deploy alarm with proof | **BUILDING** — `my-rate/` is 4 files / 53 KB on disk as of 13:30 PDT | GA seats + adoption telemetry (`ga-console/`, `lib/broker/telemetry/` — both still absent) | `broker/tools/my-rate/**` (untracked), `ga-console/**`, `lib/broker/telemetry/**` |
| **@AUTISM-SPECTRUM** `e08c891f` | ✅ alive | **NOT A BROKER LANE.** FutureFul, `/Users/user/smi-works` | — | — | Nothing in either broker repo. **Do not assign it broker work; it has denied ownership twice in writing** |

---

## 2. COLLISIONS AND DUPLICATION

**① TWO NATIONAL PRICING ENGINES SHIP TOGETHER IN `reddenda-app`, WIRED TO DIFFERENT ROUTES.**
- `/broker/api/{national,oon,opportunity}` → `src/demo/national.ts` (**928 metros**, @BROKER-LAUNCH)
- `/broker/api/{lookup,brief}` → `demo-engine.ts` + `hybrid.ts` (**~668–673 metros**, @BROKER-TOOLS)
A broker gets **one price for a city+service in National Explorer and a different one in Rate Check.** @BROKER-LAUNCH volunteered to fold its work in at 16:17Z and was never answered; it is now dead.
**YIELD: @BROKER-LAUNCH is dead — @BROKER-TOOLS must absorb it unilaterally**, carrying three things the dead lane named: 928 metros not 668, the dispersion fix, the volume floors. This is not negotiable coordination any more; it is a merge with a corpse.

**② `/broker/console/brief` AND `/broker/tools/market-brief` ARE DIFFERENT COMPONENTS.**
Measured: `src/app/broker/console/brief/page.tsx:1` imports `@/components/broker/MarketBrief`. The explainer fix (`e5ce768`) landed on `src/app/broker/tools/market-brief/MarketBrief.tsx`. `grep -rl ToolExplainer src/` returns exactly **3 files**, and the console component is not one of them.
**Consequence: anyone checking "is market-brief done?" on the legacy URL sees ✅ and is wrong about the demo surface.**
**YIELD: @BROKER-TOOLS owns `components/broker/` — either import the tools/ component or port the explainer. One file.**

**③ `src/demo/index.ts` — THREE-WAY DEADLOCK, BOTH REPOS.**
`reddenda-broker`: ` M src/demo/index.ts` (+30 lines, @BROKER-TOOLS's type declarations in @DATA-BROKER's file). @DATA-BROKER refuses to commit another lane's work; @BROKER-CONDUCTOR asked twice (`broker/.terminal-claims.md:2707`, `:2862`); @BROKER-TOOLS never actioned. Meanwhile `src/app/demo/book/page.tsx:31` is **in HEAD** and reads `d.ga_book` / `d.employer_groups`. **A clean checkout fails typecheck.**
`reddenda-app`: `src/demo/index.ts` is **staged, 119 lines, never committed**, and is imported by three shipped API routes.
**YIELD: @BROKER-TOOLS commits both, today. It authored the lines. The deadlock is politeness costing the estate a broken clean build.**

**④ SACRAMENTO MEDICARE LOCALITY MAP — @BROKER-CONVERT vs @DATA-BROKER.**
`HANDOFF-DATA-CONSOLE §6` was written for @DATA-BROKER; @BROKER-CONVERT offered to take it if unclaimed and got no broker reply. @DATA-BROKER already built `src/demo/seed/ca-locality.json` (**4.74 MB, Sacramento = locality 63, MAC 0111263**) in `7242cad`.
**YIELD: @BROKER-CONVERT stands down on the map — the data exists. What it actually needs is that file wired into the app-side console, which is a `lib/broker` change owned by @BROKER-TOOLS.**

**⑤ Shared marketing files.** `reddenda-broker/src/app/page.tsx` has taken +344/−26 from **at least four sessions** since @BROKER-MARKETING's `541f07c`; `globals.css` +388. The `:19` ownership claim is fiction (see §3).

---

## 3. GAPS — WORK NOBODY OWNS

| # | Gap | Abandoned by | Evidence |
|---|---|---|---|
| **G1** | **`reddenda-broker` HAS NO GIT REMOTE.** `git remote -v` → **empty**. 54+ commits, plus **untracked** `docs/ADDENDUM-A-DESIGN.md` (409,772 B), `WARROOM-ADVERSARIAL.md` (87,219 B), `WARROOM-BUILD-PLAN.md`, `WARROOM-GAPS.md`, `AGENTS.md`, `CLAUDE.md` | Escalated by 3 lanes, taken by none — **all three correctly declined to spend David's account** | Mitigation exists and is CURRENT: `/Users/user/_backups/reddenda-broker-b0c7a1d-refreshed.bundle`, 2,692,807 B, **13:26 PDT, ref = HEAD `b0c7a1d`**. Survives `git clean`. Does not survive the laptop |
| **G2** | **@BROKER-MARKETING IS DEAD AND UNCLAIMED.** Its files are being edited by four other sessions while three lanes post questions addressed to it | @BROKER-MARKETING, dead 22h | `broker/.terminal-claims.md:2183`, `:2055`, `:2216` all address a lane that will never answer |
| **G3** | **`methodology/page.tsx` is orphaned AND non-compliant.** The one marketing file untouched since `541f07c`; ships `45 CFR 147.212` (l.66), `Health Affairs Scholar 3(11):qxaf212, 2025` (l.182), `CRS R48570` (l.183). @BROKER-CANON hardcoded it EXEMPT at `verify-canon.mjs:85`, asked for ratification **3×**, never got it — and the conductor's only statement on the subject (`:2776`) says the **opposite** | @BROKER-CANON (dead) | An unratified policy enforced by a tool nobody runs, over a file whose owner is dead |
| **G4** | **`netlify.toml` / `tsconfig.json` shared publish dir — named root cause of BOTH outages.** Claims file literally records the owner as *"Still nobody's"* | never claimed | `broker/.terminal-claims.md:4213`. `tsconfig.json` is ` M` uncommitted right now |
| **G5** | **7 QA sweeps produced 70 typed defects (6 P0, 25 P1, 28 P2, 11 P3). One reached the claims file.** 64+ defects exist only inside a transcript | unassigned | app claims rel-288 |
| **G6** | **The acquisition handoff nobody took**: `opengraph-image.tsx` for the 4,641 `/rates` pages (forwarded links currently unfurl blank) + 39 service explainers. Posted `:442-455`, `find src -name 'opengraph-image*'` → **nothing** | @BROKER-MARKETING (dead) | The 4,641-page surface is also **frozen** by the conductor at `:774` pending the ghost-rate ruling |
| **G7** | **`peer_rate_dist` rebuild** — @DATA-BROKER's own stated #1 highest-leverage build, twice. 8.7% scoreable, 1.8% high-confidence, stale since 07-14, both refresh crons `active=false` | @DATA-BROKER (idle) | This is the **real** product, not the demo |
| **G8** | **OVH pipeline is unwatched.** PHASE 3 at 10.2h against a published ~3.5h, no `peer_swap_READY.sql`, `eficens_merge.log` and `eficens_serve.log` **do not exist** — those hops have never fired. 547M rows + the percentage-contamination cure sit behind it | @DATA-BROKER stopped watching ~15:40Z | Only that lane has the box |
| **G9** | Raw CMS descriptors: typing "colon" returns *"Partial removal of colon"* **5×** (44140/44141/44143/44144/44145). 39 curated, 7,608 raw | handed off by @BROKER-CANON, accepted by nobody | Still present live |
| **G10** | Keyboard-inoperable comboboxes on rate-check (WCAG 2.1.1 Level A). @BROKER-LAUNCH had a drop-in ARIA `MetroPicker` ready, offered twice, died waiting | @BROKER-LAUNCH (dead) | Never verified fixed |

---

## 4. CONTRADICTIONS WITH DAVID'S RULINGS

### 🔴 P0 — THE HOMEPAGE VIOLATES RULINGS 2 AND 3 IN VISIBLE TEXT, ON THE FRONT DOOR

> **Ruling 2:** *"NO measurement/provenance language. No filing counts as evidence, no 45 CFR citations, no dated stamps."*
> **Ruling 3:** *"Banned unless glossed: CPT, CBSA, percentile, median, p25/p50/p90, ASC, HOPD."*

I stripped `<script>`/`<style>` from the served `broker.reddenda.com/` (233,692 B → **20,334 chars of visible text**) and measured:

| Violation | Live visible string |
|---|---|
| Filing count as evidence | `every carrier · 100,870 filings behind this median` |
| Filing count + `n=` + percentile | `$187 to $1,095 · 25th to 75th percentile · n = 100,870 filings` |
| Percentile (unglossed) | `90th percentile $1,605 · What the expensive end costs` |
| CPT (unglossed) | `Brain MRI · Los Angeles-Long Beach-Anaheim, CA · CPT 70553` |
| CBSA (unglossed) | `Metro level, CBSA 31080.` |
| Median (unglossed, ×6) | `Medicare $187 · 25th $498 · Median $1,095 · 75th $1,605 · 90th` |

**This is a regression, not an oversight.** @BROKER-CANON stripped exactly this class in `94e0ed8` (09:50) and `6b0b33c` (09:56) and shipped a verifier that bans `/\b[\d]{1,3}(,[\d]{3})+\s+filings\b/i` (`verify-canon.mjs:116`). @BRAND-DOMAIN re-introduced it in **`6269f86` (10:40), `1c1fe6f` (10:43), `25309db` (12:17), `43dddc9` (12:27)** — all four **after** the strip, and `1c1fe6f`'s commit message argues *for* it: *"100,870 is the one figure no competitor prints."*
Both lanes acted in good faith. Canon is dead, so it cannot re-run its own rig. **Nobody has run `verify-canon.mjs` except its author** — all 8 mentions in the 4,422-line claims file are canon's own.

The buyer for this page is *a CFO who does not know what a CPT code is.* The row reading `Medicare $187 · 25th $498 · Median $1,095 · 75th $1,605 · 90th` is unreadable to that person once, let alone at a glance.

### 🔴 P0 — RULING 4 IS SATISFIED ON **1 OF 9** CONSOLE TOOLS

> **Ruling 4:** *"Every tool carries an eye-in-circle explainer: what it is, what you get, 3 steps, ≤70 words."*

Measured live, authed, `grep -o 'aria-label="What [^"]*does"'` (matches `ToolExplainer.tsx:107`):

| route | eye |
|---|---|
| `/broker/console/rates` | ✅ **1** |
| `/broker/console` (Overview) | ❌ 0 |
| `/broker/console/brief` | ❌ 0 |
| `/broker/console/site-of-care` | ❌ 0 |
| `/broker/console/network` | ❌ 0 |
| `/broker/console/national` | ❌ 0 |
| `/broker/console/exhibit` | ❌ 0 |
| `/broker/console/settings` | ❌ 0 |
| `/broker/console/provider/[npi]` | ❌ 0 |

The open item in the claims file (`broker:4206`) names **5 tools**. On the surface actually being demoed the true number is **8 of 9**. And the three marketing pages that DO carry an explainer (`reddenda-broker/src/app/tools/{rate-check,market-brief,site-of-service}`) are now **behind 308s and unreachable** — the ruling that fixed the architecture also deleted half the compliance.

### 🟡 P2 — 55 CALENDLY LINKS PITCH AN NPI TO A BROKER AUDIENCE
7 each on `/`, `/methodology`, `/tools`, `/rates`; 9 each on `/brokers`, `/employers`, `/general-agencies`. All → `calendly.com/reddenda/discovery`, the **provider-side** discovery flow. A GA clicking "book a call" lands on a form asking about their practice's NPI.

### ✅ NOT VIOLATED — verified clean
- **Fabrication ruling**: no lane is asserting authenticity over fabricated figures. Canon killed all 5 criticals in `94e0ed8`; none have returned to `/`.
- **Console ruling 5**: fully satisfied — see §5.
- **Console tools are elementary**: I jargon-scanned all four demo console tools. `rates` = 1 `filings`, `national` = 2 `median`, `brief` and `site-of-care` = **clean**. The problem is the marketing homepage, not the tools.
- **No data leak**: every broker API on both hosts 401s to anon. No repeat of 08-03.

---

## 5. THE CONSOLE MIGRATION — **GO. IT ALREADY SHIPPED, AND IT IS HEALTHY.**

**The premise of the question is stale.** The redirects are not pending. Measured 20:31 UTC, authenticated with `csnd_entry` on both hosts:

```
/tools/rate-check       308 → https://app.reddenda.com/broker/console/rates      → 200  "Rates · Censenda"
/tools/market-brief     308 → https://app.reddenda.com/broker/console/brief      → 200  "Market brief · Censenda"
/tools/site-of-service  308 → https://app.reddenda.com/broker/console/site-of-care → 200 "Site of care · Censenda"
```

**All nine console routes return 200 with their real title, authenticated.** No redirect lands on a 404. `/broker/console/rates` is its own route, not an alias of `/broker/console`. `308` not `301` because Next's `permanent: true` emits 308 (`next.config.ts:20-22`, commit `8cb3bb0`).

**Why the brief said otherwise, and why every route sweep on this estate is blind:**
```
ANON  /broker/console/rates → 200 · 21,748 B · <title>Enter · Censenda</title> · $-figures: 0
AUTH  /broker/console/rates → 200 · 24,566 B · <title>Rates · Censenda</title>
```
**The gate rewrites; it does not redirect.** Same status, different body. Any sweep reading status codes measured the `/enter` page N times and reported "200, all good." Unauthenticated, `curl -sL /tools/rate-check` shows **hops=0** — the gate middleware fires before `next.config.ts` `redirects()`, so an anonymous observer cannot see the redirect at all. **Assert on `<title>`, never on status.**

### ⚠️ BUT — ONE DEFECT ON THE HAPPY PATH THAT IS NOT FILED ANYWHERE

**The 308 crosses a cookie boundary. A gated buyer is dumped on a second PIN wall.**

Both hosts set the **same cookie name, `csnd_entry`, host-scoped**:
```
broker.reddenda.com  csnd_entry=1788726231304.82d43af7…; Secure; HttpOnly; SameSite=lax
app.reddenda.com     csnd_entry=1788726231763.dc060f18…; Secure; HttpOnly; SameSite=lax
```
Measured — broker jar against the app console:
```
curl -b broker.jar https://app.reddenda.com/broker/console/rates
→ 200 · 21,748 B · <title>Enter · Censenda</title>
```
**A buyer PINs into `broker.reddenda.com`, clicks a tool CTA, is 308'd, and hits the PIN gate again on a different domain.** In a live demo that is the moment the room goes quiet. It appears in neither claims file.

**Fix options, cheapest first:** (a) append a one-time signed hand-off token to the redirect target that the app gate accepts and exchanges for its own cookie; (b) set the cookie on `.reddenda.com` with `Domain=` on both hosts (simplest, weakens isolation); (c) accept it and PIN both hosts before the demo — **do this today regardless, as insurance.**

**Dead code now safe to delete:** `reddenda-broker/src/app/tools/{rate-check,market-brief,site-of-service}/` are unreachable. The `:1053` warning *"do not delete before the 301 lands or something 404s"* is discharged — **the 301 has landed.** Deleting them removes 3 of the 6 explainer implementations on the estate, so **port the explainer to the console first, then delete** (see §6 steps 2 and 6).

---

## 6. THE SEQUENCE

### SHIP IN THE NEXT HOUR

**1. Strip the homepage back to David's ruling — @BRAND-DOMAIN** *(idle, owns `page.tsx`, and re-introduced it)*
Six visible strings on the front door break rulings 2 and 3. First position because it is the first surface any buyer sees, it is a **known regression of already-completed work**, and it is a copy change with no build risk. Then run `node scripts/verify-canon.mjs https://broker.reddenda.com` and post the result — nobody but its dead author has ever run it.

**2. Eye explainer on 8 console tools — @BROKER-TOOLS** *(hot, owns `console/**` and `components/broker/**`)*
Ruling 4 is met on 1 of 9. Start with `/broker/console/brief`, which is a **one-line import swap** (`components/broker/MarketBrief` → the tools/ component that already has it, or port `ToolExplainer` across). Second position because it is on the demo surface and it is mechanical.

**3. PIN both hosts before any demo, and file the cross-host gate — @BROKER-CONDUCTOR** *(you)*
Zero-cost insurance against the demo-breaking double gate. File it in both claims files so it stops being invisible. The real fix (hand-off token) is step 8.

**4. Commit the staged work in `reddenda-app` — @BROKER-TOOLS**
`src/app/page.tsx` (+13, replaces a hand-copied `CANONICAL_ICPS` with `resolveIcp()` — `behavioral_health` was being dropped) and `src/demo/index.ts` (+119, imported by three shipped API routes) are **staged, deployed, and absent from git history.** This is the exact pattern that 404'd `/demo/book`. Use `git commit --only <paths>` — the shared index also holds `_aetna.mjs`, `_smoke_idr_grain.mjs`, `.sentinel-state.evidence-2026-08-05` from other lanes.

**5. Commit `reddenda-broker/src/demo/index.ts` — @BROKER-TOOLS**
+30 lines of its own `DemoFixture` types, uncommitted; `src/app/demo/book/page.tsx:31` is in HEAD and reads them. **A clean checkout fails typecheck.** Flagged by name twice (`:2707`, `:2862`), unactioned. It is @BROKER-TOOLS's code in @DATA-BROKER's file — the author commits it.

**6. Delete the three dead `/tools/*` directories — @BROKER-TOOLS** *(after step 2, not before)*

### NEXT (today, not this hour)

**7. Merge the two national engines — @BROKER-TOOLS**
928 vs ~668 metros serving the same product from different routes. @BROKER-LAUNCH volunteered the merge and is dead; carry over its three named items. Same city, same service, two different prices in front of a broker is the single worst thing this demo can do.

**8. Cross-host gate hand-off token — @BROKER-TOOLS + @BRAND-DOMAIN** *(app gate + gate design)*

**9. Ratify or overrule the `/methodology` exemption — @BROKER-CONDUCTOR (you), one line**
`verify-canon.mjs:85` hardcodes `EXEMPT = ['/methodology','/privacy','/terms']`. Canon asked 3× and got nothing; your only statement on the subject (`:2776`) says the opposite. That page still ships `45 CFR 147.212`, a journal citation and a CRS number. **Its owner is dead. Rule, then assign.**

**10. Formally reassign @BROKER-MARKETING — @BROKER-CONDUCTOR**
Post the takeover. Three lanes are addressing a corpse.

**11. `git init` remote for `reddenda-broker` — needs David.** Bundle is current (`b0c7a1d`, 13:26) so this is no longer an emergency — but it is one laptop failure from erasing seven lanes' work plus 500 KB of untracked war-room docs. **Refresh the bundle after each milestone until David answers.**

**12. @BROKER-CONVERT: finish `my-rate`, then GA console.** Blocked on your ruling — see §7.

**13. @DATA-BROKER: go look at the OVH box.** PHASE 3 at 10.2h vs a published 3.5h, merge and serve logs nonexistent. 547M rows and the percentage-contamination cure are behind a rebuild nobody has watched in 5 hours. **This is the real product, not the demo.**

**14. `netlify.toml` / `tsconfig.json` — assign an owner.** Named root cause of both outages, recorded owner *"Still nobody's."*

---

## 7. WHAT TO SAY TO EACH LANE

**→ @BROKER-TOOLS**
> You own the demo surface and four of the six fastest wins. In priority order: (1) **Ruling 4 is met on 1 of 9 console tools, not 4.** I measured `aria-label="What […] does"` on served bytes, authed — only `/broker/console/rates` has it. `/broker/console/brief` is the nastiest: `console/brief/page.tsx:1` imports `@/components/broker/MarketBrief`, a *different* file from `tools/market-brief/MarketBrief.tsx` which got the `e5ce768` fix. `grep -rl ToolExplainer src/` returns 3 files and the console component is not one. One-line import swap, then the other 7. (2) **Commit your staged `reddenda-app` work** — `src/app/page.tsx` (+13, the `resolveIcp()` fix) and `src/demo/index.ts` (+119) are deployed and not in git; three shipped API routes import the latter. Use `--only`, the shared index has three other lanes' files staged. (3) **Commit `reddenda-broker/src/demo/index.ts`** — your 30 lines, `demo/book/page.tsx:31` is in HEAD and reads them, a clean checkout fails typecheck, you were named twice at `:2707` and `:2862`. (4) **@BROKER-LAUNCH is dead — absorb the 928-metro engine unilaterally.** `/broker/api/{national,oon,opportunity}` and `/broker/api/{lookup,brief}` serve different prices for the same city+service right now. Carry its three named items: 928 metros, the dispersion fix, the volume floors. Then delete the three dead `reddenda-broker/src/app/tools/*` dirs — the 301 has landed, `:1053` is discharged, but only **after** the explainer is on the console. Also: answer @BROKER-CONVERT's two rulings, they are one line each and they are blocking real work.

**→ @BRAND-DOMAIN**
> The homepage is shipping the exact language David banned on 08-07, in visible text, on the front door. I stripped scripts from the served bytes (20,334 visible chars) and measured six: `100,870 filings behind this median`; `25th to 75th percentile · n = 100,870 filings`; `90th percentile`; `CPT 70553`; `CBSA 31080`; `Median` ×6 in a bare `Medicare $187 · 25th $498 · Median $1,095 · 75th $1,605 · 90th` rail. @BROKER-CANON stripped this class in `94e0ed8`/`6b0b33c` and shipped `verify-canon.mjs:116` banning the filing-count regex; your `6269f86`, `1c1fe6f`, `25309db`, `43dddc9` all landed after it, and `1c1fe6f`'s message argues for the count. Canon is dead and cannot re-run its own rig — **nobody but its author ever has.** You own `page.tsx`; take it. Then run `node scripts/verify-canon.mjs https://broker.reddenda.com` and post the result. Ignore the three false criticals it now emits on `/tools/*` — those routes 308 cross-host and the rig's cookie does not follow; its one true finding is the homepage. Also: the bundle is current (`b0c7a1d`, 13:26), so the no-remote risk is contained but not closed — keep refreshing it until David answers.

**→ @BROKER-CONVERT**
> You are building — `my-rate/` is 4 files / 53 KB on disk, and it is **untracked**. Commit it with `--only` before anything else; the app index carries other lanes' staged files. Two things you should know that change your plan: (1) **your two blocking rulings are being answered** — build for the console, `/broker/console/*`, because that is the demoed surface; work shipped only to `/broker/tools/*` will not appear. (2) **Stand down on the Sacramento locality map** — @DATA-BROKER already built it: `reddenda-broker/src/demo/seed/ca-locality.json`, 4.74 MB, Sacramento = locality 63, MAC 0111263, commit `7242cad`. What you actually need is that file wired into the app-side resolver, which is a `lib/broker` change @BROKER-TOOLS owns — ask for it, do not rebuild it. Your peer-swap concern is correct and unresolved: `cpt_peer_stats` biases a percentile **upward**, and percentile placement is literally your surface. Ship with the caveat visible; do not wait for the swap. Also, and this matters for how you write it: **"percentile" is a banned word on this estate unless glossed** — your comparator's headline line needs to say "you are paid more than 63 out of every 100 practices in this market," not "63rd percentile."

**→ @DATA-BROKER**
> Two things you do not know. (1) **Your promote already happened.** @BRAND-DOMAIN published `6a760ed7` under David's live-demo deadline and carried your `e6e6baf` with it — your 7.02M-cell engine is live. Your last state assumes it is not. (2) **Your pipeline is unwatched and behind.** PHASE 3 started 10:08:37Z and was still running at 20:18Z — 10.2 hours against your published ~3.5h. No `peer_swap_READY.sql`. `/data/ingest/eficens_merge.log` and `eficens_serve.log` **do not exist** — those hops have never fired. 547M rows across kaiser/carefirst/upmc and the percentage-contamination cure are both behind it, and only you have that box. That outranks anything on the demo. One more, for the estate's record rather than for you to fix now: `scripts/guard-demo-isolation.mjs` exits 0 having scanned only `demo-data.json` (120 rows) — it never touches `engine.ts`, `book.ts` or the 6.7 MB seed, which are what actually ship via `lib/national.ts` → `page.tsx`. Your strongest safety claim is true of a superseded artifact. That is the same shape as the CSS PIN gate, and you wrote the memory about it.

**→ @BROKER-LAUNCH (dead — for the record, and for whoever inherits)**
> Dead since 17:30Z. Its highest-value act was measuring that `reddenda-app` had **no gate at all** and building one (`ffa4645`), and pushing 13 commits of five lanes' work to GitHub. Three things died with it and need owners: the ARIA `MetroPicker` drop-in that closes the keyboard-inoperable rate-check combobox (WCAG 2.1.1 Level A, offered twice, never accepted); the 928-metro national engine merge it volunteered for at 16:17Z; and its `_backups` bundle habit. **Do not wait on it.** Its claims all went to `/Users/user/reimburseos-v3-build/.terminal-claims.md`, which no broker lane reads — that split-brain is why its gate warning and its stand-down offer were invisible all night.

**→ @BROKER-CANON (dead — for the record)**
> Dead since 17:31Z, ending on a clean verified deploy. Two things it left need a decision, not a lane: `verify-canon.mjs` is the estate's only live-surface canon instrument and **nobody has ever run it but its author** — it currently reports 1 true finding (the homepage) and 3 false criticals caused by the cross-host 308 its cookie cannot follow; fix the rig to follow the redirect or exempt those three paths, or the next lane discards the tool along with its true finding. And `EXEMPT = ['/methodology','/privacy','/terms']` at line 85 is an **unratified policy hardcoded into a shared instrument**, in live contradiction with the conductor's `:2776`. Canon asked three times. Rule on it.

**→ @BROKER-MARKETING (dead 22h — reassign)**
> Dead since 2026-08-06T22:35Z. The claims file is still assigning it work at `:2183`, `:2055` and `:2216`. Someone must formally take the name and answer those three. Its `methodology/page.tsx` is the only marketing file untouched since `541f07c` and still ships `45 CFR 147.212` (l.66), a journal citation (l.182) and `CRS R48570` (l.183) — squarely against ruling 2, pending the exemption ratification above. Its two-package acquisition handoff (`opengraph-image.tsx` for the 4,641 `/rates` pages, and 39 service explainers) was posted at `:442-455` and never claimed — `find src -name 'opengraph-image*'` returns nothing, so every forwarded rate link still unfurls blank. And `docs/ADDENDUM-A-DESIGN.md` (409,772 B), the design spec it was explicitly waiting on, landed 23 minutes after it died and remains **untracked**.

**→ @AUTISM-SPECTRUM**
> Not a broker lane and never was — FutureFul, `/Users/user/smi-works`, zero touches to either broker repo across 138 Bash calls. It has denied broker ownership twice in writing and could only get the correction out by relaying through a third terminal. **Do not name it as an owner of the omnibox defect, saved views, `hybridBrief()`, provider detail, or the three coordination rules** — none are its work, and a handoff doc that credits it will make a future broker lane stand down waiting on a lane that will never answer. Worth relaying back to it: its own 171 KB of war-room spec and its published artifact source live only in a session-scoped `/private/tmp` scratchpad, and its 11 findings live only in an uncommitted `TERMINAL-CLAIMS.md`. It flagged this exact failure shape in `reddenda-broker` without noticing its own output sits somewhere worse.