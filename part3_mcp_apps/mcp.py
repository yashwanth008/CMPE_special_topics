"""A tiny MCP server + MCP Apps host (teaching subset).

MCP Apps in one paragraph: a TOOL declares _meta.ui.resourceUri = "ui://...". The HOST (a third-party
app such as Claude Desktop) reads that resource (HTML, mime text/html;profile=mcp-app), mounts it in a
sandboxed iframe, then talks to it over postMessage using JSON-RPC. The host decides what the app may do.
"""
import json, html as H

MIME = "text/html;profile=mcp-app"


class MCPServer:
    def __init__(self, name, tools, resources):
        self.name, self.tools, self.resources = name, tools, resources  # tools: name -> {"def", "fn"}

    def handle(self, req):
        m, p, i = req["method"], req.get("params", {}), req.get("id")
        try:
            if m == "initialize":
                res = {"serverInfo": {"name": self.name}, "capabilities": {"tools": {}, "resources": {}}}
            elif m == "tools/list":
                res = {"tools": [t["def"] for t in self.tools.values()]}
            elif m == "tools/call":
                out = self.tools[p["name"]]["fn"](p.get("arguments", {}))
                res = {"content": [{"type": "text", "text": json.dumps(out)}], "structuredContent": out}
            elif m == "resources/read":
                res = {"contents": [{"uri": p["uri"], "mimeType": MIME, "text": self.resources[p["uri"]]()}]}
            else:
                return {"jsonrpc": "2.0", "id": i, "error": {"code": -32601, "message": f"no method {m}"}}
        except KeyError as e:
            return {"jsonrpc": "2.0", "id": i, "error": {"code": -32602, "message": f"unknown {e}"}}
        return {"jsonrpc": "2.0", "id": i, "result": res}


def tool_def(name, desc, ui_uri=None, visibility=("model", "app")):
    d = {"name": name, "description": desc, "inputSchema": {"type": "object"}}
    d["_meta"] = {"ui": {"visibility": list(visibility), **({"resourceUri": ui_uri} if ui_uri else {})}}
    return d


class Host:
    """The third-party host. It owns the policy: who may call what."""

    def __init__(self, server):
        self.server, self._id, self.log = server, 0, []
        self.rpc("initialize")
        self.tools = {t["name"]: t for t in self.rpc("tools/list")["tools"]}

    def rpc(self, method, **params):
        self._id += 1
        resp = self.server.handle({"jsonrpc": "2.0", "id": self._id, "method": method, "params": params})
        self.log.append((method, "ok" if "result" in resp else resp["error"]["message"]))
        if "error" in resp:
            raise RuntimeError(resp["error"]["message"])
        return resp["result"]

    def model_visible_tools(self):
        return [n for n, t in self.tools.items() if "model" in t["_meta"]["ui"]["visibility"]]

    def run_tool(self, name, args):
        """The model calls a tool. If the tool declares a UI, fetch the resource and build the mount."""
        result = self.rpc("tools/call", name=name, arguments=args)
        uri = self.tools[name]["_meta"]["ui"].get("resourceUri")
        html = self.rpc("resources/read", uri=uri)["contents"][0]["text"] if uri else None
        return {"tool": name, "args": args, "result": result, "uri": uri, "html": html}

    def app_request(self, req):
        """The bridge: requests coming FROM the iframe. Host policy is applied here."""
        if req["method"] == "ui/initialize":
            return {"jsonrpc": "2.0", "id": req["id"], "result": {"hostContext": {"theme": "light"}}}
        if req["method"] == "tools/call":
            t = self.tools.get(req["params"]["name"])
            if not t or "app" not in t["_meta"]["ui"]["visibility"]:
                return {"jsonrpc": "2.0", "id": req["id"],
                        "error": {"code": -32001, "message": "host refused: tool not callable by apps"}}
            return {"jsonrpc": "2.0", "id": req["id"], "result": self.rpc("tools/call", **req["params"])}
        return {"jsonrpc": "2.0", "id": req["id"], "error": {"code": -32601, "message": "unsupported"}}


HOST_TEMPLATE = """<!doctype html><meta charset=utf-8><title>__TITLE__</title>
<style>body{font:14px system-ui;max-width:460px;margin:12px auto}h4{margin:4px 0}
iframe#app{width:100%;height:290px;border:2px solid #4f46e5;border-radius:8px}
pre{background:#111;color:#9ef;padding:8px;border-radius:6px;font-size:11px;height:110px;overflow:auto}</style>
<h4>HOST: __TITLE__</h4><iframe id=app sandbox="allow-scripts" srcdoc="__APP__"></iframe>
<h4>bridge log</h4><pre id=log></pre>
<script>
const log = s => document.getElementById('log').textContent += s + '\\n';
const f = document.getElementById('app'), APP_TOOLS = ['show_region_details'];
window.addEventListener('message', e => {
  if (e.source !== f.contentWindow) return;
  const m = e.data;
  log('app  -> host  ' + m.method + (m.params && m.params.name ? '(' + m.params.name + ')' : ''));
  if (m.method === 'ui/initialize') {
    f.contentWindow.postMessage({jsonrpc:'2.0', id:m.id, result:{hostContext:{theme:'light'}}}, '*');
    log('host -> app   initialize result');
  }
  if (m.method === 'tools/call') {
    const ok = APP_TOOLS.includes(m.params.name);
    f.contentWindow.postMessage(ok ? {jsonrpc:'2.0', id:m.id, result:{content:[{type:'text', text:'EMEA: 410k'}]}}
                                   : {jsonrpc:'2.0', id:m.id, error:{code:-32001, message:'refused'}}, '*');
    log('host -> app   ' + (ok ? 'tool result' : 'REFUSED'));
  }
});
f.addEventListener('load', () => setTimeout(() => {
  f.contentWindow.postMessage(__RESULT__, '*');
  log('host -> app   ui/notifications/tool-result');
}, 50));
</script>"""


def host_page(mount, title):
    """A browser host page: the MCP App in a sandboxed iframe + a live bridge log."""
    note = {"jsonrpc": "2.0", "method": "ui/notifications/tool-result", "params": mount["result"]}
    return (HOST_TEMPLATE.replace("__TITLE__", H.escape(title))
            .replace("__APP__", H.escape(mount["html"], quote=True))
            .replace("__RESULT__", json.dumps(note).replace("</", "<\\/")))
