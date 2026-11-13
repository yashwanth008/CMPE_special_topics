"""Data layer (SQLite for dev/test). The MCP server is the only thing that touches it.

All money is stored as integer cents - never floats. All SQL is parameterised. Stock is decremented
inside the checkout transaction with a guarded UPDATE so concurrent orders can't oversell.
"""
from __future__ import annotations

import json
import math
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

MAX_QTY_PER_LINE = 10

PRODUCTS = [  # name, brand, category, price_cents, sizes, colors, stock, description
    ("Pegasus Trail 40", "Nike", "running", 13999, ["40", "41", "42", "43", "44"], ["Black", "Volt"], 20, "Rugged trail running shoe with aggressive grip."),
    ("Ultraboost Light", "Adidas", "running", 18999, ["40", "41", "42", "43"], ["White", "Navy"], 15, "Cushioned road shoe with Light BOOST foam."),
    ("Nimbus 25", "ASICS", "running", 16999, ["41", "42", "43", "44"], ["Black/Gold"], 12, "Flagship cushioned daily trainer."),
    ("Glycerin 20", "Brooks", "running", 15999, ["40", "41", "42", "43"], ["Grey", "Blue"], 10, "Plush neutral running shoe for long miles."),
    ("Trek 500 Pack 50L", "Quechua", "hiking", 8999, ["one size"], ["Green", "Grey"], 8, "50L hiking backpack for weekend trips."),
    ("Atmos AG 65", "Osprey", "hiking", 27999, ["S", "M", "L"], ["Blue"], 5, "Anti-Gravity suspension backpack for long trails."),
    ("Merino Base Layer", "Icebreaker", "hiking", 7499, ["S", "M", "L", "XL"], ["Black"], 30, "Warm, odour-resistant merino top."),
    ("Pro Match Football", "Adidas", "football", 3999, ["5"], ["White"], 40, "Match-quality football, size 5."),
    ("Predator Boots", "Adidas", "football", 12999, ["40", "41", "42", "43", "44"], ["Red"], 14, "Firm-ground football boots with control zones."),
    ("Dri-FIT Training Tee", "Nike", "training", 2999, ["S", "M", "L", "XL"], ["Black", "Grey"], 50, "Sweat-wicking training t-shirt."),
    ("Yoga Mat 6mm", "Manduka", "training", 6999, ["one size"], ["Purple"], 25, "Dense, non-slip yoga mat."),
    ("Speed Rope", "Rogue", "training", 1999, ["one size"], ["Black"], 60, "Adjustable steel-cable jump rope."),
]
STORES = [  # name, address, lat, lon
    ("GenAI Sports Downtown", "1 Market St, San Francisco", 37.7936, -122.3965),
    ("GenAI Sports Mission", "2200 Mission St, San Francisco", 37.7599, -122.4194),
    ("GenAI Sports Oakland", "500 Broadway, Oakland", 37.7955, -122.2778),
    ("GenAI Sports San Jose", "300 S 1st St, San Jose", 37.3330, -121.8907),
]


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@contextmanager
def connect():
    conn = sqlite3.connect(os.getenv("STORE_DB", "store.db"), isolation_level=None)  # explicit transactions
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    _init(conn)
    try:
        yield conn
    finally:
        conn.close()


def _init(conn: sqlite3.Connection) -> None:
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, name TEXT, brand TEXT, category TEXT,
        price_cents INTEGER, sizes TEXT, colors TEXT, stock INTEGER, description TEXT);
    CREATE TABLE IF NOT EXISTS stores(id INTEGER PRIMARY KEY, name TEXT, address TEXT, lat REAL, lon REAL);
    CREATE TABLE IF NOT EXISTS cart_items(id INTEGER PRIMARY KEY, user_id TEXT NOT NULL,
        product_id INTEGER NOT NULL REFERENCES products(id), size TEXT, color TEXT, quantity INTEGER NOT NULL,
        UNIQUE(user_id, product_id, size, color));
    CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, status TEXT NOT NULL,
        total_cents INTEGER NOT NULL, shipping_address TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL, name TEXT, size TEXT, color TEXT, quantity INTEGER, unit_price_cents INTEGER);
    """)
    if conn.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 0:
        conn.executemany(
            "INSERT INTO products(name,brand,category,price_cents,sizes,colors,stock,description) VALUES(?,?,?,?,?,?,?,?)",
            [(n, b, c, p, json.dumps(s), json.dumps(co), st, d) for n, b, c, p, s, co, st, d in PRODUCTS])
        conn.executemany("INSERT INTO stores(name,address,lat,lon) VALUES(?,?,?,?)", STORES)


def _product_row(r: sqlite3.Row) -> dict:
    return {"id": r["id"], "name": r["name"], "brand": r["brand"], "category": r["category"],
            "price": f"€{r['price_cents'] / 100:.2f}", "sizes": json.loads(r["sizes"]),
            "colors": json.loads(r["colors"]), "in_stock": r["stock"] > 0, "description": r["description"]}


def search_products(query="", category="", brand="", max_price_eur=0.0, limit=5) -> list[dict]:
    sql, p = "SELECT * FROM products WHERE 1=1", []
    for w in [w for w in query.split() if w][:6]:
        sql += " AND (name LIKE ? OR brand LIKE ? OR category LIKE ? OR description LIKE ?)"
        p += [f"%{w}%"] * 4
    if category:
        sql += " AND lower(category)=lower(?)"; p.append(category)
    if brand:
        sql += " AND lower(brand)=lower(?)"; p.append(brand)
    if max_price_eur and max_price_eur > 0:
        sql += " AND price_cents <= ?"; p.append(int(round(max_price_eur * 100)))
    sql += " ORDER BY price_cents LIMIT ?"; p.append(max(1, min(int(limit), 20)))
    with connect() as c:
        return [_product_row(r) for r in c.execute(sql, p)]


def get_product(product_id: int) -> dict:
    with connect() as c:
        r = c.execute("SELECT * FROM products WHERE id=?", (product_id,)).fetchone()
    if not r:
        raise ValueError(f"product {product_id} not found")
    return _product_row(r)


def add_to_cart(user_id: str, product_id: int, size: str, color: str, quantity: int) -> dict:
    if not (1 <= quantity <= MAX_QTY_PER_LINE):
        raise ValueError(f"quantity must be 1-{MAX_QTY_PER_LINE}")
    with connect() as c:
        r = c.execute("SELECT * FROM products WHERE id=?", (product_id,)).fetchone()
        if not r:
            raise ValueError(f"product {product_id} not found")
        if size not in json.loads(r["sizes"]):
            raise ValueError(f"size {size!r} not available; choose from {json.loads(r['sizes'])}")
        if color not in json.loads(r["colors"]):
            raise ValueError(f"color {color!r} not available; choose from {json.loads(r['colors'])}")
        have = c.execute("SELECT COALESCE(SUM(quantity),0) FROM cart_items WHERE user_id=? AND product_id=?",
                         (user_id, product_id)).fetchone()[0]
        if have + quantity > r["stock"]:
            raise ValueError(f"only {r['stock']} in stock")
        c.execute("""INSERT INTO cart_items(user_id,product_id,size,color,quantity) VALUES(?,?,?,?,?)
                     ON CONFLICT(user_id,product_id,size,color) DO UPDATE SET quantity=quantity+excluded.quantity""",
                  (user_id, product_id, size, color, quantity))
    return view_cart(user_id)


def remove_from_cart(user_id: str, product_id: int) -> dict:
    with connect() as c:
        c.execute("DELETE FROM cart_items WHERE user_id=? AND product_id=?", (user_id, product_id))
    return view_cart(user_id)


def view_cart(user_id: str) -> dict:
    with connect() as c:
        rows = c.execute("""SELECT ci.product_id, p.name, p.brand, ci.size, ci.color, ci.quantity, p.price_cents
                            FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=?""",
                         (user_id,)).fetchall()
    items = [{"product_id": r["product_id"], "name": r["name"], "brand": r["brand"], "size": r["size"],
              "color": r["color"], "quantity": r["quantity"], "unit_price": f"€{r['price_cents'] / 100:.2f}",
              "line_total": f"€{r['price_cents'] * r['quantity'] / 100:.2f}"} for r in rows]
    total = sum(r["price_cents"] * r["quantity"] for r in rows)
    return {"items": items, "total": f"€{total / 100:.2f}", "total_cents": total}


def checkout(user_id: str, shipping_address: str) -> dict:
    if len(shipping_address.strip()) < 8:
        raise ValueError("a full shipping address is required")
    with connect() as c:
        c.execute("BEGIN IMMEDIATE")
        try:
            rows = c.execute("""SELECT ci.*, p.name, p.price_cents FROM cart_items ci
                                JOIN products p ON p.id=ci.product_id WHERE ci.user_id=?""", (user_id,)).fetchall()
            if not rows:
                raise ValueError("cart is empty")
            for r in rows:   # guarded decrement: fails (rowcount 0) if stock is insufficient
                cur = c.execute("UPDATE products SET stock=stock-? WHERE id=? AND stock>=?",
                                (r["quantity"], r["product_id"], r["quantity"]))
                if cur.rowcount == 0:
                    raise ValueError(f"'{r['name']}' no longer has enough stock")
            total = sum(r["price_cents"] * r["quantity"] for r in rows)
            oid = c.execute("INSERT INTO orders(user_id,status,total_cents,shipping_address,created_at) VALUES(?,?,?,?,?)",
                            (user_id, "confirmed", total, shipping_address.strip(), now())).lastrowid
            c.executemany("INSERT INTO order_items(order_id,product_id,name,size,color,quantity,unit_price_cents) VALUES(?,?,?,?,?,?,?)",
                          [(oid, r["product_id"], r["name"], r["size"], r["color"], r["quantity"], r["price_cents"]) for r in rows])
            c.execute("DELETE FROM cart_items WHERE user_id=?", (user_id,))
            c.execute("COMMIT")
        except Exception:
            c.execute("ROLLBACK")
            raise
    return {"order_id": oid, "status": "confirmed", "total": f"€{total / 100:.2f}"}


def get_order(user_id: str, order_id: int) -> dict:
    with connect() as c:
        o = c.execute("SELECT * FROM orders WHERE id=? AND user_id=?", (order_id, user_id)).fetchone()
        if not o:   # same error for "missing" and "someone else's" - no information leak
            raise ValueError(f"order {order_id} not found")
        items = [dict(r) for r in c.execute(
            "SELECT name,size,color,quantity,unit_price_cents FROM order_items WHERE order_id=?", (order_id,))]
    return {"order_id": o["id"], "status": o["status"], "total": f"€{o['total_cents'] / 100:.2f}",
            "shipping_address": o["shipping_address"], "created_at": o["created_at"], "items": items}


def find_nearest_stores(lat: float, lon: float, limit: int = 3) -> list[dict]:
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise ValueError("invalid coordinates")
    def hav(a, b, c_, d):
        p1, p2 = math.radians(a), math.radians(c_)
        h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(d - b) / 2) ** 2
        return 2 * 6371.0 * math.asin(math.sqrt(h))
    with connect() as c:
        rows = c.execute("SELECT * FROM stores").fetchall()
    out = sorted(({"name": r["name"], "address": r["address"], "distance_km": round(hav(lat, lon, r["lat"], r["lon"]), 1)}
                  for r in rows), key=lambda s: s["distance_km"])
    return out[: max(1, min(int(limit), 10))]
