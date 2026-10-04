# Part C — A custom ML autoresearch harness plugin

An end-to-end autoresearch loop: it proposes hypotheses, runs real experiments,
decides statistically whether each one actually beat the incumbent, keeps an
auditable research record, and writes up the result.

It is built as a **plugin for the Part A harness** — the agent from Part A
drives this loop through registered tools — and it is designed around the
specific failure mode that the canonical autoresearch loop has.

```
part-c/
├── mlresearch/
│   ├── types.py          Hypothesis / Experiment / Result / LedgerEntry
│   ├── search_space.py   the declarative space a proposal may name
│   ├── executor.py       real fits, repeated stratified CV, fixed folds
│   ├── arbiter.py        THE CONTRIBUTION — the statistical keep/discard gate
│   ├── proposer.py       heuristic search + an LLM proposer with fallback
│   ├── ledger.py         append-only JSONL research record
│   ├── reporter.py       markdown report + two-panel figure
│   ├── loop.py           the orchestrator
│   └── plugin.py         registers six tools into the Part A registry
├── study.py              CLI: run a study, or the selection-rule experiment
├── agent_research.py     the Part A agent driving this loop
├── tests/                40 tests, including the method's own claims
└── runs/                 committed output of real runs
```

---

## Run it

No API key needed for any of this.

```bash
pip install scikit-learn numpy pandas matplotlib pytest

python3 study.py --dataset breast_cancer --budget 40      # a real study
python3 agent_research.py                                  # the agent driving it
python3 -m pytest tests/ -q                                # 40 passed
```

Outputs land in `runs/`: a markdown report, a PNG trace, and the JSONL ledger.

| Flag | Meaning |
|---|---|
| `--dataset` | `breast_cancer`, `wine`, `digits`, `iris` |
| `--csv PATH --target COL` | your own data |
| `--budget N` | experiments to run |
| `--alpha`, `--min-effect` | the acceptance gate |
| `--folds`, `--repeats` | the CV protocol |
| `--llm` | use the LLM proposer (OpenRouter) instead of the heuristic |
| `--compare N` | **the method experiment** — repeat across N seeds and compare selection rules |

---

## The problem this harness is built around

The canonical autoresearch loop — the one in every reference implementation —
is:

```
mutate → run → if score > best: keep, else: revert → repeat
```

Run that 40 times on a few hundred rows and it reliably "improves" the
validation score while failing to improve the test score. The bug is not in any
single comparison. It is that **`max` over many noisy measurements is a biased
estimator**. With 40 trials whose fold-to-fold standard error is ~1.5 points,
the best *observed* score sits roughly two standard errors above the best *true*
score for free. The loop reports that gap as progress.

This is not hypothetical. From the committed 40-experiment run in
`runs/breast_cancer-0-report.md`:

| Selection rule | Chose | Validation | Held-out | Gap |
|---|---|---|---|---|
| Statistical gate (this harness) | `standard+logreg` | 0.9741 | **0.9850** | −0.0109 |
| Greedy `max` (canonical loop) | `power+mlp(64)` | 0.9758 | 0.9683 | +0.0074 |

The greedy rule found a pipeline that looked **+0.0016 better** on validation
and was **−0.0167 worse** on data it had never seen. It would have reported the
MLP as the discovery.

## Three defences, in order of importance

**1. Paired comparison.** Every experiment is scored on the *same* CV folds
(fixed seed), so a challenger and the incumbent are compared fold by fold. The
fold-to-fold difficulty that dominates both scores cancels, and the paired
differences have far smaller variance than the difference of two means.

**2. A significance gate, not `>`.** A challenger is promoted only if the mean
paired improvement survives a paired t-test at `alpha`. Anything better but
indistinguishable from noise is recorded as `inconclusive` — kept in the
ledger, never promoted. *A greedy loop would have promoted every one of those.*

**3. A minimum effect size.** Significance is not importance; with enough folds
a 0.0005 gain becomes "significant". `min_effect` refuses improvements too
small to care about, which also stops the incumbent ratcheting through a chain
of trivial promotions.

Plus the structural guarantee: **the held-out set is scored exactly once**,
after the loop has finished and the winner is fixed. The loop cannot see it.
There is a test asserting this (`test_the_loop_never_touches_the_holdout_set`)
because it is the property that makes the final number mean anything.

## What it costs — and the honest result

A stricter gate accepts fewer experiments, so the headline validation number is
*lower* than a greedy loop would report. That is intended: the greedy number is
inflated. But does the gate actually produce better models?

One study cannot answer that — the gate reduces the *variance* of selection, so
a single run can go either way. `--compare N` runs the experiment properly,
repeating the whole study across seeds and comparing both rules on the same
held-out set:

```bash
python3 study.py --dataset wine --budget 22 --compare 30
```

### All three runs, including the one that failed

| Dataset | Seeds | Inflation avoided | Held-out Δ (gate − greedy) | p | Same pick |
|---|---|---|---|---|---|
| `breast_cancer` | 6 | +0.0031 | +0.0028 | 0.34 | 4/6 |
| `wine` | 30 | **+0.0137** | **+0.0109** | **0.037** | 6/30 |
| `iris` (pre-registered) | 30 | +0.0019 | **−0.0026** | 0.44 | 0/30 |

**The pre-registered confirmation did not replicate.** On `iris` the gate was
*worse* on held-out data and the effect was nowhere near significant. That is
the headline result of this section, and burying it would make the whole
harness self-refuting.

Two caveats on the one result that did reach significance:

1. **`wine`'s p=0.037 came from optional stopping.** I ran 10 seeds, saw
   p=0.19, and extended to 30. That inflates the false-positive rate, so the
   p-value is optimistic and should not be read as a 3.7% error rate. This is
   precisely the behaviour the arbiter exists to prevent, committed by the
   author of the arbiter.
2. **`iris` was a bad choice of confirmation set, and I only realised afterwards.**
   Its held-out set is 37 rows across 3 classes, so balanced accuracy moves in
   steps of ~0.081. The effect under test is ~0.01. The experiment could not
   have detected the effect even if it were real:

   | Dataset | Held-out rows | Metric granularity |
   |---|---|---|
   | `iris` | 37 | 0.081 |
   | `wine` | 44 | 0.068 |
   | `breast_cancer` | 142 | 0.014 |

   Noticing this after the result is itself post-hoc reasoning. It is a real
   measurement limit rather than special pleading, but a clean confirmation
   needs a dataset pre-registered for adequate resolution — which I have not run.

### What the evidence actually supports

**Strongly:** the *mechanism* is real and visible in every run. The greedy
rule's validation scores are more inflated than the gated rule's on all three
datasets (+0.0031, +0.0137, +0.0019 — always positive). The single
40-experiment study in `runs/` shows it concretely: greedy picked a pipeline
+0.0016 better on validation and −0.0167 worse on held-out.

**Weakly, and only on one dataset:** that this translates into better
generalisation. One significant result obtained by optional stopping, one null
result, and one underpowered run is not a finding.

**Not at all:** that the gate is free. It accepts fewer experiments and reports
a lower headline number by construction.

The pattern across datasets matches the theory — the gate matters where many
pipelines sit within noise of each other (`wine`) and not where one pipeline is
clearly best (`breast_cancer`, 4/6 identical picks) — but with n=3 datasets
that is a hypothesis, not a demonstration.

---

## As a harness plugin

`mlresearch/plugin.py` registers six tools into Part A's `ToolRegistry`:

| Tool | Purpose |
|---|---|
| `research_load_dataset` | load data, split off the held-out set |
| `research_search_space` | what may be proposed |
| `research_set_protocol` | alpha, min_effect, folds — **before** a study only |
| `research_run_study` | run the loop (marked dangerous: real compute) |
| `research_inspect_ledger` | why anything was accepted or rejected |
| `research_write_report` | the write-up and the figure |

```bash
python3 agent_research.py
```

**The division of labour is the design.** The agent decides what to study and
what the results mean. The loop owns the protocol: fixed folds, paired
comparison, one peek at the held-out set. The agent *cannot* talk the loop out
of its protocol — an agent that could lower `alpha` after seeing results, or
score the test set twice, could manufacture a better-looking answer. Those
controls live in code the agent calls, not in prose it can reinterpret.

Six tools rather than one `do_research()` for the same reason: splitting the
loop at its natural seams lets the agent inspect a surprise and re-run, instead
of being a spectator that triggers a black box.

The agent runs with a **restricted registry** — the research tools plus
read-only file access, no shell — built with `registry.subset()` from Part A.

## Why a proposal is JSON, never code

A proposal names a preprocessor, a model and hyper-parameters from
`search_space.py`. It never supplies code. The worst a malformed or adversarial
proposal can do is fail validation — compare that to a loop that `exec`s
model-written training scripts. The cost is a real ceiling on what the loop can
discover: it cannot invent a model family that is not in the space. That is a
deliberate trade, stated in every report's threats-to-validity section.

## Tests

```bash
python3 -m pytest tests/ -v    # 40 passed
```

The interesting ones test the *method*, not the plumbing:

- `test_pure_noise_is_not_accepted_as_an_improvement` — 300 trials of two
  identical-quality pipelines; the gate accepts <8% where greedy accepts ~50%.
- `test_a_real_effect_is_detected` — and it still catches >90% of genuine
  5-point improvements, so it is not merely strict.
- `test_the_loop_never_touches_the_holdout_set` — spies on the scorer and
  asserts every call happened after the final experiment.
- `test_every_experiment_sees_identical_folds` — without this, paired testing
  is invalid and the leaderboard compares different rulers.
- `test_paired_t_test_matches_scipy` — the hand-rolled t-test agrees with
  `scipy.stats.ttest_rel` to 1e-9 (it is hand-rolled so the package needs no
  scipy).
- `test_llm_proposer_falls_back_instead_of_dying` — four kinds of malformed
  model reply; a study must not end because a proposal was bad.

## Threats to validity

- **The pre-registered confirmation failed** (`iris`, p=0.44, held-out −0.0026).
  The one significant result (`wine`, p=0.037) came from extending the seed
  count after an underpowered pilot, so its p-value is optimistic.
- Three datasets, all small sklearn built-ins. Two of the three have held-out
  sets too coarse (0.068–0.081 metric granularity) to resolve a ~0.01 effect.
- The held-out set is scored once, but it was *split* once too — a different
  split moves the final number by about its own standard error.
- The search space is fixed, so the loop's ceiling is the space, not its search.
  It cannot invent a model family that is not in `search_space.py`.
- The LLM proposer is implemented and tested but was not benchmarked against
  the heuristic, so no claim is made about which searches better.

### What I would do next

In priority order: pre-register a confirmation on a dataset with enough
held-out rows to resolve 0.01 (so ≥1000 test rows); replace the post-hoc
comparison with **nested cross-validation**, which bounds selection bias rather
than measuring it after the fact; then benchmark the LLM proposer against the
heuristic on equal budget.

## References

- [WecoAI/awesome-autoresearch](https://github.com/WecoAI/awesome-autoresearch)
  — the mutate/run/keep-or-revert pattern this harness starts from.
- The selection-overfitting problem is classical: Cawley & Talbot (2010),
  *On Over-fitting in Model Selection and Subsequent Selection Bias*, JMLR.
