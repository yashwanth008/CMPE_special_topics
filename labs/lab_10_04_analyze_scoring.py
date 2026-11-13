"""Lab 10.04 - Analyse the scoring mechanism.

Course tasks: (1) print the learned coefficients, (2) rank features, (3) explain which matter.
Course questions we ANSWER WITH MEASUREMENTS:
   * what if only 4 diff coordinates are used?
   * how does the scorer change with fewer calibration edits?
   * does the scorer actually rank edits well *within* a parent (the decision that matters)?
Note: raw coefficients are not comparable across features of different scale, so we also report
standardised importance |w| * std(x).
"""
from _common import *  # noqa
import random

from rsi_lab.data import make_world
from rsi_lab.methods import budget_rsi as B
from rsi_lab.scaffold import FEATURE_NAMES
from rsi_lab.services import Meter

NAMES = ["parent_steer_rate"] + FEATURE_NAMES
banner("10.04 feature importance (averaged over 30 seeds)")
W, SD = [], []
for s in FINAL_SEEDS:
    ro, X, y = B.calibrate(make_world(s), random.Random(s), Meter())
    W.append(ro.w[1:]); SD.append(X.std(axis=0))
W, SD = np.array(W), np.array(SD)
imp = np.abs(W) * SD
rank = np.argsort(-imp.mean(0))
print(f"{'feature':24s} {'mean w':>8s} {'std(x)':>7s} {'|w|*std':>8s}  sign-stable")
for i in rank:
    stable = max((W[:, i] > 0).mean(), (W[:, i] < 0).mean())
    print(f"{NAMES[i]:24s} {W[:, i].mean():+8.3f} {SD[:, i].mean():7.3f} {imp[:, i].mean():8.3f}  {stable:.0%}")
print("\nlines_added is always 1 and lines_deleted always 0 for library edits (each edit adds one tagged line) -> these two columns are constant, their weights are unidentifiable (ridge sets ~0).")

banner("10.04 does the readout rank edits WITHIN a parent?  (60 trials x 30 seeds, 8 proposals each)")
rows = {}
for name, ff in [("8 diff coords (paper)", B.feats_paper), ("4 diff coords", B.feats_four)]:
    P = [B.within_parent_precision(s, ff) for s in FINAL_SEEDS]
    rows[name] = {k: float(np.nanmean([p[k] for p in P])) for k in ("top", "rand", "rho")}
    print(f"{name:24s} P(top-1 beats parent)={rows[name]['top']:.2f}   P(random pick beats parent)={rows[name]['rand']:.2f}   within-parent Spearman={rows[name]['rho']:.2f}")

banner("10.04 fewer calibration edits")
sweep = {}
for n_cal in (12, 24, 48, 96, 192):
    P = [B.within_parent_precision(s, B.feats_paper, n_cal=n_cal) for s in FINAL_SEEDS]
    sweep[n_cal] = {k: float(np.nanmean([p[k] for p in P])) for k in ("top", "rand", "rho")}
    cost = n_cal * 24 + 12 * 80
    print(f"n_cal={n_cal:4d}  calibration cost={cost:5d}  P(top beats parent)={sweep[n_cal]['top']:.2f}  Spearman={sweep[n_cal]['rho']:.2f}")
save("lab_10_04.json", dict(importance={NAMES[i]: float(imp[:, i].mean()) for i in range(len(NAMES))},
                            weights={NAMES[i]: float(W[:, i].mean()) for i in range(len(NAMES))},
                            within_parent=rows, n_cal_sweep=sweep))
print("\nREAD-OUT: the readout does pick improving edits more often than chance, but see lab 10.03 for whether that pays for its calibration cost.")
