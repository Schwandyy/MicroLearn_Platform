"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

/**
 * Dezenter Banner an einer Lesson, die noch nicht auf echter Hardware
 * verifiziert wurde. Lehrer:innen sehen das als „Warnung" und können
 * der Klasse mitteilen, dass Schaltbilder oder Code-Snippets noch
 * Anpassungen brauchen könnten.
 */
export function UnverifiedLessonBanner() {
  const t = useTranslations("unverified");
  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="container flex items-center gap-3 text-xs sm:text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="flex-1">
          <strong>{t("title")}:</strong> {t("body")}
        </span>
      </div>
    </div>
  );
}
