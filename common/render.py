"""Two renderers for the same flat spec: terminal text and HTML. One spec, two targets."""
import html
from .sandbox import wrap_iframe, lint_html

def _walk(spec, eid, depth, out_fn):
    node = spec["elements"][eid]
    out_fn(node, depth)
    for c in node.get("children", []):
        _walk(spec, c, depth + 1, out_fn)

def render_text(spec):
    lines = []
    def f(n, d):
        p, pad = n.get("props", {}), "  " * d
        t = n["type"]
        if t == "Heading": lines.append(f"{pad}# {p['text']}")
        elif t == "Metric": lines.append(f"{pad}[ {p['label']}: {p['value']} ({p['delta']}) ]")
        elif t == "BarChart":
            for k, v in p["data"].items(): lines.append(f"{pad}{k:<5}{'#' * (v // 25)} {v}")
        elif t == "Button": lines.append(f"{pad}<{p['label']}> -> action '{p['action']}'")
        elif t == "HtmlArtifact":
            bad = lint_html(p["html"])
            lines.append(f"{pad}[sandboxed HTML, {len(p['html'])} chars{', LINT: ' + '; '.join(bad) if bad else ''}]")
        elif t == "Stack": pass
        else: lines.append(f"{pad}[unknown {t}]")
    _walk(spec, spec["root"], 0, f)
    return "\n".join(lines)

def render_html(spec):
    parts = []
    def f(n, d):
        p, t = n.get("props", {}), n["type"]
        if t == "Heading": parts.append(f"<h2>{html.escape(p['text'])}</h2>")
        elif t == "Metric":
            parts.append(f"<div class=m><small>{html.escape(p['label'])}</small><b>{html.escape(p['value'])}</b><i>{html.escape(p['delta'])}</i></div>")
        elif t == "BarChart":
            parts.append("<div class=bars>" + "".join(
                f"<div><span>{html.escape(k)}</span><u style='width:{v // 3}px'></u>{v}</div>" for k, v in p["data"].items()) + "</div>")
        elif t == "Button":
            parts.append(f"<button data-action='{html.escape(p['action'])}'>{html.escape(p['label'])}</button>")
        elif t == "HtmlArtifact": parts.append(wrap_iframe(p["html"], p.get("height", 160)))
    _walk(spec, spec["root"], 0, f)
    return PAGE.replace("{{BODY}}", "\n".join(parts))

PAGE = """<!doctype html><meta charset=utf-8><title>genui</title>
<style>body{font:15px system-ui;max-width:420px;margin:24px auto;padding:0 12px}
.m{border:1px solid #ddd;border-radius:10px;padding:10px 14px;margin:8px 0}.m b{font-size:26px;display:block}.m i{color:#16a34a}
.bars div{display:flex;gap:8px;align-items:center;margin:4px 0}.bars span{width:48px}.bars u{background:#4f46e5;height:16px;display:inline-block}
button{padding:8px 12px;border-radius:8px;border:1px solid #4f46e5;background:#eef2ff;margin-top:8px}</style>
{{BODY}}"""

def save_page(spec_or_html, path):
    body = spec_or_html if isinstance(spec_or_html, str) else render_html(spec_or_html)
    from pathlib import Path
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(body)
    return path
