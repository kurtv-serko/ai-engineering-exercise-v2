import pytest

from farepath.pricing.quote import Quote


class FakePayments:
    def __init__(self):
        self.charges = []

    def charge(self, currency, amount_minor):
        self.charges.append((currency, amount_minor))


@pytest.fixture
def payments():
    return FakePayments()


@pytest.fixture
def taxed_quote():
    """A realistic long haul quote: tax and fees are most of the total."""
    return Quote(
        quote_id="Q-1001",
        currency="NZD",
        base_fare_minor=42_000,
        taxes_minor=18_600,
        carrier_fees_minor=7_400,
    )
