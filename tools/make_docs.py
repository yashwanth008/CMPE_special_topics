"""Builds docs/partN_*.md from the REAL source files and the REAL logs captured by run_all.sh."""
import pathlib
R = pathlib.Path(__file__).resolve().parents[1]
MODES = [("static", "Static", "The app owns the UI. The model selects a pre-built component and supplies values."),
         ("declarative", "Declarative", "The model describes the UI from a catalog of allowed components. The app validates, then renders."),
         ("open_ended", "Open-ended", "The model writes markup. Anything goes, so it is linted and isolated in a sandboxed iframe."),
         ("mixed", "Mixed", "Catalog components for the routine parts plus ONE sandboxed HtmlArtifact for a custom region.")]
PARTS = [
 ("part1_a2ui", "Part 1 - A2UI", "https://a2ui.org/",
  "A2UI (Agent-to-UI) is a declarative format. The agent sends **messages**: `surfaceUpdate` (a flat list of components), `dataModelUpdate` (data) and `beginRendering`. Structure and data travel separately, so data can change without resending layout.",
  ["`wire.py` - envelopes, `Surface` (client state), `{path}` binding resolution"],
  {"static": "Structure is app code; the model may only send `dataModelUpdate`.",
   "declarative": "Model emits JSONL; a wrong component name becomes an error the model can fix; a data-only update changes one bar.",
   "open_ended": "A2UI is declarative by design. Open-ended output is a custom catalog component (`HtmlArtifact`) - a pattern built on A2UI, not a native mode.",
   "mixed": "Same envelopes; one component is the escape hatch. Clicks are named actions the app authorizes."}),
 ("part2_agui", "Part 2 - AG-UI", "https://docs.ag-ui.com/",
  "AG-UI is the **event protocol between agent and frontend**: `RUN_STARTED`, `TEXT_MESSAGE_*`, `TOOL_CALL_*`, `STATE_SNAPSHOT`, `STATE_DELTA` (JSON Patch), `RUN_FINISHED`, over SSE. It carries a UI; it does not define one.",
  ["`events.py` - event constructors, SSE encode/decode, `RunAgentInput`"],
  {"static": "Tool-call events pick a component from a frontend registry (tool-based generative UI).",
   "declarative": "The spec IS shared state: a snapshot, then one JSON Patch delta re-renders one bar.",
   "open_ended": "HTML streams as tool-call args; nothing is drawn until `TOOL_CALL_END`; then lint and sandbox.",
   "mixed": "Snapshot with an HtmlArtifact node, then a full click round trip. The server refuses a forged action."}),
 ("part3_mcp_apps", "Part 3 - MCP Apps", "https://modelcontextprotocol.io/extensions/apps/overview",
  "MCP Apps: a tool declares `_meta.ui.resourceUri` (`ui://...`). A **third-party host** reads that HTML resource, mounts it in a sandboxed iframe and talks to it by JSON-RPC over `postMessage`. The host owns the policy.",
  ["`mcp.py` - mini MCP server, `Host` with bridge policy, browser host page", "`apps.py` - the HTML apps shipped as `ui://` resources"],
  {"static": "A fixed HTML template; the tool result only fills values.",
   "declarative": "A generic renderer app; the tool result carries a validated spec.",
   "open_ended": "Model HTML runs in a NESTED sandbox: host iframe > app > nested iframe (two boundaries).",
   "mixed": "Catalog components plus a nested-sandbox region inside the host. Screenshot shows the live bridge log."}),
 ("part4_json_render", "Part 4 - json-render", "https://json-render.dev/",
  "json-render: one **catalog** serves as prompt, validator and renderer registry. A flat element map streams as RFC 6902 patches, so the first paint happens early. The same spec renders to several targets.",
  ["`jr.py` - patch ordering, `$state` binding, partial render, stream consumer"],
  {"static": "App-owned spec with `$state` bindings; the model returns state only.",
   "declarative": "Patch lines stream in; render after each; a bad element is rejected on arrival and the rest still render.",
   "open_ended": "One HtmlArtifact element carries markup; lint blocks the hostile reply.",
   "mixed": "Catalog + artifact, an action handler returning a patch, and an unregistered action that is inert."}),
 ("part5_openui", "Part 5 - OpenUI Lang", "https://www.openui.com/",
  "OpenUI Lang is a **compact line-based language**: `root = Stack([title, kpi])`. Parents come first (forward references), so a streaming parser paints a skeleton immediately. Positional args map to props via the catalog signature.",
  ["`openui.py` - tokenizer, recursive-descent parser, streaming parser, approximate token counter"],
  {"static": "One allow-listed statement; anything else is rejected.",
   "declarative": "Streaming parse with forward references, line-precise errors, and an APPROXIMATE token comparison against JSON and A2UI.",
   "open_ended": "`HtmlArtifact(\"<markup>\", h)`: the string argument is the escape hatch.",
   "mixed": "Catalog statements + one artifact statement; the same text fails against a catalog without the escape hatch."}),
 ("part6_harness", "Part 6 - Harness integration", "https://github.com/dlmastery/simple-coding-harness/tree/main/genui",
  "A harness is the agent loop: model -> tool call -> tool result -> model. GenUI joins as **tools**. UI validation errors are tool results (the model retries), one UI event feeds two surfaces (terminal and web), and UI actions pass a permission gate.",
  ["`harness.py` - the loop, `render_ui` / `render_html` / `show_metric` tools, the action gate"],
  {"static": "Preset `show_metric` tool.",
   "declarative": "`render_ui` rejects a bad spec; the error returns as a tool result; the model corrects itself.",
   "open_ended": "`render_html` rejects hostile markup, then accepts the clean retry.",
   "mixed": "Hybrid spec, then an allowed click and a denied click through the permission gate."}),
]
def read(p): return (R / p).read_text()
for key, title, link, concept, helpers, notes in PARTS:
    o = [f"# {title}\n", f"Reference: <{link}>\n", "## The idea\n", concept + "\n",
         "All demos use the same scenario (a Q3 sales summary) and a **scripted model**, so they run offline and deterministically. "
         "Everything after the model call (parse, validate, render) is real and unchanged if you swap in a live model.\n",
         "## Shared helpers for this part\n", "\n".join("- " + h for h in helpers) + "\n"]
    for m, name, mdesc in MODES:
        src = f"{key}/{m}_mode.py"
        o += [f"## {name} mode\n", f"*{mdesc}*\n", f"**What this part shows:** {notes[m]}\n",
              f"### Code walkthrough - `{src}`\n", "```python\n" + read(src).rstrip() + "\n```\n",
              "### Run it\n", f"```bash\npython {src}\n```\n",
              "### Real output (captured by `run_all.sh`)\n", "```text\n" + read(f"logs/{key}_{m}.txt").rstrip() + "\n```\n"]
        for png in sorted((R / "out").glob(f"{key.split('_')[0]}_{m}.png")):
            o.append(f"![{name} screenshot](../out/{png.name})\n")
    (R / "docs" / f"{key}.md").write_text("\n".join(o))
    print("wrote docs/%s.md" % key)
