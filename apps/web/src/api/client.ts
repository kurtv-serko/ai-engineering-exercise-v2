/**
 * Thin fetch wrapper over the farepath API.
 *
 * Every function either resolves with the parsed response body or throws an
 * `ApiError` carrying the server's error code and message.
 */

import type {
  ApiErrorBody,
  BookingView,
  ConfirmBookingRequest,
  CreateQuoteRequest,
  FareSearchQuery,
  FareView,
  NetworkView,
  QuoteView,
  TravellerView,
} from "@farepath/shared";

export class ApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      body?.error.code ?? "unknown_error",
      body?.error.message ?? `request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export function fetchNetwork(): Promise<NetworkView> {
  return request<NetworkView>("/api/network");
}

export function fetchTravellers(): Promise<TravellerView[]> {
  return request<TravellerView[]>("/api/travellers");
}

export function searchFares(query: FareSearchQuery): Promise<FareView[]> {
  const params = new URLSearchParams({
    origin: query.origin,
    destination: query.destination,
    date: query.date,
  });
  if (query.cabin) {
    params.set("cabin", query.cabin);
  }
  return request<FareView[]>(`/api/fares?${params.toString()}`);
}

export function createQuote(body: CreateQuoteRequest): Promise<QuoteView> {
  return request<QuoteView>("/api/quotes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchQuote(id: string): Promise<QuoteView> {
  return request<QuoteView>(`/api/quotes/${id}`);
}

export function confirmBooking(body: ConfirmBookingRequest): Promise<BookingView> {
  return request<BookingView>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchBookings(): Promise<BookingView[]> {
  return request<BookingView[]>("/api/bookings");
}
