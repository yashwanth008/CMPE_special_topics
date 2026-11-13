"""Harness x DECLARATIVE. render_ui validates against the catalog; the first attempt is wrong, the error comes
back as a TOOL RESULT, and the model self-corrects on the next turn.
Run: python part6_harness/declarative_mode.py"""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from part6_harness._demo import *
from common.catalog import CATALOG
from common.fixtures import DECL_SPEC, BAD_SPEC
banner("HARNESS / DECLARATIVE: validated render_ui with a self-correction turn")
h = Harness(ScriptedModel([{"tool": "get_sales_data"}, {"tool": "render_ui", "args": {"spec": BAD_SPEC}},
                           {"tool": "render_ui", "args": {"spec": DECL_SPEC}}, {"text": "Dashboard shown."}]),
            CATALOG, "out/part6_declarative.html")
step(1, "Run the agent loop"); h.run("Give me a Q3 sales summary")
