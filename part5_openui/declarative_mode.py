"""OpenUI Lang x DECLARATIVE. Streaming parse with forward references, a correction loop, and a token comparison.
Run: python part5_openui/declarative_mode.py"""
import sys, pathlib, json; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.catalog import CATALOG
from common.fixtures import DECL_SPEC
from common.llm import ScriptedLLM
from common.render import render_text, save_page
from common.ui import banner, step
from part5_openui.openui import StreamParser, approx_tokens, parse_statement
from part1_a2ui.wire import spec_to_messages, encode_jsonl

banner("OPENUI LANG / DECLARATIVE: compact language, streaming parser")
LANG = '''root = Stack([title, kpi, chart, more])
title = Heading("Q3 sales summary")
kpi = Metric("Revenue", "$1.24M", "+8.2%")
chart = BarChart({NA: 520, EMEA: 410, APAC: 310})
more = Button("Show EMEA details", "show_region:EMEA")
'''
step(1, "Stream it 30 chars at a time. Note forward refs: root is painted before its children exist.")
p = StreamParser(CATALOG); seen = 0
for ch in ScriptedLLM.stream(LANG, 30):
    spec = p.feed(ch)
    if len(spec["elements"]) != seen:
        seen = len(spec["elements"])
        kids = [c for c in spec["elements"].get("root", {}).get("children", [])]
        print(f"  {seen} statement(s) parsed; root refs {kids}; ready: {[k for k in kids if k in spec['elements']]}")
spec = p.finish(); print(render_text(spec)); save_page(spec, "out/part5_declarative.html")

step(2, "Correction loop: errors name the statement, so the model can fix exactly that line.")
for bad in ('kpi = Gauge("Revenue", 1.24)', 'kpi = Metric("Revenue", "$1.24M", "+8.2%", "extra")', 'kpi = Metric("Revenue" "$1.24M")'):
    try: parse_statement(bad)
    except Exception as e: print(f"  {bad[:44]:<46} -> {e}")

step(3, "Same UI, three formats (APPROXIMATE tokens: regex words+punctuation, not a model tokenizer).")
rows = {"OpenUI Lang": LANG, "json-render JSON": json.dumps(DECL_SPEC), "A2UI JSONL": encode_jsonl(spec_to_messages(DECL_SPEC))}
base = approx_tokens(LANG)
for k, v in rows.items(): print(f"  {k:<18}{len(v):>6} chars {approx_tokens(v):>5} tokens  x{approx_tokens(v)/base:.1f}")
