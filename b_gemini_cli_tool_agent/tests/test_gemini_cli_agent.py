import json
import os
import stat
from pathlib import Path

import pytest
from adk_testing import ScriptedLlm, call, last_text, run_agent_sync, text

from gemini_cli_agent import tools
from gemini_cli_agent.agent import build_agent


@pytest.fixture
def sandbox(tmp_path, monkeypatch):
    """Fake workspace + fake `gemini` binary + fake git clone (no network needed)."""
    ws = tmp_path / "ws"
    monkeypatch.setenv("GEMINI_WORKSPACE", str(ws))
    bindir = tmp_path / "bin"
    bindir.mkdir()
    fake = bindir / "gemini"
    fake.write_text('#!/bin/sh\necho "FAKE-GEMINI cwd=$(basename $PWD) args=$*"\n')
    fake.chmod(fake.stat().st_mode | stat.S_IEXEC)
    monkeypatch.setenv("PATH", f"{bindir}:{os.environ['PATH']}")

    def fake_clone(url, dest: Path):
        dest.mkdir(parents=True)
        (dest / "main.py").write_text("print('hi')\n")
    monkeypatch.setattr(tools, "_clone", fake_clone)
    return ws


@pytest.mark.parametrize("bad", [
    "http://github.com/a/b", "https://evil.com/a/b", "https://github.com/a/b; rm -rf /",
    "file:///etc/passwd", "https://github.com/a", "https://github.com/a/b/c/d", "", "--upload-pack=x",
])
def test_rejects_non_github_urls(bad, sandbox):
    assert tools.clone_repo(bad)["status"] == "error"


def test_accepts_github_urls():
    assert tools.parse_github_url("https://github.com/google/adk-samples.git") == ("google", "adk-samples")
    assert tools.parse_github_url("https://github.com/google/adk-samples/") == ("google", "adk-samples")


def test_cli_runs_in_repo_without_shell(sandbox):
    out = tools.run_gemini_cli("explain; echo PWNED $(whoami)", "https://github.com/o/r")
    assert out["status"] == "success"
    assert "cwd=o__r" in out["output"]
    # the semicolon/subshell text is passed as ONE literal argument, never interpreted
    assert "explain; echo PWNED $(whoami)" in out["output"]


def test_output_truncation(sandbox, monkeypatch):
    monkeypatch.setattr(tools, "MAX_OUTPUT_CHARS", 10)
    out = tools.run_gemini_cli("x", "https://github.com/o/r")
    assert out["truncated"] and len(out["output"]) == 10


def test_read_file_is_confined(sandbox):
    tools.clone_repo("https://github.com/o/r")
    assert tools.read_repo_file("https://github.com/o/r", "main.py")["status"] == "success"
    assert tools.read_repo_file("https://github.com/o/r", "../../etc/passwd")["status"] == "error"
    (sandbox / "secret.txt").write_text("s")
    assert tools.read_repo_file("https://github.com/o/r", "../secret.txt")["status"] == "error"


def test_pipeline_end_to_end(sandbox):
    req = {"repo_url": "https://github.com/o/r", "task": "explain this codebase"}
    llm = ScriptedLlm(rules=[
        ("Extract the GitHub repository URL", [text(json.dumps(req))]),
        ("senior engineer with a powerful tool", [
            call("run_gemini_cli", task="explain this codebase", github_url="https://github.com/o/r"),
            text("FAKE-GEMINI raw output")]),
        ("Turn the raw Gemini CLI output", [text("## Summary\nThe repo prints hi.")]),
    ])
    events, state = run_agent_sync(build_agent(llm, llm), "Explain github.com/o/r")
    assert state["cli_request"]["repo_url"] == "https://github.com/o/r"
    assert "FAKE-GEMINI" in state["cli_output"]
    assert "Summary" in last_text(events)
    # the tool really ran the fake CLI: a function_response with our marker exists
    blobs = [p.function_response.response for e in events for p in (e.content.parts if e.content else [])
             if p.function_response]
    assert any("cwd=o__r" in json.dumps(b) for b in blobs)


def test_guard_blocks_bad_url_in_pipeline(sandbox):
    req = {"repo_url": "https://evil.com/x/y", "task": "t"}
    llm = ScriptedLlm(rules=[
        ("Extract the GitHub repository URL", [text(json.dumps(req))]),
        ("senior engineer with a powerful tool", [
            call("run_gemini_cli", task="t", github_url="https://evil.com/x/y"), text("error reported")]),
        ("Turn the raw Gemini CLI output", [text("blocked")]),
    ])
    events, _ = run_agent_sync(build_agent(llm, llm), "analyse evil")
    blobs = [json.dumps(p.function_response.response) for e in events
             for p in (e.content.parts if e.content else []) if p.function_response]
    assert any("Only https://github.com" in b for b in blobs)
