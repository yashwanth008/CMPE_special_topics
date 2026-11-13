"""Software Bug Assistant: an ADK agent whose ticket tools come from an MCP server.

Tool sources
  1. Ticket tracker  -> MCP server (stdio subprocess locally, or streamable-HTTP URL in prod)
  2. Public web      -> `google_search` wrapped as an AgentTool (built-in search cannot share an agent
                        with other tools on every Gemini version, so it lives in its own sub-agent)
  3. Local helper    -> extract_error_signature(), a plain Python tool
"""
import os
import re
import sys

from dotenv import load_dotenv
from google.adk.agents import Agent, LlmAgent
from google.adk.tools import AgentTool, google_search
from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams, StreamableHTTPConnectionParams
from mcp import StdioServerParameters

load_dotenv()
MODEL = os.getenv("BUG_ASSISTANT_MODEL", "gemini-2.5-flash")

READ_TOOLS = ["search_tickets", "get_ticket", "ticket_stats"]
WRITE_TOOLS = ["create_ticket", "update_ticket_status"]


def extract_error_signature(stack_trace: str) -> dict:
    """Pull the exception type, message and top project frame out of a pasted stack trace.

    Args:
        stack_trace: raw traceback / error text.

    Returns:
        dict with exception, message and location (best effort) to use as search keywords.
    """
    exc = re.search(r"([A-Za-z_][\w.]*(?:Error|Exception|Failure))\s*:?\s*(.*)", stack_trace)
    loc = re.search(r'File "([^"]+)", line (\d+)|\bat\s+([\w.$<>]+)\(([\w.]+:\d+)\)|([\w/.-]+\.\w+):(\d+)', stack_trace)
    return {
        "exception": exc.group(1) if exc else "",
        "message": (exc.group(2).strip() if exc else "")[:200],
        "location": loc.group(0) if loc else "",
    }


def _connection_params():
    """Remote MCP server if MCP_TICKETS_URL is set (production), else spawn the bundled one over stdio."""
    url = os.getenv("MCP_TICKETS_URL")
    if url:
        return StreamableHTTPConnectionParams(url=url)
    return StdioConnectionParams(server_params=StdioServerParameters(
        command=sys.executable, args=["-m", "bug_assistant.mcp_servers.tickets_server"],
        env={**os.environ},
    ))


def make_ticket_toolsets() -> list[McpToolset]:
    """Two views of the same MCP server.

    * read toolset  - runs freely.
    * write toolset - `require_confirmation=True`: ADK pauses the run and asks the human to approve
      every create/update before it reaches the tracker (human-in-the-loop for side effects).
    The allow-lists mean new tools added to the server are NOT exposed until reviewed here.
    """
    return [
        McpToolset(connection_params=_connection_params(), tool_filter=READ_TOOLS),
        McpToolset(connection_params=_connection_params(), tool_filter=WRITE_TOOLS, require_confirmation=True),
    ]


INSTRUCTION = """You are a Software Bug Assistant for an engineering team.

Workflow for a bug report:
1. If a stack trace is pasted, call extract_error_signature and use its exception/location as keywords.
2. ALWAYS call search_tickets first to look for duplicates or related tickets (try 2 keyword variants).
3. If a close match exists, show it (id, title, status) and suggest next steps instead of filing a duplicate.
4. If useful, ask the `web_researcher` tool for known causes/fixes and cite what it returns.
5. Only create a ticket when the user asks you to or agrees; choose severity honestly:
   critical = data loss / outage / security; high = major feature broken; medium = degraded; low = cosmetic.
6. Only change a ticket's status when the user asks.

Never invent ticket ids or contents - only report what tools return. Be concise and use short bullet lists."""


def build_agent(model=MODEL, ticket_toolsets=None, extra_tools=None) -> Agent:
    web = LlmAgent(
        name="web_researcher", model=model, tools=[google_search],
        description="Searches the public web for known causes and fixes of an error or bug.",
        instruction="Search the web and summarise likely causes and fixes with source URLs. Be brief.",
    )
    tools = [*(ticket_toolsets or make_ticket_toolsets()), extract_error_signature, AgentTool(agent=web)]
    return Agent(name="bug_assistant", model=model, instruction=INSTRUCTION,
                 tools=tools + (extra_tools or []))


root_agent = build_agent()
