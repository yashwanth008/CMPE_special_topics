"""A2UI x OPEN-ENDED. A2UI is declarative by design, so open-ended output needs a catalog entry that
hosts markup: here a custom 'HtmlArtifact' component. The whole surface is one sandboxed region.

Honest note: this is a pattern built ON A2UI (custom catalogs are part of the spec), not a built-in mode.
Run: python part1_a2ui/open_ended_mode.py
"""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import HYBRID_CATALOG
from common.fixtures import OPEN_HTML, HOSTILE_HTML
from common.render import render_text, save_page
from common.sandbox import lint_html, check_message
from common.ui import banner, step, show
from part1_a2ui.wire import Surface

banner("A2UI / OPEN-ENDED: one custom component carries model-written HTML")

def surface_for(html):
    return [{"surfaceUpdate": {"surfaceId": "free", "components": [
                {"id": "art", "component": {"HtmlArtifact": {"html": html, "height": 170}}}]}},
            {"beginRendering": {"surfaceId": "free", "root": "art"}}]

n = 0
for name, markup in (("friendly reply", OPEN_HTML), ("hostile reply", HOSTILE_HTML)):
    n += 1; step(n, f"Model returns HTML ({name}). Lint first.")
    findings = lint_html(markup)
    print("lint findings:", findings or "none")
    if findings:
        print("-> BLOCKED: not rendered. Findings are returned to the model as an error.")
        continue
    s = Surface()
    for m in surface_for(markup): s.apply(m, HYBRID_CATALOG)
    spec = s.resolve(HYBRID_CATALOG)
    print(render_text(spec)); save_page(spec, "out/part1_open_ended.html")
    n += 1; step(n, "Render inside sandbox. The only exit is postMessage; the host checks shape and action name.")
    print("allowed :", check_message({"type": "action", "name": "show_region", "arg": "EMEA"}))
    try: check_message({"type": "action", "name": "delete_everything"})
    except PermissionError as e: print("rejected:", e)
