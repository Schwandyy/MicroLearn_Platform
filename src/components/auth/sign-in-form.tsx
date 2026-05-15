"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { maybeStorePasswordCredential } from "@/lib/credential-store";

/**
 * Stellt sicher, dass eine callbackUrl nur intern auf unsere App zeigt.
 * Open-Redirect-Schutz: niemals nach extern weiterleiten.
 */
function sanitizeCallback(raw: string | null): string {
  if (!raw) return "/dashboard";
  // muss mit einem einzelnen Slash beginnen (also relativ, kein „//foo")
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export function SignInForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { toast } = useToast();
  const params = useSearchParams();
  const callbackUrl = sanitizeCallback(params?.get("callbackUrl") ?? null);
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"email" | "student">("email");

  const onEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast({
          title: t("signInTitle"),
          description: "Invalid credentials.",
          variant: "destructive",
        });
        return;
      }
      await maybeStorePasswordCredential(email, password);
      router.refresh();
      // Hard navigation, damit Server Components (auth()) den frischen Cookie sehen
      window.location.href = callbackUrl;
    });
  };

  const onStudentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await signIn("student-code", {
        code: data.get("code"),
        username: data.get("username"),
        redirect: false,
      });
      if (res?.error) {
        toast({
          title: t("studentCodeTitle"),
          description: "Code invalid or username taken.",
          variant: "destructive",
        });
        return;
      }
      router.refresh();
      window.location.href = callbackUrl;
    });
  };

  return (
    <div className="grid gap-6">
      {mode === "email" ? (
        <>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
            >
              <Mail className="mr-2 h-4 w-4" />
              {t("continueWith", { provider: "Google" })}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => signIn("github", { callbackUrl })}
            >
              <Github className="mr-2 h-4 w-4" />
              {t("continueWith", { provider: "GitHub" })}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => signIn("apple", { callbackUrl })}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              {t("continueWith", { provider: "Apple" })}
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <Separator className="flex-1" />
            {t("or")}
            <Separator className="flex-1" />
          </div>

          <form onSubmit={onEmailSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {t("submit")}
            </Button>
          </form>

          <button
            type="button"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setMode("student")}
          >
            {t("studentCodeAccess")}
          </button>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t("studentCodeTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("studentCodeHint")}
            </p>
          </div>
          <form onSubmit={onStudentSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="code">{t("studentCodeLabel")}</Label>
              <Input
                id="code"
                name="code"
                inputMode="text"
                autoCapitalize="characters"
                maxLength={12}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="username">{t("studentUsername")}</Label>
              <Input
                id="username"
                name="username"
                autoComplete="off"
                required
                pattern="[A-Za-z0-9_\-]{3,40}"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {t("submit")}
            </Button>
          </form>
          <button
            type="button"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setMode("email")}
          >
            ← {t("signInTitle")}
          </button>
        </>
      )}
    </div>
  );
}
