# YouTube walkthrough — script & shot list (~18 min)

Record with screen capture (OBS / QuickTime), terminal font ≥ 18pt. Upload as *Unlisted*, put the link in the top-level README.

## 0:00 Intro (1 min)
- Show repo tree. "Five agents, one pattern: LLM where judgement is needed, plain code where it can be checked, tests that run the *real* ADK runtime."
- Show `shared/adk_testing/scripted_llm.py` (~70 lines) — explain the offline-test trick.
- Run `./run_tests.sh` → 48 passed.

## 1:00 (a) Lead generation — 4 min
1. Open `pipeline.py`; draw the Mermaid diagram from the README. Point out **why Finder/Formatter are separate** (search tool vs `output_schema`).
2. Show `DynamicResearchAgent` — fan-out built at runtime.
3. Show `tools.py::score_lead` — "no source URL → no points".
4. Live: `adk web` → prompt: *"Find 5 mid-size logistics companies in Germany hiring data engineers; I sell a data-pipeline platform."* Show the event trace (parallel Researcher_i branches), final table, `outputs/leads.csv`.
5. `pytest -v` for (a).

## 5:00 (b) Gemini CLI as a tool — 3 min
1. `tools.py` docstring: the security rules. Demo `test_cli_runs_in_repo_without_shell` — the injection string stays one argument.
2. Live: `export GEMINI_API_KEY=…; adk web` → *"Generate a test plan for https://github.com/google/adk-samples"*. Show planner JSON → CLI tool call → report.
3. Try `https://evil.com/x/y` → blocked by the guard.
4. Show `Dockerfile` + `./deploy.sh`.

## 8:00 (c) MCP bug assistant — 3.5 min
1. Run `python -m bug_assistant.mcp_servers.tickets_server` standalone; mention Claude Desktop could use it too.
2. `agent.py`: two McpToolsets (read vs write + confirmation).
3. Live: paste *"Users get HTTP 500 on /login after password reset: KeyError 'session_token' auth/session.py:88"* → agent finds the related ticket. Then *"File a new ticket: export crashes on large CSV"* → ADK shows the **confirmation request**; approve; confirm with `ticket_stats`.
4. Run the approve/reject tests.

## 11:30 (d) Code review — 4 min
1. Diagram: deterministic vs LLM nodes (colour them in the video).
2. Paste buggy code (`def add_item(item, bucket=[])` + bare `except:` + `eval`). Show the review citing a real pytest failure.
3. Say *"fix it"* → watch FixLoop: an attempt rejected by the validator, then accepted. Show final code.
4. `sandbox.py`: rlimits, scrubbed env; run `test_sandbox_timeout` and `test_sandbox_does_not_leak_env_secrets`.

## 15:30 (e) E-commerce — 3 min
1. Diagram; table of production concerns from the README.
2. Start API: `ALLOW_DEV_AUTH=1 uvicorn --factory ecommerce_agent.app:get_app --port 8080`.
3. curl: search Nike → add to cart → ask to checkout → response contains `pending_confirmation` → `curl /confirm` with `approved:true` → order created.
4. Show the identity-override test (model supplies `victim`, cart goes to the signed-in user).

## 18:30 Wrap-up
- What the offline tests prove vs. what needs live Gemini. Repo link in the description.

### Description template
```
Five production-style Google ADK agents: lead-gen deep research, Gemini CLI as a tool, MCP bug assistant,
code review assistant, e-commerce agent. Code: <GITHUB URL>
Chapters: 0:00 Intro · 1:00 Lead gen · 5:00 Gemini CLI · 8:00 MCP bugs · 11:30 Code review · 15:30 E-commerce
```
