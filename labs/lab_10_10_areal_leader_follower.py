"""Lab 10.10 - Leader/researcher team with CONDITIONAL MEMORY (AReaL-RSI style).

Course task: implement a small 1-leader / n-researcher simulation on a toy task.  Ours is the
ingredient-parser task, 3 researchers.  Leader = chooses a research orientation (the category
with most failures); researchers = propose + test an edit; ConditionalMemory = findings tagged
supported / refuted / unresolved; the leader integrates the best *supported* finding.

QUESTION TESTED: does sharing the conditional memory beat independent exploration at EQUAL budget?
Metric: held-out accuracy; also 'repeats' = researcher re-tests an edit someone ELSE already refuted.
NOTE: mechanism per the course summary of arXiv:2610.18083 (not the paper itself); heavily simplified.
"""
from _common import *  # noqa
from rsi_lab.methods.coordination import run_areal

BUDGETS = (1500, 2500, 4000)
out = {}
banner("10.10 shared conditional memory vs independent researchers (30 fresh seeds)")
print(f"{'budget':>7s} {'shared':>8s} {'indep':>8s}  difference [95% CI]                       repeats shared/indep  campaigns")
for B in BUDGETS:
    sh = [run_areal(s, True, B) for s in FINAL_SEEDS]
    ind = [run_areal(s, False, B) for s in FINAL_SEEDS]
    a, b = [r["test"] for r in sh], [r["test"] for r in ind]
    out[B] = dict(shared=mean_sem(a), indep=mean_sem(b), repeats=[float(np.mean([r["repeats"] for r in sh])), float(np.mean([r["repeats"] for r in ind]))],
                  diff=paired_ci(a, b), unresolved=float(np.mean([r["unresolved"] for r in sh])))
    print(f"{B:7d} {out[B]['shared'][0]:8.3f} {out[B]['indep'][0]:8.3f}  {fmt_ci(a, b):44s} {out[B]['repeats'][0]:5.1f}/{out[B]['repeats'][1]:<5.1f} {np.mean([r['campaigns'] for r in sh]):7.1f}")
ex = run_areal(100, True, 2500)
print("\nexample shared-memory findings (seed 100): orientation, edit, status")
for f in ex["findings"][:10]:
    print("   ", f)
print(f"\nunresolved findings (steering says better, fit split says worse): {out[2500]['unresolved']:.2f}/run - the memory keeps them OUT of the 'supported' set")
save("lab_10_10.json", out)
