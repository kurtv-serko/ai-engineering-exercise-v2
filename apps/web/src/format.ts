/** Display formatting helpers shared across pages and components. */

const dateTimeFormatter = new Intl.DateTimeFormat("en-NZ", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("en-NZ", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** e.g. "Fri 4 Sep, 19:00" */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso)).replace(",", "");
}

/** e.g. "Fri 4 Sep 2026" */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDuration(departAt: string, arriveAt: string): string {
  const minutes = Math.round(
    (new Date(arriveAt).getTime() - new Date(departAt).getTime()) / 60_000,
  );
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes.toString().padStart(2, "0")}m`;
}

export function formatPercent(percent: number): string {
  return `${percent.toLocaleString("en-NZ", { maximumFractionDigits: 2 })}%`;
}
