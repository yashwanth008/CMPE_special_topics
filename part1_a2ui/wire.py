"""A2UI wire format (teaching subset, modelled on A2UI v0.8): structure and data travel separately.

Four envelopes: surfaceUpdate (components), dataModelUpdate (data), beginRendering (go), deleteSurface.
Components are a FLAT list with ids and {"explicitList": [...]} children. Values can be literals or
{"path": "/x"} bindings into the data model. That split is what lets data change without resending layout.
"""
import json
from common.catalog import validate_node, ValidationError

ENVELOPES = {"surfaceUpdate", "dataModelUpdate", "beginRendering", "deleteSurface"}

def spec_to_messages(spec, surface="main", bind_chart=True):
    """Convert our flat spec into A2UI messages. Chart data goes into the data model, referenced by path."""
    comps, data = [], {}
    for eid, n in spec["elements"].items():
        props = dict(n.get("props", {}))
        if n["type"] == "BarChart" and bind_chart:
            data["regions"] = props.pop("data"); props["data"] = {"path": "/regions"}
        comp = {n["type"]: props}
        if n.get("children"):
            comp[n["type"]]["children"] = {"explicitList": n["children"]}
        comps.append({"id": eid, "component": comp})
    msgs = [{"surfaceUpdate": {"surfaceId": surface, "components": comps}}]
    if data:
        msgs.append({"dataModelUpdate": {"surfaceId": surface, "contents": data}})
    msgs.append({"beginRendering": {"surfaceId": surface, "root": spec["root"]}})
    return msgs

class Surface:
    """Client-side state for one surface: component table + data model."""
    def __init__(self):
        self.components, self.data, self.root, self.ready = {}, {}, None, False

    def apply(self, msg, catalog):
        keys = set(msg) & ENVELOPES
        if len(keys) != 1 or len(msg) != 1:
            raise ValidationError(f"envelope must have exactly one of {sorted(ENVELOPES)}, got {sorted(msg)}")
        kind = keys.pop(); body = msg[kind]
        if kind == "surfaceUpdate":
            for c in body["components"]:
                (ctype, props), = c["component"].items()
                node = {"type": ctype, "props": {k: v for k, v in props.items() if k != "children"}}
                # bindings resolve at render time, so validate type names now and prop types later
                if ctype not in catalog:
                    raise ValidationError(f"{c['id']}: unknown component '{ctype}'. Allowed: {sorted(catalog)}")
                if "children" in props:
                    node["children"] = props["children"]["explicitList"]
                self.components[c["id"]] = node
        elif kind == "dataModelUpdate":
            self.data.update(body["contents"])
        elif kind == "beginRendering":
            self.root, self.ready = body["root"], True
        elif kind == "deleteSurface":
            self.__init__()

    def resolve(self, catalog):
        """Resolve {path} bindings against the data model and return our flat spec."""
        def val(v):
            if isinstance(v, dict) and "path" in v:
                return self.data[v["path"].lstrip("/")]
            return v
        els = {}
        for eid, n in self.components.items():
            props = {k: val(v) for k, v in n["props"].items()}
            els[eid] = {"type": n["type"], "props": props, **({"children": n["children"]} if "children" in n else {})}
            validate_node(els[eid], catalog, eid)
        return {"root": self.root, "elements": els}

def encode_jsonl(msgs):
    return "\n".join(json.dumps(m) for m in msgs)

def parse_jsonl(text):
    return [json.loads(l) for l in text.splitlines() if l.strip()]
