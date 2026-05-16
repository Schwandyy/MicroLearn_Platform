import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import {
  verifyUnsubscribeToken,
  type UnsubKind,
} from "@/server/lib/unsubscribe-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe endpoint linked from digest mails.
 * Supports `k=weekly` (teacher weekly digest) and `k=parentMonthly`
 * (parent monthly report). Flips the corresponding User column to true.
 * Idempotent — visiting twice does not error.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("u");
  const kindParam = url.searchParams.get("k");
  const token = url.searchParams.get("t");
  const localeParam = url.searchParams.get("locale");
  const locale: "de" | "en" = localeParam === "en" ? "en" : "de";

  const kind: UnsubKind | null =
    kindParam === "weekly" || kindParam === "parentMonthly" ? kindParam : null;

  if (!userId || !kind || !token) {
    return htmlResponse(locale, "invalid", kind ?? "weekly");
  }
  if (!verifyUnsubscribeToken(userId, kind, token)) {
    return htmlResponse(locale, "invalid", kind);
  }

  if (kind === "weekly") {
    await prisma.user.update({
      where: { id: userId },
      data: { weeklyDigestOptOut: true },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { monthlyParentDigestOptOut: true },
    });
  }

  return htmlResponse(locale, "ok", kind);
}

export { GET as POST };

function htmlResponse(
  locale: "de" | "en",
  state: "ok" | "invalid",
  kind: UnsubKind,
): NextResponse {
  const COPY = {
    de: {
      weekly: {
        title: "Abmelden vom Wochenbericht",
        ok: "Du wurdest erfolgreich abgemeldet. Wir senden dir keine Wochenberichte mehr.",
        invalid:
          "Dieser Link ist ungültig oder abgelaufen. Bitte melde dich in den Einstellungen ab, wenn du das möchtest.",
        reactivate:
          "Du kannst diese Mails jederzeit über die App-Einstellungen wieder aktivieren.",
      },
      parentMonthly: {
        title: "Abmelden vom Eltern-Monatsbericht",
        ok: "Sie wurden erfolgreich abgemeldet. Wir senden Ihnen keine Monatsberichte mehr.",
        invalid:
          "Dieser Link ist ungültig oder abgelaufen. Bitte fragen Sie Ihr Kind, die Eltern-Mail in den App-Einstellungen zu deaktivieren.",
        reactivate:
          "Ihr Kind kann diese Mails jederzeit über die App-Einstellungen wieder aktivieren.",
      },
      footer: "MicroLearn · AZ-Delivery",
    },
    en: {
      weekly: {
        title: "Unsubscribe from weekly digest",
        ok: "You have been unsubscribed. We will no longer send you weekly digest mails.",
        invalid:
          "This link is invalid or expired. Please use the app settings to opt out instead.",
        reactivate:
          "You can re-enable these mails any time from your app settings.",
      },
      parentMonthly: {
        title: "Unsubscribe from monthly parent report",
        ok: "You have been unsubscribed. We will no longer send you monthly parent reports.",
        invalid:
          "This link is invalid or expired. Please ask your child to disable the parent email in the app settings.",
        reactivate:
          "Your child can re-enable these mails any time from their app settings.",
      },
      footer: "MicroLearn · AZ-Delivery",
    },
  } as const;
  const c = COPY[locale][kind];

  const body = `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${c.title}</title>
  <style>
    :root { color-scheme: light dark; }
    body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; }
    @media (prefers-color-scheme: dark) {
      body { background: #0b1220; color: #eee; }
      .card { background: #111827 !important; color: #eee !important; }
      .muted { color: #888 !important; }
    }
    .wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; box-sizing: border-box; }
    .card { background: #fff; border-radius: 12px; padding: 28px; max-width: 480px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .brand { font-size: 11px; letter-spacing: 4px; color: #a16207; font-weight: 700; text-transform: uppercase; }
    h1 { font-size: 22px; margin: 8px 0 12px; }
    p { line-height: 1.5; }
    .muted { color: #666; font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="brand">MicroLearn</div>
      <h1>${c.title}</h1>
      <p>${state === "ok" ? c.ok : c.invalid}</p>
      ${state === "ok" ? `<p class="muted">${c.reactivate}</p>` : ""}
      <p class="muted">${COPY[locale].footer}</p>
    </div>
  </div>
</body>
</html>`;
  return new NextResponse(body, {
    status: state === "ok" ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
