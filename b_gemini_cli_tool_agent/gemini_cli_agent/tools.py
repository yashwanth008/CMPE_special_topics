"""Tools that let an ADK agent drive the Gemini CLI against a GitHub repository.

Security notes (this is the part that matters in production):
  * No shell. Every subprocess gets an argv list, so user text can never become shell syntax.
  * Only https://github.com/<owner>/<repo> URLs are accepted; owner/repo are charset-restricted.
  * The CLI runs headless (`gemini -p`) WITHOUT --yolo, so it can read/analyse but any tool call
    that needs approval is denied. Repo content is untrusted (prompt injection!) - keep it that way.
  * Hard timeouts and output truncation protect the agent's context window and the container.
  * File reads are confined to the cloned repo (symlink/`..` safe).
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
from pathlib import Path

GITHUB_RE = re.compile(r"^https://github\.com/([A-Za-z0-9_.-]{1,100})/([A-Za-z0-9_.-]{1,100}?)(?:\.git)?/?$")
MAX_OUTPUT_CHARS = int(os.getenv("GEMINI_CLI_MAX_OUTPUT", "20000"))
CLONE_TIMEOUT = int(os.getenv("GEMINI_CLI_CLONE_TIMEOUT", "300"))
CLI_TIMEOUT = int(os.getenv("GEMINI_CLI_TIMEOUT", "600"))
MAX_FILE_BYTES = 200_000


def workspace_root() -> Path:
    root = Path(os.getenv("GEMINI_WORKSPACE", "/tmp/gemini-workspaces"))
    root.mkdir(parents=True, exist_ok=True)
    return root


def parse_github_url(url: str) -> tuple[str, str]:
    m = GITHUB_RE.match((url or "").strip())
    if not m:
        raise ValueError("Only https://github.com/<owner>/<repo> URLs are allowed.")
    return m.group(1), m.group(2)


def _clone(url: str, dest: Path) -> None:
    """Shallow clone. Separate function so tests can replace it."""
    subprocess.run(
        ["git", "clone", "--depth", "1", "--", url, str(dest)],
        check=True, capture_output=True, text=True, timeout=CLONE_TIMEOUT,
    )


def clone_repo(github_url: str) -> dict:
    """Clone (or reuse) a public GitHub repo into the sandbox workspace.

    Args:
        github_url: e.g. https://github.com/google/adk-samples

    Returns:
        dict with status, local path and repo name.
    """
    try:
        owner, repo = parse_github_url(github_url)
    except ValueError as e:
        return {"status": "error", "error": str(e)}
    dest = workspace_root() / f"{owner}__{repo}"
    try:
        if not dest.exists():
            _clone(f"https://github.com/{owner}/{repo}.git", dest)
        return {"status": "success", "path": str(dest), "repo": f"{owner}/{repo}"}
    except subprocess.TimeoutExpired:
        shutil.rmtree(dest, ignore_errors=True)
        return {"status": "error", "error": f"git clone timed out after {CLONE_TIMEOUT}s"}
    except subprocess.CalledProcessError as e:
        shutil.rmtree(dest, ignore_errors=True)
        return {"status": "error", "error": f"git clone failed: {(e.stderr or '')[-500:]}"}


def run_gemini_cli(task: str, github_url: str) -> dict:
    """Run the Gemini CLI headlessly inside a cloned repo and return its answer.

    Use for deep codebase work: explaining architecture, finding bugs, drafting test plans,
    generating unit tests, summarising modules.

    Args:
        task: Natural-language instruction for the Gemini CLI, e.g. "explain this codebase".
        github_url: GitHub repo to analyse (cloned automatically).

    Returns:
        dict with status and output (truncated) or error.
    """
    if not task or not task.strip():
        return {"status": "error", "error": "task must not be empty"}
    cloned = clone_repo(github_url)
    if cloned["status"] != "success":
        return cloned
    exe = shutil.which("gemini")
    if not exe:
        return {"status": "error", "error": "gemini CLI not found on PATH (npm i -g @google/gemini-cli)"}
    try:
        res = subprocess.run(
            [exe, "-p", task], cwd=cloned["path"], capture_output=True, text=True,
            timeout=CLI_TIMEOUT, env=os.environ.copy(), stdin=subprocess.DEVNULL,
        )
    except subprocess.TimeoutExpired:
        return {"status": "error", "error": f"gemini CLI timed out after {CLI_TIMEOUT}s"}
    if res.returncode != 0:
        return {"status": "error", "error": f"gemini exited {res.returncode}: {res.stderr[-800:]}"}
    out = res.stdout
    truncated = len(out) > MAX_OUTPUT_CHARS
    return {"status": "success", "repo": cloned["repo"], "truncated": truncated,
            "output": out[:MAX_OUTPUT_CHARS]}


def read_repo_file(github_url: str, relative_path: str) -> dict:
    """Read one text file from an already-cloned repo (confined to that repo).

    Args:
        github_url: the repo URL used with clone_repo / run_gemini_cli.
        relative_path: path inside the repo, e.g. "src/main.py".
    """
    try:
        owner, repo = parse_github_url(github_url)
    except ValueError as e:
        return {"status": "error", "error": str(e)}
    base = (workspace_root() / f"{owner}__{repo}").resolve()
    if not base.exists():
        return {"status": "error", "error": "repo not cloned yet; call clone_repo first"}
    target = (base / relative_path).resolve()
    if base not in target.parents:
        return {"status": "error", "error": "path escapes the repository"}
    if not target.is_file():
        return {"status": "error", "error": "file not found"}
    data = target.read_bytes()[:MAX_FILE_BYTES]
    return {"status": "success", "path": relative_path, "content": data.decode("utf-8", errors="replace")}
