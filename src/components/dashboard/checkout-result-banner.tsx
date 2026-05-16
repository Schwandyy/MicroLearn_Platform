"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, X, Info } from "lucide-react";

export function CheckoutResultBanner() {
  const t = useTranslations("settings");
  const params = useSearchParams();
  const [shown, setShown] = useState<"success" | "cancelled" | null>(null);

  useEffect(() => {
    const checkout = params?.get("checkout");
    if (checkout === "success") setShown("success");
    else if (checkout === "cancelled") setShown("cancelled");
  }, [params]);

  if (!shown) return null;

  const isSuccess = shown === "success";
  return (
    <div
      className={
        isSuccess
          ? "mb-6 flex items-start gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
          : "mb-6 flex items-start gap-3 rounded-md border bg-card p-4 text-sm text-muted-foreground"
      }
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p className="flex-1">
        {isSuccess ? t("checkoutSuccess") : t("checkoutCancelled")}
      </p>
      <button
        type="button"
        onClick={() => setShown(null)}
        className="text-muted-foreground hover:text-foreground"
        aria-label="close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
