"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Cpu,
  HelpCircle,
  MonitorPlay,
  Sparkles,
  Trophy,
  Flame,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LedBlinkSimulator } from "./led-blink-simulator";
import { HardwareMiniLesson } from "./hardware-mini-lesson";

type Mode = "hardware" | "simulator";
type Stage = "intro" | "choose" | "doing" | "celebrate";

const LOCAL_KEY = "microlearn.starter.v1";

export function StarterFlow({
  alreadyCompleted,
}: {
  alreadyCompleted: boolean;
}) {
  const t = useTranslations("starter");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>(alreadyCompleted ? "celebrate" : "intro");
  const [mode, setMode] = useState<Mode>("simulator");
  const [result, setResult] = useState<{
    xpAwarded: number;
    streakDays: number;
    firstRun: boolean;
  } | null>(alreadyCompleted ? { xpAwarded: 0, streakDays: 1, firstRun: false } : null);

  const finishStarter = async (selectedMode: Mode) => {
    try {
      const res = await fetch("/api/onboarding/starter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selectedMode }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          xpAwarded: number;
          streakDays: number;
          firstRun: boolean;
        };
        setResult(data);
      } else {
        setResult({ xpAwarded: 25, streakDays: 1, firstRun: true });
      }
    } catch {
      setResult({ xpAwarded: 25, streakDays: 1, firstRun: true });
    }
    try {
      localStorage.setItem(LOCAL_KEY, "done");
    } catch {
      // ignore
    }
    setStage("celebrate");
  };

  const goAssessment = () => router.push("/assessment");
  const goDashboard = () => router.push("/dashboard");

  return (
    <div className="container max-w-3xl py-10 md:py-16">
      <StageHeader stage={stage} />

      {stage === "intro" && (
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardContent className="grid gap-6 p-8 md:p-10">
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
              <li className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  1
                </span>
                {t("introBullet1")}
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  2
                </span>
                {t("introBullet2")}
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  3
                </span>
                {t("introBullet3")}
              </li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => setStage("choose")}>
                {t("introCta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => {
                  try {
                    localStorage.setItem(LOCAL_KEY, "skipped");
                  } catch {
                    // ignore
                  }
                  goDashboard();
                }}
              >
                {t("introSkip")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {stage === "choose" && (
        <div className="grid gap-4">
          <h2 className="text-2xl font-bold md:text-3xl">
            {t("chooseTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("chooseBody")}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <ChoiceCard
              icon={Cpu}
              title={t("chooseHardwareTitle")}
              body={t("chooseHardwareBody")}
              badge={t("chooseHardwareBadge")}
              selected={mode === "hardware"}
              onClick={() => setMode("hardware")}
            />
            <ChoiceCard
              icon={MonitorPlay}
              title={t("chooseSimulatorTitle")}
              body={t("chooseSimulatorBody")}
              badge={t("chooseSimulatorBadge")}
              selected={mode === "simulator"}
              onClick={() => setMode("simulator")}
            />
          </div>
          <details className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            <summary className="flex cursor-pointer items-center gap-2 text-foreground">
              <HelpCircle className="h-4 w-4" />
              {t("chooseUnsureTitle")}
            </summary>
            <p className="mt-2">{t("chooseUnsureBody")}</p>
          </details>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStage("intro")}>
              {t("back")}
            </Button>
            <Button onClick={() => setStage("doing")}>
              {t("chooseCta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {stage === "doing" && (
        <div className="grid gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold md:text-3xl">
              {mode === "hardware" ? t("doingHardwareTitle") : t("doingSimulatorTitle")}
            </h2>
            <button
              type="button"
              onClick={() => setStage("choose")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("switchMode")}
            </button>
          </div>
          {mode === "hardware" ? (
            <HardwareMiniLesson onCompleted={() => finishStarter("hardware")} />
          ) : (
            <LedBlinkSimulator onCompleted={() => finishStarter("simulator")} />
          )}
        </div>
      )}

      {stage === "celebrate" && result && (
        <CelebrateStage
          result={result}
          locale={locale}
          onAssessment={goAssessment}
          onDashboard={goDashboard}
          onToast={() => {
            if (result.firstRun && result.streakDays >= 1) {
              toast({
                title: t("celebrate.toastTitle"),
                description: t("celebrate.toastBody"),
              });
            }
          }}
        />
      )}
    </div>
  );
}

function StageHeader({ stage }: { stage: Stage }) {
  const stageIndex = stage === "intro"
    ? 1
    : stage === "choose"
      ? 2
      : stage === "doing"
        ? 3
        : 4;
  const pct = (stageIndex / 4) * 100;
  return (
    <div className="mb-8 grid gap-1">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>Phase {stageIndex} / 4</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

function ChoiceCard({
  icon: Icon,
  title,
  body,
  badge,
  selected,
  onClick,
}: {
  icon: typeof Cpu;
  title: string;
  body: string;
  badge: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group grid gap-3 rounded-2xl border bg-card p-5 text-left transition",
        selected
          ? "border-primary ring-2 ring-primary/40"
          : "hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="rounded-full bg-primary/10 p-3 transition group-hover:bg-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {badge}
        </span>
      </div>
      <div>
        <div className="text-lg font-semibold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </button>
  );
}

function CelebrateStage({
  result,
  locale,
  onAssessment,
  onDashboard,
  onToast,
}: {
  result: { xpAwarded: number; streakDays: number; firstRun: boolean };
  locale: string;
  onAssessment: () => void;
  onDashboard: () => void;
  onToast: () => void;
}) {
  const t = useTranslations("starter.celebrate");
  const toasted = useRef(false);
  useEffect(() => {
    if (toasted.current) return;
    toasted.current = true;
    onToast();
  }, [onToast]);

  return (
    <Card className="relative overflow-hidden border-emerald-300 bg-gradient-to-br from-emerald-500/10 via-background to-amber-400/10">
      <ConfettiOverlay />
      <CardContent className="relative grid gap-6 p-8 text-center md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <PartyPopper className="h-7 w-7 text-emerald-600 dark:text-emerald-300" />
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mx-auto max-w-xl text-base text-muted-foreground">
          {t("body")}
        </p>
        {result.firstRun ? (
          <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-center gap-2 text-amber-500">
                <Trophy className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  {t("xpLabel")}
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold">
                +{result.xpAwarded.toLocaleString(locale)}
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-center gap-2 text-orange-500">
                <Flame className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  {t("streakLabel")}
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold">
                {t("streakValue", { days: result.streakDays })}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("repeatHint")}</p>
        )}
        <div className="mx-auto flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <Button size="lg" className="flex-1" onClick={onAssessment}>
            {t("nextCta")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="ghost" onClick={onDashboard}>
            {t("dashboardCta")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfettiOverlay() {
  const pieces = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {pieces.map((i) => {
        const left = (i * 37) % 100;
        const delay = (i % 8) * 90;
        const duration = 1200 + ((i * 53) % 800);
        const colors = ["#22c55e", "#eab308", "#3b82f6", "#ef4444", "#a855f7"];
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            className="absolute -top-3 h-2 w-2 rounded-sm opacity-80"
            style={{
              left: `${left}%`,
              backgroundColor: color,
              animation: `starter-confetti ${duration}ms ${delay}ms ease-out forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes starter-confetti {
          0% { transform: translate3d(0,0,0) rotate(0deg); opacity: 0.9; }
          100% { transform: translate3d(0, 320px, 0) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
