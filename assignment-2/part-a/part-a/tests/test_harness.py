"""Tests for the harness.

These run offline. That is the payoff of the provider seam: the loop, the
sandbox, the permission gate and compaction are all testable without a key, a
network, or a bill.

    pytest -v
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from minicoder.agent import Agent
from minicoder.config import Config
from minicoder.context import compact, default_summariser, estimate_tokens, needs_compaction
from minicoder.permissions import Decision, PermissionPolicy
from minicoder.providers.base import accumulate_stream, parse_openai_message
from minicoder.tools import files as file_tools
from minicoder.tools.base import ToolRegistry, registry
from minicoder.types import Completion, Message, ToolCall, ToolResult, Usage


@pytest.fixture
def workspace(tmp_path: Path) -> Path:
    file_tools.set_workspace(tmp_path)
    (tmp_path / "hello.py").write_text("print('hello')\n", encoding="utf-8")
    (tmp_path / "notes.md").write_text("# Notes\nalpha\nbeta\n", encoding="utf-8")
    return tmp_path


# --------------------------------------------------------------- tool schemas


def test_every_tool_exposes_a_valid_schema():
    for tool in registry:
        function = tool.schema["function"]
        assert function["name"] == tool.name
        assert function["description"], f"{tool.name} has no description for the model"
        assert function["parameters"]["type"] == "object"
        # Required params must actually exist in properties, or providers 400.
        for required in function["parameters"]["required"]:
            assert required in function["parameters"]["properties"]


def test_registry_subset_restricts_tools():
    read_only = registry.subset(["read_file", "grep"])
    assert read_only.names() == ["grep", "read_file"]
    assert "bash" not in read_only


# ---------------------------------------------------------------- file tools


def test_read_file_numbers_lines(workspace):
    result = registry.get("read_file").run(path="notes.md")
    assert result.ok
    assert "    1| # Notes" in result.content


def test_write_then_edit_roundtrip(workspace):
    registry.get("write_file").run(path="sub/new.py", content="a = 1\nb = 2\n")
    assert (workspace / "sub" / "new.py").exists()

    result = registry.get("edit_file").run(path="sub/new.py", old_text="a = 1", new_text="a = 99")
    assert result.ok
    assert "a = 99" in (workspace / "sub" / "new.py").read_text()


def test_edit_refuses_ambiguous_match(workspace):
    (workspace / "dup.py").write_text("x = 1\nx = 1\n", encoding="utf-8")
    result = registry.get("edit_file").run(path="dup.py", old_text="x = 1", new_text="x = 2")
    assert not result.ok
    assert "appears 2 times" in result.content


def test_edit_missing_text_is_an_error_not_a_crash(workspace):
    result = registry.get("edit_file").run(path="hello.py", old_text="nope", new_text="x")
    assert not result.ok
    assert "not in" in result.content


@pytest.mark.parametrize("escape", ["../outside.txt", "../../etc/passwd", "/etc/passwd"])
def test_sandbox_blocks_paths_outside_the_workspace(workspace, escape):
    result = registry.get("read_file").run(path=escape)
    assert not result.ok
    assert "outside the workspace" in result.content or "does not exist" in result.content


# --------------------------------------------------------------- search tools


def test_glob_finds_by_pattern(workspace):
    result = registry.get("glob").run(pattern="*.py")
    assert "hello.py" in result.content


def test_grep_reports_file_and_line(workspace):
    result = registry.get("grep").run(pattern="alpha")
    assert "notes.md:2" in result.content


def test_grep_rejects_bad_regex(workspace):
    result = registry.get("grep").run(pattern="([unclosed")
    assert not result.ok


# ----------------------------------------------------------------- bash tool


def test_bash_captures_output_and_exit_code(workspace):
    result = registry.get("bash").run(command="echo hi")
    assert result.ok and "hi" in result.content


def test_bash_marks_failure_without_raising(workspace):
    result = registry.get("bash").run(command="exit 3")
    assert not result.ok and "exit code 3" in result.content


@pytest.mark.parametrize("command", ["rm -rf /", "mkfs.ext4 /dev/sda", ":(){ :|:& };:"])
def test_bash_denylist_refuses_destructive_commands(workspace, command):
    result = registry.get("bash").run(command=command)
    assert not result.ok and "Refused" in result.content


# ---------------------------------------------------------------- permissions


def test_safe_tools_never_prompt():
    policy = PermissionPolicy(auto_approve=False)
    assert policy.decide("read_file", dangerous=False, args={}) is Decision.ALLOW


def test_dangerous_tools_ask_then_remember():
    policy = PermissionPolicy(prompt=lambda _: "a")  # 'always'
    assert policy.decide("bash", dangerous=True, args={}) is Decision.ASK
    assert policy.confirm("bash", {"command": "ls"}) is True
    # Second time through, no prompt.
    assert policy.decide("bash", dangerous=True, args={}) is Decision.ALLOW


def test_never_is_sticky():
    policy = PermissionPolicy(prompt=lambda _: "never")
    policy.confirm("bash", {})
    assert policy.decide("bash", dangerous=True, args={}) is Decision.DENY


# ------------------------------------------------------------- wire protocol


def test_parse_message_survives_malformed_tool_arguments():
    message = parse_openai_message(
        {
            "role": "assistant",
            "content": None,
            "tool_calls": [
                {"id": "1", "function": {"name": "read_file", "arguments": "{not json"}}
            ],
        }
    )
    assert message.tool_calls[0].arguments == {"__malformed__": "{not json"}


def test_streaming_chunks_reassemble_into_one_tool_call():
    chunks = [
        {"choices": [{"delta": {"tool_calls": [
            {"index": 0, "id": "call_1", "function": {"name": "read_file", "arguments": '{"pa'}}
        ]}}]},
        {"choices": [{"delta": {"tool_calls": [
            {"index": 0, "function": {"arguments": 'th": "x.py"}'}}
        ]}}]},
        {"choices": [{"delta": {}, "finish_reason": "tool_calls"}],
         "usage": {"total_tokens": 42}},
    ]
    raw, finish_reason, usage = accumulate_stream(iter(chunks))
    assert finish_reason == "tool_calls" and usage.total_tokens == 42
    assert json.loads(raw["tool_calls"][0]["function"]["arguments"]) == {"path": "x.py"}


def test_tool_call_message_keeps_null_content_on_the_wire():
    message = Message(role="assistant", tool_calls=[ToolCall("1", "bash", {"command": "ls"})])
    assert message.to_wire()["content"] is None
    assert Message(role="assistant", content=None).to_wire()["content"] == ""


# ------------------------------------------------------------------- context


def test_oversized_tool_results_are_truncated_head_and_tail():
    result = ToolResult("A" * 5000 + "ZZZ" + "B" * 5000).truncated(1000)
    assert len(result.content) < 1300
    assert result.content.startswith("A") and result.content.endswith("B")
    assert "omitted by the harness" in result.content


def test_compaction_triggers_only_near_the_limit():
    small = [Message(role="user", content="x" * 100)]
    assert not needs_compaction(small, limit=1000, fraction=0.75)
    big = [Message(role="user", content="x" * 40_000)]
    assert needs_compaction(big, limit=1000, fraction=0.75)


def test_compaction_shrinks_history_but_keeps_the_task_and_recent_turns():
    messages = [Message(role="system", content="sys"), Message(role="user", content="THE TASK")]
    for i in range(40):
        messages.append(Message(role="assistant", tool_calls=[ToolCall(f"{i}", "read_file", {"path": f"f{i}.py"})]))
        messages.append(Message(role="tool", tool_call_id=f"{i}", content="x" * 500))

    compacted = compact(messages, default_summariser, keep_recent=6)

    assert len(compacted) < len(messages)
    assert estimate_tokens(compacted) < estimate_tokens(messages)
    assert compacted[0].role == "system"
    assert compacted[1].text == "THE TASK"
    assert "[context compacted by the harness]" in compacted[2].text
    # The invariant that keeps the next request valid.
    assert compacted[3].role != "tool"


# --------------------------------------------------------------- agent loop


class ScriptedProvider:
    """Returns a fixed sequence of completions, so we can assert on loop control."""

    name = "scripted"

    def __init__(self, completions: list[Completion]) -> None:
        self.completions = completions
        self.calls = 0

    def complete(self, messages, tools=None, stream=False, on_text=None) -> Completion:
        self.calls += 1
        return self.completions.pop(0)


def _tool_turn(name: str, **args) -> Completion:
    return Completion(
        message=Message(role="assistant", tool_calls=[ToolCall("c1", name, args)]),
        finish_reason="tool_calls",
        model="scripted",
        usage=Usage(10, 5, 15),
    )


def _final_turn(text: str) -> Completion:
    return Completion(Message(role="assistant", content=text), "stop", "scripted", Usage(1, 1, 2))


def _agent(tmp_path: Path, provider) -> Agent:
    config = Config(api_key=None, workspace=tmp_path, auto_approve=True, stream=False, max_turns=5)
    return Agent(config=config, provider=provider, on_event=lambda *_: None)


def test_agent_runs_tools_then_returns_final_text(tmp_path):
    provider = ScriptedProvider([
        _tool_turn("write_file", path="made.py", content="print(1)\n"),
        _final_turn("Created made.py."),
    ])
    answer = _agent(tmp_path, provider).run("make a file")

    assert answer == "Created made.py."
    assert (tmp_path / "made.py").read_text() == "print(1)\n"
    assert provider.calls == 2


def test_agent_reports_unknown_tools_back_to_the_model(tmp_path):
    provider = ScriptedProvider([_tool_turn("nonexistent_tool"), _final_turn("ok")])
    agent = _agent(tmp_path, provider)
    agent.run("do something")

    tool_message = [m for m in agent.messages if m.role == "tool"][0]
    assert "no tool named" in tool_message.text
    assert "read_file" in tool_message.text  # tells the model what it CAN use


def test_agent_stops_at_the_turn_limit(tmp_path):
    provider = ScriptedProvider([_tool_turn("list_dir", path=".") for _ in range(5)])
    answer = _agent(tmp_path, provider).run("loop forever")
    assert "Stopped after 5 turns" in answer


def test_denied_tool_does_not_run_and_the_model_is_told(tmp_path):
    provider = ScriptedProvider([
        _tool_turn("write_file", path="blocked.py", content="x"),
        _final_turn("understood"),
    ])
    config = Config(api_key=None, workspace=tmp_path, auto_approve=False, stream=False)
    agent = Agent(config=config, provider=provider, on_event=lambda *_: None)
    agent.permissions.prompt = lambda _: "n"

    agent.run("write a file")

    assert not (tmp_path / "blocked.py").exists()
    assert "denied permission" in [m for m in agent.messages if m.role == "tool"][0].text


def test_transcript_records_every_event(tmp_path):
    provider = ScriptedProvider([_tool_turn("list_dir", path="."), _final_turn("done")])
    config = Config(api_key=None, workspace=tmp_path, auto_approve=True, stream=False,
                    transcript_dir=tmp_path / "logs")
    agent = Agent(config=config, provider=provider, on_event=lambda *_: None)
    agent.run("look around")

    kinds = [e["kind"] for e in agent.transcript.events]
    assert kinds[0] == "task" and kinds[-1] == "finish"
    assert "tool_call" in kinds and "tool_result" in kinds

    written = list((tmp_path / "logs").glob("*.jsonl"))[0].read_text().strip().splitlines()
    assert len(written) == len(agent.transcript.events)
    assert json.loads(written[0])["kind"] == "task"


def test_mock_provider_completes_a_real_task_offline(tmp_path):
    """The end-to-end path a reviewer runs with no API key."""
    config = Config(api_key=None, workspace=tmp_path, auto_approve=True, stream=False)
    agent = Agent(config=config, on_event=lambda *_: None)

    answer = agent.run("create fizzbuzz.py and run it")

    assert agent.provider.name == "mock"
    assert (tmp_path / "fizzbuzz.py").exists()
    assert "FizzBuzz" in (tmp_path / "fizzbuzz.py").read_text()
    assert "tool call" in answer
