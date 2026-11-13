"""OpenUI Lang x MIXED. Catalog statements plus one HtmlArtifact statement (OpenUI's own 'html artifact' idea).
Run: python part5_openui/mixed_mode.py"""
import sys, pathlib, json; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import HYBRID_CATALOG
from common.fixtures import MIXED_HTML
from common.llm import ScriptedLLM
from common.render import render_text, save_page
from common.ui import banner, step
from part5_openui.openui import StreamParser

banner("OPENUI LANG / MIXED: catalog statements + one sandboxed artifact")
LANG = f'''root = Stack([title, kpi, art, more])
title = Heading("Q3 sales summary")
kpi = Metric("Revenue", "$1.24M", "+8.2%")
art = HtmlArtifact({json.dumps(MIXED_HTML)}, 110)
more = Button("Show EMEA details", "show_region:EMEA")
'''
step(1, "Stream and parse")
p = StreamParser(HYBRID_CATALOG)
for c in ScriptedLLM.stream(LANG, 50): p.feed(c)
spec = p.finish(); print("  errors:", p.errors or "none"); print(render_text(spec)); save_page(spec, "out/part5_mixed.html")
step(2, "The same text is rejected by a catalog WITHOUT the escape hatch")
from common.catalog import CATALOG
p2 = StreamParser(CATALOG)
for c in ScriptedLLM.stream(LANG, 50): p2.feed(c)
p2.finish(); print("  errors:", p2.errors)
