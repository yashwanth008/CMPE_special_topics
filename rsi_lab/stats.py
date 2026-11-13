"""Small statistics helpers.  Every comparison in this repo is paired by seed (same world)."""
from __future__ import annotations

import json
import math
import os

import numpy as np

# Development used seeds 0-29.  EVERY reported number uses these fresh seeds.
FINAL_SEEDS = list(range(100, 130))
RESULTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "results")


def mean_sem(x):
    x = np.asarray(x, float)
    return float(np.nanmean(x)), float(np.nanstd(x, ddof=1) / math.sqrt(np.sum(~np.isnan(x))))


def paired_ci(a, b, n_boot=4000, seed=0):
    """Mean of (a-b) with a 95% bootstrap CI over seeds."""
    d = np.asarray(a, float) - np.asarray(b, float)
    rng = np.random.default_rng(seed)
    boots = [rng.choice(d, size=len(d), replace=True).mean() for _ in range(n_boot)]
    return float(d.mean()), float(np.percentile(boots, 2.5)), float(np.percentile(boots, 97.5))


def verdict(lo, hi):
    return "better" if lo > 0 else ("worse" if hi < 0 else "no clear difference")


def fmt_ci(a, b):
    m, lo, hi = paired_ci(a, b)
    return f"{m:+.3f} [{lo:+.3f}, {hi:+.3f}] -> {verdict(lo, hi)}"


def save(name: str, obj) -> str:
    os.makedirs(RESULTS_DIR, exist_ok=True)
    path = os.path.join(RESULTS_DIR, name)
    with open(path, "w") as f:
        json.dump(obj, f, indent=2, default=lambda o: o.tolist() if hasattr(o, "tolist") else str(o))
    return path


def load(name: str):
    path = os.path.join(RESULTS_DIR, name)
    return json.load(open(path)) if os.path.exists(path) else None


def banner(title: str):
    print("\n" + "=" * 78 + f"\n{title}\n" + "=" * 78)
