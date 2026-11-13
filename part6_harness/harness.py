"""A minimal coding-agent-style harness with generative UI tools (teaching subset).

The loop: model -> tool call -> tool result -> model ... until the model replies with text.
GenUI joins the loop as TOOLS: the UI is a tool call, validation errors are tool results (so the model
can retry), and UI actions come back through a permission gate. Two surfaces render the same event.
"""
from common.catalog import validate_spec, ValidationError
from common.render import render_text, save_page
from common.sandbox import lint_html, wrap_iframe, ALLOWED_ACTIONS
from common.fixtures import SALES

class Harness:
    def __init__(self, model, catalog, web_path):
        self.model, self.catalog, self.web_path = model, catalog, web_path
        self.messages, self.ui, self.trace = [], None, []
        self.tools = {"get_sales_data": self.get_sales_data, "show_metric": self.show_metric,
                      "render_ui": self.render_ui, "render_html": self.render_html}

    # ---- tools (what the model can do) ----
    def get_sales_data(self, **_): return SALES
    def show_metric(self, label, value, delta):                     # STATIC: preset component
        return self._show({"root": "m", "elements": {"m": {"type": "Metric", "props": {"label": label, "value": value, "delta": delta}}}})
    def render_ui(self, spec):                                       # DECLARATIVE / MIXED: validated spec
        try: validate_spec(spec, self.catalog)
        except ValidationError as e: return f"ERROR: {e}"          # error is a RESULT, not a crash
        return self._show(spec)
    def render_html(self, html):                                     # OPEN-ENDED: lint, then sandbox
        bad = lint_html(html)
        if bad: return f"ERROR: html rejected: {bad}"
        return self._show({"root": "a", "elements": {"a": {"type": "HtmlArtifact", "props": {"html": html, "height": 200}}}})

    def _show(self, spec):
        self.ui = spec
        print("  [terminal surface]"); print("\n".join("    " + l for l in render_text(spec).splitlines()))
        save_page(spec, self.web_path); print(f"  [web surface] wrote {self.web_path}")
        return "ok: rendered on terminal and web surfaces"

    # ---- the loop ----
    def run(self, user, max_turns=8):
        self.messages = [{"role": "user", "content": user}]
        for turn in range(1, max_turns + 1):
            reply = self.model.next(self.messages)
            if "text" in reply:
                print(f"turn {turn}: model says: {reply['text']}"); return reply["text"]
            name, args = reply["tool"], reply.get("args", {})
            if name not in self.tools:
                result = f"ERROR: unknown tool {name}"
            else:
                print(f"turn {turn}: tool call {name}({', '.join(args) if args else ''})")
                result = self.tools[name](**args)
            shown = result if isinstance(result, str) else "<data>"
            print(f"         result -> {shown[:110]}")
            self.messages += [{"role": "assistant", "tool": name}, {"role": "tool", "content": result}]
        raise RuntimeError("max turns")

    # ---- UI action gate ----
    def on_ui_action(self, action):
        """A click is a NAMED action. The harness decides; a valid spec never grants permission."""
        name, _, arg = action.partition(":")
        if name not in ALLOWED_ACTIONS:
            print(f"  action '{name}' DENIED by permission gate"); return False
        self.ui["elements"]["title"]["props"]["text"] = f"{arg}: {SALES['regions'][arg]}k revenue"
        print(f"  action '{name}' allowed -> state updated, re-render:"); self._show(self.ui); return True

class ScriptedModel:
    def __init__(self, script): self.script = list(script)
    def next(self, messages): return self.script.pop(0)
