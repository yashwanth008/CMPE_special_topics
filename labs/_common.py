"""Shared bootstrap for lab scripts: makes `rsi_lab` importable when run from anywhere."""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
DOCS = os.path.join(ROOT, "docs")
os.makedirs(DOCS, exist_ok=True)

import numpy as np  # noqa: E402
from rsi_lab.stats import (FINAL_SEEDS, banner, fmt_ci, load, mean_sem, paired_ci, save)  # noqa: E402,F401

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt  # noqa: F401
except Exception:                                                     # figures are optional
    plt = None

FIG = os.path.join(ROOT, "results", "figures")
os.makedirs(FIG, exist_ok=True)
