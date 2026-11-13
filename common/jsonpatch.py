"""Minimal RFC 6902 JSON Patch (add / replace / remove) used by AG-UI STATE_DELTA and json-render."""
import copy

def _walk(doc, parts):
    for p in parts[:-1]:
        doc = doc[int(p)] if isinstance(doc, list) else doc[p]
    return doc

def apply_patch(doc, ops):
    doc = copy.deepcopy(doc)
    for op in ops:
        parts = [p.replace("~1", "/").replace("~0", "~") for p in op["path"].lstrip("/").split("/")] if op["path"] else []
        if not parts:
            doc = op["value"]; continue
        parent, key = _walk(doc, parts), parts[-1]
        if isinstance(parent, list):
            key = len(parent) if key == "-" else int(key)
            if op["op"] == "add": parent.insert(key, op["value"])
            elif op["op"] == "replace": parent[key] = op["value"]
            elif op["op"] == "remove": parent.pop(key)
        else:
            if op["op"] in ("add", "replace"): parent[key] = op["value"]
            elif op["op"] == "remove": del parent[key]
            else: raise ValueError(f"unsupported op {op['op']}")
    return doc
