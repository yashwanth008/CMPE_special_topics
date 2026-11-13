"""Sanity tests: the testbed does what the docs claim.  Run:  pytest -q"""
import os, random, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from rsi_lab.data import CATS, make_world
from rsi_lab.scaffold import (LIBRARY, base_source, compound, diff_features, evaluate, is_duplicate,
                              remove_edit, smoke_test, tags_in)
from rsi_lab.services import BudgetExceeded, Meter
import pytest

BIG = make_world(2, n_steer=600).steer
GOOD = [n for n, e in LIBRARY.items() if e.quality == "good"]


def build(src, names):
    for n in names:
        src = LIBRARY[n].apply(src)
    return src


def test_splits_disjoint_sizes_and_deterministic():
    w1, w2 = make_world(5), make_world(5)
    assert [i.text for i in w1.test] == [i.text for i in w2.test]
    assert (len(w1.fit), len(w1.steer), len(w1.pool), len(w1.test)) == (24, 80, 120, 400)


def test_base_is_weak_and_good_patches_reach_ceiling():
    assert evaluate(base_source(False), BIG).score < 0.40
    assert evaluate(build(base_source(False), GOOD), BIG).score == 1.0


def test_planted_blocker_hurts_and_removal_fixes():
    src = build(base_source(True), GOOD)
    blocked = evaluate(src, BIG).score
    assert blocked < 0.8
    assert evaluate(remove_edit("punct_stripper").apply(src), BIG).score == 1.0


def test_harmful_edits_are_harmful_because_of_execution_not_labels():
    b = evaluate(base_source(False), BIG).score
    for n in ("digits_stripper", "crashing_normalizer"):
        assert evaluate(LIBRARY[n].apply(base_source(False)), BIG).score < b


def test_diff_features_come_from_the_diff():
    p = base_source(False)
    f = diff_features(p, LIBRARY["frac_pattern"].apply(p))
    assert f[0] == 1 and f[1] == 0 and f[2] == 1 and f[5] == 1 and f[4] == 0
    assert diff_features(p, p) == [0.0] * 8


def test_duplicate_and_removal_semantics():
    p = LIBRARY["frac_pattern"].apply(base_source(False))
    assert is_duplicate(p, LIBRARY["frac_pattern"].apply(p)) == 1.0
    assert is_duplicate(p, LIBRARY["range_pattern"].apply(p)) == 0.0
    # a removal changes behaviour: never a no-op even if it also re-adds an existing line
    q = base_source(True)
    assert is_duplicate(q, compound(remove_edit("punct_stripper"), LIBRARY["frac_pattern"]).apply(q)) == 0.0


def test_compound_keeps_per_op_tags():
    c = compound(remove_edit("punct_stripper"), LIBRARY["note_paren"])
    src = c.apply(base_source(True))
    assert "punct_stripper" not in tags_in(src) and "note_paren" in tags_in(src)


def test_meter_enforces_budget():
    m = Meter(100)
    evaluate(base_source(False), BIG[:60], m)
    with pytest.raises(BudgetExceeded):
        evaluate(base_source(False), BIG[:60], m)


def test_smoke_canary_catches_crash():
    assert smoke_test(base_source(False)) == 1.0
    assert smoke_test(LIBRARY["crashing_normalizer"].apply(base_source(False))) == 0.0


def test_rsi_index_sign():
    from importlib import import_module
    initial, final = [0.5, 0.2], [0.75, 0.6]
    assert sum((f - i) / (1 - i) for i, f in zip(initial, final)) / 2 == pytest.approx(0.5)
