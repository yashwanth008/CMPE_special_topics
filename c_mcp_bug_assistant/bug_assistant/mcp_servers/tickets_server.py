"""A small MCP server exposing a bug-tracker (SQLite) to any MCP client - ADK, Claude Desktop, Gemini CLI.

Run standalone:  python -m bug_assistant.mcp_servers.tickets_server     (stdio transport)
                 python -m bug_assistant.mcp_servers.tickets_server --http 8000   (streamable HTTP)
DB path comes from $TICKETS_DB (default ./tickets.db) and is seeded on first run.
All SQL is parameterised; all writes are validated against fixed vocabularies.
"""
from __future__ import annotations

import os
import sqlite3
import sys
from contextlib import closing
from datetime import datetime, timezone

from mcp.server.fastmcp import FastMCP

SEVERITIES = ("low", "medium", "high", "critical")
STATUSES = ("open", "in_progress", "resolved", "closed")

mcp = FastMCP("bug-tracker")

SEED = [
    ("Login 500 error after password reset", "Users hit HTTP 500 on /login after resetting password. Stack trace: KeyError 'session_token' in auth/session.py:88", "high", "auth", "open"),
    ("Checkout total off by one cent", "Rounding uses float arithmetic in billing/totals.py; use Decimal.", "medium", "billing", "in_progress"),
    ("Memory leak in image resize worker", "RSS grows ~50MB/hour; PIL images never closed in workers/resize.py", "high", "workers", "open"),
    ("Dark mode flicker on page load", "FOUC because theme class applied after hydrate.", "low", "frontend", "resolved"),
    ("NullPointerException in OrderService.cancel", "cancel() dereferences order.customer when guest checkout; add null check.", "critical", "orders", "open"),
]


def _db() -> sqlite3.Connection:
    path = os.getenv("TICKETS_DB", "tickets.db")
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("""CREATE TABLE IF NOT EXISTS tickets(
        id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL,
        severity TEXT NOT NULL, component TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL)""")
    conn.execute("""CREATE TABLE IF NOT EXISTS comments(
        id INTEGER PRIMARY KEY AUTOINCREMENT, ticket_id INTEGER NOT NULL REFERENCES tickets(id),
        body TEXT NOT NULL, created_at TEXT NOT NULL)""")
    if conn.execute("SELECT COUNT(*) FROM tickets").fetchone()[0] == 0:
        now = _now()
        conn.executemany(
            "INSERT INTO tickets(title,description,severity,component,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",
            [(*s, now, now) for s in SEED])
        conn.commit()
    return conn


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@mcp.tool()
def search_tickets(query: str, status: str = "", limit: int = 5) -> list[dict]:
    """Keyword-search bug tickets by title/description. Use to find duplicates or related bugs.

    Args:
        query: space-separated keywords (all must match, case-insensitive).
        status: optional filter: open | in_progress | resolved | closed.
        limit: max rows (1-20).
    """
    limit = max(1, min(int(limit), 20))
    words = [w for w in query.split() if w][:8]
    sql, params = "SELECT id,title,severity,component,status FROM tickets WHERE 1=1", []
    for w in words:
        sql += " AND (title LIKE ? OR description LIKE ?)"
        params += [f"%{w}%", f"%{w}%"]
    if status:
        if status not in STATUSES:
            raise ValueError(f"status must be one of {STATUSES}")
        sql += " AND status = ?"
        params.append(status)
    sql += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    with closing(_db()) as c:
        return [dict(r) for r in c.execute(sql, params)]


@mcp.tool()
def get_ticket(ticket_id: int) -> dict:
    """Fetch one ticket with its comments.

    Args:
        ticket_id: numeric ticket id.
    """
    with closing(_db()) as c:
        row = c.execute("SELECT * FROM tickets WHERE id=?", (ticket_id,)).fetchone()
        if not row:
            raise ValueError(f"ticket {ticket_id} not found")
        comments = [dict(r) for r in c.execute(
            "SELECT body, created_at FROM comments WHERE ticket_id=? ORDER BY id", (ticket_id,))]
        return {**dict(row), "comments": comments}


@mcp.tool()
def create_ticket(title: str, description: str, severity: str, component: str) -> dict:
    """Create a new bug ticket. Search for duplicates first.

    Args:
        title: short summary (<=120 chars).
        description: repro steps, expected vs actual, stack trace.
        severity: low | medium | high | critical.
        component: affected area, e.g. auth, billing, frontend.
    """
    if severity not in SEVERITIES:
        raise ValueError(f"severity must be one of {SEVERITIES}")
    if not title.strip() or len(title) > 120:
        raise ValueError("title must be 1-120 characters")
    now = _now()
    with closing(_db()) as c:
        cur = c.execute(
            "INSERT INTO tickets(title,description,severity,component,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",
            (title.strip(), description, severity, component.strip().lower(), "open", now, now))
        c.commit()
        return {"id": cur.lastrowid, "status": "open", "title": title.strip()}


@mcp.tool()
def update_ticket_status(ticket_id: int, status: str, comment: str = "") -> dict:
    """Change a ticket's status and optionally leave a comment.

    Args:
        ticket_id: numeric ticket id.
        status: open | in_progress | resolved | closed.
        comment: optional note explaining the change.
    """
    if status not in STATUSES:
        raise ValueError(f"status must be one of {STATUSES}")
    now = _now()
    with closing(_db()) as c:
        cur = c.execute("UPDATE tickets SET status=?, updated_at=? WHERE id=?", (status, now, ticket_id))
        if cur.rowcount == 0:
            raise ValueError(f"ticket {ticket_id} not found")
        if comment.strip():
            c.execute("INSERT INTO comments(ticket_id,body,created_at) VALUES(?,?,?)", (ticket_id, comment, now))
        c.commit()
        return {"id": ticket_id, "status": status}


@mcp.tool()
def ticket_stats() -> dict:
    """Counts of tickets by status and by severity (for triage dashboards)."""
    with closing(_db()) as c:
        by_status = {r[0]: r[1] for r in c.execute("SELECT status, COUNT(*) FROM tickets GROUP BY status")}
        by_sev = {r[0]: r[1] for r in c.execute("SELECT severity, COUNT(*) FROM tickets GROUP BY severity")}
    return {"by_status": by_status, "by_severity": by_sev}


def main() -> None:
    if "--http" in sys.argv:
        port = int(sys.argv[sys.argv.index("--http") + 1])
        mcp.settings.port = port
        mcp.run(transport="streamable-http")
    else:
        mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
