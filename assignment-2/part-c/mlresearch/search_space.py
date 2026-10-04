"""The space of pipelines the loop may explore.

Declaring the space explicitly, rather than letting a model emit code, is the
safety boundary of this harness. A proposal is JSON naming a preprocessor, a
model and hyper-parameters; the worst a malformed proposal can do is fail
validation. Nothing the proposer says is ever executed as code.

The space is also the loop's prior knowledge. Including `scale_sensitive` means
the heuristic proposer knows that an SVM without scaling is a mistake worth
fixing, instead of discovering it by accident forty experiments in.
"""

from __future__ import annotations

import random
from typing import Any

PREPROCESSORS = ["none", "standard", "minmax", "quantile", "power", "pca"]

# Models whose geometry depends on feature scale. Pairing one of these with
# `preprocess: none` is a known bad configuration, not a hypothesis.
SCALE_SENSITIVE = {"svc", "knn", "mlp", "logreg", "sgd"}

# Tree ensembles ignore monotone feature scaling, so scaling them is wasted
# budget -- useful for the proposer to know, and worth stating in a report.
SCALE_INVARIANT = {"tree", "forest", "extratrees", "gboost", "histgboost"}

# The grid each model may be sampled from. Ranges are deliberately wide: a
# narrow grid produces a loop that looks well-behaved because it cannot reach
# anywhere interesting.
GRIDS: dict[str, dict[str, list[Any]]] = {
    "logreg": {
        "C": [0.01, 0.1, 0.5, 1.0, 5.0, 20.0, 100.0],
        "penalty": ["l2"],
    },
    "sgd": {
        "loss": ["hinge", "log_loss", "modified_huber"],
        "alpha": [1e-5, 1e-4, 1e-3, 1e-2],
    },
    "svc": {
        "C": [0.1, 1.0, 5.0, 20.0, 100.0],
        "kernel": ["rbf", "linear", "poly"],
        "gamma": ["scale", "auto", 0.01, 0.1],
    },
    "knn": {
        "n_neighbors": [1, 3, 5, 9, 15, 25],
        "weights": ["uniform", "distance"],
        "p": [1, 2],
    },
    "tree": {
        "max_depth": [2, 3, 5, 8, None],
        "min_samples_leaf": [1, 2, 5, 10],
        "criterion": ["gini", "entropy"],
    },
    "forest": {
        "n_estimators": [100, 300, 600],
        "max_depth": [None, 5, 10, 20],
        "min_samples_leaf": [1, 2, 4],
        "max_features": ["sqrt", "log2", None],
    },
    "extratrees": {
        "n_estimators": [100, 300, 600],
        "max_depth": [None, 8, 16],
        "min_samples_leaf": [1, 2, 4],
    },
    "gboost": {
        "n_estimators": [100, 200],
        "learning_rate": [0.03, 0.1, 0.2],
        "max_depth": [2, 3, 5],
        "subsample": [0.7, 1.0],
    },
    "histgboost": {
        "learning_rate": [0.03, 0.1, 0.2],
        "max_iter": [100, 300],
        "max_leaf_nodes": [15, 31, 63],
        "l2_regularization": [0.0, 1.0],
    },
    "mlp": {
        "hidden_layer_sizes": [(32,), (64,), (128,), (64, 32)],
        "alpha": [1e-4, 1e-3, 1e-2],
        "learning_rate_init": [1e-3, 1e-2],
    },
    "gnb": {"var_smoothing": [1e-9, 1e-7, 1e-5]},
    "lda": {"solver": ["svd", "lsqr"]},
}

MODELS = list(GRIDS)


def default_spec(model: str = "logreg") -> dict:
    """A sane, boring starting point. A baseline should not be clever."""
    return {
        "model": model,
        "preprocess": "standard" if model in SCALE_SENSITIVE else "none",
        "params": {},
    }


def sample_spec(rng: random.Random, model: str | None = None) -> dict:
    """Draw a random pipeline from the space."""
    model = model or rng.choice(MODELS)
    grid = GRIDS[model]
    params = {key: rng.choice(values) for key, values in grid.items()}

    if model in SCALE_SENSITIVE:
        # Still allow 'none' occasionally -- the loop should be able to
        # rediscover why scaling matters, and a report saying so is worth more
        # than a space that hid the question.
        preprocess = rng.choice(["standard", "standard", "minmax", "quantile", "power", "none"])
    else:
        preprocess = rng.choice(["none", "none", "standard", "pca"])

    return {"model": model, "preprocess": preprocess, "params": params}


def mutate_spec(rng: random.Random, spec: dict, strength: int = 1) -> dict:
    """Perturb one or two dimensions of an existing spec.

    Local search around a known-good configuration. Mutation is what makes the
    loop exploit; `sample_spec` is what makes it explore.
    """
    new = {
        "model": spec["model"],
        "preprocess": spec.get("preprocess", "none"),
        "params": dict(spec.get("params") or {}),
    }
    grid = GRIDS[new["model"]]

    for _ in range(strength):
        dimensions = list(grid) + ["preprocess"]
        choice = rng.choice(dimensions)
        if choice == "preprocess":
            options = (
                ["standard", "minmax", "quantile", "power"]
                if new["model"] in SCALE_SENSITIVE
                else ["none", "standard", "pca"]
            )
            new["preprocess"] = rng.choice([o for o in options if o != new["preprocess"]] or options)
        else:
            values = grid[choice]
            current = new["params"].get(choice)
            alternatives = [v for v in values if v != current] or values
            new["params"][choice] = rng.choice(alternatives)

    return new


def validate_spec(spec: dict) -> tuple[bool, str]:
    """Check a proposal before spending compute on it.

    Called on everything a language model proposes. Rejecting here costs
    microseconds; discovering it in `cross_validate` costs an experiment slot.
    """
    if not isinstance(spec, dict):
        return False, "spec must be an object"
    model = spec.get("model")
    if model not in GRIDS:
        return False, f"unknown model {model!r}; choose from {MODELS}"
    if spec.get("preprocess", "none") not in PREPROCESSORS:
        return False, f"unknown preprocess {spec.get('preprocess')!r}; choose from {PREPROCESSORS}"

    params = spec.get("params") or {}
    if not isinstance(params, dict):
        return False, "params must be an object"

    # Unknown hyper-parameter names are the most common model mistake, and the
    # error must name the alternatives or the next proposal repeats it.
    for key in params:
        if key not in GRIDS[model]:
            return False, (
                f"{model} has no tunable parameter {key!r} in this space; "
                f"available: {sorted(GRIDS[model])}"
            )
    return True, "ok"
