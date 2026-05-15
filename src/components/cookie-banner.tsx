"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

const STORAGE_KEY = "microlearn.consent";

export function CookieBanner() {
  const t = useTranslations("consent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const setConsent = (value: "all" | "essential") => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, ts: Date.now() }),
      );
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 px-4 py-4 backdrop-blur shadow-lg">
      <div className="container flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm">
          <div className="font-semibold">{t("title")}</div>
          <p className="mt-1 max-w-2xl text-muted-foreground">{t("body")}</p>
          <Link
            href="/legal/privacy"
            className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
          >
            {t("learnMore")}
          </Link>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Button variant="outline" onClick={() => setConsent("essential")}>
            {t("essentialOnly")}
          </Button>
          <Button onClick={() => setConsent("all")}>{t("acceptAll")}</Button>
        </div>
      </div>
    </div>
  );
}
