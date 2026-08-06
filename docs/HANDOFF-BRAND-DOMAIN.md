# HANDOFF: THE NAME, THE DOMAIN, AND HOW TO BUILD BEFORE DAVID PICKS

**To:** @BROKER-TOOLS · @BROKER-MARKETING (Brober4444) · @DATA-BROKER (262626)
**From:** @BRAND-DOMAIN (Opus 5, terminal d62737ad)
**Date:** 2026-08-06
**Status:** NEW FILE ONLY. I have not touched one existing file in this repo, or anywhere else in the estate.

You are all building against a working mark ("Reddenda Broker") and a TBD domain. David ruled at
2026-08-06 20:49 UTC, verbatim: *"Fine, I'll create a separate full domain. Don't worry about the name
for now. Get everything built out."* That unblocked you but it left a string threaded through every
surface you are writing: logo, wordmark, `<title>`, OG tags, canonical URLs, the sender domain, the PDF
footer on the artifact, and the CTA copy. **Section 3 removes that dependency entirely so none of you
have to rework anything when he picks.** Read section 3 first if you are mid-file.

---

# 1. WHY THE WORKING MARK IS THE WRONG PERMANENT ANSWER

Not a style objection. Three concrete costs, in your terms.

**It contradicts your own ICP.** `HANDOFF-MARKETING.md` §2 defines three audiences: broker, General
Agent, self-funded employer. A name containing "broker" is wrong for two of the three on day one. §2.3 is
a CFO with fiduciary exposure. Nothing that says "broker" is built for them, and §2.2's GA sells *to*
brokers, not *as* one.

**It cannot be spun out, sold, or funded separately.** A subdomain accrues no separable equity.

**It is one DNS label from the provider-side product.** This product tells employers where they are
overpaying. Reddenda tells providers where they are underpaid. Same corpus, opposite side of the table.
David explicitly ruled that the two-sided question is skipped, so this is not me reopening it. It is the
narrow observation that a name is the one artifact that makes the adjacency *legible to a customer*.

---

# 2. VERIFIED, NOT ASSUMED

Method, so you can re-run it rather than trust me:

1. **Registry RDAP.** Verisign for `.com`, Identity Digital for `.broker`. HTTP 404 is authoritative
   unregistered. Not a reseller lookup, which can show false positives on names being held.
2. **DNS delegation.** Every name below returns an empty NS record. No parked page, no dormant owner.
3. **Trademark.** TMview (EUIPO-run, aggregates USPTO + WIPO + national offices). Endpoint validated
   against a control before any zero was trusted: `aetna` returns 625 marks, so a 0 is a real 0.
4. **Operating-company sweep** for commercial use without a filing.

**Swept 2026-08-06 21:24 UTC. Availability is live state and can change hourly.**

| Name | .com | DNS | Marks worldwide | Note |
|---|---|---|---|---|
| **praestanda.com** | free | none | **0** | *praestō*: to vouch for, to guarantee, to make good |
| **censenda.com** | free | none | **0** | *censeō*: to assess, appraise, rate. Root of "census" |
| **proofbasis.com** | free | none | **0** | `.io` and `.ai` also free |
| spreadbasis.com | free | none | 0 | |
| aestimanda.com | free | none | 1 | unrelated wine mark, cls 33/35/39 |
| knownrate.com | free | none | 0 | |
| censusbasis.com | free | none | 0 | |
| emendanda.com | free | none | 0 | |
| declaranda.com / statuenda.com | free | none | 0 | bench |
| assaybasis.com / assayrate.com | free | none | 0 | bench |
| **reddenda.broker** | **free** | n/a | n/a | verified on Identity Digital RDAP, not a reseller |
| reddendabroker.com | free | none | 0 | buy defensively regardless |
| reddendahealth.com | free | none | 0 | buy defensively regardless |

**Finding that is not about this product and should go to David separately: "Reddenda" itself has ZERO
trademark registrations anywhere in the world.** The core brand is unprotected in every jurisdiction.

## 2.1 Two names to stop considering

- **Anything containing "parity."** In a NABIP room, parity means MHPAEA mental health parity. Every
  first meeting becomes a correction. `parityroom.com` and `paritybasis.com` are free and should stay free.
- **`reddenda.broker` as the brand.** Available, and still wrong. You rent the category word instead of
  owning it, and unfamiliar TLDs get filtered by corporate networks. That is not hypothetical here:
  `futureful.app` is currently "Not Rated" in FortiGuard and ICP networks are serving our prospects a
  block page today. Your §2.1 broker sits behind exactly that class of firewall. Register it as a
  defensive redirect, never as the canonical host.

## 2.2 The recommendation, for when David asks

**Praestanda.com**, or **ProofBasis.com** if the decision needs zero execution risk. The split turns on
one variable: whether David will spell a word on stage on Aug 26. Praestanda is the better company name
on every dimension except that one, and it completes a real naming architecture, since **Reddenda** and
**Tuenda** are both Latin gerundives already. Reddenda, Praestanda, Tuenda is a house of brands. That is
a platform story rather than a second-website story, which matters for GFN and PitchProtocol. ProofBasis
is two common English words with zero spelling risk and an identical ceiling across all three of your ICPs.

---

# 3. BUILD NOW, ZERO REWORK LATER  ← the part that speeds you up

Do not type the brand string into any surface. Import it. One constant changes on decision day and every
title, OG tag, canonical, footer, PDF header and email signature follows.

Suggested `src/lib/brand.ts` (yours to place and name, I did not create it):

```ts
// SINGLE SOURCE OF TRUTH FOR THE BRAND STRING.
// On decision day exactly one object below changes. Nothing else in the repo does.
export const BRAND = {
  name:      'Reddenda Broker',        // working mark, NOT final
  legalName: 'TwinFlame Group',
  host:      'broker.reddenda.com',    // launch alias, NOT final
  origin:    'https://broker.reddenda.com',
  sender:    'info@reddenda.com',      // see §4 before changing this one
  parent:    'Reddenda',
  endorsement: 'Built on the Reddenda rate platform',
  isProvisional: true,                 // gate any brand-permanent asset on this
} as const

export const canonical = (path: string) => new URL(path, BRAND.origin).toString()
```

Three rules that make this actually work:

1. **No hardcoded brand string anywhere**, including `metadata` exports, OG image alt text, the artifact
   PDF footer, and email templates. `grep -rn "Reddenda Broker" src/` should return zero outside `brand.ts`.
2. **Gate permanent assets on `isProvisional`.** Do not commission a final logo lockup, a favicon set, or
   an OG image with the wordmark burned in while it is `true`. Ship a typographic wordmark rendered from
   `BRAND.name` so the OG image regenerates on decision day instead of needing a redraw.
3. **Never put the host in a string literal.** Use `canonical()`. Canonical tags and OG URLs are the two
   places a stale host survives a rename and quietly splits SEO across two identities.

Cost of adopting this now: roughly twenty minutes. Cost of not adopting it: a rename sweep across every
marketing surface, every metadata export, and every artifact template, during the week of the event.

---

# 4. THE CRITICAL PATH NOBODY HAS CLAIMED  ← read this one today

David speaks at the **CAHIP NorCal 2026 Business Expo on Aug 26**, Citrus Heights Community Center,
8:00am to 4:00pm. That is **20 days out**. Amwins is the Diamond sponsor, which means the largest
sponsor in that room is a General Agent, your §2.2 buyer.

**A brand-new sending domain needs roughly two to three weeks of reputation warm-up before cold outreach
lands in inboxes.** The follow-up email to everyone David meets on Aug 26 is the entire point of the
event, and it is the first thing that breaks if the domain is registered late. **The domain decision is
on the critical path for outreach, not just for the site.** If it is registered on Aug 20 the follow-up
goes to spam.

Concrete consequence for the three of you: the *site* can launch on `broker.reddenda.com` at any time
because reddenda.com already has sending reputation. The *outreach* cannot. Those are different
deadlines and only one of them moves.

## 4.1 Redirect map, whichever name wins

```
<brand>.com            canonical marketing host
app.<brand>.com        the tools
broker.reddenda.com    301 → <brand>.com   catches the stage mention and inherits reddenda.com authority
reddenda.broker        301 → <brand>.com   defensive, verified free
reddendabroker.com     301 → <brand>.com   defensive; this is the string people actually type
reddendahealth.com     301 → reddenda.com  defensive, unrelated to this build
```

`broker.reddenda.com` is the correct **launch alias** and the wrong **canonical**. Use it for 20 days,
301 it forever after. Set `BRAND.origin` to the final host the day it is registered and the canonical
tags follow automatically, which is the whole reason for §3.

---

# 5. WHAT I OWN AND WHAT I WILL NOT TOUCH

**Mine:** the name, the trademark clearance, the domain and redirect architecture, the sender warm-up
runbook, and this file.

**Not mine, and I have written nothing in any of them:** `src/**` (@BROKER-TOOLS), every marketing
surface (@BROKER-MARKETING), the corpus and the percentage bug at `cpt=A9900 served=$50 source=$0.0099`
(@DATA-BROKER, already tracked). If I need something changed in your scope I will post in
`.terminal-claims.md` and hand it to you rather than edit it.

**Open, and David's alone:** picking the name and registering the domain. Registration spends his money
on an outward-facing asset, so no lane should do it autonomously. Everything else above is ready to
execute the hour he decides.

— @BRAND-DOMAIN (Opus 5), clean, no mid-edit.
