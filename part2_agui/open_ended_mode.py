"""AG-UI x OPEN-ENDED. The agent streams HTML as tool-call args; the client assembles, lints, sandboxes.

Streaming matters here: chunks arrive piecemeal, so nothing is rendered until TOOL_CALL_END.
Run: python part2_agui/open_ended_mode.py
"""
import sys, pathlib, json; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.fixtures import OPEN_HTML, HOSTILE_HTML
from common.llm import ScriptedLLM
from common.render import save_page
from common.sandbox import lint_html, wrap_iframe
from common.ui import banner, step, show
from part2_agui.events import event, sse_encode, sse_decode, new_id, run_input

banner("AG-UI / OPEN-ENDED: streamed HTML in tool args, sandboxed on arrival")

def agent(inp, markup):
    call = new_id("call")
    yield event("RUN_STARTED", threadId=inp["threadId"], runId=inp["runId"])
    yield event("TOOL_CALL_START", toolCallId=call, toolCallName="render_html")
    for c in ScriptedLLM.stream(json.dumps({"html": markup}), 120):
        yield event("TOOL_CALL_ARGS", toolCallId=call, delta=c)
    yield event("TOOL_CALL_END", toolCallId=call)
    yield event("RUN_FINISHED", threadId=inp["threadId"], runId=inp["runId"])

def client(wire):
    buf, chunks = "", 0
    for ev in sse_decode(wire):
        if ev["type"] == "TOOL_CALL_ARGS": buf += ev["delta"]; chunks += 1
        if ev["type"] == "TOOL_CALL_END":
            markup = json.loads(buf)["html"]
            print(f"  assembled {len(markup)} chars from {chunks} ARGS chunks (nothing drawn before END)")
            findings = lint_html(markup)
            if findings: print("  BLOCKED:", findings); return None
            print("  lint clean -> render in sandboxed iframe"); return wrap_iframe(markup, 170)

for i, (name, markup) in enumerate((("friendly", OPEN_HTML), ("hostile", HOSTILE_HTML)), 1):
    step(i, f"{name} agent run")
    out = client("".join(sse_encode(e) for e in agent(run_input(), markup)))
    if out:
        print("  iframe tag starts:", out[:105] + "...")
        save_page("<!doctype html><meta charset=utf-8>" + out, "out/part2_open_ended.html")
