"""The executor: turns a spec into a trained, measured model.

This is where the autoresearch loop touches reality. Everything else proposes,
records and argues; this module actually fits estimators and returns numbers it
measured.

Two design decisions carry most of the weight:

1. REPEATED STRATIFIED K-FOLD, NOT A SINGLE SPLIT.
   A single train/validation split on a few hundred rows has a standard error
   large enough to swamp any real difference between two good pipelines. The
   loop would then spend its whole budget selecting noise. Repeated CV costs
   more compute per experiment and buys the only thing that matters: the
   ability to tell a real improvement from a lucky split.

2. EVERY FOLD SCORE IS KEPT.
   Returning only the mean throws away the information needed for a paired
   comparison later. Because every experiment is evaluated on the SAME folds
   (fixed seed), the arbiter can compare two pipelines fold-by-fold instead of
   comparing two summary statistics.
"""

from __future__ import annotations

import time
import warnings

import numpy as np
from sklearn.decomposition import PCA
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.ensemble import (
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.model_selection import RepeatedStratifiedKFold, cross_validate
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    MinMaxScaler,
    PowerTransformer,
    QuantileTransformer,
    StandardScaler,
)
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

from .types import Experiment, Result

# Keep sklearn's convergence chatter out of the research log; a model that fails
# to converge shows up as a worse score, which is the honest signal.
warnings.filterwarnings("ignore")

PREPROCESSORS = {
    "none": lambda: None,
    "standard": StandardScaler,
    "minmax": MinMaxScaler,
    "quantile": lambda: QuantileTransformer(output_distribution="normal", n_quantiles=100),
    "power": PowerTransformer,
    "pca": lambda: PCA(n_components=0.95, svd_solver="full"),
}

MODELS = {
    "logreg": LogisticRegression,
    "sgd": SGDClassifier,
    "svc": SVC,
    "knn": KNeighborsClassifier,
    "tree": DecisionTreeClassifier,
    "forest": RandomForestClassifier,
    "extratrees": ExtraTreesClassifier,
    "gboost": GradientBoostingClassifier,
    "histgboost": HistGradientBoostingClassifier,
    "mlp": MLPClassifier,
    "gnb": GaussianNB,
    "lda": LinearDiscriminantAnalysis,
}

# Params we always set unless the spec overrides them, so results are
# reproducible and no single experiment can hang the loop.
DEFAULTS = {
    "logreg": {"max_iter": 2000},
    "sgd": {"max_iter": 2000, "tol": 1e-3},
    "svc": {"cache_size": 200},
    "mlp": {"max_iter": 600},
    "forest": {"n_jobs": 1},
    "extratrees": {"n_jobs": 1},
    "knn": {"n_jobs": 1},
}


class SpecError(ValueError):
    """The spec names something the executor cannot build."""


def build_pipeline(spec: dict, seed: int = 0) -> Pipeline:
    """Construct an sklearn Pipeline from a declarative spec.

    Keeping construction declarative is what lets a language model propose an
    experiment safely: it emits JSON naming a preprocessor and a model, never
    code that gets executed. The blast radius of a bad proposal is a KeyError
    instead of arbitrary code running in the loop.
    """
    model_name = spec.get("model")
    if model_name not in MODELS:
        raise SpecError(f"unknown model {model_name!r}; available: {sorted(MODELS)}")

    prep_name = spec.get("preprocess", "none")
    if prep_name not in PREPROCESSORS:
        raise SpecError(f"unknown preprocess {prep_name!r}; available: {sorted(PREPROCESSORS)}")

    params = {**DEFAULTS.get(model_name, {}), **(spec.get("params") or {})}

    estimator_cls = MODELS[model_name]
    # Only pass random_state to estimators that accept it.
    if "random_state" in estimator_cls().get_params():
        params.setdefault("random_state", seed)

    try:
        estimator = estimator_cls(**params)
    except TypeError as exc:
        raise SpecError(f"{model_name} rejected params {params}: {exc}") from exc

    steps = []
    prep = PREPROCESSORS[prep_name]()
    if prep is not None:
        steps.append(("prep", prep))
    steps.append(("model", estimator))
    return Pipeline(steps)


def count_params(pipeline: Pipeline, n_features: int) -> int:
    """A rough capacity proxy, used to prefer the simpler of two tied models."""
    model = pipeline.named_steps["model"]
    if hasattr(model, "coef_"):
        return int(np.asarray(model.coef_).size)
    for attr in ("n_estimators", "n_neighbors"):
        if hasattr(model, attr):
            return int(getattr(model, attr)) * n_features
    return n_features


class Executor:
    """Fits and scores one experiment against a fixed CV protocol.

    The protocol is fixed at construction and never changes during a study. If
    the folds moved between experiments, the leaderboard would be comparing
    measurements taken with different rulers.
    """

    def __init__(
        self,
        X,
        y,
        n_splits: int = 5,
        n_repeats: int = 3,
        scoring: str = "balanced_accuracy",
        cv_seed: int = 12345,
        budget_seconds: float = 60.0,
    ) -> None:
        self.X = np.asarray(X)
        self.y = np.asarray(y)
        self.scoring = scoring
        self.budget_seconds = budget_seconds
        self.cv = RepeatedStratifiedKFold(
            n_splits=n_splits, n_repeats=n_repeats, random_state=cv_seed
        )
        self.n_evaluations = 0

    def run(self, experiment: Experiment) -> Result:
        """Evaluate one experiment. Never raises -- a failure is a Result.

        A crashed experiment is data: the loop should record it, learn from it,
        and keep going. Propagating the exception would end a study because one
        proposal had an invalid hyper-parameter.
        """
        self.n_evaluations += 1
        started = time.perf_counter()

        try:
            pipeline = build_pipeline(experiment.spec, experiment.seed)
        except SpecError as exc:
            return Result(experiment.id, ok=False, error=f"spec: {exc}")

        try:
            scores = cross_validate(
                pipeline,
                self.X,
                self.y,
                cv=self.cv,
                scoring=self.scoring,
                n_jobs=1,
                error_score="raise",
                return_estimator=False,
            )
            fold_scores = [float(s) for s in scores["test_score"]]
        except Exception as exc:  # noqa: BLE001 - any estimator failure is data
            return Result(
                experiment.id,
                ok=False,
                error=f"{type(exc).__name__}: {str(exc)[:200]}",
                fit_seconds=time.perf_counter() - started,
            )

        elapsed = time.perf_counter() - started

        # Capacity proxy needs a fitted model; fit once on everything.
        try:
            pipeline.fit(self.X, self.y)
            n_params = count_params(pipeline, self.X.shape[1])
        except Exception:  # noqa: BLE001
            n_params = self.X.shape[1]

        result = Result(
            experiment_id=experiment.id,
            ok=True,
            val_mean=float(np.mean(fold_scores)),
            val_std=float(np.std(fold_scores)),
            fold_scores=fold_scores,
            fit_seconds=elapsed,
            n_params=n_params,
        )

        # Over-budget experiments still return their score, flagged in the
        # error field so the proposer can learn to avoid that region.
        if elapsed > self.budget_seconds:
            result.error = f"over budget: {elapsed:.1f}s > {self.budget_seconds:.1f}s"
        return result

    def score_holdout(self, experiment: Experiment, X_test, y_test) -> float:
        """Fit on all training data and score the held-out set. Called ONCE.

        This is the only function in the package that touches the test set, and
        the loop is not allowed to call it. That restriction is the whole point:
        a number you optimised against is not an estimate of generalisation.
        """
        from sklearn.metrics import balanced_accuracy_score, accuracy_score

        pipeline = build_pipeline(experiment.spec, experiment.seed)
        pipeline.fit(self.X, self.y)
        predictions = pipeline.predict(np.asarray(X_test))
        metric = balanced_accuracy_score if self.scoring == "balanced_accuracy" else accuracy_score
        return float(metric(np.asarray(y_test), predictions))
