#!/usr/bin/env python3
"""Run an autoresearch study.

    python3 study.py --dataset breast_cancer --budget 25
    python3 study.py --dataset wine --budget 20 --llm        # needs OPENROUTER_API_KEY
    python3 study.py --dataset digits --budget 15 --compare  # selection-rule experiment
    python3 study.py --csv mydata.csv --target label --budget 20
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from sklearn.model_selection import train_test_split

from mlresearch.arbiter import Arbiter
from mlresearch.executor import Executor
from mlresearch.loop import AutoResearchLoop, StudyConfig
from mlresearch.proposer import HeuristicProposer, LLMProposer
from mlresearch.reporter import plot_study, write_report

DATASETS = {
    "breast_cancer": "load_breast_cancer",
    "wine": "load_wine",
    "digits": "load_digits",
    "iris": "load_iris",
}


def load_data(args) -> tuple:
    if args.csv:
        import pandas as pd

        frame = pd.read_csv(args.csv)
        if args.target not in frame.columns:
            sys.exit(f"--target {args.target!r} is not a column in {args.csv}")
        y = frame[args.target].to_numpy()
        X = frame.drop(columns=[args.target]).select_dtypes("number").to_numpy()
        return X, y, Path(args.csv).stem

    import sklearn.datasets as sk

    loader = getattr(sk, DATASETS[args.dataset])
    bundle = loader()
    return bundle.data, bundle.target, args.dataset


def reporter(kind: str, payload: dict) -> None:
    """Progress on stderr so stdout stays clean."""
    if kind == "study_start":
        print(f"\nstudy '{payload['name']}' — budget {payload['budget']} experiments",
              file=sys.stderr)
    elif kind == "experiment_start":
        print(f"\n[{payload['n']}/{payload['of']}] {payload['label']}", file=sys.stderr)
        print(f"    hypothesis: {payload['hypothesis'][:100]}", file=sys.stderr)
    elif kind == "experiment_done":
        if not payload["ok"]:
            print(f"    \033[90mfailed: {str(payload['error'])[:90]}\033[0m", file=sys.stderr)
            return
        colour = {"accepted": "32", "rejected": "31", "inconclusive": "33"}.get(
            payload["verdict"], "0")
        incumbent = f"  incumbent {payload['incumbent']:.4f}" if payload["incumbent"] else ""
        print(f"    {payload['score']:.4f} ± {payload['std']:.4f}  "
              f"\033[{colour}m{payload['verdict']}\033[0m{incumbent}", file=sys.stderr)
        print(f"    \033[90m{payload['reason'][:110]}\033[0m", file=sys.stderr)
    elif kind == "study_done":
        print(f"\ndone in {payload['elapsed']:.1f}s — {payload['experiments']} experiments, "
              f"{payload['accepted']} accepted", file=sys.stderr)


def build_loop(args, X_train, y_train, name: str, seed: int, quiet: bool = False):
    executor = Executor(
        X_train, y_train,
        n_splits=args.folds, n_repeats=args.repeats,
        scoring=args.scoring, budget_seconds=args.experiment_timeout,
    )

    if args.llm:
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "part-a"))
        from minicoder.config import Config
        from minicoder.providers.mock import MockProvider
        from minicoder.providers.openrouter import OpenRouterProvider

        config = Config.from_env()
        provider = MockProvider(config) if config.is_mock else OpenRouterProvider(config)
        if config.is_mock:
            print("no OPENROUTER_API_KEY — the LLM proposer will fall back to the "
                  "heuristic on every call", file=sys.stderr)
        proposer = LLMProposer(provider, HeuristicProposer(seed=seed))
    else:
        proposer = HeuristicProposer(seed=seed)

    config = StudyConfig(
        name=name, budget=args.budget, seed=seed,
        alpha=args.alpha, min_effect=args.min_effect,
        wall_clock_limit=args.time_limit, out_dir=Path(args.out),
    )
    return AutoResearchLoop(
        executor=executor, proposer=proposer,
        arbiter=Arbiter(alpha=args.alpha, min_effect=args.min_effect),
        config=config,
        on_event=(lambda *_: None) if quiet else reporter,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Autoresearch harness for ML pipelines.")
    source = parser.add_mutually_exclusive_group()
    source.add_argument("--dataset", choices=sorted(DATASETS), default="breast_cancer")
    source.add_argument("--csv", help="Path to a CSV file instead of a built-in dataset.")
    parser.add_argument("--target", default="target", help="Target column when using --csv.")

    parser.add_argument("--budget", type=int, default=25, help="Number of experiments.")
    parser.add_argument("--folds", type=int, default=5)
    parser.add_argument("--repeats", type=int, default=3)
    parser.add_argument("--scoring", default="balanced_accuracy")
    parser.add_argument("--alpha", type=float, default=0.05)
    parser.add_argument("--min-effect", type=float, default=0.002, dest="min_effect")
    parser.add_argument("--holdout", type=float, default=0.25)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--time-limit", type=float, default=900.0, dest="time_limit")
    parser.add_argument("--experiment-timeout", type=float, default=90.0,
                        dest="experiment_timeout")
    parser.add_argument("--out", default="runs")
    parser.add_argument("--llm", action="store_true",
                        help="Use the LLM proposer (OpenRouter) instead of the heuristic.")
    parser.add_argument("--compare", type=int, metavar="N", default=0,
                        help="Repeat the study across N seeds and compare selection rules.")
    args = parser.parse_args()

    X, y, data_name = load_data(args)
    print(f"dataset: {data_name}  X={X.shape}  classes={len(np.unique(y))}", file=sys.stderr)

    # One split, made before anything else runs. The loop never sees X_test.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.holdout, random_state=42, stratify=y
    )
    print(f"train={X_train.shape[0]} rows   held-out={X_test.shape[0]} rows "
          f"(scored once, at the end)", file=sys.stderr)

    if args.compare:
        return run_comparison(args, X_train, y_train, X_test, y_test, data_name)

    loop = build_loop(args, X_train, y_train, f"{data_name}-{args.seed}", args.seed)
    report = loop.run(holdout=(X_test, y_test))

    report_path = write_report(report)
    plot_path = plot_study(report)

    print(f"\nreport:  {report_path}", file=sys.stderr)
    print(f"figure:  {plot_path}", file=sys.stderr)
    print(f"ledger:  {report.ledger.path}", file=sys.stderr)

    if report.incumbent:
        print(f"\nselected: {report.incumbent.experiment.label}")
        print(f"validation {report.incumbent.result.val_mean:.4f}  "
              f"held-out {report.holdout_score:.4f}  "
              f"gap {report.selection_gap:+.4f}")
    return 0


def run_comparison(args, X_train, y_train, X_test, y_test, data_name: str) -> int:
    """Repeat the study across seeds to compare the two selection rules.

    One study cannot tell you whether the statistical gate helps -- the gate
    reduces the variance of selection, so a single run can go either way. This
    is the experiment that actually tests the claim.
    """
    print(f"\ncomparing selection rules across {args.compare} seeds "
          f"({args.budget} experiments each)\n", file=sys.stderr)

    rows = []
    for seed in range(args.compare):
        loop = build_loop(args, X_train, y_train, f"{data_name}-cmp{seed}", seed, quiet=True)
        report = loop.run(holdout=(X_test, y_test))

        if report.incumbent is None or report.holdout_score is None:
            continue

        rows.append({
            "seed": seed,
            "gated_val": report.incumbent.result.val_mean,
            "gated_test": report.holdout_score,
            "gated_gap": report.selection_gap,
            "greedy_val": report.best_observed.result.val_mean,
            "greedy_test": report.greedy_holdout_score,
            "greedy_gap": report.greedy_gap,
            "same": report.incumbent.experiment.id == report.best_observed.experiment.id,
        })
        print(f"  seed {seed}: gated {report.holdout_score:.4f} "
              f"(gap {report.selection_gap:+.4f})   "
              f"greedy {report.greedy_holdout_score:.4f} "
              f"(gap {report.greedy_gap:+.4f})"
              f"{'   [same pick]' if rows[-1]['same'] else ''}", file=sys.stderr)

    if not rows:
        print("no study produced an incumbent", file=sys.stderr)
        return 1

    def mean(key: str) -> float:
        return sum(r[key] for r in rows) / len(rows)

    print("\n" + "=" * 68)
    print(f"selection-rule comparison — {data_name}, {len(rows)} seeds, "
          f"{args.budget} experiments each")
    print("=" * 68)
    print(f"{'rule':<22}{'mean val':>11}{'mean test':>11}{'mean gap':>11}")
    print(f"{'statistical gate':<22}{mean('gated_val'):>11.4f}"
          f"{mean('gated_test'):>11.4f}{mean('gated_gap'):>11.4f}")
    print(f"{'greedy max':<22}{mean('greedy_val'):>11.4f}"
          f"{mean('greedy_test'):>11.4f}{mean('greedy_gap'):>11.4f}")
    print("-" * 68)

    test_delta = mean("gated_test") - mean("greedy_test")
    gap_delta = mean("greedy_gap") - mean("gated_gap")
    n_same = sum(1 for r in rows if r["same"])

    print(f"held-out difference (gate − greedy): {test_delta:+.4f}")
    print(f"validation inflation avoided:        {gap_delta:+.4f}")
    print(f"same pipeline chosen in {n_same}/{len(rows)} studies")
    print("=" * 68)

    from mlresearch.arbiter import paired_t_test
    mean_diff, _, p_value = paired_t_test(
        [r["greedy_gap"] for r in rows], [r["gated_gap"] for r in rows]
    )
    print(f"\npaired t-test on the selection gap across seeds: "
          f"mean difference {mean_diff:+.4f}, p={p_value:.4f}")
    print("(a positive difference means the greedy rule reported more inflated "
          "validation scores than the gated rule)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
