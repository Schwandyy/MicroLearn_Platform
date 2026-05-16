import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { bumpStreak, grantXP } from "@/server/lib/xp";

const STARTER_XP = 25;

const schema = z.object({
  mode: z.enum(["hardware", "simulator"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const userId = session.user.id;
  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { userId, starterCompletedAt: new Date(), starterMode: parsed.data.mode },
    update: {},
    select: { starterCompletedAt: true },
  });

  let firstRun = false;
  if (!profile.starterCompletedAt) {
    firstRun = true;
    await prisma.profile.update({
      where: { userId },
      data: { starterCompletedAt: new Date(), starterMode: parsed.data.mode },
    });
    await grantXP({ userId, amount: STARTER_XP, reason: "ONBOARDING_STARTER" });
  }

  const streak = await bumpStreak(userId);

  return NextResponse.json({
    ok: true,
    firstRun,
    xpAwarded: firstRun ? STARTER_XP : 0,
    streakDays: streak.currentDays,
  });
}
