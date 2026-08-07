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

echo "=== 5. VERIFY THE LIVE SITE. A 'ready' state is not evidence — both outages were 'ready'. ==="
J=$(mktemp); curl -s -o /dev/null -c "$J" -X POST "$HOST$GATE" \
   -H "content-type: application/json" -d '{"pin":"110124"}' -m 20 || true
BAD=0
for r in $ROUTES; do
  c=$(curl -s -o /dev/null -b "$J" -w '%{http_code}' -m 25 "$HOST$r")
  printf "    %-34s %s\n" "$r" "$c"
  [ "$c" != "200" ] && BAD=$((BAD+1))
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
