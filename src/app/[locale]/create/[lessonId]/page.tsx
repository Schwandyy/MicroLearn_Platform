import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/server/db/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/admin/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Lock } from "lucide-react";
import { LessonWizard } from "@/components/create/lesson-wizard";

const ALLOWED_ROLES = new Set(["TEACHER", "INSTRUCTOR", "ADMIN"]);
const ALLOWED_STEP_KINDS = new Set([
  "INTRO",
  "EXPLAIN",
  "BUILD",
  "CODE_WALK",
  "CELEBRATE",
]);

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ locale: string; lessonId: string }>;
}) {
  const { locale, lessonId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("create");

  const session = await requireSession({
    locale,
    callbackPath: `/${locale}/create/${lessonId}`,
  });
  if (!ALLOWED_ROLES.has(session.user.role)) {
    notFound();
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      review: true,
      steps: { orderBy: { sortOrder: "asc" } },
      course: {
        select: {
          id: true,
          isPublished: true,
          path: { select: { slug: true } },
        },
      },
    },
  });

  if (!lesson) notFound();

  const isAuthor = lesson.review?.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isAuthor && !isAdmin) notFound();

  const reviewStatus = lesson.review?.status ?? "PENDING";
  const editable = isAdmin || reviewStatus === "PENDING";

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: [{ path: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: {
      id: true,
      slug: true,
      title_de: true,
      title_en: true,
      path: { select: { slug: true, title_de: true, title_en: true } },
    },
  });

  const titleField = locale === "en" ? "title_en" : "title_de";
  const groups = new Map<
    string,
    { pathTitle: string; courses: { id: string; title: string }[] }
  >();
  for (const c of courses) {
    const key = c.path.slug;
    if (!groups.has(key)) {
      groups.set(key, { pathTitle: c.path[titleField], courses: [] });
    }
    groups.get(key)!.courses.push({ id: c.id, title: c[titleField] });
  }
  const courseGroups = Array.from(groups.values());

  const sanitizedSteps = lesson.steps
    .filter((s) => ALLOWED_STEP_KINDS.has(s.kind))
    .map((s) => ({
      kind: s.kind as "INTRO" | "EXPLAIN" | "BUILD" | "CODE_WALK" | "CELEBRATE",
      title_de: s.title_de ?? "",
      title_en: s.title_en ?? "",
      body_de: s.body_de ?? "",
      body_en: s.body_en ?? "",
    }));

  return (
    <div className="container py-10">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/create">
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("backToCreate")}
        </Link>
      </Button>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{t("editLesson")}</h1>
        <Badge
          tone={
            lesson.isPublished
              ? "success"
              : reviewStatus === "APPROVED"
                ? "info"
                : reviewStatus === "REJECTED"
                  ? "danger"
                  : "warn"
          }
        >
          {t(
            `status_${
              lesson.isPublished
                ? "published"
                : reviewStatus === "APPROVED"
                  ? "approved"
                  : reviewStatus === "REJECTED"
                    ? "rejected"
                    : "pending"
            }`,
          )}
        </Badge>
      </div>

      {!editable && (
        <Card className="mb-6 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-200" />
            <p>{t("readOnlyHint")}</p>
          </CardContent>
        </Card>
      )}
      {lesson.review?.reviewerNotes && reviewStatus === "REJECTED" && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-destructive">{t("reviewerNotes")}</p>
            <p className="mt-1">{lesson.review.reviewerNotes}</p>
          </CardContent>
        </Card>
      )}

      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        {t("wizardHint")}
      </p>

      {editable ? (
        <LessonWizard
          courseGroups={courseGroups}
          initial={{
            lessonId: lesson.id,
            courseId: lesson.courseId,
            title_de: lesson.title_de,
            title_en: lesson.title_en,
            summary_de: lesson.summary_de,
            summary_en: lesson.summary_en,
            estimatedMinutes: lesson.estimatedMinutes,
            xpReward: lesson.xpReward,
            steps: sanitizedSteps,
          }}
        />
      ) : (
        <ReadOnlyView
          lesson={{
            title_de: lesson.title_de,
            title_en: lesson.title_en,
            summary_de: lesson.summary_de,
            summary_en: lesson.summary_en,
          }}
          steps={sanitizedSteps}
        />
      )}
    </div>
  );
}

function ReadOnlyView({
  lesson,
  steps,
}: {
  lesson: {
    title_de: string;
    title_en: string;
    summary_de: string;
    summary_en: string;
  };
  steps: Array<{
    kind: string;
    title_de: string;
    title_en: string;
    body_de: string;
    body_en: string;
  }>;
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              DE
            </div>
            <div className="font-medium">{lesson.title_de}</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {lesson.summary_de}
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              EN
            </div>
            <div className="font-medium">{lesson.title_en}</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {lesson.summary_en}
            </p>
          </div>
        </CardContent>
      </Card>
      {steps.map((s, i) => (
        <Card key={i}>
          <CardContent className="grid gap-3 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold">#{i + 1}</span>
              <Badge>{s.kind}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="font-medium">{s.title_de || "—"}</div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {s.body_de || "—"}
                </p>
              </div>
              <div>
                <div className="font-medium">{s.title_en || "—"}</div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {s.body_en || "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
