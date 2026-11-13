# Part 2 - Budget RSI (Labs 10.03, 10.04, 10.05) - ~11 min

Paper: arXiv:2610.29121 - score code edits *before* running them.

## 0:00 The idea (1 min)
Draw/say: a coding agent proposes 8 edits; evaluating all 8 is expensive; fit **one linear readout** on [parent steering rate + 8 diff coordinates] from 96 calibration edits, freeze it, and only evaluate the top-scored edit.

## 1:00 Code walk - `rsi_lab/methods/budget_rsi.py` (3 min)
* `calibrate()`: 96 (parent, edit) pairs, labelled on the 24-instance fit split, ridge fit. Show where cost is charged to the `Meter`.
* `search()`: archive of 4, 8 proposals/step, readout ranks, only the top is evaluated, 24 keep steps.
* `hgm_search()`: the Thompson-sampling baseline that must *evaluate* what it expands - and gets the matched budget.

## 4:00 Lab 10.03 - run it (3 min)  `python labs/lab_10_03_run_budget_rsi.py`  (~15 s)
Narrate the output top to bottom:
1. the frozen weights - parent rate dominates;
2. **`digits_stripper` and `collapse_spaces` get the same diff coordinates and the same score** - a catastrophic edit and a harmless one are indistinguishable to the readout. This is the key picture of the video;
3. the 30-seed table and the paired CIs: readout ~ parent-rate ablation (no clear difference), and **readout is worse than budget-matched HGM**;
4. calibration is 62% of the readout method's cost.

## 7:00 Lab 10.04 - analyse the mechanism (2 min)  `python labs/lab_10_04_analyze_scoring.py`  (~1 min; say so and cut)
* Importance table (standardised); note `lines_added`/`lines_deleted` are constant so unidentifiable.
* Within-parent precision: top-scored edit beats its parent about 43% of the time vs about 23% random -> the mechanism *works*.
* Calibration-size sweep and 4-vs-8 coordinates answer the course's "check your understanding" questions with numbers.

## 9:00 Lab 10.05 - extend (1.5 min)  `python labs/lab_10_05_extend_features.py`  (~80 s)
State the two hypotheses *before* showing the result: canary helps ranking (supported, small), duplicate flag cuts wasted expansions (not supported). End-to-end: neither fixes it.

## 10:30 Close (30 s)
"Scoring ranks edits better than chance but doesn't pay for its calibration here."

### Say this honestly
* This is **not** a refutation of the paper: different proposer, different data, one domain. It shows where the idea stops paying under my cost accounting.
* The amortised-readout variant (calibrate once on another world) ties HGM at the same search-only budget: no clear difference.
