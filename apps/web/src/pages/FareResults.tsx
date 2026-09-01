import { formatMoney } from "@farepath/shared";
import type { FareSearchQuery, FareView } from "@farepath/shared";

import { formatDateTime, formatDuration } from "../format.js";

interface FareResultsProps {
  query: FareSearchQuery;
  fares: FareView[];
  onSelect: (fare: FareView) => void;
  onBack: () => void;
}

export function FareResults({ query, fares, onSelect, onBack }: FareResultsProps) {
  return (
    <section>
      <div className="page-header">
        <h2>
          {query.origin} → {query.destination}
        </h2>
        <button type="button" className="button button--link" onClick={onBack}>
          New search
        </button>
      </div>

      {fares.length === 0 ? (
        <p className="empty-state">No fares found for this route and date.</p>
      ) : (
        <ul className="fare-list">
          {fares.map((fare) => (
            <li key={fare.id} className="fare-card">
              <div className="fare-card__summary">
                <div className="fare-card__flight">
                  <span className="fare-card__carrier">
                    {fare.carrierName} {fare.flightNumber}
                  </span>
                  <span className="fare-card__cabin">{fare.cabin}</span>
                </div>
                <div className="fare-card__times">
                  <span>{formatDateTime(fare.departAt)}</span>
                  <span className="fare-card__arrow">→</span>
                  <span>{formatDateTime(fare.arriveAt)}</span>
                  <span className="fare-card__duration">
                    {formatDuration(fare.departAt, fare.arriveAt)}
                  </span>
                </div>
                <span className="fare-card__seats">{fare.seatsAvailable} seats left</span>
              </div>

              <div className="fare-card__action">
                <span className="fare-card__price">
                  {formatMoney(fare.totalMinor, fare.currency)}
                </span>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => onSelect(fare)}
                >
                  Select
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
