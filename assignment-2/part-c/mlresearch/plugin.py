"""The harness plugin: exposes the autoresearch loop as agent tools.

This is what makes Part C a *harness plugin* rather than a standalone script. It
registers into the tool registry built in Part A, so the agent from Part A can
run a study by calling tools, read the ledger, and write up the result -- the
same way it reads and edits files.

WHY THESE SIX TOOLS AND NOT ONE

A single `do_research(dataset)` tool would be easier to write and much worse to
use. It would make the agent a spectator: it could start a study and read a
verdict, with no way to intervene, inspect a surprise, or change the protocol
after seeing early results. Splitting the loop at its natural seams --
load, configure, run, inspect, re-run, report -- means the agent participates in
the research rather than triggering it.

The division of labour is deliberate:
  * The AGENT decides what to study, how strict to be, and what the results mean.
  * The LOOP owns the protocol: fixed folds, paired comparison, one peek at the
    held-out set.

The agent cannot talk the loop out of its protocol, which is the point. An agent
that could lower alpha after seeing the results, or score the test set twice,
would be able to manufacture a better-looking answer -- so those controls live
in code the agent calls, not in prose it can reinterpret.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from sklearn.model_selection import train_test_split

# The Part A harness lives beside this package. Importing ToolResult at module
# level (not inside register()) is required: `from __future__ import
# annotations` turns every annotation into a string, and the registry resolves
# them with get_type_hints(), which only looks in module globals.
_PART_A = Path(__file__).resolve().parents[2] / "part-a"
if _PART_A.is_dir() and str(_PART_A) not in sys.path:
    sys.path.insert(0, str(_PART_A))

from minicoder.types import ToolResult  # noqa: E402

from .arbiter import Arbiter
from .executor import Executor
from .loop import AutoResearchLoop, StudyConfig
from .reporter import plot_study, write_report
from .search_space import GRIDS, MODELS, PREPROCESSORS, validate_spec

BUILTIN_DATASETS = ["breast_cancer", "wine", "digits", "iris"]


class ResearchSession:
    """Mutable state the tools share: the data, the protocol, the last study."""

    def __init__(self) -> None:
        self.dataset_name: str | None = None
        self.X_train = self.y_train = self.X_test = self.y_test = None
        self.last_report = None
        self.out_dir = Path("runs")
        # Protocol knobs the agent may set BEFORE a study, never during one.
        self.alpha = 0.05
        self.min_effect = 0.002
        self.folds = 5
        self.repeats = 3
        self.scoring = "balanced_accuracy"

    @property
    def ready(self) -> bool:
        return self.X_train is not None


def register(registry, session: ResearchSession | None = None) -> ResearchSession:
    """Register the autoresearch tools into a Part A ToolRegistry.

    Takes the registry rather than importing it, so the plugin works with a
    restricted registry too -- `registry.subset([...])` from Part A builds a
    research-only agent with no shell access.
    """
    session = session or ResearchSession()

    # ------------------------------------------------------------- load data

    @registry.register(read_only=True)
    def research_load_dataset(name: str, holdout_fraction: float = 0.25) -> ToolResult:
        """Load a dataset and split off a held-out test set for the final check.

        Call this first. The held-out set is withheld from the entire search and
        scored exactly once, at the end, so the final number estimates
        generalisation instead of restating what was optimised.

        Args:
            name: A built-in dataset (breast_cancer, wine, digits, iris) or a path to a CSV.
            holdout_fraction: Fraction reserved for the final held-out score.
        """
        if name in BUILTIN_DATASETS:
            import sklearn.datasets as sk

            bundle = getattr(sk, f"load_{name}")()
            X, y = bundle.data, bundle.target
        else:
            path = Path(name)
            if not path.is_file():
                return ToolResult(
                    f"Error: {name!r} is neither a built-in dataset {BUILTIN_DATASETS} "
                    f"nor an existing CSV file.", ok=False,
                )
            import pandas as pd

            frame = pd.read_csv(path)
            target_col = "target" if "target" in frame.columns else frame.columns[-1]
            y = frame[target_col].to_numpy()
            X = frame.drop(columns=[target_col]).select_dtypes("number").to_numpy()

        if len(np.unique(y)) < 2:
            return ToolResult("Error: the target has fewer than two classes.", ok=False)

        session.dataset_name = name
        (session.X_train, session.X_test,
         session.y_train, session.y_test) = train_test_split(
            X, y, test_size=holdout_fraction, random_state=42, stratify=y
        )
        session.last_report = None

        classes, counts = np.unique(session.y_train, return_counts=True)
        balance = ", ".join(f"class {c}: {n}" for c, n in zip(classes, counts))

        return ToolResult(
            f"Loaded {name}: {X.shape[0]} rows, {X.shape[1]} numeric features, "
            f"{len(classes)} classes.\n"
            f"Training set: {session.X_train.shape[0]} rows ({balance}).\n"
            f"Held-out set: {session.X_test.shape[0]} rows — withheld from the search, "
            f"scored once at the end.\n"
            f"Protocol: {session.repeats}x{session.folds}-fold repeated stratified CV, "
            f"scoring={session.scoring}."
        )

    # ----------------------------------------------------------- the space

    @registry.register(read_only=True)
    def research_search_space() -> ToolResult:
        """List the pipelines that may be proposed: preprocessors, models, parameters.

        Read this before proposing a specific experiment. The space is fixed and
        declarative — a proposal names a model and parameters, it never supplies
        code, so an invalid proposal fails validation rather than executing.
        """
        lines = [f"Preprocessors: {', '.join(PREPROCESSORS)}", "", "Models and parameters:"]
        for model, grid in GRIDS.items():
            params = "; ".join(f"{k}: {v}" for k, v in grid.items())
            lines.append(f"  {model} — {params}")
        lines.append("")
        lines.append("Scale-sensitive models (svc, knn, mlp, logreg, sgd) usually need a "
                     "scaler. Tree ensembles are invariant to monotone scaling.")
        return ToolResult("\n".join(lines))

    # ------------------------------------------------------- the protocol

    @registry.register(dangerous=False, read_only=False)
    def research_set_protocol(
        alpha: float = 0.05, min_effect: float = 0.002,
        folds: int = 5, repeats: int = 3,
    ) -> ToolResult:
        """Set the statistical protocol. Only valid BEFORE a study runs.

        Changing these after seeing results would be choosing the test that gives
        the answer you want, so a study always records the protocol it ran under.

        Args:
            alpha: Significance level for the paired t-test that gates acceptance.
            min_effect: Smallest mean improvement worth promoting, in score units.
            folds: Folds per CV repeat.
            repeats: CV repeats. More repeats means less noise and more compute.
        """
        if not 0 < alpha < 1:
            return ToolResult("Error: alpha must be between 0 and 1.", ok=False)
        if min_effect < 0:
            return ToolResult("Error: min_effect cannot be negative.", ok=False)
        if folds < 2:
            return ToolResult("Error: need at least 2 folds.", ok=False)

        session.alpha, session.min_effect = alpha, min_effect
        session.folds, session.repeats = folds, repeats
        return ToolResult(
            f"Protocol set: alpha={alpha}, min_effect={min_effect}, "
            f"{repeats}x{folds}-fold repeated stratified CV "
            f"({repeats * folds} fits per experiment)."
        )

    # ------------------------------------------------------- run a study

    @registry.register(dangerous=True, read_only=False)
    def research_run_study(budget: int = 20, seed: int = 0, name: str = "") -> ToolResult:
        """Run the autoresearch loop: propose, evaluate, accept or reject, repeat.

        Each experiment is scored by repeated stratified CV on fixed folds, then
        compared to the incumbent with a PAIRED t-test. A challenger is promoted
        only if it beats the incumbent by at least min_effect and survives the
        test. Everything is recorded, including rejections and failures.

        This is marked dangerous because it costs real compute: budget x
        repeats x folds model fits.

        Args:
            budget: Number of experiments to run.
            seed: Seed for the proposer, for reproducibility.
            name: Optional study name used for the output filenames.
        """
        if not session.ready:
            return ToolResult(
                "Error: no dataset loaded. Call research_load_dataset first.", ok=False
            )
        if budget < 1:
            return ToolResult("Error: budget must be at least 1.", ok=False)

        executor = Executor(
            session.X_train, session.y_train,
            n_splits=session.folds, n_repeats=session.repeats,
            scoring=session.scoring,
        )
        config = StudyConfig(
            name=name or f"{session.dataset_name}-{seed}",
            budget=budget, seed=seed,
            alpha=session.alpha, min_effect=session.min_effect,
            out_dir=session.out_dir,
        )
        loop = AutoResearchLoop(
            executor=executor,
            arbiter=Arbiter(alpha=session.alpha, min_effect=session.min_effect),
            config=config,
        )

        report = loop.run(holdout=(session.X_test, session.y_test))
        session.last_report = report

        ledger = report.ledger
        verdicts: dict[str, int] = {}
        for entry in ledger.entries:
            verdicts[entry.verdict] = verdicts.get(entry.verdict, 0) + 1

        lines = [
            f"Study '{config.name}' finished: {len(ledger.entries)} experiments "
            f"in {report.elapsed:.1f}s ({report.n_evaluations * session.folds * session.repeats} model fits).",
            f"Verdicts: " + ", ".join(f"{v} {k}" for k, v in sorted(verdicts.items())),
            "",
        ]

        if report.incumbent is None:
            lines.append("No experiment was accepted — nothing beat the baseline "
                         "by a distinguishable margin.")
        else:
            lines += [
                f"SELECTED: {report.incumbent.experiment.label}",
                f"  validation {report.incumbent.result.val_mean:.4f} "
                f"± {report.incumbent.result.val_std:.4f}",
                f"  held-out   {report.holdout_score:.4f}  (scored once, after selection)",
                f"  selection gap {report.selection_gap:+.4f}",
                "",
                f"For comparison, a greedy loop keeping the best validation score would "
                f"have chosen {report.best_observed.experiment.label} "
                f"(validation {report.best_observed.result.val_mean:.4f}, "
                f"held-out {report.greedy_holdout_score:.4f}).",
            ]
            if report.greedy_holdout_score is not None and (
                report.greedy_holdout_score < report.holdout_score
            ):
                lines.append(
                    f"  -> the greedy pick looked {report.best_observed.result.val_mean - report.incumbent.result.val_mean:+.4f} "
                    f"better on validation but was "
                    f"{report.greedy_holdout_score - report.holdout_score:+.4f} worse "
                    f"on the held-out set. That difference is selection noise."
                )

        lines += ["", f"Top 5 by validation score:"]
        for rank, entry in enumerate(ledger.leaderboard(5), 1):
            lines.append(f"  {rank}. {entry.result.val_mean:.4f}  "
                         f"{entry.experiment.label}  [{entry.verdict}]")

        lines += ["", f"Ledger: {ledger.path}",
                  "Call research_inspect_ledger for the reasoning behind any verdict, "
                  "or research_write_report to produce the write-up."]
        return ToolResult("\n".join(lines))

    # ---------------------------------------------------------- inspection

    @registry.register(read_only=True)
    def research_inspect_ledger(
        verdict: str = "all", limit: int = 10, include_reasoning: bool = True
    ) -> ToolResult:
        """Read the research record: what was tried, what happened, and why.

        Use this to understand a surprising result before drawing conclusions
        from it. Filtering by 'inconclusive' is the most informative view — those
        are the experiments a greedy loop would have promoted.

        Args:
            verdict: Filter by accepted, rejected, inconclusive, failed, or all.
            limit: Maximum entries to return.
            include_reasoning: Include each experiment's hypothesis and the verdict's reason.
        """
        if session.last_report is None:
            return ToolResult(
                "Error: no study has been run yet. Call research_run_study first.", ok=False
            )

        entries = session.last_report.ledger.entries
        if verdict != "all":
            entries = [e for e in entries if e.verdict == verdict]
            if not entries:
                return ToolResult(f"No entries with verdict {verdict!r}.")

        lines = [f"{len(entries)} entr{'y' if len(entries) == 1 else 'ies'} "
                 f"(verdict={verdict}), showing up to {limit}:", ""]
        for entry in entries[:limit]:
            score = f"{entry.result.val_mean:.4f} ± {entry.result.val_std:.4f}" \
                if entry.result.ok else "FAILED"
            lines.append(f"{entry.experiment.id}  {entry.experiment.label}")
            lines.append(f"  score: {score}   verdict: {entry.verdict}")
            if include_reasoning:
                lines.append(f"  hypothesis: {entry.experiment.hypothesis.statement}")
                lines.append(f"  rationale:  {entry.experiment.hypothesis.rationale}")
                lines.append(f"  verdict because: {entry.reason}")
            if entry.result.error:
                lines.append(f"  error: {entry.result.error}")
            lines.append("")
        return ToolResult("\n".join(lines))

    @registry.register(read_only=True)
    def research_write_report() -> ToolResult:
        """Write the markdown report and the trace figure for the last study.

        The report includes the leaderboard, the promotion chain, what was ruled
        out, per-family statistics, the exact protocol, and a threats-to-validity
        section. Produce this at the end of a study rather than summarising from
        memory.
        """
        if session.last_report is None:
            return ToolResult(
                "Error: no study has been run yet. Call research_run_study first.", ok=False
            )
        report_path = write_report(session.last_report)
        plot_path = plot_study(session.last_report)
        return ToolResult(
            f"Wrote the report to {report_path} ({report_path.stat().st_size} bytes) "
            f"and the trace figure to {plot_path}.\n"
            f"The report states the selected pipeline, both selection rules' held-out "
            f"scores, everything that was ruled out, and the threats to validity."
        )

    return session
