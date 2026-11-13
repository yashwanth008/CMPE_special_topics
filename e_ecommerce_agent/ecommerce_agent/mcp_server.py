"""MCP server: the shopping backend as tools. Thin wrapper over store.py (all rules live there).

python -m ecommerce_agent.mcp_server            # stdio
python -m ecommerce_agent.mcp_server --http 8000  # streamable HTTP (Cloud Run)
"""
import sys

from mcp.server.fastmcp import FastMCP

from . import store

mcp = FastMCP("shop-backend")


@mcp.tool()
def search_products(query: str = "", category: str = "", brand: str = "", max_price_eur: float = 0, limit: int = 5) -> list[dict]:
    """Search the catalogue. Pass only essential keywords (e.g. brand 'Nike', or 'trail running').

    Args:
        query: keywords matched against name, brand, category and description.
        category: optional exact category: running | hiking | football | training.
        brand: optional exact brand name.
        max_price_eur: optional price ceiling in euros (0 = no limit).
        limit: max results (1-20).
    """
    return store.search_products(query, category, brand, max_price_eur, limit)


@mcp.tool()
def get_product(product_id: int) -> dict:
    """Full details for one product.

    Args:
        product_id: id from search results.
    """
    return store.get_product(product_id)


@mcp.tool()
def add_to_cart(user_id: str, product_id: int, size: str, color: str, quantity: int = 1) -> dict:
    """Add an item to the shopper's cart. size and color must be valid options for the product.

    Args:
        user_id: injected by the platform - always pass "me".
        product_id: id from search results.
        size: one of the product's sizes.
        color: one of the product's colors.
        quantity: 1-10.
    """
    return store.add_to_cart(user_id, product_id, size, color, quantity)


@mcp.tool()
def remove_from_cart(user_id: str, product_id: int) -> dict:
    """Remove a product from the cart.

    Args:
        user_id: injected by the platform - always pass "me".
        product_id: product to remove.
    """
    return store.remove_from_cart(user_id, product_id)


@mcp.tool()
def view_cart(user_id: str) -> dict:
    """Show cart contents and total.

    Args:
        user_id: injected by the platform - always pass "me".
    """
    return store.view_cart(user_id)


@mcp.tool()
def checkout(user_id: str, shipping_address: str) -> dict:
    """Place the order for everything in the cart. Charges the shopper - the platform asks them to confirm first.

    Args:
        user_id: injected by the platform - always pass "me".
        shipping_address: full street address, city and country.
    """
    return store.checkout(user_id, shipping_address)


@mcp.tool()
def get_order(user_id: str, order_id: int) -> dict:
    """Look up one of the shopper's orders.

    Args:
        user_id: injected by the platform - always pass "me".
        order_id: numeric order id.
    """
    return store.get_order(user_id, order_id)


@mcp.tool()
def find_nearest_stores(latitude: float, longitude: float, limit: int = 3) -> list[dict]:
    """Nearest physical stores to a coordinate, with distance in km.

    Args:
        latitude: shopper latitude.
        longitude: shopper longitude.
        limit: number of stores (1-10).
    """
    return store.find_nearest_stores(latitude, longitude, limit)


def main():
    if "--http" in sys.argv:
        mcp.settings.port = int(sys.argv[sys.argv.index("--http") + 1])
        mcp.run(transport="streamable-http")
    else:
        mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
