# GenUI codelabs: A2UI, AG-UI, MCP Apps, json-render, OpenUI Lang and agent-harness integration

Six technologies x four generation modes = **24 runnable codelabs**, all on one scenario (a Q3 sales summary) so formats compare directly.

| Mode | Who decides the UI | Safety mechanism |
|---|---|---|
| **Static** | The app. The model picks a pre-built component and supplies values. | Fixed registry / allow-list |
| **Declarative** | The model, from a catalog of allowed components. | Catalog validation, errors returned to the model |
| **Open-ended** | The model writes markup. | Lint + sandboxed iframe (no `allow-same-origin`, CSP) + message allow-list |
| **Mixed** | Catalog + exactly one sandboxed `HtmlArtifact`. | Both of the above |

Delivery is a separate decision: **AG-UI** (your own product, event stream) vs **MCP Apps** (a third-party host mounts your UI). **A2UI, json-render and OpenUI Lang** are UI descriptions, not transports.

## Parts (each has a walkthrough and a video)

| Part | Code | Walkthrough (code + real output) | Video |
|---|---|---|---|
| 1 A2UI | `part1_a2ui/` | [docs/part1_a2ui.md](docs/part1_a2ui.md) | _add YouTube link_ |
| 2 AG-UI | `part2_agui/` | [docs/part2_agui.md](docs/part2_agui.md) | _add YouTube link_ |
| 3 MCP Apps | `part3_mcp_apps/` | [docs/part3_mcp_apps.md](docs/part3_mcp_apps.md) | _add YouTube link_ |
| 4 json-render | `part4_json_render/` | [docs/part4_json_render.md](docs/part4_json_render.md) | _add YouTube link_ |
| 5 OpenUI Lang | `part5_openui/` | [docs/part5_openui.md](docs/part5_openui.md) | _add YouTube link_ |
| 6 Harness integration | `part6_harness/` | [docs/part6_harness.md](docs/part6_harness.md) | _add YouTube link_ |

Video shot lists: [docs/VIDEO_SCRIPTS.md](docs/VIDEO_SCRIPTS.md).

## Run

Python 3.10+, standard library only. Screenshots are optional (Playwright + Chrome).

```bash
python part1_a2ui/declarative_mode.py       # any of the 24: part*/{static,declarative,open_ended,mixed}_mode.py
./run_all.sh                                # all 24, logs -> logs/, screenshots -> out/
python -m unittest discover -s tests -v     # offline tests (8)
```

`logs/` holds the real captured output of every run and `out/` the generated pages and screenshots.

## Honest scope

- These are **teaching subsets** of each protocol, written from scratch (message shapes follow the public specs in spirit, not every field). Check the official docs before production use.
- The model is **scripted** (`common/llm.py`) so runs are offline and repeatable. Swap `ScriptedLLM.next()` for a real API call; nothing after it changes.
- A2UI has no native open-ended mode; Part 1 shows it as a custom catalog component.
- OpenUI token counts use a regex approximation, not a model tokenizer; use them for ratios only.
- A sandbox reduces capabilities; it does not make arbitrary model output safe by itself.
- Reference course used for structure: https://github.com/dlmastery/simple-coding-harness/tree/main/genui
