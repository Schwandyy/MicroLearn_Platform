"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function JoinForm({ code }: { code: string }) {
  const t = useTranslations("auth");
  const tC = useTranslations("classroom");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const username = String(data.get("username") ?? "");
    startTransition(async () => {
      const res = await signIn("student-code", {
        code,
        username,
        redirect: false,
      });
      if (res?.error) {
        toast({
          title: tC("joinFailedTitle"),
          description: tC("joinFailedBody"),
          variant: "destructive",
        });
        return;
      }
      window.location.href = "/dashboard";
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>{t("studentCodeLabel")}</Label>
        <div className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-lg font-semibold tracking-widest">
          {code}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="username">{t("studentUsername")}</Label>
        <Input
          id="username"
          name="username"
          autoComplete="off"
          required
          pattern="[A-Za-z0-9_\-]{3,40}"
          placeholder={tC("joinUsernamePlaceholder")}
        />
        <p className="text-xs text-muted-foreground">
          {tC("joinUsernameHint")}
        </p>
      </div>
      <Button type="submit" disabled={isPending} size="lg">
        {tC("joinSubmit")}
      </Button>
    </form>
  );
}
