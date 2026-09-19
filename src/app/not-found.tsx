import Link from "next/link"

export default function RootNotFound() {
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
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>404</h1>
          <p style={{ marginTop: "0.25rem", color: "#6b6255" }}>
            Not found · No encontrado
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link
            href="/en"
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.75rem",
              background: "#752312",
              color: "#fdf8f2",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Boardhive (EN)
          </Link>
          <Link
            href="/es"
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.75rem",
              background: "#752312",
              color: "#fdf8f2",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Boardhive (ES)
          </Link>
        </div>
      </body>
    </html>
  )
}
