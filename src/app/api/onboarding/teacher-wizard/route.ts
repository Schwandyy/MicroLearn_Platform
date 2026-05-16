import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { getUserEntitlement } from "@/server/lib/access";
import { buildTeacherProgram } from "@/server/lib/teacher-program-suggester";
import { createManyNotifications } from "@/server/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const previewSchema = z.object({
  mode: z.literal("preview"),
  state: z.string().trim().max(8).nullable().optional(),
  grade: z.coerce.number().int().min(1).max(13).nullable().optional(),
  locale: z.enum(["de", "en"]).optional(),
});

const confirmSchema = z.object({
  mode: z.literal("confirm"),
  state: z.string().trim().max(8).nullable().optional(),
  grade: z.coerce.number().int().min(1).max(13).nullable().optional(),
  classroomName: z.string().trim().min(1).max(120),
  note: z.string().trim().max(2000).nullable().optional(),
  lessons: z
    .array(
      z.object({
        lessonId: z.string().cuid(),
        dueAt: z.string().datetime().nullable().optional(),
      }),
    )
    .min(1)
    .max(12),
});

const schema = z.discriminatedUnion("mode", [previewSchema, confirmSchema]);

async function teacherGate(userId: string, role: string) {
  if (role === "ADMIN") return true;
  if (role !== "TEACHER" && role !== "INSTRUCTOR") {
    const ent = await getUserEntitlement(userId);
    return ent === "institution";
  }
  return true;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await teacherGate(session.user.id, session.user.role))) {
    return NextResponse.json({ error: "Institution required" }, { status: 402 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const stateValue = parsed.data.state?.toUpperCase() || null;
  const grade = parsed.data.grade ?? null;

  if (parsed.data.mode === "preview") {
    const locale = parsed.data.locale ?? "de";
    const suggestion = await buildTeacherProgram({
      state: stateValue,
      grade,
      locale,
    });
    return NextResponse.json(suggestion);
  }

  // confirm — create classroom + bulk-assign
  const confirmData = parsed.data;
  const classroom = await prisma.classroom.create({
    data: {
      name: confirmData.classroomName,
      state: stateValue,
      grade,
      teacherId: session.user.id,
    },
    select: { id: true, name: true },
  });

  const lessonIds = confirmData.lessons.map((l) => l.lessonId);
  const lessons = await prisma.lesson.findMany({
    where: { id: { in: lessonIds } },
    select: { id: true, slug: true, title_de: true },
  });
  const lessonMap = new Map(lessons.map((l) => [l.id, l]));

  await prisma.classroomAssignment.createMany({
    data: confirmData.lessons
      .filter((l) => lessonMap.has(l.lessonId))
      .map((l) => ({
        classroomId: classroom.id,
        lessonId: l.lessonId,
        pathId: null,
        dueAt: l.dueAt ? new Date(l.dueAt) : null,
        note: confirmData.note ?? null,
      })),
  });

  // Members are empty right after creation — notifications will fire when
  // students join via class code. (Same pattern as bulk-assign on existing classes.)
  await createManyNotifications([]);

  return NextResponse.json({
    ok: true,
    classroomId: classroom.id,
    classroomName: classroom.name,
    assigned: lessons.length,
  });
}
