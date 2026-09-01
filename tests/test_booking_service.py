from farepath.booking.service import BookingService


def test_confirm_charges_the_quote_total(taxed_quote, payments):
    confirmation = BookingService(payments).confirm(taxed_quote)
    assert confirmation.payable_minor == 68_000
    assert payments.charges == [("NZD", 68_000)]
