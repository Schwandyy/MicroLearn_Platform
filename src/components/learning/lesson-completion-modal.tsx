"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Award,
  Cpu,
  Flame,
  Medal,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

export type CompletionPayload = {
  xpGained: number;
  streak: { currentDays: number; gainedBonus: boolean } | null;
  newBadges: Array<{
    slug: string;
    title_de: string;
    title_en: string;
    description_de: string;
    description_en: string;
    iconKey: string | null;
    xpReward: number;
  }>;
  certificate: { publicSlug: string } | null;
};

const ICONS = {
  Sparkles,
  Award,
  Medal,
  Trophy,
  Flame,
  Cpu,
} as const;

function pickIcon(key: string | null) {
  if (!key) return Sparkles;
  return (ICONS as Record<string, typeof Sparkles>)[key] ?? Sparkles;
}

const SOUND_KEY = "ml:celebration-sound";

function playFanfare(muted: boolean) {
  if (muted) return;
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    // Dur-Akkord-Fanfare C5 E5 G5 C6 — kurz, freundlich, kein Game-Show-Theme.
    const notes = [
      { freq: 523.25, t: 0.0 },
      { freq: 659.25, t: 0.09 },
      { freq: 783.99, t: 0.18 },
      { freq: 1046.5, t: 0.32 },
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = n.freq;
      const start = now + n.t;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    }
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    // ignore
  }
}

function vibrate(pattern: number[]) {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

export function LessonCompletionModal({
  open,
  payload,
  locale,
  onClose,
}: {
  open: boolean;
  payload: CompletionPayload | null;
  locale: "de" | "en";
  onClose: () => void;
}) {
  const t = useTranslations("celebration");
  const router = useRouter();
  const [displayedXp, setDisplayedXp] = useState(0);
  const [revealedBadgeCount, setRevealedBadgeCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const playedRef = useRef(false);

  // Sound-Pref aus localStorage laden
  useEffect(() => {
    if (typeof window === "undefined") return;
    setMuted(window.localStorage.getItem(SOUND_KEY) === "0");
  }, []);

  // Bei Öffnen: Fanfare + Haptik + XP-Count + Badges nacheinander reveal
  useEffect(() => {
    if (!open || !payload || playedRef.current) return;
    playedRef.current = true;
    playFanfare(muted);
    vibrate([60, 40, 90]);
    setDisplayedXp(0);
    setRevealedBadgeCount(0);

    const target = payload.xpGained ?? 0;
    if (target > 0) {
      const steps = 30;
      const stepDur = 22;
      let i = 0;
      const id = window.setInterval(() => {
        i += 1;
        setDisplayedXp(Math.round((target * i) / steps));
        if (i >= steps) window.clearInterval(id);
      }, stepDur);
    }

    // Badges nacheinander zeigen mit kurzem Haptik-Tick
    payload.newBadges.forEach((_, idx) => {
      window.setTimeout(
        () => {
          setRevealedBadgeCount((n) => Math.max(n, idx + 1));
          vibrate([35]);
        },
        900 + idx * 700,
      );
    });
  }, [open, payload, muted]);

  // Bei Close zurücksetzen damit nächste Öffnung neu animiert
  useEffect(() => {
    if (!open) playedRef.current = false;
  }, [open]);

  const confettiPieces = useMemo(() => {
    if (!open) return [];
    return Array.from({ length: 36 }).map((_, i) => ({
      i,
      left: Math.random() * 100,
      delay: Math.random() * 350,
      duration: 1500 + Math.random() * 1400,
      hue: Math.floor(Math.random() * 360),
      size: 7 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
  }, [open]);

  if (!open || !payload) return null;

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SOUND_KEY, next ? "0" : "1");
    }
    if (!next) playFanfare(false);
  };

  const handleNext = () => {
    if (payload.certificate?.publicSlug) {
      router.push(`/certificates/${payload.certificate.publicSlug}`);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      {/* Konfetti-Layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confettiPieces.map((p) => (
          <span
            key={p.i}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size * 0.4}px`,
              backgroundColor: `hsl(${p.hue} 80% 60%)`,
              transform: `rotate(${p.rotate}deg)`,
              animation: `lc-fall ${p.duration}ms ${p.delay}ms cubic-bezier(.2,.7,.4,1) forwards`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl border bg-card p-6 shadow-2xl sm:p-8">
        <div className="absolute right-3 top-3 flex gap-1">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? t("unmute") : t("mute")}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
            <Trophy className="h-8 w-8" />
          </div>
          <h2 id="completion-title" className="text-2xl font-bold sm:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-background p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {t("xpLabel")}
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              +{displayedXp}
            </div>
          </div>
          <div className="rounded-xl border bg-background p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              {t("streakLabel")}
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              {payload.streak?.currentDays ?? 0}
            </div>
            <div className="text-[10px] uppercase text-muted-foreground">
              {t("streakDays")}
            </div>
          </div>
        </div>

        {payload.streak?.gainedBonus && (
          <p className="mt-3 rounded-lg bg-orange-500/10 px-3 py-2 text-center text-sm font-medium text-orange-600 dark:text-orange-300">
            {t("streakBonus")}
          </p>
        )}

        {payload.newBadges.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("newBadges", { count: payload.newBadges.length })}
            </div>
            <div className="space-y-2">
              {payload.newBadges.map((b, idx) => {
                const Icon = pickIcon(b.iconKey);
                const revealed = revealedBadgeCount > idx;
                return (
                  <div
                    key={b.slug}
                    className="flex items-center gap-3 rounded-xl border bg-gradient-to-br from-amber-500/10 to-background p-3 transition-all duration-500"
                    style={{
                      opacity: revealed ? 1 : 0,
                      transform: revealed
                        ? "translateY(0) scale(1)"
                        : "translateY(8px) scale(0.96)",
                    }}
                  >
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {locale === "de" ? b.title_de : b.title_en}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {locale === "de" ? b.description_de : b.description_en}
                      </div>
                    </div>
                    {b.xpReward > 0 && (
                      <div className="flex-none text-xs font-bold text-amber-600 dark:text-amber-300">
                        +{b.xpReward}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {payload.certificate && (
          <p className="mt-4 rounded-lg bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary">
            {t("certificateHint")}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={handleNext} size="lg" className="w-full">
            {payload.certificate ? t("ctaCertificate") : t("ctaNext")}
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes lc-fall {
          0% {
            transform: translate3d(0, -10vh, 0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translate3d(20px, 110vh, 0) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
