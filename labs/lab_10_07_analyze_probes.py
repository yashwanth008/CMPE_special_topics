"""Lab 10.07 - The three anomaly types and their probes, measured.

Course task: count how often each anomaly type triggers, record the diagnostic recommendation, and
explain why it addresses the root cause.  We add: which anomaly types lead to PRODUCTIVE probes
(a probe that names a blocker whose removal is later ACCEPTED), and what the probes cost.
"""
from _common import *  # noqa
import warnings; warnings.filterwarnings("ignore", category=RuntimeWarning)
from collections import Counter, defaultdict

from rsi_lab.methods.so_rsi import run_rsi

banner("10.07 30 seeds, SO-RSI, planted start, budget 8000")
logs = [run_rsi(s, True, True, 8000) for s in FINAL_SEEDS]
cnt = {k: np.mean([l.anomalies[k] for l in logs]) for k in ("recurrence", "opposing", "mismatch")}
by_trig = defaultdict(lambda: Counter())
for l in logs:
    for inv in l.memory:
        by_trig[inv["trigger"]]["probes"] += 1
        by_trig[inv["trigger"]]["blocker_found"] += inv["blocker"] is not None
        by_trig[inv["trigger"]]["resolved"] += inv["status"] == "resolved"
msgs = {"recurrence": "same category / same edit failing repeatedly -> look for the constraint that makes it fail",
        "opposing": "an edit reverses a recently accepted one -> look for conflicting requirements between edits",
        "mismatch": "edit accepted but its target did not improve -> the model of how the edit acts is wrong"}
why = {"recurrence": "stops thrashing: converts 'try another patch' into 'ask what blocks every patch'",
       "opposing": "oscillation means two edits fight; the probe tests whether a third stage causes the fight",
       "mismatch": "expectation violated while the loop believes it progressed (ties are accepted) - hidden failure made visible"}
print(f"{'anomaly':11s} {'count/run':>9s} {'probes':>7s} {'blocker found':>14s} {'later resolved':>15s}   typical meaning")
rows = {}
for k in ("recurrence", "opposing", "mismatch"):
    b = by_trig[k]
    rows[k] = dict(per_run=float(cnt[k]), probes=int(b["probes"]), found=int(b["blocker_found"]), resolved=int(b["resolved"]))
    print(f"{k:11s} {cnt[k]:9.1f} {b['probes']:7d} {b['blocker_found']:14d} {b['resolved']:15d}   {msgs[k][:60]}")
print("LIMITATION: 'opposing' fires (%.1f/run) but never launched a probe - the triggering edit is a removal and our counterfactual probe needs an additive edit to test. It is logged, not acted on." % cnt["opposing"])
print("\nwhy each probe addresses a ROOT cause:")
for k in why:
    print(f"  {k:11s} {why[k]}")
inv = [i for l in logs for i in l.memory]
named = Counter(i["blocker"] for i in inv if i["blocker"])
print("\nblockers named across 30 runs:", dict(named.most_common()))
print("status of investigations:", dict(Counter(i["status"] for i in inv)))
planted_named = sum(any(i["blocker"] == "punct_stripper" for i in l.memory) for l in logs)
planted_fixed = sum(any(i["blocker"] == "punct_stripper" and i["status"] == "resolved" for i in l.memory) for l in logs)
print(f"runs where the PLANTED blocker was named: {planted_named}/30; named AND its removal accepted: {planted_fixed}/30")
emergent = sum(v for k, v in named.items() if k != "punct_stripper")
print(f"EMERGENT blockers (created by the loop's own buggy variants, not planted): {emergent} investigations named one")
print(f"probe cost: {np.mean([l.probe_cost for l in logs]):.0f} evals/run = {100 * np.mean([l.probe_cost for l in logs]) / 8000:.0f}% of budget; {np.mean([l.probes for l in logs]):.1f} probes/run")
print("probes that came back inconclusive (no stage blocked the edit): %.0f%%" % (100 * np.mean([i['blocker'] is None for i in inv])))
os.makedirs(os.path.join(ROOT, "results"), exist_ok=True)
save("inquiry_memory_seed100.json", logs[0].memory)
save("lab_10_07.json", dict(inconclusive_frac=float(np.mean([i["blocker"] is None for i in inv])), rows=rows, named=dict(named), planted_named=planted_named, planted_fixed=planted_fixed,
                            emergent=emergent, probe_cost=float(np.mean([l.probe_cost for l in logs])),
                            probes_per_run=float(np.mean([l.probes for l in logs]))))
print("persistent inquiry memory of seed 100 -> results/inquiry_memory_seed100.json")
