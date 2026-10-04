"""Core vocabulary for the autoresearch loop.

The loop is a scientific process, so the types are named after the process:
a Hypothesis is a claim worth testing, an Experiment is the concrete thing that
tests it, and a Result is what came back. Keeping them distinct is what lets the
ledger answer "why did we try this?" months later -- a bare config dict cannot.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field, asdict
from typing import Any, Literal

Verdict = Literal["accepted", "rejected", "inconclusive", "failed"]


@dataclass
class Hypothesis:
    """A claim the loop intends to test.

    `rationale` is the part that matters for a research log. A loop that only
    records configs produces a leaderboard; a loop that records why it tried
    something produces a narrative a human can audit.
    """

    statement: str
    rationale: str
    proposed_by: str = "heuristic"
    parent_id: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Experiment:
    """A fully specified, reproducible pipeline configuration."""

    id: str
    hypothesis: Hypothesis
    # The pipeline spec the executor knows how to build and run.
    spec: dict[str, Any]
    seed: int = 0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "hypothesis": self.hypothesis.to_dict(),
            "spec": self.spec,
            "seed": self.seed,
        }

    @property
    def label(self) -> str:
        """Short human-readable identity, e.g. 'standard+logreg(C=1.0)'."""
        model = self.spec.get("model", "?")
        prep = self.spec.get("preprocess", "none")
        params = self.spec.get("params", {})
        inner = ", ".join(f"{k}={v}" for k, v in sorted(params.items()))
        return f"{prep}+{model}({inner})" if inner else f"{prep}+{model}"


@dataclass
class Result:
    """What one experiment produced.

    Two things make this more than a score:

    `fold_scores` -- the per-fold validation scores, kept so later comparisons
    can be PAIRED. Comparing two means tells you much less than comparing two
    models on the same folds, and paired comparison is what stops the loop
    chasing noise.

    `test_score` -- deliberately None for almost every result. The held-out set
    is scored once, at the end, for the single selected winner. Any loop that
    reads the test set each iteration is reporting a number it has already
    optimised against.
    """

    experiment_id: str
    ok: bool
    val_mean: float = 0.0
    val_std: float = 0.0
    fold_scores: list[float] = field(default_factory=list)
    fit_seconds: float = 0.0
    n_params: int = 0
    error: str | None = None
    test_score: float | None = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class LedgerEntry:
    """One immutable row of the research record."""

    experiment: Experiment
    result: Result
    verdict: Verdict
    reason: str
    incumbent_at_time: str | None = None
    wall_clock: float = field(default_factory=time.time)

    def to_json(self) -> str:
        return json.dumps(
            {
                "experiment": self.experiment.to_dict(),
                "result": self.result.to_dict(),
                "verdict": self.verdict,
                "reason": self.reason,
                "incumbent_at_time": self.incumbent_at_time,
                "wall_clock": self.wall_clock,
            },
            default=str,
        )
