"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (password !== confirm) {
      setError(t("passwordsMismatch"));
      return;
    }
    if (password.length < 8) {
      setError(t("resetWeak"));
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body?.error === "weak") {
          setError(t("resetWeak"));
          return;
        }
        if (body?.error === "expired" || body?.error === "invalid") {
          setError(t("resetInvalid"));
          return;
        }
        toast({ title: "Error", variant: "destructive" });
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/auth/sign-in"), 1500);
    });
  };

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t("resetSuccess")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="password">{t("newPassword")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="confirm">{t("confirmPassword")}</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {t("resetSubmit")}
      </Button>
    </form>
  );
}
