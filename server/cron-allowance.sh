cleanup() {
  echo "\ncleaning up..."
  if [ -n "${SERVER_PID-}" ]; then
    kill "$SERVER_PID"
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

echo "spinning up the server"
bun run start &

sleep 5
SERVER_PID=$(lsof -t -i :3000)
echo "server running with PID: $SERVER_PID"

echo "sleeping to call allowance"
sleep 5

echo "calling /slash/cron/allowance"
curl localhost:3000/slash/cron/allowance
