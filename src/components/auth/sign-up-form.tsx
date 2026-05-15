"use client";

import { useTransition } from "react";
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

export function SignUpForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "");
    startTransition(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: t("signUpTitle"),
          description: body?.error ?? "Sign-up failed.",
          variant: "destructive",
        });
        return;
      }
      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (login?.error) {
        router.push("/auth/sign-in");
        return;
      }
      await maybeStorePasswordCredential(email, password, name);
      router.refresh();
      router.push("/assessment");
    });
  };

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/assessment" })}
        >
          <Mail className="mr-2 h-4 w-4" />
          {t("continueWith", { provider: "Google" })}
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={() => signIn("github", { callbackUrl: "/assessment" })}
        >
          <Github className="mr-2 h-4 w-4" />
          {t("continueWith", { provider: "GitHub" })}
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={() => signIn("apple", { callbackUrl: "/assessment" })}
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

      <form onSubmit={onSubmit} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="name">{t("studentUsername")}</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>
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
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {t("submit")}
        </Button>
      </form>
    </div>
  );
}
