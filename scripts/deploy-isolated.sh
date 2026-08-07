#!/bin/zsh
# PROMOTE FROM AN ISOLATED SNAPSHOT OF HEAD. @BROKER-CANON
#
# WHY. Six lanes share one working tree AND one `.next`. Two failures come from that:
#
#   1. `deploy.sh` builds into the shared `.next` while other lanes' dev servers and
#      builds are reading and writing it. Measured today: mid-deploy the directory had
#      no BUILD_ID, no routes-manifest and no server/app at all, and a PARTIAL BUNDLE
#      PUBLISHED — `/enter` and `/api/gate` were missing from production, so the PIN
#      gate returned 404 and nobody could get into the site at all. A green "Deploy is
#      live!" said nothing about it.
#
#   2. @BROKER-CONDUCTOR's `deploy-clean.sh` had the right idea (git archive HEAD into
#      a scratch dir) but symlinked node_modules into the stage. Turbopack rejects a
#      symlink that escapes the project root:
#         FATAL: Symlink [project]/node_modules is invalid, it points out of the
#                filesystem root — TurbopackInternalError
#      so it failed 100% of the time and read as "HEAD does not build". HEAD builds fine.
#
# THE FIX. Stage on the SAME volume as the repo and hardlink node_modules with `cp -al`,
# which is near-instant, costs no disk, and is a real directory rather than a symlink.
# The stage has its own `.next`, so a promote can never race a lane's running server and
# can never publish a half-written bundle.
#
# What ships is exactly one commit and the deploy id is traceable to it.
#
# Usage:  scripts/deploy-isolated.sh [repo-path] [site-name-substring]
set -e
export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin"

REPO="${1:-/Users/user/reddenda-broker}"
GUARD="${2:-reddenda-broker}"
# Same volume as the repo, so `cp -al` can hardlink. /private/tmp may be a different
# filesystem and would silently fall back to a full copy or fail.
STAGE="/Users/user/.broker-deploy-stage"

cd "$REPO" || exit 1

echo "=== 0. UNCOMMITTED WORK THAT WILL **NOT** SHIP ==="
git status --porcelain | sed 's/^/    /'
DIRTY=$(git status --porcelain | wc -l | tr -d ' ')
echo "    ($DIRTY dirty paths; none are in this deploy)"

HEAD_SHA=$(git rev-parse --short HEAD)
echo "=== 1. SHIPPING EXACTLY: $HEAD_SHA  $(git log -1 --format=%s) ==="

echo "=== 2. LINK GUARD ==="
STATUS=$(netlify status 2>&1)
echo "$STATUS" | grep -iE "Current project|Project Id" | sed 's/^/    /'
if echo "$STATUS" | grep -qi "reddenda-app-prod" && [ "$GUARD" != "reddenda-app-prod" ]; then
  echo "!!! ABORT: cwd resolves to reddenda-app-prod."; exit 9
fi
echo "$STATUS" | grep -qi "$GUARD" || { echo "!!! ABORT: link target is not $GUARD"; exit 9; }
echo "    LINK GUARD PASSED"

echo "=== 3. ISOLATED SNAPSHOT OF HEAD -> $STAGE ==="
rm -rf "$STAGE"; mkdir -p "$STAGE"
git archive HEAD | tar -x -C "$STAGE"

# Gitignored runtime bits carried by name. Values are never printed.
for f in .env.local .env.production netlify.toml; do
  [ -f "$REPO/$f" ] && cp "$REPO/$f" "$STAGE/$f" && echo "    carried: $f"
done
[ -d "$REPO/.netlify" ] && cp -R "$REPO/.netlify" "$STAGE/.netlify" && echo "    carried: .netlify (site link)"

# Hardlink farm, NOT a symlink. See the header.
if cp -al "$REPO/node_modules" "$STAGE/node_modules" 2>/dev/null; then
  echo "    hardlinked: node_modules"
else
  echo "    hardlink unavailable, copying node_modules (slower)"
  cp -R "$REPO/node_modules" "$STAGE/node_modules"
fi

echo "=== 4. PREFLIGHT: THE ROUTES THAT MUST EXIST, OR WE DO NOT PUBLISH ==="
# The gate is the condition David's fabrication ruling rests on. A bundle missing
# /enter or /api/gate locks every visitor out AND, if the middleware were ever absent
# too, would publish fabricated data wide open. Assert on the SNAPSHOT, before build.
for f in src/middleware.ts src/lib/gate.ts src/app/api/gate/route.ts src/app/enter/page.tsx src/app/enter/EnterForm.tsx; do
  [ -f "$STAGE/$f" ] || { echo "!!! ABORT: $f missing from the HEAD snapshot"; exit 8; }
done
echo "    gate, enter and middleware all present in the snapshot"

echo "=== 5. BUILD + DEPLOY FROM THE SNAPSHOT ==="
cd "$STAGE"
netlify deploy --prod --build --skip-functions-cache 2>&1 | tail -25

echo "=== 6. POSTFLIGHT: PROVE THE DOOR EXISTS ON LIVE PROD ==="
sleep 4
ENTER=$(curl -sS -o /dev/null -w '%{http_code}' https://broker.reddenda.com/enter || echo 000)
GATE=$(curl -sS -o /dev/null -w '%{http_code}' -X POST https://broker.reddenda.com/api/gate \
        -H 'content-type: application/json' -d '{"pin":"__wrong__"}' || echo 000)
echo "    /enter                -> $ENTER  (expect 200)"
echo "    /api/gate wrong PIN   -> $GATE  (expect 401, NOT 404)"
if [ "$ENTER" != "200" ] || [ "$GATE" = "404" ]; then
  echo "!!! THE DOOR IS BROKEN ON PROD. A partial bundle published. Redeploy before telling anyone it is up."
  exit 7
fi
echo "=== 7. CANON GATE (David's rulings 2 and 3, on the SERVED surface) ==="
# WHY IT RUNS HERE AND NOT AS A PREFLIGHT: the sweep reads the RENDERED page and the API
# payloads, so it needs a served surface. A bundle that has not been published cannot be
# checked this way, and a check run against something other than the deploy is not
# evidence — this estate has that lesson filed twice.
#
# WHY IT RUNS AT ALL: the provenance strip landed at 09:50 and was back on the homepage
# by 10:40, via four good-faith commits from a lane that had never run the rig. For most
# of a day the only thing between the front door and a David ruling was one terminal
# remembering to run one script — and that terminal died. A check that depends on a
# particular lane being alive is not a check.
#
# It cannot block the publish (the bytes are live by the time it can see them). It makes
# the failure loud and traceable to this deploy id. Rollback is a publish, not a rebuild.
if [ -f "$REPO/scripts/verify-canon.mjs" ]; then
  CANON_PIN="${SITE_PIN:-$(grep -m1 '^SITE_PIN=' "$REPO/.env.local" 2>/dev/null | cut -d= -f2- | tr -d '"')}"
  ( cd "$REPO" && SITE_PIN="$CANON_PIN" node scripts/verify-canon.mjs https://broker.reddenda.com 2>&1 | tail -16 )
  CANON_RC=$?
  if [ "$CANON_RC" != "0" ]; then
    echo ""
    echo "!!! CANON VIOLATIONS ARE LIVE ON THE SURFACE YOU JUST PUBLISHED (deploy $HEAD_SHA)."
    echo "!!! Roll back or fix forward, but do not walk away from it."
    echo "!!! Detail: cd $REPO && node scripts/verify-canon.mjs https://broker.reddenda.com"
  fi
else
  echo "    verify-canon.mjs absent from this snapshot — CANON NOT CHECKED"
fi

echo "=== DONE. shipped $HEAD_SHA from an isolated snapshot; $DIRTY dirty paths excluded. ==="
