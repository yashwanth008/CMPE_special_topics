"""AG-UI: typed events stream from agent to frontend over SSE. (Teaching subset of the real event set.)

Lifecycle:  RUN_STARTED ... RUN_FINISHED
Text:       TEXT_MESSAGE_START / _CONTENT / _END
Tools:      TOOL_CALL_START / _ARGS / _END / _RESULT
State:      STATE_SNAPSHOT (full) and STATE_DELTA (RFC 6902 JSON Patch)
Other:      CUSTOM (named app-specific payload)
"""
import json, uuid

def event(type_, **kw):
    return {"type": type_, **kw}

def sse_encode(ev):
    """One event = one 'data:' line plus a blank line. This is the whole wire format."""
    return f"data: {json.dumps(ev)}\n\n"

def sse_decode(stream_text):
    """Client side: split the byte stream back into events."""
    for block in stream_text.split("\n\n"):
        if block.startswith("data: "):
            yield json.loads(block[6:])

def new_id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:6]}"

def run_input(thread="t1", message="Give me a Q3 sales summary", state=None, action=None):
    """What the frontend POSTs to start a run (RunAgentInput, simplified)."""
    return {"threadId": thread, "runId": new_id("run"), "state": state or {},
            "messages": [{"role": "user", "content": message}], "forwardedProps": {"action": action} if action else {}}
