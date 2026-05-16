import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { createManyNotifications } from "@/server/lib/notifications";

const schema = z
  .object({
    pathId: z.string().cuid().nullable().optional(),
    lessonId: z.string().cuid().nullable().optional(),
    dueAt: z.string().datetime().nullable().optional(),
    note: z.string().max(2000).nullable().optional(),
  })
  .refine((d) => Boolean(d.pathId) !== Boolean(d.lessonId), {
    message: "Genau eines von pathId oder lessonId angeben",
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

  if (parsed.data.pathId) {
    const exists = await prisma.learningPath.findUnique({
      where: { id: parsed.data.pathId },
      select: { id: true },
    });
    if (!exists) return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }
  if (parsed.data.lessonId) {
    const exists = await prisma.lesson.findUnique({
      where: { id: parsed.data.lessonId },
      select: { id: true },
    });
    if (!exists) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const created = await prisma.classroomAssignment.create({
    data: {
      classroomId: id,
      pathId: parsed.data.pathId ?? null,
      lessonId: parsed.data.lessonId ?? null,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      note: parsed.data.note ?? null,
    },
    include: {
      path: { select: { slug: true, title_de: true } },
      lesson: { select: { slug: true, title_de: true } },
    },
  });

  const members = await prisma.classroomMember.findMany({
    where: { classroomId: id, isActive: true },
    select: { userId: true },
  });
  const target = created.lesson
    ? { title: created.lesson.title_de, link: `/lessons/${created.lesson.slug}` }
    : created.path
      ? { title: created.path.title_de, link: `/paths/${created.path.slug}` }
      : null;

  if (target && members.length > 0) {
    const dueSuffix = created.dueAt
      ? ` (fällig am ${created.dueAt.toLocaleDateString("de-DE")})`
      : "";
    await createManyNotifications(
      members.map((m) => ({
        userId: m.userId,
        type: "ASSIGNMENT",
        title: `Neue Aufgabe in „${classroom.name}"`,
        body: `${target.title}${dueSuffix}`,
        link: target.link,
      })),
    );
  }

  return NextResponse.json({ id: created.id });
}
