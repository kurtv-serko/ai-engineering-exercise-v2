/**
 * Promotion catalogue.
 *
 * Promotions are owned by the marketing platform and mirrored into our
 * database by a nightly job. Reads can fail — the mirror is not always in
 * step, and codes are deactivated out from under us — so callers have to
 * handle both "no such code" and "lookup blew up".
 */

import { promotions, type Db } from "@farepath/db";
import { and, eq } from "drizzle-orm";

export class PromotionNotFoundError extends Error {
  constructor(code: string) {
    super(`no active promotion for code ${code}`);
    this.name = "PromotionNotFoundError";
  }
}

export interface Promotion {
  code: string;
  kind: "percentage" | "fixed";
  /** A plain percentage for a percentage promotion, decimal dollars for a fixed one. */
  value: number;
  currency: string | null;
}

export function getPromotion(db: Db, code: string): Promotion {
  const row = db
    .select()
    .from(promotions)
    .where(and(eq(promotions.code, code.toUpperCase()), eq(promotions.active, 1)))
    .get();

  if (!row) {
    throw new PromotionNotFoundError(code);
  }

  return {
    code: row.code,
    kind: row.kind,
    value: row.value,
    currency: row.currency,
  };
}
