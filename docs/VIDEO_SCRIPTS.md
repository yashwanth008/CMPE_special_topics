# Video scripts: one YouTube video per part

Record each part as one video (about 10-12 min). Tip: `GENUI_PAUSE=1 ./run_all.sh <part_dir>` pauses at every step so you can narrate before each output appears. Put the YouTube link for each part in the table at the bottom and in README.md.

## A2UI (`part1_a2ui/`)

Key message: **structure and data are separate streams**

| Time | Show | Say |
|---|---|---|
| 0:00 | Slide / README diagram of the 3 modes | What problem this tech solves; the scenario (Q3 sales summary) and that the model is scripted so the run is repeatable |
| 1:00 | `docs/part1_a2ui.md` concept section + shared helper file | Walk the helper module top to bottom: what each function is for |
| 3:00 | `part1_a2ui/static_mode.py` then run it | Who decides the UI (the app). What the model controls. Point at the rejection/boundary step |
| 5:00 | `part1_a2ui/declarative_mode.py` then run it | Catalog as prompt+validator+renderer; the error/correction or streaming moment |
| 7:00 | `part1_a2ui/open_ended_mode.py` then run it | Why markup is dangerous; lint blocks the hostile reply; sandbox flags (`allow-scripts` without `allow-same-origin`, CSP) |
| 9:00 | `part1_a2ui/mixed_mode.py` then run it; open `out/part1_mixed.png` | Why mixed is the recommended default; action round trip / permission gate |
| 11:00 | `python -m unittest discover -s tests -v` | Tests are offline; what each one protects |
| 11:30 | Recap table of the 4 modes | When to choose each; one thing to try next |

## AG-UI (`part2_agui/`)

Key message: **typed events connect agent and page; UI is shared state**

| Time | Show | Say |
|---|---|---|
| 0:00 | Slide / README diagram of the 3 modes | What problem this tech solves; the scenario (Q3 sales summary) and that the model is scripted so the run is repeatable |
| 1:00 | `docs/part2_agui.md` concept section + shared helper file | Walk the helper module top to bottom: what each function is for |
| 3:00 | `part2_agui/static_mode.py` then run it | Who decides the UI (the app). What the model controls. Point at the rejection/boundary step |
| 5:00 | `part2_agui/declarative_mode.py` then run it | Catalog as prompt+validator+renderer; the error/correction or streaming moment |
| 7:00 | `part2_agui/open_ended_mode.py` then run it | Why markup is dangerous; lint blocks the hostile reply; sandbox flags (`allow-scripts` without `allow-same-origin`, CSP) |
| 9:00 | `part2_agui/mixed_mode.py` then run it; open `out/part2_mixed.png` | Why mixed is the recommended default; action round trip / permission gate |
| 11:00 | `python -m unittest discover -s tests -v` | Tests are offline; what each one protects |
| 11:30 | Recap table of the 4 modes | When to choose each; one thing to try next |

## MCP Apps (`part3_mcp_apps/`)

Key message: **the third-party host owns the policy and the bridge**

| Time | Show | Say |
|---|---|---|
| 0:00 | Slide / README diagram of the 3 modes | What problem this tech solves; the scenario (Q3 sales summary) and that the model is scripted so the run is repeatable |
| 1:00 | `docs/part3_mcp_apps.md` concept section + shared helper file | Walk the helper module top to bottom: what each function is for |
| 3:00 | `part3_mcp_apps/static_mode.py` then run it | Who decides the UI (the app). What the model controls. Point at the rejection/boundary step |
| 5:00 | `part3_mcp_apps/declarative_mode.py` then run it | Catalog as prompt+validator+renderer; the error/correction or streaming moment |
| 7:00 | `part3_mcp_apps/open_ended_mode.py` then run it | Why markup is dangerous; lint blocks the hostile reply; sandbox flags (`allow-scripts` without `allow-same-origin`, CSP) |
| 9:00 | `part3_mcp_apps/mixed_mode.py` then run it; open `out/part3_mixed.png` | Why mixed is the recommended default; action round trip / permission gate |
| 11:00 | `python -m unittest discover -s tests -v` | Tests are offline; what each one protects |
| 11:30 | Recap table of the 4 modes | When to choose each; one thing to try next |

## json-render (`part4_json_render/`)

Key message: **one catalog = prompt + validator + registry; streaming patches**

| Time | Show | Say |
|---|---|---|
| 0:00 | Slide / README diagram of the 3 modes | What problem this tech solves; the scenario (Q3 sales summary) and that the model is scripted so the run is repeatable |
| 1:00 | `docs/part4_json_render.md` concept section + shared helper file | Walk the helper module top to bottom: what each function is for |
| 3:00 | `part4_json_render/static_mode.py` then run it | Who decides the UI (the app). What the model controls. Point at the rejection/boundary step |
| 5:00 | `part4_json_render/declarative_mode.py` then run it | Catalog as prompt+validator+renderer; the error/correction or streaming moment |
| 7:00 | `part4_json_render/open_ended_mode.py` then run it | Why markup is dangerous; lint blocks the hostile reply; sandbox flags (`allow-scripts` without `allow-same-origin`, CSP) |
| 9:00 | `part4_json_render/mixed_mode.py` then run it; open `out/part4_mixed.png` | Why mixed is the recommended default; action round trip / permission gate |
| 11:00 | `python -m unittest discover -s tests -v` | Tests are offline; what each one protects |
| 11:30 | Recap table of the 4 modes | When to choose each; one thing to try next |

## OpenUI Lang (`part5_openui/`)

Key message: **forward references make a compact language streamable**

| Time | Show | Say |
|---|---|---|
| 0:00 | Slide / README diagram of the 3 modes | What problem this tech solves; the scenario (Q3 sales summary) and that the model is scripted so the run is repeatable |
| 1:00 | `docs/part5_openui.md` concept section + shared helper file | Walk the helper module top to bottom: what each function is for |
| 3:00 | `part5_openui/static_mode.py` then run it | Who decides the UI (the app). What the model controls. Point at the rejection/boundary step |
| 5:00 | `part5_openui/declarative_mode.py` then run it | Catalog as prompt+validator+renderer; the error/correction or streaming moment |
| 7:00 | `part5_openui/open_ended_mode.py` then run it | Why markup is dangerous; lint blocks the hostile reply; sandbox flags (`allow-scripts` without `allow-same-origin`, CSP) |
| 9:00 | `part5_openui/mixed_mode.py` then run it; open `out/part5_mixed.png` | Why mixed is the recommended default; action round trip / permission gate |
| 11:00 | `python -m unittest discover -s tests -v` | Tests are offline; what each one protects |
| 11:30 | Recap table of the 4 modes | When to choose each; one thing to try next |

## Harness integration (`part6_harness/`)

Key message: **UI is a tool; errors are tool results; actions pass a gate**

| Time | Show | Say |
|---|---|---|
| 0:00 | Slide / README diagram of the 3 modes | What problem this tech solves; the scenario (Q3 sales summary) and that the model is scripted so the run is repeatable |
| 1:00 | `docs/part6_harness.md` concept section + shared helper file | Walk the helper module top to bottom: what each function is for |
| 3:00 | `part6_harness/static_mode.py` then run it | Who decides the UI (the app). What the model controls. Point at the rejection/boundary step |
| 5:00 | `part6_harness/declarative_mode.py` then run it | Catalog as prompt+validator+renderer; the error/correction or streaming moment |
| 7:00 | `part6_harness/open_ended_mode.py` then run it | Why markup is dangerous; lint blocks the hostile reply; sandbox flags (`allow-scripts` without `allow-same-origin`, CSP) |
| 9:00 | `part6_harness/mixed_mode.py` then run it; open `out/part6_mixed.png` | Why mixed is the recommended default; action round trip / permission gate |
| 11:00 | `python -m unittest discover -s tests -v` | Tests are offline; what each one protects |
| 11:30 | Recap table of the 4 modes | When to choose each; one thing to try next |

## Links (fill in after upload)

| Part | YouTube URL |
|---|---|
| A2UI | _TODO_ |
| AG-UI | _TODO_ |
| MCP Apps | _TODO_ |
| json-render | _TODO_ |
| OpenUI Lang | _TODO_ |
| Harness integration | _TODO_ |
