"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  ASSESSMENT_QUESTIONS,
  OPTION_KEYS,
  type AssessmentAnswers,
  type AssessmentQuestionKey,
  type OptionKey,
  scoreAssessment,
  levelToNumber,
} from "@/lib/assessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useToast } from "@/hooks/use-toast";

export function AssessmentWizard() {
  const t = useTranslations("assessment");
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [submitted, setSubmitted] = useState<{
    score: number;
    levelNumber: 1 | 2 | 3 | 4;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = ASSESSMENT_QUESTIONS.length;
  const currentKey = ASSESSMENT_QUESTIONS[step] as AssessmentQuestionKey;
  const progressPct = useMemo(
    () => Math.round(((step + 1) / total) * 100),
    [step, total],
  );

  const setAnswer = (val: OptionKey) =>
    setAnswers((prev) => ({ ...prev, [currentKey]: val }));

  const onNext = () => {
    if (!answers[currentKey]) return;
    if (step < total - 1) setStep(step + 1);
    else submit();
  };

  const submit = () => {
    const { score, level } = scoreAssessment(answers);
    startTransition(async () => {
      try {
        const res = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, score, level }),
        });
        if (!res.ok && res.status !== 401) throw new Error("save_failed");
      } catch {
        // non-blocking: result is still shown to the user
        toast({
          title: t("resultTitle", { level: t(`resultLevel.${levelToNumber(level)}`) }),
          description: "Result saved locally.",
        });
      }
      setSubmitted({ score, levelNumber: levelToNumber(level) });
    });
  };

  if (submitted) {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm uppercase tracking-wide">Result</span>
          </div>
          <CardTitle className="text-3xl">
            {t("resultTitle", {
              level: t(`resultLevel.${submitted.levelNumber}`),
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div>
            <div className="text-sm text-muted-foreground">Score</div>
            <div className="text-4xl font-bold">{submitted.score} / 100</div>
            <Progress className="mt-3" value={submitted.score} />
          </div>
          <Button onClick={() => router.push("/dashboard")} disabled={isPending}>
            {t("resultCta")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
          <span>{t("question", { current: step + 1, total })}</span>
          <span>{progressPct}%</span>
        </div>
        <Progress className="mt-2" value={progressPct} />
        <CardTitle className="mt-4 text-2xl">
          {t(`questions.${currentKey}.title`)}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <RadioGroup
          value={answers[currentKey] ?? ""}
          onValueChange={(v) => setAnswer(v as OptionKey)}
          className="grid gap-3"
        >
          {OPTION_KEYS.map((key) => {
            const id = `${currentKey}-${key}`;
            return (
              <label
                key={key}
                htmlFor={id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 transition hover:border-primary"
              >
                <RadioGroupItem value={key} id={id} className="mt-1" />
                <Label htmlFor={id} className="cursor-pointer text-base font-normal">
                  {t(`questions.${currentKey}.options.${key}`)}
                </Label>
              </label>
            );
          })}
        </RadioGroup>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back")}
          </Button>
          <Button
            type="button"
            onClick={onNext}
            disabled={!answers[currentKey] || isPending}
          >
            {step === total - 1 ? t("finish") : t("next")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
