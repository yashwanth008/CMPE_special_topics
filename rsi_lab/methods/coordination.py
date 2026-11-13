"""Scaling / coordination mechanisms (labs 10.10, 10.11) on the same ingredient-parser testbed.

AReaL-RSI  (arXiv:2610.18083 per course summary)  - persistent research team:
    leader picks a research ORIENTATION, researcher agents investigate, a CONDITIONAL
    MEMORY separates *supported*, *refuted* and *unresolved* findings and is shared.
    Tested question: does sharing conditional memory beat independent exploration at
    equal evaluation budget?

SwarmRSI   (arXiv:2610.20431 per course summary)  - evolving swarm:
    feedback-guided MUTATION (add a patch for the agent's current failure; drop a patch)
    and complementary RECOMBINATION (import patches from a peer that fix categories this
    agent fails).  Tested question: does recombination add anything over mutation alone,
    and over random search at equal budget?  Diversity is measured, not assumed.

NOTE: for these two papers we only have the course repo's summaries (not the papers); the
mechanisms below are *our reading of those summaries*, simplified.  See docs/paper_audits.
"""
from __future__ import annotations

import itertools
import random
from collections import Counter

from ..data import CATS, make_world
from ..scaffold import LIBRARY, base_source, evaluate, tags_in
from ..services import BudgetExceeded, Meter, free_meter


# --------------------------------------------------------------------------- AReaL
def run_areal(seed: int, shared: bool, budget: float = 4000, n_researchers: int = 3) -> dict:
    """Leader + researchers.  shared=True: one conditional memory visible to everyone.
    shared=False: each researcher only sees its own findings (independent exploration)."""
    world = make_world(seed)
    rng = random.Random(seed * 53 + 9)
    meter = Meter(budget)
    src = base_source(False)
    cur = evaluate(src, world.steer, meter, "steer")
    fit_cur = evaluate(src, world.fit, meter, "fit").score
    shared_mem: dict = {}
    own_mem = [dict() for _ in range(n_researchers)]
    refuted_anywhere: set = set()                       # audit only: used to count wasted repeats
    log = dict(campaigns=0, repeats=0, unresolved=0, findings=[])
    try:
        while log["campaigns"] < 400:
            spent_before = meter.spent
            fails = Counter(i.cat for i in cur.failures)
            if not fails:
                break
            orient = rng.choices(list(fails), weights=list(fails.values()))[0]       # leader's orientation
            found, claimed = [], set()
            for k in range(n_researchers):
                mem = shared_mem if shared else own_mem[k]
                present = set(tags_in(src))
                ok = lambda e: e.name not in present and mem.get(e.name) != "refuted" and not (shared and e.name in claimed)
                cands = [e for e in LIBRARY.values() if e.target == orient and ok(e)] \
                    or [e for e in LIBRARY.values() if ok(e)]
                if not cands:
                    continue
                e = rng.choice(cands)
                claimed.add(e.name)                      # shared board: others skip what is being tested
                if e.name in refuted_anywhere:
                    log["repeats"] += 1                  # somebody already showed this fails
                child = e.apply(src)
                res = evaluate(child, world.steer, meter, "steer")
                fit = evaluate(child, world.fit, meter, "fit").score
                d_s, d_f = res.score - cur.score, fit - fit_cur
                if d_s > 0 and d_f >= 0:
                    status = "supported"
                elif d_s > 0:
                    status = "unresolved"; log["unresolved"] += 1
                else:
                    status = "refuted"; refuted_anywhere.add(e.name)
                mem[e.name] = status
                found.append((d_s, e, child, res, fit, status))
                log["findings"].append((orient, e.name, status))
            sup = sorted([f for f in found if f[5] == "supported"], key=lambda f: -f[0])
            done = set()
            for j, (_, e, child, res, fit, _) in enumerate(sup):     # leader integrates every distinct supported finding
                if e.name in done:
                    continue
                done.add(e.name)
                if j == 0:
                    src, cur, fit_cur = child, res, fit
                else:                                    # re-test on the NEW incumbent (costs budget)
                    cand = e.apply(src)
                    r2 = evaluate(cand, world.steer, meter, "steer")
                    if r2.score >= cur.score and cand != src:
                        src, cur = cand, r2
                        fit_cur = evaluate(cand, world.fit, meter, "fit").score
            log["campaigns"] += 1
            if meter.spent == spent_before:       # nothing left to test: stop (avoid spinning for free)
                break
    except BudgetExceeded:
        pass
    log["test"] = evaluate(src, world.test, free_meter()).score
    log["spent"] = meter.spent
    return log


# --------------------------------------------------------------------------- Swarm
def _build(genome):
    s = base_source(False)
    for name in genome:
        s = LIBRARY[name].apply(s)
    return s


def jaccard_div(genomes):
    sets = [set(g) for g in genomes]
    pairs = list(itertools.combinations(sets, 2))
    return sum(1 - len(a & b) / max(1, len(a | b)) for a, b in pairs) / len(pairs)


def run_swarm(seed: int, mode: str, budget: float = 6000, n_agents: int = 5) -> dict:
    """mode: 'swarm' (mutation+recombination) | 'mutation_only' | 'random'"""
    world = make_world(seed)
    rng = random.Random(seed * 71 + 1)
    meter = Meter(budget)
    names = list(LIBRARY)
    fit_cache = {}

    def fitness(genome):
        key = tuple(genome)
        if key not in fit_cache:
            fit_cache[key] = evaluate(_build(genome), world.steer, meter, "steer")
        return fit_cache[key]

    pop = []
    try:
        pop = [[rng.choice(names)] for _ in range(n_agents)]
        for g in pop:
            fitness(g)
        div_curve = [jaccard_div(pop)]
        gen = 0
        while gen < 60:
            gen += 1
            spent_before = meter.spent
            children = []
            for i, g in enumerate(pop):
                res = fitness(g)
                if mode == "random":
                    children.append(g + [rng.choice(names)])
                    continue
                fails = Counter(x.cat for x in res.failures)
                # feedback-guided mutation: patch for an observed failure, or drop a patch
                if rng.random() < 0.75 and fails:
                    cat = rng.choices(list(fails), weights=list(fails.values()))[0]
                    cands = [e.name for e in LIBRARY.values() if e.target == cat and e.name not in g] or names
                    child = g + [rng.choice(cands)]
                elif len(g) > 1:
                    child = list(g); child.pop(rng.randrange(len(g)))
                else:
                    child = g + [rng.choice(names)]
                children.append(child)
                if mode == "swarm":      # complementary recombination with the best-complement peer
                    best_peer, best_cover = None, 0
                    for j, h in enumerate(pop):
                        if j == i:
                            continue
                        hres = fitness(h)
                        cover = sum(1 for c in fails if (hres.per_cat[c] or 0) > (res.per_cat[c] or 0))
                        if cover > best_cover:
                            best_peer, best_cover = h, cover
                    if best_peer is not None:
                        imported = [n for n in best_peer if n not in g
                                    and LIBRARY[n].target in fails][:3]
                        if imported:
                            children.append(g + imported)
            for c in children:
                fitness(c)
            allg = pop + children
            uniq = {tuple(g): g for g in allg}
            ranked = sorted(uniq.values(), key=lambda g: -fitness(g).score)
            pop = [list(g) for g in ranked[:n_agents]]
            div_curve.append(jaccard_div(pop))
            if meter.spent == spent_before:          # converged: nothing new to evaluate
                break
    except BudgetExceeded:
        div_curve = locals().get("div_curve", [])
    best = max(fit_cache, key=lambda g: (fit_cache[g].score, -len(g)))
    return dict(test=evaluate(_build(best), world.test, free_meter()).score,
                steer=fit_cache[best].score, diversity=div_curve, evals=meter.spent,
                genome=list(best), generations=locals().get("gen", 0))
