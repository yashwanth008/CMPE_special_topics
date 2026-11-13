# Issues found in the course materials

Found while doing the assignment, against `dlmastery/simple-coding-harness` at commit `fabd4c7`. Items 1-5 I checked by reading
the repo's files directly. Item 6 I could not check. None of this is meant as criticism: the course repo is a teaching draft, and these are
worth knowing before you cite its numbers.

| # | Where | Issue | Why it matters |
|---|---|---|---|
| 1 | Assignment link | The brief links `rsi/COURSE-MAP.md`. In the cloned repo that path does not exist; the file is `COURSE-MAP.md` at the repo root (theme 10 = Research Studio, labs 10.01-10.17). | Student links 404. |
| 2 | `12_october_2026_papers/02_second_order_rsi/demo.py` | `NaiveRSI.attempt_fix` succeeds with probability **0.3** and `SORSI.attempt_fix` with **0.5**, both hard-coded; the detector's output never changes which fix is chosen (a comment says "in full implementation..."). Lab 10.06 then says to *expect* ~+20 points. | The demo's "SO-RSI beats naive" is true by construction, so it is not evidence of the mechanism. Our `labs/lab_10_06` makes the improvement emerge (or not) from a real probe. |
| 3 | `.../01_budget_rsi/demo.py` | Held-out score is generated as `steering_count * 6 + noise`, so it is correlated with the proxy by construction; the "cost savings" block is `print` text with fixed numbers (e.g. "~88%"), not measured; no random seed is set, so outputs differ run to run; the "improvement over random" compares one selected edit with a mean of random draws. | The demo cannot show whether scoring helps. Our `labs/lab_10_03` uses real execution, matched budgets, 30 seeds and paired CIs. |
| 4 | Lab 10.04 | Asks you to print coefficients under names like `files_added`, `import_changes`. In the demo the 8 coordinates are `uniform(-1, 1)` random numbers, so those names are labels on noise. | Any "feature importance" read from it is meaningless. Ours uses 8 coordinates computed from a real unified diff. |
| 5 | Lab 10.15 | The RSI-Index is written `(initial - final) / (ideal - initial)`, which is negative for any improvement; the worked example in the same page gets `+0.5`, which needs `(final - initial) / (ideal - initial)`. | Sign error. `labs/lab_10_15` shows both. |
| 6 | `PAPER_SUMMARIES.md` | Contains specific numbers (e.g. "87.0% vs 84.2%" for Budget RSI) that I could not find in the arXiv abstract/HTML fragments I could retrieve. For AReaL-RSI, RSIFlow, RSIGym, Terminal-RSI, R2Orch and SwarmRSI I could not retrieve the papers at all. | Treat those as unverified. Docs in this repo mark paper-side claims as VERIFIED (from arXiv abstract pages) or UNVERIFIED (course summary only). |

## What I verified about the three papers implemented
* **Budget RSI**, arXiv:2610.29121 (Darzi, Balija, He; submitted 21 Oct 2026): linear readout on parent steering-split solve rate + 8 diff coordinates,
  96 calibration edits labelled on a 16-instance fit split, frozen coefficients, archive of 4, 24 keep steps, HGM Thompson-sampling baseline, steering splits 48/64.
* **SO-RSI**, arXiv:2610.05701 (Jiang, Vempaty, Jagmohan; submitted 5 Oct 2026): second-order diagnostic inquiry, probes + persistent inquiry memory;
  +21.8 (Lean 4) and +25.8 (Verus) held-out points over Naive RSI under matched 24-hour budgets; notes Naive RSI already does some diagnostic inquiry.
* **Self-HPO**, arXiv:2610.22791 (Wei, Yao, Peng et al., Microsoft Research): alternating H-step / P-step, policy as its own harness proposer, hard tasks as next search set;
  Qwen3.5-35B-A3B average 57.8% -> 64.8% across SWE-bench Verified / Multilingual / Pro.

Verification date: 12 Nov 2026, from arXiv abstract pages and search-result fragments (not the full PDFs).
