import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/server/auth";
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
import { Flame, GraduationCap, Trophy, Cpu, ArrowRight, Sparkles } from "lucide-react";
import { levelToNumber } from "@/lib/assessment";
import { BoardSelector } from "@/components/dashboard/board-selector";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  const session = await auth();
  console.log("[dashboard] session?", {
    hasSession: Boolean(session),
    userId: session?.user?.id,
    role: session?.user?.role,
  });
  if (!session?.user?.id) redirect(`/${locale}/auth/sign-in`);

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
  const tA = await getTranslations("assessment");

  const name = user?.name ?? user?.username ?? "👋";
  const activePaths = user?.progress.filter((p) => p.path) ?? [];
  const isBeginnerMode = activePaths.length === 0 && totalXp === 0;
  const firstPath = paths[0] ?? null;

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

      {/* Beginner-Mode: prominenter Hero-CTA statt leerer KPIs */}
      {isBeginnerMode && firstPath ? (
        <Card className="mb-10 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardContent className="grid gap-4 p-8 md:p-10">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary">
              <Sparkles className="h-4 w-4" />
              {t("heroEyebrow")}
            </div>
            <h2 className="text-2xl font-bold md:text-3xl">
              {locale === "de" ? firstPath.title_de : firstPath.title_en}
            </h2>
            <p className="max-w-2xl text-base text-muted-foreground">
              {t("heroSubtitle")}
            </p>
            <div>
              <Button asChild size="lg" className="mt-2">
                <Link href={`/paths/${firstPath.slug}`}>
                  {t("heroCta")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Aktive Lerner: kompakte Stats-Leiste
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
