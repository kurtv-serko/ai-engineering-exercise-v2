"""Money primitives.

Every amount in this service is an integer count of minor units (cents, pence).
Floats are banned throughout the pricing path: once rounding drift reaches the
ledger it cannot be reconciled against the card settlement file.
"""


class CurrencyMismatch(Exception):
    """Two amounts in different currencies were combined."""


def percentage_of(amount_minor: int, basis_points: int) -> int:
    """Return `basis_points` hundredths of a percent of `amount_minor`.

    Rounds half up, stays in integer arithmetic throughout.
    """
    if basis_points < 0:
        raise ValueError("basis_points must not be negative")
    return (amount_minor * basis_points + 5_000) // 10_000


def clamp_to_zero(amount_minor: int) -> int:
    """A payable amount is never negative."""
    return max(amount_minor, 0)
