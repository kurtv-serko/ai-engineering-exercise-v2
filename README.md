# farepath

Fare quoting and booking confirmation for a small travel retail service.

## Layout

- `farepath/pricing/` money primitives and the fare pricing rules
- `farepath/promotions/` promotion catalogue lookup
- `farepath/booking/` booking confirmation service
- `tests/` pytest suite

## Running

    pip install -e .
    pytest
