"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#fafafa",
          color: "#111",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#555", marginBottom: "1.25rem" }}>
            The app hit an unexpected error. Try again, or refresh the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.6rem 1.2rem",
              fontSize: "0.95rem",
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: "1rem",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "#888",
              }}
            >
              ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
