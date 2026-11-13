"""A2UI x DECLARATIVE. The model emits the whole surface as JSONL messages from a catalog.

Includes a correction loop: invalid output becomes a tool-result-style error, the model retries.
Then a data-only update shows structure and data are separate streams.
Run: python part1_a2ui/declarative_mode.py
"""
import sys, pathlib, json; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import CATALOG, catalog_prompt, ValidationError
from common.fixtures import DECL_SPEC, BAD_SPEC
from common.llm import ScriptedLLM
from common.render import render_text, save_page
from common.ui import banner, step, show
from part1_a2ui.wire import Surface, spec_to_messages, encode_jsonl, parse_jsonl

banner("A2UI / DECLARATIVE: model describes the surface, app validates and renders")

step(1, "The system prompt is generated from the catalog.")
print(catalog_prompt(CATALOG))

step(2, "Model attempt 1 uses a component that does not exist (Gauge).")
llm = ScriptedLLM([encode_jsonl(spec_to_messages(BAD_SPEC)), encode_jsonl(spec_to_messages(DECL_SPEC))])
surface, error = Surface(), None
for attempt in (1, 2):
    surface = Surface()
    text = llm.next(error or "Give me a Q3 sales summary")
    try:
        for m in parse_jsonl(text):
            surface.apply(m, CATALOG)
        spec = surface.resolve(CATALOG)
        print(f"attempt {attempt}: valid")
        break
    except ValidationError as e:
        error = str(e)
        print(f"attempt {attempt}: INVALID -> fed back to model as an error:\n    {error}")

step(3, "Valid surface streamed as JSONL (note: 3 messages, structure and data apart).")
show("wire", encode_jsonl(spec_to_messages(DECL_SPEC)))

step(4, "Render the same surface to terminal and HTML.")
print(render_text(spec)); save_page(spec, "out/part1_declarative.html")

step(5, "Data-only update: APAC grows. No layout is resent.")
surface.apply({"dataModelUpdate": {"surfaceId": "main", "contents": {"regions": {"NA": 520, "EMEA": 410, "APAC": 455}}}}, CATALOG)
print(render_text(surface.resolve(CATALOG)))
