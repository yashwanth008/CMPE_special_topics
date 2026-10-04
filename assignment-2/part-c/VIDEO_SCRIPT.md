# Part C — YouTube walkthrough script

Target **20–24 minutes**. Unlike Parts A and B, everything here runs on your
machine with no API key and no external service, so the whole video can be
recorded in one pass.

The story has a spine: *the standard autoresearch loop lies to you, here is the
measurement proving it, and here is the fix.* Keep coming back to that.

**Before recording**

```bash
cd part-c
pip install scikit-learn numpy pandas matplotlib pytest scipy
python3 -m pytest tests/ -q          # 40 passed
rm -rf runs && mkdir runs            # clean slate on camera
```

---

## 0 · Cold open — the finding first (0:00–2:00)

Do not start with architecture. Start with the result.

Open `runs/breast_cancer-0-report.md` (regenerate it first, step 3) and put this
table on screen:

| Rule | Chose | Validation | Held-out |
|---|---|---|---|
| Statistical gate | `standard+logreg` | 0.9741 | **0.9850** |
| Greedy `max` | `power+mlp(64)` | 0.9758 | 0.9683 |

> "Two selection rules, same 40 experiments, same held-out set. The greedy rule
> — which is what every reference autoresearch loop does — found a pipeline that
> looked better on validation and was nearly two points *worse* on data it had
> never seen. It would have reported that MLP as the discovery. This video is
> about why that happens and what I built to stop it."

---

## 1 · The problem, stated precisely (2:00–5:00)

Write the canonical loop on screen:

```
mutate → run → if score > best: keep → repeat
```

> "Nothing is wrong with any single comparison. The problem is `max`. Run forty
> trials whose fold-to-fold standard error is about a point and a half, and the
> best *observed* score sits roughly two standard errors above the best *true*
> score — for free, from noise alone. The loop then reports that gap as
> progress."

Name it: **selection overfitting**. Mention it is classical — Cawley & Talbot,
JMLR 2010 — not something I invented for the assignment.

Then the three defences, briefly (you detail them in §3):
paired comparison, a significance gate instead of `>`, and a minimum effect
size. Plus the structural one: the held-out set is scored **once**.

---

## 2 · Watch it run (5:00–8:30)

```bash
python3 study.py --dataset breast_cancer --budget 40
```

Let it stream. While it runs, narrate what each line is:

- `hypothesis:` — every proposal states a claim and a reason. Point out that
  this is what makes the ledger auditable later; a config dict alone would not
  be.
- The explore phase: one default per model family, cheapest first. "A fixed,
  predictable cost that buys a map of the space — so a study never finishes
  having not tried a whole family."
- Then the exploit phase: `A variation on the best svc configuration…`
- **Pause on a `rejected` line that says `improvement +0.0016 below the minimum
  effect`.** This is the whole thesis in one line of output:

> "There it is. That experiment scored *higher* than the incumbent. A greedy
> loop promotes it. Mine refuses, because it cannot tell the improvement from
> noise — and the cold open showed what happens when you promote it anyway."

End on the summary: 40 experiments, 2 accepted, and the selection gap.

---

## 3 · Code walkthrough (8:30–14:00)

Go file by file. One sentence of *why* each exists, then the key function.

| File | Show | Say |
|---|---|---|
| `types.py` | `Result.fold_scores`, `test_score` | fold scores are kept so comparisons can be **paired**; `test_score` is `None` for almost everything by design |
| `executor.py` | `RepeatedStratifiedKFold`, fixed `cv_seed` | **spend time here** — every experiment sees identical folds, or the leaderboard compares measurements taken with different rulers |
| `arbiter.py` | `judge()` | **the core of Part C.** Walk the four branches: no improvement → below min effect → not significant → accepted |
| `arbiter.py` | `_betainc` | hand-rolled so the package needs no scipy; there's a test proving it matches `scipy.stats.ttest_rel` to 1e-9 |
| `search_space.py` | `validate_spec()` | a proposal is **JSON, never code** — the safety boundary |
| `proposer.py` | `_plan` / `_propose_one` | the heuristic is a real control condition, not a stub |
| `proposer.py` | `LLMProposer._extract_json` | models wrap JSON in fences no matter what you tell them; brace-matching beats a regex |
| `ledger.py` | `leaderboard()` vs `accepted()` | **these deliberately differ** — the top of the leaderboard is the biased quantity |
| `loop.py` | the `holdout` block at the end | the single peek, after the winner is fixed |

On `arbiter.py`, make the trade explicit:

> "This gate accepts fewer experiments, so my headline validation number is
> *lower* than a greedy loop would print. That's the point. The greedy number
> is inflated. Whether that makes the model actually better is a separate
> question — and it's testable, so I tested it."

---

## 4 · Does the gate actually work? (14:00–18:00)

**This is the most important section in the video.** Not because the method
wins, but because of how it is reported. Pre-run the `--compare` studies and
show the saved output.

Put all three runs on screen at once:

| Dataset | Seeds | Inflation avoided | Held-out Δ | p | Same pick |
|---|---|---|---|---|---|
| `breast_cancer` | 6 | +0.0031 | +0.0028 | 0.34 | 4/6 |
| `wine` | 30 | +0.0137 | +0.0109 | **0.037** | 6/30 |
| `iris` (pre-registered) | 30 | +0.0019 | **−0.0026** | 0.44 | 0/30 |

> "Wine looks like a win: p of 0.037, a point of inflation avoided. So I
> pre-registered a confirmation on a third dataset — fixed thirty seeds, commit
> to reporting whatever came out."

Pause. Then:

> "It failed. On iris the gate was *worse* on held-out data and p was 0.44. My
> pre-registered confirmation did not replicate, and I'm leading with that,
> because a harness whose entire argument is 'don't believe an unreplicated
> improvement' does not get to make an exception for itself."

Then the two caveats, in your own voice:

> "Two things I have to own. First, that wine p-value came from optional
> stopping — I ran ten seeds, saw p of 0.19, and extended to thirty. That
> inflates the false-positive rate. I committed exactly the sin my arbiter
> exists to prevent. Second, iris was a bad confirmation set and I only worked
> out why afterwards."

Show the resolution table:

| Dataset | Held-out rows | Metric granularity |
|---|---|---|
| `iris` | 37 | 0.081 |
| `wine` | 44 | 0.068 |
| `breast_cancer` | 142 | 0.014 |

> "Iris's held-out set is 37 rows across three classes, so balanced accuracy
> moves in steps of eight points. The effect I'm measuring is one point. That
> experiment could not have found the effect if it were there. Which is a real
> measurement limit — but noticing it *after* the result is still post-hoc
> reasoning, so it doesn't rescue the claim."

Land on what the evidence does support:

> "The *mechanism* is real and shows up in all three runs — greedy's validation
> scores are more inflated every time. The single study in the cold open shows
> it concretely. What I cannot claim is that this reliably produces better
> models. One significant result from optional stopping, one null, one
> underpowered run. That's a hypothesis, not a finding."

Finally show `runs/*-trace.png` — point at the rejected points sitting *above*
the incumbent line. "Every one of those is a promotion a greedy loop would have
made."

---

## 5 · As a harness plugin (17:30–20:00)

> "The assignment asked for a harness *plugin*, so this registers into the
> harness I built in Part A."

```bash
python3 agent_research.py
```

Watch the tool calls: load → search space → protocol → run study → inspect
ledger (accepted) → inspect ledger (inconclusive) → write report.

Two design points:

> "Six tools, not one `do_research()`. A single tool makes the agent a
> spectator — it triggers a black box and reads a verdict. Split at the natural
> seams, it can inspect a surprise and re-run."

> "And note what the agent *cannot* do. It can set alpha before a study, never
> during one. It can't score the test set twice. An agent that could lower the
> bar after seeing results could manufacture a better-looking answer, so those
> controls live in code the agent calls, not in prose it can reinterpret."

Show the restricted registry — research tools plus read-only file access, no
shell, built with `registry.subset()` from Part A.

---

## 6 · Tests and close (20:00–22:00)

```bash
python3 -m pytest tests/ -v
```

Call out four by name:

- `test_pure_noise_is_not_accepted_as_an_improvement` — 300 trials of two
  identical-quality pipelines; the gate accepts under 8% where a greedy rule
  accepts about half.
- `test_a_real_effect_is_detected` — still catches >90% of genuine 5-point
  improvements, so it is not merely strict.
- `test_the_loop_never_touches_the_holdout_set` — spies on the scorer and
  asserts every call happened after the final experiment.
- `test_paired_t_test_matches_scipy` — 1e-9 agreement.

> "Forty tests, and the ones that matter test the *method*, not the plumbing."

Close on the limits, out loud:

> "Three datasets, a confirmation that didn't replicate, and a search space the loop can't
> step outside — it can't invent a model family I didn't declare. That's a
> deliberate safety boundary and a real ceiling, and it's in the
> threats-to-validity section of every report this thing writes. If I had
> another week: more datasets, enough seeds to power the comparison properly,
> and a nested-CV variant so the selection bias is bounded rather than just
> measured."

---

## Recording checklist

- [ ] `rm -rf runs` before rolling, and pre-run the `--compare` study
- [ ] Terminal font ≥ 16pt — the streaming verdicts are the visual payoff
- [ ] The cold-open table on screen within the first two minutes
- [ ] The `below the minimum effect` rejection line shown live
- [ ] **The failed pre-registered confirmation stated plainly** — do not skip it;
      it is the most credible moment in the video
- [ ] The optional-stopping admission on the wine p-value
- [ ] `runs/*-trace.png` shown, with the rejected-above-incumbent points named
- [ ] The agent integration run (ties Part C back to Part A)
- [ ] Every file in `mlresearch/` opened at least once
