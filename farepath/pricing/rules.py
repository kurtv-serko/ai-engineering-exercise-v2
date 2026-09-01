"""Fare pricing rules.

Invariant D1 (discount basis)
----------------------------
A discount reduces the base fare and nothing else. Taxes and carrier fees are
statutory pass-through amounts that we collect on behalf of a third party and
remit in full. Discounting them means remitting money we never collected, which
the monthly settlement reconciliation will reject.

Any reduction computed against `Quote.total_minor` is therefore a defect, not a
rounding difference. Use `discountable_basis()` to obtain the correct basis.

Invariant D2 (floor)
--------------------
A discount never takes the payable total below the taxes and fees component.
"""

from farepath.pricing.money import clamp_to_zero
from farepath.pricing.quote import Quote


def discountable_basis(quote: Quote) -> int:
    """The only amount a promotion is permitted to reduce. See invariant D1."""
    return quote.base_fare_minor


def apply_reduction(quote: Quote, reduction_minor: int) -> int:
    """Payable total after a reduction, respecting invariants D1 and D2."""
    capped = min(reduction_minor, discountable_basis(quote))
    return clamp_to_zero(quote.total_minor - capped)
