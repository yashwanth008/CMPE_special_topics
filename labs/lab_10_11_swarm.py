"""Lab 10.11 - Swarm evolution (SwarmRSI style): mutation + complementary recombination.

Course task: 5-agent swarm on a toy optimisation task.  Ours: each agent is a genome = ordered list of
patches; fitness = steering accuracy of the parser it builds (every evaluation is charged).
  mutation       feedback-guided: add a patch for a category this agent currently fails (75%) or drop one
  recombination  import patches from the peer that is best on the categories this agent fails
Arms (equal budget): swarm (both), mutation_only, random (append a random patch).
Diversity = mean pairwise Jaccard distance between genomes - MEASURED, since the paper's
'diverse swarm' claim is exactly what recombination might erode.
NOTE: mechanism per the course summary of arXiv:2610.20431; heavily simplified.
"""
from _common import *  # noqa
from rsi_lab.methods.coordination import run_swarm

out = {}
banner("10.11 swarm vs mutation-only vs random search (30 fresh seeds)")
print(f"{'budget':>7s} {'swarm':>8s} {'mut-only':>9s} {'random':>8s}  swarm-mut_only [95% CI]                 swarm-random [95% CI]                final diversity (swarm / mut-only)")
for B in (3000, 6000):
    R = {m: [run_swarm(s, m, B) for s in FINAL_SEEDS] for m in ("swarm", "mutation_only", "random")}
    t = {m: [r["test"] for r in v] for m, v in R.items()}
    div = {m: float(np.mean([r["diversity"][-1] for r in R[m]])) for m in ("swarm", "mutation_only")}
    out[B] = dict(test={m: mean_sem(v) for m, v in t.items()}, diversity_final=div,
                  div_curve={m: [float(np.nanmean([r["diversity"][g] if g < len(r["diversity"]) else r["diversity"][-1] for r in R[m]])) for g in range(8)] for m in ("swarm", "mutation_only")},
                  gens=float(np.mean([r["generations"] for r in R["swarm"]])))
    print(f"{B:7d} {np.mean(t['swarm']):8.3f} {np.mean(t['mutation_only']):9.3f} {np.mean(t['random']):8.3f}  "
          f"{fmt_ci(t['swarm'], t['mutation_only']):38s} {fmt_ci(t['swarm'], t['random']):38s} {div['swarm']:.2f} / {div['mutation_only']:.2f}")
print("\ndiversity by generation (budget 6000):")
for m in ("swarm", "mutation_only"):
    print(f"   {m:14s}", " ".join(f"{v:.2f}" for v in out[6000]["div_curve"][m]))
ex = run_swarm(100, "swarm", 6000)
print("\nbest genome found on seed 100:", ex["genome"], f"-> steering {ex['steer']:.3f}, held-out {ex['test']:.3f}")
save("lab_10_11.json", out)
