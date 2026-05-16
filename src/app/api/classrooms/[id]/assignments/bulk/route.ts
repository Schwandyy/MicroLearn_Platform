import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { createManyNotifications } from "@/server/lib/notifications";

const schema = z.object({
  note: z.string().max(2000).nullable().optional(),
  lessons: z
    .array(
      z.object({
        lessonId: z.string().cuid(),
        dueAt: z.string().datetime().nullable().optional(),
      }),
    )
    .min(1)
    .max(50),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;

  const classroom = await prisma.classroom.findUnique({ where: { id } });
  if (!classroom || classroom.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const lessonIds = parsed.data.lessons.map((l) => l.lessonId);
  const lessons = await prisma.lesson.findMany({
    where: { id: { in: lessonIds } },
    select: { id: true, slug: true, title_de: true },
  });
  const lessonMap = new Map(lessons.map((l) => [l.id, l]));

  await prisma.classroomAssignment.createMany({
    data: parsed.data.lessons
      .filter((l) => lessonMap.has(l.lessonId))
      .map((l) => ({
        classroomId: id,
        lessonId: l.lessonId,
        pathId: null,
        dueAt: l.dueAt ? new Date(l.dueAt) : null,
        note: parsed.data.note ?? null,
      })),
  });

  const members = await prisma.classroomMember.findMany({
    where: { classroomId: id, isActive: true },
    select: { userId: true },
  });

  if (members.length > 0 && lessons.length > 0) {
    const inputs = members.flatMap((m) =>
      parsed.data.lessons
        .filter((l) => lessonMap.has(l.lessonId))
        .map((l) => {
          const lesson = lessonMap.get(l.lessonId)!;
          const dueSuffix = l.dueAt
            ? ` (fällig am ${new Date(l.dueAt).toLocaleDateString("de-DE")})`
            : "";
          return {
            userId: m.userId,
            type: "ASSIGNMENT" as const,
            title: `Neue Aufgabe in „${classroom.name}"`,
            body: `${lesson.title_de}${dueSuffix}`,
            link: `/lessons/${lesson.slug}`,
          };
        }),
    );
    await createManyNotifications(inputs);
  }

  return NextResponse.json({ ok: true, created: lessons.length });
}
