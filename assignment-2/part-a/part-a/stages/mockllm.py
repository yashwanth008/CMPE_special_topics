"""
A scripted stand-in for the model, so every stage runs with no API key.

This is NOT a language model. It is a small rule-based responder that speaks the
same JSON dialect OpenRouter speaks (`choices[0].message`, `tool_calls`,
`finish_reason`). That is enough to exercise the harness: the loop, the tool
dispatch, the message bookkeeping and the stop condition are all identical
whether the JSON came from Gemini or from these forty lines of `if` statements.

Being able to run the harness deterministically and offline is worth the small
amount of code -- it is also how the test suite works.
"""

from __future__ import annotations

import json
import re
import uuid

# Anything that looks like a relative path with an extension.
PATH_RE = re.compile(r"[\w./-]+\.(?:py|txt|md|json|toml|cfg|ya?ml)")


def _tool_call(name: str, args: dict) -> dict:
    return {
        "id": f"call_{uuid.uuid4().hex[:8]}",
        "type": "function",
        "function": {"name": name, "arguments": json.dumps(args)},
    }


def _wrap(message: dict, finish_reason: str) -> dict:
    return {
        "id": "mock-completion",
        "model": "mock/scripted",
        "choices": [{"index": 0, "finish_reason": finish_reason, "message": message}],
        "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    }


def mock_completion(messages: list[dict], tools: list[dict] | None = None) -> dict:
    """Decide what the 'model' does next, given the conversation so far."""
    available = {t["function"]["name"] for t in (tools or [])}

    user_text = next(
        (m.get("content") or "" for m in messages if m.get("role") == "user"), ""
    )
    tool_results = [m for m in messages if m.get("role") == "tool"]
    already_called = {
        c["function"]["name"]
        for m in messages
        if m.get("role") == "assistant"
        for c in (m.get("tool_calls") or [])
    }

    lowered = user_text.lower()
    paths = PATH_RE.findall(user_text)

    # 1. A file is named and we have not read it yet -> read it.
    if paths and "read_file" in available and "read_file" not in already_called:
        return _wrap(
            {
                "role": "assistant",
                "content": None,
                "tool_calls": [_tool_call("read_file", {"path": paths[0]})],
            },
            "tool_calls",
        )

    # 2. The task asks to create or write something -> write it.
    wants_write = any(w in lowered for w in ("create", "write", "save", "generate"))
    if wants_write and "write_file" in available and "write_file" not in already_called:
        out_path = paths[0] if paths else "output.txt"
        return _wrap(
            {
                "role": "assistant",
                "content": None,
                "tool_calls": [
                    _tool_call(
                        "write_file",
                        {
                            "path": out_path,
                            "content": (
                                "# written by the mock provider\n"
                                "def add(a, b):\n"
                                "    return a + b\n"
                            ),
                        },
                    )
                ],
            },
            "tool_calls",
        )

    # 3. The task mentions running something -> shell out.
    wants_run = any(w in lowered for w in ("run", "test", "execute", "list files"))
    if wants_run and "bash" in available and "bash" not in already_called:
        command = "ls -la" if "list files" in lowered else "python3 -c \"print('ok')\""
        return _wrap(
            {
                "role": "assistant",
                "content": None,
                "tool_calls": [_tool_call("bash", {"command": command})],
            },
            "tool_calls",
        )

    # 4. Nothing left to do -> summarise what the tools returned and stop.
    if tool_results:
        first = tool_results[0].get("content") or ""
        line_count = len(first.splitlines())
        summary = (
            f"[mock] I ran {len(tool_results)} tool call(s). The first returned "
            f"{line_count} line(s) / {len(first)} characters. "
            "In a real run this is where the model would answer in prose."
        )
    else:
        summary = (
            "[mock] No tool was needed for this request. "
            f"You asked: {user_text!r}"
        )

    return _wrap({"role": "assistant", "content": summary}, "stop")
