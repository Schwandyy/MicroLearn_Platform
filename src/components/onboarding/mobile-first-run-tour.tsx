"use client";

// Erst-Launch-Tour, sichtbar wenn die App nativ via Capacitor läuft oder
// als installierte PWA (display-mode: standalone). Im Browser-Tab unsichtbar.
// 3 Slides, Skip-Button, localStorage-Key — einmalig pro Gerät.

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, Sparkles, Wand2, Zap, X } from "lucide-react";

const SEEN_KEY = "ml:first-run-tour-seen";

function isNativeOrInstalled(): boolean {
  if (typeof window === "undefined") return false;
  // Capacitor: window.Capacitor existiert + isNativePlatform()
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap?.isNativePlatform?.()) return true;
  // PWA: display-mode standalone
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari home-screen
  if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) return true;
  return false;
}

export function MobileFirstRunTour() {
  const t = useTranslations("firstRun");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(SEEN_KEY) === "1") return;
    if (!isNativeOrInstalled()) return;
    setOpen(true);
  }, []);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SEEN_KEY, "1");
    }
    setOpen(false);
  };

  if (!open) return null;

  const slides = [
    {
      icon: <Sparkles className="h-8 w-8" />,
      titleKey: "s1Title" as const,
      bodyKey: "s1Body" as const,
      gradient: "from-amber-400 to-orange-500",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      titleKey: "s2Title" as const,
      bodyKey: "s2Body" as const,
      gradient: "from-emerald-400 to-teal-500",
    },
    {
      icon: <Wand2 className="h-8 w-8" />,
      titleKey: "s3Title" as const,
      bodyKey: "s3Body" as const,
      gradient: "from-violet-400 to-fuchsia-500",
    },
  ];
  const current = slides[slide]!;
  const isLast = slide === slides.length - 1;

  const next = () => {
    if (isLast) {
      dismiss();
      router.push("/start");
    } else {
      setSlide((s) => s + 1);
    }
  };

  const back = () => {
    if (slide > 0) setSlide((s) => s - 1);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex flex-col bg-background"
    >
      <header className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-2">
        <button
          type="button"
          onClick={back}
          disabled={slide === 0}
          aria-label={t("back")}
          className="rounded-full p-2 text-muted-foreground hover:bg-muted disabled:opacity-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("skip")}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          {t("skip")}
          <X className="ml-1.5 inline h-3.5 w-3.5" />
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div
          className={
            "mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br text-white shadow-lg " +
            current.gradient
          }
        >
          {current.icon}
        </div>
        <h1 className="mb-3 text-3xl font-bold leading-tight">{t(current.titleKey)}</h1>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          {t(current.bodyKey)}
        </p>
      </main>

      <footer className="flex flex-col items-center gap-4 px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        <div className="flex items-center gap-2" aria-hidden>
          {slides.map((_, i) => (
            <span
              key={i}
              className={
                "h-2 rounded-full transition-all " +
                (i === slide ? "w-6 bg-primary" : "w-2 bg-muted")
              }
            />
          ))}
        </div>
        <Button size="lg" onClick={next} className="w-full max-w-sm">
          {isLast ? t("startCta") : t("nextCta")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
