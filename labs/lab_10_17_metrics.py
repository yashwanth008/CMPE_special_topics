"""Lab 10.17 - The new metrics, computed on OUR runs, each with what it solves / when / limits.

   RSI-Index                (RSIGym)    - fraction of remaining gap closed          -> lab 10.15 results
   steering-split solve rate (Budget RSI)- cheap proxy used for selection            -> optimism gap vs held-out (lab 10.03)
   Recursive Learnability   (R2Orch)    - how informative the chosen tasks are      -> OUR operationalisation below
   Swarm diversity          (SwarmRSI)  - how different the agents are              -> lab 10.11 results

Recursive Learnability: the paper's exact definition is not available to us; we use the mean binary
entropy H(p) of the per-category success rate of the proposer's attempts (categories with >=4 attempts).
H is 0 when a category always/never improves, 1 when it improves half the time: it rewards choosing
tasks whose outcome is uncertain.  Treat as an illustration, not as the paper's metric.
"""
from _common import *  # noqa
import pickle

from rsi_lab.scaffold import LIBRARY

def H(p):
    return 0.0 if p in (0.0, 1.0) else float(-p * np.log2(p) - (1 - p) * np.log2(1 - p))

def learnability(trace):
    by = {}
    for step, name, acc, d, forced in trace:
        e = LIBRARY.get(name)
        if e is None or e.target is None:
            continue
        by.setdefault(e.target, []).append(acc and d > 0)
    hs = [H(float(np.mean(v))) for v in by.values() if len(v) >= 4]
    return float(np.mean(hs)) if hs else float("nan"), len(hs)

logs = pickle.load(open(os.path.join(ROOT, "results", "so_rsi_logs.pkl"), "rb"))
l15, l03, l11 = load("lab_10_15.json"), load("lab_10_03.json"), load("lab_10_11.json")
banner("10.17 metric 1: RSI-Index")
for k in ("so:planted:naive", "so:planted:naive+blind", "so:planted:so_rsi", "hpo:none", "hpo:self_hpo"):
    print(f"   {k:26s} {l15[k][0]:.3f} ± {l15[k][1]:.3f}")
print("   solves: compares systems started from different baselines.  limit: equal-weights groups; undefined when initial=ideal; hides cost.")
banner("10.17 metric 2: steering-split solve rate and its optimism")
for k in ("readout", "hgm_matched", "oracle", "random"):
    r = l03["res"][k]
    print(f"   {k:12s} steering {r['steer_mean']:.3f}  held-out {r['test_mean']:.3f}  optimism(steer-test)={r['steer_mean'] - r['test_mean']:+.3f}")
print("   solves: a cheap selection signal.  limit: it is optimistic.  In OUR runs the gap is ~+0.05-0.06 for EVERY method, even random selection,")
print("   so it is NOT growing with the number of candidates compared; it mostly reflects the dev-vs-test category shift (10% unseen-style pinch lines in test vs 3% in dev).")
banner("10.17 metric 3: Recursive Learnability (our operationalisation)")
out = {}
for start in ("planted", "clean"):
    for arm in ("naive", "so_rsi"):
        v = [learnability(l["trace"])[0] for l in logs[start][arm]]
        out[f"{start}:{arm}"] = mean_sem(v)
        print(f"   {start:8s} {arm:8s} learnability {mean_sem(v)[0]:.3f} ± {mean_sem(v)[1]:.3f}  (from {np.mean([learnability(l['trace'])[1] for l in logs[start][arm]]):.1f} categories/run)")
print("   solves: flags proposers stuck on tasks that always fail or are already solved.  limit: depends on the task taxonomy; says nothing about whether outcomes are GOOD.")
banner("10.17 metric 4: swarm diversity (Jaccard)")
for B in ("3000", "6000"):
    print(f"   budget {B}: swarm {l11[B]['diversity_final']['swarm']:.2f}   mutation-only {l11[B]['diversity_final']['mutation_only']:.2f}")
print("   solves: detects premature convergence.  limit: diversity of genomes != diversity of behaviour; here lower diversity went with equal accuracy, not worse.")
save("lab_10_17.json", out)
print("\nWHY SO MANY METRICS: each system changes a different object (scaffold, proposer, workflow, swarm); no single number covers all of them.")
