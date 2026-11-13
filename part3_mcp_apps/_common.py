"""Shared driver for the four MCP Apps demos: build the server, run the host, prove the bridge policy."""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.browser import screenshot
from common.sandbox import lint_html
from common.ui import banner, step, show
from part3_mcp_apps.mcp import MCPServer, Host, tool_def, host_page

def region_details(a):
    return {"region": a.get("region"), "revenue_k": {"NA": 520, "EMEA": 410, "APAC": 310}.get(a.get("region"))}

def build_server(name, ui_tool_fn, app_html):
    """One UI tool (model-visible, declares a ui:// resource) and one app-only tool (hidden from the model)."""
    uri = f"ui://{name}/view.html"
    tools = {
        "show_sales": {"def": tool_def("show_sales", "Show the Q3 sales summary", ui_uri=uri, visibility=("model",)), "fn": ui_tool_fn},
        "show_region_details": {"def": tool_def("show_region_details", "Details for a region", visibility=("app",)),
                                "fn": region_details},
    }
    return MCPServer(name, tools, {uri: lambda: app_html})

def run(title, server, tag, check_html=None):
    host = Host(server)
    step(1, "Host connects and lists tools (JSON-RPC: initialize, tools/list).")
    for n, t in host.tools.items():
        print(f"  {n:<22} ui={t['_meta']['ui'].get('resourceUri')}  visibility={t['_meta']['ui']['visibility']}")
    print("  the MODEL only sees:", host.model_visible_tools(), " (app-only tools are hidden)")

    step(2, "Model calls show_sales. Host sees resourceUri and fetches the ui:// resource.")
    mount = host.run_tool("show_sales", {})
    print(f"  resource {mount['uri']}: {len(mount['html'])} chars of HTML (mime text/html;profile=mcp-app)")
    print("  structuredContent keys:", list(mount["result"]["structuredContent"]))
    if check_html:
        findings = lint_html(check_html(mount)); print("  lint of model-generated part:", findings or "clean")

    step(3, "Bridge policy. Requests from the iframe are checked by the HOST, not trusted.")
    for req in ({"id": 1, "method": "ui/initialize"},
                {"id": 2, "method": "tools/call", "params": {"name": "show_region_details", "arguments": {"region": "EMEA"}}},
                {"id": 3, "method": "tools/call", "params": {"name": "show_sales", "arguments": {}}},
                {"id": 4, "method": "tools/call", "params": {"name": "delete_database", "arguments": {}}}):
        r = host.app_request({"jsonrpc": "2.0", **req}); nm = req.get("params", {}).get("name", "")
        print(f"  app asks {req['method']:<12}{nm:<22} -> " + ("OK" if "result" in r else "REFUSED: " + r["error"]["message"]))

    step(4, "Render the host page in headless Chrome: iframe + live bridge log.")
    out = pathlib.Path("out") / f"part3_{tag}.html"; out.parent.mkdir(exist_ok=True)
    out.write_text(host_page(mount, title))
    screenshot(out, f"out/part3_{tag}.png", 500, 520, 900)
    print("  server-side RPC log:", [m for m, _ in host.log])
