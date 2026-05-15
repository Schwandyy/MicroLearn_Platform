"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "@/i18n/routing";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Trophy,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadboard } from "./breadboard-svg";
import { MiniSimulator } from "./mini-simulator";
import { CodeWalkthrough } from "./code-walkthrough";
import { BomCards, type BomItemView } from "./bom-cards";

export type StepKind =
  | "INTRO"
  | "PARTS"
  | "SAFETY"
  | "BUILD"
  | "CODE_WALK"
  | "SIMULATE"
  | "QUIZ"
  | "CELEBRATE"
  | "EXPLAIN";

export interface StepView {
  id: string;
  kind: StepKind;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
}

export function StepPlayer({
  lessonId,
  lessonTitle,
  lessonSummary,
  steps,
  bom,
  safetyNotes,
  xpReward,
  locale,
  alreadyCompleted,
}: {
  lessonId: string;
  lessonTitle: string;
  lessonSummary: string;
  steps: StepView[];
  bom: BomItemView[];
  safetyNotes: string | null;
  xpReward: number;
  locale: "de" | "en";
  alreadyCompleted: boolean;
}) {
  const t = useTranslations("lesson");
  const router = useRouter();
  const { toast } = useToast();
  const [stepIndex, setStepIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const total = steps.length;
  const current = steps[stepIndex];

  const goNext = () => {
    if (stepIndex < total - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    // Last step → complete lesson
    if (alreadyCompleted) {
      router.push("/dashboard");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        toast({ title: "Error", variant: "destructive" });
        return;
      }
      router.push("/dashboard");
    });
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const progressPct = Math.round(((stepIndex + 1) / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="border-b px-4 py-3">
        <div className="container flex items-center gap-4">
          <button
            type="button"
            aria-label="exit"
            onClick={() => router.push("/dashboard")}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <Progress value={progressPct} className="h-3 flex-1" />
          <span className="hidden text-xs text-muted-foreground md:inline">
            {t("step", { current: stepIndex + 1, total })}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-2xl py-8">
          {!current ? (
            <p>—</p>
          ) : (
            <StepBody
              step={current}
              lessonTitle={lessonTitle}
              lessonSummary={lessonSummary}
              bom={bom}
              safetyNotes={safetyNotes}
              xpReward={xpReward}
              locale={locale}
            />
          )}
        </div>
      </main>

      <footer className="border-t bg-card px-4 py-4">
        <div className="container flex max-w-2xl items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={stepIndex === 0 || isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back")}
          </Button>
          <NextButton
            stepKind={current?.kind ?? "INTRO"}
            isLast={stepIndex === total - 1}
            isPending={isPending}
            onClick={goNext}
            stepPayload={current?.payload ?? null}
          />
        </div>
      </footer>
    </div>
  );
}

function StepBody({
  step,
  lessonTitle,
  lessonSummary,
  bom,
  safetyNotes,
  xpReward,
  locale,
}: {
  step: StepView;
  lessonTitle: string;
  lessonSummary: string;
  bom: BomItemView[];
  safetyNotes: string | null;
  xpReward: number;
  locale: "de" | "en";
}) {
  const t = useTranslations("lesson");
  const payload = step.payload ?? {};

  switch (step.kind) {
    case "INTRO":
      return (
        <div className="space-y-6 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold md:text-4xl">{lessonTitle}</h1>
          <p className="text-lg text-muted-foreground">{lessonSummary}</p>
          {step.body && <p className="text-base">{step.body}</p>}
        </div>
      );
    case "PARTS":
      return (
        <div className="space-y-5">
          <header className="text-center">
            <h2 className="text-2xl font-bold">{t("youNeed")}</h2>
            {step.body && (
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            )}
          </header>
          <BomCards items={bom} />
        </div>
      );
    case "SAFETY":
      return (
        <div className="space-y-6">
          <Card className="border-amber-400 bg-amber-50/60 dark:bg-amber-900/20">
            <CardContent className="grid gap-3 p-6">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-xl font-bold">{t("safetyFirst")}</h2>
              </div>
              <p className="text-base leading-relaxed">{step.body}</p>
              {safetyNotes && (
                <p className="rounded-md bg-amber-100/60 p-3 text-sm leading-relaxed dark:bg-amber-900/30">
                  {safetyNotes}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    case "BUILD": {
      const instruction =
        ((payload as Record<string, unknown>)[
          `instruction_${locale}`
        ] as string | undefined) ?? step.body;
      return (
        <div className="space-y-6">
          <header>
            <h2 className="text-2xl font-bold">{step.title || t("buildIt")}</h2>
            {step.body && (
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            )}
          </header>
          <Breadboard
            ledColor={(payload as { ledColor?: "red" | "green" | "yellow" | "blue" }).ledColor ?? "red"}
            highlightWires={
              ((payload as { highlightWires?: ("3v3" | "gnd" | "signal")[] })
                .highlightWires) ?? []
            }
          />
          {instruction && (
            <Card>
              <CardContent className="p-4">
                <p className="text-base leading-relaxed">👉 {instruction}</p>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }
    case "CODE_WALK": {
      const code = (payload as { code?: string }).code ?? "";
      const lines =
        ((payload as { lines?: Array<{
          from: number;
          to: number;
          explain_de: string;
          explain_en: string;
        }> }).lines) ?? [];
      return (
        <div className="space-y-5">
          <header>
            <h2 className="text-2xl font-bold">
              {step.title || t("understandCode")}
            </h2>
            {step.body && (
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            )}
          </header>
          <CodeWalkthrough code={code} lines={lines} locale={locale} />
        </div>
      );
    }
    case "SIMULATE":
      return (
        <div className="space-y-5">
          <header>
            <h2 className="text-2xl font-bold">{step.title || t("whatHappens")}</h2>
            {step.body && (
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            )}
          </header>
          <MiniSimulator
            payload={payload as Record<string, never>}
            locale={locale}
          />
        </div>
      );
    case "QUIZ":
      return <QuizStep payload={payload} body={step.body} title={step.title} locale={locale} />;
    case "CELEBRATE":
      return (
        <div className="space-y-6 py-10 text-center">
          <Trophy className="mx-auto h-16 w-16 text-amber-500" />
          <h1 className="text-3xl font-bold">{t("celebrateTitle")}</h1>
          <p className="text-lg text-muted-foreground">
            {t("celebrateBody", {
              xp: ((payload as { xpAward?: number }).xpAward) ?? xpReward,
            })}
          </p>
        </div>
      );
    case "EXPLAIN":
      return (
        <div className="space-y-5">
          <header>
            <h2 className="text-2xl font-bold">{step.title}</h2>
          </header>
          <Card>
            <CardContent className="p-6">
              <p className="text-base leading-relaxed">{step.body}</p>
              {(payload as { keyPoint_de?: string; keyPoint_en?: string })[
                `keyPoint_${locale}`
              ] && (
                <p className="mt-3 rounded-md bg-primary/10 p-3 text-sm font-medium">
                  💡{" "}
                  {(payload as Record<string, string>)[`keyPoint_${locale}`]}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
  }
}

function QuizStep({
  payload,
  title,
  body,
  locale,
}: {
  payload: Record<string, unknown>;
  title: string;
  body: string;
  locale: "de" | "en";
}) {
  const t = useTranslations("lesson");
  const [answer, setAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const prompt =
    (payload[`prompt_${locale}`] as string | undefined) ?? body ?? "";
  const options =
    (payload.options as
      | Array<{ key: string; label_de: string; label_en: string }>
      | undefined) ?? [];
  const correctKey = payload.correctKey as string | undefined;
  const isCorrect = submitted && answer === correctKey;
  const isWrong = submitted && answer !== correctKey;

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold">{title || t("quizPrompt")}</h2>
      </header>
      <Card>
        <CardContent className="grid gap-4 p-6">
          <p className="text-base font-medium">{prompt}</p>
          <RadioGroup
            value={answer ?? ""}
            onValueChange={(v) => {
              if (!submitted) setAnswer(v);
            }}
            className="grid gap-3"
          >
            {options.map((o) => {
              const id = `quiz-${o.key}`;
              const label = locale === "de" ? o.label_de : o.label_en;
              return (
                <label
                  key={o.key}
                  htmlFor={id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                    submitted && o.key === correctKey && "border-emerald-500 bg-emerald-50/60",
                    submitted && answer === o.key && o.key !== correctKey && "border-destructive bg-destructive/10",
                    !submitted && "hover:border-primary",
                  )}
                >
                  <RadioGroupItem value={o.key} id={id} className="mt-1" disabled={submitted} />
                  <Label htmlFor={id} className="cursor-pointer text-base font-normal">
                    {label}
                  </Label>
                </label>
              );
            })}
          </RadioGroup>

          {!submitted ? (
            <Button
              type="button"
              disabled={!answer}
              onClick={() => setSubmitted(true)}
            >
              {t("checkAnswer")}
            </Button>
          ) : isCorrect ? (
            <p className="rounded-md bg-emerald-50/60 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
              ✓ {t("correct")}
            </p>
          ) : isWrong ? (
            <div className="grid gap-2">
              <p className="rounded-md bg-destructive/10 p-3 text-sm font-semibold text-destructive">
                ✗ {t("wrong")}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAnswer(null);
                  setSubmitted(false);
                }}
              >
                {t("tryAgain")}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function NextButton({
  stepKind,
  isLast,
  isPending,
  onClick,
  stepPayload,
}: {
  stepKind: StepKind;
  isLast: boolean;
  isPending: boolean;
  onClick: () => void;
  stepPayload: Record<string, unknown> | null;
}) {
  const t = useTranslations("lesson");
  // For Quiz steps, we let the quiz UI handle correctness — Next still works.
  void stepPayload;
  const label = isLast
    ? t("finish")
    : stepKind === "INTRO"
      ? t("letsGo")
      : t("next");
  return (
    <Button type="button" onClick={onClick} disabled={isPending} size="lg">
      {label}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  );
}
