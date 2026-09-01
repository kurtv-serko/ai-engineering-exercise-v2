"""Promotion catalogue.

Backed by the marketing platform over HTTP. It is a third party service with a
published 99.5% availability target, so callers must treat lookup failure as a
real and recurring case, not an exceptional one.
"""

from dataclasses import dataclass


class PromotionLookupError(Exception):
    """The promotion catalogue could not be reached or returned an error."""


class PromotionNotFound(Exception):
    """The code is well formed but no such promotion exists."""


@dataclass(frozen=True)
class Promotion:
    code: str
    kind: str  # "percentage" or "fixed"
    value: int  # basis points for percentage, minor units for fixed
    currency: str | None  # set for fixed promotions only


class PromotionCatalogue:
    def __init__(self, client):
        self._client = client

    def get(self, code: str) -> Promotion:
        """Look up a promotion by code.

        Raises:
            PromotionLookupError: the catalogue was unreachable or errored.
            PromotionNotFound: no promotion exists for this code.
        """
        response = self._client.get(f"/promotions/{code}")
        if response.status_code == 404:
            raise PromotionNotFound(code)
        if response.status_code >= 500:
            raise PromotionLookupError(f"catalogue returned {response.status_code}")
        body = response.json()
        return Promotion(
            code=body["code"],
            kind=body["kind"],
            value=body["value"],
            currency=body.get("currency"),
        )
