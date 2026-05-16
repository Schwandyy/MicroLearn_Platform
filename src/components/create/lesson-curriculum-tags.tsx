"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Loader2, Plus, Sparkles, X } from "lucide-react";

type Standard = {
  id: string;
  state: string;
  grade: number;
  subject: string;
  code: string;
  title_de: string;
  title_en: string;
  description_de: string | null;
  description_en: string | null;
};

export function LessonCurriculumTags({
  lessonId,
  editable,
}: {
  lessonId: string;
  editable: boolean;
}) {
  const t = useTranslations("curriculum");
  const locale = useLocale();
  const { toast } = useToast();

  const [linked, setLinked] = useState<Standard[]>([]);
  const [all, setAll] = useState<Standard[]>([]);
  const [open, setOpen] = useState(false);
  const [filterState, setFilterState] = useState<string>("ALL");
  const [filterGrade, setFilterGrade] = useState<string>("ALL");
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isSaving, startSave] = useTransition();
  const [suggestions, setSuggestions] = useState<Array<{
    id: string;
    code: string;
    state: string;
    grade: number;
    title: string;
    reason: string;
    confidence: number;
  }>>([]);
  const [isSuggesting, startSuggest] = useTransition();

  useEffect(() => {
    let aborted = false;
    Promise.all([
      fetch(`/api/lessons/${lessonId}/curriculum`).then((r) => r.json()),
      fetch("/api/curriculum-standards").then((r) => r.json()),
    ])
      .then(([linkedRes, allRes]) => {
        if (aborted) return;
        const ls: Standard[] = linkedRes.standards ?? [];
        setLinked(ls);
        setAll(allRes.standards ?? []);
        setSelection(new Set(ls.map((s) => s.id)));
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [lessonId]);

  const states = useMemo(
    () => Array.from(new Set(all.map((s) => s.state))).sort(),
    [all],
  );
  const grades = useMemo(
    () => Array.from(new Set(all.map((s) => s.grade))).sort((a, b) => a - b),
    [all],
  );

  const filtered = useMemo(
    () =>
      all.filter(
        (s) =>
          (filterState === "ALL" || s.state === filterState) &&
          (filterGrade === "ALL" || String(s.grade) === filterGrade),
      ),
    [all, filterState, filterGrade],
  );

  const titleOf = (s: Standard) =>
    locale === "en" ? s.title_en : s.title_de;
  const descOf = (s: Standard) =>
    locale === "en" ? s.description_en : s.description_de;

  const toggle = (id: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = () => {
    startSave(async () => {
      const res = await fetch(`/api/lessons/${lessonId}/curriculum`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standardIds: Array.from(selection) }),
      });
      if (!res.ok) {
        toast({ title: t("saveError"), variant: "destructive" });
        return;
      }
      const ids = new Set(selection);
      setLinked(all.filter((s) => ids.has(s.id)));
      setOpen(false);
      toast({ title: t("saved") });
    });
  };

  const fetchSuggestions = () => {
    startSuggest(async () => {
      const params = new URLSearchParams();
      if (filterState !== "ALL") params.set("state", filterState);
      if (filterGrade !== "ALL") params.set("grade", filterGrade);
      params.set("locale", locale);
      const res = await fetch(
        `/api/lessons/${lessonId}/curriculum/suggest?${params.toString()}`,
      );
      if (!res.ok) {
        toast({ title: t("suggestError"), variant: "destructive" });
        return;
      }
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      if ((data.suggestions ?? []).length === 0) {
        toast({ title: t("suggestEmpty") });
      }
    });
  };

  const acceptSuggestion = (id: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const remove = (id: string) => {
    startSave(async () => {
      const next = new Set(selection);
      next.delete(id);
      const res = await fetch(`/api/lessons/${lessonId}/curriculum`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standardIds: Array.from(next) }),
      });
      if (!res.ok) {
        toast({ title: t("saveError"), variant: "destructive" });
        return;
      }
      setSelection(next);
      setLinked(linked.filter((s) => s.id !== id));
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4 text-primary" />
          {t("title")}
        </CardTitle>
        {editable && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                {t("manage")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("manageTitle")}</DialogTitle>
                <DialogDescription>{t("manageHint")}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2 pb-2">
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="ALL">{t("anyState")}</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="ALL">{t("anyGrade")}</option>
                  {grades.map((g) => (
                    <option key={g} value={String(g)}>
                      {t("gradeShort", { grade: g })}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto gap-1.5"
                  onClick={fetchSuggestions}
                  disabled={isSuggesting}
                  title={t("suggestHint")}
                >
                  {isSuggesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  )}
                  {t("suggest")}
                </Button>
              </div>

              {suggestions.length > 0 && (
                <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("suggestTitle")}
                  </div>
                  <ul className="space-y-2">
                    {suggestions.map((s) => {
                      const inSelection = selection.has(s.id);
                      return (
                        <li
                          key={s.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          <button
                            type="button"
                            onClick={() => acceptSuggestion(s.id)}
                            disabled={inSelection}
                            className="mt-0.5 rounded border bg-background px-2 py-0.5 text-xs font-medium hover:bg-primary hover:text-primary-foreground disabled:cursor-default disabled:opacity-60"
                          >
                            {inSelection ? t("suggestAdded") : t("suggestAdd")}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono font-semibold text-primary">
                                {s.state}
                              </span>
                              <span>{t("gradeShort", { grade: s.grade })}</span>
                              <span className="font-mono">{s.code}</span>
                              <span className="ml-auto rounded bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-700/30 dark:text-amber-200">
                                {Math.round(s.confidence * 100)}%
                              </span>
                            </div>
                            <div className="font-medium">{s.title}</div>
                            {s.reason && (
                              <p className="text-xs text-muted-foreground">
                                {s.reason}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="max-h-[55vh] overflow-y-auto rounded border">
                {filtered.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    {t("noMatches")}
                  </p>
                ) : (
                  <ul className="divide-y">
                    {filtered.map((s) => {
                      const checked = selection.has(s.id);
                      return (
                        <li
                          key={s.id}
                          className="flex items-start gap-3 p-3 hover:bg-muted/40"
                        >
                          <Checkbox
                            id={`std-${s.id}`}
                            checked={checked}
                            onCheckedChange={() => toggle(s.id)}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={`std-${s.id}`}
                            className="flex-1 cursor-pointer space-y-1"
                          >
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono font-semibold text-primary">
                                {s.state}
                              </span>
                              <span>·</span>
                              <span>{t("gradeShort", { grade: s.grade })}</span>
                              <span>·</span>
                              <span>{s.subject}</span>
                              <span className="font-mono">{s.code}</span>
                            </div>
                            <div className="text-sm font-medium">{titleOf(s)}</div>
                            {descOf(s) && (
                              <p className="text-xs text-muted-foreground">
                                {descOf(s)}
                              </p>
                            )}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSaving}
                >
                  {t("cancel")}
                </Button>
                <Button onClick={save} disabled={isSaving}>
                  {isSaving && (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  )}
                  {t("save")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : linked.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {linked.map((s) => (
              <li
                key={s.id}
                className="group inline-flex items-center gap-1.5 rounded-full border bg-muted/40 py-1 pl-2.5 pr-1.5 text-xs"
                title={titleOf(s)}
              >
                <span className="font-mono font-semibold text-primary">
                  {s.state}
                </span>
                <span className="text-muted-foreground">
                  {t("gradeShort", { grade: s.grade })}
                </span>
                <span className="max-w-[200px] truncate text-foreground">
                  {titleOf(s)}
                </span>
                {editable && (
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    aria-label={t("remove")}
                    disabled={isSaving}
                    className="rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
