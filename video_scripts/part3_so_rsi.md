# Part 3 - SO-RSI (Labs 10.06, 10.07, 10.08) - ~11 min

Paper: arXiv:2610.05701 - investigate *why* failures happen before patching.

## 0:00 The idea (1 min)
First-order RSI patches symptoms and can thrash. SO-RSI watches the trace for three anomalies (recurrence, opposing edits, expectation mismatch), runs an executable probe, keeps an inquiry memory, then makes a structural edit.

## 1:00 Code walk - `rsi_lab/methods/so_rsi.py` (3 min)
* `FirstOrderAgent`: symptom-first proposer; note it **cannot delete code it did not write**.
* `AnomalyDetector`: the three definitions. Say them out loud.
* `causal_probe`: "would the edit that keeps failing work if stage S were absent?" - remove S, re-apply the edit, test on the stuck category.
* `run_rsi`: probe cost is charged to the same budget.

## 4:00 Lab 10.06 - run it (3.5 min)  `python labs/lab_10_06_run_so_rsi.py`  (~2 min; say so and cut)
1. The narrated single run: show an anomaly, a **PROBE ... blocker=punct_stripper**, then the compound edit `remove:punct_stripper+...` being accepted. Also point at an *emergent* blocker (e.g. `mixed_pattern_drops_whole`) the agent created itself.
2. The three-arm table. Say: "naive vs SO-RSI looks huge, but that gap is partly rigged by construction - naive has no way to remove the blocker. The fair comparison is **naive+blind**, a first-order agent that can also remove stages but without diagnosis. SO-RSI still wins; the gap is smaller."
3. Clean-start control: advantage persists because the loop creates its own blockers.
4. Overhead: probes consume about 30% of the budget.

## 7:30 Lab 10.07 - probes (2 min)  `python labs/lab_10_07_analyze_probes.py`  (~20 s)
Walk the anomaly table. Planted blocker named in 29/30 runs; 90% of probes return nothing; **opposing anomalies never launched a probe** (say this limitation).

## 9:30 Lab 10.08 - apply to debugging (1 min)  `python labs/lab_10_08_apply_debugging.py`
Five fix attempts fail; the recurrence detector fires; the probe runs the *reference* implementation on the fixture and shows the test setup is wrong.

## 10:30 Close (30 s)

### Say this honestly
* The planted blocker is my design choice. The paper's setting (Lean/Verus workflows) is not reproduced.
* The probe is hand-written; in the paper the agent writes its own probes.
