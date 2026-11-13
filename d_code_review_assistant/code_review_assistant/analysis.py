"""Deterministic static analysis + style checks (no LLM, fully unit-tested)."""
from __future__ import annotations

import ast
import re

MAX_LINE = 100
SECRET_RE = re.compile(r"""(?ix)(api[_-]?key|secret|passwd|password|token)\s*=\s*['"][^'"]{6,}['"]""")
SNAKE = re.compile(r"^_{0,2}[a-z][a-z0-9_]*_{0,2}$")
CAMEL = re.compile(r"^_?[A-Z][A-Za-z0-9]*$")


def _complexity(fn: ast.AST) -> int:
    n = 1
    for node in ast.walk(fn):
        if isinstance(node, (ast.If, ast.For, ast.While, ast.IfExp, ast.ExceptHandler, ast.With, ast.Assert)):
            n += 1
        elif isinstance(node, ast.BoolOp):
            n += len(node.values) - 1
        elif isinstance(node, ast.comprehension):
            n += 1 + len(node.ifs)
    return n


def _depth(node: ast.AST, d: int = 0) -> int:
    best = d
    for ch in ast.iter_child_nodes(node):
        inc = 1 if isinstance(ch, (ast.If, ast.For, ast.While, ast.Try, ast.With)) else 0
        best = max(best, _depth(ch, d + inc))
    return best


def analyze_code(code: str) -> dict:
    """AST-based review. Returns {'syntax_ok', 'issues': [{line, severity, rule, message}], 'metrics'}."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return {"syntax_ok": False, "issues": [{"line": e.lineno or 0, "severity": "error", "rule": "syntax",
                                                "message": f"SyntaxError: {e.msg}"}], "metrics": {}}
    issues: list[dict] = []

    def add(node, sev, rule, msg):
        issues.append({"line": getattr(node, "lineno", 0), "severity": sev, "rule": rule, "message": msg})

    functions = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
    classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
    for fn in functions:
        cx = _complexity(fn)
        if cx > 10:
            add(fn, "warning", "complexity", f"`{fn.name}` has cyclomatic complexity {cx} (>10); split it up.")
        if _depth(fn) > 3:
            add(fn, "warning", "nesting", f"`{fn.name}` nests control flow >3 levels deep; use early returns.")
        if len(fn.args.args) > 6:
            add(fn, "info", "too-many-args", f"`{fn.name}` takes {len(fn.args.args)} parameters.")
        if not ast.get_docstring(fn) and not fn.name.startswith("_"):
            add(fn, "info", "docstring", f"public function `{fn.name}` has no docstring.")
        for d in fn.args.defaults + [k for k in fn.args.kw_defaults if k]:
            if isinstance(d, (ast.List, ast.Dict, ast.Set)):
                add(fn, "error", "mutable-default", f"`{fn.name}` uses a mutable default argument (shared across calls).")
    for cl in classes:
        if not ast.get_docstring(cl):
            add(cl, "info", "docstring", f"class `{cl.name}` has no docstring.")
    for node in ast.walk(tree):
        if isinstance(node, ast.ExceptHandler):
            if node.type is None:
                add(node, "error", "bare-except", "bare `except:` swallows KeyboardInterrupt/SystemExit; catch specific exceptions.")
            elif len(node.body) == 1 and isinstance(node.body[0], ast.Pass):
                add(node, "warning", "swallowed-exception", "exception is caught and silently ignored.")
        elif isinstance(node, ast.Call):
            name = node.func.id if isinstance(node.func, ast.Name) else getattr(node.func, "attr", "")
            if name in ("eval", "exec"):
                add(node, "error", "dangerous-call", f"`{name}()` executes arbitrary code.")
            if name in ("system", "popen") or (name == "run" and any(
                    kw.arg == "shell" and getattr(kw.value, "value", False) is True for kw in node.keywords)):
                add(node, "error", "shell-injection", "shell execution with possibly untrusted input; pass an argv list.")
            if name == "execute" and node.args and isinstance(node.args[0], (ast.JoinedStr, ast.BinOp)):
                add(node, "error", "sql-injection", "SQL built with f-string/concatenation; use parameterised queries.")
        elif isinstance(node, ast.Compare):
            for op, comp in zip(node.ops, node.comparators):
                if isinstance(op, (ast.Eq, ast.NotEq)) and isinstance(comp, ast.Constant) and comp.value is None:
                    add(node, "info", "none-comparison", "compare to None with `is`/`is not`.")
    for i, line in enumerate(code.splitlines(), 1):
        if SECRET_RE.search(line):
            issues.append({"line": i, "severity": "error", "rule": "hardcoded-secret",
                           "message": "possible hard-coded credential; load from env/secret manager."})
    order = {"error": 0, "warning": 1, "info": 2}
    issues.sort(key=lambda x: (order[x["severity"]], x["line"]))
    return {"syntax_ok": True, "issues": issues, "metrics": {
        "lines": len(code.splitlines()), "functions": len(functions), "classes": len(classes),
        "max_complexity": max((_complexity(f) for f in functions), default=0)}}


def check_style(code: str) -> dict:
    """Lightweight PEP 8 checks that don't need external tools."""
    issues = []
    for i, line in enumerate(code.splitlines(), 1):
        if len(line) > MAX_LINE:
            issues.append({"line": i, "rule": "line-length", "message": f"{len(line)} chars (max {MAX_LINE})"})
        if line.rstrip() != line:
            issues.append({"line": i, "rule": "trailing-whitespace", "message": "trailing whitespace"})
        if "\t" in line[: len(line) - len(line.lstrip())]:
            issues.append({"line": i, "rule": "tabs", "message": "tab indentation; use 4 spaces"})
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return {"issues": issues}
    for n in ast.walk(tree):
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and not SNAKE.match(n.name):
            issues.append({"line": n.lineno, "rule": "naming", "message": f"function `{n.name}` should be snake_case"})
        if isinstance(n, ast.ClassDef) and not CAMEL.match(n.name):
            issues.append({"line": n.lineno, "rule": "naming", "message": f"class `{n.name}` should be CapWords"})
    issues.sort(key=lambda x: x["line"])
    return {"issues": issues, "score": max(0, 100 - 5 * len(issues))}
