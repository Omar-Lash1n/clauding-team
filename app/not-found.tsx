import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "1rem",
            textAlign: "center",
            padding: "1rem",
            backgroundColor: "#F0F7FF",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: "4rem", fontWeight: 700, color: "#1C2D5B", margin: 0 }}>
            404
          </h1>
          <p style={{ color: "#1C2D5B", opacity: 0.6, margin: 0 }}>
            الصفحة غير موجودة · Page not found
          </p>
          <Link
            href="/ar"
            style={{
              marginTop: "1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#3E7D60",
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              color: "white",
              textDecoration: "none",
            }}
          >
            العودة للرئيسية · Go Home
          </Link>
        </div>
      </body>
    </html>
  );
}
