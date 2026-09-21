"""The provider interface.

The agent loop must not know whether it is talking to Gemini through OpenRouter,
to a local model, or to a scripted fake. It only knows `complete(messages, tools)
-> Completion`. That single seam is what makes the harness testable offline and
portable across backends.
"""

from __future__ import annotations

import json
from typing import Any, Iterator, Protocol

from ..types import Completion, Message, ToolCall, Usage


class Provider(Protocol):
    name: str

    def complete(
        self,
        messages: list[Message],
        tools: list[dict] | None = None,
        stream: bool = False,
        on_text: Any = None,
    ) -> Completion:
        ...


def parse_openai_message(raw: dict) -> Message:
    """Turn one OpenAI-shaped assistant message into our Message type.

    Two details cause most of the bugs in hand-written harnesses:
      * `arguments` is a JSON *string*, not an object, and models sometimes emit
        malformed JSON. We degrade to an empty dict and let the tool report the
        problem rather than crashing the run.
      * `content` can be null when the model only wants tools.
    """
    calls: list[ToolCall] = []
    for call in raw.get("tool_calls") or []:
        fn = call.get("function", {})
        try:
            args = json.loads(fn.get("arguments") or "{}")
            if not isinstance(args, dict):
                args = {"value": args}
        except json.JSONDecodeError:
            args = {"__malformed__": fn.get("arguments", "")}
        calls.append(ToolCall(id=call.get("id", ""), name=fn.get("name", ""), arguments=args))

    return Message(role="assistant", content=raw.get("content"), tool_calls=calls)


def parse_usage(raw: dict | None) -> Usage:
    raw = raw or {}
    return Usage(
        prompt_tokens=raw.get("prompt_tokens", 0),
        completion_tokens=raw.get("completion_tokens", 0),
        total_tokens=raw.get("total_tokens", 0),
    )


def accumulate_stream(chunks: Iterator[dict]) -> tuple[dict, str, Usage]:
    """Reassemble a streamed response into a single message.

    Streaming deltas arrive fragmented: text a few characters at a time, and
    tool-call arguments split across chunks and identified only by `index`.
    Reassembling them correctly is the fiddliest part of a real harness, so it
    lives here once instead of in the loop.
    """
    content_parts: list[str] = []
    tool_parts: dict[int, dict] = {}
    finish_reason = "stop"
    usage = Usage()

    for chunk in chunks:
        if chunk.get("usage"):
            usage = parse_usage(chunk["usage"])

        for choice in chunk.get("choices", []):
            if choice.get("finish_reason"):
                finish_reason = choice["finish_reason"]

            delta = choice.get("delta", {})
            if delta.get("content"):
                content_parts.append(delta["content"])

            for call in delta.get("tool_calls") or []:
                index = call.get("index", 0)
                slot = tool_parts.setdefault(
                    index, {"id": "", "function": {"name": "", "arguments": ""}}
                )
                if call.get("id"):
                    slot["id"] = call["id"]
                fn = call.get("function") or {}
                if fn.get("name"):
                    slot["function"]["name"] = fn["name"]
                if fn.get("arguments"):
                    slot["function"]["arguments"] += fn["arguments"]

    message = {
        "role": "assistant",
        "content": "".join(content_parts) or None,
        "tool_calls": [tool_parts[i] for i in sorted(tool_parts)] or None,
    }
    return message, finish_reason, usage
