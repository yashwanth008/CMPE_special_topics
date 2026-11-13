"""Lab 10.02 - Audit October-2026 papers with the course template (changed object / feedback / protocol / budget / untested).

Writes docs/10.02_paper_audits.md for the THREE methods this assignment implements.  Paper-side facts come
from arXiv abstract pages and snippets retrieved on 2026-11-12; items we could not verify are marked.
"""
from _common import *  # noqa
l3, l6, l14, l7 = load("lab_10_03.json"), load("lab_10_06.json"), load("lab_10_14.json"), load("lab_10_07.json")
assert l3 and l6 and l14 and l7, "run labs first"
R = l3["res"]
p8, nb8, so8 = (l6["planted"]["8000"][k] for k in ("naive", "naive+blind", "so_rsi"))
hp = l14["12000"]
md = f"""# 10.02 Paper audits (template from the course)

## A. Budget RSI - arXiv:2610.29121
| Aspect | Paper's setup | Laptop adaptation | What is preserved |
|---|---|---|---|
| Changed object | a coding agent's scaffold (code edits selected before evaluation) | the source text of an ingredient parser, patched by real edits | edits are code diffs; selection happens before execution |
| Feedback type | parent's steering-split solve rate + 8 diff coordinates -> linear readout; labels from a 16-instance fit split | same inputs; fit split = 24, steering = 80 | one frozen linear readout per run |
| Evaluation protocol | steering split 48 (HumanEval+) / 64 (Polyglot); 24 keep steps; archive of 4; HGM Thompson selection baseline | held-out 400-instance test never used for selection; 30 fresh seeds, paired CIs | steering/held-out separation |
| Compute budget | equal checker evaluations across methods | equal instance evaluations (Meter) | matched-budget comparison |
| Untested assumption | the frozen readout stays useful (and pays for its calibration) | tested: readout minus HGM-matched = {R['readout']['test_mean'] - R['hgm_matched']['test_mean']:+.3f}; readout vs parent-rate ablation {R['readout']['test_mean'] - R['parent_rate']['test_mean']:+.3f} | - |
What a real test would need: the actual benchmark, the paper's proposer, and its diff features.

## B. SO-RSI - arXiv:2610.05701 (Jiang, Vempaty, Jagmohan; submitted 5 Oct 2026)
| Aspect | Paper's setup | Laptop adaptation | What is preserved |
|---|---|---|---|
| Changed object | the RSI *workflow* (outer RSI) for Lean 4 proving and Verus verified-code generation | parser source; the loop's edit choices | the improvement loop, not just the artifact |
| Feedback type | execution traces, executable diagnostic probes, persistent inquiry memory | accept/reject traces, a causal stage-ablation probe, an InquiryMemory | anomaly -> probe -> memory -> structural edit |
| Evaluation protocol | held-out pass rates under matched 24-hour search budgets; reported +21.8 (Lean) / +25.8 (Verus) points over Naive RSI | held-out accuracy at matched evaluation budget (probe cost charged), 30 seeds | matched budget, held-out |
| Compute budget | 24 h per comparison | 8000 instance evaluations | - |
| Untested assumption | the paper notes Naive RSI *already* does some diagnostic inquiry; SO-RSI makes it systematic | tested with a third arm: first-order + BLIND structural moves. At budget 8000 (planted start): naive {p8[0]:.3f}, naive+blind {nb8[0]:.3f}, SO-RSI {so8[0]:.3f} - diagnosis adds beyond merely having structural moves | - |
Caveats we found: our base scaffold contains a *planted* blocker; plain naive RSI cannot delete code it did not write, which inflates the headline gap
(+{so8[0]-p8[0]:.2f}); the fair gap is vs naive+blind (+{so8[0]-nb8[0]:.2f}). Probes cost ~{100*l7['probe_cost']/8000:.0f}% of the budget and {100*l7['inconclusive_frac']:.0f}% returned no blocker.

## C. Self-HPO - arXiv:2610.22791 (Wei, Yao, Peng et al., Microsoft Research)
| Aspect | Paper's setup | Laptop adaptation | What is preserved |
|---|---|---|---|
| Changed object | harness AND policy of a coding agent | harness = (guard, search set); policy = softmax over edits | two coupled objects, alternating |
| Feedback type | the policy analyses its own failures (H-step); RL under the chosen harness (P-step); hard tasks become the next search set | failure mining on a pool; REINFORCE; hard-set mode | self-proposed harness, evolving search set |
| Evaluation protocol | SWE-bench Verified / Multilingual / Pro; reported average 57.8% -> 64.8% (Qwen3.5-35B-A3B) | held-out accuracy, 4 conditions, budget sweep, 30 seeds | policy-only and harness-only ablations |
| Compute budget | RL training runs | instance evaluations; H-step probes charged | - |
| Untested assumption | joint gain exceeds the sum of parts (the paper's cross-evaluation reports compounding) | tested: synergy at 12000 = {hp['synergy'][0]:+.3f} [{hp['synergy'][1]:+.3f}, {hp['synergy'][2]:+.3f}] -> not super-additive here | - |
"""
open(os.path.join(DOCS, "10.02_paper_audits.md"), "w").write(md)
print(md)
