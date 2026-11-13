# Part 1 - Problem, testbed, and reading papers critically (Labs 10.01, 10.02) - ~10 min

## 0:00 Hook (45 s)
"Recursive self-improvement is a loop where a system edits the thing that produces its own results. In this assignment I implement three October-2026 RSI methods - **Budget RSI**, **SO-RSI** and **Self-HPO** - on one concrete problem and measure whether they work on it."
Show the repo tree (`ls`), then `docs/COURSE_MATERIAL_ISSUES.md` title only.

## 0:45 The problem I chose (2 min)
Open `rsi_lab/data.py`. Say: "The task is parsing messy recipe lines: `1½ cups flour, sifted` becomes quantity 1.5, unit cup, item flour."
* Show the 11 categories (`CATS`) and the four splits: fit 24, steering 80, pool 120, **held-out test 400** (never used for selection; different category mix).
* Why this problem: exact-match gold labels, so no LLM judge; the thing being improved is *real source code*; fast enough to run hundreds of seeds on a laptop.

## 2:45 The object that RSI improves (2.5 min)
Open `rsi_lab/scaffold.py`.
* Show `_BASE` (a deliberately weak parser) and the marked regions `# <<EDIT:...>>`.
* Show `LIBRARY`: 25 patches - good, weak, neutral, harmful. Say "quality is **not stored anywhere that a method can read**; a patch is good only because of what its code does."
* Show `BUG_LINE`: the **planted blocker** `punct_stripper`. Say why: second-order diagnosis needs a structural cause to find.
* Show `diff_features` (real `difflib` unified diff) and `evaluate` (real `exec`).
Run: `python -m pytest -q tests` -> 10 passed. Say what the tests prove (patch effects come from execution, planted bug blocks and removal fixes it).

## 5:15 Lab 10.01 - claim vs evidence (2 min)
Run `python labs/lab_10_01_claim_vs_evidence.py` (needs the experiment results; run `./run_all.sh` once beforehand off-camera). Open `docs/10.01_claim_evidence_analysis.md`.
Walk the three claims. Point at the **VERIFIED vs UNVERIFIED** language and the measured column.

## 7:15 Lab 10.02 - audit template (2 min)
Open `docs/10.02_paper_audits.md`: changed object / feedback / protocol / budget / untested assumption for each of the three methods. Pick **one untested assumption per paper and say how you tested it**.

## 9:15 Close (45 s)
"Next: Method 1, Budget RSI."

### Say this honestly
* I verified the three papers' abstracts (arXiv 2610.29121, 2610.05701, 2610.22791). I could not retrieve the other six papers; for those only the course's summaries exist and I say so.
* The course demos hard-code their win rates (`docs/COURSE_MATERIAL_ISSUES.md`), which is why I rebuilt the experiments with real execution.
