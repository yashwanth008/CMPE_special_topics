"""Synthetic-but-executable dataset: messy recipe ingredient lines with gold labels.

Task:  parse("1½ cups flour, sifted")  ->  (1.5, "cup", "flour")

Every line belongs to one *category* (the formatting difficulty it exercises).
Gold labels come from the generator, so evaluation is exact - no LLM judge.

A *world* bundles four disjoint splits drawn from one seed:
    fit    (24)  cheap labels used to calibrate Budget-RSI's linear readout
    steer  (80)  the search-time signal ("steering split")
    pool   (120) training pool for the Self-HPO lab
    test   (400) HELD-OUT; never used for selection, only for reporting
The test split has a different category mix (more of the rare "pinch" lines) so
that selection overfitting / distribution shift is visible, not hidden.
"""
from __future__ import annotations

import random
from dataclasses import dataclass

CATS = ["plain", "decimal", "fraction", "mixed", "unicode", "range",
        "synonym", "paren", "note", "nounit", "pinch"]

# Category mix (percent). DEV is used by fit/steer/pool, TEST by the held-out split.
W_DEV = dict(plain=12, decimal=9, fraction=11, mixed=11, unicode=9, range=9,
             synonym=12, paren=8, note=9, nounit=7, pinch=3)
W_TEST = dict(plain=9, decimal=8, fraction=10, mixed=10, unicode=8, range=8,
              synonym=12, paren=9, note=9, nounit=7, pinch=10)

# Grouping used by the RSI-Index lab ("benchmarks" = sub-skills).
GROUPS = {
    "numbers": ["plain", "decimal", "fraction", "mixed", "unicode", "range"],
    "units": ["synonym", "nounit"],
    "notes": ["paren", "note"],
    "shifted": ["pinch"],
}

ITEMS = ["flour", "sugar", "butter", "olive oil", "brown sugar", "milk", "salt",
         "black pepper", "garlic", "chicken broth", "baking powder",
         "vanilla extract", "soy sauce", "lemon juice", "cheddar cheese", "rice"]
COUNTABLE = ["eggs", "onions", "carrots", "lemons", "tomatoes"]
PINCH_ITEMS = ["salt", "black pepper", "nutmeg", "cinnamon"]

BASE_UNITS = {"cup": ["cup", "cups"], "tbsp": ["tbsp"], "tsp": ["tsp"],
              "oz": ["oz"], "lb": ["lb"], "g": ["g"], "ml": ["ml"]}
SYN_UNITS = {"tbsp": ["tablespoon", "tablespoons", "T"], "tsp": ["teaspoon", "teaspoons"],
             "oz": ["ounce", "ounces"], "lb": ["pound", "pounds", "lbs"],
             "g": ["gram", "grams"], "ml": ["milliliters"], "cup": ["c"]}
FRACS = [("1/2", 0.5), ("1/4", 0.25), ("3/4", 0.75), ("1/3", 1 / 3), ("2/3", 2 / 3)]
UNI = {"½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3}
PAREN_NOTES = ["(sifted)", "(divided)", "(optional)", "(about 1 cup)"]
COMMA_NOTES = [", finely chopped", ", melted", ", to taste", ", room temperature"]


@dataclass(frozen=True)
class Instance:
    text: str
    qty: float | None
    unit: str
    item: str
    cat: str


def _canon_unit(rng, table):
    u = rng.choice(sorted(table))
    return u, rng.choice(table[u])


def gen_instance(rng: random.Random, cat: str) -> Instance:
    item = rng.choice(ITEMS)
    if cat == "plain":
        n = rng.randint(1, 6)
        u, s = _canon_unit(rng, BASE_UNITS)
        return Instance(f"{n} {s} {item}", float(n), u, item, cat)
    if cat == "decimal":
        x = rng.choice([0.5, 1.5, 2.5, 0.25, 0.75, 1.25])
        u, s = _canon_unit(rng, BASE_UNITS)
        return Instance(f"{x} {s} {item}", x, u, item, cat)
    if cat == "fraction":
        f, v = rng.choice(FRACS)
        u, s = _canon_unit(rng, BASE_UNITS)
        return Instance(f"{f} {s} {item}", v, u, item, cat)
    if cat == "mixed":
        w = rng.randint(1, 3)
        f, v = rng.choice(FRACS)
        u, s = _canon_unit(rng, BASE_UNITS)
        return Instance(f"{w} {f} {s} {item}", w + v, u, item, cat)
    if cat == "unicode":
        ch, v = rng.choice(sorted(UNI.items()))
        u, s = _canon_unit(rng, BASE_UNITS)
        if rng.random() < 0.5:
            return Instance(f"{ch} {s} {item}", v, u, item, cat)
        w = rng.randint(1, 3)
        return Instance(f"{w}{ch} {s} {item}", w + v, u, item, cat)
    if cat == "range":
        a = rng.randint(1, 4)
        b = a + 1
        u, s = _canon_unit(rng, BASE_UNITS)
        return Instance(f"{a}-{b} {s} {item}", (a + b) / 2, u, item, cat)
    if cat == "synonym":
        n = rng.randint(1, 5)
        u, s = _canon_unit(rng, SYN_UNITS)
        return Instance(f"{n} {s} {item}", float(n), u, item, cat)
    if cat == "paren":
        n = rng.randint(1, 5)
        u, s = _canon_unit(rng, BASE_UNITS)
        return Instance(f"{n} {s} {item} {rng.choice(PAREN_NOTES)}", float(n), u, item, cat)
    if cat == "note":
        n = rng.randint(1, 5)
        u, s = _canon_unit(rng, BASE_UNITS)
        return Instance(f"{n} {s} {item}{rng.choice(COMMA_NOTES)}", float(n), u, item, cat)
    if cat == "nounit":
        n = rng.randint(1, 6)
        it = rng.choice(COUNTABLE)
        return Instance(f"{n} {it}", float(n), "", it, cat)
    if cat == "pinch":
        it = rng.choice(PINCH_ITEMS)
        return Instance(f"a pinch of {it}", 1.0, "pinch", it, cat)
    raise ValueError(cat)


def sample_split(rng: random.Random, n: int, weights: dict) -> list[Instance]:
    cats = rng.choices(list(weights), weights=list(weights.values()), k=n)
    return [gen_instance(rng, c) for c in cats]


@dataclass
class World:
    seed: int
    fit: list[Instance]
    steer: list[Instance]
    pool: list[Instance]
    test: list[Instance]


def make_world(seed: int, n_fit=24, n_steer=80, n_pool=120, n_test=400) -> World:
    rng = random.Random(seed * 7919 + 13)
    return World(seed,
                 sample_split(rng, n_fit, W_DEV),
                 sample_split(rng, n_steer, W_DEV),
                 sample_split(rng, n_pool, W_DEV),
                 sample_split(rng, n_test, W_TEST))
