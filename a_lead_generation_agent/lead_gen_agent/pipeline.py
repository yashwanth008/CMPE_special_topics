"""Deep-research lead generation pipeline built with Google ADK.

Flow:  IntentExtractor -> LeadFinder -> LeadFormatter -> DynamicResearch (parallel, 1 branch / lead)
       -> LeadScorer (deterministic) -> ReportCompiler

Why the odd Finder/Formatter split?  Gemini's built-in google_search tool cannot be combined with
`output_schema` on one agent, so a searching agent emits free text and a second, tool-less agent
turns it into validated JSON. The same pattern is used for every researcher branch.
"""
from __future__ import annotations

import logging
import os
from typing import AsyncGenerator

from google.adk.agents import BaseAgent, LlmAgent, ParallelAgent, SequentialAgent
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event, EventActions
from google.adk.tools import FunctionTool, google_search
from google.genai import types

from .prompts import (
    FINDER_PROMPT, FORMATTER_PROMPT, INTENT_PROMPT, REPORT_PROMPT,
    RESEARCH_FORMATTER_PROMPT, RESEARCHER_PROMPT,
)
from .schemas import LeadList, LeadResearch, SearchIntent
from .tools import export_leads_csv, score_lead

log = logging.getLogger("lead_gen")

DEFAULT_SMART_MODEL = os.getenv("LEADGEN_SMART_MODEL", "gemini-2.5-pro")
DEFAULT_FAST_MODEL = os.getenv("LEADGEN_FAST_MODEL", "gemini-2.5-flash")


def _msg(author: str, text: str, **state_delta) -> Event:
    return Event(
        author=author,
        content=types.Content(role="model", parts=[types.Part(text=text)]),
        actions=EventActions(state_delta=state_delta),
    )


class DynamicResearchAgent(BaseAgent):
    """Fans out one Researcher->Formatter branch per lead found, run in parallel.

    The number of branches is only known at runtime, so we build the ParallelAgent inside
    _run_async_impl. Results land in state as lead_research_<i>.
    """

    smart_model: object
    fast_model: object
    search_tool: object
    max_leads: int = 8

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        leads = (ctx.session.state.get("leads") or {}).get("leads", [])[: self.max_leads]
        if not leads:
            yield _msg(self.name, "No leads to research.")
            return
        branches = []
        for i, lead in enumerate(leads):
            branches.append(SequentialAgent(
                name=f"Research_{i}",
                sub_agents=[
                    LlmAgent(
                        name=f"Researcher_{i}",
                        model=self.smart_model,
                        instruction=RESEARCHER_PROMPT.format(
                            company=lead["company_name"], website=lead.get("website", ""),
                            why_fit=lead.get("why_fit", "")),
                        tools=[self.search_tool],
                        output_key=f"research_note_{i}",
                    ),
                    LlmAgent(
                        name=f"ResearchFormatter_{i}",
                        model=self.fast_model,
                        instruction=RESEARCH_FORMATTER_PROMPT.format(
                            company=lead["company_name"], note="{research_note_%d}" % i),
                        output_schema=LeadResearch,
                        output_key=f"lead_research_{i}",
                    ),
                ],
            ))
        log.info("researching %d leads in parallel", len(branches))
        async for ev in ParallelAgent(name="ParallelResearch", sub_agents=branches).run_async(ctx):
            yield ev


class LeadScorerAgent(BaseAgent):
    """Pure-Python, no LLM: merges lead + research, scores, sorts. Deterministic and unit-tested."""

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        state = ctx.session.state
        leads = (state.get("leads") or {}).get("leads", [])
        scored = []
        for i, lead in enumerate(leads):
            research = state.get(f"lead_research_{i}")
            s = score_lead(research)
            scored.append({
                "company_name": lead["company_name"], "website": lead.get("website", ""),
                "contact_role": lead.get("contact_role", ""), "why_fit": lead.get("why_fit", ""),
                "summary": (research or {}).get("summary", ""),
                "sources": (research or {}).get("sources", []), **s,
            })
        scored.sort(key=lambda d: d["score"], reverse=True)
        yield _msg(self.name, f"Scored {len(scored)} leads.", scored_leads=scored)


def build_lead_gen_agent(smart_model=DEFAULT_SMART_MODEL, fast_model=DEFAULT_FAST_MODEL,
                         search_tool=None) -> SequentialAgent:
    """Factory so tests/other deployments can inject models and the search tool."""
    search_tool = search_tool or google_search
    return SequentialAgent(
        name="LeadGenPipeline",
        description="Finds, researches, scores and reports on B2B sales leads.",
        sub_agents=[
            LlmAgent(name="IntentExtractor", model=fast_model, instruction=INTENT_PROMPT,
                     output_schema=SearchIntent, output_key="intent"),
            LlmAgent(name="LeadFinder", model=smart_model, instruction=FINDER_PROMPT,
                     tools=[search_tool], output_key="raw_leads"),
            LlmAgent(name="LeadFormatter", model=fast_model, instruction=FORMATTER_PROMPT,
                     output_schema=LeadList, output_key="leads"),
            DynamicResearchAgent(name="DynamicResearch", smart_model=smart_model,
                                 fast_model=fast_model, search_tool=search_tool),
            LeadScorerAgent(name="LeadScorer"),
            LlmAgent(name="ReportCompiler", model=smart_model, instruction=REPORT_PROMPT,
                     tools=[FunctionTool(export_leads_csv)], output_key="report"),
        ],
    )
