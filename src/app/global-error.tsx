"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f7f3ec",
          color: "#241d13",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            Something broke · Algo se rompió
          </h1>
          <p style={{ marginTop: "0.25rem", color: "#6b6255" }}>
            Please try again · Inténtalo de nuevo
          </p>
        </div>
        <button
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.75rem",
            background: "#752312",
            color: "#fdf8f2",
            fontWeight: 600,
            border: "none",
          }}
        >
          Retry · Reintentar
        </button>
      </body>
    </html>
  )
}
