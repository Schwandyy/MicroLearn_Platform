// Badge-Engine — vergibt UserBadges nach Lesson-Complete.
// Slugs sind stabil und werden vom Seed-Skript erzeugt (scripts/seed-badges.ts).

import { prisma } from "@/server/db/prisma";
import { grantXP } from "@/server/lib/xp";

export type BadgeAwardSummary = {
  slug: string;
  title_de: string;
  title_en: string;
  description_de: string;
  description_en: string;
  iconKey: string | null;
  xpReward: number;
};

export const BADGE_CATALOG = [
  {
    slug: "first-blink",
    category: "MILESTONE" as const,
    iconKey: "Sparkles",
    xpReward: 25,
    title_de: "Erstes Leuchten",
    title_en: "First Blink",
    description_de: "Du hast deine erste Lektion gemeistert.",
    description_en: "You completed your first lesson.",
  },
  {
    slug: "builder-bronze",
    category: "MILESTONE" as const,
    iconKey: "Award",
    xpReward: 50,
    title_de: "Bronze-Bastler",
    title_en: "Bronze Builder",
    description_de: "3 Lektionen geschafft. Geht doch!",
    description_en: "3 lessons completed. Nice!",
  },
  {
    slug: "builder-silver",
    category: "MILESTONE" as const,
    iconKey: "Medal",
    xpReward: 100,
    title_de: "Silber-Bastler",
    title_en: "Silver Builder",
    description_de: "10 Lektionen — du wirst zum Profi.",
    description_en: "10 lessons — getting serious.",
  },
  {
    slug: "builder-gold",
    category: "MILESTONE" as const,
    iconKey: "Trophy",
    xpReward: 250,
    title_de: "Gold-Bastler",
    title_en: "Gold Builder",
    description_de: "25 Lektionen. Respekt!",
    description_en: "25 lessons. Respect!",
  },
  {
    slug: "streak-3",
    category: "STREAK" as const,
    iconKey: "Flame",
    xpReward: 25,
    title_de: "3-Tage-Funke",
    title_en: "3-Day Spark",
    description_de: "Drei Tage in Folge gelernt.",
    description_en: "Learned three days in a row.",
  },
  {
    slug: "streak-7",
    category: "STREAK" as const,
    iconKey: "Flame",
    xpReward: 75,
    title_de: "Wochen-Brenner",
    title_en: "Weekly Blaze",
    description_de: "Sieben Tage in Folge — das ist eine Routine.",
    description_en: "Seven days in a row — that's a habit.",
  },
  {
    slug: "streak-30",
    category: "STREAK" as const,
    iconKey: "Flame",
    xpReward: 250,
    title_de: "Monats-Flamme",
    title_en: "Monthly Flame",
    description_de: "30 Tage Streak. Wahnsinn.",
    description_en: "30 days streak. Wow.",
  },
  {
    slug: "project-ace",
    category: "MASTERY" as const,
    iconKey: "Cpu",
    xpReward: 100,
    title_de: "Projekt-Ass",
    title_en: "Project Ace",
    description_de: "Dein erstes vollständiges Projekt — kein Konzept, ein richtiges Ding.",
    description_en: "Your first full project — not a concept, a real thing.",
  },
] as const;

type Ctx = {
  userId: string;
  completedLessonKind: "CONCEPT" | "PROJECT";
  streakDays: number;
};

export async function checkAndAwardBadges(ctx: Ctx): Promise<BadgeAwardSummary[]> {
  // Vorhandene Badges des Users — wir vergeben jede Badge nur einmal.
  const owned = new Set(
    (
      await prisma.userBadge.findMany({
        where: { userId: ctx.userId },
        select: { badge: { select: { slug: true } } },
      })
    ).map((u) => u.badge.slug),
  );

  // Lessons completed bisher (inklusive der gerade frisch komplettierten,
  // weil der complete-endpoint upsertet bevor wir hier ankommen).
  const lessonsDone = await prisma.userProgress.count({
    where: {
      userId: ctx.userId,
      lessonId: { not: null },
      completedAt: { not: null },
    },
  });

  const earned: string[] = [];
  if (lessonsDone >= 1 && !owned.has("first-blink")) earned.push("first-blink");
  if (lessonsDone >= 3 && !owned.has("builder-bronze")) earned.push("builder-bronze");
  if (lessonsDone >= 10 && !owned.has("builder-silver")) earned.push("builder-silver");
  if (lessonsDone >= 25 && !owned.has("builder-gold")) earned.push("builder-gold");

  if (ctx.streakDays >= 3 && !owned.has("streak-3")) earned.push("streak-3");
  if (ctx.streakDays >= 7 && !owned.has("streak-7")) earned.push("streak-7");
  if (ctx.streakDays >= 30 && !owned.has("streak-30")) earned.push("streak-30");

  if (ctx.completedLessonKind === "PROJECT" && !owned.has("project-ace")) {
    earned.push("project-ace");
  }

  if (earned.length === 0) return [];

  // Sicherstellen, dass alle Badges in der DB existieren (idempotent).
  // iconKey ist nur im Catalog (Lucide-Name) — nicht in der DB persistiert.
  await Promise.all(
    BADGE_CATALOG.filter((b) => earned.includes(b.slug)).map((b) => {
      const data = {
        slug: b.slug,
        category: b.category,
        xpReward: b.xpReward,
        title_de: b.title_de,
        title_en: b.title_en,
        description_de: b.description_de,
        description_en: b.description_en,
      };
      return prisma.badge.upsert({
        where: { slug: b.slug },
        create: data,
        update: data,
      });
    }),
  );

  const badges = await prisma.badge.findMany({
    where: { slug: { in: earned } },
    select: {
      id: true,
      slug: true,
      xpReward: true,
      title_de: true,
      title_en: true,
      description_de: true,
      description_en: true,
    },
  });

  await prisma.userBadge.createMany({
    data: badges.map((b) => ({ userId: ctx.userId, badgeId: b.id })),
    skipDuplicates: true,
  });

  // Badge-XP-Boni gutschreiben
  for (const b of badges) {
    if (b.xpReward > 0) {
      await grantXP({
        userId: ctx.userId,
        amount: b.xpReward,
        reason: `BADGE:${b.slug}`,
        refId: b.id,
      });
    }
  }

  return badges.map((b) => ({
    slug: b.slug,
    title_de: b.title_de,
    title_en: b.title_en,
    description_de: b.description_de,
    description_en: b.description_en,
    iconKey: BADGE_CATALOG.find((c) => c.slug === b.slug)?.iconKey ?? null,
    xpReward: b.xpReward,
  }));
}
