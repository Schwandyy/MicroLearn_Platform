"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="container flex min-h-[70dvh] flex-col items-center justify-center gap-6 py-12 text-center">
      <AlertTriangle className="h-12 w-12 text-amber-500" />
      <div className="max-w-md space-y-2">
        <h1 className="text-3xl font-bold">{t("error500Title")}</h1>
        <p className="text-muted-foreground">{t("error500Body")}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} variant="default">
          <RotateCcw className="mr-2 h-4 w-4" />
          {t("tryAgain")}
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            {t("backHome")}
          </Link>
        </Button>
      </div>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          ref: {error.digest}
        </p>
      )}
    </div>
  );
}
