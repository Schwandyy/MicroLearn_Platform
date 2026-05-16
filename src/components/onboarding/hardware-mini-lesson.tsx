"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, Lightbulb, Cable, Cpu } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Cpu,
    titleKey: "step1Title",
    bodyKey: "step1Body",
    hintKey: "step1Hint",
  },
  {
    icon: Cable,
    titleKey: "step2Title",
    bodyKey: "step2Body",
    hintKey: "step2Hint",
  },
  {
    icon: Lightbulb,
    titleKey: "step3Title",
    bodyKey: "step3Body",
    hintKey: "step3Hint",
  },
] as const;

export function HardwareMiniLesson({
  onCompleted,
}: {
  onCompleted: () => void;
}) {
  const t = useTranslations("starter.hardware");
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState<boolean[]>([false, false, false]);

  const isLast = current === STEPS.length - 1;
  const completedAll = done.every(Boolean);

  const advance = () => {
    setDone((d) => {
      const next = [...d];
      next[current] = true;
      return next;
    });
    if (isLast) {
      onCompleted();
    } else {
      setCurrent((c) => Math.min(STEPS.length - 1, c + 1));
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition",
              i === current
                ? "bg-primary text-primary-foreground"
                : done[i]
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {done[i] ? (
              <Check className="mr-1 inline h-3 w-3" />
            ) : (
              <span className="mr-1 font-bold">{i + 1}</span>
            )}
            {t(`tab${i + 1}`)}
          </button>
        ))}
      </div>

      {STEPS.map((step, i) => {
        if (i !== current) return null;
        const Icon = step.icon;
        return (
          <div key={i} className="grid gap-4 rounded-2xl border bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("stepLabel", { current: i + 1, total: STEPS.length })}
                </div>
                <div className="text-lg font-semibold">{t(step.titleKey)}</div>
              </div>
            </div>
            <p className="text-sm text-foreground">{t(step.bodyKey)}</p>
            <div className="rounded-xl border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
              {t(step.hintKey)}
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={advance}>
                {isLast
                  ? completedAll
                    ? t("doneAgain")
                    : t("ledShinesCta")
                  : t("nextCta")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
