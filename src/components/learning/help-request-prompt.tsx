"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CircleHelp, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SHOW_AFTER_MS = 8 * 60_000;
const DISMISS_TTL_MS = 30 * 60_000;

function storageKey(lessonId: string): string {
  return `ml:help-dismissed:${lessonId}`;
}

function readDismissedUntil(lessonId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(storageKey(lessonId));
  if (!raw) return 0;
  const num = Number.parseInt(raw, 10);
  return Number.isFinite(num) ? num : 0;
}

function writeDismissedUntil(lessonId: string, ms: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(lessonId), String(ms));
}

/**
 * Dezenter Hilfe-Banner. Erscheint nach SHOW_AFTER_MS Lesson-Aktivität,
 * 1× pro DISMISS_TTL_MS pro Lesson + Browser. Verschwindet sofort nach
 * Hilferuf + zeigt 12 s lang einen Bestätigungs-Strip.
 */
export function HelpRequestPrompt({
  lessonId,
}: {
  lessonId: string;
}) {
  const t = useTranslations("help");
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (readDismissedUntil(lessonId) > Date.now()) return;
    const elapsed = Date.now() - startedAtRef.current;
    const wait = Math.max(0, SHOW_AFTER_MS - elapsed);
    const timer = window.setTimeout(() => setVisible(true), wait);
    return () => window.clearTimeout(timer);
  }, [lessonId]);

  useEffect(() => {
    if (!confirmed) return;
    const timer = window.setTimeout(() => {
      setConfirmed(false);
      setVisible(false);
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [confirmed]);

  const dismiss = () => {
    setVisible(false);
    writeDismissedUntil(lessonId, Date.now() + DISMISS_TTL_MS);
  };

  const askForHelp = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/help-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      if (!res.ok) {
        toast({ title: t("error"), variant: "destructive" });
        return;
      }
      setConfirmed(true);
      writeDismissedUntil(lessonId, Date.now() + DISMISS_TTL_MS);
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (!visible && !confirmed) return null;

  if (confirmed) {
    return (
      <div className="pointer-events-auto fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 mx-auto max-w-md rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-lg dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100 md:bottom-24">
        <div className="flex items-center gap-3 text-sm font-medium">
          <Check className="h-4 w-4 shrink-0" />
          <span className="flex-1">{t("confirmed")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 mx-auto max-w-md rounded-2xl border bg-card px-4 py-3 shadow-lg md:bottom-24">
      <div className="flex items-start gap-3">
        <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="flex-1 grid gap-2">
          <p className="text-sm font-medium leading-snug">{t("title")}</p>
          <p className="text-xs text-muted-foreground">{t("body")}</p>
          <div className="mt-1 flex items-center gap-2">
            <Button size="sm" onClick={askForHelp} disabled={sending}>
              {sending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              {t("cta")}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              {t("dismiss")}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="dismiss"
          className="rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
