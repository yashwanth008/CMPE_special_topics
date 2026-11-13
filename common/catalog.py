"""The catalog is three things at once: the prompt, the validator and the renderer registry."""

CATALOG = {
    "Stack":     {"props": {}, "children": True, "doc": "Vertical container."},
    "Heading":   {"props": {"text": str}, "doc": "A section title."},
    "Metric":    {"props": {"label": str, "value": str, "delta": str}, "doc": "One KPI with change."},
    "BarChart":  {"props": {"data": dict}, "doc": "Bars from {label: number}."},
    "Button":    {"props": {"label": str, "action": str}, "doc": "Sends a NAMED action to the app."},
}
# Only the 'mixed' mode adds this entry: the single escape hatch for generated markup.
HYBRID_CATALOG = {**CATALOG, "HtmlArtifact": {"props": {"html": str, "height": int}, "doc": "Sandboxed generated HTML."}}

class ValidationError(Exception):
    pass

def catalog_prompt(catalog):
    """Generate the system prompt from the catalog: one definition, three uses."""
    lines = ["You may only use these components:"]
    for name, d in catalog.items():
        props = ", ".join(f"{k}:{t.__name__}" for k, t in d["props"].items()) or "none"
        lines.append(f"- {name}({props}){' +children' if d.get('children') else ''}: {d['doc']}")
    return "\n".join(lines)

def validate_node(node, catalog, where="node"):
    t = node.get("type")
    if t not in catalog:
        raise ValidationError(f"{where}: unknown component '{t}'. Allowed: {sorted(catalog)}")
    for k, typ in catalog[t]["props"].items():
        if k not in node.get("props", {}):
            raise ValidationError(f"{where}: {t} is missing prop '{k}'")
        if not isinstance(node["props"][k], typ):
            raise ValidationError(f"{where}: {t}.{k} must be {typ.__name__}")
    extra = set(node.get("props", {})) - set(catalog[t]["props"])
    if extra:
        raise ValidationError(f"{where}: {t} has unexpected props {sorted(extra)}")

def validate_spec(spec, catalog):
    """Validate a flat spec {root, elements}. Raises ValidationError with a model-readable message."""
    els = spec.get("elements", {})
    if spec.get("root") not in els:
        raise ValidationError("root must name an element")
    for eid, node in els.items():
        validate_node(node, catalog, eid)
        for c in node.get("children", []):
            if c not in els:
                raise ValidationError(f"{eid}: child '{c}' does not exist")
    return spec
