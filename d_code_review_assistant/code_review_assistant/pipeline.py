"""Code Review Assistant - production-style ADK design.

Principle: use the LLM only where judgement/creativity is needed (writing tests, writing the review,
writing the fix). Everything checkable - parsing, linting, running tests, deciding when to stop - is
plain deterministic Python. That makes the system cheaper, faster, testable and auditable.

Root (LlmAgent, routes + talks to user)
 |- ReviewPipeline (Sequential): StaticAnalysis(det) -> TestWriter(LLM) -> TestRunner(det) -> FeedbackSynthesizer(LLM)
 '- FixPipeline    (Sequential): FixLoop(Loop<=3: CodeFixer(LLM) -> FixValidator(det, escalates on success))
                                 -> FixSummarizer(LLM)
"""
from __future__ import annotations

import json
import logging
import os
from typing import AsyncGenerator

from google.adk.agents import BaseAgent, LlmAgent, LoopAgent, SequentialAgent
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event, EventActions
from google.adk.tools import ToolContext
from google.genai import types

from .analysis import analyze_code, check_style
from .sandbox import run_tests, strip_code_fences

log = logging.getLogger("code_review")
SMART = os.getenv("REVIEW_SMART_MODEL", "gemini-2.5-pro")
FAST = os.getenv("REVIEW_FAST_MODEL", "gemini-2.5-flash")
MAX_CODE_CHARS = int(os.getenv("REVIEW_MAX_CODE_CHARS", "30000"))


def submit_code(code: str, tool_context: ToolContext) -> dict:
    """Store the user's Python code for review. Call this FIRST with the exact code the user provided.

    Args:
        code: the Python source to review (without markdown fences).
    """
    code = strip_code_fences(code)
    if len(code) > MAX_CODE_CHARS:
        return {"status": "error", "error": f"code too large ({len(code)} chars, max {MAX_CODE_CHARS})"}
    for k in ("analysis", "style", "generated_tests", "test_results", "review_feedback", "fixed_code",
              "fix_result"):
        tool_context.state[k] = None  # new submission invalidates previous results
    tool_context.state["code_to_review"] = code
    return {"status": "success", "chars": len(code), "lines": len(code.splitlines())}


def _ev(author: str, text: str, escalate: bool = False, **delta) -> Event:
    return Event(author=author, content=types.Content(role="model", parts=[types.Part(text=text)]),
                 actions=EventActions(state_delta=delta, escalate=escalate or None))


class StaticAnalysisAgent(BaseAgent):
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        code = ctx.session.state.get("code_to_review")
        if not code:
            yield _ev(self.name, "No code submitted.", escalate=True)
            return
        a, s = analyze_code(code), check_style(code)
        n_err = sum(1 for i in a["issues"] if i["severity"] == "error")
        yield _ev(self.name, f"Static analysis: {len(a['issues'])} issues ({n_err} errors), {len(s['issues'])} style findings.",
                  analysis=a, style=s)


class TestRunnerAgent(BaseAgent):
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        st = ctx.session.state
        if not (st.get("analysis") or {}).get("syntax_ok", False):
            res = {"status": "skipped", "passed": 0, "failed": 0, "output": "syntax error - tests not run"}
        else:
            res = run_tests(st["code_to_review"], st.get("generated_tests") or "")
        yield _ev(self.name, f"Tests {res['status']}: {res['passed']} passed, {res['failed']} failed.", test_results=res)


class FixValidatorAgent(BaseAgent):
    """Deterministic judge of the candidate fix. Escalating out of the LoopAgent = success."""

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        st = ctx.session.state
        fixed = strip_code_fences(st.get("fixed_code") or "")
        analysis = analyze_code(fixed)
        res = run_tests(fixed, st.get("generated_tests") or "") if analysis["syntax_ok"] else \
            {"status": "failed", "passed": 0, "failed": 1, "output": "syntax error in fix"}
        errors = [i for i in analysis["issues"] if i["severity"] == "error"]
        ok = analysis["syntax_ok"] and not errors and res["status"] == "passed"
        result = {"ok": ok, "tests": res, "remaining_errors": errors}
        log.info("fix validation ok=%s tests=%s errors=%d", ok, res["status"], len(errors))
        yield _ev(self.name, "Fix validated." if ok else "Fix still has problems; retrying.",
                  escalate=ok, fix_result=result, fixed_code=fixed)


def build_review_assistant(smart=SMART, fast=FAST):
    test_writer = LlmAgent(
        name="TestWriter", model=fast, output_key="generated_tests",
        instruction=("You write pytest tests for the Python module below. The module is importable as `candidate` "
                     "(`from candidate import ...`). Cover normal cases, edge cases and obvious failure modes. "
                     "Tests must be deterministic, offline and fast. Output ONLY a python code block.\n\n"
                     "```python\n{code_to_review}\n```\n\nKnown static findings (test for the real bugs among them):\n{analysis}"))
    synthesizer = LlmAgent(
        name="FeedbackSynthesizer", model=smart, output_key="review_feedback",
        instruction=("You are a staff engineer writing a code review. Use ONLY the evidence below.\n\n"
                     "Code:\n```python\n{code_to_review}\n```\nStatic analysis: {analysis}\nStyle: {style}\n"
                     "Test results: {test_results}\n\n"
                     "Write: 1) verdict (approve / request changes) with one-line reason, 2) Critical issues "
                     "(bugs, security) with line numbers, 3) Improvements, 4) Style nits, 5) test outcome. "
                     "Be specific and concise. End by offering to auto-fix."))
    review = SequentialAgent(
        name="ReviewPipeline",
        description="Reviews submitted code: static analysis, generated tests, and a written review.",
        sub_agents=[StaticAnalysisAgent(name="StaticAnalysis"), test_writer,
                    TestRunnerAgent(name="TestRunner"), synthesizer])

    fixer = LlmAgent(
        name="CodeFixer", model=smart, output_key="fixed_code",
        instruction=("Fix the code so that it passes the tests and has no error-level findings. Keep the public API "
                     "unchanged. Output ONLY the complete corrected module in one python code block.\n\n"
                     "Original:\n```python\n{code_to_review}\n```\nReview:\n{review_feedback}\n"
                     "Tests:\n```python\n{generated_tests}\n```\n"
                     "Previous attempt (empty on first try): {fixed_code?}\nLast validation: {fix_result?}"))
    fix_loop = LoopAgent(name="FixLoop", max_iterations=3,
                         sub_agents=[fixer, FixValidatorAgent(name="FixValidator")])
    fix_summary = LlmAgent(
        name="FixSummarizer", model=fast,
        instruction=("Summarise the auto-fix for the user. Show the final code in a python block, list what changed "
                     "and why, and state honestly whether validation passed: {fix_result}\n\nFinal code:\n{fixed_code}"))
    fix = SequentialAgent(
        name="FixPipeline",
        description="Automatically fixes the submitted code (max 3 attempts) and proves the fix with tests.",
        sub_agents=[fix_loop, fix_summary])

    return LlmAgent(
        name="CodeReviewAssistant", model=fast, tools=[submit_code], sub_agents=[review, fix],
        instruction=("You are a code review assistant for Python.\n"
                     "- When the user provides code: call submit_code with it, then transfer to ReviewPipeline.\n"
                     "- After a review, if the user wants fixes, transfer to FixPipeline.\n"
                     "- Otherwise answer briefly. Never claim tests passed unless the pipeline reported it."))
