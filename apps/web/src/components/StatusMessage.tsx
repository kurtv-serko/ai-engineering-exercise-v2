interface StatusMessageProps {
  kind: "loading" | "error";
  message?: string;
}

export function StatusMessage({ kind, message }: StatusMessageProps) {
  if (kind === "loading") {
    return (
      <p className="status-message status-message--loading" role="status">
        Loading…
      </p>
    );
  }

  return (
    <p className="status-message status-message--error" role="alert">
      {message}
    </p>
  );
}
