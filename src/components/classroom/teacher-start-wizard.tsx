"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  GraduationCap,
  CalendarClock,
  Pencil,
  CheckCircle2,
  BookOpenCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Stage = "intro" | "config" | "loading" | "review" | "creating";

interface MatchedStandard {
  id: string;
  code: string;
  state: string;
  grade: number;
  subject: string;
  title: string;
}

interface SuggestedLesson {
  lessonId: string;
  lessonSlug: string;
  title_de: string;
  title_en: string;
  summary_de: string;
  summary_en: string;
  estimatedMinutes: number | null;
  weekIndex: number;
  dueAt: string;
  matchedStandards: MatchedStandard[];
  curriculumReason: string | null;
}

interface Suggestion {
  classroomName: string;
  state: string | null;
  grade: number | null;
  level: string;
  lessons: SuggestedLesson[];
  aiRanked: boolean;
}

const STATE_OPTIONS: Array<{ code: string; label: string; country: "DE" | "AT" | "CH" }> = [
  { code: "BW", label: "Baden-Württemberg", country: "DE" },
  { code: "BY", label: "Bayern", country: "DE" },
  { code: "NRW", label: "Nordrhein-Westfalen", country: "DE" },
  { code: "HE", label: "Hessen", country: "DE" },
  { code: "SN", label: "Sachsen", country: "DE" },
  { code: "NI", label: "Niedersachsen", country: "DE" },
  { code: "RP", label: "Rheinland-Pfalz", country: "DE" },
  { code: "SH", label: "Schleswig-Holstein", country: "DE" },
  { code: "BE", label: "Berlin", country: "DE" },
  { code: "HH", label: "Hamburg", country: "DE" },
  { code: "BB", label: "Brandenburg", country: "DE" },
  { code: "ST", label: "Sachsen-Anhalt", country: "DE" },
  { code: "MV", label: "Mecklenburg-Vorpommern", country: "DE" },
  { code: "TH", label: "Thüringen", country: "DE" },
  { code: "SL", label: "Saarland", country: "DE" },
  { code: "HB", label: "Bremen", country: "DE" },
  { code: "AT", label: "Österreich", country: "AT" },
  { code: "CH", label: "Schweiz (LP21)", country: "CH" },
];

export function TeacherStartWizard() {
  const t = useTranslations("teacherWizard");
  const tc = useTranslations("common");
  const locale = useLocale() as "de" | "en";
  const router = useRouter();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("intro");
  const [state, setState] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [classroomName, setClassroomName] = useState("");
  const [dueDates, setDueDates] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const stageIndex = stage === "intro" ? 1 : stage === "config" ? 2 : stage === "review" ? 3 : 4;
  const pct = (stageIndex / 4) * 100;

  const fetchPreview = () => {
    startTransition(async () => {
      setStage("loading");
      try {
        const res = await fetch("/api/onboarding/teacher-wizard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "preview",
            state: state || null,
            grade: grade ? Number.parseInt(grade, 10) : null,
            locale,
          }),
        });
        if (!res.ok) {
          toast({ title: tc("error"), variant: "destructive" });
          setStage("config");
          return;
        }
        const data = (await res.json()) as Suggestion;
        setSuggestion(data);
        setClassroomName(data.classroomName);
        setDueDates(
          data.lessons.map((l) => l.dueAt.slice(0, 10)),
        );
        setStage("review");
      } catch {
        toast({ title: tc("error"), variant: "destructive" });
        setStage("config");
      }
    });
  };

  const confirm = () => {
    if (!suggestion) return;
    startTransition(async () => {
      setStage("creating");
      try {
        const res = await fetch("/api/onboarding/teacher-wizard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "confirm",
            state: suggestion.state,
            grade: suggestion.grade,
            classroomName: classroomName.trim() || suggestion.classroomName,
            note: note.trim() || null,
            lessons: suggestion.lessons.map((l, i) => ({
              lessonId: l.lessonId,
              dueAt: dueDates[i]
                ? new Date(dueDates[i] + "T00:00:00.000Z").toISOString()
                : null,
            })),
          }),
        });
        if (!res.ok) {
          toast({ title: tc("error"), variant: "destructive" });
          setStage("review");
          return;
        }
        const data = (await res.json()) as { classroomId: string };
        router.push(`/classroom/${data.classroomId}`);
        router.refresh();
      } catch {
        toast({ title: tc("error"), variant: "destructive" });
        setStage("review");
      }
    });
  };

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="grid gap-6 p-6 md:p-8">
        <div className="grid gap-1">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
            <span>{t("step", { current: stageIndex, total: 4 })}</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        {stage === "intro" && (
          <div className="grid gap-5">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary">
              <Sparkles className="h-4 w-4" />
              {t("introEyebrow")}
            </div>
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              {t("introTitle")}
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              {t("introBody")}
            </p>
            <ul className="grid gap-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  1
                </span>
                {t("introBullet1")}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  2
                </span>
                {t("introBullet2")}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  3
                </span>
                {t("introBullet3")}
              </li>
            </ul>
            <Button size="lg" onClick={() => setStage("config")} className="w-fit">
              {t("introCta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {stage === "config" && (
          <div className="grid gap-5">
            <h2 className="text-2xl font-bold">{t("configTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("configBody")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="ts-state">{t("configState")}</Label>
                <select
                  id="ts-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">{t("configStatePlaceholder")}</option>
                  <optgroup label="Deutschland">
                    {STATE_OPTIONS.filter((o) => o.country === "DE").map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.label} ({o.code})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Österreich">
                    {STATE_OPTIONS.filter((o) => o.country === "AT").map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Schweiz">
                    {STATE_OPTIONS.filter((o) => o.country === "CH").map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ts-grade">{t("configGrade")}</Label>
                <Input
                  id="ts-grade"
                  type="number"
                  min={1}
                  max={13}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder={t("configGradePlaceholder")}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setStage("intro")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {tc("back")}
              </Button>
              <Button onClick={fetchPreview} disabled={isPending}>
                {t("configCta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {stage === "loading" && (
          <div className="grid gap-3 py-10 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          </div>
        )}

        {stage === "review" && suggestion && (
          <div className="grid gap-5">
            <div className="grid gap-1">
              <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary">
                <GraduationCap className="h-4 w-4" />
                {t("reviewEyebrow")}
              </div>
              <h2 className="text-2xl font-bold">{t("reviewTitle")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("reviewBody")}
              </p>
              {suggestion.aiRanked && (
                <p className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3 w-3" />
                  {t("reviewAiBadge")}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="ts-name">{t("reviewClassroomName")}</Label>
              <Input
                id="ts-name"
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
                maxLength={120}
              />
            </div>

            <div className="grid gap-3">
              {suggestion.lessons.length === 0 ? (
                <p className="rounded-xl border border-amber-300 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                  {t("reviewEmpty")}
                </p>
              ) : (
                suggestion.lessons.map((lesson, i) => (
                  <div
                    key={lesson.lessonId}
                    className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-start"
                  >
                    <div className="grid gap-1.5">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("week", { num: i + 1 })}
                      </div>
                      <div className="font-semibold">
                        {locale === "de" ? lesson.title_de : lesson.title_en}
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {locale === "de" ? lesson.summary_de : lesson.summary_en}
                      </p>
                      {lesson.matchedStandards.length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <BookOpenCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          {lesson.matchedStandards.map((s) => (
                            <span
                              key={s.id}
                              title={`${s.title} (${s.subject}, ${t("grade", { num: s.grade })})`}
                              className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            >
                              {s.code}
                            </span>
                          ))}
                        </div>
                      )}
                      {lesson.curriculumReason && (
                        <p className="mt-0.5 text-xs italic text-muted-foreground">
                          &ldquo;{lesson.curriculumReason}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="grid gap-1">
                      <Label
                        htmlFor={`ts-due-${i}`}
                        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        <CalendarClock className="h-3 w-3" />
                        {t("reviewDueLabel")}
                      </Label>
                      <Input
                        id={`ts-due-${i}`}
                        type="date"
                        value={dueDates[i] ?? ""}
                        onChange={(e) =>
                          setDueDates((prev) => {
                            const next = [...prev];
                            next[i] = e.target.value;
                            return next;
                          })
                        }
                        className="h-9 w-[150px]"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="ts-note">{t("reviewNoteLabel")}</Label>
              <textarea
                id="ts-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={t("reviewNotePlaceholder")}
                className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setStage("config")}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("reviewEditConfig")}
              </Button>
              <Button
                onClick={confirm}
                disabled={isPending || suggestion.lessons.length === 0}
              >
                {t("reviewCta")}
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {stage === "creating" && (
          <div className="grid gap-3 py-10 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("creating")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
