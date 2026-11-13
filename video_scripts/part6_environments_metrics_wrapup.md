# Part 6 - Environments, metrics, wrap-up (Labs 10.15, 10.16, 10.17) - ~8 min

## 0:00 Lab 10.15 - RSI-Index (2 min)  `python labs/lab_10_15_rsi_index.py`  (~30 s)
Show the **sign error** in the course's formula (`-0.5` vs `+0.5`), then the table of RSI-Index per arm. Say the four "benchmarks" are my skill groups and are equal-weighted.

## 2:00 Lab 10.16 - environments (2 min)  `python labs/lab_10_16_environments.py`  (~15 s)
`rsi_lab/services.py::Meter`: every capability is a service that charges one shared meter (the RSIGym idea). Show the budget-by-service bars: Budget RSI is 44% calibration labels; Self-HPO is about 43% H-step (probe, validation, mining); SO-RSI is 30% probes. This is why all comparisons are matched by construction.

## 4:00 Lab 10.17 - metrics (2 min)  `python labs/lab_10_17_metrics.py`
Four metrics, each with solves / useful when / limits. Highlight the one place my own claim was wrong: I expected selection optimism to grow with candidates compared; the data showed the same gap for every method, so it is distribution shift.

## 6:00 Wrap-up (2 min)
Table of three methods:
| Method | Mechanism reproduced? | Beat a fair baseline here? |
|---|---|---|
| Budget RSI | ranking yes | no (matched-budget HGM wins) |
| SO-RSI | yes | yes, but gap is smaller vs a fair baseline and costs ~30% of budget |
| Self-HPO | partly | no clear gain (+0.034, CI spans 0); overhead dominates at small budgets |
Then: what I would do next - replace the stub proposer with an LLM, move to a real benchmark, test other domains.

### Say this honestly
* Negative and null results are results; I report them with CIs.
