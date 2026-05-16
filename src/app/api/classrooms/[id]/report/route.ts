import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import {
  renderClassroomReportPdf,
  type CurriculumCoverageRow,
  type StudentRow,
} from "@/server/lib/classroom-report-pdf";
import { getClassroomCurriculumCoverage } from "@/server/lib/classroom-curriculum";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const url = new URL(req.url);
  const localeParam = url.searchParams.get("locale");
  const locale: "de" | "en" = localeParam === "en" ? "en" : "de";
  const isAdmin = session.user.role === "ADMIN";

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      teacher: { select: { name: true, username: true, email: true } },
      members: {
        orderBy: { joinedAt: "asc" },
        include: {
          user: {
            include: {
              progress: {
                where: { completedAt: { not: null } },
                select: { lessonId: true },
              },
              xp: { select: { amount: true } },
            },
          },
        },
      },
      assignments: {
        include: {
          lesson: { select: { id: true } },
          path: {
            select: {
              courses: { select: { lessons: { select: { id: true } } } },
            },
          },
        },
      },
    },
  });
  if (!classroom || (classroom.teacherId !== session.user.id && !isAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Per-student progress (lessons completed, XP, assignment %)
  const students: StudentRow[] = classroom.members.map((m) => {
    const completedSet = new Set<string>(
      m.user.progress.map((p) => p.lessonId).filter((x): x is string => !!x),
    );
    let assignTotal = 0;
    let assignDone = 0;
    for (const a of classroom.assignments) {
      const lessonIds = a.lesson
        ? [a.lesson.id]
        : (a.path?.courses ?? []).flatMap((cc) =>
            cc.lessons.map((l) => l.id),
          );
      if (lessonIds.length === 0) continue;
      assignTotal += 1;
      const done = lessonIds.every((lid) => completedSet.has(lid));
      if (done) assignDone += 1;
    }
    return {
      username: m.user.username ?? m.user.name ?? "(no name)",
      isActive: m.isActive,
      completedLessons: completedSet.size,
      totalXp: m.user.xp.reduce((s, x) => s + x.amount, 0),
      assignmentsDone: assignDone,
      assignmentsTotal: assignTotal,
    };
  });

  // Curriculum coverage (requires state + grade on classroom)
  const coverage = await getClassroomCurriculumCoverage({
    state: classroom.state,
    grade: classroom.grade,
    members: classroom.members.map((m) => ({
      id: m.id,
      userId: m.user.id,
    })),
    locale,
  });

  const curriculum:
    | {
        totalStandards: number;
        coveredStandards: number;
        rows: CurriculumCoverageRow[];
      }
    | null = coverage
    ? {
        totalStandards: coverage.totalStandards,
        coveredStandards: coverage.coveredStandards,
        rows: coverage.rows.map((r) => ({
          code: r.code,
          title: r.title,
          description: r.description,
          subject: r.subject,
          grade: r.grade,
          lessonsCovered: r.lessonsCovered,
          studentsCovered: r.coveredMemberIds.length,
        })),
      }
    : null;

  const pdf = await renderClassroomReportPdf({
    locale,
    classroomName: classroom.name,
    teacherName:
      classroom.teacher.name ??
      classroom.teacher.username ??
      classroom.teacher.email ??
      "—",
    state: classroom.state,
    grade: classroom.grade,
    issuedAt: new Date(),
    totalStudents: classroom.members.length,
    activeStudents: classroom.members.filter((m) => m.isActive).length,
    students,
    curriculum,
  });

  const safeName = classroom.name.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 40);
  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="classroom-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
