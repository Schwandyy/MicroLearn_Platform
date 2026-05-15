import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MicroLearn — Mikroelektronik strukturiert lernen";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #0b1220 0%, #0f1830 50%, #142447 100%)",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            color: "#7dd3fc",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: "#7dd3fc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0b1220",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            µ
          </div>
          MicroLearn
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 960,
            }}
          >
            Mikroelektronik strukturiert lernen.
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#a3b3d4",
              maxWidth: 880,
              lineHeight: 1.3,
            }}
          >
            ESP32, Arduino, Pi Pico — Schritt für Schritt mit Quiz, Simulator
            und KI-Mentor.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 22,
            color: "#cbd5e1",
          }}
        >
          {["Lernpfade", "Projekte", "Zertifikate"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "10px 20px",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 999,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
