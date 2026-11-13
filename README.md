# ADK Agents Portfolio — five production-style agents with Google ADK

| | Agent | Core ideas | Tests |
|---|---|---|---|
| a | [Deep-research lead generation](a_lead_generation_agent) | Sequential + dynamic Parallel fan-out, schema'd handoffs, deterministic scoring | 4 |
| b | [Gemini CLI as a tool in an ADK pipeline](b_gemini_cli_tool_agent) | Subprocess tool hardening, URL allow-list, Cloud Run image with Node+CLI | 14 |
| c | [MCP bug assistant](c_mcp_bug_assistant) | Own MCP server, McpToolset (stdio/HTTP), human-approved writes | 8 |
| d | [Code review assistant](d_code_review_assistant) | Deterministic+LLM hybrid, sandboxed tests, validator-driven LoopAgent | 10 |
| e | [E-commerce agent](e_ecommerce_agent) | MCP backend, identity binding, confirmed checkout, FastAPI + auth | 12 |

**48 offline tests** exercise the real ADK `Runner`, sessions, tool execution, parallel agents, loops, confirmation flow and real MCP subprocesses. Only the LLM is replaced by `shared/adk_testing/scripted_llm.py` — a deterministic stand-in — so everything runs in CI with no API key.

```bash
./run_tests.sh          # all five suites
```
**What offline tests do *not* prove:** prompt quality and live Gemini behaviour (tool selection, JSON adherence, `google_search` grounding). Run each agent with `adk web` and a real key to see that; `VIDEO_SCRIPT.md` has the demo prompts.

Versions: built and tested with `google-adk 2.14`, `mcp 1.30`, Python 3.13. ADK 2.x marks `SequentialAgent/ParallelAgent/LoopAgent` as deprecated in favour of `Workflow` (still fully working; `Workflow` can't yet be nested under an `LlmAgent`, which agent (d) needs).

## Acknowledgements
Architectures were informed by the reference tutorials/repos linked in the assignment (Google Cloud ADK blogs & codelabs, MagnIeeT/leadGenerationAgentADK, derrickchwong/gemini-cli-on-adk, google/adk-samples software-bug-assistant, ayoisio/adk-code-review-assistant, mtoscano84/sports-agent-adk-mcp-alloydb). The code here is an independent implementation with different structure, extra safeguards and tests.

Walkthrough/recording guide: [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md).
