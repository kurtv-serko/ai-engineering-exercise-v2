import logging
from dataclasses import dataclass

from farepath.pricing.money import clamp_to_zero
from farepath.pricing.quote import Quote
from farepath.promotions.discounts import DiscountStrategyFactory

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Confirmation:
    quote_id: str
    currency: str
    payable_minor: int
    promotion_code: str | None = None
    discount_minor: int = 0


class BookingService:
    def __init__(self, payments, promotions=None):
        self._payments = payments
        self._promotions = promotions

    def confirm(self, quote: Quote, promotion_code: str | None = None) -> Confirmation:
        discount = 0
        if promotion_code and self._promotions is not None:
            discount = self._discount_for(quote, promotion_code)

        payable = clamp_to_zero(quote.total_minor - discount)
        self._payments.charge(quote.currency, payable)
        logger.info(
            "booking confirmed",
            extra={
                "quote_id": quote.quote_id,
                "payable_minor": payable,
                "discount_minor": discount,
            },
        )
        return Confirmation(
            quote_id=quote.quote_id,
            currency=quote.currency,
            payable_minor=payable,
            promotion_code=promotion_code,
            discount_minor=discount,
        )

    def _discount_for(self, quote: Quote, promotion_code: str) -> int:
        try:
            promotion = self._promotions.get(promotion_code)
        except Exception as exc:
            logger.warning(
                "promotion lookup failed, continuing without discount",
                extra={"quote_id": quote.quote_id, "promotion_code": promotion_code},
                exc_info=exc,
            )
            return 0

        strategy = DiscountStrategyFactory.for_promotion(promotion)
        return strategy.reduction_for(quote.total_minor)
