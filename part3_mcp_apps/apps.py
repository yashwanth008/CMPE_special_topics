"""The HTML 'apps' that MCP servers ship as ui:// resources. Each is a complete page that runs in the host's iframe."""

COMMON_JS = r"""
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let rid = 1;
const rpc = (method, params) => parent.postMessage({jsonrpc:'2.0', id: rid++, method, params}, '*');
rpc('ui/initialize', {appInfo: {name: 'demo-app'}});
addEventListener('message', e => {
  const m = e.data || {};
  if (m.method === 'ui/notifications/tool-result') render(m.params.structuredContent);
  else if (m.result && m.result.content) document.getElementById('status').textContent = 'host replied: ' + m.result.content[0].text;
  else if (m.error) document.getElementById('status').textContent = 'host said: ' + m.error.message;
});
const act = (name, args) => rpc('tools/call', {name, arguments: args});
"""

CSS = ("<style>body{font:14px system-ui;margin:8px}.m{border:1px solid #ddd;border-radius:10px;padding:8px 12px;margin:6px 0}"
       ".m b{font-size:24px;display:block}.m i{color:#16a34a}.bar{background:#4f46e5;height:14px;display:inline-block}"
       "button{padding:6px 10px;border-radius:8px;border:1px solid #4f46e5;background:#eef2ff;margin:4px 4px 4px 0}"
       "#status{color:#555;font-size:12px}</style>")

SHELL = "<!doctype html><meta charset=utf-8>" + CSS + "<div id=root>waiting for tool result...</div><div id=status></div><script>__JS__</script>"

# STATIC: layout is fixed in the app. The tool result only fills in values.
STATIC_JS = r"""
function render(d) {
  document.getElementById('root').innerHTML =
    '<div class=m><small>' + esc(d.label) + '</small><b>' + esc(d.value) + '</b><i>' + esc(d.delta) + '</i></div>' +
    '<button onclick="act(\'show_region_details\', {region: \'EMEA\'})">Show EMEA details</button>';
}
"""

# DECLARATIVE / OPEN / MIXED: one generic renderer. The tool result carries a spec.
RENDERER_JS = r"""
const CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'";
function draw(s, id) {
  const n = s.elements[id], p = n.props || {};
  switch (n.type) {
    case 'Stack': return n.children.map(c => draw(s, c)).join('');
    case 'Heading': return '<h3>' + esc(p.text) + '</h3>';
    case 'Metric': return '<div class=m><small>' + esc(p.label) + '</small><b>' + esc(p.value) + '</b><i>' + esc(p.delta) + '</i></div>';
    case 'BarChart': return Object.entries(p.data).map(([k, v]) => '<div>' + esc(k) + ' <span class=bar style="width:' + (v / 4) + 'px"></span> ' + v + '</div>').join('');
    case 'Button': return '<button onclick="act(\'show_region_details\', {region: \'' + esc(p.action.split(':')[1]) + '\'})">' + esc(p.label) + '</button>';
    case 'HtmlArtifact':  // NESTED sandbox: a second boundary inside the host's iframe
      return '<iframe sandbox="allow-scripts" style="border:1px dashed #db2777;width:100%;height:' + (p.height || 120) +
             'px" srcdoc="' + esc('<meta http-equiv="Content-Security-Policy" content="' + CSP + '">' + p.html) + '"></iframe>';
    default: return '<i>unknown component ' + esc(n.type) + ' (ignored)</i>';
  }
}
function render(d) { document.getElementById('root').innerHTML = draw(d.spec, d.spec.root); }
"""

STATIC_APP = SHELL.replace("__JS__", COMMON_JS + STATIC_JS)
RENDERER_APP = SHELL.replace("__JS__", COMMON_JS + RENDERER_JS)
