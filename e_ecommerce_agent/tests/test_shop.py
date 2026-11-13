import json
import os
import sqlite3

import pytest
from adk_testing import ScriptedLlm, call, text
from fastapi.testclient import TestClient

from ecommerce_agent import store
from ecommerce_agent.agent import build_agent
from ecommerce_agent.app import create_app


@pytest.fixture(autouse=True)
def env(tmp_path, monkeypatch):
    monkeypatch.setenv("STORE_DB", str(tmp_path / "s.db"))
    monkeypatch.setenv("ALLOW_DEV_AUTH", "1")
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
    monkeypatch.delenv("MCP_SHOP_URL", raising=False)
    monkeypatch.setenv("PYTHONPATH", os.path.dirname(os.path.dirname(__file__)))


# ---------- store rules ----------
def test_search_filters():
    assert {p["brand"] for p in store.search_products(brand="Nike")} == {"Nike"}
    assert all(float(p["price"][1:]) <= 40 for p in store.search_products(max_price_eur=40))
    assert store.search_products("'; DROP TABLE products;--") == []


def test_cart_validation_and_totals():
    store.add_to_cart("u1", 1, "42", "Black", 2)
    cart = store.add_to_cart("u1", 1, "42", "Black", 1)       # merges lines
    assert cart["items"][0]["quantity"] == 3 and cart["total_cents"] == 3 * 13999
    for bad in [("43", "Pink", 1), ("99", "Black", 1), ("42", "Black", 0), ("42", "Black", 11)]:
        with pytest.raises(ValueError):
            store.add_to_cart("u1", 1, bad[0], bad[1], bad[2])


def test_checkout_decrements_stock_atomically_and_clears_cart():
    store.add_to_cart("u1", 12, "one size", "Black", 5)
    before = store.get_product(12)
    order = store.checkout("u1", "1 Main Street, Paris, France")
    assert order["total"] == "€99.95" and store.view_cart("u1")["items"] == []
    with store.connect() as c:
        assert c.execute("SELECT stock FROM products WHERE id=12").fetchone()[0] == 55


def test_no_oversell():
    store.add_to_cart("a", 6, "M", "Blue", 5)                 # stock is 5
    with pytest.raises(ValueError):
        store.add_to_cart("b", 6, "M", "Blue", 1) if False else store.add_to_cart("a", 6, "M", "Blue", 1)
    # race: both users carted before stock ran out -> second checkout must fail and roll back
    with store.connect() as c:
        c.execute("INSERT INTO cart_items(user_id,product_id,size,color,quantity) VALUES('b',6,'M','Blue',3)")
    store.checkout("a", "1 Main Street, Paris, France")
    with pytest.raises(ValueError):
        store.checkout("b", "2 Main Street, Paris, France")
    assert len(store.view_cart("b")["items"]) == 1            # cart preserved after rollback


def test_orders_are_private():
    store.add_to_cart("a", 12, "one size", "Black", 1)
    oid = store.checkout("a", "1 Main Street, Paris")["order_id"]
    assert store.get_order("a", oid)["order_id"] == oid
    with pytest.raises(ValueError):
        store.get_order("mallory", oid)


def test_nearest_store():
    assert store.find_nearest_stores(37.77, -122.42, 1)[0]["name"] == "GenAI Sports Mission"
    with pytest.raises(ValueError):
        store.find_nearest_stores(200, 0)


# ---------- agent + API, real MCP subprocess, scripted model ----------
def client(llm):
    return TestClient(create_app(build_agent(llm)))


H = {"X-User-Id": "alice"}


def test_requires_auth():
    c = client(ScriptedLlm(rules=[("Finn", [text("hi")])]))
    assert c.post("/chat", json={"message": "hi"}).status_code == 401


def test_search_flow_via_api():
    llm = ScriptedLlm(rules=[("Finn", [call("search_products", brand="Nike"), text("• Pegasus Trail 40 (Nike) - €139.99")])])
    r = client(llm).post("/chat", json={"message": "show me Nike"}, headers=H).json()
    assert "Pegasus Trail 40" in r["reply"] and r["pending_confirmation"] is None


def test_identity_is_overridden_so_model_cannot_touch_other_carts():
    llm = ScriptedLlm(rules=[("Finn", [
        call("add_to_cart", user_id="victim", product_id=12, size="one size", color="Black", quantity=1),
        text("added")])])
    r = client(llm).post("/chat", json={"message": "add a rope"}, headers=H).json()
    assert r["reply"] == "added"
    assert store.view_cart("dev:alice")["items"][0]["product_id"] == 12
    assert store.view_cart("victim")["items"] == []


def test_checkout_requires_approval_then_executes():
    llm = ScriptedLlm(rules=[("Finn", [
        call("add_to_cart", user_id="me", product_id=12, size="one size", color="Black", quantity=2),
        text("In cart. Address please?"),
        call("checkout", user_id="me", shipping_address="1 Main Street, Paris, France"),
        text("Order placed!")])])
    c = client(llm)
    s1 = c.post("/chat", json={"message": "2 ropes"}, headers=H).json()
    sid = s1["session_id"]
    s2 = c.post("/chat", json={"message": "1 Main Street, Paris, France", "session_id": sid}, headers=H).json()
    pend = s2["pending_confirmation"]
    assert pend and pend["tool"] == "checkout"
    assert store.view_cart("dev:alice")["items"], "nothing charged before approval"
    s3 = c.post("/confirm", json={"session_id": sid, "confirmation_id": pend["id"], "approved": True}, headers=H).json()
    assert s3["reply"] == "Order placed!"
    assert store.view_cart("dev:alice")["items"] == []
    with store.connect() as con:
        assert con.execute("SELECT COUNT(*) FROM orders WHERE user_id='dev:alice'").fetchone()[0] == 1


def test_rejected_checkout_keeps_cart():
    llm = ScriptedLlm(rules=[("Finn", [
        call("add_to_cart", user_id="me", product_id=12, size="one size", color="Black", quantity=1),
        text("ok"), call("checkout", user_id="me", shipping_address="1 Main Street, Paris"), text("Cancelled.")])])
    c = client(llm)
    sid = c.post("/chat", json={"message": "rope"}, headers=H).json()["session_id"]
    pend = c.post("/chat", json={"message": "buy", "session_id": sid}, headers=H).json()["pending_confirmation"]
    c.post("/confirm", json={"session_id": sid, "confirmation_id": pend["id"], "approved": False}, headers=H)
    assert store.view_cart("dev:alice")["items"]
    with store.connect() as con:
        assert con.execute("SELECT COUNT(*) FROM orders").fetchone()[0] == 0


def test_other_users_cannot_use_my_session():
    llm = ScriptedLlm(rules=[("Finn", [text("hello")])])
    c = client(llm)
    sid = c.post("/chat", json={"message": "hi"}, headers=H).json()["session_id"]
    assert c.post("/chat", json={"message": "hi", "session_id": sid}, headers={"X-User-Id": "mallory"}).status_code == 404
