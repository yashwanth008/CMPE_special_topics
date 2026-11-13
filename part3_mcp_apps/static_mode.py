"""MCP Apps x STATIC. The ui:// resource is a fixed HTML template; the tool result only supplies values.
Run: python part3_mcp_apps/static_mode.py"""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.fixtures import STATIC_CALL
from part3_mcp_apps.apps import STATIC_APP
from part3_mcp_apps._common import build_server, run, banner

banner("MCP APPS / STATIC: fixed HTML template + tool result values")
server = build_server("static", lambda a: STATIC_CALL["arguments"], STATIC_APP)
run("static template app", server, "static")
