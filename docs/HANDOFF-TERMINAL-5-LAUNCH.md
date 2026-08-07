# HANDOFF: TERMINAL 78378383 — THE LAUNCH LANE

**To:** @BROKER-LAUNCH (terminal **78378383**, "Study Reddenda broker projects and terminals")
**From:** @BROKER-CONDUCTOR (terminal `da1ae408`, Opus 5) — coordination + deploy management lane
**Date:** 2026-08-06, written 21:50 UTC
**Read time: 4 minutes. Every number and every path below was measured on this machine in the last 10 minutes, not copied from another doc.**

---

## 0. YOUR ORDER, IN ONE LINE

**David is demoing this in ~15 minutes. There is no deployed URL. You own getting one.**
You are NOT on the data lane. You are not to touch the corpus, ClickHouse, OVH, or `peer_chain`.

Your scope, in priority order:

| P | Task | Why you and not them |
|---|---|---|
| **P0** | **Deploy `/Users/user/reddenda-broker` to a real HTTPS URL** | Nobody owns it. Both other lanes are mid-file on the app itself. It is the only blocker to a demo. |
| **P1** | The **role fork**: `/for/broker`, `/for/general-agent`, `/for/employer` | New routes. Zero file overlap with either lane. Funnel stage 3 in `HANDOFF-MARKETING.md` §4, currently unbuilt. |
| **P2** | The **artifact** (funnel stage 4): a print/PDF-clean sourced one-pager | Unowned, and it is the thing a broker actually hands a client. |

**Do P0 completely before you touch P1.** A deployed 2-page site beats an undeployed 5-page one at 21:59.

---

## 1. WHO IS IN THIS REPO RIGHT NOW, AND WHAT YOU MAY NOT TOUCH

Four terminals are live in `/Users/user/reddenda-broker` as you read this. **Ownership is hard. Pull from disk before every write and never `git add -A`.** (See §5, trap 2: that exact mistake already happened once today, at 21:44.)

| Lane | Terminal | Owns (do not edit) |
|---|---|---|
| **@BROKER-TOOLS** | `b21483e9` | `src/lib/**`, `src/app/api/**`, `src/app/tools/**`, `scripts/**`, `data/**` |
| **@BROKER-MARKETING** | `265014b1` ("Brober4444") | `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`, `src/components/marketing/**` |
| **@DATA-BROKER** | `a64c79a8` ("262626") | the corpus, Supabase, OVH, `tic_build`. **Not your lane. Do not message them with build questions.** |
| **@BRAND-DOMAIN** | `d62737ad` | `docs/HANDOFF-BRAND-DOMAIN.md`, `docs/BRAND-NAME-SCORECARD.md`. Scope complete. |
| **YOU** | `78378383` | **`netlify.toml`, deploy config, `src/app/for/**`, `src/app/artifact/**`, `public/**`, `docs/HANDOFF-TERMINAL-5-LAUNCH.md`** |

**Files you may create but must never edit in place:** anything above owned by someone else. If P1 needs a shared component, **copy it into your own route folder** rather than editing theirs. Duplication is cheaper than a lost edit at T-minus-10.

---

## 2. GROUND TRUTH: WHAT ACTUALLY WORKS RIGHT NOW

Measured by me at 21:48–21:50 UTC against the running dev server.

**The server is UP on port 3100 and is NOT 500ing.** @BROKER-TOOLS reported a root 500 at 21:44; it is resolved. Current:

```
GET http://localhost:3100/                  → 200  (0.30s)
GET http://localhost:3100/tools/rate-check  → 200
```

**The API returns real, sourced data.** This is the demo. Contract is `?service=<CPT>&metro=<cbsa>` or `?service=<CPT>&state=<XX>`, optional `&payers=1`:

```
GET /api/lookup?service=70553&state=TX
{"ok":true,"result":{"found":true,"cpt":"70553",
 "description":"MRI brain, with and without contrast","scope":"state",
 "cell":{"p25":151.99,"p50":274.46,"p75":507.95,"p90":1019.65,"n":82229},
 "confidence":"high","medicare":{"nonFacility":313.33,"facility":313.33,"year":2026},
 "updatedAt":"2026-07-20T23:55:22Z"}}
```

**82,229 filings behind one Texas number.** That is your credibility line, and it is real.

**The honesty filter works, and it is a demo asset, not a bug.** Do not hide this. Show it:

```
GET /api/lookup?service=99214&state=NY
{"found":false,"reason":"percentage_contamination",
 "message":"Filings for Office visit, established patient, 30 to 39 minutes in NY
  include percentage-based rates that cannot be read as dollar amounts.
  We do not publish a figure we cannot stand behind."}
```

An audience of licensed professionals trusts the product that refuses to answer. **A 200 with `found:false` is a normal response. Render `message` verbatim. Never invent a fallback.**

**Inventory:** 39 services in `src/lib/catalog.ts` (each with a plain-English phrase), **124 metros** in `src/lib/metros.ts`. Note: `HANDOFF-MARKETING.md` §3.1 cites 917 metros in the corpus. The shipped picker exposes 124. **Say "124 markets" on any surface you build, or say nothing.** Do not print 917 next to a picker that offers 124.

**Existing surface:** `src/app/page.tsx` (455 lines), `src/app/tools/rate-check/RateCheck.tsx` (358), 5 marketing components (779). Two routes total. That is the whole site.

---

## 3. P0: THE DEPLOY. EXACT STEPS, AND THE TRAP THAT WILL BITE YOU

### ⛔ TRAP 1 — READ THIS BEFORE YOU RUN ANY NETLIFY COMMAND

There is **no `.netlify` directory in `/Users/user/reddenda-broker`**, so the CLI falls through to global state. I ran `netlify status` from that exact cwd and got:

```
Current project: reddenda-app-prod
Admin URL:       https://app.netlify.com/projects/reddenda-app-prod
```

**A bare `netlify deploy --prod` from this directory publishes the broker build over `reddenda-app-prod`.** This estate has already had that exact incident three times (memory: `feedback_a_foreign_site_deploy_from_the_repo_cwd_publishes_your_whole_config`). **Link explicitly to a new site first. Never pass `--prod` until `netlify status` names the broker site back to you.**

### The steps

1. **Create and link a NEW site.** Do not reuse anything.
   ```
   cd /Users/user/reddenda-broker
   netlify sites:create --name reddenda-broker --account-slug david-7fnybg
   netlify link --name reddenda-broker
   netlify status          # MUST print reddenda-broker. If it prints reddenda-app-prod, STOP.
   ```
2. **`netlify.toml` + the Next runtime.** Next 16.3.0 with `runtime = "nodejs"` and `dynamic = "force-dynamic"` on the API route: this is **not** a static export. It needs `@netlify/plugin-nextjs`. Add the plugin and commit the toml.
3. **Env vars, by name, never pasted into a file.** The build needs these 3 (the other 2 in `.env.local` are not used by the running code paths):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`  ← **server-only. It must never appear in a client bundle.**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Set them with `netlify env:set` reading values out of `.env.local` programmatically. **Do not echo them, do not paste them into the toml, do not put them in a commit.** `.env.local` is correctly gitignored; verify with `git check-ignore -v .env.local` before any commit.
4. **Verify the service key did not ship.** After deploy, this must return nothing:
   ```
   curl -s <url>/_next/static/chunks/*.js | grep -c "service_role"   # expect 0
   ```
   `src/lib/db.ts` is disciplined about this already (server-only, documented). Confirm it anyway. A leaked `service_role` key is the worst outcome available tonight.
5. **Smoke the deployed URL, not the local one.** 200 on `/`, 200 on `/tools/rate-check`, and a **real distribution rendered on screen** at 390px and 1440px. A green deploy is not evidence. Look at it.

### The domain

`broker.reddenda.com` **does not resolve** (`dig +short` returns empty). @BRAND-DOMAIN's verdict: `broker.reddenda.com` is the correct **launch alias** and the wrong permanent canonical (use ~20 days, then 301). David has ruled: *"Don't worry about the name for now. Get everything built out."*

**For the demo: the `*.netlify.app` URL is acceptable and is the fast path.** Add the custom domain after David has seen it working. Do not spend the next 15 minutes on DNS.

---

## 4. P1 AND P2, IF THE DEPLOY LANDS EARLY

**P1, the role fork.** Three routes under `src/app/for/`. Per `HANDOFF-MARKETING.md` §2 the audiences are the broker (2 to 500 lives, no analyst, fears losing the account to a house with a bigger analytics team), the General Agent (sells *to* brokers, measures downstream adoption, not own usage), and the self-funded employer (CFO or HR director of one, post-CAA fiduciary exposure, **does not know what a CPT code is**). Same product, three proofs. The employer path must work entirely in plain English with the code as secondary detail.

**P2, the artifact.** Branded, sourced, dated, print-clean. It carries the basis line verbatim: *"Transparency in Coverage machine-readable files, 45 CFR 147.212. Modeled from public filings. Not a guaranteed rate."*

---

## 5. THE FOUR LANDMINES AND THE TWO TRAPS

**Landmines (data):**
1. **Never demo `99214` in New York.** p25 is $0.97 from a known upstream contamination. The filter catches it correctly (see §2), but do not put it on a slide as a working example.
2. **`27447` has a null upstream description.** Do not rely on it.
3. **The payer view is legitimately empty in some markets.** California brain MRI returns nothing because every payer filing in that cell was an out-of-state BlueCard filing. Correct behavior. Never build a layout that assumes payers are populated.
4. **Site of service: the direction was BACKWARDS in three briefs and was corrected at ~21:4x today.** The bare `nonfac_rate` vs `fac_rate` split reads as "steer to the hospital," which is the opposite of the truth and the opposite of the sale. The real triple is office vs HOPD vs ASC: colonoscopy **office $423, HOPD $1,121, ASC $681**, and ASC is the real money-saving steer. **If you find the two-column version anywhere in a page you build, it is stale.** (Filed in memory as `feedback_fac_rate_is_not_the_cost_of_care_in_a_facility`.)

**Traps (process):**
1. **The foreign-site deploy.** §3, trap 1. This is the one that can actually hurt tonight.
2. **`git add -A` on a shared index is not atomic.** At 21:44 @BROKER-TOOLS ran `git add -A` then `commit --only <paths>` and still swept @BROKER-MARKETING's in-flight files into commit `115ee75`. Use `git commit --only <your paths>` with **no** preceding `git add -A`. (memory: `feedback_git_add_then_commit_is_not_atomic_on_a_shared_index`)

**Repo state as of 21:49:** `main`, **1 commit** (`115ee75`), **no remote configured**, 6 dirty paths. `git init` was run at 21:44 today, so this build had no version control at all until eight minutes ago. **Setting up the GitHub remote is yours** (`dhitch11/`, secret-scan the diff first), but it is P0.5, after the site is live.

---

## 6. HOW TO COORDINATE. THIS IS NOT OPTIONAL AND IT IS CURRENTLY BROKEN

**The broker repo has no claims file.** All four lanes have been posting to `/Users/user/reimburseos-v3-build/.terminal-claims.md` (broker entries start ~line 45560), which is the *marketing site's* file. @BROKER-MARKETING works in this repo and may never see it.

**I have created `/Users/user/reddenda-broker/.terminal-claims.md`. Post there, and mirror anything cross-repo to the v3-build file.**

- **Claim before your first write**, naming the lane whose file you are near.
- **Post a finding the moment it is verified**, not when you finish.
- **Report your deploy id** in the claims file so a rollback is traceable.
- **Re-read the claims file before you promote.** Someone may have posted in the last 90 seconds. Today, they have been.

Ping me (`@BROKER-CONDUCTOR`, terminal `da1ae408`) in the claims file if you are blocked. I am watching all four lanes, the deploy path, and machine RAM, and I will unblock rather than review.

---

## 7. THE BAR

Real data or an honest empty state. Never a placeholder, never an estimate dressed as a measurement, never a savings guarantee in any wording, no PHI. Click every control you ship. Verify at 320 / 390 / 768 / 1440. **A 200, a green deploy and a passing build are not evidence. Open the live URL and look at it.**

Go. P0 first.
