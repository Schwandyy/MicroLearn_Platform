import { NextResponse } from "next/server";

/**
 * Räumt veraltete/defekte Auth-Cookies auf und redirected dann zur
 * Sign-in-Page. Nützlich, wenn ein Browser noch ein JWT-Cookie hat,
 * das mit einem anderen AUTH_SECRET signiert wurde (Server-Restart,
 * Schema-Wechsel, Auth.js-Upgrade von v4 → v5).
 *
 * Aufruf: GET /api/auth/clear-stale[?callbackUrl=/de/dashboard]
 */
const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.callback-url",
];

function sanitizeCallback(raw: string | null): string {
  if (!raw) return "/de/auth/sign-in";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/de/auth/sign-in";
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const callback = sanitizeCallback(url.searchParams.get("callbackUrl"));

  const target = new URL(callback, url.origin);
  const res = NextResponse.redirect(target);

  for (const name of AUTH_COOKIE_NAMES) {
    res.cookies.set({
      name,
      value: "",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });
  }

  return res;
}
