"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

export function DangerZone() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState("");
  const keyword = t("deleteConfirmKeyword");
  const ready = confirm.trim().toUpperCase() === keyword.toUpperCase();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ready) return;
    startTransition(async () => {
      const res = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirm.trim().toUpperCase() }),
      });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      toast({ title: t("deleteSuccess") });
      await signOut({ callbackUrl: "/" });
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="confirm">{t("deleteConfirmLabel")}</Label>
        <Input
          id="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={keyword}
          autoComplete="off"
        />
      </div>
      <Button
        type="submit"
        variant="destructive"
        disabled={!ready || isPending}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {t("deleteButton")}
      </Button>
    </form>
  );
}
