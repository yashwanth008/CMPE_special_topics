"""Tests for the autoresearch harness.

The interesting tests here are not "does the code run" but "does the method do
what it claims". The arbiter's whole purpose is to refuse improvements that are
indistinguishable from noise, so the tests that matter are the ones that feed it
noise and check that it says no -- and feed it a real effect and check that it
says yes.

    pytest tests/ -v
"""

from __future__ import annotations

import random
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "part-a"))

from sklearn.datasets import load_wine
from sklearn.model_selection import train_test_split

from mlresearch.arbiter import Arbiter, paired_t_test
from mlresearch.executor import Executor, SpecError, build_pipeline
from mlresearch.ledger import Ledger
from mlresearch.loop import AutoResearchLoop, StudyConfig
from mlresearch.proposer import HeuristicProposer, LLMProposer, spec_key
from mlresearch.reporter import render_markdown
from mlresearch.search_space import default_spec, mutate_spec, sample_spec, validate_spec
from mlresearch.types import Experiment, Hypothesis, LedgerEntry, Result


@pytest.fixture(scope="module")
def wine():
    bundle = load_wine()
    return train_test_split(
        bundle.data, bundle.target, test_size=0.3, random_state=42, stratify=bundle.target
    )


@pytest.fixture(scope="module")
def executor(wine):
    X_train, _, y_train, _ = wine
    # Small protocol: these tests check mechanics, not measurement precision.
    return Executor(X_train, y_train, n_splits=4, n_repeats=2)


def make_result(scores: list[float], n_params: int = 10) -> Result:
    return Result(
        experiment_id="x", ok=True,
        val_mean=float(np.mean(scores)), val_std=float(np.std(scores)),
        fold_scores=scores, n_params=n_params,
    )


# ======================================================== the statistics


def test_paired_t_test_matches_scipy_when_available():
    """The hand-rolled t-test must agree with the reference implementation."""
    scipy_stats = pytest.importorskip("scipy.stats")
    rng = random.Random(0)
    for _ in range(50):
        n = rng.choice([5, 8, 20, 40])
        a = [rng.gauss(0.9, 0.03) for _ in range(n)]
        b = [rng.gauss(0.88, 0.03) for _ in range(n)]
        _, t_stat, p_value = paired_t_test(a, b)
        ref_t, ref_p = scipy_stats.ttest_rel(a, b)
        assert t_stat == pytest.approx(ref_t, abs=1e-9)
        assert p_value == pytest.approx(ref_p, abs=1e-9)


def test_paired_t_test_handles_degenerate_input():
    assert paired_t_test([0.9], [0.8]) == (0.0, 0.0, 1.0)       # too few
    assert paired_t_test([0.9, 0.8], [0.9]) == (0.0, 0.0, 1.0)  # mismatched
    # Identical on every fold: no difference, not significant.
    mean_diff, _, p_value = paired_t_test([0.9, 0.8], [0.9, 0.8])
    assert mean_diff == 0.0 and p_value == 1.0


# ============================================================ the arbiter


def test_first_result_becomes_the_baseline():
    decision = Arbiter().judge(make_result([0.9, 0.91, 0.89]), None)
    assert decision.verdict == "accepted"
    assert "baseline" in decision.reason


def test_a_failed_experiment_is_never_accepted():
    decision = Arbiter().judge(Result("x", ok=False, error="boom"), make_result([0.9] * 5))
    assert decision.verdict == "failed"


def test_a_worse_result_is_rejected():
    incumbent = make_result([0.90, 0.91, 0.89, 0.92, 0.90])
    challenger = make_result([0.85, 0.86, 0.84, 0.87, 0.85])
    decision = Arbiter().judge(challenger, incumbent)
    assert decision.verdict == "rejected"
    assert decision.mean_diff < 0


def test_pure_noise_is_not_accepted_as_an_improvement():
    """The central claim of the design.

    Two pipelines of identical true quality, differing only by noise. A greedy
    `>` rule accepts whichever happens to be higher roughly half the time. The
    arbiter must almost never accept.
    """
    rng = random.Random(42)
    accepted = 0
    trials = 300

    for _ in range(trials):
        incumbent = make_result([rng.gauss(0.90, 0.03) for _ in range(15)])
        challenger = make_result([rng.gauss(0.90, 0.03) for _ in range(15)])
        if Arbiter(alpha=0.05).judge(challenger, incumbent).verdict == "accepted":
            accepted += 1

    false_positive_rate = accepted / trials
    # One-sided at alpha=0.05, so ~2.5% is the expectation; allow headroom for
    # the min_effect filter and sampling error, but it must be far below the
    # ~50% a greedy rule would produce.
    assert false_positive_rate < 0.08, (
        f"false-positive rate {false_positive_rate:.3f} is too high; the gate is not working"
    )


def test_a_real_effect_is_detected():
    """The gate must not be so strict that it refuses genuine improvements."""
    rng = random.Random(7)
    detected = 0
    trials = 100

    for _ in range(trials):
        incumbent = make_result([rng.gauss(0.85, 0.02) for _ in range(15)])
        # A clear 5-point improvement.
        challenger = make_result([rng.gauss(0.90, 0.02) for _ in range(15)])
        if Arbiter().judge(challenger, incumbent).verdict == "accepted":
            detected += 1

    assert detected / trials > 0.90, f"only detected {detected}/{trials} real improvements"


def test_improvement_below_the_minimum_effect_is_refused():
    incumbent = make_result([0.900] * 12)
    challenger = make_result([0.9005] * 12)  # perfectly consistent, but trivial
    decision = Arbiter(min_effect=0.002).judge(challenger, incumbent)
    assert decision.verdict == "rejected"
    assert "minimum effect" in decision.reason


def test_significant_but_tiny_improvement_is_inconclusive_not_accepted():
    """Scores that differ by a hair with high variance: recorded, not promoted."""
    rng = random.Random(3)
    incumbent = make_result([rng.gauss(0.90, 0.04) for _ in range(10)])
    challenger = make_result([s + 0.004 + rng.gauss(0, 0.04) for s in incumbent.fold_scores])
    decision = Arbiter(alpha=0.01, min_effect=0.002).judge(challenger, incumbent)
    assert decision.verdict in ("inconclusive", "rejected")
    assert decision.verdict != "accepted"


def test_a_much_larger_model_needs_a_bigger_win():
    """Complexity has to pay for itself."""
    incumbent = make_result([0.90 + i * 0.001 for i in range(12)], n_params=20)
    challenger = make_result([0.905 + i * 0.001 for i in range(12)], n_params=20_000)
    decision = Arbiter(min_effect=0.002, prefer_simpler=True).judge(challenger, incumbent)
    assert decision.verdict == "rejected"
    assert "capacity" in decision.reason


# =========================================================== search space


def test_default_spec_scales_scale_sensitive_models():
    assert default_spec("svc")["preprocess"] == "standard"
    assert default_spec("knn")["preprocess"] == "standard"
    # Tree ensembles do not need it.
    assert default_spec("forest")["preprocess"] == "none"


@pytest.mark.parametrize("bad,expected", [
    ({"model": "nope"}, "unknown model"),
    ({"model": "logreg", "preprocess": "magic"}, "unknown preprocess"),
    ({"model": "logreg", "params": {"not_a_param": 1}}, "no tunable parameter"),
    ({"model": "logreg", "params": "nope"}, "params must be an object"),
    ("not a dict", "spec must be an object"),
])
def test_validate_spec_rejects_malformed_proposals(bad, expected):
    ok, why = validate_spec(bad)
    assert not ok and expected in why


def test_validate_spec_error_names_the_alternatives():
    """A model that proposed a bad param must be told what IS available, or the
    next proposal repeats the mistake."""
    _, why = validate_spec({"model": "svc", "params": {"n_estimators": 100}})
    assert "kernel" in why and "gamma" in why


def test_sampled_and_mutated_specs_are_always_buildable():
    rng = random.Random(0)
    for _ in range(250):
        spec = sample_spec(rng)
        assert validate_spec(spec)[0]
        build_pipeline(spec)                     # must not raise
        mutated = mutate_spec(rng, spec, rng.choice([1, 2, 3]))
        assert validate_spec(mutated)[0]
        build_pipeline(mutated)


def test_mutation_changes_something():
    rng = random.Random(1)
    spec = default_spec("forest")
    # Defaults have empty params, so a mutation must introduce one or change prep.
    assert spec_key(mutate_spec(rng, spec, 1)) != spec_key(spec)


# =============================================================== executor


def test_executor_returns_paired_fold_scores(executor):
    experiment = Experiment("e1", Hypothesis("s", "r"), default_spec("logreg"))
    result = executor.run(experiment)
    assert result.ok
    assert len(result.fold_scores) == 8          # 4 splits x 2 repeats
    assert 0.0 <= result.val_mean <= 1.0
    assert result.val_mean == pytest.approx(np.mean(result.fold_scores))


def test_every_experiment_sees_identical_folds(executor):
    """Without this, the leaderboard compares measurements taken with different
    rulers and paired testing is invalid."""
    spec = default_spec("logreg")
    first = executor.run(Experiment("a", Hypothesis("s", "r"), spec))
    second = executor.run(Experiment("b", Hypothesis("s", "r"), dict(spec)))
    assert first.fold_scores == second.fold_scores


def test_a_bad_spec_is_a_result_not_an_exception(executor):
    """A study must survive a malformed proposal."""
    result = executor.run(
        Experiment("bad", Hypothesis("s", "r"), {"model": "does_not_exist"})
    )
    assert not result.ok and "spec" in result.error


def test_an_estimator_failure_is_captured(executor):
    """svc with a negative C is valid JSON and an invalid model."""
    result = executor.run(
        Experiment("bad2", Hypothesis("s", "r"),
                   {"model": "svc", "preprocess": "standard", "params": {"C": -1.0}})
    )
    assert not result.ok and result.error


def test_build_pipeline_rejects_unknown_components():
    with pytest.raises(SpecError):
        build_pipeline({"model": "nope"})
    with pytest.raises(SpecError):
        build_pipeline({"model": "logreg", "preprocess": "nope"})


def test_holdout_scoring_works(executor, wine):
    _, X_test, _, y_test = wine
    experiment = Experiment("h", Hypothesis("s", "r"), default_spec("logreg"))
    score = executor.score_holdout(experiment, X_test, y_test)
    assert 0.0 <= score <= 1.0


# ============================================================== proposer


def test_heuristic_explores_every_family_before_repeating():
    proposer = HeuristicProposer(seed=0)
    history: list[dict] = []
    families = []

    for _ in range(12):
        spec, _ = proposer.propose(history, 1)[0]
        families.append(spec["model"])
        history.append({"id": f"e{len(history)}", "spec": spec, "ok": True,
                        "val_mean": 0.8, "val_std": 0.02})

    assert len(set(families)) == 12, "the explore phase must cover 12 distinct families"


def test_heuristic_does_not_repeat_a_spec():
    proposer = HeuristicProposer(seed=3)
    history: list[dict] = []
    for _ in range(60):
        spec, _ = proposer.propose(history, 1)[0]
        history.append({"id": "x", "spec": spec, "ok": True, "val_mean": 0.8, "val_std": 0.01})
    keys = [spec_key(row["spec"]) for row in history]
    # Allow a small number of collisions once the space saturates.
    assert len(set(keys)) >= 55


def test_heuristic_exploits_the_better_family():
    """Given a clear winner, local search should concentrate there."""
    proposer = HeuristicProposer(seed=0, explore_fraction=0.0)
    history = [
        {"id": "a", "spec": default_spec(m), "ok": True,
         "val_mean": 0.95 if m == "forest" else 0.70, "val_std": 0.01}
        for m in HeuristicProposer.EXPLORE_ORDER
    ]
    picks = [proposer.propose(history, 1)[0][0]["model"] for _ in range(30)]
    assert picks.count("forest") > 15, f"expected concentration on forest, got {set(picks)}"


def test_every_hypothesis_carries_a_rationale():
    """The ledger must be auditable, which means no proposal without a reason."""
    proposer = HeuristicProposer(seed=0)
    history: list[dict] = []
    for _ in range(15):
        spec, hypothesis = proposer.propose(history, 1)[0]
        assert hypothesis.statement and len(hypothesis.rationale) > 20
        history.append({"id": "x", "spec": spec, "ok": True, "val_mean": 0.8, "val_std": 0.01})


class BrokenProvider:
    name = "broken"

    def __init__(self, reply: str) -> None:
        self.reply = reply

    def complete(self, messages, tools=None, stream=False, on_text=None):
        from minicoder.types import Completion, Message, Usage
        return Completion(Message(role="assistant", content=self.reply), "stop", "x", Usage())


@pytest.mark.parametrize("reply", [
    "I think you should try a random forest!",     # no JSON
    '{"model": "nonexistent"}',                     # invalid model
    '{"model": "logreg", "params": {"bogus": 1}}',  # invalid param
    '{"model": "logreg"',                           # unbalanced
])
def test_llm_proposer_falls_back_instead_of_dying(reply):
    """A study must not end because a proposal was malformed."""
    proposer = LLMProposer(BrokenProvider(reply), HeuristicProposer(seed=1))
    spec, hypothesis = proposer.propose([], 1)[0]
    assert validate_spec(spec)[0]
    assert proposer.fallback_count == 1
    assert "fallback" in hypothesis.proposed_by


def test_llm_proposer_accepts_json_in_a_code_fence():
    reply = 'Here you go:\n```json\n{"model": "forest", "preprocess": "none", ' \
            '"params": {"n_estimators": 300}, "statement": "s", "rationale": "r"}\n```'
    proposer = LLMProposer(BrokenProvider(reply))
    spec, hypothesis = proposer.propose([], 1)[0]
    assert spec["model"] == "forest"
    assert spec["params"]["n_estimators"] == 300
    assert proposer.fallback_count == 0
    assert hypothesis.proposed_by == "llm"


# ================================================================= ledger


def test_ledger_persists_and_reloads(tmp_path):
    path = tmp_path / "l.jsonl"
    ledger = Ledger(path)
    for index in range(3):
        ledger.record(LedgerEntry(
            experiment=Experiment(f"e{index}", Hypothesis("s", "r"), default_spec("logreg")),
            result=make_result([0.9, 0.91]),
            verdict="accepted" if index == 0 else "rejected",
            reason="because",
        ))

    reloaded = Ledger.load(path)
    assert len(reloaded.entries) == 3
    assert len(reloaded.accepted()) == 1
    assert reloaded.entries[0].experiment.hypothesis.statement == "s"


def test_ledger_skips_a_torn_final_line(tmp_path):
    path = tmp_path / "l.jsonl"
    ledger = Ledger(path)
    ledger.record(LedgerEntry(
        Experiment("e0", Hypothesis("s", "r"), default_spec("logreg")),
        make_result([0.9]), "accepted", "r",
    ))
    with path.open("a") as handle:
        handle.write('{"experiment": {"id": "tr\n')
    assert len(Ledger.load(path).entries) == 1


def test_leaderboard_is_not_the_incumbent(tmp_path):
    """The two must be allowed to differ -- that difference is the finding."""
    ledger = Ledger(tmp_path / "l.jsonl")
    ledger.record(LedgerEntry(
        Experiment("low", Hypothesis("s", "r"), default_spec("logreg")),
        make_result([0.90] * 10), "accepted", "baseline",
    ))
    ledger.record(LedgerEntry(
        Experiment("high", Hypothesis("s", "r"), default_spec("mlp")),
        make_result([0.91] * 10), "inconclusive", "not distinguishable",
    ))
    assert ledger.best_observed().experiment.id == "high"
    assert [e.experiment.id for e in ledger.accepted()] == ["low"]


# =================================================================== loop


def test_a_full_study_runs_and_selects_something(executor, wine):
    _, X_test, _, y_test = wine
    config = StudyConfig(name="t", budget=6, out_dir=Path("/tmp/mlresearch-test"))
    loop = AutoResearchLoop(executor=executor, config=config)
    report = loop.run(holdout=(X_test, y_test))

    assert len(report.ledger.entries) == 6
    assert report.incumbent is not None
    assert report.holdout_score is not None
    assert report.selection_gap is not None
    # Every entry carries a verdict and a reason.
    for entry in report.ledger.entries:
        assert entry.verdict in ("accepted", "rejected", "inconclusive", "failed")
        assert entry.reason


def test_the_loop_never_touches_the_holdout_set(executor, wine):
    """The structural guarantee behind the final number.

    If the loop scored the test set during the search, every later decision
    would be contaminated. This asserts the only call happens after the loop.
    """
    _, X_test, _, y_test = wine
    original = executor.score_holdout

    experiments_seen = 0          # incremented as the search progresses
    scorings: list[int] = []      # experiments_seen at each holdout scoring

    def spy(experiment, X, y):
        scorings.append(experiments_seen)
        return original(experiment, X, y)

    executor.score_holdout = spy
    try:
        loop = AutoResearchLoop(
            executor=executor,
            config=StudyConfig(name="t2", budget=5, out_dir=Path("/tmp/mlresearch-test")),
        )

        def watch(kind, payload):
            nonlocal experiments_seen
            if kind == "experiment_done":
                experiments_seen += 1

        loop.on_event = watch
        loop.run(holdout=(X_test, y_test))
    finally:
        executor.score_holdout = original

    assert scorings, "the holdout must be scored once, at the end"

    # Every scoring must have happened AFTER all 5 experiments finished. A
    # scoring recorded at a lower count would mean the loop peeked mid-search,
    # which would contaminate every decision after it.
    assert all(count == 5 for count in scorings), (
        f"holdout was scored mid-search (at experiment counts {scorings}); "
        "the loop must never see the test set while searching"
    )

    # At most two: the selected incumbent, plus the greedy pick for the
    # method comparison. Never per-experiment, whatever the budget.
    assert len(scorings) <= 2, f"holdout scored {len(scorings)} times; at most 2 allowed"


def test_study_report_renders_markdown(executor, wine):
    _, X_test, _, y_test = wine
    loop = AutoResearchLoop(
        executor=executor,
        config=StudyConfig(name="t3", budget=5, out_dir=Path("/tmp/mlresearch-test")),
    )
    report = loop.run(holdout=(X_test, y_test))
    text = render_markdown(report)

    assert "# Autoresearch report" in text
    assert "Held-out test set" in text or "held-out" in text
    assert "Protocol" in text
    assert "Threats to validity" in text
    # The report must never present validation alone as the result.
    assert "Selection gap" in text or "selection gap" in text
