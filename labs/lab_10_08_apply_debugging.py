"""Lab 10.08 - Apply SO-RSI thinking to YOUR debugging session (course example, but executed).

Course scenario: a failing test `assert add(2, 3) == 5`; three fixes are tried; analysis says the
root cause was the TEST SETUP, not the function.  Here the scenario is real code:
  * a fixture builds the arguments the test passes (and has a bug: it passes (2, 4))
  * five 'fix attempts' are real function bodies that we exec and run
  * the SAME three anomaly detectors used in the parser experiments run on this trace
  * a probe tests the *reference* implementation on the fixture to separate 'function wrong' from
    'test wrong' - an executable diagnostic, not a guess
"""
from _common import *  # noqa
from rsi_lab.methods.so_rsi import Attempt, AnomalyDetector
from rsi_lab.scaffold import Edit

def fixture_args():                       # BUG: the test setup is wrong (should be (2, 3))
    return (2, 4)

def run_test(src: str) -> bool:
    ns = {}
    exec(src, ns)
    return ns["add"](*fixture_args()) == 5

attempts = [
    ("swap operands",   "def add(a, b): return b + a",   "increase"),
    ("use subtraction", "def add(a, b): return a - b",   "decrease"),
    ("revert to a+b",   "def add(a, b): return a + b",   "increase"),
    ("add int casts",   "def add(a, b): return int(a) + int(b)", "increase"),
    ("revert to a+b",   "def add(a, b): return a + b",   "increase"),
]
banner("10.08 executed fix attempts")
det, hist = AnomalyDetector(), []
for i, (what, src, kw) in enumerate(attempts, 1):
    ok = run_test(src)
    # map the attempt onto the shared trace schema: name = what was tried, target = 'add_test'
    e = Edit(what, (("add", "X", src, what),) if kw == "increase" else (("remove", what),), "add_test", "?")
    hist.append(Attempt(i, e, ok, 1.0 if ok else 0.0, 1.0 if ok else 0.0))
    anomalies = det.observe(hist)
    print(f"attempt {i}: {what:16s} test passes={ok}   anomalies={[a for a, _ in anomalies]}")
    for a, why in anomalies:
        print(f"           {a}: {why}")

banner("10.08 diagnostic probe (executable): is the FUNCTION wrong or the TEST wrong?")
ref = lambda a, b: a + b
args = fixture_args()
print(f"fixture passes args {args}; reference add{args} = {ref(*args)}; test expects 5")
print("-> even the reference implementation fails => the root cause is the fixture, not any candidate fix")
fixed_args = (2, 3)
print(f"with the corrected fixture {fixed_args}: reference gives {ref(*fixed_args)} == 5 -> {ref(*fixed_args) == 5}")
save("lab_10_08.json", dict(anomalies_on_trace=[[a.edit.name, a.accepted] for a in hist],
                            root_cause="fixture args (2,4) instead of (2,3)", reference_result=ref(*args)))
print("\nLESSON: five patches to the function could never pass; one probe on the reference located the cause.")
