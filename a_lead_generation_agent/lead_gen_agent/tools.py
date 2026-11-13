"""Deterministic pieces of the pipeline: scoring and CSV export."""
from __future__ import annotations

import csv
import os
from pathlib import Path

SIGNAL_WEIGHTS = {
    "funding": 30,
    "hiring": 20,
    "expansion": 20,
    "product_launch": 15,
    "leadership_change": 15,
    "partnership": 10,
    "other": 5,
}
BASE_FIT_SCORE = 20
MAX_SIGNALS_COUNTED = 4  # diminishing returns: cap so one noisy company can't dominate


def score_lead(research: dict | None) -> dict:
    """Score one researched lead 0-100. Sources-less signals are ignored (anti-hallucination)."""
    research = research or {}
    signals = [s for s in research.get("signals", []) if s.get("source_url")]
    ranked = sorted(signals, key=lambda s: SIGNAL_WEIGHTS.get(s.get("type", "other"), 5), reverse=True)
    counted = ranked[:MAX_SIGNALS_COUNTED]
    score = BASE_FIT_SCORE + sum(SIGNAL_WEIGHTS.get(s.get("type", "other"), 5) for s in counted)
    return {
        "score": min(100, score),
        "top_signal": counted[0]["description"] if counted else "No verified signal found",
        "verified_signal_count": len(signals),
    }


def export_leads_csv(scored_leads: list[dict], filename: str = "leads.csv") -> dict:
    """Write the scored leads to CSV under $LEADGEN_OUTPUT_DIR (default ./outputs).

    Args:
        scored_leads: list of dicts with company_name, score, top_signal, contact_role, website.
        filename: output file name (no directories allowed).

    Returns:
        dict with status and the written path.
    """
    safe = os.path.basename(filename) or "leads.csv"
    out_dir = Path(os.getenv("LEADGEN_OUTPUT_DIR", "outputs"))
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / safe
    fields = ["rank", "company_name", "score", "top_signal", "contact_role", "website"]
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for i, lead in enumerate(scored_leads, 1):
            w.writerow({"rank": i, **lead})
    return {"status": "success", "path": str(path), "rows": len(scored_leads)}
