"""Budget RSI  (arXiv:2610.29121, Darzi, Balija, He) - score edits BEFORE they run.

Paper mechanism (from the abstract / method section) that this file mirrors:
  * Each run fits ONE linear readout on [parent's steering-split solve rate, 8 diff
    coordinates], from 96 calibration edits labelled on a small *fit split*, then
    FREEZES the coefficients.
  * An archive of 4 nodes; per keep-step 8 edits are proposed (spread over the
    archive), the readout ranks them, and ONLY the top-scored child is evaluated on
    the steering split.  24 keep steps.  The search returns the earliest evaluated
    node with the maximal steering score.
  * Baselines at matched evaluation budget: parent-rate-only ablation, random edit
    choice, and Huxley-Goedel-Machine-style Thompson-sampling expansion (which has
    no readout, so it must *evaluate* every child it expands).

Adaptation: scaffold = ingredient-parser source, edits = real source patches,
diff coordinates = real unified-diff counts, fit/steer sizes are 24/80.
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field

import numpy as np

from ..data import World
from ..scaffold import (LIBRARY, base_source, diff_features, evaluate, is_duplicate,
                        random_state, smoke_test)
from ..services import Meter, free_meter

N_CAL, N_CAL_PARENTS, ARCHIVE, KEEP_STEPS, PROPOSE = 96, 12, 4, 24, 8


# ---------------------------------------------------------------- feature maps
def feats_paper(parent_src, child_src, parent_rate, meter=None):
    """[parent steering rate] + 8 diff coordinates (the paper's readout inputs)."""
    return [parent_rate] + diff_features(parent_src, child_src)


def feats_with_canary(parent_src, child_src, parent_rate, meter=None):
    """Lab 10.05 extension: add one cheap *execution* coordinate (4-line smoke test)."""
    return feats_paper(parent_src, child_src, parent_rate) + [smoke_test(child_src, meter)]


def feats_extended(parent_src, child_src, parent_rate, meter=None):
    """Lab 10.05 extension #2: canary + a free 'is this edit a no-op duplicate?' coordinate."""
    return feats_with_canary(parent_src, child_src, parent_rate, meter) + [is_duplicate(parent_src, child_src)]


def feats_four(parent_src, child_src, parent_rate, meter=None):
    """Lab 10.04 question: what if only 4 diff coordinates are used?"""
    return feats_paper(parent_src, child_src, parent_rate)[:5]


# ------------------------------------------------------------------ readout fit
@dataclass
class Readout:
    w: np.ndarray
    feat_fn: callable
    names: list = field(default_factory=list)

    def score(self, x) -> float:
        return float(self.w[0] + np.dot(self.w[1:], x))


def calibrate(world: World, rng: random.Random, meter: Meter, feat_fn=feats_paper,
              n_cal=N_CAL, n_parents=N_CAL_PARENTS, buggy=False, ridge=1e-2):
    """Label n_cal random (parent, edit) pairs on the fit split and fit the linear readout."""
    parents = []
    for _ in range(n_parents):
        src = random_state(rng, buggy, rng.randint(0, 4))
        parents.append((src, evaluate(src, world.steer, meter, "calib_parent_steer").score))
    names = list(LIBRARY)
    X, y = [], []
    for _ in range(n_cal):
        psrc, prate = rng.choice(parents)
        child = LIBRARY[rng.choice(names)].apply(psrc)
        X.append(feat_fn(psrc, child, prate, meter))
        y.append(evaluate(child, world.fit, meter, "calib_label_fit").score)
    X, y = np.array(X, float), np.array(y, float)
    Z = np.hstack([np.ones((len(X), 1)), X])
    reg = ridge * np.eye(Z.shape[1]); reg[0, 0] = 0.0
    w = np.linalg.solve(Z.T @ Z + reg, Z.T @ y)
    return Readout(w, feat_fn), X, y


# ----------------------------------------------------------------------- search
@dataclass
class Node:
    src: str
    steer: float
    born: int


def _insert(archive: list[Node], node: Node):
    if len(archive) < ARCHIVE:
        archive.append(node)
        return
    worst = min(range(len(archive)), key=lambda i: (archive[i].steer, -archive[i].born))
    if node.steer >= archive[worst].steer:
        archive[worst] = node


def _best(nodes: list[Node]) -> Node:
    m = max(n.steer for n in nodes)
    return next(n for n in sorted(nodes, key=lambda n: n.born) if n.steer == m)


def search(world: World, rng: random.Random, strategy: str, meter: Meter,
           readout: Readout | None = None, buggy=False, steps=KEEP_STEPS):
    """strategy: readout | parent_rate | random | oracle   (archive search, 8 proposals/step)"""
    base = base_source(buggy)
    archive = [Node(base, evaluate(base, world.steer, meter, "search_steer").score, 0)]
    allnodes = list(archive)
    names = list(LIBRARY)
    for step in range(1, steps + 1):
        proposals = []
        for i in range(PROPOSE):
            parent = archive[i % len(archive)]
            e = LIBRARY[rng.choice(names)]
            child = e.apply(parent.src)
            proposals.append((parent, e, child))
        if strategy == "readout":
            sc = [readout.score(readout.feat_fn(p.src, c, p.steer, meter)) for p, e, c in proposals]
        elif strategy == "parent_rate":
            sc = [p.steer + 1e-6 * rng.random() for p, e, c in proposals]
        elif strategy == "random":
            sc = [rng.random() for _ in proposals]
        elif strategy == "oracle":      # evaluates every proposal: the cost Budget RSI avoids
            sc = [evaluate(c, world.steer, meter, "search_steer").score for p, e, c in proposals]
        else:
            raise ValueError(strategy)
        top = int(np.argmax(sc))
        p, e, child = proposals[top]
        node = Node(child, evaluate(child, world.steer, meter, "search_steer").score, step)
        allnodes.append(node)
        _insert(archive, node)
    return _best(allnodes)


def hgm_search(world: World, rng: random.Random, meter: Meter, budget: float, buggy=False):
    """Huxley-Goedel-style: Thompson-sample a parent on its steering counts, expand ONE
    proposed child (must be evaluated).  Runs until `budget` evaluations are spent."""
    base = base_source(buggy)
    n = len(world.steer)
    archive = [Node(base, evaluate(base, world.steer, meter, "search_steer").score, 0)]
    allnodes = list(archive)
    names, born = list(LIBRARY), 0
    while meter.can_afford(n) and meter.spent + n <= budget:
        draws = [rng.betavariate(a.steer * n + 1, (1 - a.steer) * n + 1) for a in archive]
        parent = archive[int(np.argmax(draws))]
        child = LIBRARY[rng.choice(names)].apply(parent.src)
        born += 1
        node = Node(child, evaluate(child, world.steer, meter, "search_steer").score, born)
        allnodes.append(node)
        _insert(archive, node)
    return _best(allnodes)


def run_all_methods(seed: int, feat_fn=feats_paper, n_cal=N_CAL, buggy=False) -> dict:
    """One seed, every method, same world.  Returns held-out score + cost per method."""
    from ..data import make_world
    world = make_world(seed)
    out = {}

    def held(node):
        return evaluate(node.src, world.test, free_meter()).score

    m = Meter(); rng = random.Random(seed * 31 + 1)
    ro, X, y = calibrate(world, rng, m, feat_fn, n_cal, buggy=buggy)
    cal_cost = m.spent
    node = search(world, rng, "readout", m, ro, buggy)
    out["readout"] = dict(test=held(node), steer=node.steer, cost=m.spent, cal_cost=cal_cost, by_label=dict(m.by_label))
    matched_budget = m.spent

    m = Meter(); rng = random.Random(seed * 31 + 2)
    ro2, _, _ = calibrate(world, rng, m, feats_paper, n_cal, buggy=buggy)  # pays the same calibration
    node = search(world, rng, "parent_rate", m, None, buggy)
    out["parent_rate"] = dict(test=held(node), steer=node.steer, cost=m.spent, by_label=dict(m.by_label))

    m = Meter(); rng = random.Random(seed * 31 + 3)
    node = search(world, rng, "random", m, None, buggy)
    out["random"] = dict(test=held(node), steer=node.steer, cost=m.spent, by_label=dict(m.by_label))

    m = Meter(); rng = random.Random(seed * 31 + 4)
    node = hgm_search(world, rng, m, matched_budget, buggy)
    out["hgm_matched"] = dict(test=held(node), steer=node.steer, cost=m.spent, by_label=dict(m.by_label))

    m = Meter(); rng = random.Random(seed * 31 + 5)
    node = search(world, rng, "oracle", m, None, buggy)
    out["oracle"] = dict(test=held(node), steer=node.steer, cost=m.spent, by_label=dict(m.by_label))
    # --- amortized variant: readout calibrated ONCE on a different world, then reused.
    # Tests the "frozen readout transfers" assumption and removes per-run calibration cost.
    m_cal = Meter(); rng = random.Random(seed * 31 + 6)
    ro_t, _, _ = calibrate(make_world(seed + 1000), rng, m_cal, feat_fn, n_cal, buggy=buggy)
    m = Meter()
    node = search(world, rng, "readout", m, ro_t, buggy)
    out["readout_amortized"] = dict(test=held(node), steer=node.steer, cost=m.spent, by_label=dict(m.by_label))
    search_only = m.spent
    m = Meter(); rng = random.Random(seed * 31 + 7)
    node = hgm_search(world, rng, m, search_only, buggy)
    out["hgm_search_budget"] = dict(test=held(node), steer=node.steer, cost=m.spent, by_label=dict(m.by_label))
    out["_readout"] = dict(w=ro.w.tolist())
    return out


def within_parent_precision(seed: int, feat_fn=feats_paper, n_trials=60, n_cal=N_CAL) -> dict:
    """Mechanism check independent of budgets: among 8 proposals for the SAME parent, how
    often does the top-scored one actually beat the parent on the steering split, vs a
    random pick?  (Spearman within parent is also returned.)"""
    from scipy.stats import spearmanr
    from ..data import make_world
    world = make_world(seed); rng = random.Random(seed * 17 + 3)
    ro, _, _ = calibrate(world, rng, Meter(), feat_fn, n_cal)
    names = list(LIBRARY)
    hit_top = hit_rand = 0
    rhos = []
    for _ in range(n_trials):
        parent = random_state(rng, False, rng.randint(0, 4))
        pr = evaluate(parent, world.steer).score
        props = [LIBRARY[rng.choice(names)].apply(parent) for _ in range(PROPOSE)]
        sc = [ro.score(feat_fn(parent, c, pr)) for c in props]
        true = [evaluate(c, world.steer).score for c in props]
        hit_top += true[int(np.argmax(sc))] > pr
        hit_rand += true[rng.randrange(PROPOSE)] > pr
        if len(set(true)) > 1 and len(set(sc)) > 1:
            rhos.append(spearmanr(sc, true)[0])
    return dict(top=hit_top / n_trials, rand=hit_rand / n_trials, rho=float(np.mean(rhos)) if rhos else float("nan"))
