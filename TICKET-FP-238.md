# FP-238 - Promotion codes at booking confirmation

Marketing want to run acquisition campaigns with promotion codes. A traveller
enters a code at checkout and the booking confirms at the reduced price.

The promotion catalogue already exists and serves two kinds of promotion:
percentage off, and a fixed amount off.

## Acceptance criteria

- A promotion code can be passed to booking confirmation.
- The discount is applied before the card is charged.
- The confirmation returns the applied code and the discount amount.
- A promotion catalogue outage does not prevent a booking from completing.
