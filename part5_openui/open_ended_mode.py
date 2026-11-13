"""OpenUI Lang x OPEN-ENDED. The statement `root = HtmlArtifact("<markup>", height)`: the string is the escape hatch.
Run: python part5_openui/open_ended_mode.py"""
import sys, pathlib, json; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import HYBRID_CATALOG
from common.fixtures import OPEN_HTML, HOSTILE_HTML
from common.render import render_text, save_page
from common.sandbox import lint_html
from common.ui import banner, step
from part5_openui.openui import StreamParser

banner("OPENUI LANG / OPEN-ENDED: markup as a string argument")
for i, (name, h) in enumerate((("friendly", OPEN_HTML), ("hostile", HOSTILE_HTML)), 1):
    step(i, f"{name}: model writes one HtmlArtifact statement")
    line = f"root = HtmlArtifact({json.dumps(h)}, 200)\n"; print("  wire>", line[:90].replace("\\n", " ") + "...")
    p = StreamParser(HYBRID_CATALOG); spec = p.feed(line)
    print("  parse errors:", p.errors or "none", "| lint:", lint_html(h) or "clean")
    if lint_html(h): print("  -> blocked before render"); continue
    print(render_text(spec)); save_page(spec, "out/part5_open_ended.html")
