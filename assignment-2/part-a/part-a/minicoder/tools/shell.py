"""Shell execution.

The most useful tool and the most dangerous one. Three rails:
  * it runs with cwd pinned to the workspace,
  * it times out,
  * an obvious-destruction denylist refuses before the permission prompt is even
    reached, so a distracted "y" cannot wipe a disk.

The denylist is a backstop, not a security boundary. Real isolation means a
container or a VM; this is a teaching harness and says so out loud.
"""

from __future__ import annotations

import subprocess

from ..types import ToolResult
from .base import registry
from . import files

# Patterns that are never worth the risk in an automated loop.
DENYLIST = (
    "rm -rf /",
    "rm -rf ~",
    "rm -rf *",
    ":(){",           # fork bomb
    "mkfs",
    "dd if=/dev/zero",
    "> /dev/sda",
    "chmod -R 777 /",
    "curl | sh",
    "curl | bash",
    "wget | sh",
    "shutdown",
    "reboot",
)

MAX_OUTPUT = 30_000
TIMEOUT = 60


@registry.register(dangerous=True, read_only=False)
def bash(command: str, timeout: int = TIMEOUT) -> ToolResult:
    """Run a shell command in the workspace and return its combined output.

    Use this to run tests, inspect git state, install packages, or anything the
    dedicated tools do not cover. Prefer read_file/edit_file for file work --
    they are safer and give better errors.

    Args:
        command: The shell command to execute.
        timeout: Seconds before the command is killed.
    """
    lowered = " ".join(command.lower().split())
    for pattern in DENYLIST:
        if pattern in lowered:
            return ToolResult(
                f"Refused: the command matches a blocked pattern ({pattern!r}). "
                "If you genuinely need this, the human must run it themselves.",
                ok=False,
            )

    try:
        proc = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=str(files.WORKSPACE),
            timeout=min(int(timeout), 600),
        )
    except subprocess.TimeoutExpired:
        return ToolResult(
            f"Error: command exceeded {timeout}s and was killed. "
            "If it is a long build, run it in the background and poll.",
            ok=False,
        )
    except Exception as exc:  # noqa: BLE001
        return ToolResult(f"Error launching command: {exc}", ok=False)

    parts: list[str] = [f"$ {command}", f"(exit code {proc.returncode})"]
    if proc.stdout.strip():
        parts.append(f"--- stdout ---\n{proc.stdout.rstrip()}")
    if proc.stderr.strip():
        parts.append(f"--- stderr ---\n{proc.stderr.rstrip()}")
    if not proc.stdout.strip() and not proc.stderr.strip():
        parts.append("(no output)")

    return ToolResult("\n".join(parts)[:MAX_OUTPUT], ok=proc.returncode == 0)
