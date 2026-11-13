"""MCP Apps x DECLARATIVE. The tool returns a validated catalog spec; the app is a generic renderer.
The server validates BEFORE returning, so a bad model reply never reaches the host.
Run: python part3_mcp_apps/declarative_mode.py"""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import CATALOG, validate_spec
from common.fixtures import DECL_SPEC
from part3_mcp_apps.apps import RENDERER_APP
from part3_mcp_apps._common import build_server, run, banner

banner("MCP APPS / DECLARATIVE: spec in the tool result, generic renderer app")
def tool(_args):
    validate_spec(DECL_SPEC, CATALOG)       # server-side contract check
    return {"spec": DECL_SPEC}
run("declarative renderer app", build_server("decl", tool, RENDERER_APP), "declarative")
