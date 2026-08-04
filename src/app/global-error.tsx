"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// global-error replaces the root layout, so globals.css and theme classes are
// unavailable here — everything must be inlined with hard-coded Carbon colors.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#121317",
          color: "#e3e4e8",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: 24,
            textAlign: "center",
          }}
        >
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: "#abe83b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1f2b12",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            !
          </span>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                color: "#8f929c",
              }}
            >
              An unexpected error occurred. It has been reported.
            </p>
          </div>
          <button
            onClick={() => reset()}
            style={{
              height: 32,
              padding: "0 16px",
              borderRadius: 6,
              border: "none",
              background: "#abe83b",
              color: "#1f2b12",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
