import { prisma } from "@/server/db/prisma";

export type Entitlement = "free" | "pro" | "institution";

export async function getUserEntitlement(userId: string): Promise<Entitlement> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return "free";
  if (sub.status !== "ACTIVE" && sub.status !== "TRIALING") return "free";
  switch (sub.tier) {
    case "PRO":
      return "pro";
    case "INSTITUTION":
      return "institution";
    default:
      return "free";
  }
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
