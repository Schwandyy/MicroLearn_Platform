"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GraduationCap, X } from "lucide-react";

type Option = { value: string; label: string };

export function CurriculumFilterBar({
  states,
  grades,
  matchesCount,
}: {
  states: Option[];
  grades: Option[];
  matchesCount?: number;
}) {
  const t = useTranslations("curriculum");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const state = params.get("state") ?? "";
  const grade = params.get("grade") ?? "";

  const apply = (next: { state?: string; grade?: string }) => {
    const sp = new URLSearchParams(params.toString());
    const s = next.state ?? state;
    const g = next.grade ?? grade;
    if (s) sp.set("state", s);
    else sp.delete("state");
    if (g) sp.set("grade", g);
    else sp.delete("grade");
    const qs = sp.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const reset = () => apply({ state: "", grade: "" });
  const hasFilter = Boolean(state || grade);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
      <GraduationCap className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">{t("filterByCurriculum")}</span>
      <select
        value={state}
        onChange={(e) => apply({ state: e.target.value })}
        disabled={isPending}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">{t("anyState")}</option>
        {states.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        value={grade}
        onChange={(e) => apply({ grade: e.target.value })}
        disabled={isPending}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">{t("anyGrade")}</option>
        {grades.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </select>
      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={isPending}
          className="h-9"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          {t("filterReset")}
        </Button>
      )}
      {hasFilter && typeof matchesCount === "number" && (
        <span className="ml-auto text-xs text-muted-foreground">
          {t("matchesFound", { count: matchesCount })}
        </span>
      )}
    </div>
  );
}
