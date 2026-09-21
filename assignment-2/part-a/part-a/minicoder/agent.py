"""The agent loop.

Everything else in this package exists to make these ~120 lines correct. The
loop itself is genuinely simple, and that is the point of the whole assignment:

    while under the turn limit:
        completion = provider.complete(history, tool_schemas)
        history.append(completion.message)
        if no tool calls:            -> done, return the text
        for each requested call:
            check permission
            run the tool
            append the result to history

What separates this from a toy is the bookkeeping around it: compaction before
the window overflows, truncation of oversized results, a permission gate that
cannot be bypassed, a transcript of every event, and errors that come back as
data the model can act on rather than exceptions that kill the run.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path
from typing import Callable

from .config import Config
from .context import compact, default_summariser, estimate_tokens, needs_compaction
from .permissions import Decision, PermissionPolicy
from .providers.base import Provider
from .providers.mock import MockProvider
from .providers.openrouter import OpenRouterProvider
from .tools import files as file_tools
from .tools.base import ToolRegistry, registry as default_registry
from .transcript import Transcript
from .types import Completion, Message, ToolCall, ToolResult, Usage

SYSTEM_PROMPT = """You are minicoder, a coding agent operating inside a user's workspace.

How you work:
- Investigate before you act. Read files and search the codebase rather than
  guessing at contents or structure. Never invent code you have not seen.
- Take one concrete step at a time and use the result to decide the next one.
- Prefer edit_file over write_file for existing files, so you cannot destroy
  code you have not read.
- After changing code, verify it: run the tests or execute the file.
- If a tool returns an error, read it carefully and correct your approach. The
  error text is accurate.
- When the task is complete, stop calling tools and reply with a short summary
  of what you changed and what you verified.

You are working in: {workspace}
"""


class Agent:
    def __init__(
        self,
        config: Config | None = None,
        provider: Provider | None = None,
        tools: ToolRegistry | None = None,
        system_prompt: str | None = None,
        on_event: Callable[[str, dict], None] | None = None,
    ) -> None:
        self.config = config or Config.from_env()
        self.tools = tools or default_registry
        self.on_event = on_event or _default_reporter

        file_tools.set_workspace(self.config.workspace)

        self.provider = provider or self._build_provider()
        self.permissions = PermissionPolicy(auto_approve=self.config.auto_approve)

        transcript_path = None
        if self.config.transcript_dir:
            stamp = time.strftime("%Y%m%d-%H%M%S")
            transcript_path = Path(self.config.transcript_dir) / f"session-{stamp}.jsonl"
        self.transcript = Transcript(path=transcript_path)

        self.messages: list[Message] = [
            Message(
                role="system",
                content=(system_prompt or SYSTEM_PROMPT).format(
                    workspace=self.config.workspace
                ),
            )
        ]
        self.usage = Usage()

    def _build_provider(self) -> Provider:
        if self.config.is_mock:
            return MockProvider(self.config)
        return OpenRouterProvider(self.config)

    # ------------------------------------------------------------------- public

    def run(self, task: str) -> str:
        """Run one task to completion and return the agent's final message."""
        self.messages.append(Message(role="user", content=task))
        self.transcript.record("task", text=task, model=self.config.model, provider=self.provider.name)

        for turn in range(1, self.config.max_turns + 1):
            self._maybe_compact()

            completion = self._call_model(turn)
            self.messages.append(completion.message)
            self.usage = self.usage + completion.usage

            if not completion.wants_tools:
                final = completion.message.text
                self.transcript.record("finish", reason="stop", turns=turn, text=final)
                self.on_event("final", {"text": final})
                return final

            for call in completion.message.tool_calls:
                result = self._dispatch(call)
                self.messages.append(
                    Message(role="tool", tool_call_id=call.id, name=call.name, content=result.content)
                )

        message = f"Stopped after {self.config.max_turns} turns without finishing."
        self.transcript.record("finish", reason="max_turns", turns=self.config.max_turns)
        self.on_event("error", {"text": message})
        return message

    # ---------------------------------------------------------------- internals

    def _call_model(self, turn: int) -> Completion:
        self.on_event("turn", {"n": turn, "tokens": estimate_tokens(self.messages)})
        self.transcript.record("model_request", turn=turn, messages=len(self.messages))

        streaming = self.config.stream
        on_text = (lambda piece: self.on_event("text", {"piece": piece})) if streaming else None

        try:
            completion = self.provider.complete(
                self.messages,
                tools=self.tools.schemas(),
                stream=streaming,
                on_text=on_text,
            )
        except Exception as exc:  # noqa: BLE001
            # A provider failure is fatal to the turn but should be legible.
            self.transcript.record("error", stage="provider", detail=str(exc))
            raise

        self.transcript.record(
            "model_response",
            turn=turn,
            finish_reason=completion.finish_reason,
            text=completion.message.text[:2000],
            tool_calls=[{"name": c.name, "arguments": c.arguments} for c in completion.message.tool_calls],
            usage=completion.usage.__dict__,
        )
        return completion

    def _dispatch(self, call: ToolCall) -> ToolResult:
        tool = self.tools.get(call.name)
        if tool is None:
            # Happens with smaller models. Naming the real tools usually
            # recovers the run on the next turn.
            result = ToolResult(
                f"Error: no tool named {call.name!r}. Available: {', '.join(self.tools.names())}",
                ok=False,
            )
            self.transcript.record("tool_result", name=call.name, ok=False, content=result.content)
            return result

        if "__malformed__" in call.arguments:
            return ToolResult(
                f"Error: your arguments for {call.name} were not valid JSON. Send them again.",
                ok=False,
            )

        decision = self.permissions.decide(call.name, tool.dangerous, call.arguments)
        if decision is Decision.ASK:
            approved = self.permissions.confirm(call.name, call.arguments)
            decision = Decision.ALLOW if approved else Decision.DENY

        if decision is Decision.DENY:
            self.transcript.record("tool_denied", name=call.name, arguments=call.arguments)
            self.on_event("denied", {"name": call.name})
            return ToolResult(
                "The user denied permission for this action. "
                "Do not retry it; find another approach or ask them what to do.",
                ok=False,
            )

        self.on_event("tool", {"name": call.name, "arguments": call.arguments})
        self.transcript.record("tool_call", name=call.name, arguments=call.arguments)

        started = time.time()
        result = tool.run(**call.arguments).truncated(self.config.tool_result_char_limit)
        elapsed = round(time.time() - started, 3)

        self.transcript.record(
            "tool_result", name=call.name, ok=result.ok, seconds=elapsed, content=result.content[:4000]
        )
        self.on_event("tool_done", {"name": call.name, "ok": result.ok, "seconds": elapsed})
        return result

    def _maybe_compact(self) -> None:
        if not needs_compaction(
            self.messages, self.config.context_limit_tokens, self.config.compact_at_fraction
        ):
            return

        before = estimate_tokens(self.messages)
        self.messages = compact(self.messages, default_summariser)
        after = estimate_tokens(self.messages)

        self.transcript.record("compaction", before=before, after=after)
        self.on_event("compact", {"before": before, "after": after})


# ---------------------------------------------------------------------- output


def _default_reporter(kind: str, payload: dict) -> None:
    """Human-readable progress on stderr, so stdout stays pipe-friendly."""
    if kind == "turn":
        print(f"\n\033[2m— turn {payload['n']} (~{payload['tokens']} tokens)\033[0m", file=sys.stderr)
    elif kind == "text":
        print(payload["piece"], end="", file=sys.stderr, flush=True)
    elif kind == "tool":
        args = ", ".join(f"{k}={str(v)[:50]!r}" for k, v in payload["arguments"].items())
        print(f"\n\033[36m→ {payload['name']}({args})\033[0m", file=sys.stderr)
    elif kind == "tool_done":
        mark = "\033[32m✓\033[0m" if payload["ok"] else "\033[31m✗\033[0m"
        print(f"  {mark} {payload['name']} ({payload['seconds']}s)", file=sys.stderr)
    elif kind == "denied":
        print(f"\033[31m  denied: {payload['name']}\033[0m", file=sys.stderr)
    elif kind == "compact":
        print(
            f"\033[33m  compacted context: {payload['before']} → {payload['after']} tokens\033[0m",
            file=sys.stderr,
        )
