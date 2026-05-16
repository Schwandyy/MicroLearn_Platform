import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/server/db/prisma";
import { Link } from "@/i18n/routing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/admin/badge";
import {
  CheckCircle2,
  Compass,
  FileText,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";

const ALLOWED_ROLES = new Set(["TEACHER", "INSTRUCTOR", "ADMIN"]);

export default async function CreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("create");

  const session = await requireSession({
    locale,
    callbackPath: `/${locale}/create`,
  });

  if (!ALLOWED_ROLES.has(session.user.role)) {
    return (
      <div className="container py-16">
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("needsRole")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href="mailto:hello@microlearn.dev">{t("contactUs")}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reviews = await prisma.contentReview.findMany({
    where: { authorId: session.user.id, lessonId: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 12,
    include: {
      lesson: {
        select: {
          id: true,
          slug: true,
          title_de: true,
          title_en: true,
          isPublished: true,
          publishedAt: true,
          updatedAt: true,
        },
      },
    },
  });

  const titleField = locale === "en" ? "title_en" : "title_de";

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-start gap-3">
        <Sparkles className="mt-1 h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">{t("howItWorks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-4 sm:grid-cols-4">
            {[
              { icon: Compass, key: "stageIdea" as const },
              { icon: FileText, key: "stageDraft" as const },
              { icon: Pencil, key: "stageReview" as const },
              { icon: CheckCircle2, key: "stagePublish" as const },
            ].map(({ icon: Icon, key }, i) => (
              <li
                key={key}
                className="grid gap-2 rounded-md border bg-card p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="font-medium">{t(`${key}Title`)}</div>
                <p className="text-xs text-muted-foreground">
                  {t(`${key}Body`)}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("yourLessons")}</h2>
        <Button asChild>
          <Link href="/create/new">
            <Plus className="mr-2 h-4 w-4" /> {t("newLesson")}
          </Link>
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("emptyDrafts")}
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {reviews
            .filter((r) => r.lesson !== null)
            .map((r) => {
              const l = r.lesson!;
              const status = l.isPublished
                ? "published"
                : r.status === "APPROVED"
                  ? "approved"
                  : r.status === "REJECTED"
                    ? "rejected"
                    : "pending";
              return (
                <li key={r.id}>
                  <Link
                    href={`/create/${l.id}`}
                    className="group flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-4 transition-colors hover:bg-muted/40"
                  >
                  <div className="min-w-0">
                    <div className="font-medium">{l[titleField]}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t("updatedAt", {
                        date: new Date(l.updatedAt).toLocaleDateString(),
                      })}
                    </div>
                    {r.reviewerNotes && status === "rejected" && (
                      <p className="mt-2 max-w-prose text-sm text-destructive">
                        {r.reviewerNotes}
                      </p>
                    )}
                  </div>
                  <Badge
                    tone={
                      status === "published"
                        ? "success"
                        : status === "rejected"
                          ? "danger"
                          : status === "approved"
                            ? "info"
                            : "warn"
                    }
                  >
                    {t(`status_${status}`)}
                  </Badge>
                  </Link>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
