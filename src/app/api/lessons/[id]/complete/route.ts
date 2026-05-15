import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { grantXP, bumpStreak, XP } from "@/server/lib/xp";
import { issueCertificateIfPathDone } from "@/server/lib/certificates";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { id: true, xpReward: true, kind: true, courseId: true },
  });
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.userProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId: lesson.id } },
  });
  if (existing?.completedAt) {
    return NextResponse.json({ alreadyCompleted: true, xpGained: 0 });
  }

  const now = new Date();
  const course = await prisma.course.findUnique({
    where: { id: lesson.courseId },
    select: { pathId: true },
  });

  await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId: lesson.id } },
    create: {
      userId: session.user.id,
      lessonId: lesson.id,
      pathId: course?.pathId ?? null,
      percentage: 100,
      startedAt: now,
      completedAt: now,
    },
    update: { percentage: 100, completedAt: now, lastSeenAt: now },
  });

  const xp =
    lesson.kind === "PROJECT" ? XP.PROJECT_COMPLETE : lesson.xpReward;
  await grantXP({
    userId: session.user.id,
    amount: xp,
    reason:
      lesson.kind === "PROJECT" ? "PROJECT_COMPLETE" : "LESSON_COMPLETE",
    refId: lesson.id,
  });

  const streak = await bumpStreak(session.user.id);

  const certificate = course?.pathId
    ? await issueCertificateIfPathDone(session.user.id, course.pathId)
    : null;

  return NextResponse.json({ xpGained: xp, streak, certificate });
}
