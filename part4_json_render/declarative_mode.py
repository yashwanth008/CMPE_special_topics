"""json-render x DECLARATIVE. Stream JSON Patch lines into the element map; render after every line.
Measures first paint (lines until something renders) vs complete, and rejects bad elements mid-stream.
Run: python part4_json_render/declarative_mode.py"""
import sys, pathlib, json, copy; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import CATALOG, catalog_prompt, validate_spec
from common.fixtures import DECL_SPEC, BAD_SPEC
from common.render import render_text, save_page
from common.ui import banner, step, show
from part4_json_render.jr import spec_to_patches, patches_to_jsonl, consume_stream, render_partial

banner("JSON-RENDER / DECLARATIVE: streaming patches into the element map")
step(1, "Prompt generated from the catalog"); print(catalog_prompt(CATALOG))

step(2, "Stream the spec as patch lines; render after each")
lines = patches_to_jsonl(spec_to_patches(DECL_SPEC)).splitlines()
for l in lines[:2]: print("  wire>", l[:110])
def on_step(n, spec, err):
    kinds = list(spec.get("elements", {}))
    print(f"  line {n}/{len(lines)}  elements={kinds}" + (f"   !! {err}" if err else ""))
    if n in (2, 3): print("\n".join("      | " + x for x in render_partial(spec, CATALOG).splitlines()))
spec, errors, fp = consume_stream(lines, CATALOG, on_step)
print(f"\n  first paint after line {fp} of {len(lines)} (a nested tree would need the full text)")
validate_spec(spec, CATALOG); print(render_text(spec))

step(3, "A bad element mid-stream is rejected on arrival; the rest still renders")
bad_lines = patches_to_jsonl(spec_to_patches(BAD_SPEC)).splitlines()
spec2, errors, _ = consume_stream(bad_lines, CATALOG, lambda *a: None)
print("  errors fed back to model:", errors)
print("  partial result:", list(spec2["elements"]))

step(4, "Two render targets, one spec"); print("  terminal: above; html ->", save_page(spec, "out/part4_declarative.html"))
