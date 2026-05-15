import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3030",
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
  openGraph: {
    type: "website",
    siteName: "MicroLearn",
    title: "MicroLearn — Mikroelektronik strukturiert lernen",
    description:
      "Lernpfade, Projekte, Simulator und KI-Mentor für ESP32, Arduino & Co.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MicroLearn",
    description:
      "Strukturierte Lernpfade für Mikroelektronik mit Quiz, Simulator und KI-Mentor.",
  },
  alternates: {
    languages: {
      de: "/de",
      en: "/en",
    },
  },
  robots: {
    index: true,
    follow: true,
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
