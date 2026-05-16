import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DSGVO Art. 15 – Recht auf Auskunft.
 * Liefert alle gespeicherten Daten des aktuellen Users als JSON-Download.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const [user, profile, subscription, progress, xp, badges, certs, projects, comments, push, classroom] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.profile.findUnique({ where: { userId } }),
      prisma.subscription.findUnique({ where: { userId } }),
      prisma.userProgress.findMany({ where: { userId } }),
      prisma.xPTransaction.findMany({ where: { userId } }),
      prisma.userBadge.findMany({ where: { userId }, include: { badge: true } }),
      prisma.certificate.findMany({ where: { userId }, include: { path: true } }),
      prisma.project.findMany({ where: { authorId: userId } }),
      prisma.comment.findMany({ where: { authorId: userId } }),
      prisma.pushSubscription.findMany({ where: { userId } }),
      prisma.classroomMember.findUnique({ where: { userId } }),
    ]);

  // Sensible Felder filtern
  const sanitizedUser = user
    ? {
        ...user,
        passwordHash: user.passwordHash ? "<redacted>" : null,
      }
    : null;

  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    user: sanitizedUser,
    profile,
    subscription,
    progress,
    xpTransactions: xp,
    badges,
    certificates: certs,
    projects,
    comments,
    pushSubscriptions: push.map((p) => ({
      ...p,
      // Endpoint redaktieren – könnte als Tracking missbraucht werden, wenn andere ihn finden
      endpoint: "<redacted>",
      p256dh: "<redacted>",
      auth: "<redacted>",
    })),
    classroomMembership: classroom,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="microlearn-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
