"""A2UI x MIXED. Catalog components for the routine parts, ONE HtmlArtifact for the custom region.

The report's recommended default: declarative everywhere, open-ended only where needed.
Run: python part1_a2ui/mixed_mode.py
"""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import HYBRID_CATALOG
from common.fixtures import MIXED_SPEC
from common.render import render_text, save_page
from common.sandbox import check_message
from common.ui import banner, step, show
from part1_a2ui.wire import Surface, spec_to_messages, encode_jsonl

banner("A2UI / MIXED: catalog components + one sandboxed custom region")

step(1, "Messages: same four envelopes, one component is the escape hatch.")
msgs = spec_to_messages(MIXED_SPEC, bind_chart=False)
show("components", [c["id"] + " -> " + next(iter(c["component"])) for c in msgs[0]["surfaceUpdate"]["components"]])

step(2, "Apply, resolve, render. Heading/Metric/Button are native; the chart is sandboxed.")
s = Surface()
for m in msgs: s.apply(m, HYBRID_CATALOG)
spec = s.resolve(HYBRID_CATALOG)
print(render_text(spec)); save_page(spec, "out/part1_mixed.html")

step(3, "Close the loop: a click becomes a NAMED action; the app decides if it is permitted.")
for action in ({"type": "action", "name": "show_region", "arg": "EMEA"},
               {"type": "action", "name": "export_customer_table", "arg": "all"}):
    try: print("OK     ", check_message(action))
    except PermissionError as e: print("DENIED ", e)
