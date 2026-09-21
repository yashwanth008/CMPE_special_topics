"""Shared data types.

Keeping these in one small module means the provider layer, the tool layer and
the agent loop all agree on vocabulary without importing each other.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

Role = Literal["system", "user", "assistant", "tool"]


@dataclass
class ToolCall:
    """A request from the model to run one tool."""

    id: str
    name: str
    arguments: dict[str, Any]

    def to_openai(self) -> dict:
        import json

        return {
            "id": self.id,
            "type": "function",
            "function": {"name": self.name, "arguments": json.dumps(self.arguments)},
        }


@dataclass
class Message:
    """One entry in the conversation.

    This mirrors the OpenAI/OpenRouter chat format, because every provider worth
    using speaks it. `to_wire()` is the only place that shape is assumed.
    """

    role: Role
    content: str | None = None
    tool_calls: list[ToolCall] = field(default_factory=list)
    tool_call_id: str | None = None
    name: str | None = None

    def to_wire(self) -> dict:
        payload: dict[str, Any] = {"role": self.role}

        # A tool-call message legitimately has null content; a text message
        # must have a string, or strict providers reject the request.
        payload["content"] = self.content if self.content is not None else (
            None if self.tool_calls else ""
        )

        if self.tool_calls:
            payload["tool_calls"] = [c.to_openai() for c in self.tool_calls]
        if self.tool_call_id:
            payload["tool_call_id"] = self.tool_call_id
        if self.name:
            payload["name"] = self.name
        return payload

    @property
    def text(self) -> str:
        return self.content or ""


@dataclass
class Usage:
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    def __add__(self, other: "Usage") -> "Usage":
        return Usage(
            self.prompt_tokens + other.prompt_tokens,
            self.completion_tokens + other.completion_tokens,
            self.total_tokens + other.total_tokens,
        )


@dataclass
class Completion:
    """What a provider returns, normalised."""

    message: Message
    finish_reason: str
    model: str
    usage: Usage = field(default_factory=Usage)

    @property
    def wants_tools(self) -> bool:
        return bool(self.message.tool_calls)


@dataclass
class ToolResult:
    """What a tool hands back.

    `ok` is not used to raise anything -- a failed tool result is still fed to
    the model, because "that path does not exist" is exactly the information it
    needs to correct itself. `ok` only drives display and metrics.
    """

    content: str
    ok: bool = True

    def truncated(self, limit: int) -> "ToolResult":
        if len(self.content) <= limit:
            return self
        head = self.content[: limit // 2]
        tail = self.content[-limit // 2 :]
        omitted = len(self.content) - limit
        return ToolResult(
            f"{head}\n\n... [{omitted} characters omitted by the harness] ...\n\n{tail}",
            self.ok,
        )
