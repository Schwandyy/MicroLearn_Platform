"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sparkles, Cpu, Bot, X } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "microlearn.tour.v1";

interface Slide {
  icon: typeof Sparkles;
  titleKey: string;
  bodyKey: string;
}

const SLIDES: Slide[] = [
  { icon: Sparkles, titleKey: "tour1Title", bodyKey: "tour1Body" },
  { icon: Cpu, titleKey: "tour2Title", bodyKey: "tour2Body" },
  { icon: Bot, titleKey: "tour3Title", bodyKey: "tour3Body" },
];

export function OnboardingTour({ active }: { active: boolean }) {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) return;
    try {
      if (localStorage.getItem(KEY) === "done") return;
    } catch {
      return;
    }
    setOpen(true);
  }, [active]);

  const close = () => {
    try {
      localStorage.setItem(KEY, "done");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  const slide = SLIDES[step]!;
  const Icon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
        <button
          type="button"
          aria-label={t("tourSkip")}
          onClick={close}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{t(slide.titleKey)}</h2>
          <p className="text-sm text-muted-foreground">{t(slide.bodyKey)}</p>
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full transition",
                i === step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep(step - 1)}
            >
              {t("tourPrev")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={close}
            >
              {t("tourSkip")}
            </Button>
          )}
          <Button
            type="button"
            onClick={() => (isLast ? close() : setStep(step + 1))}
          >
            {isLast ? t("tourStart") : t("tourNext")}
          </Button>
        </div>
      </div>
    </div>
  );
}
