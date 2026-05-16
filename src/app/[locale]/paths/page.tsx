import { getTranslations, setRequestLocale } from "next-intl/server";
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
import { Clock, BookOpen, Sparkles, GraduationCap } from "lucide-react";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/lib/utils";
import { auth } from "@/server/auth";
import {
  isPathOutOfReach,
  sortPathsByRelevance,
} from "@/lib/path-recommendation";
import { CurriculumFilterBar } from "@/components/curriculum/curriculum-filter-bar";

const LEVEL_LABEL: Record<string, { de: string; en: string }> = {
  L1_BEGINNER: { de: "Beginner", en: "Beginner" },
  L2_NOVICE: { de: "Einsteiger", en: "Novice" },
  L3_INTERMEDIATE: { de: "Fortgeschrittener", en: "Intermediate" },
  L4_EXPERT: { de: "Experte", en: "Expert" },
};

export default async function PathsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ state?: string; grade?: string }>;
}) {
  const { locale } = await params;
  const sp = (await searchParams) ?? {};
  setRequestLocale(locale);
  const t = await getTranslations("paths");
  const tc = await getTranslations("curriculum");
  const l = locale as Locale;

  const filterState = sp.state?.toUpperCase().trim() || null;
  const filterGrade =
    sp.grade && Number.isFinite(Number(sp.grade))
      ? Number.parseInt(sp.grade, 10)
      : null;

  const session = await auth();

  const [pathsRaw, profile, allStandards, matchPathIds] = await Promise.all([
    prisma.learningPath.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { courses: true } },
        courses: { include: { _count: { select: { lessons: true } } } },
      },
    }),
    session?.user?.id
      ? prisma.profile.findUnique({
          where: { userId: session.user.id },
          select: { currentLevel: true },
        })
      : Promise.resolve(null),
    prisma.curriculumStandard.findMany({
      select: { state: true, grade: true },
    }),
    filterState || filterGrade
      ? prisma.learningPath.findMany({
          where: {
            isPublished: true,
            courses: {
              some: {
                isPublished: true,
                lessons: {
                  some: {
                    isPublished: true,
                    curriculumLinks: {
                      some: {
                        standard: {
                          ...(filterState ? { state: filterState } : {}),
                          ...(filterGrade ? { grade: filterGrade } : {}),
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const userLevel = profile?.currentLevel ?? null;
  let paths = sortPathsByRelevance(pathsRaw, userLevel);
  const matchSet = matchPathIds ? new Set(matchPathIds.map((p) => p.id)) : null;
  if (matchSet) {
    paths = [
      ...paths.filter((p) => matchSet.has(p.id)),
      ...paths.filter((p) => !matchSet.has(p.id)),
    ];
  }

  const stateOptions = Array.from(
    new Set(allStandards.map((s) => s.state)),
  )
    .sort()
    .map((s) => ({ value: s, label: s }));
  const gradeOptions = Array.from(
    new Set(allStandards.map((s) => s.grade)),
  )
    .sort((a, b) => a - b)
    .map((g) => ({
      value: String(g),
      label: tc("gradeShort", { grade: g }),
    }));

  return (
    <div className="container py-12 md:py-16">
      <div className="mb-6 max-w-2xl">
        <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mb-8">
        <CurriculumFilterBar
          states={stateOptions}
          grades={gradeOptions}
          matchesCount={matchSet ? matchSet.size : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paths.map((p, idx) => {
          const matches = matchSet ? matchSet.has(p.id) : false;
          const lessonsCount = p.courses.reduce(
            (sum, c) => sum + c._count.lessons,
            0,
          );
          const isRecommended = userLevel && idx === 0;
          const outOfReach = isPathOutOfReach(p.level, userLevel);
          return (
            <Card
              key={p.id}
              className={`flex flex-col ${
                isRecommended
                  ? "border-primary shadow-md ring-2 ring-primary/20"
                  : ""
              } ${outOfReach ? "opacity-70" : ""}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs uppercase tracking-wide text-primary">
                    {LEVEL_LABEL[p.level]?.[l] ?? p.level}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {matches && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        <GraduationCap className="h-3 w-3" />
                        {tc("matchBadge")}
                      </span>
                    )}
                    {isRecommended && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                        <Sparkles className="h-3 w-3" />
                        {t("recommendedBadge")}
                      </span>
                    )}
                  </div>
                </div>
                <CardTitle className="mt-1 text-xl">
                  {pickLocalized(p, "title", l)}
                </CardTitle>
                <CardDescription>
                  {pickLocalized(p, "summary", l)}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {p.estimatedHours && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {t("estimated", { hours: p.estimatedHours })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {t("lessonsCount", { count: lessonsCount })}
                  </span>
                </div>
                {outOfReach && (
                  <p className="text-xs text-muted-foreground">
                    {t("outOfReachHint")}
                  </p>
                )}
                <Button
                  asChild
                  variant={isRecommended ? "default" : "outline"}
                  className="w-full"
                >
                  <Link href={`/paths/${p.slug}`}>{t("startPath")}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
