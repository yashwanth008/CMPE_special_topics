"""json-render x MIXED. Catalog + HtmlArtifact, actions that round-trip, and a terminal target.
Run: python part4_json_render/mixed_mode.py"""
import sys, pathlib, json; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import HYBRID_CATALOG
from common.fixtures import MIXED_SPEC, SALES
from common.jsonpatch import apply_patch
from common.render import render_text, save_page
from common.sandbox import ALLOWED_ACTIONS
from common.ui import banner, step, show
from part4_json_render.jr import spec_to_patches, patches_to_jsonl, consume_stream

banner("JSON-RENDER / MIXED: catalog + sandboxed region + named actions")
step(1, "Stream the mixed spec")
spec, errs, fp = consume_stream(patches_to_jsonl(spec_to_patches(MIXED_SPEC)).splitlines(), HYBRID_CATALOG, lambda *a: None)
print(f"  errors={errs or 'none'}  first paint at line {fp}"); print(render_text(spec))

def handle_action(spec, action):
    """Actions are NAMED handlers. The spec can say 'show_region:EMEA'; only registered handlers run."""
    name, _, arg = action.partition(":")
    if name not in ALLOWED_ACTIONS: raise PermissionError(f"no handler registered for '{name}'")
    patch = [{"op": "replace", "path": "/elements/title/props/text", "value": f"{arg}: {SALES['regions'][arg]}k revenue"}]
    show("handler returns a patch", patch); return apply_patch(spec, patch)

step(2, "User clicks the button -> its action string"); spec = handle_action(spec, MIXED_SPEC["elements"]["more"]["props"]["action"])
print(render_text(spec))
step(3, "A spec that names an unregistered action is inert")
try: handle_action(spec, "drop_table:users")
except PermissionError as e: print("  DENIED:", e)
save_page(spec, "out/part4_mixed.html")
