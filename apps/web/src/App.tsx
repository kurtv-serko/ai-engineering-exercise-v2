import { useState } from "react";

import { fetchNetwork, fetchTravellers } from "./api/client.js";
import { StatusMessage } from "./components/StatusMessage.js";
import { useAsync } from "./hooks/useAsync.js";
import { BookingFlow } from "./pages/BookingFlow.js";
import { BookingsPage } from "./pages/BookingsPage.js";

type View = "book" | "bookings";

export function App() {
  const [view, setView] = useState<View>("book");
  const travellersState = useAsync(fetchTravellers, []);
  const networkState = useAsync(fetchNetwork, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>farepath</h1>
        <nav className="app-nav">
          <button
            type="button"
            className={view === "book" ? "app-nav__link app-nav__link--active" : "app-nav__link"}
            onClick={() => setView("book")}
          >
            Book travel
          </button>
          <button
            type="button"
            className={
              view === "bookings" ? "app-nav__link app-nav__link--active" : "app-nav__link"
            }
            onClick={() => setView("bookings")}
          >
            Bookings
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === "bookings" ? (
          <BookingsPage />
        ) : travellersState.status === "loading" || networkState.status === "loading" ? (
          <StatusMessage kind="loading" />
        ) : travellersState.status === "error" ? (
          <StatusMessage kind="error" message={travellersState.message} />
        ) : networkState.status === "error" ? (
          <StatusMessage kind="error" message={networkState.message} />
        ) : (
          <BookingFlow
            travellers={travellersState.data}
            network={networkState.data}
            onViewBookings={() => setView("bookings")}
          />
        )}
      </main>
    </div>
  );
}
