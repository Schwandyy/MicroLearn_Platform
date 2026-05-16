import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

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
  });
  return NextResponse.json({ id: created.id });
}
