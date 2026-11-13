"""json-render x OPEN-ENDED. The catalog entry is a single HtmlArtifact; patches stream the markup.
Run: python part4_json_render/open_ended_mode.py"""
import sys, pathlib, json; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import HYBRID_CATALOG
from common.fixtures import OPEN_HTML, HOSTILE_HTML
from common.render import render_text, save_page
from common.ui import banner, step
from part4_json_render.jr import spec_to_patches, patches_to_jsonl, consume_stream
from common.sandbox import lint_html

banner("JSON-RENDER / OPEN-ENDED: one HtmlArtifact element, linted then sandboxed")
for i, (name, markup) in enumerate((("friendly", OPEN_HTML), ("hostile", HOSTILE_HTML)), 1):
    step(i, f"{name} model output")
    spec = {"root": "art", "elements": {"art": {"type": "HtmlArtifact", "props": {"html": markup, "height": 200}}}}
    result, errs, fp = consume_stream(patches_to_jsonl(spec_to_patches(spec)).splitlines(), HYBRID_CATALOG, lambda *a: None)
    findings = lint_html(markup)
    print("  schema errors:", errs or "none", "| lint:", findings or "clean")
    if findings: print("  -> not rendered; findings returned to the model"); continue
    print(render_text(result)); save_page(result, "out/part4_open_ended.html")
