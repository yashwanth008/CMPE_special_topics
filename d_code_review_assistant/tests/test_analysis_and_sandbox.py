import os

from code_review_assistant.analysis import analyze_code, check_style
from code_review_assistant.sandbox import run_tests, strip_code_fences

BAD = '''
import os
API_KEY = "sk-live-123456789"
def add_item(item, bucket=[]):
    try:
        bucket.append(item)
    except:
        pass
    return bucket
def run(cmd, db, uid):
    os.system(cmd)
    eval(cmd)
    db.execute(f"SELECT * FROM u WHERE id={uid}")
class bad_name: pass
'''


def rules(code):
    return {i["rule"] for i in analyze_code(code)["issues"]}


def test_detects_security_and_bug_patterns():
    assert {"mutable-default", "bare-except", "dangerous-call", "shell-injection",
            "sql-injection", "hardcoded-secret"} <= rules(BAD)


def test_clean_code_has_no_errors():
    good = 'def add(a: int, b: int) -> int:\n    """Add."""\n    return a + b\n'
    a = analyze_code(good)
    assert a["syntax_ok"] and not [i for i in a["issues"] if i["severity"] == "error"]


def test_syntax_error_reported():
    a = analyze_code("def f(:\n")
    assert not a["syntax_ok"] and a["issues"][0]["rule"] == "syntax"


def test_complexity_flagged():
    body = "\n".join(f"    if x == {i}:\n        return {i}" for i in range(12))
    assert "complexity" in rules(f"def f(x):\n{body}\n    return -1\n")


def test_style_checks():
    s = check_style("def BadName():\n\treturn 1 \n" + "x = '" + "a" * 120 + "'\n")
    r = {i["rule"] for i in s["issues"]}
    assert {"naming", "tabs", "trailing-whitespace", "line-length"} <= r


def test_strip_fences():
    assert strip_code_fences("here:\n```python\nx = 1\n```\nbye").strip() == "x = 1"
    assert strip_code_fences("x = 1").strip() == "x = 1"


def test_sandbox_pass_and_fail():
    code = "def add(a, b):\n    return a + b\n"
    ok = run_tests(code, "from candidate import add\ndef test_a():\n    assert add(1, 2) == 3\n")
    assert ok["status"] == "passed" and ok["passed"] == 1
    bad = run_tests(code, "from candidate import add\ndef test_a():\n    assert add(1, 2) == 4\n")
    assert bad["status"] == "failed" and bad["failed"] == 1


def test_sandbox_timeout():
    import code_review_assistant.sandbox as sb
    old = sb.TIMEOUT_S
    sb.TIMEOUT_S = 2
    try:
        r = run_tests("def spin():\n    while True: pass\n", "from candidate import spin\ndef test_x():\n    spin()\n")
    finally:
        sb.TIMEOUT_S = old
    assert r["status"] == "timeout"


def test_sandbox_does_not_leak_env_secrets(monkeypatch):
    monkeypatch.setenv("SUPER_SECRET_TOKEN", "hunter2")
    r = run_tests("X = 1\n", "import os\ndef test_env():\n    assert 'SUPER_SECRET_TOKEN' not in os.environ\n")
    assert r["status"] == "passed"
