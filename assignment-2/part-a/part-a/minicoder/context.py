"""Context window management.

A long agent run dies in one of two ways: it hits the context limit mid-task, or
it blows the budget re-sending a transcript that is 90% stale tool output. Both
are the harness's problem, not the model's.

Two mechanisms:
  * truncation  - a single huge tool result is clipped head+tail before it ever
                  enters history.
  * compaction  - when history approaches the limit, the middle is replaced by a
                  summary while the system prompt, the original task, and the
                  most recent turns are preserved verbatim.

The invariant compaction must never break: a message containing tool_calls must
keep its matching tool results, or the next request is rejected as malformed.
"""

from __future__ import annotations

from typing import Callable

from .types import Message

# Rough but stable: ~4 characters per token for English and code. Good enough
# for a budget decision, and it costs nothing. Swap in tiktoken if you need
# accuracy for billing.
CHARS_PER_TOKEN = 4


def estimate_tokens(messages: list[Message]) -> int:
    total = 0
    for message in messages:
        total += len(message.text) // CHARS_PER_TOKEN
        for call in message.tool_calls:
            total += (len(call.name) + len(str(call.arguments))) // CHARS_PER_TOKEN
        total += 4  # per-message overhead
    return total


def needs_compaction(messages: list[Message], limit: int, fraction: float) -> bool:
    return estimate_tokens(messages) > limit * fraction


def compact(
    messages: list[Message],
    summarise: Callable[[list[Message]], str],
    keep_recent: int = 6,
) -> list[Message]:
    """Collapse the middle of the conversation into a summary message.

    Layout after compaction:
        [system] [original user task] [summary of the middle] [last N messages]
    """
    if len(messages) <= keep_recent + 2:
        return messages

    system = [m for m in messages[:1] if m.role == "system"]
    rest = messages[len(system) :]
    if not rest:
        return messages

    first_task = rest[:1]
    middle = rest[1:-keep_recent]
    recent = rest[-keep_recent:]

    if not middle:
        return messages

    # Do not split a tool_calls message from its results. Walk the boundary back
    # until `recent` starts on a clean turn.
    while recent and recent[0].role == "tool":
        middle.append(recent.pop(0))
        # Guard against consuming everything.
        if not recent:
            recent = [middle.pop()]
            break

    summary = Message(
        role="user",
        content=(
            "[context compacted by the harness]\n"
            "Earlier steps of this session, summarised:\n\n"
            f"{summarise(middle)}\n\n"
            "Continue the task from here."
        ),
    )
    return system + first_task + [summary] + recent


def default_summariser(messages: list[Message]) -> str:
    """A cheap, no-extra-API-call summary: what was done, in order.

    A production harness sends `messages` to a small model and asks for prose.
    This version costs nothing and keeps the harness runnable offline; swap it
    for a model call by passing your own `summarise` to compact().
    """
    lines: list[str] = []
    for message in messages:
        if message.role == "assistant" and message.tool_calls:
            for call in message.tool_calls:
                args = ", ".join(f"{k}={str(v)[:40]}" for k, v in call.arguments.items())
                lines.append(f"  - called {call.name}({args})")
        elif message.role == "tool":
            first_line = (message.text or "").strip().splitlines()
            head = first_line[0][:100] if first_line else "(empty)"
            lines.append(f"      -> {head}")
        elif message.role == "assistant" and message.text:
            lines.append(f"  - said: {message.text.strip()[:150]}")

    if not lines:
        return "  (nothing of note)"
    if len(lines) > 60:
        lines = lines[:30] + [f"  ... {len(lines) - 60} steps omitted ..."] + lines[-30:]
    return "\n".join(lines)
