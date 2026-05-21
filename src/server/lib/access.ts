import { prisma } from "@/server/db/prisma";

export type Entitlement = "free" | "pro" | "elite" | "institution";

export async function getUserEntitlement(userId: string): Promise<Entitlement> {
  // 1) Eigene User-Subscription (B2C-Pro/Elite oder eigenes Institution-Abo)
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (sub && (sub.status === "ACTIVE" || sub.status === "TRIALING")) {
    if (sub.tier === "INSTITUTION") return "institution";
    if (sub.tier === "ELITE") return "elite";
    if (sub.tier === "PRO") return "pro";
  }

  // 2) Fallback: User ist Teil einer Klasse, deren Institution eine aktive
  //    (oder trialing/Pilot) Lizenz hat — z.B. Schüler:innen, deren Schule
  //    gekauft hat. Trifft auf Lehrer:innen + Schüler:innen + Schul-Admins zu.
  const institutionPro = await hasInstitutionEntitlement(userId);
  if (institutionPro) return "institution";

  return "free";
}

async function hasInstitutionEntitlement(userId: string): Promise<boolean> {
  // Über alle Wege, wie ein User mit einer Institution verknüpft sein kann:
  // - Teacher einer Klasse
  // - Member einer Klasse (Schüler)
  // - Admin der Institution
  const institutionIds = new Set<string>();

  const [taught, membership, adminOf] = await Promise.all([
    prisma.classroom.findMany({
      where: { teacherId: userId, institutionId: { not: null } },
      select: { institutionId: true },
    }),
    prisma.classroomMember.findMany({
      where: { userId, classroom: { institutionId: { not: null } } },
      select: { classroom: { select: { institutionId: true } } },
    }),
    prisma.institutionAdmin.findMany({
      where: { userId },
      select: { institutionId: true },
    }),
  ]);

  for (const c of taught) if (c.institutionId) institutionIds.add(c.institutionId);
  for (const m of membership) {
    if (m.classroom?.institutionId) institutionIds.add(m.classroom.institutionId);
  }
  for (const a of adminOf) institutionIds.add(a.institutionId);

  if (institutionIds.size === 0) return false;

  const activeSub = await prisma.institutionSubscription.findFirst({
    where: {
      institutionId: { in: Array.from(institutionIds) },
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    select: { id: true },
  });
  return Boolean(activeSub);
}

export function canAccessLesson(opts: {
  entitlement: Entitlement;
  freeProjectsConsumed: number;
}): { allowed: boolean; reason?: "FREE_LIMIT" } {
  if (opts.entitlement !== "free") return { allowed: true };
  if (opts.freeProjectsConsumed >= 2)
    return { allowed: false, reason: "FREE_LIMIT" };
  return { allowed: true };
}

/** True for Pro, Elite, and Institution (any paid tier). */
export function isPaidEntitlement(e: Entitlement): boolean {
  return e === "pro" || e === "elite" || e === "institution";
}

/** True only for Elite and Institution (premium tiers). */
export function isPremiumEntitlement(e: Entitlement): boolean {
  return e === "elite" || e === "institution";
}

/** Feature flags that depend on ELITE or above. */
export function getFeatureFlags(e: Entitlement) {
  const isEliteOrAbove = e === "elite" || e === "institution";
  return {
    // ELITE+ can access the marketplace early
    MARKETPLACE_EARLY_ACCESS: isEliteOrAbove,
    // ELITE+ photo recognition: /api/ai/identify-components
    PHOTO_RECOGNITION: isEliteOrAbove,
    // ELITE+ priority AI mentor (200/day cap vs 50/day for Pro)
    PRIORITY_MENTOR: isEliteOrAbove,
  };
}
