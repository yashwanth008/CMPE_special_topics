"""json-render style (teaching subset): a catalog-constrained flat spec {root, elements}, streamed as
RFC 6902 JSON Patch lines, with state bindings ({"$state": "/path"}) and named actions.
The same spec renders to several targets (terminal, HTML)."""
import json
from common.catalog import validate_node, ValidationError
from common.jsonpatch import apply_patch

def spec_to_patches(spec):
    """Order matters for streaming: root first, then parents before children, so first paint is early."""
    ops = [{"op": "add", "path": "/root", "value": spec["root"]}]
    order, seen = [], set()
    def visit(i):
        if i in seen: return
        seen.add(i); order.append(i)
        for c in spec["elements"][i].get("children", []): visit(c)
    visit(spec["root"])
    ops += [{"op": "add", "path": f"/elements/{i}", "value": spec["elements"][i]} for i in order]
    return ops

def patches_to_jsonl(ops):
    return "\n".join(json.dumps(o) for o in ops)

def resolve_state(node, state):
    """Replace {"$state": "/a/b"} values with data from state. Structure stays app/model-owned; data is separate."""
    def val(v):
        if isinstance(v, dict) and set(v) == {"$state"}:
            cur = state
            for p in v["$state"].lstrip("/").split("/"): cur = cur[p]
            return cur
        return v
    return {**node, "props": {k: val(v) for k, v in node.get("props", {}).items()}}

def render_partial(spec, catalog):
    """Render what exists so far. Children not yet streamed in are shown as a placeholder, never crash."""
    from common.render import render_text
    if not spec.get("root") or spec["root"] not in spec.get("elements", {}):
        return "(nothing renderable yet)"
    els = {k: dict(v) for k, v in spec["elements"].items()}
    for k, v in els.items():
        v["children"] = [c for c in v.get("children", []) if c in els]
    return render_text({"root": spec["root"], "elements": els})

def consume_stream(lines, catalog, on_step):
    """Apply patch lines one by one. A bad element is rejected on arrival (error returned), the rest continue."""
    spec, errors, first_paint = {"elements": {}}, [], None
    for n, line in enumerate(lines, 1):
        op = json.loads(line)
        if op["path"].startswith("/elements/") and op["path"].count("/") == 2:
            try:
                validate_node(op["value"], catalog, op["path"].split("/")[2])
            except ValidationError as e:
                errors.append(str(e)); on_step(n, spec, f"REJECTED {e}"); continue
        spec = apply_patch(spec, [op])
        if first_paint is None and spec.get("root") in spec["elements"]:
            first_paint = n
        on_step(n, spec, None)
    return spec, errors, first_paint
