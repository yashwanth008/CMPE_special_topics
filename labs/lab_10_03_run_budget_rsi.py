"""Lab 10.03 - Run Budget RSI end to end on the ingredient-parser task.

WHAT YOU WILL SEE
  1. one calibration + search walk-through for seed 100 (so the mechanism is visible)
  2. five methods over 30 fresh seeds, at the SAME evaluation accounting:
       readout        Budget RSI: pay for calibration, then score 8 proposals/step for free
       parent_rate    ablation: rank proposals by the parent's steering rate only
       random         24 expansions, random proposal each step (no calibration cost)
       hgm_matched    Huxley-Goedel-style Thompson sampling, budget-matched to `readout`
       oracle         evaluates ALL 8 proposals each step (what scoring tries to avoid)
  3. paired 95% bootstrap CIs of readout minus each baseline (held-out test split)
"""
from _common import *  # noqa
import random

from rsi_lab.data import make_world
from rsi_lab.methods import budget_rsi as B
from rsi_lab.scaffold import FEATURE_NAMES, LIBRARY, base_source, diff_features, tags_in
from rsi_lab.services import Meter

banner("10.03 Budget RSI - walk-through (seed 100)")
world = make_world(100)
rng = random.Random(1)
meter = Meter()
print(f"splits: fit={len(world.fit)}  steering={len(world.steer)}  pool={len(world.pool)}  HELD-OUT test={len(world.test)}")
ro, X, y = B.calibrate(world, rng, meter)
print(f"calibration: {len(y)} labelled (parent, edit) pairs, cost {meter.spent:.0f} instance-evals "
      f"({dict((k, round(v)) for k, v in meter.by_label.items())})")
print("frozen linear readout  w0 + w.[parent_rate, 8 diff coords]:")
print("   intercept %+.3f" % ro.w[0])
for n, w in zip(["parent_steer_rate"] + FEATURE_NAMES, ro.w[1:]):
    print(f"   {n:24s} {w:+.3f}")
src = base_source(False)
print("\nscore of three proposals from the base scaffold (no execution of the child needed):")
for name in ["frac_pattern", "digits_stripper", "collapse_spaces"]:
    child = LIBRARY[name].apply(src)
    x = B.feats_paper(src, child, 0.30)
    print(f"   {name:18s} diff={[int(v) if v == int(v) else round(v, 2) for v in x[1:]]}  predicted fit-score {ro.score(x):.3f}")

banner("10.03 Budget RSI - 30 fresh seeds (100..129)")
runs = [B.run_all_methods(s) for s in FINAL_SEEDS]
order = ["readout", "parent_rate", "random", "hgm_matched", "oracle", "readout_amortized", "hgm_search_budget"]
labels = {"readout": "Budget RSI readout (pays calibration)", "parent_rate": "parent-rate ablation",
          "random": "random edit (24 expansions)", "hgm_matched": "HGM-style, budget-matched",
          "oracle": "oracle: evaluate all 8/step", "readout_amortized": "readout calibrated ONCE on other world",
          "hgm_search_budget": "HGM-style @ search-only budget"}
print(f"{'method':44s} {'held-out':>9s} {'±sem':>6s} {'steer':>6s} {'cost':>7s}")
res = {}
for k in order:
    t = [r[k]["test"] for r in runs]; s = [r[k]["steer"] for r in runs]; c = np.mean([r[k]["cost"] for r in runs])
    m, e = mean_sem(t)
    res[k] = dict(test_mean=m, test_sem=e, steer_mean=float(np.mean(s)), cost=float(c), tests=t)
    print(f"{labels[k]:44s} {m:9.3f} {e:6.3f} {np.mean(s):6.3f} {c:7.0f}")
print("\nPaired differences on held-out accuracy (readout minus X), mean [95% CI] over 30 seeds:")
base = res["readout"]["tests"]
for k in ["parent_rate", "random", "hgm_matched", "oracle"]:
    print(f"   vs {labels[k]:38s} {fmt_ci(base, res[k]['tests'])}")
print("   amortized readout vs HGM @ same search-only budget: " + fmt_ci(res["readout_amortized"]["tests"], res["hgm_search_budget"]["tests"]))
cal = np.mean([r["readout"]["cal_cost"] for r in runs])
print(f"\ncalibration is {100 * cal / res['readout']['cost']:.0f}% of the readout method's total cost ({cal:.0f} of {res['readout']['cost']:.0f})")
print("steering-vs-held-out gap (selection optimism):  " +
      ", ".join(f"{k}: {res[k]['steer_mean'] - res[k]['test_mean']:+.3f}" for k in ["readout", "hgm_matched", "oracle"]))
save("lab_10_03.json", dict(res=res, calibration_cost=float(cal), seeds=FINAL_SEEDS,
                            w=runs[0]["_readout"]["w"], by_label={k: runs[0][k]["by_label"] for k in order}))

if plt:
    fig, ax = plt.subplots(1, 2, figsize=(11, 4))
    ks = ["random", "parent_rate", "readout", "hgm_matched", "oracle"]
    ax[0].bar([labels[k].split(" (")[0][:22] for k in ks], [res[k]["test_mean"] for k in ks],
              yerr=[1.96 * res[k]["test_sem"] for k in ks], color=["#999", "#8aa", "#2a7", "#c83", "#555"])
    ax[0].set_ylabel("held-out accuracy"); ax[0].set_title("Budget RSI vs baselines (30 seeds, 95% CI)")
    ax[0].tick_params(axis="x", rotation=25)
    for k in ks:
        ax[1].scatter(res[k]["cost"], res[k]["test_mean"], s=70)
        ax[1].annotate(k, (res[k]["cost"], res[k]["test_mean"]), fontsize=8)
    ax[1].set_xlabel("instance evaluations spent"); ax[1].set_ylabel("held-out accuracy"); ax[1].set_title("accuracy vs cost")
    fig.tight_layout(); fig.savefig(os.path.join(FIG, "lab_10_03_budget_rsi.png"), dpi=130)
    print("figure -> results/figures/lab_10_03_budget_rsi.png")
