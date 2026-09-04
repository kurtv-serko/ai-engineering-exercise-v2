# Refund policy

Owner: Finance. Last reviewed 2026-08-14.

This is the authoritative refund calculation. Finance reconcile against it
monthly, so it has to be right to the cent. If you are implementing or changing
a refund, follow it exactly and do not round differently.

Not yet implemented in code — ships in FP-241.

## The calculation

When a confirmed booking is cancelled, the refund is the sum of the parts below.

### 1. Taxes — refunded in full

We only remit taxes for a journey that is actually flown, so an unflown ticket
recovers them entirely.

### 2. Carrier fees — never refunded

The carrier bills us at the point of ticketing and does not give them back.
A cancelled booking refunds **none** of the carrier fees.

### 3. Base fare — refunded at a cabin-dependent rate

| Cabin | Refunded |
| --- | --- |
| Economy | 50% |
| Premium | 75% |
| Business | 100% |

### 4. Cooling-off override

If the cancellation happens **within 24 hours of confirmation**, the base fare
is refunded in full whatever the cabin. This overrides the table above.

### 5. The base fare is the fare actually paid

The base fare used in steps 3 and 4 is the base fare **net of any negotiated
reduction already applied to it**. We do not refund a discount the traveller
never paid for.

This is the step most often got wrong. A traveller on a corporate rate paid less
base fare than the headline price, and their refund is calculated on what they
actually paid.

### 6. A refund never exceeds the amount paid, and is never negative

## Worked example

Traveller on the Kahu Logistics corporate rate (12%), AKL→LAX economy,
cancelled more than 24 hours after confirmation.

```
Quoted
  base fare                                  420.00
  corporate rate 12% off the base fare       -50.40
  base fare actually paid                    369.60
  taxes                                      186.00
  carrier fees                                74.00
  paid                                       629.60

Refunded
  base fare    economy, 50% of 369.60        184.80
  taxes        refunded in full              186.00
  carrier fees never refunded                  0.00
  refund                                     370.80
```

Note that the base fare refund is **184.80, not 210.00**. 210.00 would be 50% of
the 420.00 headline base fare, which the traveller did not pay.

## Related

Discounts, and what may be reduced on a quote, are specified in
`apps/api/src/domain/pricing/rules.ts`. The same principle applies in both
places: taxes and carrier fees are collected on someone else's behalf, and the
base fare is the only part that is really ours.
