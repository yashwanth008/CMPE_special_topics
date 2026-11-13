"""The object that RSI improves: the *source code* of an ingredient parser.

The scaffold is plain Python text with marked insertion regions.  An `Edit` is a
list of primitive ops (add a tagged line to a region / remove all lines carrying
a tag).  Applying an edit produces a *new source string*; we diff the two strings
with difflib to get real diff coordinates (Budget RSI) and execute the new source
to get real scores.  Nothing about quality is hard-coded: a patch is good, weak
or harmful only because of what its code actually does on the data.

NOTE (honesty): the "proposer" that chooses edits in the labs is a stochastic
stub standing in for an LLM coding agent.  The *selection / diagnosis / harness*
mechanisms are real; the proposal distribution is a modelling assumption.
"""
from __future__ import annotations

import difflib
import hashlib
from dataclasses import dataclass, field
from functools import lru_cache

from .data import CATS, Instance
from .services import Meter

# --------------------------------------------------------------------------- base
_BASE = r'''import re
NORMALIZERS = []
UNIT_ALIASES = {"cup": "cup", "cups": "cup", "tbsp": "tbsp", "tsp": "tsp", "oz": "oz", "lb": "lb", "g": "g", "ml": "ml"}
QTY_PATTERNS = []
NOTE_PATTERNS = []
# <<EDIT:NORMALIZERS_FIRST>>
#<<BUG>>
# <<EDIT:NORMALIZERS>>
# <<EDIT:UNITS>>
# <<EDIT:QTY>>
# <<EDIT:NOTES>>

def parse(line):
    s = line.strip()
    for f in NORMALIZERS:
        s = f(s)
    s = s.strip()
    qty = None
    for pat, handler in QTY_PATTERNS:
        m = pat.match(s)
        if m:
            qty = handler(m)
            s = s[m.end():].strip()
            break
    else:
        m = re.match(r"^(\d+(?:\.\d+)?)\s*", s)
        if m:
            qty = float(m.group(1))
            s = s[m.end():].strip()
    unit = ""
    parts = s.split(" ", 1)
    if parts and parts[0].lower() in UNIT_ALIASES:
        unit = UNIT_ALIASES[parts[0].lower()]
        s = parts[1] if len(parts) > 1 else ""
    for pat in NOTE_PATTERNS:
        s = pat.sub("", s)
    s = re.sub(r"^of\s+", "", s.strip())
    return qty, unit, s.strip().lower()
'''

# A "plausible-looking sanitizer" that silently destroys information several later
# patches depend on: '.' (decimals), '-' (ranges), ',' and '()' (notes).  This is the
# *planted structural bug* that makes second-order diagnosis meaningful (lab 10.06+).
BUG_LINE = ('NORMALIZERS.append(lambda s: re.sub(r"[.,()\\-]", " ", s))  # tag:punct_stripper')


def base_source(buggy: bool = False) -> str:
    return _BASE.replace("#<<BUG>>", BUG_LINE if buggy else "")


# ------------------------------------------------------------------------ edits
@dataclass(frozen=True)
class Edit:
    name: str
    ops: tuple            # (("add", region, line) | ("remove", tag), ...)
    target: str | None    # category the proposer *expects* to improve (its stated hypothesis)
    quality: str = "?"    # documentation only: good | weak | neutral | harmful (never used by methods)

    def apply(self, src: str) -> str:
        for op in self.ops:
            if op[0] == "add":
                _, region, line, tag = op            # each op keeps the tag of the patch it came from
                marker = f"# <<EDIT:{region}>>"
                assert marker in src, marker
                src = src.replace(marker, f"{line}  # tag:{tag}\n{marker}", 1)
            else:
                tag = op[1]
                src = "\n".join(l for l in src.split("\n") if f"# tag:{tag}" not in l)
        return src

    @property
    def added_tags(self):
        return {o[3] for o in self.ops if o[0] == "add"}

    @property
    def removed_tags(self):
        return {o[1] for o in self.ops if o[0] == "remove"}


def A(name, region, line, target, quality):
    return Edit(name, (("add", region, line, name),), target, quality)


_UNI_MAP = '{"½":"1/2","¼":"1/4","¾":"3/4","⅓":"1/3","⅔":"2/3"}'
LIBRARY: dict[str, Edit] = {e.name: e for e in [
    # ---- good
    A("unicode_fraction_map", "NORMALIZERS",
      'NORMALIZERS.append(lambda s: re.sub(r"\\s+", " ", re.sub(r"([½¼¾⅓⅔])", lambda m: " " + ' + _UNI_MAP + '[m.group(1)], s)).strip())',
      "unicode", "good"),
    A("frac_pattern", "QTY",
      'QTY_PATTERNS.append((re.compile(r"^(\\d+)/(\\d+)\\s+"), lambda m: int(m.group(1)) / int(m.group(2))))',
      "fraction", "good"),
    A("mixed_pattern", "QTY",
      'QTY_PATTERNS.append((re.compile(r"^(\\d+)\\s+(\\d+)/(\\d+)\\s+"), lambda m: int(m.group(1)) + int(m.group(2)) / int(m.group(3))))',
      "mixed", "good"),
    A("range_pattern", "QTY",
      'QTY_PATTERNS.append((re.compile(r"^(\\d+)-(\\d+)\\s+"), lambda m: (int(m.group(1)) + int(m.group(2))) / 2))',
      "range", "good"),
    A("unit_long_names", "UNITS",
      'UNIT_ALIASES.update({"tablespoon":"tbsp","tablespoons":"tbsp","teaspoon":"tsp","teaspoons":"tsp","ounce":"oz","ounces":"oz","pound":"lb","pounds":"lb","lbs":"lb","gram":"g","grams":"g","milliliter":"ml","milliliters":"ml"})',
      "synonym", "good"),
    A("unit_abbrev_extra", "UNITS", 'UNIT_ALIASES.update({"t":"tbsp","c":"cup"})', "synonym", "good"),
    A("note_comma", "NOTES", 'NOTE_PATTERNS.append(re.compile(r",.*$"))', "note", "good"),
    A("note_paren", "NOTES", 'NOTE_PATTERNS.append(re.compile(r"\\s*\\(.*?\\)"))', "paren", "good"),
    A("pinch_qty", "QTY", 'QTY_PATTERNS.append((re.compile(r"^an?\\s+(?=pinch)"), lambda m: 1.0))', "pinch", "good"),
    A("pinch_unit", "UNITS", 'UNIT_ALIASES.update({"pinch":"pinch"})', "pinch", "good"),
    # ---- weak (partial coverage)
    A("unit_long_names_partial", "UNITS",
      'UNIT_ALIASES.update({"tablespoon":"tbsp","tablespoons":"tbsp","teaspoon":"tsp","teaspoons":"tsp"})',
      "synonym", "weak"),
    A("unicode_fraction_half_only", "NORMALIZERS",
      'NORMALIZERS.append(lambda s: re.sub(r"\\s+", " ", s.replace("½", " 1/2")).strip())',
      "unicode", "weak"),
    # ---- neutral
    A("collapse_spaces", "NORMALIZERS", 'NORMALIZERS.append(lambda s: re.sub(r"\\s+", " ", s))', None, "neutral"),
    A("lowercase_all", "NORMALIZERS", 'NORMALIZERS.append(lambda s: s.lower())', None, "neutral"),
    A("strip_trailing_period", "NORMALIZERS", 'NORMALIZERS.append(lambda s: s.rstrip("."))', None, "neutral"),
    # ---- buggy variants of good ideas (plausible LLM mistakes)
    A("frac_pattern_swapped", "QTY",
      'QTY_PATTERNS.append((re.compile(r"^(\\d+)/(\\d+)\\s+"), lambda m: int(m.group(2)) / int(m.group(1))))',
      "fraction", "harmful"),
    A("mixed_pattern_drops_whole", "QTY",
      'QTY_PATTERNS.append((re.compile(r"^(\\d+)\\s+(\\d+)/(\\d+)\\s+"), lambda m: int(m.group(2)) / int(m.group(3))))',
      "mixed", "harmful"),
    A("range_pattern_lower_bound", "QTY",
      'QTY_PATTERNS.append((re.compile(r"^(\\d+)-(\\d+)\\s+"), lambda m: float(m.group(1))))', "range", "harmful"),
    A("note_comma_greedy", "NOTES", 'NOTE_PATTERNS.append(re.compile(r"\\s.*$"))', "note", "harmful"),
    # ---- clearly harmful
    A("digits_stripper", "NORMALIZERS", 'NORMALIZERS.append(lambda s: re.sub(r"\\d+", "", s))', None, "harmful"),
    A("drop_last_token", "NORMALIZERS", 'NORMALIZERS.append(lambda s: s.rsplit(" ", 1)[0])', None, "harmful"),
    A("strip_first_item_word", "NOTES", 'NOTE_PATTERNS.append(re.compile(r"^\\w+\\s+"))', "note", "harmful"),
    A("unit_alias_collision", "UNITS", 'UNIT_ALIASES.update({"g":"gram"})', "synonym", "harmful"),
    A("crashing_normalizer", "NORMALIZERS", 'NORMALIZERS.append(lambda s: s.nonexistent_method())', None, "harmful"),
]}


def remove_edit(tag: str, target: str | None = None) -> Edit:
    return Edit(f"remove:{tag}", (("remove", tag),), target, "?")


def compound(*edits: Edit) -> Edit:
    return Edit("+".join(e.name for e in edits), tuple(op for e in edits for op in e.ops),
                edits[0].target, "?")


def tags_in(src: str) -> list[str]:
    out = []
    for line in src.split("\n"):
        if "# tag:" in line:
            t = line.split("# tag:")[-1].strip()
            if t not in out:
                out.append(t)
    return out


# ------------------------------------------------------------------- diff features
FEATURE_NAMES = ["lines_added", "lines_deleted", "regex_lines_added", "table_entries_added",
                 "touches_normalizers", "touches_qty_patterns", "touches_unit_table", "touches_note_patterns"]


def diff_features(parent_src: str, child_src: str) -> list[float]:
    """Eight coordinates read off the *real* unified diff (no execution involved)."""
    diff = list(difflib.unified_diff(parent_src.split("\n"), child_src.split("\n"), lineterm="", n=0))
    add = [l[1:] for l in diff if l.startswith("+") and not l.startswith("+++")]
    dele = [l[1:] for l in diff if l.startswith("-") and not l.startswith("---")]
    changed = add + dele
    return [
        float(len(add)), float(len(dele)),
        float(sum(("re.compile" in l or "re.sub" in l) for l in add)),
        float(sum(l.count('":') for l in add if "UNIT_ALIASES.update" in l)),
        float(any("NORMALIZERS.append" in l for l in changed)),
        float(any("QTY_PATTERNS.append" in l for l in changed)),
        float(any("UNIT_ALIASES" in l for l in changed)),
        float(any("NOTE_PATTERNS.append" in l for l in changed)),
    ]


# --------------------------------------------------------------------- execution
@lru_cache(maxsize=4096)
def _compile(src: str):
    ns: dict = {}
    try:
        exec(compile(src, "<scaffold>", "exec"), ns)
        return ns["parse"]
    except Exception:  # syntax error etc. -> unusable scaffold
        return None


def _same(inst: Instance, out) -> bool:
    try:
        q, u, it = out
        if (q is None) != (inst.qty is None):
            return False
        if q is not None and abs(q - inst.qty) > 1e-6:
            return False
        return u == inst.unit and it == inst.item
    except Exception:
        return False


@dataclass
class EvalResult:
    score: float
    per_cat: dict
    failures: list = field(default_factory=list)   # Instances that failed
    passed: list = field(default_factory=list)     # bool per instance (aligned)


def evaluate(src: str, instances: list[Instance], meter: Meter | None = None,
             label: str = "eval") -> EvalResult:
    if meter is not None:
        meter.charge(len(instances), label)
    parse = _compile(src)
    ok, per = [], {c: [0, 0] for c in CATS}
    for inst in instances:
        good = False
        if parse is not None:
            try:
                good = _same(inst, parse(inst.text))
            except Exception:
                good = False
        ok.append(good)
        per[inst.cat][0] += good
        per[inst.cat][1] += 1
    return EvalResult(sum(ok) / max(1, len(ok)),
                      {c: (a / b if b else None) for c, (a, b) in per.items()},
                      [i for i, g in zip(instances, ok) if not g], ok)


SMOKE = [Instance("2 cups flour", 2.0, "cup", "flour", "plain"),
         Instance("3 eggs", 3.0, "", "eggs", "nounit"),
         Instance("1 tsp salt", 1.0, "tsp", "salt", "plain"),
         Instance("4 oz butter", 4.0, "oz", "butter", "plain")]


def smoke_test(src: str, meter: Meter | None = None) -> float:
    """4-line regression canary: a cheap pre-check that crashes/destroyed parsers fail."""
    return evaluate(src, SMOKE, meter, "smoke").score


def src_id(src: str) -> str:
    return hashlib.md5(src.encode()).hexdigest()[:8]


def random_state(rng, buggy: bool, depth: int) -> str:
    """A random multi-edit descendant of the base scaffold (used to create diverse parents)."""
    src = base_source(buggy)
    names = list(LIBRARY)
    for _ in range(depth):
        src = LIBRARY[rng.choice(names)].apply(src)
    return src


def is_duplicate(parent_src: str, child_src: str) -> float:
    """1.0 if every line the edit added already exists in the parent (a no-op re-application).
    Pure text comparison - needs no execution."""
    code = lambda l: l.split("  # tag:")[0].strip()
    plines = {code(l) for l in parent_src.split("\n")}
    diff = list(difflib.unified_diff(parent_src.split("\n"), child_src.split("\n"), lineterm="", n=0))
    add = [code(l[1:]) for l in diff if l.startswith("+") and not l.startswith("+++")]
    dele = [l for l in diff if l.startswith("-") and not l.startswith("---")]
    if dele:                       # a removal changes behaviour: never a no-op
        return 0.0
    return float(child_src == parent_src or (bool(add) and all(a in plines for a in add)))
