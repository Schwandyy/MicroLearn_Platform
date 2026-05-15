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
import { Check, Clock, Sparkles } from "lucide-react";
import type { Locale } from "@/lib/utils";

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
  if (session?.user?.id) {
    const progress = await prisma.userProgress.findMany({
      where: { userId: session.user.id, completedAt: { not: null } },
      select: { lessonId: true },
    });
    progress.forEach((p) => p.lessonId && completedIds.add(p.lessonId));
  }

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
