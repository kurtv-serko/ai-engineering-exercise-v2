from dataclasses import dataclass


@dataclass(frozen=True)
class Quote:
    """A priced itinerary, ready to be confirmed.

    All amounts are minor units in `currency`.
    """

    quote_id: str
    currency: str
    base_fare_minor: int
    taxes_minor: int
    carrier_fees_minor: int

    @property
    def total_minor(self) -> int:
        return self.base_fare_minor + self.taxes_minor + self.carrier_fees_minor
