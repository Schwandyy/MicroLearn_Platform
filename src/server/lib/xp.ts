import { prisma } from "@/server/db/prisma";

export const XP = {
  LESSON_COMPLETE: 50,
  PROJECT_COMPLETE: 100,
  QUIZ_PERFECT: 25,
  QUIZ_PASS: 10,
  STREAK_BONUS: 5,
} as const;

export async function grantXP(opts: {
  userId: string;
  amount: number;
  reason: keyof typeof XP | string;
  refId?: string;
}) {
  await prisma.xPTransaction.create({
    data: {
      userId: opts.userId,
      amount: opts.amount,
      reason: opts.reason,
      refId: opts.refId ?? null,
    },
  });
}

export async function bumpStreak(userId: string) {
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const existing = await prisma.streak.findUnique({ where: { userId } });
  if (!existing) {
    await prisma.streak.create({
      data: { userId, currentDays: 1, longestDays: 1, lastActiveDay: today },
    });
    return { currentDays: 1, gainedBonus: false };
  }

  const last = existing.lastActiveDay
    ? new Date(
        existing.lastActiveDay.getFullYear(),
        existing.lastActiveDay.getMonth(),
        existing.lastActiveDay.getDate(),
      )
    : null;

  if (last && last.getTime() === today.getTime()) {
    return { currentDays: existing.currentDays, gainedBonus: false };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const continuing = last && last.getTime() === yesterday.getTime();
  const next = continuing ? existing.currentDays + 1 : 1;

  await prisma.streak.update({
    where: { userId },
    data: {
      currentDays: next,
      longestDays: Math.max(existing.longestDays, next),
      lastActiveDay: today,
    },
  });

  if (continuing && next % 7 === 0) {
    await grantXP({
      userId,
      amount: XP.STREAK_BONUS * 7,
      reason: "STREAK_BONUS",
    });
    return { currentDays: next, gainedBonus: true };
  }

  return { currentDays: next, gainedBonus: false };
}
