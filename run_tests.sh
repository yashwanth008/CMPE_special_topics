#!/usr/bin/env bash
# Runs every agent's offline test-suite (each in its own process: modules have the same layout).
set -euo pipefail
cd "$(dirname "$0")"
pip install -q -r a_lead_generation_agent/requirements.txt sqlalchemy aiosqlite >/dev/null
for d in a_lead_generation_agent b_gemini_cli_tool_agent c_mcp_bug_assistant d_code_review_assistant e_ecommerce_agent; do
  echo "=================== $d"; python -m pytest "$d" -q -p no:cacheprovider -W ignore "$@"
done
