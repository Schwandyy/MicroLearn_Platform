"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/admin/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  CircleDashed,
  CircleAlert,
  ExternalLink,
  FileDown,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

type Checklist = {
  bom: boolean;
  schematic: boolean;
  codeCompiles: boolean;
  flashOk: boolean;
  expectedResult: boolean;
  quizAnswers: boolean;
  notes?: string | null;
};

type Item = {
  id: string;
  slug: string;
  title: string;
  courseTitle: string;
  courseSlug: string;
  bomCount: number;
  stepCount: number;
  estimatedMinutes: number | null;
  verifiedAt: string | null;
  lastAttemptAt: string | null;
  lastAttemptPassed: boolean | null;
  checklist: Record<string, boolean | string | null> | null;
};

type Filter = "all" | "pending" | "verified" | "untouched";

function status(item: Item): "verified" | "pending" | "untouched" {
  if (item.verifiedAt) return "verified";
  if (item.lastAttemptAt) return "pending";
  return "untouched";
}

function StatusBadge({ s, t }: { s: ReturnType<typeof status>; t: ReturnType<typeof useTranslations> }) {
  if (s === "verified") {
    return (
      <Badge tone="success">
        <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
        {t("statusVerified")}
      </Badge>
    );
  }
  if (s === "pending") {
    return (
      <Badge tone="warn">
        <CircleAlert className="mr-1 inline h-3.5 w-3.5" />
        {t("statusPending")}
      </Badge>
    );
  }
  return (
    <Badge tone="default">
      <CircleDashed className="mr-1 inline h-3.5 w-3.5" />
      {t("statusUntouched")}
    </Badge>
  );
}

const checklistKeys: Array<keyof Omit<Checklist, "notes">> = [
  "bom",
  "schematic",
  "codeCompiles",
  "flashOk",
  "expectedResult",
  "quizAnswers",
];

function emptyChecklist(): Checklist {
  return {
    bom: false,
    schematic: false,
    codeCompiles: false,
    flashOk: false,
    expectedResult: false,
    quizAnswers: false,
    notes: "",
  };
}

function checklistFromRecord(rec: Record<string, boolean | string | null> | null): Checklist {
  const empty = emptyChecklist();
  if (!rec) return empty;
  return {
    bom: Boolean(rec.bom),
    schematic: Boolean(rec.schematic),
    codeCompiles: Boolean(rec.codeCompiles),
    flashOk: Boolean(rec.flashOk),
    expectedResult: Boolean(rec.expectedResult),
    quizAnswers: Boolean(rec.quizAnswers),
    notes: typeof rec.notes === "string" ? rec.notes : "",
  };
}

export function HardwareVerificationCockpit({
  items,
  locale,
}: {
  items: Item[];
  locale: "de" | "en";
}) {
  const t = useTranslations("AdminHardwareVerification");
  const [filter, setFilter] = useState<Filter>("pending");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => status(i) === filter);
  }, [items, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("filter")}</span>
        {(["pending", "untouched", "verified", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 transition ${
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-primary/50"
            }`}
          >
            {t(`filter_${f}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          {t("emptyFiltered")}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((item) => {
            const s = status(item);
            const isOpen = openId === item.id;
            return (
              <li
                key={item.id}
                className="overflow-hidden rounded-xl border bg-card"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{item.title}</span>
                      <StatusBadge s={s} t={t} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {item.courseTitle && <span>{item.courseTitle}</span>}
                      <span>
                        {item.bomCount} {t("metaBom")} · {item.stepCount} {t("metaSteps")}
                        {item.estimatedMinutes ? ` · ~${item.estimatedMinutes} ${t("metaMinutes")}` : ""}
                      </span>
                      {item.verifiedAt && (
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {t("verifiedOn", {
                            date: new Date(item.verifiedAt).toLocaleDateString(locale),
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && <ChecklistPanel item={item} locale={locale} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ChecklistPanel({ item, locale }: { item: Item; locale: "de" | "en" }) {
  const t = useTranslations("AdminHardwareVerification");
  const tc = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();
  const [list, setList] = useState<Checklist>(checklistFromRecord(item.checklist));
  const [isPending, startTransition] = useTransition();

  const allPassed = checklistKeys.every((k) => list[k]);

  const toggle = (k: keyof Omit<Checklist, "notes">) =>
    setList((prev) => ({ ...prev, [k]: !prev[k] }));

  const submit = () => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/lessons/${item.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: list }),
      });
      if (!res.ok) {
        toast({
          title: tc("error"),
          description: await res.text().catch(() => undefined),
          variant: "destructive",
        });
        return;
      }
      const data = (await res.json().catch(() => null)) as { passed?: boolean } | null;
      toast({
        title: data?.passed ? t("toastVerified") : t("toastSavedPartial"),
      });
      router.refresh();
    });
  };

  const reset = () => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/lessons/${item.id}/verify`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      setList(emptyChecklist());
      toast({ title: t("toastReset") });
      router.refresh();
    });
  };

  return (
    <div className="border-t bg-muted/20 p-4 sm:p-5">
      <ul className="grid gap-2 sm:grid-cols-2">
        {checklistKeys.map((key) => (
          <li key={key} className="flex items-start gap-3 rounded-lg border bg-card p-3">
            <Checkbox
              id={`${item.id}-${key}`}
              checked={list[key]}
              onCheckedChange={() => toggle(key)}
              className="mt-0.5"
            />
            <label
              htmlFor={`${item.id}-${key}`}
              className="text-sm leading-snug cursor-pointer"
            >
              <div className="font-medium">{t(`check_${key}_label`)}</div>
              <div className="text-xs text-muted-foreground">
                {t(`check_${key}_hint`)}
              </div>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <Label htmlFor={`${item.id}-notes`} className="text-xs">
          {t("notesLabel")}
        </Label>
        <Input
          id={`${item.id}-notes`}
          value={list.notes ?? ""}
          onChange={(e) => setList({ ...list, notes: e.target.value })}
          placeholder={t("notesPlaceholder")}
          className="mt-1"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/admin/lessons/${item.id}/build-guide?locale=${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted"
          >
            <FileDown className="h-4 w-4" />
            {t("downloadBuildGuide")}
          </a>
          <a
            href={`/${locale}/lessons/${item.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" />
            {t("openLesson")}
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.verifiedAt && (
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              disabled={isPending}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              {t("resetVerification")}
            </Button>
          )}
          <Button onClick={submit} disabled={isPending}>
            <CheckCircle2 className="mr-1 h-4 w-4" />
            {allPassed ? t("submitVerified") : t("submitPartial")}
          </Button>
        </div>
      </div>
    </div>
  );
}
