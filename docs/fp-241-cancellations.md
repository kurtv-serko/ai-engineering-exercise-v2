# Cancellations 🙌

FP-241 · owner: Ana, Product · P1

## Why

Travellers can book but they can't cancel! Support are going into the database
by hand every time someone changes their mind, which is obviously not scalable
now we're taking real money. This is our top support driver by volume (I don't
have the exact number to hand but it's a lot).

Would be great to get this in before the end of the quarter.

## What we want

A traveller can cancel a booking they no longer need, and see what they get
back. Self-service, no support ticket.

## User story

> As a user, I want to click a Cancel button, so that I get my money back
> quickly and hassle-free.

## Requirements

- A **Cancel booking** button on the booking screen. Red, and put it at the
  bottom so people don't hit it by accident.
- A confirmation step — we don't want accidental cancellations. Maybe a modal?
  I'll leave the UX to you but it should feel reassuring.
- Show them the refund amount before they confirm, and again after.
- Cancelling is final, no un-cancel.
- The seat goes back into inventory so someone else can buy it.
- Ideally an email confirmation too, but I appreciate that might be a stretch
  for this one, so treat that as a nice-to-have.

## Refunds

We refund them the price of the ticket, minus a fee. I'm fairly sure the number
Finance landed on was **50%** but don't quote me on it — Kirin was across the
detail and she's on leave until the 15th. There may be some nuance around the
taxes.

Business travellers should probably get more back than economy, that came up in
a meeting.

If someone cancels basically straight away we should just refund them, it looks
petty otherwise.

Please make sure the number is right, Finance reconcile against it and they get
twitchy about anything to the cent.

## Out of scope

- Partial cancellations (one leg of a return) — v2
- Changing a booking rather than cancelling it — different ticket
- Refunds to anything other than the original payment method

## Open questions

- Do we need to handle someone cancelling a flight that's already departed? I
  assume not but flagging it.
- Does anything need to happen with the corporate discount? Probably not.
