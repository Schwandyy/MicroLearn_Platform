import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/server/db/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import {
  Flame,
  GraduationCap,
  Trophy,
  Cpu,
  ArrowRight,
  Sparkles,
  Clock,
  Wand2,
} from "lucide-react";
import { levelToNumber } from "@/lib/assessment";
import { pickRecommendedPath } from "@/lib/path-recommendation";
import { BoardSelector } from "@/components/dashboard/board-selector";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  const session = await requireSession({
    locale,
    callbackPath: `/${locale}/dashboard`,
  });

  const [user, xpAgg, streak, paths, allBoards, lastAssessment] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true, progress: { include: { path: true } } },
      }),
      prisma.xPTransaction.aggregate({
        _sum: { amount: true },
        where: { userId: session.user.id },
      }),
      prisma.streak.findUnique({ where: { userId: session.user.id } }),
      prisma.learningPath.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        take: 6,
      }),
      prisma.board.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.assessmentResult.findFirst({
        where: { userId: session.user.id },
        orderBy: { takenAt: "desc" },
      }),
    ]);

  const totalXp = xpAgg._sum.amount ?? 0;
  const levelNum = user?.profile?.currentLevel
    ? levelToNumber(user.profile.currentLevel)
    : 1;
  const favoriteBoardIds = user?.profile?.favoriteBoardIds ?? [];

  // Welche Lessons passen zu den gewählten Boards? Many-to-many filtern.
  const recommendedLessons =
    favoriteBoardIds.length > 0
      ? await prisma.lesson.findMany({
          where: {
            isPublished: true,
            recommendedBoards: { some: { id: { in: favoriteBoardIds } } },
          },
          include: {
            recommendedBoards: { select: { id: true, name: true } },
            progress: {
              where: { userId: session.user.id },
              select: { completedAt: true },
              take: 1,
            },
          },
          orderBy: { sortOrder: "asc" },
          take: 12,
        })
      : [];

  // Namen der ausgewählten Boards (für Überschrift)
  const favoriteBoards = allBoards.filter((b) =>
    favoriteBoardIds.includes(b.id),
  );
  const tA = await getTranslations("assessment");

  const name = user?.name ?? user?.username ?? "👋";
  const activePaths = user?.progress.filter((p) => p.path) ?? [];
  const isBeginnerMode = activePaths.length === 0 && totalXp === 0;

  // Hero-Pfad: aktiver Pfad (Progress) sonst empfohlener (Level-Match)
  const activePath = activePaths.find((p) => p.path)?.path ?? null;
  const recommendedPath = pickRecommendedPath(
    paths,
    user?.profile?.currentLevel,
  );
  const heroPath = activePath ?? recommendedPath;

  // Nächste offene Lesson im Hero-Pfad finden (deep-link statt Pfad-Übersicht)
  const nextLesson = heroPath
    ? await prisma.lesson
        .findMany({
          where: {
            isPublished: true,
            course: { pathId: heroPath.id },
          },
          select: {
            id: true,
            slug: true,
            title_de: true,
            title_en: true,
            estimatedMinutes: true,
            sortOrder: true,
            course: { select: { sortOrder: true } },
            progress: {
              where: { userId: session.user.id },
              select: { completedAt: true },
              take: 1,
            },
          },
          orderBy: [{ course: { sortOrder: "asc" } }, { sortOrder: "asc" }],
        })
        .then(
          (ls) =>
            ls.find((l) => !l.progress[0]?.completedAt) ?? ls[0] ?? null,
        )
    : null;

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <h1 className="text-3xl font-bold md:text-4xl">
          {t("welcome", { name })}
        </h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/assessment">
            {lastAssessment ? t("retakeAssessment") : t("takeAssessment")}
          </Link>
        </Button>
      </div>

      {/* Hero: aktiver Pfad (Progress) oder empfohlener (Level-Match).
          Verlinkt direkt auf die nächste offene Lesson statt auf die Pfad-Übersicht. */}
      {heroPath && (
        <Card className="mb-10 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardContent className="grid gap-4 p-8 md:p-10">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary">
              <Sparkles className="h-4 w-4" />
              {activePath ? t("heroContinueEyebrow") : t("heroEyebrow")}
            </div>
            <h2 className="text-2xl font-bold md:text-3xl">
              {locale === "de" ? heroPath.title_de : heroPath.title_en}
            </h2>
            {nextLesson && (
              <p className="text-sm text-muted-foreground">
                {t("heroNextLesson")}{" "}
                <span className="font-medium text-foreground">
                  {locale === "de" ? nextLesson.title_de : nextLesson.title_en}
                </span>
                {nextLesson.estimatedMinutes ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {t("duration", { min: nextLesson.estimatedMinutes })}
                  </span>
                ) : null}
              </p>
            )}
            <p className="max-w-2xl text-base text-muted-foreground">
              {locale === "de"
                ? heroPath.summary_de
                : heroPath.summary_en}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="mt-2">
                <Link
                  href={
                    nextLesson
                      ? `/lessons/${nextLesson.slug}`
                      : `/paths/${heroPath.slug}`
                  }
                >
                  {activePath ? t("heroContinueCta") : t("heroCta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="mt-2">
                <Link href={`/paths/${heroPath.slug}`}>
                  {t("heroPathOverview")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats — bei aktiven Lernern unter dem Hero */}
      {!isBeginnerMode && (
        <div className="mb-10 grid grid-cols-3 gap-3 rounded-xl border bg-card p-3 md:gap-4 md:p-4">
          <StatTile
            icon={<GraduationCap className="h-4 w-4 text-primary" />}
            label={t("yourLevel")}
            value={tA(`resultLevel.${levelNum}`)}
          />
          <StatTile
            icon={<Trophy className="h-4 w-4 text-amber-500" />}
            label={t("xp")}
            value={totalXp.toLocaleString(locale)}
          />
          <StatTile
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            label={t("streak")}
            value={t("streakDays", { days: streak?.currentDays ?? 0 })}
          />
        </div>
      )}

      {!isBeginnerMode && (
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("myPaths")}</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/paths">
                {t("browseAll")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {activePaths.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {activePaths.map((p) =>
                p.path ? (
                  <Card key={p.id}>
                    <CardHeader>
                      <CardTitle>
                        {locale === "de" ? p.path.title_de : p.path.title_en}
                      </CardTitle>
                      <CardDescription>
                        {locale === "de"
                          ? p.path.summary_de
                          : p.path.summary_en}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild size="sm">
                        <Link href={`/paths/${p.path.slug}`}>
                          {t("continueLearning")}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : null,
              )}
            </div>
          ) : null}
        </section>
      )}

      <section className="mt-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("myBoards")}</h2>
          <Cpu className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          {t("boardSelectorHint")}
        </p>
        <Card>
          <CardContent className="pt-6">
            {allBoards.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noBoards")}</p>
            ) : (
              <BoardSelector
                boards={allBoards.map((b) => ({
                  id: b.id,
                  name: b.name,
                  family: b.family,
                }))}
                initialSelected={favoriteBoardIds}
              />
            )}
          </CardContent>
        </Card>
      </section>

      {favoriteBoards.length > 0 && (
        <section className="mt-10">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary">
            <Wand2 className="h-4 w-4" />
            {t("recommendedEyebrow")}
          </div>
          <h2 className="mb-1 text-xl font-semibold">
            {t("recommendedTitle", {
              boards: favoriteBoards.map((b) => b.name).join(", "),
            })}
          </h2>
          <p className="mb-5 text-sm text-muted-foreground">
            {recommendedLessons.length === 0
              ? t("recommendedEmpty")
              : t("recommendedSubtitle", { count: recommendedLessons.length })}
          </p>

          {recommendedLessons.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recommendedLessons.map((lesson) => {
                const done = lesson.progress[0]?.completedAt != null;
                return (
                  <Card
                    key={lesson.id}
                    className={
                      done
                        ? "border-emerald-300 bg-emerald-50/30 dark:bg-emerald-900/10"
                        : undefined
                    }
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-snug">
                          {locale === "de"
                            ? lesson.title_de
                            : lesson.title_en}
                        </CardTitle>
                        {done && (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                            ✓
                          </span>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2 leading-snug">
                        {locale === "de"
                          ? lesson.summary_de
                          : lesson.summary_en}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-2 pt-0">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {lesson.estimatedMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t("duration", { min: lesson.estimatedMinutes })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {t("xp", { xp: lesson.xpReward })}
                        </span>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/lessons/${lesson.slug}`}>
                          {done ? t("recommendedReplay") : t("recommendedStart")}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 px-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold md:text-2xl">{value}</div>
    </div>
  );
}
