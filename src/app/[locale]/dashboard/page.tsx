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
import { Flame, GraduationCap, Trophy, Cpu, ArrowRight } from "lucide-react";
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

  return (
    <div className="container py-10 md:py-14">
      <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">
            {t("welcome", { name })}
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/assessment">
            {lastAssessment ? t("retakeAssessment") : t("takeAssessment")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("yourLevel")}
            </CardTitle>
            <GraduationCap className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {tA(`resultLevel.${levelNum}`)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("xp")}
            </CardTitle>
            <Trophy className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalXp.toLocaleString(locale)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("streak")}
            </CardTitle>
            <Flame className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {t("streakDays", { days: streak?.currentDays ?? 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-12">
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
                      {locale === "de" ? p.path.summary_de : p.path.summary_en}
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
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <p>{t("noPaths")}</p>
              {paths.length > 0 && (
                <Button asChild className="mt-4">
                  <Link href={`/paths/${paths[0]!.slug}`}>
                    {locale === "de" ? paths[0]!.title_de : paths[0]!.title_en}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("myBoards")}</h2>
          <Cpu className="h-5 w-5 text-muted-foreground" />
        </div>
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
