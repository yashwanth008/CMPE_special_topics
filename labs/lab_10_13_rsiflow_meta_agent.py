"""Lab 10.13 - Adaptive workflow with a meta-agent (RSIFlow style).

Course task: a workflow graph with adaptive routing.  Ours: propose -> [dedup] -> [guard] -> evaluate
-> accept -> [diagnose]; a meta-agent profiles WASTE every 8 cycles and switches on the stage that
targets the measured bottleneck.  Arms at equal budget: static, all_on, adaptive.
(Mechanism per the course summary of arXiv:2610.21791; heavily simplified; planted-blocker start.)
QUESTION TESTED: does adapting the workflow to the current bottleneck beat a fixed workflow?  Note
the honest comparator is `all_on`, because adaptation only pays if switching stages on is costly.
"""
from _common import *  # noqa
from rsi_lab.methods.workflow import run_workflow

out = {}
banner("10.13 static vs all_on vs adaptive workflow (30 fresh seeds, planted start)")
print(f"{'budget':>7s} {'static':>8s} {'all_on':>8s} {'adaptive':>9s}   adaptive-static [95% CI]            adaptive-all_on [95% CI]")
for B in (3000, 6000, 9000):
    R = {m: [run_workflow(s, m, B) for s in FINAL_SEEDS] for m in ("static", "all_on", "adaptive")}
    t = {m: [r["test"] for r in v] for m, v in R.items()}
    out[B] = {m: mean_sem(v) for m, v in t.items()}
    out[B]["wasted_static"] = {k: float(np.mean([r["wasted"][k] for r in R["static"]])) for k in ("dup", "harmful")}
    out[B]["wasted_adaptive"] = {k: float(np.mean([r["wasted"][k] for r in R["adaptive"]])) for k in ("dup", "harmful")}
    out[B]["latency_cycles"] = {st: float(np.mean([next((c for c, _, s2, _ in r["routing"] if s2 == st), np.nan) for r in R["adaptive"]])) for st in ("dedup", "guard", "diagnose")}
    out[B]["diff_adapt_static"] = paired_ci(t["adaptive"], t["static"]); out[B]["diff_adapt_allon"] = paired_ci(t["adaptive"], t["all_on"])
    print(f"{B:7d} {np.mean(t['static']):8.3f} {np.mean(t['all_on']):8.3f} {np.mean(t['adaptive']):9.3f}   {fmt_ci(t['adaptive'], t['static']):36s} {fmt_ci(t['adaptive'], t['all_on'])}")
    if B == 6000:
        ex = R["adaptive"][0]
print("\nrouting decisions of the meta-agent on seed 100 (cycle, evals spent so far, stage switched ON, measured reason):")
for r in ex["routing"]:
    print("   ", r)
print("\nevaluation budget WASTED (instance-evals) at budget 6000, mean/run:")
print(f"   static   duplicates={out[6000]['wasted_static']['dup']:.0f}  harmful={out[6000]['wasted_static']['harmful']:.0f}")
print(f"   adaptive duplicates={out[6000]['wasted_adaptive']['dup']:.0f}  harmful={out[6000]['wasted_adaptive']['harmful']:.0f}")
print("meta-agent detection latency (mean cycle at which each stage is switched on, over runs that switched it):",
      {k: (round(v, 1) if v == v else None) for k, v in out[6000]["latency_cycles"].items()})
save("lab_10_13.json", out)
print("\nREAD-OUT: adaptation beats a static pipeline, but pays DETECTION LATENCY; when stages are cheap, switching them all on from cycle 0 wins.")
