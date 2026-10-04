"""The autoresearch loop.

    for each experiment in the budget:
        proposer  -> a hypothesis and a pipeline spec
        executor  -> real fit, real repeated-CV scores
        arbiter   -> accept / reject / inconclusive, against the incumbent
        ledger    -> record it, immutably
    then once, at the end:
        score the single selected winner on the held-out set

The shape is the canonical autoresearch loop. Two differences matter:

* The accept step is a statistical gate, not `>`. See `arbiter.py`.
* The held-out set is scored exactly once, after the loop has finished and the
  winner is fixed. The loop cannot see it, so the final number is an estimate
  of generalisation rather than a restatement of what was optimised.

The second point is the one that makes the result trustworthy, and it is the
one most easily lost: the moment a test score enters the proposer's history,
every subsequent decision is contaminated.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

from .arbiter import Arbiter
from .executor import Executor
from .ledger import Ledger
from .proposer import HeuristicProposer
from .types import Experiment, LedgerEntry, Result


@dataclass
class StudyConfig:
    name: str = "study"
    budget: int = 30
    wall_clock_limit: float = 600.0
    seed: int = 0
    alpha: float = 0.05
    min_effect: float = 0.002
    out_dir: Path = field(default_factory=lambda: Path("runs"))


@dataclass
class StudyReport:
    """Everything a study produced, enough to write the report from."""

    config: StudyConfig
    ledger: Ledger
    incumbent: LedgerEntry | None
    best_observed: LedgerEntry | None
    holdout_score: float | None
    holdout_of: str | None
    greedy_holdout_score: float | None
    greedy_of: str | None
    elapsed: float
    n_evaluations: int
    proposer_name: str
    fallback_count: int = 0

    @property
    def selection_gap(self) -> float | None:
        """Validation minus held-out for the SELECTED model.

        The quantity the whole design exists to keep small. A large positive gap
        means the reported validation score was substantially selection noise.
        """
        if self.incumbent is None or self.holdout_score is None:
            return None
        return self.incumbent.result.val_mean - self.holdout_score

    @property
    def greedy_gap(self) -> float | None:
        """The same gap for the greedy choice (best observed validation).

        Comparing `greedy_gap` with `selection_gap` is the experiment that shows
        whether the statistical gate earned its cost.
        """
        if self.best_observed is None or self.greedy_holdout_score is None:
            return None
        return self.best_observed.result.val_mean - self.greedy_holdout_score


class AutoResearchLoop:
    def __init__(
        self,
        executor: Executor,
        proposer=None,
        arbiter: Arbiter | None = None,
        config: StudyConfig | None = None,
        on_event: Callable[[str, dict], None] | None = None,
    ) -> None:
        self.config = config or StudyConfig()
        self.executor = executor
        self.proposer = proposer or HeuristicProposer(seed=self.config.seed)
        self.arbiter = arbiter or Arbiter(
            alpha=self.config.alpha, min_effect=self.config.min_effect
        )
        self.on_event = on_event or (lambda kind, payload: None)

        self.config.out_dir.mkdir(parents=True, exist_ok=True)
        self.ledger = Ledger(self.config.out_dir / f"{self.config.name}-ledger.jsonl")

        self.incumbent: LedgerEntry | None = None

    def run(self, holdout: tuple | None = None) -> StudyReport:
        started = time.time()
        self.on_event("study_start", {"budget": self.config.budget, "name": self.config.name})

        for index in range(1, self.config.budget + 1):
            if time.time() - started > self.config.wall_clock_limit:
                self.on_event("budget_exhausted", {"reason": "wall clock", "completed": index - 1})
                break

            spec, hypothesis = self.proposer.propose(self.ledger.history(), 1)[0]
            experiment = Experiment(
                id=f"{self.config.name}-{index:03d}",
                hypothesis=hypothesis,
                spec=spec,
                seed=self.config.seed,
            )

            self.on_event("experiment_start", {
                "id": experiment.id, "label": experiment.label,
                "n": index, "of": self.config.budget,
                "hypothesis": hypothesis.statement,
            })

            result = self.executor.run(experiment)
            decision = self.arbiter.judge(
                result, self.incumbent.result if self.incumbent else None
            )

            entry = LedgerEntry(
                experiment=experiment,
                result=result,
                verdict=decision.verdict,
                reason=decision.reason,
                incumbent_at_time=self.incumbent.experiment.id if self.incumbent else None,
            )
            self.ledger.record(entry)

            if decision.verdict == "accepted":
                self.incumbent = entry

            self.on_event("experiment_done", {
                "id": experiment.id, "label": experiment.label,
                "ok": result.ok,
                "score": result.val_mean, "std": result.val_std,
                "verdict": decision.verdict, "reason": decision.reason,
                "incumbent": self.incumbent.result.val_mean if self.incumbent else None,
                "error": result.error,
            })

        elapsed = time.time() - started

        # --------------------------------------------------- the single peek
        holdout_score = greedy_score = None
        holdout_of = greedy_of = None
        best_observed = self.ledger.best_observed()

        if holdout is not None:
            X_test, y_test = holdout

            if self.incumbent is not None:
                holdout_score = self.executor.score_holdout(
                    self.incumbent.experiment, X_test, y_test
                )
                holdout_of = self.incumbent.experiment.id
                self.incumbent.result.test_score = holdout_score

            # Also score what a GREEDY loop would have picked, purely so the
            # report can compare the two selection rules. This is measurement
            # of the method, not model selection -- the choice of winner was
            # already fixed above.
            if best_observed is not None:
                if self.incumbent and best_observed.experiment.id == self.incumbent.experiment.id:
                    greedy_score = holdout_score
                else:
                    greedy_score = self.executor.score_holdout(
                        best_observed.experiment, X_test, y_test
                    )
                greedy_of = best_observed.experiment.id

        report = StudyReport(
            config=self.config,
            ledger=self.ledger,
            incumbent=self.incumbent,
            best_observed=best_observed,
            holdout_score=holdout_score,
            holdout_of=holdout_of,
            greedy_holdout_score=greedy_score,
            greedy_of=greedy_of,
            elapsed=elapsed,
            n_evaluations=self.executor.n_evaluations,
            proposer_name=getattr(self.proposer, "name", "unknown"),
            fallback_count=getattr(self.proposer, "fallback_count", 0),
        )

        self.on_event("study_done", {
            "elapsed": elapsed,
            "experiments": len(self.ledger.entries),
            "accepted": len(self.ledger.accepted()),
            "incumbent": self.incumbent.experiment.label if self.incumbent else None,
            "val": self.incumbent.result.val_mean if self.incumbent else None,
            "holdout": holdout_score,
        })
        return report
