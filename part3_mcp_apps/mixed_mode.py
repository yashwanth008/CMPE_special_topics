"""MCP Apps x MIXED. Catalog components plus one HtmlArtifact, inside an MCP App. Static + open-ended together.
Run: python part3_mcp_apps/mixed_mode.py"""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import HYBRID_CATALOG, validate_spec
from common.fixtures import MIXED_SPEC
from part3_mcp_apps.apps import RENDERER_APP
from part3_mcp_apps._common import build_server, run, banner

banner("MCP APPS / MIXED: catalog + nested sandbox in a third-party host")
def tool(_a):
    validate_spec(MIXED_SPEC, HYBRID_CATALOG); return {"spec": MIXED_SPEC}
run("mixed app", build_server("mixed", tool, RENDERER_APP), "mixed",
    check_html=lambda m: m["result"]["structuredContent"]["spec"]["elements"]["chart"]["props"]["html"])
