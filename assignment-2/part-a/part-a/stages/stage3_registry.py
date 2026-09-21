"""
STAGE 3 — Many tools, a registry, and the first safety rail.

Stage 2 hard-coded one tool and dispatched it with an `if`. That does not scale:
every new tool means editing the schema list, the dispatch branch, and the
system prompt. So we introduce the pattern every real harness uses --

    a decorator that registers a function, derives its JSON schema, and puts it
    in one dict that is both "what the model is told about" and "what we can
    execute".

We also add the rail that separates a toy from something you would actually run:
a tool declared `dangerous=True` must be confirmed by the human before it runs.
The model can ask for anything; the harness decides what actually happens.

Run:
    MINICODER_MOCK=1 python stages/stage3_registry.py "list files in this directory"
    MINICODER_MOCK=1 AUTO_APPROVE=1 python stages/stage3_registry.py "run the tests"
"""

from __future__ import annotations

import inspect
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Callable

import httpx

sys.path.insert(0, str(Path(__file__).parent))
from mockllm import mock_completion  # noqa: E402

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = os.environ.get("MINICODER_MODEL", "google/gemini-2.5-flash")
MAX_TURNS = 12

# ------------------------------------------------------------------ registry

REGISTRY: dict[str, dict] = {}

# Python annotation -> JSON Schema type.
JSON_TYPES = {str: "string", int: "integer", float: "number", bool: "boolean"}


def tool(dangerous: bool = False) -> Callable:
    """Register a function as a tool.

    The schema is derived from the signature and docstring, so the description
    the model reads and the code that runs can never drift apart.
    """

    def decorator(fn: Callable) -> Callable:
        signature = inspect.signature(fn)
        properties, required = {}, []

        for name, param in signature.parameters.items():
            properties[name] = {
                "type": JSON_TYPES.get(param.annotation, "string"),
                "description": f"{name} argument",
            }
            if param.default is inspect.Parameter.empty:
                required.append(name)

        REGISTRY[fn.__name__] = {
            "fn": fn,
            "dangerous": dangerous,
            "schema": {
                "type": "function",
                "function": {
                    "name": fn.__name__,
                    "description": inspect.getdoc(fn) or "",
                    "parameters": {
                        "type": "object",
                        "properties": properties,
                        "required": required,
                    },
                },
            },
        }
        return fn

    return decorator


# ------------------------------------------------------------------ the tools


@tool()
def read_file(path: str) -> str:
    """Read a UTF-8 text file and return its contents."""
    target = Path(path)
    if not target.is_file():
        return f"Error: {path} is not a file."
    return target.read_text(encoding="utf-8", errors="replace")


@tool(dangerous=True)
def write_file(path: str, content: str) -> str:
    """Write text to a file, creating parent directories. Overwrites."""
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return f"Wrote {len(content)} bytes to {path}."


@tool(dangerous=True)
def bash(command: str) -> str:
    """Run a shell command in the working directory and return stdout+stderr."""
    try:
        proc = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60,
        )
    except subprocess.TimeoutExpired:
        return "Error: command timed out after 60s."
    out = (proc.stdout or "") + (proc.stderr or "")
    return f"(exit {proc.returncode})\n{out.strip() or '(no output)'}"


# ------------------------------------------------------------------ execution


def execute(name: str, args: dict) -> str:
    entry = REGISTRY.get(name)
    if entry is None:
        return f"Error: no tool named {name}."

    if entry["dangerous"] and os.environ.get("AUTO_APPROVE") != "1":
        print(f"\n  the agent wants to run: {name}({args})")
        if input("  allow? [y/N] ").strip().lower() not in ("y", "yes"):
            # Refusal goes back to the model as a normal result, so it can
            # adapt instead of crashing.
            return "The user denied permission to run this tool."

    try:
        return str(entry["fn"](**args))
    except Exception as exc:  # noqa: BLE001
        return f"Error running {name}: {type(exc).__name__}: {exc}"


def call_model(messages: list[dict]) -> dict:
    tools = [entry["schema"] for entry in REGISTRY.values()]

    if os.environ.get("MINICODER_MOCK") == "1":
        return mock_completion(messages, tools)

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        sys.exit("OPENROUTER_API_KEY not set (or use MINICODER_MOCK=1).")

    with httpx.Client(timeout=120.0) as client:
        response = client.post(
            OPENROUTER_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": DEFAULT_MODEL,
                "messages": messages,
                "tools": tools,
                "tool_choice": "auto",
            },
        )
        response.raise_for_status()
        return response.json()


def run(task: str) -> str:
    messages = [
        {
            "role": "system",
            "content": (
                "You are a coding agent working in the current directory. "
                "Use the tools to inspect and change real files; never invent "
                "file contents. Work in small steps and stop when the task is done."
            ),
        },
        {"role": "user", "content": task},
    ]

    for turn in range(1, MAX_TURNS + 1):
        message = call_model(messages)["choices"][0]["message"]
        messages.append(message)

        calls = message.get("tool_calls") or []
        if not calls:
            return message.get("content") or ""

        for call in calls:
            name = call["function"]["name"]
            args = json.loads(call["function"].get("arguments") or "{}")
            print(f"  [turn {turn}] {name}({args})")
            result = execute(name, args)
            messages.append(
                {"role": "tool", "tool_call_id": call["id"], "content": result}
            )

    return "(stopped: turn limit reached)"


if __name__ == "__main__":
    task = " ".join(sys.argv[1:]) or "list files in this directory"
    print(f"task: {task}")
    print(f"tools: {', '.join(REGISTRY)}\n")
    print("\n" + "=" * 70)
    print(run(task))
    print("=" * 70)
