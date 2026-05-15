"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    startTransition(async () => {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t("forgotSent")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {t("forgotSubmit")}
      </Button>
    </form>
  );
}
