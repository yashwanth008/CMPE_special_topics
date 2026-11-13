#!/usr/bin/env bash
# Runs all 24 codelabs, saves each run's real output to logs/, then screenshots every generated page.
# Record your video of this: GENUI_PAUSE=1 ./run_all.sh part1_a2ui  (pauses at every step)
set -e; cd "$(dirname "$0")"; mkdir -p logs out
parts=${1:-"part1_a2ui part2_agui part3_mcp_apps part4_json_render part5_openui part6_harness"}
for p in $parts; do for m in static declarative open_ended mixed; do
  echo ">>> python $p/${m}_mode.py"; python "$p/${m}_mode.py" 2>&1 | tee "logs/${p}_${m}.txt"
done; done
python tools/screenshots.py
