"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/utils";

export interface QuizQuestion {
  id: string;
  prompt_de: string;
  prompt_en: string;
  options: { key: string; label_de: string; label_en: string }[];
  correctKey: string;
  weight?: number;
}

export function QuizPlayer({
  quizId,
  questions,
  title,
  locale,
  className,
}: {
  quizId: string;
  questions: QuizQuestion[];
  title: string;
  locale: Locale;
  className?: string;
}) {
  const t = useTranslations("lesson");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const allAnswered = questions.every((q) => answers[q.id]);

  const submit = () => {
    startTransition(async () => {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const body = await res.json().catch(() => ({}));
      if (typeof body.score === "number") {
        setResult({ score: body.score, passed: Boolean(body.passed) });
      }
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {questions.map((q, qi) => {
          const prompt = locale === "de" ? q.prompt_de : q.prompt_en;
          return (
            <div key={q.id} className="grid gap-3">
              <div className="font-medium">
                {qi + 1}. {prompt}
              </div>
              <RadioGroup
                value={answers[q.id] ?? ""}
                onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}
              >
                {q.options.map((o) => {
                  const id = `${q.id}-${o.key}`;
                  const label = locale === "de" ? o.label_de : o.label_en;
                  const showCorrect =
                    result !== null && o.key === q.correctKey;
                  const showWrong =
                    result !== null &&
                    answers[q.id] === o.key &&
                    o.key !== q.correctKey;
                  return (
                    <label
                      key={o.key}
                      htmlFor={id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition",
                        showCorrect && "border-emerald-500 bg-emerald-50/30",
                        showWrong && "border-destructive bg-destructive/5",
                        !result && "hover:border-primary",
                      )}
                    >
                      <RadioGroupItem
                        value={o.key}
                        id={id}
                        className="mt-1"
                        disabled={result !== null}
                      />
                      <Label htmlFor={id} className="cursor-pointer font-normal">
                        {label}
                      </Label>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>
          );
        })}

        {result ? (
          <div className="grid gap-3">
            <Progress value={result.score} />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("score", { score: result.score })}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  result.passed ? "text-emerald-600" : "text-destructive",
                )}
              >
                {result.passed ? t("quizPassed") : t("quizFailed")}
              </span>
            </div>
            {!result.passed && (
              <Button
                variant="outline"
                onClick={() => {
                  setAnswers({});
                  setResult(null);
                }}
              >
                {t("submitQuiz")}
              </Button>
            )}
          </div>
        ) : (
          <Button onClick={submit} disabled={!allAnswered || isPending}>
            {t("submitQuiz")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
