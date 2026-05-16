import type { CapacitorConfig } from "@capacitor/cli";

/**
 * MicroLearn Mobile-Wrapper.
 *
 * Strategy: the iOS + Android shells are thin WebViews that load the production
 * Next.js deployment (Server Components, Stripe, NextAuth, push, R2 all rely on
 * server APIs that cannot run inside a static export). The PWA service worker
 * keeps the app usable offline once visited.
 *
 * - `server.url` is the deployed origin the WebView opens on launch.
 *   Override per env via the MICROLEARN_MOBILE_URL env var when running
 *   `cap sync` so the same config can target staging/local builds.
 * - `server.androidScheme = "https"` is required so `secure: true` cookies
 *   (NextAuth session) work inside the Android WebView.
 * - `webDir: "www"` points at the bootstrap shell shipped with the binary —
 *   it is shown for ~50 ms while the WebView navigates to `server.url`.
 */

const SERVER_URL =
  process.env.MICROLEARN_MOBILE_URL ?? "https://app.microlearn.example";

const config: CapacitorConfig = {
  appId: "com.azdelivery.microlearn",
  appName: "MicroLearn",
  webDir: "www",
  server: {
    url: SERVER_URL,
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#0b1220ff",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0b1220ff",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: "#0b1220",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0b1220",
      overlaysWebView: false,
    },
  },
};

export default config;
