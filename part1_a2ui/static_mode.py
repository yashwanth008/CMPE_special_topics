"""A2UI x STATIC. The app owns the layout; the agent only streams DATA.

The surface (structure) is hard-coded in the app and sent once. The model's reply is just a
dataModelUpdate. Nothing the model says can change what components exist.
Run: python part1_a2ui/static_mode.py
"""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import CATALOG
from common.fixtures import SALES
from common.llm import ScriptedLLM
from common.render import render_text, save_page
from common.ui import banner, step, show
from part1_a2ui.wire import Surface, encode_jsonl

banner("A2UI / STATIC: fixed surface, model supplies data only")

step(1, "App-owned surface. Written by a developer, never by the model.")
APP_SURFACE = [
    {"surfaceUpdate": {"surfaceId": "kpi", "components": [
        {"id": "card", "component": {"Metric": {"label": "Q3 revenue", "value": {"path": "/value"}, "delta": {"path": "/delta"}}}}]}},
    {"beginRendering": {"surfaceId": "kpi", "root": "card"}},
]
show("app messages", encode_jsonl(APP_SURFACE))

step(2, "The 'model' replies with data only (a dataModelUpdate).")
llm = ScriptedLLM([{"dataModelUpdate": {"surfaceId": "kpi", "contents": {"value": SALES["revenue"], "delta": SALES["growth"]}}}])
reply = __import__("json").loads(llm.next())
show("model reply", reply)

step(3, "Client applies app messages, then the model's data. Render.")
s = Surface()
for m in APP_SURFACE + [reply]:
    s.apply(m, CATALOG)
spec = s.resolve(CATALOG)
print(render_text(spec))
save_page(spec, "out/part1_static.html")

step(4, "Prove the boundary: the app only accepts dataModelUpdate from the model.")
def accept_from_model(msg):
    kind = next(iter(msg))
    if kind != "dataModelUpdate":
        raise PermissionError(f"static mode: model may not send '{kind}'")
    return msg
for attempt in (reply, {"surfaceUpdate": {"surfaceId": "kpi", "components": []}}):
    try: accept_from_model(attempt); print("accepted:", next(iter(attempt)))
    except PermissionError as e: print("REJECTED:", e)
