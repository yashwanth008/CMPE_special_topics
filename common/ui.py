"""Tiny helpers so every demo prints the same way (and can pause for screen recording)."""
import os, sys, json

def banner(text):
    print(f"\n{'=' * 70}\n{text}\n{'=' * 70}")

def step(n, text):
    """Print a numbered step. With GENUI_PAUSE=1 wait for Enter: handy while recording a video."""
    print(f"\n--- step {n}: {text}")
    if os.environ.get("GENUI_PAUSE") == "1":
        input("    [press Enter] ")

def show(label, obj):
    body = obj if isinstance(obj, str) else json.dumps(obj, indent=2)
    print(f"{label}:\n" + "\n".join("    " + l for l in body.splitlines()))
