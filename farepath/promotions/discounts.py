"""Discount strategies for promotion codes."""

from abc import ABC, abstractmethod

from farepath.pricing.money import percentage_of
from farepath.promotions.catalogue import Promotion


class DiscountStrategy(ABC):
    """Computes the reduction a promotion produces for a given amount."""

    @abstractmethod
    def reduction_for(self, amount_minor: int) -> int:
        """Return the reduction in minor units."""


class PercentageDiscountStrategy(DiscountStrategy):
    def __init__(self, basis_points: int) -> None:
        self._basis_points = basis_points

    def reduction_for(self, amount_minor: int) -> int:
        return percentage_of(amount_minor, self._basis_points)


class FixedAmountDiscountStrategy(DiscountStrategy):
    def __init__(self, amount_minor: int) -> None:
        self._amount_minor = amount_minor

    def reduction_for(self, amount_minor: int) -> int:
        return min(self._amount_minor, amount_minor)


class DiscountStrategyFactory:
    """Builds the right DiscountStrategy for a promotion."""

    _REGISTRY = {
        "percentage": lambda promotion: PercentageDiscountStrategy(promotion.value),
        "fixed": lambda promotion: FixedAmountDiscountStrategy(promotion.value),
    }

    @classmethod
    def for_promotion(cls, promotion: Promotion) -> DiscountStrategy:
        builder = cls._REGISTRY.get(promotion.kind)
        if builder is None:
            raise ValueError(f"unsupported promotion kind: {promotion.kind}")
        return builder(promotion)
