"""Finn - e-commerce shopping agent (Google ADK + MCP).

Production-minded choices
  * Identity is NOT trusted from the model: before_tool_callback overwrites `user_id` with the authenticated
    user from session state, so prompt injection can't read or modify someone else's cart/orders.
  * Money-moving tool (`checkout`) sits behind ADK tool confirmation (human approves before it runs).
  * Tool allow-lists per toolset; server validates every argument again (defence in depth).
  * Backend is an MCP server -> swap SQLite for AlloyDB/MCP Toolbox (see toolbox/) without touching the agent.
"""
import os
import sys

from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams, StreamableHTTPConnectionParams
from mcp import StdioServerParameters

load_dotenv()
MODEL = os.getenv("SHOP_AGENT_MODEL", "gemini-2.5-flash")

BROWSE_TOOLS = ["search_products", "get_product", "view_cart", "get_order", "find_nearest_stores"]
CART_TOOLS = ["add_to_cart", "remove_from_cart"]
PAY_TOOLS = ["checkout"]
USER_SCOPED = {"add_to_cart", "remove_from_cart", "view_cart", "checkout", "get_order"}

INSTRUCTION = """You are Finn, the shopping assistant for GenAI Sports. Help customers find sports gear, manage a cart and place orders.

Rules
- ALWAYS use tools for product, price, stock, cart, order and store information. Never guess or invent products.
- For user-scoped tools pass user_id="me" (the platform replaces it with the signed-in user).
- Search with only essential keywords: "I want to see Nike products" -> brand "Nike".
- Before add_to_cart, make sure the customer chose a valid size and colour; ask if unclear.
- Before checkout, show the cart and total and ask for a full shipping address. The platform will then ask the
  customer to confirm the payment - do not ask them to type card details.
- Prices are in euros. Keep answers short. List products as: `• <name> (<brand>) - <price>` with a one-line description."""


def _params():
    url = os.getenv("MCP_SHOP_URL")
    if url:
        return StreamableHTTPConnectionParams(url=url)
    return StdioConnectionParams(server_params=StdioServerParameters(
        command=sys.executable, args=["-m", "ecommerce_agent.mcp_server"], env={**os.environ}))


def make_toolsets():
    return [
        McpToolset(connection_params=_params(), tool_filter=BROWSE_TOOLS),
        McpToolset(connection_params=_params(), tool_filter=CART_TOOLS),
        McpToolset(connection_params=_params(), tool_filter=PAY_TOOLS, require_confirmation=True),
    ]


def enforce_identity(tool, args, tool_context):
    """before_tool_callback: bind user-scoped calls to the authenticated user; refuse if not signed in."""
    if tool.name in USER_SCOPED:
        uid = tool_context.state.get("user_id")
        if not uid:
            return {"error": "not signed in"}
        args["user_id"] = uid      # overwrite whatever the model supplied
    return None


def build_agent(model=MODEL, toolsets=None) -> Agent:
    return Agent(name="finn", model=model, instruction=INSTRUCTION,
                 tools=toolsets or make_toolsets(), before_tool_callback=enforce_identity)


root_agent = build_agent()
