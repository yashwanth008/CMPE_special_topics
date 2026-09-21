"""
STAGE 2 — Give the model one tool, and run the loop by hand.

The jump from stage 1 to stage 2 is the whole idea of a harness. In stage 1 the
model could only talk. Here it can ask us to do something, and we do it.

The protocol, in full:

  1. We send `messages` plus a `tools` schema describing what the model may call.
  2. The model replies with either
       finish_reason == "stop"       -> it is done, print the text
       finish_reason == "tool_calls" -> it wants us to run something
  3. If it wants a tool, WE run it (the model never touches the disk), then
     append the assistant message AND a {"role": "tool"} result message.
  4. Go back to 1. That `while True` is the agent loop.

Run:
    export OPENROUTER_API_KEY=sk-or-...
    python stages/stage2_one_tool.py "How many lines are in stages/stage1_hello.py?"

    MINICODER_MOCK=1 python stages/stage2_one_tool.py "How many lines are in stages/stage1_hello.py?"
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).parent))
from mockllm import mock_completion  # noqa: E402

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = os.environ.get("MINICODER_MODEL", "google/gemini-2.5-flash")
MAX_TURNS = 10

# ---------------------------------------------------------------- the tool

READ_FILE_SCHEMA = {
    "type": "function",
    "function": {
        "name": "read_file",
        "description": (
            "Read a UTF-8 text file from the working directory and return its "
            "contents. Use this before answering any question about a file."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path to the file, relative to the working directory.",
                }
            },
            "required": ["path"],
        },
    },
}


def read_file(path: str) -> str:
    """The actual implementation. Note it returns a string even on failure --
    an error is information the model can act on, not a crash."""
    try:
        target = Path(path).resolve()
        if not target.is_file():
            return f"Error: {path} is not a file."
        return target.read_text(encoding="utf-8", errors="replace")
    except Exception as exc:  # noqa: BLE001 - surface anything to the model
        return f"Error reading {path}: {exc}"


# ---------------------------------------------------------------- the model call


def call_model(messages: list[dict], tools: list[dict]) -> dict:
    if os.environ.get("MINICODER_MOCK") == "1":
        return mock_completion(messages, tools)

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        sys.exit("OPENROUTER_API_KEY not set (or use MINICODER_MOCK=1).")

    with httpx.Client(timeout=120.0) as client:
        response = client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": DEFAULT_MODEL,
                "messages": messages,
                "tools": tools,
                "tool_choice": "auto",
            },
        )
        response.raise_for_status()
        return response.json()


# ---------------------------------------------------------------- the loop


def run(task: str) -> str:
    messages = [
        {
            "role": "system",
            "content": (
                "You are a coding assistant with filesystem access. "
                "When a question concerns a file, call read_file first and answer "
                "from what you actually read. Never guess file contents."
            ),
        },
        {"role": "user", "content": task},
    ]

    for turn in range(1, MAX_TURNS + 1):
        body = call_model(messages, [READ_FILE_SCHEMA])
        choice = body["choices"][0]
        message = choice["message"]

        # Always append the assistant's own message before anything else, or the
        # conversation stops making sense to the model on the next turn.
        messages.append(message)

        tool_calls = message.get("tool_calls") or []
        if not tool_calls:
            return message.get("content") or ""

        for call in tool_calls:
            name = call["function"]["name"]
            raw_args = call["function"].get("arguments") or "{}"
            try:
                args = json.loads(raw_args)
            except json.JSONDecodeError:
                result = f"Error: arguments were not valid JSON: {raw_args}"
            else:
                print(f"  [turn {turn}] -> {name}({args})")
                result = read_file(**args) if name == "read_file" else f"Unknown tool {name}"

            # The tool_call_id is how the model matches result to request.
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": call["id"],
                    "content": result,
                }
            )

    return "(stopped: hit the turn limit)"


def main() -> None:
    task = " ".join(sys.argv[1:]) or "How many lines are in stages/stage1_hello.py?"
    print(f"task: {task}\n")
    answer = run(task)
    print("\n" + "=" * 70)
    print(answer)
    print("=" * 70)


if __name__ == "__main__":
    main()
