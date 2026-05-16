import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/admin/badge";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle2,
  HelpCircle,
  UserPlus,
} from "lucide-react";
import type { TeacherActivityItem } from "@/server/lib/teacher-activity";

export async function TeacherActivityWidget({
  items,
  locale,
}: {
  items: TeacherActivityItem[];
  locale: string;
}) {
  const t = await getTranslations("dashboard");
  if (items.length === 0) return null;

  return (
    <Card className="mb-10">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          {t("teacherActivityTitle")}
        </CardTitle>
        <Button asChild size="sm" variant="ghost">
          <Link href="/classroom">{t("teacherActivityViewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {items.map((it, i) => {
            const when = formatWhen(it.at, locale);
            const content = (
              <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40">
                <KindIcon kind={it.kind} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {it.studentName}
                    </span>
                    <Badge>{it.classroomName}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {labelForKind(it, t)}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {when}
                </span>
              </div>
            );
            return (
              <li key={i}>
                {it.link ? <Link href={it.link as never}>{content}</Link> : content}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function KindIcon({ kind }: { kind: TeacherActivityItem["kind"] }) {
  const cls = "mt-0.5 h-4 w-4 shrink-0";
  if (kind === "completion") return <CheckCircle2 className={`${cls} text-emerald-500`} />;
  if (kind === "joined") return <UserPlus className={`${cls} text-sky-500`} />;
  return <HelpCircle className={`${cls} text-amber-500`} />;
}

function labelForKind(
  it: TeacherActivityItem,
  t: Awaited<ReturnType<typeof getTranslations<"dashboard">>>,
): string {
  if (it.kind === "completion") {
    return t("teacherActivityCompletion", { lesson: it.detail });
  }
  if (it.kind === "joined") return t("teacherActivityJoined");
  return t("teacherActivityQuiz", { detail: it.detail });
}

function formatWhen(date: Date, locale: string): string {
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return locale === "en" ? "now" : "jetzt";
  if (min < 60) return locale === "en" ? `${min}m` : `${min} Min.`;
  const hr = Math.round(min / 60);
  if (hr < 24) return locale === "en" ? `${hr}h` : `${hr} Std.`;
  const day = Math.round(hr / 24);
  if (day < 30) return locale === "en" ? `${day}d` : `${day} Tg.`;
  return date.toLocaleDateString(locale === "en" ? "en-US" : "de-DE");
}
