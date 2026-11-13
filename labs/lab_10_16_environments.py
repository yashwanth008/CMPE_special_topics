"""Lab 10.16 - Environments: RSIGym's 'Everything as a Service' idea, and when each environment fits.

Part A (executable): every capability our RSI loops use is a SERVICE charged to ONE shared Meter
        (rsi_lab/services.py).  We print the budget BY SERVICE for each method - the budget-control
        idea of RSIGym, and the reason all comparisons in this repo are matched by construction.
Part B (reading): comparison of RSIGym / Terminal-RSI / R2Orch / our testbed.  Statements about the
        three papers come from the course summaries (arXiv IDs 2610.10310, 2610.22192, 2610.22740) and
        were NOT independently verified - treated as claims, not facts.
"""
from _common import *  # noqa
from rsi_lab.methods import budget_rsi as B
from rsi_lab.methods.self_hpo import run as hpo_run
from rsi_lab.methods.so_rsi import run_rsi
from rsi_lab.methods.workflow import run_workflow

banner("10.16 A. budget by SERVICE (instance-evaluations; seed 100)")
runs = {}
r = B.run_all_methods(100)
runs["Budget RSI readout"] = r["readout"]["by_label"]
runs["Budget RSI oracle"] = r["oracle"]["by_label"]
runs["Self-HPO (B=12000)"] = hpo_run(100, "self_hpo", total_budget=12000)["by_label"]
runs["Workflow adaptive (B=6000)"] = run_workflow(100, "adaptive", 6000)["by_label"]
so = run_rsi(100, True, True, 8000)
runs["SO-RSI (B=8000)"] = {"steer (candidate eval)": 8000 - so.probe_cost, "probe (diagnosis)": so.probe_cost}
for name, d in runs.items():
    tot = sum(d.values())
    print(f"\n{name}  total={tot:.0f}")
    for k, v in sorted(d.items(), key=lambda kv: -kv[1]):
        print(f"   {k:26s} {v:7.0f}  {100 * v / tot:4.0f}%  " + "#" * int(40 * v / tot))
save("lab_10_16.json", {k: {a: float(b) for a, b in v.items()} for k, v in runs.items()})

banner("10.16 B. which environment when?  (claims = course summaries, unverified)")
rows = [
    ("RSIGym (EaaS)", "training / inference / rollout / eval / sandbox as reusable services, shared budget + permissions, data/harness/joint tracks",
     "you must compare MANY RSI methods fairly on cost; you need budget + permission control", "heavy: needs real services; overkill for a single toy loop"),
    ("Terminal-RSI", "terminal-agent infrastructure with RL (actor/critic phases)",
     "the object improved is a terminal agent trained with RL", "needs RL infra; not laptop-reproducible (course marks it analysis-only)"),
    ("R2Orch", "self-play environment: inner loop improves an orchestrator, outer loop improves the improver",
     "the thing improved is a multi-agent orchestrator and you can generate tasks", "task proposer can collapse to easy tasks unless rewarded for diverse outcomes"),
    ("This repo's testbed", "one scaffold (parser source) + exact-match data + a Meter; edits are real diffs, scores come from execution",
     "you want fully reproducible, laptop-scale evidence about SELECTION / DIAGNOSIS / HARNESS ideas", "proposer is a stub; single domain; planted structure; not evidence about LLM agents"),
]
for n, f, w, l in rows:
    print(f"\n{n}\n   feature : {f}\n   choose when: {w}\n   limit   : {l}")
