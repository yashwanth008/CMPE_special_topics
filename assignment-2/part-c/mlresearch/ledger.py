"""The research record.

Append-only JSONL, one entry per experiment, flushed immediately. Same reasoning
as the transcript in Part A: when an automated process produces a surprising
result, the log is the only place the explanation lives. A truncated final line
costs one entry rather than the file.

The ledger is also the proposer's memory. `history()` is exactly what gets shown
to the next proposal, so the loop's intelligence is bounded by what this module
chooses to remember.
"""

from __future__ import annotations

import json
from pathlib import Path

from .types import Experiment, LedgerEntry, Result


class Ledger:
    def __init__(self, path: Path | None = None) -> None:
        self.path = Path(path) if path else None
        self.entries: list[LedgerEntry] = []
        if self.path:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.path.write_text("", encoding="utf-8")

    def record(self, entry: LedgerEntry) -> None:
        self.entries.append(entry)
        if self.path:
            with self.path.open("a", encoding="utf-8") as handle:
                handle.write(entry.to_json() + "\n")

    # ------------------------------------------------------------------ views

    def history(self) -> list[dict]:
        """Flat rows for the proposer: spec, outcome, score, error."""
        return [
            {
                "id": e.experiment.id,
                "spec": e.experiment.spec,
                "ok": e.result.ok,
                "val_mean": e.result.val_mean if e.result.ok else None,
                "val_std": e.result.val_std if e.result.ok else None,
                "error": e.result.error,
                "verdict": e.verdict,
            }
            for e in self.entries
        ]

    def successes(self) -> list[LedgerEntry]:
        return [e for e in self.entries if e.result.ok]

    def failures(self) -> list[LedgerEntry]:
        return [e for e in self.entries if not e.result.ok]

    def leaderboard(self, limit: int = 10) -> list[LedgerEntry]:
        """Ranked by validation mean.

        Note what this is NOT: the loop's incumbent. The top of this list is the
        maximum over many noisy measurements, which is exactly the biased
        quantity the arbiter refuses to chase. Both are reported so the gap
        between them is visible.
        """
        return sorted(self.successes(), key=lambda e: -e.result.val_mean)[:limit]

    def best_observed(self) -> LedgerEntry | None:
        board = self.leaderboard(1)
        return board[0] if board else None

    def accepted(self) -> list[LedgerEntry]:
        """The promotion chain -- the incumbent's actual lineage."""
        return [e for e in self.entries if e.verdict == "accepted"]

    def family_summary(self) -> dict[str, dict]:
        """Per-model-family statistics, for the report's discussion section."""
        summary: dict[str, dict] = {}
        for entry in self.entries:
            family = entry.experiment.spec.get("model", "?")
            row = summary.setdefault(
                family, {"n": 0, "n_failed": 0, "best": None, "scores": []}
            )
            row["n"] += 1
            if entry.result.ok:
                row["scores"].append(entry.result.val_mean)
                if row["best"] is None or entry.result.val_mean > row["best"]:
                    row["best"] = entry.result.val_mean
            else:
                row["n_failed"] += 1

        for row in summary.values():
            row["mean"] = sum(row["scores"]) / len(row["scores"]) if row["scores"] else None
        return summary

    @classmethod
    def load(cls, path: Path) -> "Ledger":
        """Re-read a ledger from disk, skipping any torn final line."""
        ledger = cls(None)
        ledger.path = Path(path)
        for line in Path(path).read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                raw = json.loads(line)
            except json.JSONDecodeError:
                continue
            from .types import Hypothesis

            experiment_raw = raw["experiment"]
            experiment = Experiment(
                id=experiment_raw["id"],
                hypothesis=Hypothesis(**experiment_raw["hypothesis"]),
                spec=experiment_raw["spec"],
                seed=experiment_raw.get("seed", 0),
            )
            ledger.entries.append(
                LedgerEntry(
                    experiment=experiment,
                    result=Result(**raw["result"]),
                    verdict=raw["verdict"],
                    reason=raw["reason"],
                    incumbent_at_time=raw.get("incumbent_at_time"),
                    wall_clock=raw.get("wall_clock", 0.0),
                )
            )
        return ledger
