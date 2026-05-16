"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CircleHelp, Check, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const POLL_INTERVAL_MS = 60_000;

interface HelpRequest {
  id: string;
  studentName: string;
  lessonId: string;
  lessonSlug: string;
  lessonTitle_de: string;
  lessonTitle_en: string;
  classroomId: string | null;
  classroomName: string | null;
  source: "AUTO_STUCK" | "STUDENT_RAISED";
  message: string | null;
  createdAt: string;
  ageMinutes: number;
}

export function HelpRequestStrip({
  initialRequests,
}: {
  initialRequests: HelpRequest[];
}) {
  const t = useTranslations("help");
  const tc = useTranslations("common");
  const locale = useLocale() as "de" | "en";
  const { toast } = useToast();
  const [requests, setRequests] = useState(initialRequests);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch(`/api/help-requests?locale=${locale}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { requests: HelpRequest[] };
        setRequests(data.requests ?? []);
      } catch {
        // best-effort polling
      }
    };
    const timer = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [locale]);

  if (requests.length === 0) return null;

  const resolve = (id: string) => {
    setResolvingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/help-requests/${id}/resolve`, {
          method: "POST",
        });
        if (!res.ok) {
          toast({ title: tc("error"), variant: "destructive" });
          return;
        }
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } catch {
        toast({ title: tc("error"), variant: "destructive" });
      } finally {
        setResolvingId(null);
      }
    });
  };

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border-2 border-amber-400 bg-amber-50/80 shadow-sm dark:border-amber-600 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 border-b border-amber-300 bg-amber-100 px-4 py-2 text-amber-900 dark:border-amber-700 dark:bg-amber-900/60 dark:text-amber-100">
        <CircleHelp className="h-4 w-4 animate-pulse" />
        <span className="text-sm font-semibold">
          {t("stripTitle", { count: requests.length })}
        </span>
      </div>
      <ul className="divide-y divide-amber-200 dark:divide-amber-800">
        {requests.map((r) => {
          const title = locale === "en" ? r.lessonTitle_en : r.lessonTitle_de;
          const sourceLabel = r.source === "STUDENT_RAISED"
            ? t("sourceStudent")
            : t("sourceAuto");
          return (
            <li
              key={r.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="grid gap-0.5">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <span>{r.studentName}</span>
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                    {sourceLabel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("stripRow", {
                    title,
                    classroom: r.classroomName ?? t("noClassroom"),
                  })}
                </p>
                {r.message && (
                  <p className="text-xs italic text-amber-800 dark:text-amber-200">
                    &ldquo;{r.message}&rdquo;
                  </p>
                )}
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {t("ageMin", { num: r.ageMinutes })}
                </div>
              </div>
              <Button
                size="sm"
                variant="default"
                onClick={() => resolve(r.id)}
                disabled={isPending && resolvingId === r.id}
              >
                {isPending && resolvingId === r.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Check className="mr-1 h-3 w-3" />
                )}
                {t("resolve")}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
