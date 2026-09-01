import pytest

from farepath.booking.service import BookingService
from farepath.pricing.quote import Quote
from farepath.promotions.catalogue import Promotion, PromotionLookupError


class FakeCatalogue:
    def __init__(self, promotion=None, error=None):
        self._promotion = promotion
        self._error = error

    def get(self, code):
        if self._error is not None:
            raise self._error
        return self._promotion


@pytest.fixture
def simple_quote():
    return Quote(
        quote_id="Q-2002",
        currency="NZD",
        base_fare_minor=20_000,
        taxes_minor=0,
        carrier_fees_minor=0,
    )


def test_percentage_promotion_reduces_the_payable_amount(simple_quote, payments):
    catalogue = FakeCatalogue(Promotion("SAVE10", "percentage", 1_000, None))
    service = BookingService(payments, catalogue)

    confirmation = service.confirm(simple_quote, "SAVE10")

    assert confirmation.discount_minor == 2_000
    assert confirmation.payable_minor == 18_000


def test_fixed_promotion_reduces_the_payable_amount(simple_quote, payments):
    catalogue = FakeCatalogue(Promotion("FLAT50", "fixed", 5_000, "NZD"))
    service = BookingService(payments, catalogue)

    confirmation = service.confirm(simple_quote, "FLAT50")

    assert confirmation.discount_minor == 5_000
    assert confirmation.payable_minor == 15_000


def test_booking_without_a_promotion_is_unchanged(simple_quote, payments):
    confirmation = BookingService(payments).confirm(simple_quote)
    assert confirmation.payable_minor == 20_000


def test_catalogue_outage_does_not_block_the_booking(simple_quote, payments):
    catalogue = FakeCatalogue(error=PromotionLookupError("boom"))
    service = BookingService(payments, catalogue)

    confirmation = service.confirm(simple_quote, "SAVE10")

    assert confirmation.payable_minor == 20_000
