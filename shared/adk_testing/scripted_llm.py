"""A deterministic, offline stand-in for Gemini.

It lets every agent in this portfolio run end-to-end (real ADK Runner, real
sessions, real tool execution, real MCP servers) without an API key or network.

Rules are matched against the agent's *system instruction*; each rule owns a queue
of responses that is consumed in order. When a queue is exhausted the last item
repeats. Use `text("...")` for a model reply and `call("tool", a=1)` for a tool call.
"""
from __future__ import annotations

import asyncio
import uuid
from typing import AsyncGenerator, Sequence

from google.adk.models import BaseLlm, LlmRequest, LlmResponse
from google.genai import types
from pydantic import Field


def text(s: str) -> LlmResponse:
    return LlmResponse(content=types.Content(role="model", parts=[types.Part(text=s)]))


def call(name: str, **args) -> LlmResponse:
    part = types.Part(function_call=types.FunctionCall(name=name, args=args, id=f"call-{uuid.uuid4().hex[:8]}"))
    return LlmResponse(content=types.Content(role="model", parts=[part]))


class ScriptedLlm(BaseLlm):
    model: str = "scripted"
    # list of (substring_in_system_instruction, [responses])
    rules: list = Field(default_factory=list)
    seen: list = Field(default_factory=list)  # (rule_key, last_user_text) for assertions
    _cursor: dict = {}

    @classmethod
    def supported_models(cls) -> list[str]:
        return ["scripted"]

    async def generate_content_async(
        self, llm_request: LlmRequest, stream: bool = False
    ) -> AsyncGenerator[LlmResponse, None]:
        system = ""
        if llm_request.config and llm_request.config.system_instruction:
            si = llm_request.config.system_instruction
            system = si if isinstance(si, str) else str(getattr(si, "parts", si))
        last_user = ""
        if llm_request.contents:
            for p in (llm_request.contents[-1].parts or []):
                if p.text:
                    last_user += p.text
        for key, responses in self.rules:
            if key in system:
                idx = self._cursor.get(key, 0)
                resp = responses[min(idx, len(responses) - 1)]
                self._cursor[key] = idx + 1
                self.seen.append((key, last_user))
                yield resp
                return
        raise AssertionError(f"ScriptedLlm: no rule matched system instruction: {system[:200]!r}")


def run_agent_sync(agent, message: str, *, user_id="u1", state: dict | None = None):
    """Run an agent with the real ADK runner and return (events, final_session_state)."""
    from google.adk.runners import InMemoryRunner

    async def _go():
        runner = InMemoryRunner(agent=agent, app_name="test_app")
        session = await runner.session_service.create_session(
            app_name="test_app", user_id=user_id, state=state or {}
        )
        events = []
        async for ev in runner.run_async(
            user_id=user_id,
            session_id=session.id,
            new_message=types.Content(role="user", parts=[types.Part(text=message)]),
        ):
            events.append(ev)
        final = await runner.session_service.get_session(
            app_name="test_app", user_id=user_id, session_id=session.id
        )
        return events, final.state

    return asyncio.run(_go())


def last_text(events) -> str:
    for ev in reversed(events):
        if ev.content and ev.content.parts:
            t = "".join(p.text or "" for p in ev.content.parts)
            if t.strip():
                return t
    return ""
