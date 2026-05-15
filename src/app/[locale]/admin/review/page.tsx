import { setRequestLocale } from "next-intl/server";
import { requireAdmin } from "@/server/lib/admin";
import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/admin/badge";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/lib/utils";
import { ShieldCheck, AlertTriangle, Sparkles } from "lucide-react";

export default async function ReviewQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();

  const reviews = await prisma.contentReview.findMany({
    where: { status: { in: ["PENDING", "AI_FLAGGED", "IN_REVIEW", "CHANGES_REQUESTED"] } },
    orderBy: { createdAt: "desc" },
    include: {
      lesson: true,
      scraped: { select: { source: true, sourceUrl: true } },
    },
    take: 50,
  });

  const l = locale as Locale;

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Content Review Queue</h1>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            ✨ Inbox ist leer.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((r) => {
            const title = r.lesson
              ? pickLocalized(r.lesson, "title", l)
              : "Untitled";
            const flags = (r.aiFlags as { severity: string }[] | null) ?? [];
            const blockers = flags.filter((f) => f.severity === "BLOCKER").length;
            const warns = flags.filter((f) => f.severity === "WARN").length;
            return (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>
                        <Link
                          href={`/admin/review/${r.id}`}
                          className="hover:underline"
                        >
                          {title}
                        </Link>
                      </CardTitle>
                      {r.scraped && (
                        <a
                          href={r.scraped.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-muted-foreground hover:underline"
                        >
                          {r.scraped.source} · {r.scraped.sourceUrl}
                        </a>
                      )}
                    </div>
                    <Badge tone={r.status === "AI_FLAGGED" ? "warn" : "default"}>
                      {r.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-4 text-sm">
                  {blockers > 0 && (
                    <span className="inline-flex items-center gap-1 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      {blockers} Blocker
                    </span>
                  )}
                  {warns > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      {warns} Warnungen
                    </span>
                  )}
                  {flags.length === 0 && (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <Sparkles className="h-4 w-4" />
                      KI-Check sauber
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
