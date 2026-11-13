#!/usr/bin/env bash
# Runs every lab in dependency order and logs to results/run_all.log (about 8-10 minutes on a laptop CPU).
# Reading labs 10.01/10.02 and the two comparison labs 10.09/10.12 write documents that CITE measured numbers,
# so the experiment labs they depend on run first; the docs are the last thing generated.
set -euo pipefail
cd "$(dirname "$0")/labs"
mkdir -p ../results
LOG=../results/run_all.log
: > "$LOG"
run() { echo -e "\n\n######## $1 ########" | tee -a "$LOG"; python3 "$1" 2>&1 | tee -a "$LOG"; }
run lab_10_03_run_budget_rsi.py
run lab_10_04_analyze_scoring.py
run lab_10_05_extend_features.py
run lab_10_06_run_so_rsi.py
run lab_10_07_analyze_probes.py
run lab_10_08_apply_debugging.py
run lab_10_10_areal_leader_follower.py
run lab_10_11_swarm.py
run lab_10_13_rsiflow_meta_agent.py
run lab_10_14_self_hpo.py
run lab_10_15_rsi_index.py
run lab_10_16_environments.py
run lab_10_17_metrics.py
# documents (cite the numbers above)
run lab_10_01_claim_vs_evidence.py
run lab_10_02_audit_paper.py
run lab_10_09_compare_scaling.py
run lab_10_12_compare_workflow.py
echo -e "\nALL LABS DONE" | tee -a "$LOG"
