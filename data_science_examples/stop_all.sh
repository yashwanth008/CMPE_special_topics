#!/usr/bin/env bash
# Stops every process started by run_all.sh
set -uo pipefail
cd "$(dirname "$0")"

PIDFILE=.run/pids.txt

if [ ! -f "$PIDFILE" ]; then
  echo "No .run/pids.txt found — nothing to stop (was run_all.sh ever started?)."
  exit 0
fi

count=0
while read -r pid; do
  [ -z "$pid" ] && continue
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null && count=$((count+1))
  fi
done < "$PIDFILE"

# also sweep the known ports in case anything spawned a child uvicorn/vite process
# that isn't the PID we recorded (uvicorn/npm sometimes fork a worker).
PORTS=(5000 5173 8000 5174 8002 5175 8003 5176 8004 5177 8005 5178 8006 5179 8007 5180 8008 5181 8009 5182 8010 5183 8011 5184 8012 5185 8013 5186 8014 5187 8015 5188)
for port in "${PORTS[@]}"; do
  leftover=$(lsof -ti:"$port" 2>/dev/null)
  if [ -n "$leftover" ]; then
    kill $leftover 2>/dev/null
  fi
done

> "$PIDFILE"
echo "Stopped $count tracked process(es) and swept all 16 project ports clean."
