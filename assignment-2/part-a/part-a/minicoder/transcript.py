"""Append-only event log for a session.

Every run writes a JSONL file: one JSON object per event, in order, flushed
immediately. This is not logging for its own sake -- it is what makes a run
inspectable after the fact. When an agent does something surprising, the
transcript is the only place the answer lives.

JSONL specifically, because it survives a crash mid-run: a truncated last line
costs you one event, not the file.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class Transcript:
    path: Path | None = None
    events: list[dict] = field(default_factory=list)
    started: float = field(default_factory=time.time)

    def __post_init__(self) -> None:
        if self.path:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.path.write_text("", encoding="utf-8")

    def record(self, kind: str, **payload: Any) -> None:
        event = {
            "t": round(time.time() - self.started, 3),
            "kind": kind,
            **payload,
        }
        self.events.append(event)

        if self.path:
            with self.path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(event, default=str) + "\n")

    # ------------------------------------------------------------------ reading

    def of_kind(self, kind: str) -> list[dict]:
        return [e for e in self.events if e["kind"] == kind]

    def summary(self) -> str:
        tool_events = self.of_kind("tool_result")
        failed = sum(1 for e in tool_events if not e.get("ok", True))
        turns = len(self.of_kind("model_response"))
        elapsed = round(time.time() - self.started, 1)

        line = (
            f"{turns} turn(s), {len(tool_events)} tool call(s), "
            f"{failed} failed, {elapsed}s"
        )
        if self.path:
            line += f"\ntranscript: {self.path}"
        return line
