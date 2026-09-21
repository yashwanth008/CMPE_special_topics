"""Search tools.

A coding agent spends most of its turns finding the right file, not editing it.
Giving it real search means it stops trying to `cat` its way around a repo,
which is what burns context.
"""

from __future__ import annotations

import fnmatch
import re
from pathlib import Path

from ..types import ToolResult
from .base import registry
from .files import resolve

SKIP_DIRS = {".git", "__pycache__", ".venv", "node_modules", ".pytest_cache", "dist", "build"}
MAX_HITS = 100


def _walk(root: Path):
    for path in root.rglob("*"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.is_file():
            yield path


@registry.register(read_only=True)
def glob(pattern: str, path: str = ".") -> ToolResult:
    """Find files whose name matches a glob pattern, e.g. '*.py' or 'test_*.py'.

    Args:
        pattern: Glob pattern matched against the file name and relative path.
        path: Directory to search from, relative to the workspace root.
    """
    root = resolve(path)
    if not root.is_dir():
        return ToolResult(f"Error: {path} is not a directory.", ok=False)

    hits = [
        str(f.relative_to(root))
        for f in _walk(root)
        if fnmatch.fnmatch(f.name, pattern) or fnmatch.fnmatch(str(f.relative_to(root)), pattern)
    ]
    if not hits:
        return ToolResult(f"No files match {pattern!r} under {path}.")

    listing = "\n".join(f"  {h}" for h in sorted(hits)[:MAX_HITS])
    more = f"\n  ... and {len(hits) - MAX_HITS} more" if len(hits) > MAX_HITS else ""
    return ToolResult(f"{len(hits)} match(es) for {pattern!r}:\n{listing}{more}")


@registry.register(read_only=True)
def grep(pattern: str, path: str = ".", file_pattern: str = "*") -> ToolResult:
    """Search file contents with a regular expression and return matching lines.

    Args:
        pattern: Python regular expression to search for.
        path: Directory or file to search, relative to the workspace root.
        file_pattern: Only search files whose name matches this glob.
    """
    try:
        regex = re.compile(pattern)
    except re.error as exc:
        return ToolResult(f"Error: invalid regular expression {pattern!r}: {exc}", ok=False)

    root = resolve(path)
    targets = [root] if root.is_file() else list(_walk(root))

    rows: list[str] = []
    for file in targets:
        if not fnmatch.fnmatch(file.name, file_pattern):
            continue
        try:
            text = file.read_text(encoding="utf-8", errors="strict")
        except (UnicodeDecodeError, OSError):
            continue  # binary or unreadable; silently skip
        for number, line in enumerate(text.splitlines(), 1):
            if regex.search(line):
                relative = file.relative_to(root) if root.is_dir() else file.name
                rows.append(f"  {relative}:{number}: {line.strip()[:200]}")
                if len(rows) >= MAX_HITS:
                    break
        if len(rows) >= MAX_HITS:
            break

    if not rows:
        return ToolResult(f"No matches for {pattern!r} in {path}.")
    capped = "\n(capped at 100 matches)" if len(rows) >= MAX_HITS else ""
    return ToolResult(f"{len(rows)} match(es):\n" + "\n".join(rows) + capped)
