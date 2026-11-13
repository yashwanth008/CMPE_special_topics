"""Lab 10.06 - Run SO-RSI vs first-order RSI on the ingredient-parser task.

Three arms, SAME evaluation budget (probe cost is charged), same proposer RNG stream:
   naive            first-order RSI: patch the failing category, sometimes undo, sometimes guess
   naive+blind      same, plus BLIND structural moves (remove a random tagged stage) with no diagnosis
   so_rsi           same proposer + anomaly detectors + causal probe + inquiry memory

Two starting scaffolds:
   planted : base parser contains a PLANTED blocker (`punct_stripper`) - structure exists to be found
   clean   : no planted blocker (the loop can still create its own blockers, e.g. a swapped-fraction
             patch that shadows the correct one - so this is NOT a 'no structure' control)

FAIRNESS NOTE: the plain naive agent has no way to delete code it did not write, so in the planted
scaffold it is crippled by construction.  `naive+blind` is the fair baseline for 'does the DIAGNOSIS
matter, or just having structural moves?'.
"""
from _common import *  # noqa
import warnings; warnings.filterwarnings('ignore', category=RuntimeWarning)
from rsi_lab.methods.so_rsi import run_rsi, test_at

BUDGETS = (1500, 3000, 5000, 8000)
banner("10.06 one SO-RSI run, narrated (seed 100, planted blocker, budget 3000)")
log = run_rsi(100, True, True, budget=3000, verbose=True)
print(f"... {log.attempts} attempts, {log.probes} probes costing {log.probe_cost:.0f} evals, held-out {log.final_test:.3f}")
print("first 12 trace rows (step, edit, accepted, d_steer, forced_by_memory):")
for r in log.trace[:12]:
    print("   ", r)

res = {}
for start, buggy in [("planted", True), ("clean", False)]:
    banner(f"10.06 30 fresh seeds - {start} start - held-out accuracy of incumbent at budget")
    arms = {"naive": [run_rsi(s, False, buggy) for s in FINAL_SEEDS],
            "naive+blind": [run_rsi(s, False, buggy, blind_remove=0.15) for s in FINAL_SEEDS],
            "so_rsi": [run_rsi(s, True, buggy) for s in FINAL_SEEDS]}
    res[start] = {}
    print(f"{'budget':>7s} " + " ".join(f"{a:>13s}" for a in arms) + "   SO-RSI - naive [95% CI]      SO-RSI - naive+blind [95% CI]")
    for b in BUDGETS:
        v = {a: [test_at(l, b) for l in L] for a, L in arms.items()}
        res[start][b] = {a: mean_sem(x) for a, x in v.items()}
        print(f"{b:7d} " + " ".join(f"{np.nanmean(v[a]):13.3f}" for a in arms) + "   " +
              fmt_ci(v['so_rsi'], v['naive']).split(' ->')[0].ljust(28) + " " + fmt_ci(v['so_rsi'], v['naive+blind']))
    res[start]["curves"] = {a: [[c[0], c[2]] for c in L[0].curve] for a, L in arms.items()}
    res[start]["mean_curves"] = {}
    grid = np.arange(100, 8001, 100)
    for a, L in arms.items():
        res[start]["mean_curves"][a] = [float(np.nanmean([test_at(l, g) for l in L])) for g in grid]
    res[start]["_logs"] = arms
    s_ = arms["so_rsi"]
    print(f"SO-RSI overhead: {np.mean([l.probes for l in s_]):.1f} probes/run costing {np.mean([l.probe_cost for l in s_]):.0f} of 8000 evals "
          f"({100 * np.mean([l.probe_cost for l in s_]) / 8000:.0f}%)")

out = {k: {b: v for b, v in d.items() if b not in ("_logs",)} for k, d in res.items()}
save("lab_10_06.json", out)
import pickle
pickle.dump({k: {a: [dict(anom=dict(l.anomalies), probes=l.probes, probe_cost=l.probe_cost, memory=l.memory,
                          trace=l.trace, final_test=l.final_test, curve=l.curve, final_src=l.final_src)
                     for l in L] for a, L in d["_logs"].items()} for k, d in res.items()},
            open(os.path.join(os.path.dirname(FIG), "so_rsi_logs.pkl"), "wb"))
if plt:
    fig, axs = plt.subplots(1, 2, figsize=(11, 4), sharey=True)
    grid = np.arange(100, 8001, 100)
    for ax, start in zip(axs, ["planted", "clean"]):
        for a, c in [("naive", "#999"), ("naive+blind", "#c83"), ("so_rsi", "#2a7")]:
            ax.plot(grid, res[start]["mean_curves"][a], label=a, color=c, lw=2)
        ax.set_title(f"{start} start (mean of 30 seeds)"); ax.set_xlabel("evaluation budget spent"); ax.grid(alpha=.3)
    axs[0].set_ylabel("held-out accuracy"); axs[0].legend()
    fig.tight_layout(); fig.savefig(os.path.join(FIG, "lab_10_06_so_rsi.png"), dpi=130)
    print("figure -> results/figures/lab_10_06_so_rsi.png")
