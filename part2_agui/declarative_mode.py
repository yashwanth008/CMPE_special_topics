"""AG-UI x DECLARATIVE. UI = shared state. STATE_SNAPSHOT carries the spec, STATE_DELTA patches it.

Generative UI as state: the page re-renders whenever its copy of the state changes.
Run: python part2_agui/declarative_mode.py
"""
import sys, pathlib, json; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import CATALOG, validate_spec
from common.fixtures import DECL_SPEC
from common.jsonpatch import apply_patch
from common.render import render_text, save_page
from common.ui import banner, step, show
from part2_agui.events import event, sse_encode, sse_decode, run_input

banner("AG-UI / DECLARATIVE: spec as shared state, updated by JSON Patch deltas")

def agent(inp):
    yield event("RUN_STARTED", threadId=inp["threadId"], runId=inp["runId"])
    yield event("STATE_SNAPSHOT", snapshot={"ui": DECL_SPEC})
    # later: the agent learns APAC grew. It sends ONE patch, not the whole UI again.
    yield event("STATE_DELTA", delta=[{"op": "replace", "path": "/ui/elements/chart/props/data/APAC", "value": 455}])
    yield event("RUN_FINISHED", threadId=inp["threadId"], runId=inp["runId"])

step(1, "Run the agent, encode to SSE, decode on the client.")
wire = "".join(sse_encode(e) for e in agent(run_input()))
state = {}
for ev in sse_decode(wire):
    print(f"event: {ev['type']}")
    if ev["type"] == "STATE_SNAPSHOT":
        state = ev["snapshot"]
        validate_spec(state["ui"], CATALOG)          # validate BEFORE rendering
        step(2, "Snapshot received and validated -> first render")
        print(render_text(state["ui"]))
    elif ev["type"] == "STATE_DELTA":
        show("delta", ev["delta"])
        state = apply_patch(state, ev["delta"])
        validate_spec(state["ui"], CATALOG)
        step(3, "Delta applied -> re-render (only the APAC bar changed)")
        print(render_text(state["ui"]))
save_page(state["ui"], "out/part2_declarative.html")
