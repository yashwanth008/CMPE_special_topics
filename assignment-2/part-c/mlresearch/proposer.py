"""Proposers: decide what to try next.

Two implementations behind one interface, which is the same seam Part A used
for model providers and for the same reason -- the loop must be runnable and
testable with no API key, and the quality of the proposer must be measurable
against a baseline rather than assumed.

`HeuristicProposer` is a real search strategy, not a stub: explore-then-exploit
with a bandit-style preference for model families that have worked, plus
dedup. It is the control condition. If an LLM proposer cannot beat it on the
same budget, that is a finding worth reporting, not an embarrassment to hide.

`LLMProposer` sends the leaderboard and the recent failures to a model and asks
for the next spec as JSON. Its advantage is not raw search efficiency; it is
that it can read an error message, notice "svc with preprocess=none scored
0.62", and state a reason in words that ends up in the research log.
"""

from __future__ import annotations

import json
import random
from typing import Protocol

from .search_space import (
    GRIDS,
    MODELS,
    SCALE_SENSITIVE,
    default_spec,
    mutate_spec,
    sample_spec,
    validate_spec,
)
from .types import Hypothesis


class Proposer(Protocol):
    name: str

    def propose(self, history: list[dict], n: int = 1) -> list[tuple[dict, Hypothesis]]:
        ...


def spec_key(spec: dict) -> str:
    """Canonical identity of a spec, for deduplication."""
    return json.dumps(
        {
            "model": spec["model"],
            "preprocess": spec.get("preprocess", "none"),
            "params": {k: str(v) for k, v in sorted((spec.get("params") or {}).items())},
        },
        sort_keys=True,
    )


class HeuristicProposer:
    """Explore-then-exploit search over the declared space.

    Phase 1 (explore): one default pipeline per model family, cheapest first.
    This buys a map of the space for a fixed, predictable cost, and means the
    loop never finishes a study having not tried a whole family.

    Phase 2 (exploit): mutate the leaderboard leaders, sampling which family to
    mutate in proportion to how well that family has done. Occasionally draw a
    fresh random spec so the search cannot get permanently stuck.
    """

    name = "heuristic"

    # Rough cost order, cheapest first -- explore in this order so a small
    # budget still covers several families.
    EXPLORE_ORDER = [
        "gnb", "lda", "logreg", "tree", "knn", "sgd",
        "forest", "extratrees", "histgboost", "svc", "mlp", "gboost",
    ]

    def __init__(self, seed: int = 0, explore_fraction: float = 0.45) -> None:
        self.rng = random.Random(seed)
        self.explore_fraction = explore_fraction
        self._seen: set[str] = set()

    def propose(self, history: list[dict], n: int = 1) -> list[tuple[dict, Hypothesis]]:
        out: list[tuple[dict, Hypothesis]] = []
        for _ in range(n):
            spec, hypothesis = self._propose_one(history + [{"spec": s} for s, _ in out])
            out.append((spec, hypothesis))
        return out

    def _propose_one(self, history: list[dict]) -> tuple[dict, Hypothesis]:
        tried = {spec_key(row["spec"]) for row in history if row.get("spec")}
        self._seen |= tried

        successes = [
            row for row in history
            if row.get("ok") and row.get("val_mean") is not None
        ]

        # ---- phase 1: explore one default per family
        untried_families = [
            model for model in self.EXPLORE_ORDER
            if not any(row["spec"]["model"] == model for row in history if row.get("spec"))
        ]
        if untried_families:
            model = untried_families[0]
            spec = default_spec(model)
            if spec_key(spec) not in self._seen:
                return spec, Hypothesis(
                    statement=f"The {model} family is competitive on this dataset.",
                    rationale=(
                        "No member of this family has been evaluated yet. A default "
                        "configuration costs one experiment and rules a whole region "
                        "of the space in or out."
                    ),
                    proposed_by=self.name,
                )

        # ---- phase 2: exploit, with a floor on exploration
        explore = self.rng.random() < (
            self.explore_fraction if len(successes) < 8 else self.explore_fraction / 3
        )

        if successes and not explore:
            # Weight families by their best score, sharpened so a clear leader
            # dominates but nothing is excluded outright.
            best_by_family: dict[str, dict] = {}
            for row in successes:
                family = row["spec"]["model"]
                if family not in best_by_family or row["val_mean"] > best_by_family[family]["val_mean"]:
                    best_by_family[family] = row

            families = list(best_by_family)
            floor = min(r["val_mean"] for r in best_by_family.values())
            weights = [
                (best_by_family[f]["val_mean"] - floor + 0.01) ** 3 for f in families
            ]
            family = self.rng.choices(families, weights=weights, k=1)[0]
            parent = best_by_family[family]

            for strength in (1, 1, 2, 2, 3):
                spec = mutate_spec(self.rng, parent["spec"], strength)
                if spec_key(spec) not in self._seen:
                    self._seen.add(spec_key(spec))
                    return spec, Hypothesis(
                        statement=(
                            f"A variation on the best {family} configuration "
                            f"({parent['val_mean']:.4f}) does better."
                        ),
                        rationale=(
                            f"{family} is among the strongest families so far, so local "
                            f"search around its best point is the highest-expected-value "
                            f"use of an experiment. Perturbing {strength} dimension(s)."
                        ),
                        proposed_by=self.name,
                        parent_id=parent.get("id"),
                    )

        # ---- fallback: a fresh draw
        for _ in range(40):
            spec = sample_spec(self.rng)
            if spec_key(spec) not in self._seen:
                self._seen.add(spec_key(spec))
                scale_note = ""
                if spec["model"] in SCALE_SENSITIVE and spec["preprocess"] == "none":
                    scale_note = (
                        " This pairs a scale-sensitive model with no scaling, which "
                        "should do badly -- a useful negative control."
                    )
                return spec, Hypothesis(
                    statement=f"An unexplored {spec['model']} configuration is competitive.",
                    rationale=(
                        "Random draw to keep the search from converging on one region "
                        "of the space." + scale_note
                    ),
                    proposed_by=self.name,
                )

        # Space effectively exhausted at this granularity.
        return default_spec(self.rng.choice(MODELS)), Hypothesis(
            statement="Re-evaluating a default configuration.",
            rationale="The proposer could not find an untried spec; the space is saturated.",
            proposed_by=self.name,
        )


PROMPT = """You are the proposer in an automated machine-learning research loop.

Your job: choose the next pipeline to evaluate, and state the hypothesis it tests.

The search space (you may ONLY use these):
  preprocess: none | standard | minmax | quantile | power | pca
  model and its tunable parameters:
{grid}

Scale-sensitive models (svc, knn, mlp, logreg, sgd) usually need standard,
minmax, quantile or power. Tree ensembles (tree, forest, extratrees, gboost,
histgboost) are invariant to monotone feature scaling.

Results so far, best first:
{leaderboard}

Failures so far (do not repeat these mistakes):
{failures}

Already evaluated (do NOT propose any of these again):
{tried}

Reply with ONLY a JSON object, no prose and no code fences:
{{"model": "...", "preprocess": "...", "params": {{}},
  "statement": "the claim this experiment tests",
  "rationale": "why this is the best use of the next experiment, given the results above"}}
"""


class LLMProposer:
    """Asks a language model for the next experiment.

    Falls back to the heuristic proposer on any failure -- a bad JSON reply, a
    network error, an invalid spec. A study must not die because a proposal was
    malformed, and silently continuing with a working search is better than
    stopping. Every fallback is counted and reported, so the final report can
    say how often the model was actually driving.
    """

    name = "llm"

    def __init__(self, provider, fallback: HeuristicProposer | None = None) -> None:
        self.provider = provider
        self.fallback = fallback or HeuristicProposer(seed=7)
        self.fallback_count = 0
        self.call_count = 0

    def propose(self, history: list[dict], n: int = 1) -> list[tuple[dict, Hypothesis]]:
        out = []
        for _ in range(n):
            out.append(self._propose_one(history + [{"spec": s} for s, _ in out]))
        return out

    def _propose_one(self, history: list[dict]) -> tuple[dict, Hypothesis]:
        self.call_count += 1
        try:
            raw = self._ask(history)
            payload = self._extract_json(raw)

            spec = {
                "model": payload["model"],
                "preprocess": payload.get("preprocess", "none"),
                "params": payload.get("params") or {},
            }
            valid, why = validate_spec(spec)
            if not valid:
                raise ValueError(why)

            if spec_key(spec) in {spec_key(r["spec"]) for r in history if r.get("spec")}:
                raise ValueError("proposed a configuration that was already evaluated")

            return spec, Hypothesis(
                statement=payload.get("statement", "(none given)"),
                rationale=payload.get("rationale", "(none given)"),
                proposed_by=self.name,
            )

        except Exception as exc:  # noqa: BLE001
            self.fallback_count += 1
            spec, hypothesis = self.fallback.propose(history, 1)[0]
            hypothesis.proposed_by = f"heuristic (llm fallback: {type(exc).__name__})"
            return spec, hypothesis

    def _ask(self, history: list[dict]) -> str:
        successes = sorted(
            [r for r in history if r.get("ok")],
            key=lambda r: -r["val_mean"],
        )[:12]
        failures = [r for r in history if r.get("ok") is False][-5:]

        leaderboard = "\n".join(
            f"  {r['val_mean']:.4f} +/- {r.get('val_std', 0):.4f}  "
            f"{r['spec']['preprocess']}+{r['spec']['model']} {r['spec'].get('params', {})}"
            for r in successes
        ) or "  (nothing yet)"

        failure_text = "\n".join(
            f"  {f['spec']['preprocess']}+{f['spec']['model']}: {str(f.get('error'))[:120]}"
            for f in failures
        ) or "  (none)"

        tried = "\n".join(
            f"  {r['spec']['preprocess']}+{r['spec']['model']} {r['spec'].get('params', {})}"
            for r in history if r.get("spec")
        )[-2500:] or "  (nothing yet)"

        grid = "\n".join(
            f"    {model}: " + ", ".join(f"{k}={v}" for k, v in params.items())
            for model, params in GRIDS.items()
        )

        prompt = PROMPT.format(
            grid=grid, leaderboard=leaderboard, failures=failure_text, tried=tried
        )

        # Duck-typed against Part A's provider interface.
        from minicoder.types import Message

        completion = self.provider.complete(
            [
                Message(role="system", content="You reply with a single JSON object and nothing else."),
                Message(role="user", content=prompt),
            ],
            tools=None,
            stream=False,
        )
        return completion.message.text

    @staticmethod
    def _extract_json(raw: str) -> dict:
        """Pull the first JSON object out of a reply.

        Models wrap JSON in fences and commentary no matter how firmly they are
        told not to. Brace-matching is more reliable than a regex here.
        """
        text = raw.strip()
        if "```" in text:
            parts = text.split("```")
            for part in parts:
                candidate = part.lstrip("json").strip()
                if candidate.startswith("{"):
                    text = candidate
                    break

        start = text.find("{")
        if start < 0:
            raise ValueError(f"no JSON object in reply: {raw[:200]!r}")

        depth = 0
        for index, char in enumerate(text[start:], start=start):
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    return json.loads(text[start : index + 1])

        raise ValueError(f"unbalanced JSON in reply: {raw[:200]!r}")
