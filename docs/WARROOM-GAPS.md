**GROUND TRUTH MEASURED FIRST (2026-08-06, this machine). Three of these invalidate the plan's own framing.**

---

**1. The plan's blocking condition is already breached, and the plan does not know it.**
§14.1 states "No buy-side host resolves, no buy-side page is indexed, and no artifact leaves the building until David rules." False as written. `.terminal-claims.md` tail: **broker.reddenda.com is LIVE**, deploy `6a7506af7c576333470d1af0`, valid TLS, DNS added via Namecheap API today. TLS issuance means the host is in Certificate Transparency permanently, which is the exact irreversibility §3 and §14.1 argue from. Same entry: the site sat **completely ungated at `reddenda-broker.netlify.app`** for a stretch this evening with David browsing `/methodology`.
FIX: Rewrite §14.1 to state the breach, its date, the CT record, and the option it destroyed. The covenant question is now amend-or-take-down, not amend-or-launch. Quiet sequencing is gone.

**2. HARD RULE 13 was re-issued verbatim today and the plan violates it without citing it once.**
David, in the claims file: *"All tooling needs to live at app.reddenda.com. That's a hard requirement."* and *"I need broker.reddenda.com up and app.reddenda.com/broker for the tools."* The plan puts T1 through T8 on censenda.com with a separate repo, separate Netlify site and separate Supabase project. Rule 13 appears zero times in the plan. The repo's own `docs/BRAND-NAME-SCORECARD.md:245` argues *"Do not use app.reddenda.com/broker"*, a lane arguing against a HARD rule.
FIX: Reconcile in writing before any code. Either David grants censenda.com an explicit documented rule-13 exception (the RateScore precedent), or tools ship on app.reddenda.com/broker and censenda.com is marketing only. Do not proceed on a lane's inference.

**3. Decision #3 is presented as ruled; its only cited evidence is a file the lane wrote.**
§1 says "Censenda, ruled by David, live in `src/components/marketing/brand.tsx:41`." A source comment is not a ruling, and it conflicts with a same-day verbatim instruction to stand up broker.reddenda.com.
FIX: Get the ruling in David's words with a timestamp. Record which instruction is later. A decision sourced to your own commit is a deferred decision wearing a checkmark.

**4. The noindex control and the PIN gate share one failure switch.**
`src/middleware.ts:45-48`: `if (!GATE_ARMED) return NextResponse.next();` returns **before** line 69 sets `x-robots-tag: noindex, nofollow, noarchive`. One absent env var makes the site simultaneously public and indexable. `src/app/sitemap.ts` is already built and enumerates all 4,641 pages. There is **no `robots.ts`**.
FIX: Set noindex above the arming check. Add `robots.ts`. Add G16: all three of GATE_ARMED, SITE_PIN, GATE_SECRET present on every environment, and an unarmed deploy still emits noindex.

**5. Path A has no build plan, so the ruling it waits on cannot be acted on.**
§15 calls both paths "executable." Path B has 6 milestones, gates, owners. Path A has one paragraph. If David rules A on Monday, this lane has nothing to execute.
FIX: Spec Path A to M-granularity, or state plainly that Path A equals M4 only plus one app surface, with owner and dates.

**6. M1's copy rewrites are covenant-contingent but scheduled unconditionally.**
§10 orders `perf-trust.html` and `what-happens-after-upload.html` rewritten "regardless of the covenant ruling." Under Path A those pages remain **true** and rewriting them is a self-inflicted downgrade of the strongest provider promise in the estate.
FIX: Gate those two rewrites on §14.1. Ship the rest of M1 now.

**7. No revenue date, no unit economics, no stated cost to the provider side.**
M5 = M4 (week 8) + two monthly refreshes = week 16 or later, roughly December. T1 is free by the plan's own logic ("gating it is theatre"). So between M2 and M5 the paid delta over guest is: more localities, branded render, saved exhibits. The plan never states the earliest collectible dollar, an ACV band, a breakeven license count, or what the provider side (3 completed checkouts, 5 outreach replies) forfeits for a quarter of engineering.
FIX: State earliest revenue date, the M2-to-M5 paid feature set, and the provider-side opportunity cost as a number.

**8. The demand gate has no supply side and no kill branch.**
20 accounts on 2 separate days in 30 days, from an estate with **4 broker-shaped records in 1,013,392 CRM rows**, no broker list, no broker ever contacted, a sending domain warming for 20 days, and one conference talk. No acquisition channel is specced. Nothing says what happens if the gate misses.
FIX: Name the channel and required count at each stage. Write the kill condition with a date. Move the 10 primary calls ahead of M2 and name David as owner, since he holds the only network.

**9. ADVERSARIAL FINDING DROPPED ENTIRELY: ERISA-exempt public plan buyers and bid-protest exposure.**
The liability verdict's point (d) is that governmental plans (ERISA 4(b)(1)) and church plans have no section 514 shield, that the corpus tail is full of them (CalPERS, State of New York, Metro Nashville, Orange County FL schools), that public entities buy by RFP, and that a losing bidder scored against a Medicare basis **we computed ourselves** has no contract with us, a documented loss, and counsel. §14.5 resolves reliance, indemnity and caps and **never mentions public plans or bid protest**. Also dropped: NY Ins. Law 2119(a), the signed written fee memorandum required even of a licensed person, which never enters the contract stack.
FIX: Add both to §14.5. Either T6 RFP mode never ships into public-entity procurement, or it carries a bidder-addressed non-reliance plus issuer adoption of the Medicare basis at the issuer's own election, and 2119(a) memorandum language goes in the master agreement.

**10. TwinFlame's own insurance is never mentioned anywhere.**
The plan requires the broker to carry E&O and indemnify us. Zero hits for E&O, errors and omissions, COI, or certificate of insurance across the repo docs and claims file. Tech E&O with a media/professional endorsement is the actual first-loss layer in §14.5's own scenario, and a COI is the first document a national brokerage compliance desk requests at intake.
FIX: Bind it and produce a COI. M0 item.

**11. The live terms page is unscoped and the plan audits the wrong file.**
§14.5 targets `reimburseos-v3-build/terms.html`. The file actually live on broker.reddenda.com is `/Users/user/reddenda-broker/src/app/terms/page.tsx`, 3,629 bytes, containing **zero** occurrences of broker, General Agent, self-funded, plan sponsor, fiduciary, or third-party beneficiary. It is already in the sitemap.
FIX: Rewrite this file in M1, not "before the first artifact ships."

**12. Four incompatible metro counts, none of them the one that matters.**
Copy says 917. The picker exposes 124. The programmatic surface is built on 119 (`src/app/rates/[market]/[service]/page.tsx:26`, 119 x 39 = 4,641). `data/metros.json` holds 400. The plan flags only the 917-vs-124 pair. None of the four is the count that survives F10 (5 or more distinct payers).
FIX: Compute the metro count surviving F0 through F12 on the shoppable catalog. That single number is the only one allowed in copy, the picker, the sitemap and the deck.

**13. The 4,641-page programmatic surface is invisible to the plan.**
It is built, sitemapped, and is a commercial-percentile surface, exactly what M1 orders deleted. No milestone owns it. `sitemap.ts` hardcodes `BASE = "https://broker.reddenda.com"`, so a censenda.com cutover ships a sitemap declaring a foreign host, the identical defect the domain verdict raised against reddenda-app's hardcoded metadataBase.
FIX: Name the surface in M1 (strip percentiles or delete it). Derive BASE from env and assert it in gates.

**14. The ETL is asserted, not specified, and the attestation is a picture.**
"One-way ETL, no reverse path" carries no cadence, no owner, no failure mode, no staleness contract. If it stalls, Censenda serves stale rollups under a fresh date, the exact defect §11 names. A "published data-flow diagram" is not verifiable by a provider, which is the entire §14.7 argument.
FIX: Name cadence and owner. Publish the Censenda DB role's actual grant list, which is checkable, instead of a diagram. Require every artifact to print the ETL's own freshness stamp, not `now()`.

**15. Disclosure runs one direction only.**
G13 tests that Censenda artifacts disclose Reddenda. Nothing tests that reddenda.com discloses Censenda. §15 path B says "disclosed with a link from /covenant" and that appears in no milestone, no gate, no owner. With the host already in CT logs, a provider discovers the relationship from a competitor before Reddenda states it.
FIX: Reverse disclosure ships in M0, on /covenant, with its own gate.

**16. No print gate, though print is the primary consumption surface.**
The whole thesis is that the artifact leaves the login and gets screenshared and printed. G12 checks six viewport widths and zero print renders. Nothing asserts the conflict disclosure, vintage and suppression count survive Save-as-PDF on page one, or that table rows do not split across a page break.
FIX: Headless print gate. Assert disclosure plus vintage plus suppression count on page one, no row splits.

**17. No supersession behavior on issued artifacts.**
Capability URLs expire at 72 hours and re-resolve p90, but data refreshes monthly and the plan never says what a URL does when its underlying vintage advances. The "void if superseded" line from the adversarial fix never reached §7.
FIX: On GET, compare stored vintage to current; render a supersession banner or expire.

**18. The zip3 ambiguity band is called honest and never sized.**
93 of 925 pairs (10.1%) are locality-ambiguous and get "an honest band." The width is never stated. A band that straddles the office-versus-ASC decision is not honesty, it is an unlabelled coin flip.
FIX: Measure max ratio spread across ambiguous pairs on the shoppable catalog. Suppress where the band spans the decision rather than banding it.

**19. The only appreciating asset sits behind the most conditional milestone.**
§11 calls counterparty-response capture the compounding asset and starts it at T6's first commit. T6 is M6, gated on a demand gate that may never fire. Same shape for `payer_canonical_map`: 188 of 3,737 classified (5.0%), referenced by zero application code, T7 depends on it, and no coverage target, method, hours or owner is stated.
FIX: Capture counterparty exhaust from the first artifact that touches a counterparty. State entity-resolution target coverage, method and hours, or cut T7.

**20. Entity and payment identity are undecided while §14.7 marks separation resolved.**
Separate repo, Netlify and Supabase are specced. Separate legal entity, Stripe account and statement descriptor are not. A broker's card statement reads the shared descriptor at the one moment a customer looks.
FIX: Add to §15 as its own line: entity, Stripe account, descriptor, sender domain.

**21. No buy-side competitive or price reality, and CAHIP has no content.**
Rule 8 forbids naming a competitor; the plan carries no anonymized market map either, so it cannot answer an investor's second question (who else sells this, at what price) or a broker's first (I already get this from someone, why switch). Separately, CAHIP NorCal on Aug 26 drives the domain and mail deadline but has no talk, no CTA and no surface, and under §14.1 nothing public to point at.
FIX: Anonymized buy-side feature and price map before M3, sourced from public pricing pages plus the 10 calls. Decide the Aug 26 talk and CTA under both covenant paths this week.

**22. Outstanding debt from today's deploy is not carried anywhere.**
The claims file records post-deploy registration in `internal-directory.html` and the email to David for deploy `6a7506af7c576333470d1af0` as **still owed**. §13.3 restates the standing rule and the plan carries no item for the open one.
FIX: M0 item, owner @CENSENDA-CONDUCTOR, today.

---

**The sharpest question this plan cannot answer:** a GA principal asks "your own charter, indexed and linked three times from your homepage, says you will never take a dollar from a health plan, and your buy-side host is already in the CT logs. Which one of those is the company?" The plan routes that to David and blocks on it, correctly, but it also schedules 6 milestones and a conference talk on the assumption of a specific answer.