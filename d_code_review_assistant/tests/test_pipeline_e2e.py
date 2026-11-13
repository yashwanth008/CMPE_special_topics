import asyncio

from adk_testing import ScriptedLlm, call, text
from google.adk.runners import InMemoryRunner
from google.genai import types

from code_review_assistant.pipeline import build_review_assistant

BUGGY = "def add_item(item, bucket=[]):\n    bucket.append(item)\n    return bucket\n"
TESTS = ("from candidate import add_item\n"
         "def test_isolated():\n    add_item(1)\n    assert add_item(2) == [2]\n")
STILL_BUGGY = BUGGY                      # attempt 1: model fails to fix
FIXED = ("def add_item(item, bucket=None):\n    bucket = [] if bucket is None else bucket\n"
         "    bucket.append(item)\n    return bucket\n")


def make_llm():
    return ScriptedLlm(rules=[
        ("code review assistant for Python", [
            call("submit_code", code=BUGGY), call("transfer_to_agent", agent_name="ReviewPipeline"),
            # turn 2
            call("transfer_to_agent", agent_name="FixPipeline")]),
        ("You write pytest tests", [text(f"```python\n{TESTS}\n```")]),
        ("staff engineer writing a code review", [text("REQUEST CHANGES: mutable default argument on line 1.")]),
        ("Fix the code so that it passes", [text(f"```python\n{STILL_BUGGY}\n```"), text(f"```python\n{FIXED}\n```")]),
        ("Summarise the auto-fix", [text("Fixed: replaced mutable default. Validation passed.")]),
    ])


def test_review_then_fix_loop_retries_until_validated():
    llm = make_llm()
    agent = build_review_assistant(llm, llm)

    async def go():
        r = InMemoryRunner(agent=agent, app_name="cr")
        s = await r.session_service.create_session(app_name="cr", user_id="u")
        out = {}
        for turn, msg in enumerate(["Please review:\n" + BUGGY, "yes, fix it"]):
            async for ev in r.run_async(user_id="u", session_id=s.id, new_message=types.Content(
                    role="user", parts=[types.Part(text=msg)])):
                out.setdefault(turn, []).append(ev)
            if turn == 0:
                st = (await r.session_service.get_session(app_name="cr", user_id="u", session_id=s.id)).state
                out["after_review"] = dict(st)
        st = (await r.session_service.get_session(app_name="cr", user_id="u", session_id=s.id)).state
        return out, dict(st)

    out, final = asyncio.run(go())
    rv = out["after_review"]
    assert "mutable-default" in {i["rule"] for i in rv["analysis"]["issues"]}
    assert rv["test_results"]["status"] == "failed"            # real pytest run proved the bug
    assert "REQUEST CHANGES" in rv["review_feedback"]
    # fix loop: attempt 1 rejected by the deterministic validator, attempt 2 accepted
    fix_authors = [e.author for e in out[1]]
    assert fix_authors.count("CodeFixer") == 2 and fix_authors.count("FixValidator") == 2
    assert final["fix_result"]["ok"] is True
    assert "bucket=None" in final["fixed_code"]
    assert any("Validation passed" in (p.text or "") for e in out[1] if e.content for p in e.content.parts)
