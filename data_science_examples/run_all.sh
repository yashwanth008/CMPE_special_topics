#!/usr/bin/env bash
# Launch every project's backend + frontend in the background for local screen recording.
# Usage: ./run_all.sh
# Stop everything with: ./stop_all.sh

set -uo pipefail
cd "$(dirname "$0")"

mkdir -p .run/logs
PIDFILE=.run/pids.txt
> "$PIDFILE"

# name : app-dir : backend-subdir : frontend-subdir : backend-port : frontend-port : backend-runtime(python|node|none)
PROJECTS=(
  "00_dynamic_todo_workspace:server:client:5000:5173:node"
  "01_nyc_taxi_trip_prediction:server:client:8000:5174:python"
  "02_nano_llm_transformer:server:client:8002:5175:python"
  "03_customer_segmentation_clustering:server:client:8003:5176:python"
  "04_associative_pattern_mining:server:client:8004:5177:python"
  "05_data_science_skills_lab:server:client:8005:5178:python"
  "06_anomaly_detection:server:client:8006:5179:python"
  "07_automl_autogluon:server:client:8007:5180:python"
  "08_datascience_visual_mastery:server:client:8008:5181:python"
  "09_flowforge_dag_engine:backend:frontend:8009:5182:python"
  "10_crispdm_masters_curriculum:backend:frontend:8010:5183:python"
  "11_enterprise_ds_audit:backend:frontend:8011:5184:python"
  "12_timeseries_forecasting:backend:frontend:8012:5185:python"
  "13_crispdm_nyc_taxi_audit_platform:server:client:8013:5186:python"
  "14_autogluon_multimodal_automl_suite:server:client:8014:5187:python"
  "15_spy_timeseries_sota_forecasting:server:client:8015:5188:python"
)

# Several backends import PyTorch alongside LightGBM/XGBoost/CatBoost in the same
# process (projects 07, 14, 15). On macOS these native libraries each bring their
# own OpenMP runtime, and running them back-to-back can deadlock indefinitely the
# first time a torch model (e.g. the LSTM in project 15) trains — confirmed by
# reproducing it directly. Capping thread counts avoids the conflict with no code
# changes needed.
export OMP_NUM_THREADS=1
export KMP_DUPLICATE_LIB_OK=TRUE
export MKL_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1

# Preflight: warn about any port that's already taken by something else before we
# even try to launch, so failures are obvious instead of buried in a log file.
echo "Checking ports..."
for entry in "${PROJECTS[@]}"; do
  IFS=":" read -r dir be fe bport fport runtime <<< "$entry"
  for port in "$bport" "$fport"; do
    owner_pid=$(lsof -ti:"$port" 2>/dev/null | head -1)
    if [ -n "$owner_pid" ]; then
      owner_cmd=$(ps -p "$owner_pid" -o comm= 2>/dev/null)
      echo "  WARNING: port $port ($dir) is already in use by PID $owner_pid ($owner_cmd) — that project may fail to start."
      if [ "$port" = "5000" ]; then
        echo "           Port 5000 is commonly held by macOS's AirPlay Receiver (ControlCenter)."
        echo "           Fix: System Settings -> General -> AirDrop & Handoff -> turn off 'AirPlay Receiver', then re-run."
      fi
    fi
  done
done
echo ""

echo "Starting all 16 projects..."
echo ""

for entry in "${PROJECTS[@]}"; do
  IFS=":" read -r dir be fe bport fport runtime <<< "$entry"

  # --- backend ---
  if [ "$runtime" = "python" ]; then
    if [ -f "$dir/$be/requirements.txt" ]; then
      python3 -m pip install -q -r "$dir/$be/requirements.txt" 2>>".run/logs/${dir}-backend-install.log" &
    fi
    (
      cd "$dir/$be" || exit 1
      python3 -m uvicorn main:app --host 127.0.0.1 --port "$bport" \
        > "../../.run/logs/${dir}-backend.log" 2>&1 &
      echo $! >> "../../$PIDFILE"
    )
  elif [ "$runtime" = "node" ]; then
    (
      cd "$dir/$be" || exit 1
      npm run dev > "../../.run/logs/${dir}-backend.log" 2>&1 &
      echo $! >> "../../$PIDFILE"
    )
  fi

  # --- frontend ---
  (
    cd "$dir/$fe" || exit 1
    npm run dev -- --port "$fport" --strictPort > "../../.run/logs/${dir}-frontend.log" 2>&1 &
    echo $! >> "../../$PIDFILE"
  )

  echo "  [$dir] backend :$bport   frontend :$fport"
done

wait
sleep 3

echo ""
echo "All processes launched. Give it 5-15 seconds for everything to finish booting"
echo "(watch a project's log with: tail -f .run/logs/<project>-frontend.log)."
echo ""
echo "Open these in your browser:"
for entry in "${PROJECTS[@]}"; do
  IFS=":" read -r dir be fe bport fport runtime <<< "$entry"
  echo "  http://localhost:$fport/   ($dir)"
done
echo ""
echo "Backend health checks:"
for entry in "${PROJECTS[@]}"; do
  IFS=":" read -r dir be fe bport fport runtime <<< "$entry"
  echo "  http://localhost:$bport/docs   ($dir backend)"
done
echo ""
echo "When you're done recording, stop everything with: ./stop_all.sh"
