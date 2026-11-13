"""AG-UI x MIXED. Snapshot spec with an HtmlArtifact node, plus a full user-action round trip.

Round trip: click -> client POSTs a new run with forwardedProps.action -> server checks the action
against an allow-list -> STATE_DELTA -> UI updates. A click is never an arbitrary tool call.
Run: python part2_agui/mixed_mode.py
"""
import sys, pathlib, json; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import HYBRID_CATALOG, validate_spec
from common.fixtures import MIXED_SPEC, SALES
from common.jsonpatch import apply_patch
from common.render import render_text, save_page
from common.sandbox import ALLOWED_ACTIONS
from common.ui import banner, step, show
from part2_agui.events import event, sse_encode, sse_decode, run_input

banner("AG-UI / MIXED: catalog + sandboxed region, with an action round trip")

def agent(inp):
    yield event("RUN_STARTED", threadId=inp["threadId"], runId=inp["runId"])
    act = inp["forwardedProps"].get("action")
    if act is None:
        yield event("STATE_SNAPSHOT", snapshot={"ui": MIXED_SPEC})
    else:
        name, _, arg = act.partition(":")
        if name not in ALLOWED_ACTIONS:                       # server-side authorization
            yield event("RUN_ERROR", message=f"action '{name}' not permitted", code="forbidden")
            return
        yield event("STATE_DELTA", delta=[{"op": "replace", "path": "/ui/elements/title/props/text",
                                           "value": f"{arg}: {SALES['regions'][arg]}k revenue"}])
    yield event("RUN_FINISHED", threadId=inp["threadId"], runId=inp["runId"])

def run(inp, state):
    for ev in sse_decode("".join(sse_encode(e) for e in agent(inp))):
        print(f"  {ev['type']}")
        if ev["type"] == "STATE_SNAPSHOT": state = ev["snapshot"]
        if ev["type"] == "STATE_DELTA": state = apply_patch(state, ev["delta"])
        if ev["type"] == "RUN_ERROR": print("  ERROR:", ev["message"])
    return state

step(1, "Run 1: initial UI.")
state = run({**run_input()}, {})
validate_spec(state["ui"], HYBRID_CATALOG); print(render_text(state["ui"]))

step(2, "User clicks 'Show EMEA details' -> run 2 carries the action name.")
state = run(run_input(state=state, action="show_region:EMEA"), state)
print(render_text(state["ui"]))

step(3, "A forged action is refused by the SERVER, whatever the UI claims.")
run(run_input(state=state, action="export_customer_table:all"), state)
save_page(state["ui"], "out/part2_mixed.html")
