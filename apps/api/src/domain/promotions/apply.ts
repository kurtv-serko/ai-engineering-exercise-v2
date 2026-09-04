/**
 * Applying a promotion code to an existing quote.
 *
 * A traveller enters a code on the quote screen. We look it up, work out what
 * it takes off, and re-price the quote in place. Re-pricing rather than
 * issuing a new quote keeps the quote id stable, so the confirm step does not
 * need to change.
 */

import { bookings, quotes, type Db } from "@farepath/db";
import { roundMoney } from "@farepath/shared";
import { eq } from "drizzle-orm";

import {
  NotFoundError,
  QuoteAlreadyBookedError,
  QuoteExpiredError,
  ValidationError,
} from "../../errors.js";
import { findQuote } from "../quoting.js";
import { getPromotion, type Promotion } from "./catalogue.js";
import { calculatePromotionDiscount } from "./discount.js";

export interface ApplyPromotionInput {
  quoteId: string;
  code: string;
  now?: Date;
}

export async function applyPromotion(db: Db, input: ApplyPromotionInput) {
  const now = input.now ?? new Date();

  const quote = db.select().from(quotes).where(eq(quotes.id, input.quoteId)).get();
  if (!quote) {
    throw new NotFoundError("quote", input.quoteId);
  }

  if (new Date(quote.expiresAt).getTime() <= now.getTime()) {
    throw new QuoteExpiredError(quote.id);
  }

  const booked = db.select().from(bookings).where(eq(bookings.quoteId, quote.id)).get();
  if (booked) {
    throw new QuoteAlreadyBookedError(quote.id);
  }

  const code = input.code.trim().toUpperCase();

  let promotion: Promotion | undefined;
  try {
    promotion = getPromotion(db, code);
  } catch (error) {
    // The catalogue mirror is not always in step with the marketing platform.
    // Rather than fail the whole quote, carry on without the discount.
    console.warn(`could not apply promotion ${code}`, error);
  }

  let promotionReduction = 0;
  if (promotion) {
    if (promotion.currency && promotion.currency !== quote.currency) {
      throw new ValidationError(
        `promotion ${code} is held in ${promotion.currency}, not ${quote.currency}`,
      );
    }
    promotionReduction = calculatePromotionDiscount(promotion, quote);
  }

  const payable = roundMoney(
    quote.baseFare +
      quote.taxes +
      quote.carrierFees -
      quote.negotiatedReduction -
      promotionReduction,
  );

  db.update(quotes)
    .set({
      promotionCode: code,
      promotionReduction,
      payable,
    })
    .where(eq(quotes.id, quote.id))
    .run();

  return findQuote(db, quote.id);
}
