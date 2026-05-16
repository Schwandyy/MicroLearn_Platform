"use client";

// Wachsende Pflanze die mit dem Streak mitwächst. Ersetzt die statische
// Flamme — visualisiert Wachstum als Anker, nicht nur eine Zahl.

import { useTranslations } from "next-intl";

type Stage = {
  emoji: string;
  minDays: number;
  labelKey: "stageSeed" | "stageSeedling" | "stageSprout" | "stageBud" | "stageBloom" | "stagePotted" | "stageTree";
  bgFrom: string;
  bgTo: string;
};

const STAGES: Stage[] = [
  { emoji: "🌰", minDays: 0, labelKey: "stageSeed", bgFrom: "from-amber-100", bgTo: "to-stone-100" },
  { emoji: "🌱", minDays: 1, labelKey: "stageSeedling", bgFrom: "from-lime-100", bgTo: "to-emerald-100" },
  { emoji: "🌿", minDays: 3, labelKey: "stageSprout", bgFrom: "from-emerald-100", bgTo: "to-teal-100" },
  { emoji: "🌷", minDays: 7, labelKey: "stageBud", bgFrom: "from-pink-100", bgTo: "to-emerald-100" },
  { emoji: "🌻", minDays: 14, labelKey: "stageBloom", bgFrom: "from-yellow-100", bgTo: "to-amber-100" },
  { emoji: "🪴", minDays: 30, labelKey: "stagePotted", bgFrom: "from-emerald-200", bgTo: "to-amber-100" },
  { emoji: "🌳", minDays: 60, labelKey: "stageTree", bgFrom: "from-emerald-200", bgTo: "to-emerald-300" },
];

function pickStage(days: number): { current: Stage; next: Stage | null; daysToNext: number } {
  let current: Stage = STAGES[0]!;
  for (const s of STAGES) {
    if (days >= s.minDays) current = s;
  }
  const idx = STAGES.indexOf(current);
  const next: Stage | null = idx < STAGES.length - 1 ? STAGES[idx + 1]! : null;
  const daysToNext = next ? next.minDays - days : 0;
  return { current, next, daysToNext };
}

export function StreakPlant({
  currentDays,
  activeToday,
}: {
  currentDays: number;
  activeToday: boolean;
}) {
  const t = useTranslations("dashboard");
  const { current, next, daysToNext } = pickStage(currentDays);

  return (
    <div className="flex items-center gap-3">
      <div
        className={
          "relative flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-gradient-to-br " +
          current.bgFrom +
          " " +
          current.bgTo +
          " shadow-inner " +
          (activeToday ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-background" : "")
        }
        aria-hidden
      >
        <span className="text-4xl leading-none" role="img">
          {current.emoji}
        </span>
        {currentDays > 0 && (
          <span className="absolute -bottom-1 -right-1 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-bold tabular-nums text-white shadow ring-2 ring-background">
            {currentDays}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t(current.labelKey)}
        </div>
        <div className="text-lg font-bold tabular-nums leading-tight">
          {currentDays > 0
            ? `${currentDays} ${currentDays === 1 ? t("streakDayOne") : t("streakDayMany")}`
            : t("streakStart")}
        </div>
        {next ? (
          <div className="text-xs text-muted-foreground">
            {t("plantNext", { days: daysToNext, emoji: next.emoji })}
          </div>
        ) : (
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {t("plantMax")}
          </div>
        )}
      </div>
    </div>
  );
}
