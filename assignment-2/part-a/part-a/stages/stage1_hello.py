"""
STAGE 1 — Talk to a model over raw HTTP.

There is no framework here on purpose. A harness is, at its core, a program
that POSTs JSON to a chat-completions endpoint and reads JSON back. Everything
we add in later stages (tools, loops, permissions, compaction) is scaffolding
around this one call.

Run:
    export OPENROUTER_API_KEY=sk-or-...
    python stages/stage1_hello.py "Explain what an agent harness is in two sentences."

No key? Run in mock mode, which replays a canned response so the control flow
is identical:
    MINICODER_MOCK=1 python stages/stage1_hello.py "hello"
"""

from __future__ import annotations

import json
import os
import sys

import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = os.environ.get("MINICODER_MODEL", "google/gemini-2.5-flash")


def call_model(messages: list[dict], model: str = DEFAULT_MODEL) -> dict:
    """One HTTP round trip. Returns the raw OpenRouter response body."""
    if os.environ.get("MINICODER_MOCK") == "1":
        return _mock_response(messages)

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        sys.exit(
            "OPENROUTER_API_KEY is not set.\n"
            "Get one at https://openrouter.ai/keys, or run with MINICODER_MOCK=1."
        )

    payload = {
        "model": model,
        "messages": messages,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        # OpenRouter uses these two for attribution on its dashboard. Optional.
        "HTTP-Referer": "https://github.com/your-username/harness-from-scratch",
        "X-Title": "minicoder",
    }

    with httpx.Client(timeout=120.0) as client:
        response = client.post(OPENROUTER_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()


def _mock_response(messages: list[dict]) -> dict:
    """A stand-in so the stage runs with no API key and no network."""
    last_user = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )
    return {
        "id": "mock-0",
        "model": "mock/echo",
        "choices": [
            {
                "index": 0,
                "finish_reason": "stop",
                "message": {
                    "role": "assistant",
                    "content": (
                        "[mock reply] An agent harness is the program that owns the "
                        "loop around a language model: it sends messages, executes the "
                        "tools the model asks for, and feeds the results back until the "
                        f"task is done.\n\n(You asked: {last_user!r})"
                    ),
                },
            }
        ],
        "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    }


def main() -> None:
    prompt = " ".join(sys.argv[1:]) or "Explain what an agent harness is in two sentences."

    messages = [
        {"role": "system", "content": "You are a concise, precise assistant."},
        {"role": "user", "content": prompt},
    ]

    body = call_model(messages)

    # Everything interesting lives at this path. Learn it once and the rest of
    # the harness is obvious.
    text = body["choices"][0]["message"]["content"]
    usage = body.get("usage", {})

    print("=" * 70)
    print(f"model : {body.get('model')}")
    print(f"tokens: {usage.get('total_tokens', 'n/a')}")
    print("=" * 70)
    print(text)
    print("=" * 70)

    if os.environ.get("MINICODER_DEBUG") == "1":
        print("\nraw response:")
        print(json.dumps(body, indent=2)[:2000])


if __name__ == "__main__":
    main()
