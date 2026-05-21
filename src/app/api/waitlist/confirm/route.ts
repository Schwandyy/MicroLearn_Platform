import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { verifyWaitlistToken } from "@/server/lib/waitlist-token";
import { sendWaitlistWelcome } from "@/server/lib/waitlist-emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3030";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const localeParam = url.searchParams.get("locale");
  const locale: "de" | "en" = localeParam === "en" ? "en" : "de";

  if (!token) {
    return redirect(`/${locale}/waitlist?confirmed=invalid`, locale);
  }

  const entry = await prisma.waitlistEntry.findUnique({ where: { token } });

  if (!entry) {
    return redirect(`/${locale}/waitlist?confirmed=invalid`, locale);
  }

  if (entry.confirmed) {
    // Idempotent — already confirmed
    return redirect(`/${locale}/waitlist?confirmed=ok`, locale);
  }

  if (entry.expiresAt < new Date()) {
    return redirect(`/${locale}/waitlist?confirmed=expired`, locale);
  }

  if (!verifyWaitlistToken(entry.email, token)) {
    return redirect(`/${locale}/waitlist?confirmed=invalid`, locale);
  }

  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: { confirmed: true, confirmedAt: new Date() },
  });

  // Fire-and-forget welcome email
  sendWaitlistWelcome({ to: entry.email, locale }).catch(() => {});

  return redirect(`/${locale}/waitlist?confirmed=ok`, locale);
}

function redirect(path: string, _locale: string): NextResponse {
  return NextResponse.redirect(`${APP_URL}${path}`, { status: 302 });
}
