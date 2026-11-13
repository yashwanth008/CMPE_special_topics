# Part 4 - Self-HPO and adaptive workflows (Labs 10.12, 10.13, 10.14) - ~11 min

Paper: arXiv:2610.22791 (Self-HPO). RSIFlow-style routing per the course summary.

## 0:00 The idea (1 min)
H-step: the policy analyses its own failures and proposes harness candidates; P-step: RL under the chosen harness; hard tasks become the next search set. Claim: harness-only and policy-only are both worse than alternating.

## 1:00 Code walk - `rsi_lab/methods/self_hpo.py` (3 min)
* `Policy`: softmax over the edit library, **REINFORCE** update (not scripted).
* Harness = (guard on/off) x (search set all/hard/balanced); `run()` H-step: mine failures, build K=3 candidates, probe them on the **same sampled edits** (common random numbers), pick by gain per evaluation.
* Every probe is charged to the Meter.

## 4:00 Lab 10.14 - run it (3.5 min)  `python labs/lab_10_14_self_hpo.py`  (~80 s; say so and cut)
1. The budget-sweep table with **episodes completed** and **H-step share**: at small budgets the H-step overhead starves learning (at budget 4000 the score 0.234 means *no P-step ran at all*; explain that this is an overhead artefact, not "harness search is bad").
2. At 12000 and 20000: nothing distinguishable from no adaptation.
3. The **synergy** table: the paper's compounding claim is *not* reproduced here (not super-additive).

## 7:30 Lab 10.13 - adaptive workflow (2 min)  `python labs/lab_10_13_rsiflow_meta_agent.py`  (~25 s)
Show the meta-agent's routing log: it switches on dedup, then diagnose, then guard as waste is measured. Adaptive beats static - but **always-on beats adaptive** because of detection latency.

## 9:30 Lab 10.12 - compare (1 min)  open `docs/10.12_compare_workflow.md`
Read the "Prefer when" row.

## 10:30 Close (30 s)

### Say this honestly
* A bandit policy over 25 edits is a very small stand-in for RL on an LLM. "Not super-additive here" says nothing about the paper's setting.
* RSIFlow is implemented from the course summary only; I could not verify the paper.
