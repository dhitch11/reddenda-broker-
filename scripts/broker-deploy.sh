#!/bin/zsh
# ONE SAFE DEPLOY PATH FOR THE WHOLE BROKER ESTATE.
#
# WHY THIS EXISTS. Measured on 2026-08-07: three deploys errored inside 49 seconds
# (19:51:26, 19:52:00, 19:52:15) because lanes promoted the same site at the same
# time. Earlier the same evening two of those collisions published a half-written
# bundle that Netlify marked "ready" while every route served 404. Announcing in the
# claims file is a convention; this is a lock, and a lock cannot be forgotten.
#
# USE IT INSTEAD OF `netlify deploy`:
#   scripts/broker-deploy.sh marketing        # broker.reddenda.com
#   scripts/broker-deploy.sh app              # app.reddenda.com/broker
#
# It refuses to run while another deploy holds the lock, carries every flag that has
# bitten us, verifies the LIVE site afterwards, and prints the rollback command if
# the verify fails. Releases the lock on any exit, including Ctrl-C.
set -e
export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin"

TARGET="${1:-}"
case "$TARGET" in
  marketing) REPO=/Users/user/reddenda-broker; SITE=c8c98ef9-b423-41cc-b8ff-2436d12b49c4
             HOST=https://broker.reddenda.com; GATE=/api/gate
             ROUTES=(/ /brokers /general-agencies /employers /methodology /rates /demo/book) ;;
  app)       REPO=/Users/user/reddenda-app;    SITE=b66420b1-bb46-4afc-ac34-c61e8db43131
             HOST=https://app.reddenda.com;    GATE=/broker/api/gate
             ROUTES=(/broker /broker/console /broker/console/rates /broker/console/brief /broker/console/site-of-care /broker/console/network /broker/console/national /broker/console/exhibit) ;;
  *) echo "usage: broker-deploy.sh {marketing|app}"; exit 2 ;;
esac

LOCK="/tmp/.broker-deploy-${TARGET}.lock"
LANE="${LANE:-$(basename ${TMPDIR:-unknown})}"

# mkdir is atomic on every filesystem we run on. Two lanes racing: exactly one wins.
if ! mkdir "$LOCK" 2>/dev/null; then
  echo "⛔ ANOTHER DEPLOY HOLDS THE $TARGET LOCK."
  echo "   holder: $(cat $LOCK/owner 2>/dev/null || echo unknown)  since: $(cat $LOCK/started 2>/dev/null || echo '?')"
  echo "   Wait for it, or if it is stale (>15 min) remove it: rm -rf $LOCK"
  exit 9
fi
echo "$LANE" > "$LOCK/owner"; date +%H:%M:%S > "$LOCK/started"
trap 'rm -rf "$LOCK"' EXIT INT TERM

cd "$REPO"
echo "=== 1. lock acquired by $LANE for $TARGET ==="
echo "=== 2. shipping $(git rev-parse --short HEAD)  $(git log -1 --format=%s) ==="
DIRTY=$(git status --porcelain | wc -l | tr -d ' ')
echo "    ($DIRTY uncommitted paths WILL ride along — this builds from the working tree)"

echo "=== 3. link guard ==="
netlify status 2>&1 | grep -iE "Current project|Project Id" | sed 's/^/    /'

echo "=== 4. deploy ==="
# --site: never trust the cwd, it used to resolve to reddenda-app-prod from this repo.
# --skip-functions-cache: without it Netlify serves the CACHED middleware and your
#   gate change silently does not ship. This cost two deploys.
# NO NEXT_DIST_DIR: netlify.toml publishes ".next" regardless of where you build, so
#   isolating the build dir publishes ANOTHER lane's directory. That caused an outage.
netlify deploy --prod --build --skip-functions-cache --site "$SITE" 2>&1 | tail -25

# ── THE BUILD'S EXIT CODE, NOT tail'S. ────────────────────────────────────────
# `cmd | tail` makes $? belong to tail, which succeeds no matter what the build did,
# and `set -e` sees a zero-exit pipeline and carries on. So a failed build fell
# straight through into step 5, which then verified the PREVIOUS deploy and printed
# "✅ all routes 200" over "build.command failed". Measured 2026-08-07: every app
# promote between 21:19 and 22:5x UTC failed, and every one of them reported success.
# A control that reports success on failure is worse than no control.
BUILD_STATUS=${pipestatus[1]}
if [ "$BUILD_STATUS" != "0" ]; then
  echo ""
  echo "🚨 BUILD FAILED (exit $BUILD_STATUS). NOTHING WAS PUBLISHED."
  echo "   Not verifying: the live site still serves the PREVIOUS deploy, and checking"
  echo "   it would report that deploy's health as if it were yours."
  echo "   Fix the build, then run this again."
  exit 1
fi

echo "=== 5. VERIFY THE LIVE SITE. A 'ready' state is not evidence — both outages were 'ready'. ==="
J=$(mktemp); curl -s -o /dev/null -c "$J" -X POST "$HOST$GATE" \
   -H "content-type: application/json" -d '{"pin":"110124"}' -m 20 || true

# ── PROVE THE HANDSHAKE BEFORE TRUSTING A SINGLE 200. ─────────────────────────
# If the gate POST fails, every gated route answers 200 with the ENTRY SCREEN, and a
# status-only loop passes vacuously on a site serving nothing but a PIN prompt. Assert
# the session is real first, then assert per route that the body is not that screen.
if ! grep -qi "csnd_entry" "$J" 2>/dev/null; then
  echo "    ⚠️  gate handshake did not set a session cookie."
  echo "       Every gated route will answer 200 with the entry screen, so a status"
  echo "       check here would pass on a site that shipped nothing. Refusing to verify."
  rm -f "$J"; exit 1
fi

BAD=0
for r in $ROUTES; do
  BODY=$(mktemp)
  c=$(curl -s -o "$BODY" -b "$J" -w '%{http_code}' -m 25 "$HOST$r")
  NOTE=""
  # The gate rewrites an unknown path to the entry screen, which is ALSO a 200. A
  # status code cannot tell a shipped page from a missing one on a gated host.
  if grep -qi "Enter the code\|Get access" "$BODY" 2>/dev/null; then
    NOTE="  <- SERVED THE ENTRY SCREEN, NOT THE ROUTE"; c="200/gate"
  fi
  printf "    %-34s %s%s\n" "$r" "$c" "$NOTE"
  [ "$c" != "200" ] && BAD=$((BAD+1))
  rm -f "$BODY"
done
rm -f "$J"

if [ "$BAD" -gt 0 ]; then
  echo ""
  echo "🚨 $BAD ROUTE(S) NOT 200. ROLL BACK NOW, DO NOT FIX FORWARD:"
  echo "   netlify api restoreSiteDeploy --data '{\"site_id\":\"$SITE\",\"deploy_id\":\"<last good>\"}'"
  echo "   last verified-good marketing deploy: 6a760d32020745071554150a"
  exit 1
fi
echo "✅ all routes 200. Post your deploy id in .terminal-claims.md."
