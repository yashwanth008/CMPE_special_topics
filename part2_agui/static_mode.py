"""AG-UI x STATIC. Tool-call events drive pre-built components (the 'tool-based generative UI' pattern).

The agent streams TOOL_CALL events. The frontend has a registry {tool name -> component}.
The model selects; the frontend draws. Run: python part2_agui/static_mode.py
"""
import sys, pathlib, json; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.fixtures import STATIC_CALL
from common.llm import ScriptedLLM
from common.render import render_text, save_page
from common.ui import banner, step, show
from part2_agui.events import event, sse_encode, sse_decode, new_id, run_input

banner("AG-UI / STATIC: tool-call events -> fixed component registry")

def agent(inp):
    """The agent as a generator of events. Args are streamed in fragments, like model tokens."""
    run, call = inp["runId"], new_id("call")
    yield event("RUN_STARTED", threadId=inp["threadId"], runId=run)
    yield event("TOOL_CALL_START", toolCallId=call, toolCallName=STATIC_CALL["name"])
    for chunk in ScriptedLLM.stream(json.dumps(STATIC_CALL["arguments"]), 22):
        yield event("TOOL_CALL_ARGS", toolCallId=call, delta=chunk)
    yield event("TOOL_CALL_END", toolCallId=call)
    yield event("RUN_FINISHED", threadId=inp["threadId"], runId=run)

# Frontend registry: the ONLY things the agent can make appear.
REGISTRY = {"show_metric": lambda a: {"root": "m", "elements": {"m": {"type": "Metric", "props": a}}}}

step(1, "Frontend POSTs RunAgentInput; server answers with an SSE stream.")
inp = run_input(); show("RunAgentInput", inp)
wire = "".join(sse_encode(e) for e in agent(inp))
print("first 3 wire lines:"); [print("   ", l) for l in wire.split("\n\n")[:3]]

step(2, "Client decodes the stream and reacts to each event.")
args_buf = {}
for ev in sse_decode(wire):
    t = ev["type"]; extra = ev.get("delta") or ev.get("toolCallName") or ""
    print(f"  {t:<18} {extra}")
    if t == "TOOL_CALL_ARGS": args_buf[ev["toolCallId"]] += ev["delta"]
    if t == "TOOL_CALL_START": name = ev["toolCallName"]; args_buf[ev["toolCallId"]] = ""
    if t == "TOOL_CALL_END":
        args = json.loads(args_buf[ev["toolCallId"]])
        if name not in REGISTRY: print("  unknown tool -> ignored"); continue
        spec = REGISTRY[name](args)

step(3, "Registry lookup -> render.")
print(render_text(spec)); save_page(spec, "out/part2_static.html")
