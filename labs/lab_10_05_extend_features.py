"""Lab 10.05 - Extend the scorer: does better feature engineering help?

Course lab asks: adapt the scorer to your own editing task, observe that feature choice and
training-set size matter, and that if success is not predicted by the features the scorer is
no better than random.  Our task is already the parser task; the extension experiments are:

   A. paper features (parent rate + 8 diff coordinates)
   B. + canary   : one cheap EXECUTION coordinate (a 4-line smoke test of the child)
   C. + canary + duplicate flag : a free text check "is this edit a no-op re-application?"
   D. amortized  : calibrate ONCE on a different world and reuse (tests 'frozen readout transfers')

HYPOTHESES WRITTEN BEFORE THE FINAL RUN (after seeing dev-seed results; dev seeds != final seeds):
   H1 canary improves within-parent ranking.   H2 the duplicate flag cuts wasted expansions.
We report whether each held on the fresh seeds, including when they did not.
"""
from _common import *  # noqa
import random

from rsi_lab.data import make_world
from rsi_lab.methods import budget_rsi as B
from rsi_lab.scaffold import LIBRARY, base_source, evaluate, is_duplicate
from rsi_lab.services import Meter

variants = {"A paper-8": B.feats_paper, "B +canary": B.feats_with_canary, "C +canary+dup": B.feats_extended}
out, runs = {}, {}
banner("10.05 feature-set comparison over 30 fresh seeds")
for name, ff in variants.items():
    R = [B.run_all_methods(s, feat_fn=ff) for s in FINAL_SEEDS]
    runs[name] = R
    P = [B.within_parent_precision(s, ff) for s in FINAL_SEEDS]
    # duplicate rate among expansions chosen by the readout
    dups = []
    for s in FINAL_SEEDS[:15]:
        w = make_world(s); rng = random.Random(s); ro, _, _ = B.calibrate(w, rng, Meter(), ff)
        archive = [B.Node(base_source(False), 0.3, 0)]
        n = tot = 0
        for step in range(1, 25):
            props = []
            for i in range(8):
                p = archive[i % len(archive)]
                props.append((p, LIBRARY[rng.choice(list(LIBRARY))].apply(p.src)))
            sc = [ro.score(ff(p.src, c, p.steer)) for p, c in props]
            p, c = props[int(np.argmax(sc))]
            n += is_duplicate(p.src, c); tot += 1
            archive_node = B.Node(c, evaluate(c, w.steer).score, step); B._insert(archive, archive_node)
        dups.append(n / tot)
    out[name] = dict(test=mean_sem([r["readout"]["test"] for r in R]),
                     hgm=mean_sem([r["hgm_matched"]["test"] for r in R]),
                     amort=mean_sem([r["readout_amortized"]["test"] for r in R]),
                     hgm_small=mean_sem([r["hgm_search_budget"]["test"] for r in R]),
                     cost=float(np.mean([r["readout"]["cost"] for r in R])),
                     precision=float(np.nanmean([p["top"] for p in P])),
                     rho=float(np.nanmean([p["rho"] for p in P])),
                     rand_precision=float(np.nanmean([p["rand"] for p in P])),
                     dup_rate=float(np.mean(dups)))
print(f"{'features':16s} {'readout test':>13s} {'HGM matched':>12s} {'cost':>6s} {'P(top>parent)':>14s} {'rho':>5s} {'dup picks':>10s}")
for k, v in out.items():
    print(f"{k:16s} {v['test'][0]:7.3f}±{v['test'][1]:.3f} {v['hgm'][0]:12.3f} {v['cost']:6.0f} {v['precision']:14.2f} {v['rho']:5.2f} {v['dup_rate']:10.2f}")
print(f"(random pick beats parent {out['A paper-8']['rand_precision']:.2f} of the time)")

banner("10.05 hypotheses")
a, b, c = [out[k] for k in variants]
print(f"H1 canary improves within-parent Spearman: {a['rho']:.2f} -> {b['rho']:.2f}  => {'SUPPORTED' if b['rho'] > a['rho'] + 0.03 else 'NOT supported'}")
print(f"H2 duplicate flag cuts wasted expansions : {b['dup_rate']:.2f} -> {c['dup_rate']:.2f}  => {'SUPPORTED' if c['dup_rate'] < b['dup_rate'] - 0.05 else 'NOT supported'}")
print("\nend-to-end held-out, paired vs HGM-matched:")
for k in variants:
    print(f"  {k:16s} readout - HGM = " + fmt_ci([r['readout']['test'] for r in runs[k]], [r['hgm_matched']['test'] for r in runs[k]]))
print("\namortized readout (calibrated on another world) vs HGM at the same search-only budget:")
for k in variants:
    print(f"  {k:16s} " + fmt_ci([r['readout_amortized']['test'] for r in runs[k]], [r['hgm_search_budget']['test'] for r in runs[k]]))
save("lab_10_05.json", out)
print("\nTAKEAWAY: if the features cannot distinguish a good edit from a plausible-looking broken one, scoring cannot rescue the search - exactly the course's Q1 for this lab.")
