"""The permission gate.

The model proposes; the harness disposes. This module is the only place that
decides whether a requested tool call actually runs, and it deliberately sits
between the loop and the tool so there is no path around it.

Three outcomes:
  ALLOW  - run it
  ASK    - prompt the human
  DENY   - refuse, and tell the model why (as a tool result, not an exception,
           so it can adapt)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Callable


class Decision(Enum):
    ALLOW = "allow"
    ASK = "ask"
    DENY = "deny"


@dataclass
class PermissionPolicy:
    auto_approve: bool = False
    # Tools the human approved "for the rest of this session".
    session_allowed: set[str] = field(default_factory=set)
    denied: set[str] = field(default_factory=set)
    # Injected so tests can drive the prompt without a terminal.
    prompt: Callable[[str], str] = input

    def decide(self, tool_name: str, dangerous: bool, args: dict) -> Decision:
        if tool_name in self.denied:
            return Decision.DENY
        if not dangerous or self.auto_approve or tool_name in self.session_allowed:
            return Decision.ALLOW
        return Decision.ASK

    def confirm(self, tool_name: str, args: dict) -> bool:
        """Ask the human. 'a' remembers the answer for the rest of the session,
        which is the difference between a usable harness and one you abandon
        after the twentieth prompt."""
        preview = ", ".join(f"{k}={_short(v)}" for k, v in args.items())
        print(f"\n  ⚠  {tool_name}({preview})")
        answer = self.prompt("     allow? [y]es / [n]o / [a]lways / [never] : ").strip().lower()

        if answer in ("a", "always"):
            self.session_allowed.add(tool_name)
            return True
        if answer == "never":
            self.denied.add(tool_name)
            return False
        return answer in ("y", "yes")


def _short(value: object, limit: int = 60) -> str:
    text = str(value).replace("\n", "\\n")
    return text if len(text) <= limit else text[:limit] + "…"
