"""SO-RSI  (arXiv:2610.05701, Jiang, Vempaty, Jagmohan) - investigate WHY before patching.

Paper mechanism mirrored here (abstract/method):
  * First-order ("Naive") RSI patches symptoms and can thrash.
  * SO-RSI passively monitors the improvement trace for three structural anomalies
    - recurrence, opposing edits, expectation mismatch - and, when one fires, runs a
    lightweight EXECUTABLE diagnostic probe, stores the result in a persistent
    INQUIRY MEMORY, and uses it to choose a structural intervention.
  * Compared at matched search budget; probe cost counts against the budget.

Our probe is a *causal counterfactual test*: "would the edit that keeps failing work if
stage S were absent?"  For every tagged stage S in the current source we build
remove(S)+edit, run it on the stuck category's steering instances, and compare with
edit alone.  A positive gain is causal evidence that S blocks the edit.

Honest caveats: the diagnosis here is automated by a hand-written probe (the paper's
probes are agent-written); the proposer is a stochastic stub for an LLM; the base
scaffold contains a PLANTED blocker (`punct_stripper`) so that a structural cause
exists.  The `buggy=False` control removes the planted blocker.
"""
from __future__ import annotations

import random
from collections import Counter, defaultdict
from dataclasses import dataclass, field

from ..data import CATS, make_world
from ..scaffold import (LIBRARY, Edit, base_source, compound, evaluate, remove_edit, tags_in)
from ..services import Meter, free_meter


@dataclass
class Attempt:
    step: int
    edit: Edit
    accepted: bool
    d_score: float
    d_cat: float | None
    forced: bool = False


# ------------------------------------------------------------------ first-order agent
class FirstOrderAgent:
    """Symptom-first proposer: pick the category with the most failures, try a patch for it."""

    def __init__(self, rng: random.Random, eps=0.10, p_undo=0.12, p_remove=0.0):
        self.rng, self.eps, self.p_undo, self.p_remove = rng, eps, p_undo, p_remove

    def propose(self, src, last_eval, history) -> Edit:
        r = self.rng
        last_rejected = bool(history) and not history[-1].accepted
        accepted = [a for a in history if a.accepted and a.edit.added_tags]
        if accepted and last_rejected and r.random() < self.p_undo:      # "maybe my last change broke it"
            return remove_edit(sorted(accepted[-1].edit.added_tags)[0])
        if r.random() < self.eps:
            return LIBRARY[r.choice(list(LIBRARY))]
        if self.p_remove and r.random() < self.p_remove:          # BLIND structural move (no diagnosis)
            tags = tags_in(src)
            if tags:
                return remove_edit(r.choice(tags))
        fails = Counter(i.cat for i in last_eval.failures)
        if not fails:
            return LIBRARY[r.choice(list(LIBRARY))]
        cats, wts = zip(*fails.items())
        cat = r.choices(cats, weights=wts)[0]
        cands = [e for e in LIBRARY.values() if e.target == cat]
        if not cands:                       # no known fix for this symptom: guess
            return LIBRARY[r.choice(list(LIBRARY))]
        present = set(tags_in(src))
        fresh = [e for e in cands if e.name not in present]
        return r.choice(fresh or cands)


# --------------------------------------------------------------------- SO machinery
@dataclass
class Investigation:
    cat: str
    edit: str
    blocker: str | None
    gain: float
    step: int
    status: str            # supported | inconclusive | resolved | refuted
    trigger: str = ""       # which anomaly type fired the probe


@dataclass
class InquiryMemory:
    items: list = field(default_factory=list)

    def recent(self, cat, step, cooldown=10):
        return any(i.cat == cat and step - i.step < cooldown for i in self.items)


class AnomalyDetector:
    """Three structural anomaly detectors over the attempt trace (definitions in docs/10.06)."""

    def __init__(self):
        self.noprogress = defaultdict(int)

    def observe(self, hist: list[Attempt]) -> list[tuple[str, str]]:
        a = hist[-1]
        out = []
        c = a.edit.target
        if c is not None:
            self.noprogress[c] = 0 if (a.d_cat or 0) > 0 else self.noprogress[c] + 1
            if self.noprogress[c] >= 3:
                out.append(("recurrence", f"{self.noprogress[c]} consecutive attempts on '{c}' with no gain"))
        prior_fail = [h for h in hist[:-1] if h.edit.name == a.edit.name and h.d_score <= 0]
        if prior_fail:
            out.append(("recurrence", f"edit '{a.edit.name}' repeated after {len(prior_fail)} non-improving try"))
        recent = hist[-9:-1]
        added = set().union(*[h.edit.added_tags for h in recent if h.accepted] or [set()])
        removed = set().union(*[h.edit.removed_tags for h in recent if h.accepted] or [set()])
        if (a.edit.removed_tags & added) or (a.edit.added_tags & removed):
            out.append(("opposing", f"'{a.edit.name}' reverses an edit accepted in the last 8 attempts"))
        if a.accepted and c is not None and (a.d_cat or 0) <= 0:
            out.append(("mismatch", f"edit targeted '{c}' was accepted but '{c}' accuracy did not rise"))
        return out


def causal_probe(src: str, cat: str, edit: Edit, steer, meter: Meter):
    """Counterfactual stage ablation.  Returns (best_blocker, gain, table)."""
    inst = [i for i in steer if i.cat == cat][:12]
    if not inst or edit.ops[0][0] != "add":
        return None, 0.0, {}
    base_acc = evaluate(edit.apply(src), inst, meter, "probe").score
    table = {}
    for t in tags_in(src):
        cf = edit.apply(remove_edit(t).apply(src))
        table[t] = evaluate(cf, inst, meter, "probe").score - base_acc
    best = max(table, key=lambda t: table[t]) if table else None
    if best is None or table[best] <= 0:
        return None, 0.0, table
    return best, table[best], table


# ---------------------------------------------------------------------------- loop
@dataclass
class RunLog:
    curve: list = field(default_factory=list)       # (spent, steer, test) after each attempt
    anomalies: Counter = field(default_factory=Counter)
    probes: int = 0
    probe_cost: float = 0.0
    memory: list = field(default_factory=list)
    attempts: int = 0
    trace: list = field(default_factory=list)
    final_test: float = 0.0
    final_src: str = ""


def run_rsi(seed: int, second_order: bool, buggy: bool = True, budget: float = 8000,
            verbose: bool = False, blind_remove: float = 0.0) -> RunLog:
    world = make_world(seed)
    meter = Meter(budget)
    agent = FirstOrderAgent(random.Random(seed * 101 + 7), p_remove=blind_remove)
    det, mem, log = AnomalyDetector(), InquiryMemory(), RunLog()
    src = base_source(buggy)
    cur = evaluate(src, world.steer, meter, "steer")
    hist: list[Attempt] = []
    plan: Edit | None = None
    step = 0
    n = len(world.steer)
    while meter.can_afford(n):
        step += 1
        forced = plan is not None
        edit = plan if forced else agent.propose(src, cur, hist)
        plan = None
        child = edit.apply(src)
        res = evaluate(child, world.steer, meter, "steer")
        accepted = res.score >= cur.score and child != src
        c = edit.target
        d_cat = None
        if c is not None and res.per_cat[c] is not None and cur.per_cat[c] is not None:
            d_cat = res.per_cat[c] - cur.per_cat[c]
        att = Attempt(step, edit, accepted, res.score - cur.score, d_cat, forced)
        hist.append(att)
        if accepted:
            src, cur = child, res
        if second_order:
            for kind, why in det.observe(hist):
                log.anomalies[kind] += 1
                if verbose:
                    print(f"   [step {step}] anomaly:{kind:10s} {why}")
                cat = att.edit.target
                probe_edit = att.edit if att.edit.ops[0][0] == "add" else None
                if cat is None or probe_edit is None or mem.recent(cat, step):
                    continue
                before = meter.spent
                try:
                    blocker, gain, table = causal_probe(src, cat, probe_edit, world.steer, meter)
                except Exception:
                    break
                log.probes += 1
                log.probe_cost += meter.spent - before
                inv = Investigation(cat, probe_edit.name, blocker, gain, step,
                                    "supported" if blocker else "inconclusive", trigger=kind)
                mem.items.append(inv)
                if verbose:
                    print(f"   [step {step}] PROBE '{cat}': blocker={blocker} gain={gain:+.2f}")
                if blocker:
                    plan = compound(remove_edit(blocker, cat), probe_edit)   # structural intervention
                break
        if forced and accepted:
            for inv in mem.items:
                if inv.status == "supported" and inv.blocker in edit.removed_tags:
                    inv.status = "resolved"
        elif forced and not accepted:
            for inv in mem.items:
                if inv.status == "supported" and inv.blocker in edit.removed_tags:
                    inv.status = "refuted"
        test = evaluate(src, world.test, free_meter()).score
        log.curve.append((meter.spent, cur.score, test))
        log.trace.append((step, edit.name, accepted, round(att.d_score, 3), forced))
    log.attempts = step
    log.memory = [vars(i) for i in mem.items]
    log.final_test = evaluate(src, world.test, free_meter()).score
    log.final_src = src
    return log


def test_at(log: RunLog, spent: float) -> float:
    """Held-out score of the incumbent after `spent` evaluations (step function)."""
    v = None
    for s, _, t in log.curve:
        if s <= spent:
            v = t
        else:
            break
    return v if v is not None else float("nan")
