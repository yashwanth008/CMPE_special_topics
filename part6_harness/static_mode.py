"""Harness x STATIC. The model calls a preset tool (show_metric); the harness draws on two surfaces.
Run: python part6_harness/static_mode.py"""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from part6_harness._demo import *
from common.catalog import CATALOG
from common.fixtures import STATIC_CALL
banner("HARNESS / STATIC: preset UI tool in the agent loop")
h = Harness(ScriptedModel([{"tool": "get_sales_data"}, {"tool": "show_metric", "args": STATIC_CALL["arguments"]},
                           {"text": "Q3 revenue is $1.24M, up 8.2%."}]), CATALOG, "out/part6_static.html")
step(1, "Run the agent loop"); h.run("Give me a Q3 sales summary")
