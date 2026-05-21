import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { generateWaitlistToken } from "@/server/lib/waitlist-token";
import { sendWaitlistConfirmation } from "@/server/lib/waitlist-emails";
import { inMemorySlidingLimit } from "@/server/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email().max(254).transform((s) => s.toLowerCase().trim()),
  locale: z.enum(["de", "en"]).default("de"),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

const TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export async function POST(req: Request) {
  // Rate-limit: 5 attempts per IP per 10 minutes
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = inMemorySlidingLimit({
    key: `waitlist:${ip}`,
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { email, locale, utmSource, utmMedium, utmCampaign } = parsed.data;

  // Check if already confirmed
  const existing = await prisma.waitlistEntry.findUnique({ where: { email } });
  if (existing?.confirmed) {
    // Return 200 without leaking that the email is already registered
    return NextResponse.json({ status: "pending_confirmation" });
  }

  const token = generateWaitlistToken(email);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  // Upsert: re-signup before confirmation refreshes the token
  await prisma.waitlistEntry.upsert({
    where: { email },
    create: { email, token, locale, expiresAt },
    update: { token, locale, expiresAt },
  });

  await sendWaitlistConfirmation({ to: email, token, locale });

  return NextResponse.json({ status: "pending_confirmation" });
}
