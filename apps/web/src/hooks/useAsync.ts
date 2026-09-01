import { useEffect, useState } from "react";

import { ApiError } from "../api/client.js";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

/** Runs `load` whenever `deps` change, tracking loading/error/success state. */
export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    load()
      .then((data) => {
        if (!cancelled) {
          setState({ status: "success", data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ status: "error", message: describeError(error) });
        }
      });

    return () => {
      cancelled = true;
    };
    // `deps` is the caller-supplied dependency list for `load`, mirroring useEffect's own contract.
  }, deps);

  return state;
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "an unexpected error occurred";
}
