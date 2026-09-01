import logging
from dataclasses import dataclass

from farepath.pricing.quote import Quote

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Confirmation:
    quote_id: str
    currency: str
    payable_minor: int


class BookingService:
    def __init__(self, payments):
        self._payments = payments

    def confirm(self, quote: Quote) -> Confirmation:
        payable = quote.total_minor
        self._payments.charge(quote.currency, payable)
        logger.info(
            "booking confirmed",
            extra={"quote_id": quote.quote_id, "payable_minor": payable},
        )
        return Confirmation(
            quote_id=quote.quote_id, currency=quote.currency, payable_minor=payable
        )
