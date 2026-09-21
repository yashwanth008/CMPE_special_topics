# Part A — YouTube walkthrough script

Target: **18–22 minutes**. The assignment asks for a full code walkthrough of
all files *plus* execution, so every section below is "show the file, then run
it". Commands are copy-pasteable; all of them work with no API key.

Record with a terminal on the left and the editor on the right if you can — the
whole point of the stages is watching one grow into the next.

**Before recording:**
```bash
cd part-a
pip install -r requirements.txt
rm -rf demo/workspace .pytest_cache            # clean slate on camera
```

---

## 0 · Cold open (0:00–1:00)

> "This is Part A: a coding agent harness built from scratch on the OpenRouter
> API. Before I walk through any code, here's the finished thing doing real
> work."

```bash
mkdir -p /tmp/demo && cd /tmp/demo
python3 -m minicoder -w . -y "create fizzbuzz.py and run it to verify it works"
cat fizzbuzz.py
```

Point out on screen: it listed the directory, wrote a real file, executed it
with a real subprocess, then stopped and summarised. Then say the hook —

> "There's no agent framework in this repo. It's one `while` loop and about
> nine hundred lines. Let me build it from zero."

---

## 1 · Stage 1 — it's just an HTTP POST (1:00–3:30)

Open `stages/stage1_hello.py`.

Talking points:
- A harness is a POST to `/chat/completions` and a read of
  `choices[0].message.content`. Learn that path once and the rest is obvious.
- OpenRouter is OpenAI-compatible, so this same payload reaches Gemini,
  DeepSeek, Qwen or GPT — the model is a *string*.
- `MINICODER_MOCK=1` replays a canned response so the control flow is identical
  with no key.

```bash
cd part-a
MINICODER_MOCK=1 python3 stages/stage1_hello.py "what is an agent harness?"
```

If you have a key, run it for real here — it's the most convincing 20 seconds
in the video:
```bash
python3 stages/stage1_hello.py "what is an agent harness in two sentences?"
```

---

## 2 · Stage 2 — the loop appears (3:30–7:30)

Open `stages/stage2_one_tool.py`. **This is the most important section of the
video.** Slow down here.

Walk the four-step protocol in the docstring, then the code:
1. `READ_FILE_SCHEMA` — what the model is *told* it can do.
2. `read_file()` — what actually happens. Note it returns a string on failure
   rather than raising: *an error is information the model can act on*.
3. The branch on `tool_calls` — stop, or run something.
4. `messages.append(message)` **before** the tool result, and the
   `tool_call_id` that pairs request to result.

> "The model never touches the disk. It emits a JSON request, and *we* decide
> what actually runs. That asymmetry is the entire safety story of an agent."

```bash
MINICODER_MOCK=1 python3 stages/stage2_one_tool.py "how many lines are in stages/mockllm.py?"
```

Show `stages/mockllm.py` briefly — explain that a scripted responder speaking
the same JSON dialect is enough to exercise the loop, and it's what makes the
tests deterministic.

---

## 3 · Stage 3 — registry and the first rail (7:30–10:30)

Open `stages/stage3_registry.py`.

- The `@tool()` decorator: schema derived from the signature and docstring, so
  the description the model reads and the code that runs **cannot drift apart**.
  Call out that this is the #1 bug in hand-rolled harnesses.
- `dangerous=True` → confirm with the human first.
- A refusal is returned to the model as a normal result, so it adapts instead of
  crashing.

Run it twice — once letting the prompt appear, and answer `n`:
```bash
MINICODER_MOCK=1 python3 stages/stage3_registry.py "create a file called scratch.py"
```
then with the rail off:
```bash
MINICODER_MOCK=1 AUTO_APPROVE=1 python3 stages/stage3_registry.py "list files in this directory"
```

---

## 4 · The package tour (10:30–17:00)

> "Stage 3 works, but it dies on any run longer than a few turns. Here's what
> production needs."

Go file by file. One sentence of *why* each exists, then show the key function.

| File | Show | Say |
|---|---|---|
| `types.py` | `Message.to_wire()` | `content: null` for tool calls vs `""` for text — strict providers reject the wrong one |
| `providers/base.py` | `accumulate_stream()` | **spend time here** — tool-call arguments split mid-JSON across chunks, paired only by `index` |
| `providers/openrouter.py` | `_post()` retry loop | 429/5xx are normal for a gateway, not exceptions |
| `providers/mock.py` | `_plan()` | the seam that makes the repo runnable and testable offline |
| `tools/base.py` | `register()` | one decorator → schema + callable + risk class |
| `tools/files.py` | `resolve()` | **the twelve most important lines in the repo** |
| `tools/shell.py` | `DENYLIST` | a rail against mistakes, *not* a security boundary |
| `context.py` | `compact()` | the tool-pairing invariant |
| `permissions.py` | `confirm()` | 'always' is what makes it usable past the 20th prompt |
| `transcript.py` | `record()` | JSONL survives a crash mid-run |
| `agent.py` | `run()` | the payoff — everything above exists to make these 40 lines correct |

Demonstrate the sandbox live, it lands well on camera:
```bash
python3 -c "
from minicoder.tools import files
from minicoder.tools.base import registry
files.set_workspace('/tmp/demo')
print(registry.get('read_file').run(path='../../etc/passwd').content)
"
```

And the denylist:
```bash
python3 -c "
from minicoder.tools.base import registry
print(registry.get('bash').run(command='rm -rf /').content)
"
```

---

## 5 · Full run + transcript (17:00–20:00)

```bash
rm -rf demo/workspace && mkdir -p demo/workspace
python3 -m minicoder -w demo/workspace -y \
  --transcript-dir demo/workspace/.minicoder \
  "create fizzbuzz.py and run it to verify it works"

ls demo/workspace
cat demo/workspace/fizzbuzz.py
```

Then open the transcript — this is the part most student videos skip and it's
worth showing:
```bash
cat demo/workspace/.minicoder/*.jsonl | python3 -m json.tool --json-lines | head -60
```

> "Every event, in order, append-only. When an agent does something surprising,
> this is the only place the answer lives."

If you have a key, re-run the same command against a real model and show the
difference in the summary text.

---

## 6 · Tests + close (20:00–22:00)

```bash
python3 -m pytest tests/ -v
```

Call out four by name as they scroll past:
- `test_sandbox_blocks_paths_outside_the_workspace`
- `test_streaming_chunks_reassemble_into_one_tool_call`
- `test_compaction_shrinks_history_but_keeps_the_task_and_recent_turns`
- `test_mock_provider_completes_a_real_task_offline`

> "Thirty-two tests, no network, no API key, no bill. That's the payoff of the
> provider seam — the loop, the sandbox, the permission gate and compaction are
> all testable without a model."

Close on the three things you'd build next: parallel execution of read-only
tools, subagents with restricted registries via `registry.subset()`, and
model-generated compaction summaries.

---

## Recording checklist

- [ ] `rm -rf demo/workspace .pytest_cache` before rolling
- [ ] Terminal font ≥ 16pt — the tool-call lines are the visual payoff
- [ ] `.env` **not** on screen at any point; show `.env.example` instead
- [ ] Every file in `minicoder/` visibly opened at least once (the assignment
      asks for a full walkthrough of all files)
- [ ] At least one live failure — the denied permission or the sandbox refusal
- [ ] Both provider paths shown if you have a key: mock *and* real
