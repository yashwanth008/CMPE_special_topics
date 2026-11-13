# Video scripts (one per part)

I cannot record or upload videos, so these are **ready-to-read recording scripts**: what to show, what to type, what to say, and how long each beat takes.
Each part maps to the labs it covers and finishes with a "say this honestly" box - the grader asked you to *explain* the code, and the most credible explanation includes where the result did NOT match the paper.

| Part | Labs | Topic | Target length |
|---|---|---|---|
| 1 | 10.01, 10.02 | Problem, testbed, reading the papers critically | 9-11 min |
| 2 | 10.03, 10.04, 10.05 | Method 1 - Budget RSI | 10-12 min |
| 3 | 10.06, 10.07, 10.08 | Method 2 - SO-RSI | 10-12 min |
| 4 | 10.12, 10.13, 10.14 | Method 3 - Self-HPO (+ RSIFlow-style workflows) | 10-12 min |
| 5 | 10.09, 10.10, 10.11 | Scaling and coordination (AReaL-style, Swarm-style) | 8-10 min |
| 6 | 10.15, 10.16, 10.17 | Environments, metrics, wrap-up | 7-9 min |

**Recording checklist**
1. Terminal font >= 18 pt, dark theme, window 1280x720 or larger. Record the screen with your voice (OBS, QuickTime, Loom - anything).
2. Before each part: `cd rsi-assignment5 && source venv/bin/activate` (or your env) and `pip install -r requirements.txt`.
3. Run the commands **live** so execution is visible (the full set takes about 10 minutes; the per-part commands below are the slow ones, noted). If a part is too slow, say "this takes N seconds" and cut the wait in editing - do not fake output.
4. Show each source file briefly *before* running it (scroll, don't read every line).
5. Upload to YouTube (Unlisted is fine unless told otherwise). Title format: `RSI Assignment 5 - Part N: <topic> (<labs>)`. Put the repo URL and chapter timestamps in the description.
6. Paste the 6 URLs into the table in the top-level `README.md` ("Videos").

**Two things to say in Part 1 and repeat in the wrap-up (Part 6)**
* The proposer is a stochastic stub, not an LLM. The *selection, diagnosis and harness mechanisms* are real code; the proposal distribution is an assumption.
* Every comparison is paired by seed, matched by evaluation budget, and scored on a held-out split that no method ever selects on.
