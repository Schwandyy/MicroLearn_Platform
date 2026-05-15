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
import { Clock, BookOpen } from "lucide-react";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/lib/utils";

const LEVEL_LABEL: Record<string, { de: string; en: string }> = {
  L1_BEGINNER: { de: "Beginner", en: "Beginner" },
  L2_NOVICE: { de: "Einsteiger", en: "Novice" },
  L3_INTERMEDIATE: { de: "Fortgeschrittener", en: "Intermediate" },
  L4_EXPERT: { de: "Experte", en: "Expert" },
};

export default async function PathsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("paths");
  const l = locale as Locale;

  const paths = await prisma.learningPath.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { courses: true } },
      courses: { include: { _count: { select: { lessons: true } } } },
    },
  });

  return (
    <div className="container py-12 md:py-16">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paths.map((p) => {
          const lessonsCount = p.courses.reduce(
            (sum, c) => sum + c._count.lessons,
            0,
          );
          return (
            <Card key={p.id} className="flex flex-col">
              <CardHeader>
                <div className="text-xs uppercase tracking-wide text-primary">
                  {LEVEL_LABEL[p.level]?.[l] ?? p.level}
                </div>
                <CardTitle className="mt-1 text-xl">
                  {pickLocalized(p, "title", l)}
                </CardTitle>
                <CardDescription>{pickLocalized(p, "summary", l)}</CardDescription>
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
                <Button asChild className="w-full">
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
