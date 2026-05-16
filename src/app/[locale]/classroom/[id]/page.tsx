import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/server/db/prisma";
import { getUserEntitlement } from "@/server/lib/access";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/admin/badge";
import { ChevronLeft, GraduationCap } from "lucide-react";
import { ClassroomDetailTabs } from "@/components/classroom/classroom-detail-tabs";

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("classroom");

  const session = await requireSession({
    locale,
    callbackPath: `/${locale}/classroom/${id}`,
  });

  const entitlement = await getUserEntitlement(session.user.id);
  const isAdmin = session.user.role === "ADMIN";
  if (entitlement !== "institution" && !isAdmin) {
    notFound();
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: { joinedAt: "asc" },
        include: {
          user: {
            include: {
              progress: {
                where: { completedAt: { not: null } },
                select: { id: true, lessonId: true, pathId: true },
              },
              xp: { select: { amount: true } },
            },
          },
        },
      },
      codes: { orderBy: { expiresAt: "desc" } },
      assignments: {
        orderBy: { createdAt: "desc" },
        include: {
          path: {
            select: {
              id: true,
              slug: true,
              title_de: true,
              title_en: true,
              courses: {
                select: { lessons: { select: { id: true } } },
              },
            },
          },
          lesson: {
            select: { id: true, slug: true, title_de: true, title_en: true },
          },
        },
      },
    },
  });

  if (!classroom || (classroom.teacherId !== session.user.id && !isAdmin)) {
    notFound();
  }

  const titleField = locale === "en" ? "title_en" : "title_de";

  const students = classroom.members.map((m) => {
    const completedLessonIds = new Set(
      m.user.progress
        .filter((p) => p.lessonId != null)
        .map((p) => p.lessonId as string),
    );
    return {
      memberId: m.id,
      userId: m.user.id,
      isActive: m.isActive,
      username: m.user.username ?? "(no name)",
      completedLessons: completedLessonIds.size,
      totalXp: m.user.xp.reduce((sum, x) => sum + x.amount, 0),
      completedLessonIds: Array.from(completedLessonIds),
    };
  });

  const assignments = classroom.assignments.map((a) => {
    const lessonIds = a.lesson
      ? [a.lesson.id]
      : (a.path?.courses ?? []).flatMap((c) => c.lessons.map((l) => l.id));
    const total = lessonIds.length || 1;
    const perStudent = students.map((s) => {
      const done = s.completedLessonIds.filter((lid) => lessonIds.includes(lid)).length;
      return {
        memberId: s.memberId,
        username: s.username,
        done,
        total,
        percent: Math.round((done / total) * 100),
      };
    });
    const fullyDone = perStudent.filter((p) => p.percent >= 100).length;
    return {
      id: a.id,
      kind: a.lesson ? ("lesson" as const) : ("path" as const),
      title: a.lesson
        ? a.lesson[titleField]
        : (a.path?.[titleField] ?? "—"),
      slug: a.lesson ? a.lesson.slug : (a.path?.slug ?? ""),
      dueAt: a.dueAt?.toISOString() ?? null,
      note: a.note,
      total,
      fullyDone,
      perStudent,
    };
  });

  const [paths, lessons] = await Promise.all([
    prisma.learningPath.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        title_de: true,
        title_en: true,
      },
    }),
    prisma.lesson.findMany({
      where: { isPublished: true },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        slug: true,
        title_de: true,
        title_en: true,
      },
    }),
  ]);

  return (
    <div className="container">
      <div className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 pb-4 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/classroom">
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("backToList")}
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-1 h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{classroom.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {classroom.curriculumTag && (
                  <Badge>{classroom.curriculumTag}</Badge>
                )}
                <span>
                  {t("studentsCount", { count: students.length })}
                </span>
                <span>·</span>
                <span>{t("assignmentsCount", { count: assignments.length })}</span>
              </div>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/classrooms/${classroom.id}/report`} download>
              {t("exportPdf")}
            </a>
          </Button>
        </div>
      </div>

      <div className="pb-10 pt-2">
        <ClassroomDetailTabs
          classroomId={classroom.id}
          students={students}
          codes={classroom.codes.map((c) => ({
            id: c.id,
            code: c.code,
            expiresAt: c.expiresAt.toISOString(),
            maxUses: c.maxUses,
            uses: c.uses,
          }))}
          assignments={assignments}
          paths={paths.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p[titleField],
          }))}
          lessons={lessons.map((l) => ({
            id: l.id,
            slug: l.slug,
            title: l[titleField],
          }))}
        />
      </div>
    </div>
  );
}
