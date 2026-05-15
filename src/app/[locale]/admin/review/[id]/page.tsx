import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { requireAdmin } from "@/server/lib/admin";
import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/learning/markdown";
import { Badge } from "@/components/admin/badge";
import { ReviewActions } from "@/components/admin/review-actions";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/lib/utils";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin();

  const review = await prisma.contentReview.findUnique({
    where: { id },
    include: {
      lesson: {
        include: {
          recommendedBoards: true,
          bom: { include: { component: true, board: true } },
        },
      },
      scraped: true,
    },
  });
  if (!review?.lesson) notFound();
  const lesson = review.lesson;
  const l = locale as Locale;
  const flags = (review.aiFlags as {
    kind: string;
    severity: "INFO" | "WARN" | "BLOCKER";
    note_de: string;
    note_en: string;
  }[] | null) ?? [];

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Review: {pickLocalized(lesson, "title", l)}</h1>
        <Badge tone={review.status === "AI_FLAGGED" ? "warn" : "default"}>
          {review.status}
        </Badge>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-primary">
            KI-Vorab-Check
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {review.aiSummary_de && (
            <p className="text-sm">{review.aiSummary_de}</p>
          )}
          {flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Flags.</p>
          ) : (
            <ul className="grid gap-2">
              {flags.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-md border p-3"
                >
                  <Badge
                    tone={
                      f.severity === "BLOCKER"
                        ? "danger"
                        : f.severity === "WARN"
                          ? "warn"
                          : "default"
                    }
                  >
                    {f.severity}
                  </Badge>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {f.kind}
                    </div>
                    <div className="text-sm">{f.note_de}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-primary">
            Quelle
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {review.scraped ? (
            <a
              href={review.scraped.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {review.scraped.source} — {review.scraped.sourceUrl}
            </a>
          ) : (
            <span className="text-muted-foreground">Manuell erstellt</span>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>DE</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="mb-2 text-lg font-semibold">{lesson.title_de}</h2>
            <Markdown content={lesson.body_de} />
            {lesson.safetyNotes_de && (
              <div className="mt-4 rounded-lg border border-amber-300/60 bg-amber-50/40 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Sicherheit
                </div>
                <Markdown content={lesson.safetyNotes_de} />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>EN</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="mb-2 text-lg font-semibold">{lesson.title_en}</h2>
            <Markdown content={lesson.body_en} />
            {lesson.safetyNotes_en && (
              <div className="mt-4 rounded-lg border border-amber-300/60 bg-amber-50/40 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Safety
                </div>
                <Markdown content={lesson.safetyNotes_en} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {lesson.codeSnippet && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Code</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
              <code>{lesson.codeSnippet}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      <ReviewActions reviewId={review.id} lessonId={lesson.id} status={review.status} />
    </div>
  );
}
