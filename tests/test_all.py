"""Offline tests. Run: python -m unittest discover -s tests -v"""
import sys, pathlib, subprocess, unittest, json
ROOT = pathlib.Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT))
from common.catalog import CATALOG, HYBRID_CATALOG, validate_spec, ValidationError
from common.fixtures import DECL_SPEC, BAD_SPEC, MIXED_SPEC, OPEN_HTML, HOSTILE_HTML
from common.jsonpatch import apply_patch
from common.sandbox import lint_html, check_message, wrap_iframe
from part1_a2ui.wire import Surface, spec_to_messages
from part2_agui.events import sse_encode, sse_decode, event
from part4_json_render.jr import spec_to_patches, consume_stream
from part5_openui.openui import StreamParser, parse_statement, ParseError

class Core(unittest.TestCase):
    def test_validator(self):
        validate_spec(DECL_SPEC, CATALOG)
        with self.assertRaises(ValidationError): validate_spec(BAD_SPEC, CATALOG)
        with self.assertRaises(ValidationError): validate_spec(MIXED_SPEC, CATALOG)   # escape hatch needs hybrid catalog
        validate_spec(MIXED_SPEC, HYBRID_CATALOG)
    def test_patch(self):
        d = apply_patch({"a": {"b": 1}}, [{"op": "replace", "path": "/a/b", "value": 2}, {"op": "add", "path": "/c", "value": [1]}])
        self.assertEqual(d, {"a": {"b": 2}, "c": [1]})
    def test_sandbox(self):
        self.assertEqual(lint_html(OPEN_HTML), []); self.assertGreaterEqual(len(lint_html(HOSTILE_HTML)), 4)
        self.assertIn('sandbox="allow-scripts"', wrap_iframe("x")); self.assertNotIn("allow-same-origin", wrap_iframe("x"))
        with self.assertRaises(PermissionError): check_message({"type": "action", "name": "rm"})

class Protocols(unittest.TestCase):
    def test_a2ui_roundtrip(self):
        s = Surface()
        for m in spec_to_messages(DECL_SPEC): s.apply(m, CATALOG)
        self.assertEqual(s.resolve(CATALOG), DECL_SPEC)
        with self.assertRaises(ValidationError): s.apply({"surfaceUpdate": {}, "beginRendering": {}}, CATALOG)
    def test_agui_sse(self):
        evs = [event("RUN_STARTED"), event("STATE_DELTA", delta=[])]
        self.assertEqual(list(sse_decode("".join(sse_encode(e) for e in evs))), evs)
    def test_jsonrender_stream(self):
        lines = [json.dumps(o) for o in spec_to_patches(DECL_SPEC)]
        spec, errs, fp = consume_stream(lines, CATALOG, lambda *a: None)
        self.assertEqual((spec, errs, fp), (DECL_SPEC, [], 2))
        _, errs, _ = consume_stream([json.dumps(o) for o in spec_to_patches(BAD_SPEC)], CATALOG, lambda *a: None)
        self.assertEqual(len(errs), 1)
    def test_openui(self):
        p = StreamParser(CATALOG)
        for c in 'root = Stack([a])\na = Heading("hi")\n': p.feed(c)       # char-by-char streaming
        self.assertEqual(p.spec["elements"]["root"]["children"], ["a"]); self.assertEqual(p.errors, [])
        with self.assertRaises(ParseError): parse_statement('a = Metric("x" "y")')

class Demos(unittest.TestCase):
    def test_every_demo_runs(self):
        scripts = sorted(ROOT.glob("part*/*_mode.py")); self.assertEqual(len(scripts), 24)
        for s in scripts:
            with self.subTest(script=s.name, part=s.parent.name):
                r = subprocess.run([sys.executable, str(s)], cwd=ROOT, capture_output=True, text=True, timeout=120)
                self.assertEqual(r.returncode, 0, r.stderr)

if __name__ == "__main__": unittest.main()
