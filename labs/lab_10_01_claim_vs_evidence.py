"""Lab 10.01 - Distinguish CLAIM from EVIDENCE (Budget RSI, arXiv:2610.29121).

Writes docs/10.01_claim_evidence_analysis.md.  Paper-side facts are limited to what was retrievable (the arXiv
abstract page and fragments of the HTML version); anything we could not confirm is marked UNVERIFIED.
Measured side comes from lab 10.03/10.04/10.05 results.
"""
from _common import *  # noqa
r3, r4, r5 = load("lab_10_03.json"), load("lab_10_04.json"), load("lab_10_05.json")
assert r3 and r4 and r5, "run labs 10.03-10.05 first (run_all.sh does)"
R = r3["res"]
def ci(a, b):
    from rsi_lab.stats import paired_ci
    m, lo, hi = paired_ci(R[a]["tests"], R[b]["tests"]); return f"{m:+.3f} [{lo:+.3f}, {hi:+.3f}]"
md = f"""# 10.01 Claim vs evidence - Budget RSI (arXiv:2610.29121, Darzi, Balija, He; submitted 21 Oct 2026)

**Sources actually read:** the arXiv abstract page and fragments of the HTML version. I did *not* read the full tables, so
figures marked UNVERIFIED are carried over from the course repo's summary and may be wrong.

## Headline vs. what was measured vs. what is untested
| # | Claim as stated | What supports it (paper side) | Conditions that limit it | What our laptop adaptation preserves / changes |
|---|---|---|---|---|
| 1 | A linear readout on the parent's steering-split solve rate plus eight diff coordinates, fitted from 96 scaffold edits labelled on a 16-instance fit split and then **frozen**, can rank proposed edits before they are evaluated. | Method description in the abstract/HTML: one readout per run, coefficients fixed through 24 keep steps, archive of four nodes; steering split = 48 (HumanEval+) / 64 (Polyglot) instances. | Coding agent = GPT-4o on two benchmarks; the 8 coordinates are the paper's own diff features. | Preserved: frozen linear readout, 96 calibration edits, archive of 4, 24 keep steps, 8 proposals/step. Changed: edits are patches to a parser (not an LLM rewriting a scaffold); diff coordinates are our 8 real unified-diff counts; fit/steering = 24/80. |
| 2 | Under **matched checker-evaluation budgets** (readout & ablation: 96 calibration edits + 24 children; HGM selection: 144 children on Polyglot, 176 on HumanEval+) the readout is competitive or best. | Budget-matching statement in the HTML; "on HumanEval+ with GPT-4o the readout is the highest mean". Course summary says 87.0% vs 84.2% - **UNVERIFIED**. | One model, two benchmarks; I could not check variance or significance. | We matched budgets in instance-evaluations. Result here: readout minus HGM-matched = **{ci('readout','hgm_matched')}** (held-out, 30 seeds): the claim did **not** carry over to our testbed. |
| 3 | Scoring *before* running saves evaluation cost without losing selection quality. | Cost accounting in the abstract; the readout never evaluates rejected proposals. | Calibration cost is paid per run. | In our accounting calibration was **{100 * r3['calibration_cost'] / R['readout']['cost']:.0f}%** of the readout method's cost. Mechanism check: the top-scored edit beat its parent {r4['within_parent']['8 diff coords (paper)']['top']:.0%} of the time vs {r4['within_parent']['8 diff coords (paper)']['rand']:.0%} for a random pick - the scorer *does* rank, but not enough to pay for itself. |

## What the paper does not (as far as I can see) test, and what we did about it
* **Does a frozen readout transfer across runs?** We calibrated once on another world and reused it: readout-amortized vs HGM at the same search-only budget -> see lab 10.05 (no advantage).
* **Are the 8 coordinates sufficient?** Our readout cannot tell `digits_stripper` (catastrophic) from `collapse_spaces` (harmless): identical diff coordinates, identical score (lab 10.03 walk-through).
* **Do richer features help?** Adding an execution canary improved within-parent ranking ({r5['A paper-8']['rho']:.2f} -> {r5['B +canary']['rho']:.2f} Spearman) but did not improve end-to-end held-out accuracy; a duplicate-edit flag did not reduce wasted expansions ({r5['B +canary']['dup_rate']:.2f} -> {r5['C +canary+dup']['dup_rate']:.2f}).

## Why a laptop adaptation cannot prove the headline
Different proposer, different data, different scale, one seed family. It can show a mechanism *works at ranking level* (it does) and show
where it stops paying (it does not at our cost accounting). It cannot confirm or refute the GPT-4o numbers.

## Quiz answers (own words)
**Q1.** Can the paper claim linear-readout scoring works for all code-editing tasks? No - it evaluated one model on two benchmarks.
**Q2.** Why synthetic edits in the course demo? To run without the benchmark and model. Caveat found while auditing: the course's demo generates
`held_out = 6 x steering + noise`, so held-out is correlated with the proxy *by construction*, and its "88% cost reduction" is hand-written text, not measured.
"""
open(os.path.join(DOCS, "10.01_claim_evidence_analysis.md"), "w").write(md)
print(md)
