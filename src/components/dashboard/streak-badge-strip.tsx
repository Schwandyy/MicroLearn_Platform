"use client";

import { useTranslations } from "next-intl";
import { Award, Cpu, Flame, Medal, Sparkles, Trophy } from "lucide-react";
import { Link } from "@/i18n/routing";
import { StreakPlant } from "./streak-plant";

const ICONS = { Sparkles, Award, Medal, Trophy, Flame, Cpu } as const;

function pickIcon(key: string | null) {
  if (!key) return Sparkles;
  return (ICONS as Record<string, typeof Sparkles>)[key] ?? Sparkles;
}

export type BadgeStripItem = {
  slug: string;
  title: string;
  description: string;
  iconKey: string | null;
  earnedAt: string;
};

export function StreakBadgeStrip({
  currentDays,
  longestDays,
  activeToday,
  totalXp,
  totalBadges,
  recentBadges,
}: {
  currentDays: number;
  longestDays: number;
  activeToday: boolean;
  totalXp: number;
  totalBadges: number;
  recentBadges: BadgeStripItem[];
}) {
  const t = useTranslations("dashboard");
  const dots = Array.from({ length: 7 }).map((_, i) => i < Math.min(currentDays, 7));

  return (
    <div className="mb-10 grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1.4fr_1fr] md:gap-5 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
        <StreakPlant currentDays={currentDays} activeToday={activeToday} />
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground md:ml-auto md:items-end">
          <div>
            {activeToday ? t("streakActiveToday") : t("streakInactiveToday")}
          </div>
          {longestDays > currentDays && (
            <div className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {t("streakRecord", { days: longestDays })}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {dots.map((on, i) => (
              <span
                key={i}
                className={
                  "h-2 w-2 rounded-full transition-colors " +
                  (on ? "bg-emerald-500" : "bg-muted")
                }
                aria-hidden
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:items-end">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="font-semibold tabular-nums">{totalXp.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">XP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="font-semibold tabular-nums">{totalBadges}</span>
            <span className="text-xs text-muted-foreground">{t("badges")}</span>
          </div>
        </div>
        {recentBadges.length > 0 ? (
          <div className="flex items-center gap-2">
            {recentBadges.slice(0, 4).map((b) => {
              const Icon = pickIcon(b.iconKey);
              return (
                <span
                  key={b.slug}
                  title={`${b.title} — ${b.description}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-300"
                >
                  <Icon className="h-4 w-4" />
                </span>
              );
            })}
            <Link
              href="/dashboard"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {t("badgesAll")} →
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("badgesNone")}</p>
        )}
      </div>
    </div>
  );
}
