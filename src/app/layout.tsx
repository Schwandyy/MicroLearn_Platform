import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "MicroLearn",
    template: "%s · MicroLearn",
  },
  description:
    "Strukturierte Lernpfade für Mikroelektronik. ESP32, Arduino, Pi Pico — Projekte, Simulator, KI-Mentor.",
  manifest: "/manifest.webmanifest",
  applicationName: "MicroLearn",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MicroLearn",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
