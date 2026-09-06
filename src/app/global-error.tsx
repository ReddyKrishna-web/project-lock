"use client";

/**
 * Global error boundary — last resort when even the root layout fails.
 * Must render its own <html>/<body> (the root layout is not available).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#0f1117",
          color: "#e5e7eb",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
          margin: 0,
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>StudyPilot hit unexpected turbulence</h1>
        <p style={{ maxWidth: "28rem", color: "#9ca3af", lineHeight: 1.6 }}>
          A critical error occurred. Please try again — if it persists, restart
          the app server.
        </p>
        {error.digest && (
          <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.65rem 1.25rem",
            borderRadius: "0.75rem",
            background: "#5753d4",
            color: "white",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
