"""OpenUI Lang style (teaching subset): a compact line-based language, one statement per line.

    root  = Stack([title, kpi, chart])        <- forward references: root comes FIRST
    title = Heading("Q3 sales summary")
    kpi   = Metric("Revenue", "$1.24M", "+8.2%")

Positional args map to props through the catalog signature. Forward references are the trick: because
the parent appears before its children, a streaming parser can paint the skeleton immediately.
"""
import re
from common.catalog import validate_node, ValidationError

SIGS = {"Stack": ["children"], "Heading": ["text"], "Metric": ["label", "value", "delta"],
        "BarChart": ["data"], "Button": ["label", "action"], "HtmlArtifact": ["html", "height"]}
TOKEN = re.compile(r'\s*(?:(?P<str>"(?:\\.|[^"\\])*")|(?P<num>-?\d+(?:\.\d+)?)|(?P<id>[A-Za-z_]\w*)|(?P<p>[()\[\]{},:]))')

class ParseError(ValidationError):
    pass

def tokens(s):
    pos, out = 0, []
    while pos < len(s.rstrip()):
        m = TOKEN.match(s, pos)
        if not m: raise ParseError(f"unexpected character {s[pos:pos+1]!r} at col {pos}")
        pos = m.end(); out.append((m.lastgroup, m.group(m.lastgroup)))
    return out

class _P:
    def __init__(self, toks): self.t, self.i = toks, 0
    def peek(self): return self.t[self.i] if self.i < len(self.t) else (None, None)
    def eat(self, v=None):
        k, x = self.peek()
        if v and x != v: raise ParseError(f"expected {v!r}, got {x!r}")
        self.i += 1; return k, x
    def value(self):
        import json
        k, x = self.eat()
        if k == "str": return json.loads(x)
        if k == "num": return float(x) if "." in x else int(x)
        if k == "id": return {"$ref": x}
        if x == "[":
            out = []
            while self.peek()[1] != "]":
                out.append(self.value())
                if self.peek()[1] != "]": self.eat(",")
            self.eat("]"); return out
        if x == "{":
            out = {}
            while self.peek()[1] != "}":
                _, key = self.eat(); key = key.strip('"'); self.eat(":"); out[key] = self.value()
                if self.peek()[1] == ",": self.eat(",")
            self.eat("}"); return out
        raise ParseError(f"unexpected {x!r}")

def parse_statement(line):
    m = re.match(r"\s*(\w+)\s*=\s*(\w+)\((.*)\)\s*$", line)
    if not m: raise ParseError(f"not a statement: {line.strip()[:50]!r}")
    sid, comp, argsrc = m.groups()
    if comp not in SIGS: raise ValidationError(f"{sid}: unknown component '{comp}'. Allowed: {sorted(SIGS)}")
    p, args = _P(tokens(argsrc)), []
    while p.peek()[0] is not None:
        args.append(p.value())
        if p.peek()[0] is not None: p.eat(",")      # a comma is REQUIRED between arguments
    if len(args) > len(SIGS[comp]): raise ParseError(f"{sid}: {comp} takes {len(SIGS[comp])} args, got {len(args)}")
    return sid, comp, args

def statement_to_node(comp, args):
    props = dict(zip(SIGS[comp], args)); children = []
    if comp == "Stack":
        children = [a["$ref"] for a in props.pop("children")]
    return {"type": comp, "props": props, **({"children": children} if comp == "Stack" else {})}

class StreamParser:
    """Feed text chunks; complete lines become statements immediately. Returns the spec so far."""
    def __init__(self, catalog):
        self.buf, self.catalog, self.spec, self.errors = "", catalog, {"root": None, "elements": {}}, []
    def feed(self, chunk):
        self.buf += chunk
        while "\n" in self.buf:
            line, self.buf = self.buf.split("\n", 1); self._line(line)
        return self.spec
    def finish(self):
        if self.buf.strip(): self._line(self.buf)
        self.buf = ""; return self.spec
    def _line(self, line):
        if not line.strip(): return
        try:
            sid, comp, args = parse_statement(line); node = statement_to_node(comp, args)
            validate_node(node, self.catalog, sid)
            self.spec["elements"][sid] = node
            if self.spec["root"] is None: self.spec["root"] = sid
        except ValidationError as e: self.errors.append(str(e))

def approx_tokens(text):
    """APPROXIMATE token count: words and punctuation via regex. NOT a model tokenizer; use it for ratios only."""
    return len(re.findall(r"\w+|[^\w\s]", text))
