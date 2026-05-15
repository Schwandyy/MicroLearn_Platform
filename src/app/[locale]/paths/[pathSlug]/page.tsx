import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/server/db/prisma";
import { auth } from "@/server/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n-content";
import {
  ArrowRight,
  Award,
  Check,
  Clock,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Locale } from "@/lib/utils";
import {
  isPathOutOfReach,
  pickRecommendedPath,
} from "@/lib/path-recommendation";

export default async function PathDetailPage({
  params,
}: {
  params: Promise<{ locale: string; pathSlug: string }>;
}) {
  const { locale, pathSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("paths");
  const tL = await getTranslations("lesson");
  const l = locale as Locale;

  const path = await prisma.learningPath.findUnique({
    where: { slug: pathSlug },
    include: {
      courses: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
  if (!path || !path.isPublished) notFound();

  const session = await auth();
  const completedIds = new Set<string>();
  let userLevel: typeof path.level | null = null;
  let recommendedAlt: { slug: string; title_de: string; title_en: string } | null = null;
  let certificate: { publicSlug: string } | null = null;
  if (session?.user?.id) {
    const [progress, profile, cert] = await Promise.all([
      prisma.userProgress.findMany({
        where: { userId: session.user.id, completedAt: { not: null } },
        select: { lessonId: true },
      }),
      prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { currentLevel: true },
      }),
      prisma.certificate.findUnique({
        where: { userId_pathId: { userId: session.user.id, pathId: path.id } },
        select: { publicSlug: true },
      }),
    ]);
    progress.forEach((p) => p.lessonId && completedIds.add(p.lessonId));
    userLevel = profile?.currentLevel ?? null;
    certificate = cert;
    if (userLevel && isPathOutOfReach(path.level, userLevel)) {
      const all = await prisma.learningPath.findMany({
        where: { isPublished: true, slug: { not: path.slug } },
        select: {
          slug: true,
          level: true,
          sortOrder: true,
          title_de: true,
          title_en: true,
        },
      });
      const rec = pickRecommendedPath(all, userLevel);
      if (rec) recommendedAlt = rec;
    }
  }
  const isOutOfReach = !!userLevel && isPathOutOfReach(path.level, userLevel);

  // Pfad-Fortschritt berechnen
  const allPathLessons = path.courses.flatMap((c) => c.lessons);
  const totalLessons = allPathLessons.length;
  const doneLessons = allPathLessons.filter((l) =>
    completedIds.has(l.id),
  ).length;
  const percent =
    totalLessons === 0
      ? 0
      : Math.round((doneLessons / totalLessons) * 100);

  return (
    <div className="container py-10 md:py-14">
      <Link
        href="/paths"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← {t("title")}
      </Link>
      <header className="mt-4 max-w-3xl">
        <h1 className="text-3xl font-bold md:text-4xl">
          {pickLocalized(path, "title", l)}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {pickLocalized(path, "summary", l)}
        </p>
        {path.estimatedHours && (
          <div className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {t("estimated", { hours: path.estimatedHours })}
          </div>
        )}
      </header>

      {isOutOfReach && (
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/60 dark:bg-amber-900/15">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <div className="font-semibold">{t("outOfReachBannerTitle")}</div>
              <p className="text-sm text-muted-foreground">
                {recommendedAlt
                  ? t("outOfReachBannerWithSuggestion", {
                      pathTitle:
                        l === "de"
                          ? recommendedAlt.title_de
                          : recommendedAlt.title_en,
                    })
                  : t("outOfReachBannerGeneric")}
              </p>
            </div>
          </div>
          {recommendedAlt && (
            <Button asChild>
              <Link href={`/paths/${recommendedAlt.slug}`}>
                {t("outOfReachBannerCta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      )}

      {session?.user?.id && totalLessons > 0 && (
        <Card className="mt-8 border-primary/30 bg-primary/5">
          <CardContent className="grid gap-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-sm font-semibold uppercase tracking-wide text-primary">
                {t("progressTitle")}
              </div>
              {certificate && (
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/certificates/${certificate.publicSlug}`}>
                    <Award className="mr-1.5 h-4 w-4 text-amber-500" />
                    {t("viewCertificate")}
                  </Link>
                </Button>
              )}
            </div>
            <Progress value={percent} className="h-3" />
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-muted-foreground">
              <span>{t("progressDone", { done: doneLessons, total: totalLessons })}</span>
              <span className="font-semibold text-foreground">
                {certificate
                  ? t("certEarned")
                  : t("progressPercent", { percent })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-10 space-y-6">
        {path.courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle>{pickLocalized(course, "title", l)}</CardTitle>
              <CardDescription>
                {pickLocalized(course, "summary", l)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {course.lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                course.lessons.map((lesson) => {
                  const done = completedIds.has(lesson.id);
                  return (
                    <Link
                      key={lesson.id}
                      href={`/lessons/${lesson.slug}`}
                      className="group flex items-center justify-between rounded-lg border p-4 transition hover:border-primary"
                    >
                      <div className="flex items-center gap-3">
                        {done ? (
                          <Check className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium">
                            {pickLocalized(lesson, "title", l)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tL("xp", { xp: lesson.xpReward })}
                            {lesson.estimatedMinutes
                              ? ` · ${tL("duration", { min: lesson.estimatedMinutes })}`
                              : ""}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        →
                      </Button>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
