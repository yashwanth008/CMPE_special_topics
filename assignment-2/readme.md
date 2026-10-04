# Harness Engineering

Three agent harnesses, built from scratch and extended: a coding agent on
OpenRouter, a plugin suite for DeepSeek Harness, and an ML autoresearch loop
that knows when not to trust its own results.

**102 tests, all passing, none requiring an API key.**

| Part | What it is | Tests | Video |
|---|---|---|---|
| [**A**](part-a/) | A coding agent harness built from nothing, in progressive stages | 32 | [▶ Watch](ADD_YOUR_YOUTUBE_LINK_HERE) |
| [**B**](part-b/) | DeepSeek Harness: creator mode, 7 plugins, 2 written from scratch | 30 | [▶ Watch](ADD_YOUR_YOUTUBE_LINK_HERE) |
| [**C**](part-c/) | A custom ML autoresearch harness, built as a plugin for Part A | 40 | [▶ Watch](ADD_YOUR_YOUTUBE_LINK_HERE) |

---

## Part A — A coding agent harness from scratch

**[`part-a/`](part-a/)** · built on the OpenRouter API, so the model is a string
you can change at runtime

A harness is a `while` loop around a chat endpoint. Everything else — tools,
permissions, context management — is scaffolding around that one call. This part
builds it in four stages you can walk through commit by commit:

1. **One HTTP POST.** No framework. Just `choices[0].message.content`.
2. **One tool, and the loop appears.** The model asks; *the harness* executes.
   The model never touches the disk.
3. **A registry and the first rail.** Schemas derived from function signatures,
   so they can't drift from the code. Dangerous tools need human confirmation.
4. **The package.** 7 tools, streaming, retries, a workspace sandbox, context
   compaction, and a JSONL transcript of every event.

```bash
cd part-a
python3 -m minicoder -w /tmp/demo -y "create fizzbuzz.py and run it to verify it works"
python3 -m pytest tests/ -q        # 32 passed
```

Runs offline against a scripted provider that drives the real loop — real files
written, real subprocesses run. Add `OPENROUTER_API_KEY` and the same commands
hit Gemini, DeepSeek or Claude with no code change.

**Worth a look:** `providers/base.py` (streamed tool-call arguments arrive split
mid-JSON across chunks), `tools/files.py` → `resolve()` (twelve lines that stop
`../../.ssh/id_rsa`), and `context.py` → `compact()` (the invariant that keeps a
compacted conversation valid).

---

## Part B — DeepSeek Harness plugins

**[`part-b/`](part-b/)** · written against the DSH source at **v0.1.6-alpha.2**,
not from memory

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) is an
"everything is a plugin" agent harness. Its **Creator mode** is the same agent
with three extra tools — two that read the live runtime API, one that installs
plugins into the profile it's running in — which is what lets you author a
plugin from inside a chat.

**Seven plugins in this profile. Two written from scratch:**

| Plugin | Kind | What it does |
|---|---|---|
| **second-brain** | Host, 4 tools | persistent memory across sessions, backed by append-only JSONL |
| **brain-dock** | Client, UI slot | a capture box below the composer; `#hashtags` become tags |
| + 5 MCP plugins | config-only bundle | filesystem, memory, sequential-thinking, github, fetch |

Both plugins are **plain JavaScript with zero dependencies and no build step** —
reading `ToolRegistry.register()` in the DSH source shows `defineTool` is a
TypeScript convenience, not a requirement. A bundle that needs compiling is a
bundle that breaks on someone else's machine.

```bash
cd part-b
node tests/test-second-brain.mjs     # 15 passed
node tests/test-brain-dock.mjs       # 15 passed
python3 tests/validate-patches.py    # manifests + patches valid
```

Tests stub the Cordis context and the browser module loader, so both plugins are
verified without booting DSH. To actually run it, see
**[`RUNBOOK.md`](part-b/RUNBOOK.md)** — 39 steps, each tagged `[TERM]`, `[UI]` or
`[CHAT]`.

**The demo that matters:** save a note, open a *new session*, ask what it
remembers. Anything looks like it works inside one conversation; a fresh session
answering from disk is the only real proof.

---

## Part C — An ML autoresearch harness

**[`part-c/`](part-c/)** · registers six tools into Part A's registry, so the
Part A agent drives it

An end-to-end loop: propose a hypothesis → run a real experiment → decide
**statistically** whether it beat the incumbent → record it → write the report.

### The problem it's built around

The canonical autoresearch loop is `mutate → run → keep if better`. Run it 40
times on a few hundred rows and it reliably "improves" validation while failing
to improve test performance. The bug isn't in any single comparison — it's that
**`max` over many noisy measurements is a biased estimator**. The loop reports
that bias as progress.

From the committed 40-experiment run in [`part-c/runs/`](part-c/runs/):

| Selection rule | Chose | Validation | Held-out |
|---|---|---|---|
| Statistical gate (this harness) | `standard+logreg` | 0.9741 | **0.9850** |
| Greedy `max` (canonical loop) | `power+mlp(64)` | 0.9758 | 0.9683 |

The greedy rule found a pipeline **+0.0016 better on validation and −0.0167
worse** on data it had never seen. It would have reported that MLP as the
discovery.

**Three defences:** paired comparison on identical CV folds, a paired t-test
instead of `>`, and a minimum effect size. Plus the structural one — the
held-out set is scored *exactly once*, after the winner is fixed, with a test
asserting the loop never peeks.

### Does the gate actually work? Partly.

| Dataset | Seeds | Held-out Δ | p |
|---|---|---|---|
| `wine` | 30 | +0.0109 | **0.037** |
| `iris` (pre-registered) | 30 | **−0.0026** | 0.44 |

**The pre-registered confirmation did not replicate**, and the one significant
result came from optional stopping (10 seeds → p=0.19 → extended to 30), which
is exactly the behaviour the arbiter exists to prevent. Both are reported in
full in [`part-c/README.md`](part-c/README.md). A harness whose argument is
"don't believe an unreplicated improvement" doesn't get to make an exception for
itself.

```bash
cd part-c
python3 study.py --dataset breast_cancer --budget 40    # a real study
python3 agent_research.py                                # the Part A agent driving it
python3 -m pytest tests/ -q                              # 40 passed
```

---

## Quickstart

```bash
git clone <this repo> && cd harness-engineering

# Part A — no key needed
cd part-a && pip install -r requirements.txt && python3 -m pytest tests/ -q

# Part B — needs Node 18+
cd ../part-b && node tests/test-second-brain.mjs && node tests/test-brain-dock.mjs

# Part C — needs scikit-learn
cd ../part-c && pip install scikit-learn numpy pandas matplotlib pytest
python3 -m pytest tests/ -q
```

## Layout

```
part-a/   stages/ (the teaching path) · minicoder/ (the harness) · tests/
part-b/   plugins/ (2 from scratch) · bundles/ (5 MCP) · tests/ · RUNBOOK.md
part-c/   mlresearch/ (the loop) · runs/ (real output) · tests/
```

Each part has its own `README.md` and `VIDEO_SCRIPT.md`. Part B adds
`PROMPTS.md` and `RUNBOOK.md`; Part C commits real run artifacts — reports,
figures, ledgers and a pre-registration — in `runs/`.

## Credentials

Nothing in this repo requires an API key. `.env` is gitignored throughout; use
the `.env.example` files as templates. Part A reaches OpenRouter when a key is
present and falls back to an offline provider when it isn't.

## References

- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) — Part B's target
- [WecoAI/awesome-autoresearch](https://github.com/WecoAI/awesome-autoresearch) — the loop Part C starts from
- Cawley & Talbot (2010), *On Over-fitting in Model Selection and Subsequent Selection Bias*, JMLR — the problem Part C addresses
