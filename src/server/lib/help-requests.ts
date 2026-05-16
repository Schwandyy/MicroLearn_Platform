import "server-only";
import { prisma } from "@/server/db/prisma";
import { createManyNotifications } from "@/server/lib/notifications";
import type { HelpRequestSource } from "@prisma/client";

// "Lang dran" — student has been on the lesson this long without finishing.
const STUCK_MIN_MINUTES = 12;
// "Gerade aktiv" — last seen heartbeat within this window (browser open).
const ACTIVE_WINDOW_MINUTES = 5;
// Anti-spam: don't open a second AUTO_STUCK on the same (student, lesson)
// within this window. Student-raised requests bypass this and always go through.
const STUCK_COOLDOWN_MINUTES = 60;

export type HelpRequestSummary = {
  id: string;
  studentId: string;
  studentName: string;
  lessonId: string;
  lessonSlug: string;
  lessonTitle_de: string;
  lessonTitle_en: string;
  classroomId: string | null;
  classroomName: string | null;
  source: HelpRequestSource;
  message: string | null;
  createdAt: string;
  ageMinutes: number;
};

/**
 * Open a HelpRequest from the student side. Always succeeds even if a recent
 * one exists — being able to "raise hand again" is intentional.
 */
export async function raiseStudentHelp(opts: {
  studentId: string;
  lessonId: string;
  message?: string | null;
}): Promise<{ id: string }> {
  const classroomId = await resolveClassroomFor(opts.studentId, opts.lessonId);
  const created = await prisma.helpRequest.create({
    data: {
      studentId: opts.studentId,
      lessonId: opts.lessonId,
      classroomId,
      source: "STUDENT_RAISED",
      message: opts.message?.slice(0, 500) ?? null,
    },
    select: { id: true, classroomId: true, lessonId: true, studentId: true },
  });
  await notifyTeachers(created.id, created.studentId, created.lessonId, created.classroomId);
  return { id: created.id };
}

/**
 * Sweep for students who are actively working on a lesson but have been on
 * it too long without finishing. Returns counts so the cron can report.
 */
export async function detectStuckStudents(opts?: { dry?: boolean }): Promise<{
  scanned: number;
  opened: number;
  skippedDueToCooldown: number;
}> {
  const now = Date.now();
  const activeSince = new Date(now - ACTIVE_WINDOW_MINUTES * 60_000);
  const startedBefore = new Date(now - STUCK_MIN_MINUTES * 60_000);
  const cooldownSince = new Date(now - STUCK_COOLDOWN_MINUTES * 60_000);

  // Candidate set: lesson-scoped UserProgress rows that are currently active
  // (recent heartbeat), haven't completed, started long ago enough, and the
  // lesson is assigned to at least one classroom (otherwise nobody to ping).
  const candidates = await prisma.userProgress.findMany({
    where: {
      lessonId: { not: null },
      completedAt: null,
      lastSeenAt: { gte: activeSince },
      startedAt: { lte: startedBefore },
      percentage: { lt: 100 },
      lesson: {
        assignments: { some: {} },
      },
    },
    select: {
      userId: true,
      lessonId: true,
      startedAt: true,
      lastSeenAt: true,
    },
    take: 500,
  });

  if (candidates.length === 0) {
    return { scanned: 0, opened: 0, skippedDueToCooldown: 0 };
  }

  let opened = 0;
  let skipped = 0;

  for (const c of candidates) {
    if (!c.lessonId) continue;
    const recent = await prisma.helpRequest.findFirst({
      where: {
        studentId: c.userId,
        lessonId: c.lessonId,
        createdAt: { gte: cooldownSince },
      },
      select: { id: true },
    });
    if (recent) {
      skipped++;
      continue;
    }

    if (opts?.dry) {
      opened++;
      continue;
    }

    const classroomId = await resolveClassroomFor(c.userId, c.lessonId);
    const created = await prisma.helpRequest.create({
      data: {
        studentId: c.userId,
        lessonId: c.lessonId,
        classroomId,
        source: "AUTO_STUCK",
      },
      select: { id: true, studentId: true, lessonId: true, classroomId: true },
    });
    await notifyTeachers(created.id, created.studentId, created.lessonId, created.classroomId);
    opened++;
  }

  return { scanned: candidates.length, opened, skippedDueToCooldown: skipped };
}

/**
 * Resolve a HelpRequest. Only the assigned classroom's teacher, the institution
 * admin (role ADMIN), or — fallback — any teacher who can see the same student
 * via a classroom membership may do so.
 */
export async function resolveHelpRequest(opts: {
  helpRequestId: string;
  resolverId: string;
  resolverRole: string;
}): Promise<{ ok: true } | { error: string; status: number }> {
  const hr = await prisma.helpRequest.findUnique({
    where: { id: opts.helpRequestId },
    select: { id: true, resolvedAt: true, classroomId: true, studentId: true },
  });
  if (!hr) return { error: "Not found", status: 404 };
  if (hr.resolvedAt) return { ok: true };

  const allowed = await canResolve({
    classroomId: hr.classroomId,
    studentId: hr.studentId,
    userId: opts.resolverId,
    role: opts.resolverRole,
  });
  if (!allowed) return { error: "Forbidden", status: 403 };

  await prisma.helpRequest.update({
    where: { id: hr.id },
    data: { resolvedAt: new Date(), resolvedById: opts.resolverId },
  });
  return { ok: true };
}

/**
 * Load all open HelpRequests visible to this teacher, ordered most-recent first.
 * Used by the dashboard "students need help" strip.
 */
export async function listOpenHelpRequestsForTeacher(opts: {
  teacherId: string;
  role: string;
  limit?: number;
  locale: "de" | "en";
}): Promise<HelpRequestSummary[]> {
  const classroomIds =
    opts.role === "ADMIN"
      ? undefined
      : await prisma.classroom
          .findMany({ where: { teacherId: opts.teacherId }, select: { id: true } })
          .then((rows) => rows.map((r) => r.id));

  if (classroomIds && classroomIds.length === 0) return [];

  const rows = await prisma.helpRequest.findMany({
    where: {
      resolvedAt: null,
      ...(classroomIds ? { classroomId: { in: classroomIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 20,
    select: {
      id: true,
      studentId: true,
      classroomId: true,
      source: true,
      message: true,
      createdAt: true,
      student: { select: { name: true, username: true } },
      lesson: {
        select: { id: true, slug: true, title_de: true, title_en: true },
      },
      classroom: { select: { name: true } },
    },
  });

  const now = Date.now();
  return rows.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    studentName: r.student.name?.trim() || r.student.username?.trim() || (opts.locale === "de" ? "Schüler:in" : "Student"),
    lessonId: r.lesson.id,
    lessonSlug: r.lesson.slug,
    lessonTitle_de: r.lesson.title_de,
    lessonTitle_en: r.lesson.title_en,
    classroomId: r.classroomId,
    classroomName: r.classroom?.name ?? null,
    source: r.source,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
    ageMinutes: Math.max(0, Math.round((now - r.createdAt.getTime()) / 60_000)),
  }));
}

async function resolveClassroomFor(studentId: string, lessonId: string): Promise<string | null> {
  // Pick the classroom that *both* contains this student *and* has this lesson
  // assigned. If multiple match, latest assignment wins.
  const assignment = await prisma.classroomAssignment.findFirst({
    where: {
      lessonId,
      classroom: { members: { some: { userId: studentId, isActive: true } } },
    },
    orderBy: { createdAt: "desc" },
    select: { classroomId: true },
  });
  return assignment?.classroomId ?? null;
}

async function notifyTeachers(
  helpRequestId: string,
  studentId: string,
  lessonId: string,
  classroomId: string | null,
): Promise<void> {
  // Who gets pinged: teacher(s) of the classroom this lesson is assigned to.
  // Fallback: every teacher who has this student in any of their classrooms.
  const teacherIds = new Set<string>();
  if (classroomId) {
    const c = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { teacherId: true },
    });
    if (c) teacherIds.add(c.teacherId);
  } else {
    const classrooms = await prisma.classroom.findMany({
      where: { members: { some: { userId: studentId, isActive: true } } },
      select: { teacherId: true },
    });
    for (const c of classrooms) teacherIds.add(c.teacherId);
  }
  if (teacherIds.size === 0) return;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { title_de: true, title_en: true },
  });
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { name: true, username: true },
  });
  const studentLabel = student?.name?.trim() || student?.username?.trim() || "Schüler:in";
  const lessonLabel = lesson?.title_de ?? "Lesson";

  await createManyNotifications(
    Array.from(teacherIds).map((teacherId) => ({
      userId: teacherId,
      type: "HELP_REQUEST" as const,
      title: `${studentLabel} braucht Hilfe`,
      body: `bei „${lessonLabel}"`,
      link: `/classroom?help=${helpRequestId}`,
    })),
  );
}

async function canResolve(args: {
  classroomId: string | null;
  studentId: string;
  userId: string;
  role: string;
}): Promise<boolean> {
  if (args.role === "ADMIN") return true;
  if (args.classroomId) {
    const c = await prisma.classroom.findUnique({
      where: { id: args.classroomId },
      select: { teacherId: true },
    });
    return c?.teacherId === args.userId;
  }
  // Classroomless help — any teacher who shares a classroom with the student.
  const shared = await prisma.classroom.findFirst({
    where: {
      teacherId: args.userId,
      members: { some: { userId: args.studentId, isActive: true } },
    },
    select: { id: true },
  });
  return Boolean(shared);
}
