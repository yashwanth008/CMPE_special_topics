"""OpenUI Lang x STATIC. The model writes ONE statement calling a pre-built component; the app allow-lists it.
Run: python part5_openui/static_mode.py"""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import CATALOG
from common.render import render_text, save_page
from common.ui import banner, step
from part5_openui.openui import StreamParser

banner("OPENUI LANG / STATIC: one allow-listed component call")
STATIC_ALLOWED = {"Metric"}
for i, reply in enumerate(['root = Metric("Q3 revenue", "$1.24M", "+8.2%")',
                           'root = Stack([a])\na = Heading("model tried a layout")'], 1):
    step(i, f"model reply: {reply.splitlines()[0]}")
    p = StreamParser(CATALOG); spec = p.feed(reply + "\n")
    kinds = {n["type"] for n in spec["elements"].values()}
    if kinds - STATIC_ALLOWED: print(f"  REJECTED: static mode only allows {STATIC_ALLOWED}, got {kinds}"); continue
    print(render_text(spec)); save_page(spec, "out/part5_static.html")
