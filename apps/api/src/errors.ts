/**
 * Domain errors.
 *
 * Every error that a client can legitimately provoke gets a type here and a
 * stable `code` on the wire. Anything else is a 500 and a stack trace in the
 * log — we do not want unexpected failures quietly turning into valid-looking
 * responses.
 */

export class DomainError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
  }
}

export class NotFoundError extends DomainError {
  constructor(what: string, id: string) {
    super("not_found", 404, `${what} ${id} does not exist`);
  }
}

export class QuoteExpiredError extends DomainError {
  constructor(quoteId: string) {
    super("quote_expired", 409, `quote ${quoteId} has expired, please re-quote`);
  }
}

export class QuoteAlreadyBookedError extends DomainError {
  constructor(quoteId: string) {
    super("quote_already_booked", 409, `quote ${quoteId} has already been booked`);
  }
}

export class NoSeatsError extends DomainError {
  constructor(fareId: string) {
    super("no_seats", 409, `fare ${fareId} has no seats left`);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super("validation_failed", 400, message);
  }
}
