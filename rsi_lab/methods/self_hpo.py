"""Self-HPO  (arXiv:2610.22791, Wei et al.) - alternate HARNESS and POLICY optimisation.

Paper mechanism mirrored here (abstract / Algorithm 1):
  * Each round: H-step - the current policy analyses ITS OWN failures and proposes harness
    candidates; the best becomes the harness.  P-step - the policy is updated by RL under
    that harness.  Tasks that stay hard during training form the next harness search set.
  * Compared with policy-only and harness-only optimisation.

Our miniature:
  policy  = softmax distribution over the edit library (what edit to try next), trained with
            REINFORCE (a real policy-gradient update, not a scripted improvement).
  harness = (guard, search-set mode):
              guard   - run the 4-line smoke canary before spending a full evaluation
              mode    - 'all' pool | 'hard' (instances the incumbent currently fails) | 'balanced'
  H-step  = mine failures on the pool, build K harness candidates (self-proposer = a bandit
            over harness components that is itself updated), score each candidate on the SAME
            sampled edits (common random numbers) by validation-gain per evaluation spent, pick best.
  Budget accounting: probes, hard-set mining and validation all count against the same Meter.

Caveats: policy = softmax bandit not an LLM; harness space has 6 members; the paper's
"joint > sum of parts" claim is TESTED here, not assumed.
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass, field

import numpy as np

from ..data import CATS, make_world
from ..scaffold import LIBRARY, base_source, evaluate, smoke_test, tags_in
from ..services import BudgetExceeded, Meter, free_meter

NAMES = list(LIBRARY)
MODES = ["all", "hard", "balanced"]
HARNESSES = [(g, m) for g in (False, True) for m in MODES]
SEED_HARNESS = (False, "all")
LR, EMA = 4.0, 0.9


@dataclass
class State:
    src: str
    fit: float            # incumbent score on the fit split (regression check)


class Policy:
    def __init__(self, learn: bool):
        self.theta = np.zeros(len(NAMES))
        self.learn = learn
        self.baseline = 0.0

    def probs(self, src):
        present = set(tags_in(src))
        mask = np.array([0.0 if n in present else 1.0 for n in NAMES])
        if mask.sum() == 0:
            mask[:] = 1.0
        z = self.theta - 1e9 * (1 - mask)
        e = np.exp(z - z.max())
        return e / e.sum()

    def sample(self, rng, src):
        p = self.probs(src)
        return int(np_choice(rng, p)), p

    def update(self, a, p, reward):
        if not self.learn:
            return
        adv = reward - self.baseline
        self.baseline = EMA * self.baseline + (1 - EMA) * reward
        g = -p.copy(); g[a] += 1.0
        self.theta += LR * adv * g


def np_choice(rng: random.Random, p):
    r, c = rng.random(), 0.0
    for i, pi in enumerate(p):
        c += pi
        if r <= c:
            return i
    return len(p) - 1


def search_set(world, harness, src, pool_eval, rng):
    _, mode = harness
    if mode == "hard" and pool_eval is not None and pool_eval.failures:
        return list(pool_eval.failures)
    if mode == "balanced":
        by = {}
        for i in world.pool:
            by.setdefault(i.cat, []).append(i)
        r = random.Random(1234)
        return [i for c in CATS for i in r.sample(by.get(c, []), min(4, len(by.get(c, []))))]
    return list(world.pool)


def episode(world, st: State, action: int, harness, sset, meter: Meter, label="train"):
    """Try one edit under a harness.  Returns (reward, new_state_or_same, spent)."""
    guard, _ = harness
    before = meter.spent
    child = LIBRARY[NAMES[action]].apply(st.src)
    if child == st.src:
        return 0.0, st, 0.0
    if guard:
        if smoke_test(child, meter) < smoke_test(st.src, meter):
            return -0.05, st, meter.spent - before          # guard caught a broken edit cheaply
    cur = evaluate(st.src, sset, meter, label)
    new = evaluate(child, sset, meter, label)
    reward = new.score - cur.score
    fit = evaluate(child, world.fit, meter, label).score
    if reward >= 0 and fit >= st.fit:
        st = State(child, fit)
    return reward, st, meter.spent - before


PROBE_CAP = 40


def run(seed: int, condition: str, total_budget: float = 12000, rounds: int = 4,
        K: int = 3, P: int = 3, buggy: bool = False) -> dict:
    assert condition in ("none", "policy_only", "harness_only", "self_hpo")
    world = make_world(seed)
    rng = random.Random(seed * 977 + 5)
    meter = Meter(total_budget)
    policy = Policy(learn=condition in ("policy_only", "self_hpo"))
    use_h = condition in ("harness_only", "self_hpo")
    src = base_source(buggy)
    st = State(src, evaluate(src, world.fit, meter, "init").score)
    h_weight = {h: 1.0 for h in HARNESSES}
    harness = SEED_HARNESS
    log = dict(round_test=[], harness=[], episodes=0, hard_sizes=[])
    per_round = total_budget / rounds
    for r in range(rounds):
      try:
          round_end = meter.spent + per_round if r < rounds - 1 else total_budget
          pool_eval = None
          # ------------------------------------------------ H-step
          if use_h:
              pool_eval = evaluate(st.src, world.pool, meter, "hstep_mine")     # failure analysis
              log["hard_sizes"].append(len(pool_eval.failures))
              cands = list(HARNESSES)
              weights = [h_weight[h] for h in cands]
              chosen = []
              while len(chosen) < K:
                  h = cands[np_choice(rng, [w / sum(weights) for w in weights])]
                  if h not in chosen:
                      chosen.append(h)
              probe_actions = []
              tmp = st
              for _ in range(P):
                  a, _p = policy.sample(rng, tmp.src)
                  probe_actions.append(a)
              scores = {}
              for h in chosen:
                  m_probe = Meter()
                  full = search_set(world, h, st.src, pool_eval, rng)
                  s2, sset = st, rng.sample(full, min(PROBE_CAP, len(full)))
                  for a in probe_actions:
                      _, s2, _ = episode(world, s2, a, h, sset, m_probe, "hstep_probe")
                  val = world.steer[:PROBE_CAP]
                  v0 = evaluate(st.src, val, meter, "hstep_val").score
                  v1 = evaluate(s2.src, val, meter, "hstep_val").score
                  meter.charge(m_probe.spent, "hstep_probe")
                  scores[h] = (v1 - v0) / max(m_probe.spent, 1.0)
              harness = max(chosen, key=lambda h: scores[h])
              for h in scores:                                                  # self-proposer learns (rank-based)
                  h_weight[h] = 0.7 * h_weight[h] + 0.3 * (2.0 if h == harness else 0.5)
          log["harness"].append(harness)
          # ------------------------------------------------ P-step
          sset = search_set(world, harness, st.src, pool_eval, rng)
          cost_est = len(sset) + len(world.fit) + (8 if harness[0] else 0)
          while meter.spent + cost_est * 2.1 <= round_end:
              a, p = policy.sample(rng, st.src)
              reward, st, _ = episode(world, st, a, harness, sset, meter)
              policy.update(a, p, reward)
              log["episodes"] += 1
          log["round_test"].append(evaluate(st.src, world.test, free_meter()).score)
      except BudgetExceeded:
        log["round_test"].append(evaluate(st.src, world.test, free_meter()).score)
        break
    log["test"] = evaluate(st.src, world.test, free_meter()).score
    log["spent"] = meter.spent
    log["by_label"] = dict(meter.by_label)
    log["theta_top"] = [NAMES[i] for i in np.argsort(-policy.theta)[:3]]
    log["src"] = st.src
    return log
