"""json-render x STATIC. The app owns the spec (with $state bindings). The model returns only STATE.
Run: python part4_json_render/static_mode.py"""
import sys, pathlib, json; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import CATALOG, validate_spec
from common.fixtures import SALES
from common.llm import ScriptedLLM
from common.render import render_text, save_page
from common.ui import banner, step, show
from part4_json_render.jr import resolve_state

banner("JSON-RENDER / STATIC: app-owned spec, model fills $state")
APP_SPEC = {"root": "page", "elements": {
    "page": {"type": "Stack", "props": {}, "children": ["kpi", "chart"]},
    "kpi": {"type": "Metric", "props": {"label": "Q3 revenue", "value": {"$state": "/revenue"}, "delta": {"$state": "/growth"}}},
    "chart": {"type": "BarChart", "props": {"data": {"$state": "/regions"}}}}}
step(1, "App spec with bindings (never model-written)"); show("spec", APP_SPEC)
step(2, "Model replies with state only"); state = json.loads(ScriptedLLM([SALES]).next()); show("state", state)
step(3, "Resolve bindings, validate, render")
spec = {**APP_SPEC, "elements": {k: resolve_state(v, state) for k, v in APP_SPEC["elements"].items()}}
validate_spec(spec, CATALOG); print(render_text(spec)); save_page(spec, "out/part4_static.html")
step(4, "Unbound state paths fail loudly (a model can't invent structure by inventing state)")
try: resolve_state(APP_SPEC["elements"]["kpi"], {"revenue": "x"})
except KeyError as e: print("  missing state key:", e)
