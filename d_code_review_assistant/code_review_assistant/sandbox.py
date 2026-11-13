"""Run untrusted (LLM-written or user) Python tests in a constrained subprocess.

Defences: temp dir, scrubbed environment (no secrets), `python -I`, wall-clock timeout, CPU and memory
rlimits, no core dumps, truncated output. NOTE: this is not a security boundary against a determined
attacker (no network namespace) - in production run the whole service in a locked-down Cloud Run
container / gVisor and keep egress closed. See README "Threat model".
"""
from __future__ import annotations

import os
import re
import signal
import subprocess
import sys
import tempfile
from pathlib import Path

TIMEOUT_S = int(os.getenv("REVIEW_SANDBOX_TIMEOUT", "20"))
MEM_BYTES = int(os.getenv("REVIEW_SANDBOX_MEM_MB", "512")) * 1024 * 1024
MAX_OUT = 6000


def _limits():  # runs in the child between fork and exec (POSIX only)
    import resource
    resource.setrlimit(resource.RLIMIT_CPU, (TIMEOUT_S, TIMEOUT_S))
    resource.setrlimit(resource.RLIMIT_AS, (MEM_BYTES, MEM_BYTES))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    resource.setrlimit(resource.RLIMIT_NPROC, (64, 64)) if hasattr(resource, "RLIMIT_NPROC") else None


def strip_code_fences(text: str) -> str:
    """LLMs love wrapping code in ```python fences; remove them."""
    m = re.search(r"```(?:python|py)?\s*\n(.*?)```", text or "", re.S)
    return (m.group(1) if m else (text or "")).strip("\n") + "\n"


def run_tests(code: str, tests: str) -> dict:
    """Write code to candidate.py and tests to test_candidate.py, run pytest, parse the summary."""
    code, tests = strip_code_fences(code), strip_code_fences(tests)
    with tempfile.TemporaryDirectory(prefix="review_") as d:
        Path(d, "candidate.py").write_text(code)
        Path(d, "test_candidate.py").write_text(tests)
        env = {"PATH": os.environ.get("PATH", ""), "PYTHONDONTWRITEBYTECODE": "1", "HOME": d}
        try:
            p = subprocess.run(
                [sys.executable, "-I", "-m", "pytest", "-q", "-x", "--no-header", "-p", "no:cacheprovider",
                 "test_candidate.py"],
                cwd=d, env=env, capture_output=True, text=True, timeout=TIMEOUT_S + 5,
                preexec_fn=_limits, stdin=subprocess.DEVNULL)
        except subprocess.TimeoutExpired:
            return {"status": "timeout", "passed": 0, "failed": 0, "output": f"timed out after {TIMEOUT_S}s"}
    out = (p.stdout + p.stderr)[-MAX_OUT:]
    passed = int((re.search(r"(\d+) passed", out) or [0, 0])[1])
    failed = int((re.search(r"(\d+) failed", out) or [0, 0])[1])
    errors = int((re.search(r"(\d+) error", out) or [0, 0])[1])
    if p.returncode == 0:
        status = "passed"
    elif p.returncode in (-signal.SIGXCPU, -signal.SIGKILL, -signal.SIGSEGV) or "CPU time limit" in out:
        status = "timeout"
    else:
        status = "failed"
    return {"status": status, "passed": passed, "failed": failed + errors, "output": out}
