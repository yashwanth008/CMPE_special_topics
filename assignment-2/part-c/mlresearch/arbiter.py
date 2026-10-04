"""The arbiter: decides whether a result actually beats the incumbent.

This module is the main contribution of Part C, so it is worth stating the
problem precisely.

THE FAILURE MODE IT FIXES

The canonical autoresearch loop is: mutate, run, compare to best, keep if
better. Run that 50 times on a few hundred rows and it reliably "improves" the
validation score -- and reliably fails to improve the test score. The reason is
not a bug in any one comparison; it is that `max` over many noisy measurements
is a biased estimator. With 50 trials whose fold-to-fold standard error is ~1.5
points, the best observed score is roughly two standard errors above the best
true score for free. The loop reports that gap as progress.

THREE DEFENCES, IN ORDER OF IMPORTANCE

1. PAIRED COMPARISON. Every experiment is scored on the same CV folds, so a
   challenger and the incumbent can be compared fold by fold. The paired
   differences have far smaller variance than the difference of the two means,
   because the fold-to-fold difficulty that dominates both scores cancels.

2. A SIGNIFICANCE GATE, NOT `>`. A challenger is accepted only if the mean
   paired difference is positive AND survives a paired t-test at `alpha`. A
   result that is better but not distinguishable from noise is recorded as
   `inconclusive` -- kept in the ledger, not promoted to incumbent.

3. A MINIMUM EFFECT SIZE. Statistical significance is not practical
   significance; with enough folds a 0.05-point gain becomes "significant".
   `min_effect` refuses improvements too small to care about, which also stops
   the incumbent drifting through a long chain of trivial promotions.

WHAT THIS COSTS

A stricter gate accepts fewer experiments, so the headline validation number at
the end of a study is LOWER than a greedy loop would report. That is the
intended behaviour: the greedy number is inflated. `study.py` measures both so
the difference can be shown rather than asserted.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from .types import Result, Verdict


@dataclass
class Decision:
    verdict: Verdict
    reason: str
    mean_diff: float = 0.0
    p_value: float = 1.0
    effect_size: float = 0.0


def _student_t_sf(t: float, df: int) -> float:
    """Two-sided survival function for Student's t.

    Hand-rolled so the package needs no scipy: the regularised incomplete beta
    function has a continued-fraction form that is accurate enough here and
    short enough to read. scipy.stats.ttest_rel agrees with this to ~1e-6 on
    the ranges the loop uses (df between 4 and 60).
    """
    if df <= 0:
        return 1.0
    t = abs(t)
    x = df / (df + t * t)
    return _betainc(df / 2.0, 0.5, x)


def _betainc(a: float, b: float, x: float) -> float:
    """Regularised incomplete beta I_x(a, b) via Lentz's continued fraction."""
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0

    log_beta = math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b)
    front = math.exp(log_beta + a * math.log(x) + b * math.log(1.0 - x))

    # The continued fraction converges fast for x < (a+1)/(a+b+2); otherwise
    # use the symmetry I_x(a,b) = 1 - I_{1-x}(b,a).
    if x > (a + 1.0) / (a + b + 2.0):
        return 1.0 - _betainc(b, a, 1.0 - x)

    tiny = 1e-30
    f, c, d = 1.0, 1.0, 0.0

    for i in range(200):
        m = i // 2
        if i == 0:
            numerator = 1.0
        elif i % 2 == 0:
            numerator = (m * (b - m) * x) / ((a + 2.0 * m - 1.0) * (a + 2.0 * m))
        else:
            numerator = -((a + m) * (a + b + m) * x) / ((a + 2.0 * m) * (a + 2.0 * m + 1.0))

        d = 1.0 + numerator * d
        if abs(d) < tiny:
            d = tiny
        d = 1.0 / d

        c = 1.0 + numerator / c
        if abs(c) < tiny:
            c = tiny

        delta = c * d
        f *= delta
        if abs(1.0 - delta) < 1e-10:
            break

    return front * (f - 1.0) / a


def paired_t_test(a: list[float], b: list[float]) -> tuple[float, float, float]:
    """Paired t-test on fold scores. Returns (mean_diff, t_stat, p_value).

    `a` and `b` must be scores on the SAME folds in the same order -- that is
    what the executor's fixed CV seed guarantees.
    """
    if len(a) != len(b) or len(a) < 2:
        return 0.0, 0.0, 1.0

    diffs = [x - y for x, y in zip(a, b)]
    n = len(diffs)
    mean_diff = sum(diffs) / n
    variance = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1)

    if variance <= 0.0:
        # Identical on every fold, or a constant offset. A constant positive
        # offset is a real (if suspicious) improvement; zero is no change.
        return mean_diff, math.inf if mean_diff else 0.0, 0.0 if mean_diff else 1.0

    t_stat = mean_diff / math.sqrt(variance / n)
    return mean_diff, t_stat, _student_t_sf(t_stat, n - 1)


class Arbiter:
    """Applies the keep/discard rule.

    Parameters
    ----------
    alpha
        Significance level for the paired t-test.
    min_effect
        Smallest mean paired improvement worth promoting, in score units.
    prefer_simpler
        On a statistical tie, keep the incumbent. This is not just conservatism:
        without it, a long study promotes the incumbent repeatedly on noise and
        ratchets complexity upward for nothing.
    """

    def __init__(
        self,
        alpha: float = 0.05,
        min_effect: float = 0.002,
        prefer_simpler: bool = True,
    ) -> None:
        self.alpha = alpha
        self.min_effect = min_effect
        self.prefer_simpler = prefer_simpler

    def judge(self, challenger: Result, incumbent: Result | None) -> Decision:
        if not challenger.ok:
            return Decision("failed", challenger.error or "experiment failed")

        if incumbent is None:
            return Decision(
                "accepted",
                f"first successful experiment establishes the baseline "
                f"({challenger.val_mean:.4f})",
                mean_diff=challenger.val_mean,
            )

        mean_diff, t_stat, p_value = paired_t_test(
            challenger.fold_scores, incumbent.fold_scores
        )

        # Cohen's d for paired samples, reported for interpretation only.
        effect_size = 0.0
        if challenger.val_std > 0:
            effect_size = mean_diff / challenger.val_std

        if mean_diff <= 0:
            return Decision(
                "rejected",
                f"no improvement (paired mean {mean_diff:+.4f})",
                mean_diff, p_value, effect_size,
            )

        if mean_diff < self.min_effect:
            return Decision(
                "rejected",
                f"improvement {mean_diff:+.4f} below the minimum effect "
                f"{self.min_effect:.4f} -- too small to be worth a promotion",
                mean_diff, p_value, effect_size,
            )

        if p_value > self.alpha:
            return Decision(
                "inconclusive",
                f"improvement {mean_diff:+.4f} is not distinguishable from noise "
                f"(p={p_value:.3f} > {self.alpha}); recorded but not promoted",
                mean_diff, p_value, effect_size,
            )

        if (
            self.prefer_simpler
            and challenger.n_params > incumbent.n_params * 10
            and mean_diff < self.min_effect * 5
        ):
            return Decision(
                "rejected",
                f"improvement {mean_diff:+.4f} is significant but needs "
                f"{challenger.n_params / max(incumbent.n_params, 1):.0f}x the capacity "
                f"-- not worth the complexity",
                mean_diff, p_value, effect_size,
            )

        return Decision(
            "accepted",
            f"improves on the incumbent by {mean_diff:+.4f} "
            f"(paired t-test p={p_value:.4f}, {len(challenger.fold_scores)} folds)",
            mean_diff, p_value, effect_size,
        )
