import { formatMoney } from "@farepath/shared";
import type { BookingView } from "@farepath/shared";

import { fetchBookings } from "../api/client.js";
import { formatDate } from "../format.js";
import { useAsync } from "../hooks/useAsync.js";
import { StatusMessage } from "../components/StatusMessage.js";

function byNewestFirst(a: BookingView, b: BookingView): number {
  return new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime();
}

export function BookingsPage() {
  const state = useAsync(fetchBookings, []);

  return (
    <section>
      <h2>All bookings</h2>

      {state.status === "loading" && <StatusMessage kind="loading" />}
      {state.status === "error" && <StatusMessage kind="error" message={state.message} />}
      {state.status === "success" &&
        (state.data.length === 0 ? (
          <p className="empty-state">No bookings yet.</p>
        ) : (
          <table className="bookings-table">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Route</th>
                <th scope="col">Departs</th>
                <th scope="col">Traveller</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[...state.data].sort(byNewestFirst).map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.reference}</td>
                  <td>
                    {booking.fare.origin} → {booking.fare.destination}
                  </td>
                  <td>{formatDate(booking.fare.departAt)}</td>
                  <td>{booking.travellerName}</td>
                  <td>{formatMoney(booking.payableMinor, booking.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
    </section>
  );
}
