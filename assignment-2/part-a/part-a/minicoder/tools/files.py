"""Filesystem tools.

Every path goes through `resolve()`, which refuses anything outside the
workspace. Without that check, a model that hallucinates `../../.ssh/id_rsa`
gets it. The sandbox is one function and it is the most important twelve lines
in the repo.
"""

from __future__ import annotations

import os
from pathlib import Path

from ..types import ToolResult
from .base import registry

# Set by Agent at construction. Module-level so tool functions stay simple.
WORKSPACE: Path = Path.cwd()

MAX_READ_BYTES = 400_000


def set_workspace(path: Path) -> None:
    global WORKSPACE
    WORKSPACE = Path(path).resolve()


def resolve(path: str) -> Path:
    """Resolve a model-supplied path inside the workspace, or raise.

    `.resolve()` collapses `..` *before* we compare, so the check cannot be
    walked around with traversal sequences or symlinks.
    """
    candidate = (WORKSPACE / path).resolve() if not os.path.isabs(path) else Path(path).resolve()
    if candidate != WORKSPACE and WORKSPACE not in candidate.parents:
        raise PermissionError(
            f"{path} is outside the workspace ({WORKSPACE}). Refused."
        )
    return candidate


@registry.register(read_only=True)
def read_file(path: str, start_line: int = 1, max_lines: int = 2000) -> ToolResult:
    """Read a text file from the workspace, with line numbers.

    Always read a file before editing it. Line numbers in the output are what
    edit_file and the user refer to.

    Args:
        path: File path relative to the workspace root.
        start_line: 1-indexed line to start from.
        max_lines: Maximum number of lines to return.
    """
    target = resolve(path)
    if not target.exists():
        return ToolResult(f"Error: {path} does not exist.", ok=False)
    if target.is_dir():
        return ToolResult(f"Error: {path} is a directory. Use list_dir.", ok=False)
    if target.stat().st_size > MAX_READ_BYTES:
        return ToolResult(
            f"Error: {path} is {target.stat().st_size} bytes, too large to read whole. "
            "Use grep to find the part you need.",
            ok=False,
        )

    lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
    window = lines[start_line - 1 : start_line - 1 + max_lines]
    if not window:
        return ToolResult(f"{path} has {len(lines)} lines; start_line {start_line} is past the end.")

    numbered = "\n".join(
        f"{i:>5}| {line}" for i, line in enumerate(window, start=start_line)
    )
    footer = ""
    if start_line - 1 + max_lines < len(lines):
        footer = f"\n... ({len(lines) - start_line + 1 - max_lines} more lines)"
    return ToolResult(numbered + footer)


@registry.register(dangerous=True, read_only=False)
def write_file(path: str, content: str) -> ToolResult:
    """Write text to a file, creating parent directories. Overwrites completely.

    To change part of an existing file, prefer edit_file -- it will not silently
    destroy content you did not read.

    Args:
        path: File path relative to the workspace root.
        content: The complete new contents of the file.
    """
    target = resolve(path)
    existed = target.exists()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    verb = "Overwrote" if existed else "Created"
    return ToolResult(f"{verb} {path} ({len(content)} bytes, {len(content.splitlines())} lines).")


@registry.register(dangerous=True, read_only=False)
def edit_file(path: str, old_text: str, new_text: str) -> ToolResult:
    """Replace an exact string in a file. The old text must appear exactly once.

    This is deliberately strict. Requiring a unique match means the model has to
    have actually read the file, and makes a wrong edit fail loudly instead of
    corrupting the wrong line.

    Args:
        path: File path relative to the workspace root.
        old_text: Exact text to replace, including indentation. Must be unique.
        new_text: Replacement text.
    """
    target = resolve(path)
    if not target.is_file():
        return ToolResult(f"Error: {path} does not exist.", ok=False)

    original = target.read_text(encoding="utf-8")
    occurrences = original.count(old_text)

    if occurrences == 0:
        return ToolResult(
            f"Error: that exact text is not in {path}. "
            "Read the file again -- whitespace and indentation must match.",
            ok=False,
        )
    if occurrences > 1:
        return ToolResult(
            f"Error: that text appears {occurrences} times in {path}. "
            "Include surrounding lines to make it unique.",
            ok=False,
        )

    target.write_text(original.replace(old_text, new_text), encoding="utf-8")
    return ToolResult(f"Edited {path}: replaced 1 occurrence.")


@registry.register(read_only=True)
def list_dir(path: str = ".") -> ToolResult:
    """List files and directories, skipping noise like .git and __pycache__.

    Args:
        path: Directory relative to the workspace root.
    """
    target = resolve(path)
    if not target.is_dir():
        return ToolResult(f"Error: {path} is not a directory.", ok=False)

    skip = {".git", "__pycache__", ".venv", "node_modules", ".pytest_cache", ".mypy_cache"}
    rows: list[str] = []
    for entry in sorted(target.iterdir(), key=lambda p: (p.is_file(), p.name)):
        if entry.name in skip or entry.name.startswith(".DS"):
            continue
        if entry.is_dir():
            rows.append(f"  {entry.name}/")
        else:
            rows.append(f"  {entry.name}  ({entry.stat().st_size} bytes)")

    if not rows:
        return ToolResult(f"{path} is empty.")
    return ToolResult(f"{path}:\n" + "\n".join(rows))
