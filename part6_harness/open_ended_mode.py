"""Harness x OPEN-ENDED. render_html lints markup. A hostile attempt is rejected as a tool result; the model retries.
Run: python part6_harness/open_ended_mode.py"""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from part6_harness._demo import *
from common.catalog import CATALOG
from common.fixtures import OPEN_HTML, HOSTILE_HTML
banner("HARNESS / OPEN-ENDED: render_html with lint + sandbox")
h = Harness(ScriptedModel([{"tool": "render_html", "args": {"html": HOSTILE_HTML}},
                           {"tool": "render_html", "args": {"html": OPEN_HTML}}, {"text": "Custom chart shown."}]),
            CATALOG, "out/part6_open_ended.html")
step(1, "Run the agent loop"); h.run("Draw me something custom for Q3 sales")
