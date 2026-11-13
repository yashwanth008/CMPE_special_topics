"""RSIGym-style "Everything as a Service" layer (lab 10.16).

Every capability the RSI loops use - evaluation, diagnostics, proposal scoring -
is reached through a service that charges one shared Meter.  That gives every
method the same accounting unit (instance evaluations) so comparisons are
budget-matched by construction, mirroring the shared-budget control in RSIGym.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field


class BudgetExceeded(Exception):
    pass


@dataclass
class Meter:
    limit: float = float("inf")
    spent: float = 0.0
    by_label: dict = field(default_factory=lambda: defaultdict(float))

    def charge(self, n: float, label: str = "eval") -> None:
        if self.spent + n > self.limit:
            raise BudgetExceeded(f"{label}: need {n}, have {self.limit - self.spent}")
        self.spent += n
        self.by_label[label] += n

    @property
    def remaining(self) -> float:
        return self.limit - self.spent

    def can_afford(self, n: float) -> bool:
        return self.spent + n <= self.limit


def free_meter() -> Meter:
    """Unlimited meter for held-out reporting, whose cost is not part of any budget."""
    return Meter()
