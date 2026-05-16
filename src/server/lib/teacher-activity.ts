import "server-only";
import { prisma } from "@/server/db/prisma";

export type TeacherActivityKind = "completion" | "joined" | "quiz";

export interface TeacherActivityItem {
  kind: TeacherActivityKind;
  classroomId: string;
  classroomName: string;
  studentName: string;
  detail: string;
  at: Date;
  link: string | null;
}

export async function getRecentTeacherActivity(
  teacherId: string,
  limit = 12,
): Promise<TeacherActivityItem[]> {
  const classrooms = await prisma.classroom.findMany({
    where: { teacherId },
    select: { id: true, name: true, members: { select: { userId: true } } },
  });
  if (classrooms.length === 0) return [];

  const userByClass = new Map<string, { id: string; name: string }>();
  const userIds = new Set<string>();
  for (const c of classrooms) {
    for (const m of c.members) {
      userIds.add(m.userId);
      userByClass.set(m.userId, { id: c.id, name: c.name });
    }
  }
  if (userIds.size === 0) return [];

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [completions, joins, quizzes, users] = await Promise.all([
    prisma.userProgress.findMany({
      where: {
        userId: { in: Array.from(userIds) },
        completedAt: { not: null, gte: since },
        lessonId: { not: null },
      },
      orderBy: { completedAt: "desc" },
      take: limit * 2,
      include: {
        lesson: { select: { slug: true, title_de: true } },
      },
    }),
    prisma.classroomMember.findMany({
      where: {
        classroomId: { in: classrooms.map((c) => c.id) },
        joinedAt: { gte: since },
      },
      orderBy: { joinedAt: "desc" },
      take: limit * 2,
    }),
    prisma.quizResult.findMany({
      where: {
        userId: { in: Array.from(userIds) },
        takenAt: { gte: since },
      },
      orderBy: { takenAt: "desc" },
      take: limit * 2,
      include: {
        quiz: {
          select: {
            lesson: { select: { slug: true, title_de: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, username: true, name: true },
    }),
  ]);

  const usernameOf = new Map(
    users.map((u) => [u.id, u.username ?? u.name ?? "—"]),
  );

  const items: TeacherActivityItem[] = [];

  for (const c of completions) {
    const cls = userByClass.get(c.userId);
    if (!cls || !c.completedAt || !c.lesson) continue;
    items.push({
      kind: "completion",
      classroomId: cls.id,
      classroomName: cls.name,
      studentName: usernameOf.get(c.userId) ?? "—",
      detail: c.lesson.title_de,
      at: c.completedAt,
      link: `/lessons/${c.lesson.slug}`,
    });
  }
  for (const j of joins) {
    items.push({
      kind: "joined",
      classroomId: j.classroomId,
      classroomName:
        classrooms.find((c) => c.id === j.classroomId)?.name ?? "—",
      studentName: usernameOf.get(j.userId) ?? "—",
      detail: "",
      at: j.joinedAt,
      link: `/classroom/${j.classroomId}`,
    });
  }
  for (const q of quizzes) {
    const cls = userByClass.get(q.userId);
    if (!cls) continue;
    const lesson = q.quiz?.lesson;
    items.push({
      kind: "quiz",
      classroomId: cls.id,
      classroomName: cls.name,
      studentName: usernameOf.get(q.userId) ?? "—",
      detail: lesson
        ? `${lesson.title_de} · ${q.score}%`
        : `Quiz · ${q.score}%`,
      at: q.takenAt,
      link: lesson ? `/lessons/${lesson.slug}` : null,
    });
  }

  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  return items.slice(0, limit);
}
