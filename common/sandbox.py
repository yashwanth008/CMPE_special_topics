"""Open-ended output = untrusted markup. Two layers: lint it, then isolate it.

A sandbox reduces capabilities. It does not make arbitrary model output 'safe' on its own.
"""
import html, re

BLOCK = [
    (r"<script[^>]+src\s*=", "external <script src>"),
    (r"\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon", "network call"),
    (r"document\.cookie|localStorage|sessionStorage", "storage/cookie access"),
    (r"<form\b", "<form> (can post data out)"),
    (r"<iframe\b|<object\b|<embed\b", "nested embed"),
    (r"https?://", "external URL"),
]
CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:"

def lint_html(markup):
    """Return a list of findings. Empty list = nothing flagged (still rendered inside the sandbox)."""
    return [why for pat, why in BLOCK if re.search(pat, markup, re.I)]

def wrap_iframe(markup, height=160):
    """srcdoc iframe: sandbox=allow-scripts WITHOUT allow-same-origin => opaque origin, no cookies,
    no parent DOM access. The CSP meta forbids network. The only exit is postMessage."""
    doc = f'<meta http-equiv="Content-Security-Policy" content="{CSP}">' + markup
    return (f'<iframe sandbox="allow-scripts" referrerpolicy="no-referrer" '
            f'style="border:1px solid #ccc;width:100%;height:{height}px" srcdoc="{html.escape(doc, quote=True)}"></iframe>')

ALLOWED_ACTIONS = {"show_region"}

def check_message(msg):
    """Validate a postMessage from the iframe: a fixed shape and an allow-listed action name."""
    if not isinstance(msg, dict) or msg.get("type") != "action":
        raise ValueError("bad message shape")
    if msg.get("name") not in ALLOWED_ACTIONS:
        raise PermissionError(f"action '{msg.get('name')}' is not allowed")
    return msg
