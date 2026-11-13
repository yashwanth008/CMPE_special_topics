"""Lab 10.15 - RSI-Index (RSIGym): the fraction of the remaining performance gap an RSI system closes.

CORRECTION to the course page: lab 10.15 writes  (initial - final)/(ideal - initial), which is NEGATIVE for any
improvement.  The intended (and the course's own worked example, 0.5) is  (final - initial)/(ideal - initial).
We implement the corrected formula and show the discrepancy below.

'Benchmarks' for our task = four skill groups (numbers / units / notes / shifted), scored on the HELD-OUT split.
initial = the starting scaffold, final = what each RSI arm produced, ideal = 1.0.
"""
from _common import *  # noqa
import pickle

from rsi_lab.data import GROUPS, make_world
from rsi_lab.methods.self_hpo import run as hpo_run
from rsi_lab.scaffold import base_source, evaluate


def rsi_index(initial, final, ideal=1.0):
    gaps = [(f - i) / (ideal - i) for i, f in zip(initial, final) if ideal - i > 1e-9]
    return float(np.mean(gaps)), gaps


def group_acc(src, test):
    r = evaluate(src, test)
    return [float(np.mean([ok for inst, ok in zip(test, r.passed) if inst.cat in cats])) for cats in GROUPS.values()]


banner("10.15 the course's worked example, both formulas")
ex = [(0.50, 0.75), (0.20, 0.60)]
print("benchmarks (initial, final, ideal=1.0):", ex)
print("corrected  (final-initial)/(ideal-initial): ", rsi_index([a for a, _ in ex], [b for _, b in ex])[0], " <- matches the course's 0.5")
print("as printed (initial-final)/(ideal-initial): ", float(np.mean([(a - b) / (1 - a) for a, b in ex])), " <- negative: sign error in the lab text")
print("synthetic 5-benchmark scenario:")
five = [(0.30, 0.55), (0.62, 0.70), (0.10, 0.45), (0.80, 0.85), (0.50, 0.50)]
m, gaps = rsi_index([a for a, _ in five], [b for _, b in five])
print("   gap closed per benchmark:", [round(g, 2) for g in gaps], "-> RSI-Index", round(m, 3), "(raw mean gain only %.3f)" % np.mean([b - a for a, b in five]))

banner("10.15 RSI-Index of our RSI arms (held-out, 30 seeds, 4 skill-group 'benchmarks')")
logs = pickle.load(open(os.path.join(ROOT, "results", "so_rsi_logs.pkl"), "rb"))
res = {}
rows = []
for start, buggy in [("planted", True), ("clean", False)]:
    for arm in ("naive", "naive+blind", "so_rsi"):
        vals = []
        for s, l in zip(FINAL_SEEDS, logs[start][arm]):
            test = make_world(s).test
            vals.append(rsi_index(group_acc(base_source(buggy), test), group_acc(l["final_src"], test))[0])
        res[f"so:{start}:{arm}"] = mean_sem(vals)
        rows.append((f"SO-RSI lab, {start} start, {arm}", mean_sem(vals)))
for cond in ("none", "policy_only", "harness_only", "self_hpo"):
    vals = []
    for s in FINAL_SEEDS:
        r = hpo_run(s, cond, total_budget=12000)
        test = make_world(s).test
        vals.append(rsi_index(group_acc(base_source(False), test), group_acc(r["src"], test))[0])
    res[f"hpo:{cond}"] = mean_sem(vals)
    rows.append((f"Self-HPO lab, B=12000, {cond}", mean_sem(vals)))
print(f"{'system':44s} {'RSI-Index':>10s} {'±sem':>7s}")
for name, (m, e) in rows:
    print(f"{name:44s} {m:10.3f} {e:7.3f}")
save("lab_10_15.json", res)
print("\nNOTE: RSI-Index here averages group gaps with EQUAL weight; groups with initial=1.0 are skipped; it is not comparable to RSIGym's number.")
