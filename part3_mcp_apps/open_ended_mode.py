"""MCP Apps x OPEN-ENDED. The model's HTML travels in the tool result and is mounted in a NESTED sandbox,
two boundaries deep: host iframe > app > nested iframe. The server keeps any API key, never the iframe.
Run: python part3_mcp_apps/open_ended_mode.py"""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.fixtures import OPEN_HTML
from part3_mcp_apps.apps import RENDERER_APP
from part3_mcp_apps._common import build_server, run, banner

banner("MCP APPS / OPEN-ENDED: generated HTML in a nested sandbox")
spec = {"root": "art", "elements": {"art": {"type": "HtmlArtifact", "props": {"html": OPEN_HTML, "height": 200}}}}
server = build_server("open", lambda a: {"spec": spec}, RENDERER_APP)
run("open-ended app", server, "open_ended", check_html=lambda m: m["result"]["structuredContent"]["spec"]["elements"]["art"]["props"]["html"])
