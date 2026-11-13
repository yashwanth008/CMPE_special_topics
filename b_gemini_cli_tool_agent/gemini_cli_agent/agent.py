"""Gemini CLI as a tool inside an ADK pipeline.

  RequestPlanner  -> turns chat into {repo_url, task}                (structured output)
  CliWorker       -> calls the Gemini CLI tool (+ file reader)       (tool use)
  ReportWriter    -> turns raw CLI output into a clean answer        (synthesis)
"""
import os

from dotenv import load_dotenv
from google.adk.agents import LlmAgent, SequentialAgent
from pydantic import BaseModel, Field

from .tools import clone_repo, read_repo_file, run_gemini_cli, parse_github_url

load_dotenv()
SMART = os.getenv("GEMINI_CLI_AGENT_MODEL", "gemini-2.5-pro")
FAST = os.getenv("GEMINI_CLI_AGENT_FAST_MODEL", "gemini-2.5-flash")


class CliRequest(BaseModel):
    repo_url: str = Field(description="https://github.com/<owner>/<repo>")
    task: str = Field(description="What the user wants done with the codebase, as one clear instruction.")


def guard_tool_args(tool, args, tool_context):
    """before_tool_callback: second line of defence on top of the tool's own validation."""
    if "github_url" in args:
        try:
            parse_github_url(args["github_url"])
        except ValueError as e:
            return {"status": "error", "error": str(e)}
    return None  # proceed


def build_agent(smart=SMART, fast=FAST) -> SequentialAgent:
    planner = LlmAgent(
        name="RequestPlanner", model=fast, output_schema=CliRequest, output_key="cli_request",
        instruction=("Extract the GitHub repository URL and the task from the user's message. "
                     "If no URL was given, use the URL most recently discussed. Reply only with JSON."),
    )
    worker = LlmAgent(
        name="CliWorker", model=smart, output_key="cli_output",
        instruction=("You are a senior engineer with a powerful tool: the Gemini CLI, which can analyse a whole "
                     "codebase. Request: {cli_request}. Always call run_gemini_cli with the repo_url and a precise "
                     "task to do the heavy analysis; use read_repo_file only to double-check a specific file. "
                     "Return the tool output verbatim; if a tool returns an error, report it."),
        tools=[run_gemini_cli, read_repo_file, clone_repo],
        before_tool_callback=guard_tool_args,
    )
    writer = LlmAgent(
        name="ReportWriter", model=smart,
        instruction=("Turn the raw Gemini CLI output below into a clear, well-structured answer for the user. "
                     "Do not add facts that are not in the output. Mention if the output was truncated or errored.\n\n"
                     "{cli_output}"),
    )
    return SequentialAgent(name="GeminiCliPipeline", sub_agents=[planner, worker, writer],
                           description="Analyses GitHub repos by delegating to the Gemini CLI.")


root_agent = build_agent()
