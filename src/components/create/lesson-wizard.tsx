"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/admin/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Cog,
  Code2,
  Lightbulb,
  PartyPopper,
  Send,
  Trash2,
} from "lucide-react";

type StepKind = "INTRO" | "EXPLAIN" | "BUILD" | "CODE_WALK" | "CELEBRATE";

interface DraftStep {
  uid: string;
  kind: StepKind;
  title_de: string;
  title_en: string;
  body_de: string;
  body_en: string;
}

interface CourseGroup {
  pathTitle: string;
  courses: { id: string; title: string }[];
}

const STEP_KINDS: Array<{
  kind: StepKind;
  icon: typeof BookOpen;
  hintKey:
    | "stepKindIntro"
    | "stepKindExplain"
    | "stepKindBuild"
    | "stepKindCodeWalk"
    | "stepKindCelebrate";
}> = [
  { kind: "INTRO", icon: Lightbulb, hintKey: "stepKindIntro" },
  { kind: "EXPLAIN", icon: BookOpen, hintKey: "stepKindExplain" },
  { kind: "BUILD", icon: Cog, hintKey: "stepKindBuild" },
  { kind: "CODE_WALK", icon: Code2, hintKey: "stepKindCodeWalk" },
  { kind: "CELEBRATE", icon: PartyPopper, hintKey: "stepKindCelebrate" },
];

let stepCounter = 0;
const nextUid = () => `s${++stepCounter}_${Date.now()}`;

interface WizardInitial {
  lessonId: string;
  courseId: string;
  title_de: string;
  title_en: string;
  summary_de: string;
  summary_en: string;
  estimatedMinutes: number | null;
  xpReward: number;
  steps: Array<{
    kind: StepKind;
    title_de: string;
    title_en: string;
    body_de: string;
    body_en: string;
  }>;
}

export function LessonWizard({
  courseGroups,
  initial,
}: {
  courseGroups: CourseGroup[];
  initial?: WizardInitial;
}) {
  const t = useTranslations("create");
  const tc = useTranslations("common");
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(initial);

  const [courseId, setCourseId] = useState(initial?.courseId ?? "");
  const [titleDe, setTitleDe] = useState(initial?.title_de ?? "");
  const [titleEn, setTitleEn] = useState(initial?.title_en ?? "");
  const [summaryDe, setSummaryDe] = useState(initial?.summary_de ?? "");
  const [summaryEn, setSummaryEn] = useState(initial?.summary_en ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initial?.estimatedMinutes != null ? String(initial.estimatedMinutes) : "45",
  );
  const [xpReward, setXpReward] = useState(
    initial?.xpReward != null ? String(initial.xpReward) : "50",
  );
  const [steps, setSteps] = useState<DraftStep[]>(
    initial?.steps && initial.steps.length > 0
      ? initial.steps.map((s) => ({ uid: nextUid(), ...s }))
      : [
          {
            uid: nextUid(),
            kind: "INTRO",
            title_de: "",
            title_en: "",
            body_de: "",
            body_en: "",
          },
        ],
  );

  const titleOk = titleDe.trim().length >= 3 && titleEn.trim().length >= 3;
  const summaryOk =
    summaryDe.trim().length >= 10 && summaryEn.trim().length >= 10;
  const canSubmit = Boolean(courseId) && titleOk && summaryOk;

  const addStep = (kind: StepKind) => {
    setSteps((prev) => [
      ...prev,
      {
        uid: nextUid(),
        kind,
        title_de: "",
        title_en: "",
        body_de: "",
        body_en: "",
      },
    ]);
  };

  const updateStep = (uid: string, patch: Partial<DraftStep>) => {
    setSteps((prev) => prev.map((s) => (s.uid === uid ? { ...s, ...patch } : s)));
  };

  const removeStep = (uid: string) => {
    setSteps((prev) => prev.filter((s) => s.uid !== uid));
  };

  const moveStep = (uid: string, dir: -1 | 1) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.uid === uid);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const a = next[idx]!;
      const b = next[target]!;
      next[idx] = b;
      next[target] = a;
      return next;
    });
  };

  const submit = () => {
    if (!canSubmit) {
      toast({ title: t("fillRequired"), variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const url = isEdit ? `/api/lessons/${initial!.lessonId}` : "/api/lessons";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title_de: titleDe.trim(),
          title_en: titleEn.trim(),
          summary_de: summaryDe.trim(),
          summary_en: summaryEn.trim(),
          estimatedMinutes: Number.parseInt(estimatedMinutes, 10) || 45,
          xpReward: Number.parseInt(xpReward, 10) || 50,
          steps: steps.map((s) => ({
            kind: s.kind,
            title_de: s.title_de.trim() || null,
            title_en: s.title_en.trim() || null,
            body_de: s.body_de.trim() || null,
            body_en: s.body_en.trim() || null,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast({
          title: data?.error ?? tc("error"),
          variant: "destructive",
        });
        return;
      }
      toast({ title: isEdit ? t("updated") : t("submitted") });
      router.push("/create");
    });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("sectionBasics")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {t("courseLabel")}
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t("coursePlaceholder")}</option>
              {courseGroups.map((g) => (
                <optgroup key={g.pathTitle} label={g.pathTitle}>
                  {g.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("titleDe")}
              </label>
              <Input
                value={titleDe}
                onChange={(e) => setTitleDe(e.target.value)}
                placeholder={"z. B. „LED zum Leuchten bringen“"}
                maxLength={120}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("titleEn")}
              </label>
              <Input
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder='e.g. "Light up your first LED"'
                maxLength={120}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("minutes")}
              </label>
              <Input
                type="number"
                min={5}
                max={240}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("xp")}
              </label>
              <Input
                type="number"
                min={0}
                max={500}
                step={10}
                value={xpReward}
                onChange={(e) => setXpReward(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("sectionSummary")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {t("summaryDe")}
            </label>
            <textarea
              value={summaryDe}
              onChange={(e) => setSummaryDe(e.target.value)}
              rows={3}
              maxLength={800}
              placeholder={t("summaryPlaceholderDe")}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {t("summaryEn")}
            </label>
            <textarea
              value={summaryEn}
              onChange={(e) => setSummaryEn(e.target.value)}
              rows={3}
              maxLength={800}
              placeholder={t("summaryPlaceholderEn")}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("sectionSteps")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">{t("stepsHint")}</p>
          {steps.map((s, i) => (
            <StepEditor
              key={s.uid}
              step={s}
              index={i}
              total={steps.length}
              onUpdate={(patch) => updateStep(s.uid, patch)}
              onRemove={() => removeStep(s.uid)}
              onMove={(dir) => moveStep(s.uid, dir)}
            />
          ))}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("addStep")}:
            </span>
            {STEP_KINDS.map(({ kind, icon: Icon, hintKey }) => (
              <Button
                key={kind}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addStep(kind)}
                title={t(hintKey)}
              >
                <Icon className="mr-2 h-3.5 w-3.5" />
                {t(`stepKind_${kind}`)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <p className="text-sm text-muted-foreground">{t("submitHint")}</p>
        <Button onClick={submit} disabled={!canSubmit || isPending}>
          <Send className="mr-2 h-4 w-4" />
          {isPending
            ? t("submitting")
            : isEdit
              ? t("saveChanges")
              : t("submitForReview")}
        </Button>
      </div>
    </div>
  );
}

function StepEditor({
  step,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: {
  step: DraftStep;
  index: number;
  total: number;
  onUpdate: (patch: Partial<DraftStep>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const t = useTranslations("create");
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {index + 1}
          </span>
          <Badge>{t(`stepKind_${step.kind}`)}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={t("moveUp")}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={t("moveDown")}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={t("removeStep")}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("titleDe")}
          </label>
          <Input
            value={step.title_de}
            onChange={(e) => onUpdate({ title_de: e.target.value })}
            maxLength={120}
            placeholder="optional"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("titleEn")}
          </label>
          <Input
            value={step.title_en}
            onChange={(e) => onUpdate({ title_en: e.target.value })}
            maxLength={120}
            placeholder="optional"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("bodyDe")}
          </label>
          <textarea
            value={step.body_de}
            onChange={(e) => onUpdate({ body_de: e.target.value })}
            rows={5}
            maxLength={8000}
            placeholder={t("bodyPlaceholderDe")}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("bodyEn")}
          </label>
          <textarea
            value={step.body_en}
            onChange={(e) => onUpdate({ body_en: e.target.value })}
            rows={5}
            maxLength={8000}
            placeholder={t("bodyPlaceholderEn")}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
    </div>
  );
}
