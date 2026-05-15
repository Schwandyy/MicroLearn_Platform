import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/server/db/prisma";
import { auth } from "@/server/auth";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/learning/markdown";
import { WokwiEmbed } from "@/components/learning/wokwi-embed";
import { QuizPlayer } from "@/components/learning/quiz-player";
import { LessonCompleteButton } from "@/components/learning/lesson-complete-button";
import { Cpu, Clock, Trophy } from "lucide-react";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("lesson");
  const l = locale as Locale;

  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/auth/sign-in`);

  const lesson = await prisma.lesson.findUnique({
    where: { slug },
    include: {
      course: { include: { path: true } },
      recommendedBoards: true,
      bom: {
        include: { component: true, board: true, affiliateLink: { include: { program: true } } },
      },
      quizzes: true,
    },
  });
  if (!lesson || !lesson.isPublished) notFound();

  const progress = await prisma.userProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId: lesson.id } },
  });

  const miniQuiz = lesson.quizzes.find((q) => q.kind === "MINI") ?? null;
  const finalQuiz = lesson.quizzes.find((q) => q.kind === "LESSON_FINAL") ?? null;

  const safety = pickLocalized(lesson, "safetyNotes", l);
  const schematic = pickLocalized(lesson, "schematicNotes", l);

  return (
    <article className="container max-w-4xl py-10 md:py-14">
      <nav className="mb-6 text-sm text-muted-foreground">
        <a
          className="hover:underline"
          href={`/${locale}/paths/${lesson.course.path.slug}`}
        >
          ← {pickLocalized(lesson.course.path, "title", l)}
        </a>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">
          {pickLocalized(lesson, "title", l)}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-4 w-4 text-amber-500" />
            {t("xp", { xp: lesson.xpReward })}
          </span>
          {lesson.estimatedMinutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {t("duration", { min: lesson.estimatedMinutes })}
            </span>
          )}
          {lesson.recommendedBoards.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-4 w-4" />
              {lesson.recommendedBoards.map((b) => b.name).join(", ")}
            </span>
          )}
        </div>
      </header>

      <section className="mb-12">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
          {t("conceptHeading")}
        </h2>
        <Markdown className="mt-3" content={pickLocalized(lesson, "body", l)} />
      </section>

      {miniQuiz && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t("miniQuizHeading")}
          </h2>
          <QuizPlayer
            className="mt-3"
            quizId={miniQuiz.id}
            title={pickLocalized(miniQuiz, "title", l)}
            questions={miniQuiz.questions as never}
            locale={l}
          />
        </section>
      )}

      {lesson.bom.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t("bomHeading")}
          </h2>
          <Card className="mt-3">
            <CardContent className="pt-6">
              <ul className="grid gap-3">
                {lesson.bom.map((item) => {
                  const name =
                    item.component?.name ?? item.board?.name ?? "Component";
                  const note =
                    locale === "de" ? item.note_de : item.note_en;
                  const link = item.affiliateLink?.program?.isActive
                    ? item.affiliateLink.productUrl
                    : null;
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div>
                        <div className="font-medium">
                          {item.quantity}× {name}
                        </div>
                        {note && (
                          <div className="text-xs text-muted-foreground">
                            {note}
                          </div>
                        )}
                      </div>
                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="text-xs text-primary underline-offset-4 hover:underline"
                        >
                          {item.affiliateLink?.program.displayName} →
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      {schematic && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t("schematicHeading")}
          </h2>
          <Markdown className="mt-3" content={schematic} />
        </section>
      )}

      <section className="mb-12">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
          {t("projectHeading")}
        </h2>
        {lesson.wokwiProjectId ? (
          <WokwiEmbed className="mt-3" projectId={lesson.wokwiProjectId} />
        ) : (
          <Card className="mt-3">
            <CardContent className="py-6 text-sm text-muted-foreground">
              {t("noWokwi")}
            </CardContent>
          </Card>
        )}
        {lesson.codeSnippet && (
          <details className="mt-4 rounded-lg border bg-muted/30">
            <summary className="cursor-pointer p-3 text-sm font-medium">
              {t("codeHeading")}
            </summary>
            <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
              <code>{lesson.codeSnippet}</code>
            </pre>
          </details>
        )}
      </section>

      {safety && (
        <section className="mb-12">
          <Card className="border-amber-300/60 bg-amber-50/40 dark:bg-amber-900/20">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                {t("safetyHeading")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Markdown content={safety} />
            </CardContent>
          </Card>
        </section>
      )}

      {finalQuiz && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t("finalQuizHeading")}
          </h2>
          <QuizPlayer
            className="mt-3"
            quizId={finalQuiz.id}
            title={pickLocalized(finalQuiz, "title", l)}
            questions={finalQuiz.questions as never}
            locale={l}
          />
        </section>
      )}

      <section className="mt-12">
        <LessonCompleteButton
          lessonId={lesson.id}
          alreadyCompleted={Boolean(progress?.completedAt)}
        />
      </section>
    </article>
  );
}
