"""Lab 10.14 - Self-HPO: alternate HARNESS (H-step) and POLICY (P-step) optimisation.

Course task: simulate H-step / P-step alternation.  Ours (rsi_lab/methods/self_hpo.py):
   policy  = softmax over the edit library, trained by REINFORCE on reward = gain on the search set
   harness = (smoke-guard on/off) x (search set: all | hard | balanced), chosen in the H-step by
             probing K=3 candidate harnesses on the SAME sampled edits; hard tasks = current failures
Four conditions at EQUAL total evaluation budget (H-step probes, mining and validation are charged):
   none          frozen uniform policy, seed harness           (control)
   policy_only   P-steps only
   harness_only  H-steps only, frozen policy
   self_hpo      alternate both
PAPER CLAIM TESTED, not assumed:  joint gain > sum of the individual gains  (synergy > 0)?
Budget sweep because H-step overhead is a fixed cost: at tiny budgets it can starve the P-step.
"""
from _common import *  # noqa
from collections import Counter
from rsi_lab.methods.self_hpo import run

CONDS = ["none", "policy_only", "harness_only", "self_hpo"]
BUDGETS = (4000, 6000, 9000, 12000, 20000)
out = {}
banner("10.14 Self-HPO vs policy-only vs harness-only (30 fresh seeds, clean start)")
print(f"{'budget':>7s} " + " ".join(f"{c:>13s}" for c in CONDS) + "   episodes(none/pol/har/joint)   H-step share")
for B in BUDGETS:
    R = {c: [run(s, c, total_budget=B) for s in FINAL_SEEDS] for c in CONDS}
    t = {c: np.array([r["test"] for r in R[c]]) for c in CONDS}
    ep = [np.mean([r["episodes"] for r in R[c]]) for c in CONDS]
    hs = np.mean([sum(v for k, v in r["by_label"].items() if k.startswith("hstep")) for r in R["self_hpo"]]) / B
    gain = {c: float((t[c] - t["none"]).mean()) for c in CONDS[1:]}
    syn = t["self_hpo"] - t["policy_only"] - t["harness_only"] + t["none"]
    out[B] = dict(test={c: mean_sem(t[c]) for c in CONDS}, episodes=ep, hstep_share=float(hs), gain=gain,
                  synergy=paired_ci(t["self_hpo"] - t["policy_only"], t["harness_only"] - t["none"]),
                  joint_vs_none=paired_ci(t["self_hpo"], t["none"]), joint_vs_policy=paired_ci(t["self_hpo"], t["policy_only"]),
                  harness_picks=dict(Counter(str(h) for r in R["self_hpo"] for h in r["harness"]).most_common(6)),
                  round_curve=[float(np.mean([r["round_test"][i] if i < len(r["round_test"]) else r["round_test"][-1] for r in R["self_hpo"]])) for i in range(4)])
    print(f"{B:7d} " + " ".join(f"{t[c].mean():13.3f}" for c in CONDS) + "   " + "/".join(f"{e:.0f}" for e in ep) + f"   {100 * hs:.0f}%")
banner("10.14 paper's synergy claim:  (joint - policy_only) - (harness_only - none)  [95% CI]; >0 means super-additive")
for B in BUDGETS:
    m, lo, hi = out[B]["synergy"]
    kind = "super-additive" if lo > 0 else ("sub-additive" if hi < 0 else "not distinguishable from additive")
    jn, jp = out[B]["joint_vs_none"], out[B]["joint_vs_policy"]
    print(f"budget {B:6d}: synergy {m:+.3f} [{lo:+.3f}, {hi:+.3f}] -> {kind:34s} | joint-none {jn[0]:+.3f} [{jn[1]:+.3f},{jn[2]:+.3f}] | joint-policy_only {jp[0]:+.3f} [{jp[1]:+.3f},{jp[2]:+.3f}]")
print("\nharness the H-step chose most often at budget 12000:", out[12000]["harness_picks"])
one = run(100, "self_hpo", total_budget=12000)
print("seed 100 round-by-round held-out:", [round(x, 3) for x in one["round_test"]], "| harness per round:", one["harness"], "| hard-set size per round:", one["hard_sizes"])
print("policy's top-3 preferred edits after training (seed 100):", one["theta_top"])
print("budget by service (seed 100):", {k: round(v) for k, v in one["by_label"].items()})
save("lab_10_14.json", out)
if plt:
    fig, ax = plt.subplots(figsize=(6.5, 4))
    for c, col in zip(CONDS, ["#999", "#8aa", "#c83", "#2a7"]):
        ax.errorbar(BUDGETS, [out[B]["test"][c][0] for B in BUDGETS], yerr=[1.96 * out[B]["test"][c][1] for B in BUDGETS], label=c, color=col, marker="o", capsize=3)
    ax.set_xscale("log"); ax.set_xlabel("total evaluation budget"); ax.set_ylabel("held-out accuracy"); ax.legend(); ax.grid(alpha=.3)
    ax.set_title("Self-HPO vs ablations (30 seeds, 95% CI)")
    fig.tight_layout(); fig.savefig(os.path.join(FIG, "lab_10_14_self_hpo.png"), dpi=130)
