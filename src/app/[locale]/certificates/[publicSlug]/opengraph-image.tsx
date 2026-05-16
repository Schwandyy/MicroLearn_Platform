import { ImageResponse } from "next/og";
import { prisma } from "@/server/db/prisma";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "MicroLearn Certificate";

export default async function CertificateOg({
  params,
}: {
  params: { locale: string; publicSlug: string };
}) {
  const { locale, publicSlug } = params;

  const cert = await prisma.certificate.findUnique({
    where: { publicSlug },
    include: {
      user: { select: { name: true, username: true } },
      path: { select: { title_de: true, title_en: true } },
    },
  });

  const isDe = locale === "de";
  const recipient = cert?.user.name ?? cert?.user.username ?? "—";
  const pathTitle = cert
    ? isDe
      ? cert.path.title_de
      : cert.path.title_en
    : isDe
      ? "MicroLearn"
      : "MicroLearn";
  const brand = isDe ? "MicroLearn · Zertifikat" : "MicroLearn · Certificate";
  const awarded = isDe ? "wird verliehen an" : "is awarded to";
  const forCompleting = isDe
    ? "für den Abschluss von"
    : "for completing";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 56,
          background:
            "linear-gradient(135deg, #fef3c7 0%, #ffffff 50%, #fde68a 100%)",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            border: "8px solid #f59e0b",
            borderRadius: 24,
            padding: 48,
            background: "#ffffff",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 18,
              letterSpacing: 6,
              color: "#a16207",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {brand}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 30,
                color: "#6b7280",
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              {awarded}
            </div>
            <div
              style={{
                fontSize: 84,
                fontWeight: 800,
                color: "#111827",
                marginTop: 14,
                lineHeight: 1,
              }}
            >
              {recipient}
            </div>
            <div
              style={{
                fontSize: 24,
                color: "#6b7280",
                marginTop: 28,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              {forCompleting}
            </div>
            <div
              style={{
                fontSize: 46,
                fontWeight: 700,
                color: "#a16207",
                marginTop: 14,
                maxWidth: 980,
                lineHeight: 1.15,
                display: "flex",
              }}
            >
              {`« ${pathTitle} »`}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              fontSize: 16,
              color: "#9ca3af",
            }}
          >
            <div style={{ display: "flex" }}>microlearn.de</div>
            <div style={{ display: "flex", fontFamily: "monospace" }}>
              {publicSlug}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
