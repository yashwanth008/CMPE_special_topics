"""RSIFlow-style adaptive workflow orchestration (lab 10.13).

RSIFlow (arXiv:2610.21791, per the course summary) adapts the self-improvement workflow to the
*current* performance bottleneck, with an evolving meta-agent orchestrating it.  Our miniature:

  workflow stages  : propose -> [dedup] -> [guard] -> evaluate -> accept -> [diagnose]
  meta-agent       : every WINDOW cycles it PROFILES where the evaluation budget was wasted and
                     switches on the stage that targets the measured bottleneck:
        duplicate edits evaluated      -> enable `dedup`   (free text check, skips no-ops)
        harmful edits evaluated        -> enable `guard`   (4-line smoke canary before evaluating)
        no progress for a whole window -> enable `diagnose` (SO-RSI causal probe)
  arms compared at equal budget: static (no optional stages), all_on (every stage always on),
  adaptive (meta-agent).  The routing log shows the bottleneck *changing* over the run.
"""
from __future__ import annotations

import random

from ..data import make_world
from ..scaffold import base_source, compound, evaluate, is_duplicate, remove_edit, smoke_test
from ..services import BudgetExceeded, Meter, free_meter
from .so_rsi import Attempt, AnomalyDetector, FirstOrderAgent, causal_probe

WINDOW = 8


def run_workflow(seed: int, mode: str, budget: float = 8000, buggy: bool = True) -> dict:
    assert mode in ("static", "all_on", "adaptive")
    world = make_world(seed)
    meter = Meter(budget)
    agent = FirstOrderAgent(random.Random(seed * 101 + 7))
    det = AnomalyDetector()
    on = dict(dedup=mode == "all_on", guard=mode == "all_on", diagnose=mode == "all_on")
    src = base_source(buggy)
    cur = evaluate(src, world.steer, meter, "steer")
    hist: list[Attempt] = []
    win = dict(dup=0, harm=0, gain=0, n=0)
    routing, plan, wasted = [], None, dict(dup=0.0, harmful=0.0)
    cycles = skipped = 0
    n = len(world.steer)
    try:
        while meter.can_afford(n) and cycles < 4000:
            cycles += 1
            edit = plan or agent.propose(src, cur, hist)
            forced, plan = plan is not None, None
            child = edit.apply(src)
            if on["dedup"] and is_duplicate(src, child):
                skipped += 1
                continue
            if on["guard"] and smoke_test(child, meter) < smoke_test(src, meter):
                skipped += 1
                continue
            res = evaluate(child, world.steer, meter, "steer")
            d = res.score - cur.score
            accepted = res.score >= cur.score and child != src
            dup = is_duplicate(src, child) > 0
            if dup:
                wasted["dup"] += n
            elif d < 0:
                wasted["harmful"] += n
            c = edit.target
            d_cat = None
            if c and res.per_cat[c] is not None and cur.per_cat[c] is not None:
                d_cat = res.per_cat[c] - cur.per_cat[c]
            att = Attempt(len(hist) + 1, edit, accepted, d, d_cat, forced)
            hist.append(att)
            if accepted:
                src, cur = child, res
            win["n"] += 1; win["dup"] += dup; win["harm"] += (d < 0); win["gain"] += (d > 0)
            if on["diagnose"]:
                for kind, _ in det.observe(hist):
                    cat = att.edit.target
                    if cat and att.edit.ops[0][0] == "add":
                        blk, gain, _t = causal_probe(src, cat, att.edit, world.steer, meter)
                        if blk:
                            plan = compound(remove_edit(blk, cat), att.edit)
                        break
            if mode == "adaptive" and win["n"] >= WINDOW:
                dup_rate, harm_rate = win["dup"] / win["n"], win["harm"] / win["n"]
                if dup_rate >= 0.2 and not on["dedup"]:
                    on["dedup"] = True; routing.append((cycles, meter.spent, "dedup", f"dup_rate={dup_rate:.2f}"))
                if harm_rate >= 0.15 and not on["guard"]:
                    on["guard"] = True; routing.append((cycles, meter.spent, "guard", f"harmful_rate={harm_rate:.2f}"))
                if win["gain"] == 0 and not on["diagnose"]:
                    on["diagnose"] = True; routing.append((cycles, meter.spent, "diagnose", "no gain in window"))
                win = dict(dup=0, harm=0, gain=0, n=0)
    except BudgetExceeded:
        pass
    return dict(test=evaluate(src, world.test, free_meter()).score, spent=meter.spent, cycles=cycles,
                skipped=skipped, routing=routing, wasted=wasted, stages=on,
                by_label=dict(meter.by_label))
