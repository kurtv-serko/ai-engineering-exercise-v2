from farepath.pricing.money import percentage_of
from farepath.pricing.rules import apply_reduction, discountable_basis


def test_discountable_basis_excludes_taxes_and_fees(taxed_quote):
    assert discountable_basis(taxed_quote) == 42_000


def test_reduction_is_capped_at_the_base_fare(taxed_quote):
    payable = apply_reduction(taxed_quote, 90_000)
    assert payable == 26_000


def test_percentage_of_rounds_half_up():
    assert percentage_of(42_000, 1_250) == 5_250
    assert percentage_of(1, 5_000) == 1
