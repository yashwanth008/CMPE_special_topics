"""Harness x MIXED. Catalog + HtmlArtifact spec, then the full action loop with a permission gate.
Run: python part6_harness/mixed_mode.py"""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from part6_harness._demo import *
from common.catalog import HYBRID_CATALOG
from common.fixtures import MIXED_SPEC
import copy
banner("HARNESS / MIXED: hybrid surface + action permission gate")
h = Harness(ScriptedModel([{"tool": "get_sales_data"}, {"tool": "render_ui", "args": {"spec": copy.deepcopy(MIXED_SPEC)}},
                           {"text": "Hybrid dashboard shown."}]), HYBRID_CATALOG, "out/part6_mixed.html")
step(1, "Run the agent loop"); h.run("Give me a Q3 sales summary with a custom chart")
step(2, "User clicks a button defined in the spec"); h.on_ui_action("show_region:EMEA")
step(3, "A spec can name any action string. The gate, not the spec, grants permission"); h.on_ui_action("export_customer_table:all")
