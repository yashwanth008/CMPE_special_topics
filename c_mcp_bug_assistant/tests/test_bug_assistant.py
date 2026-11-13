import asyncio
import json
import os
import sqlite3
import sys

import pytest
from adk_testing import ScriptedLlm, call, last_text, text
from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from google.genai import types

from bug_assistant.agent import (INSTRUCTION, build_agent, extract_error_signature, make_ticket_toolsets)


@pytest.fixture(autouse=True)
def tickets_db(tmp_path, monkeypatch):
    monkeypatch.setenv("TICKETS_DB", str(tmp_path / "t.db"))
    monkeypatch.delenv("MCP_TICKETS_URL", raising=False)
    # the MCP subprocess must be able to import bug_assistant
    root = os.path.dirname(os.path.dirname(__file__))
    monkeypatch.setenv("PYTHONPATH", root)
    return tmp_path / "t.db"


def test_extract_error_signature():
    tb = 'Traceback...\n  File "auth/session.py", line 88, in get\nKeyError: session_token'
    sig = extract_error_signature(tb)
    assert sig["exception"] == "KeyError" and "auth/session.py" in sig["location"]


def _run(agent, msgs):
    """Multi-turn helper; msgs may be strings or Content objects. Returns all events."""
    async def go():
        r = InMemoryRunner(agent=agent, app_name="t")
        s = await r.session_service.create_session(app_name="t", user_id="u")
        evs = []
        for m in msgs:
            content = m if isinstance(m, types.Content) else types.Content(role="user", parts=[types.Part(text=m)])
            async for e in r.run_async(user_id="u", session_id=s.id, new_message=content):
                evs.append(e)
        await r.close()
        return evs
    return asyncio.run(go())


def _responses(evs):
    return [p.function_response for e in evs for p in (e.content.parts if e.content else []) if p.function_response]


def test_mcp_tools_discovered_with_allowlist():
    read, write = make_ticket_toolsets()
    async def go():
        from google.adk.agents.readonly_context import ReadonlyContext  # noqa
        rn = [t.name for t in await read.get_tools()]
        wn = [t.name for t in await write.get_tools()]
        await read.close(); await write.close()
        return rn, wn
    rn, wn = asyncio.run(go())
    assert sorted(rn) == ["get_ticket", "search_tickets", "ticket_stats"]
    assert sorted(wn) == ["create_ticket", "update_ticket_status"]


def test_search_goes_through_real_mcp_server():
    llm = ScriptedLlm(rules=[("Software Bug Assistant", [
        call("search_tickets", query="login 500"),
        text("Found ticket 1: Login 500 error after password reset (open).")])])
    evs = _run(build_agent(llm), ["Users get a 500 on login"])
    out = json.dumps([r.response for r in _responses(evs)])
    assert "Login 500 error after password reset" in out
    assert "Found ticket 1" in last_text(evs)


def _confirm_call_id(evs):
    for e in evs:
        for p in (e.content.parts if e.content else []):
            if p.function_call and p.function_call.name == "adk_request_confirmation":
                return p.function_call.id
    return None


def _count(db, title):
    from bug_assistant.mcp_servers import tickets_server as s  # noqa: F401  (ensures schema exists)
    con = s._db()
    try:
        return con.execute("SELECT COUNT(*) FROM tickets WHERE title=?", (title,)).fetchone()[0]
    finally:
        con.close()


CREATE = call("create_ticket", title="Crash on export", description="repro", severity="high", component="export")


def test_write_requires_confirmation_and_nothing_is_written_before_approval(tickets_db):
    llm = ScriptedLlm(rules=[("Software Bug Assistant", [CREATE, text("Waiting for approval.")])])
    evs = _run(build_agent(llm), ["File a ticket: crash on export"])
    assert _confirm_call_id(evs)                      # run paused for a human
    assert _count(tickets_db, "Crash on export") == 0


def _confirmation(call_id, confirmed):
    return types.Content(role="user", parts=[types.Part(function_response=types.FunctionResponse(
        id=call_id, name="adk_request_confirmation", response={"confirmed": confirmed}))])


def _two_turn(confirmed):
    llm = ScriptedLlm(rules=[("Software Bug Assistant", [CREATE, text("Done.")])])
    agent = build_agent(llm)

    async def go():
        r = InMemoryRunner(agent=agent, app_name="t")
        s = await r.session_service.create_session(app_name="t", user_id="u")
        first = []
        async for e in r.run_async(user_id="u", session_id=s.id, new_message=types.Content(
                role="user", parts=[types.Part(text="file it")])):
            first.append(e)
        cid = _confirm_call_id(first)
        second = []
        async for e in r.run_async(user_id="u", session_id=s.id, new_message=_confirmation(cid, confirmed)):
            second.append(e)
        await r.close()
        return second
    return asyncio.run(go())


def test_ticket_is_created_after_human_approves(tickets_db):
    evs = _two_turn(True)
    assert _count(tickets_db, "Crash on export") == 1, [r.response for r in _responses(evs)]


def test_ticket_not_created_when_human_rejects(tickets_db):
    _two_turn(False)
    assert _count(tickets_db, "Crash on export") == 0


def test_server_validation_rejects_bad_severity():
    from bug_assistant.mcp_servers import tickets_server as s
    with pytest.raises(ValueError):
        s.create_ticket("t", "d", "catastrophic", "x")
    with pytest.raises(ValueError):
        s.update_ticket_status(999, "closed")
    # SQL-injection style input is just data
    assert s.search_tickets("'; DROP TABLE tickets;--") == []
    assert s.ticket_stats()["by_status"]["open"] >= 1


def test_instruction_enforces_dedupe_first():
    assert "ALWAYS call search_tickets first" in INSTRUCTION
