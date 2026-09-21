# Part A — Building a coding agent harness from scratch

A coding agent harness (`minicoder`), written from nothing in progressive stages,
running on the **OpenRouter API** so any backend model — Gemini, DeepSeek, Qwen,
GPT, Claude — is a one-string change.

The repo is laid out so it can be read and recorded in order. Each stage is a
runnable program that does strictly more than the last one, and the final
package is what the earlier stages grow into.

```
part-a/
├── stages/                  the teaching path — run these in order
│   ├── stage1_hello.py        one HTTP POST to a model
│   ├── stage2_one_tool.py     one tool + the agent loop, written by hand
│   ├── stage3_registry.py     many tools, a registry, first permission gate
│   └── mockllm.py             offline stand-in so stages run with no API key
├── minicoder/               the real harness
│   ├── types.py               Message / ToolCall / Completion / ToolResult
│   ├── config.py              env + .env resolution
│   ├── providers/
│   │   ├── base.py              the Provider seam, streaming reassembly
│   │   ├── openrouter.py        the real backend, with retries
│   │   └── mock.py              deterministic offline model
│   ├── tools/
│   │   ├── base.py              decorator → JSON schema + callable + risk
│   │   ├── files.py             read / write / edit / list  (+ the sandbox)
│   │   ├── shell.py             bash, with timeout and denylist
│   │   └── search.py            glob / grep
│   ├── context.py             token estimation, truncation, compaction
│   ├── permissions.py         allow / ask / deny
│   ├── transcript.py          append-only JSONL event log
│   ├── agent.py               THE LOOP
│   └── cli.py                 `python -m minicoder`
└── tests/test_harness.py    32 tests, all offline
```

---

## Run it in sixty seconds, without an API key

Everything works offline against a scripted provider, so the harness can be
evaluated immediately:

```bash
pip install -r requirements.txt

python3 -m minicoder --list-tools

mkdir -p /tmp/demo
python3 -m minicoder -w /tmp/demo -y "create fizzbuzz.py and run it to verify it works"

python3 -m pytest tests/ -q        # 32 passed
```

The mock provider really drives the loop: it inspects the directory, writes a
real file, executes it with a real subprocess, and reports. Only the *choice* of
what to do next is scripted rather than inferred.

## Run it against a real model

```bash
cp .env.example .env          # add your key
# OPENROUTER_API_KEY=sk-or-v1-...

python3 -m minicoder -m google/gemini-2.5-flash "add type hints to utils.py and run the tests"
python3 -m minicoder -m deepseek/deepseek-chat "explain what this repo does"
python3 -m minicoder                                  # interactive session
```

Get a key at [openrouter.ai/keys](https://openrouter.ai/keys). OpenRouter is an
OpenAI-compatible gateway, so the payload shape below is the same for every
model behind it.

| Flag | Meaning |
|---|---|
| `-m, --model` | OpenRouter model id |
| `-w, --workspace` | directory the agent is confined to |
| `-y, --yes` | auto-approve dangerous tools (sandboxes only) |
| `--max-turns` | turn limit before giving up |
| `--no-stream` | wait for complete responses |
| `--transcript-dir` | where the JSONL session log goes |
| `--list-tools` | print the tool schemas and exit |

---

## The progression, stage by stage

### Stage 1 — one HTTP request

A harness is, at bottom, a POST to `/chat/completions` and a read of
`choices[0].message.content`. No framework, no abstraction.

```bash
MINICODER_MOCK=1 python3 stages/stage1_hello.py "what is an agent harness?"
```

### Stage 2 — one tool, and the loop appears

The model is handed a `tools` schema and can now reply in two different ways:
`finish_reason: "stop"` (it's done) or `finish_reason: "tool_calls"` (it wants
something run). The harness runs it — **the model never touches the disk** —
appends a `{"role": "tool"}` result, and goes round again. That `while` is the
entire idea.

```bash
MINICODER_MOCK=1 python3 stages/stage2_one_tool.py "how many lines are in stages/mockllm.py?"
```

### Stage 3 — a registry, and the first rail

Hard-coding one tool doesn't scale: each new tool means touching the schema
list, the dispatch branch and the prompt. A decorator derives the JSON schema
from the function signature and docstring, so schema and implementation cannot
drift. A tool marked `dangerous=True` must be confirmed by the human first.

```bash
MINICODER_MOCK=1 AUTO_APPROVE=1 python3 stages/stage3_registry.py "list files in this directory"
```

### Stage 4 — the package

What stage 3 is missing is everything that makes a long run survive:

| Concern | Where it lives | Why it matters |
|---|---|---|
| Backend independence | `providers/base.py` | one seam ⇒ offline tests, model swap at runtime |
| Streaming | `providers/base.py` | deltas arrive fragmented; tool-call args split mid-JSON across chunks |
| Retries | `providers/openrouter.py` | 429/5xx are normal for a gateway, not exceptions |
| Sandbox | `tools/files.py` → `resolve()` | one function stops `../../.ssh/id_rsa` |
| Denylist | `tools/shell.py` | a distracted "y" shouldn't wipe a disk |
| Truncation | `types.py` → `ToolResult.truncated` | one 2MB file shouldn't end the session |
| Compaction | `context.py` | long runs otherwise die at the context limit |
| Permissions | `permissions.py` | the model proposes; the harness disposes |
| Transcript | `transcript.py` | when an agent surprises you, this is the only record |

---

## The four things that are harder than they look

**1. Errors must be data, not exceptions.** Every tool returns a `ToolResult`
even when it fails, and that failure text goes back to the model. `Error: that
text appears 2 times in dup.py — include surrounding lines to make it unique`
gets a correct retry on the next turn. A raised exception just kills the run.

**2. Streaming tool calls arrive in pieces.** Text streams a few characters at a
time, but so do tool-call *arguments* — one call's JSON is split across chunks
and identified only by `index`. `accumulate_stream()` reassembles them; getting
this wrong is the most common bug in hand-written harnesses, and there's a test
pinning it.

**3. Compaction can produce an invalid conversation.** If you drop the middle of
history and your cut lands between an assistant message with `tool_calls` and
its matching `role: "tool"` results, the next request is rejected as malformed.
`compact()` walks the boundary back until it starts on a clean turn.

**4. `content: null` vs `content: ""`.** A tool-call message legitimately has
null content; a text message must have a string. Strict providers reject the
wrong one. One test pins each case.

## The loop, in full

Everything above exists to make this correct:

```python
while turn < max_turns:
    maybe_compact(history)
    completion = provider.complete(history, tool_schemas)
    history.append(completion.message)

    if not completion.wants_tools:
        return completion.message.text      # done

    for call in completion.message.tool_calls:
        if not permitted(call):
            result = "The user denied permission."
        else:
            result = tools[call.name].run(**call.arguments).truncated(limit)
        history.append(Message(role="tool", tool_call_id=call.id, content=result))
```

## Tests

```bash
python3 -m pytest tests/ -v
```

32 tests, no network, no API key. They cover the sandbox escape attempts, the
bash denylist, the permission state machine, streaming reassembly, malformed
tool arguments, compaction's tool-pairing invariant, the turn limit, denial
handling, and a full offline end-to-end run.

## Safety

The sandbox and denylist are rails against *mistakes*, not a security boundary —
`bash` with `shell=True` is arbitrary code execution by design. Run untrusted
tasks in a container. Leave `-y` off unless the workspace is disposable.
