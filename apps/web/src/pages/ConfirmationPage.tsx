import { formatMoney } from "@farepath/shared";
import type { BookingView } from "@farepath/shared";

import { formatDateTime } from "../format.js";

interface ConfirmationPageProps {
  booking: BookingView;
  onNewSearch: () => void;
  onViewBookings: () => void;
}

export function ConfirmationPage({
  booking,
  onNewSearch,
  onViewBookings,
}: ConfirmationPageProps) {
  const { fare } = booking;

  return (
    <section className="confirmation">
      <p className="confirmation__label">Booking confirmed</p>
      <p className="confirmation__reference">{booking.reference}</p>

      <dl className="confirmation__details">
        <div>
          <dt>Traveller</dt>
          <dd>{booking.travellerName}</dd>
        </div>
        <div>
          <dt>Flight</dt>
          <dd>
            {fare.carrierName} {fare.flightNumber} · {fare.origin} → {fare.destination}
          </dd>
        </div>
        <div>
          <dt>Departs</dt>
          <dd>{formatDateTime(fare.departAt)}</dd>
        </div>
        <div>
          <dt>Amount paid</dt>
          <dd>{formatMoney(booking.payableMinor, booking.currency)}</dd>
        </div>
      </dl>

      <div className="confirmation__actions">
        <button type="button" className="button button--primary" onClick={onNewSearch}>
          Book another trip
        </button>
        <button type="button" className="button button--secondary" onClick={onViewBookings}>
          View all bookings
        </button>
      </div>
    </section>
  );
}
