"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface Initial {
  name: string;
  username: string;
  image: string;
  bio: string;
  preferredLocale: "de" | "en";
  marketingOptIn: boolean;
  weeklyDigestOptOut: boolean;
  parentEmail: string;
  monthlyParentDigestOptOut: boolean;
  isTeacher: boolean;
  isStudentCode: boolean;
}

export function ProfileForm({ initial }: { initial: Initial }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<Initial>(initial);

  const set = <K extends keyof Initial>(k: K, v: Initial[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || null,
          image: form.image || null,
          bio: form.bio || null,
          preferredLocale: form.preferredLocale,
          marketingOptIn: form.marketingOptIn,
          weeklyDigestOptOut: form.weeklyDigestOptOut,
          parentEmail: form.parentEmail || null,
          monthlyParentDigestOptOut: form.monthlyParentDigestOptOut,
        }),
      });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      toast({ title: t("saved") });
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          maxLength={80}
        />
      </div>

      {form.username && (
        <div className="grid gap-1.5">
          <Label>{t("username")}</Label>
          <Input
            value={form.username}
            disabled
            readOnly
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            {t("usernameLocked")}
          </p>
        </div>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="image">{t("avatar")}</Label>
        <Input
          id="image"
          type="url"
          placeholder="https://…"
          value={form.image}
          onChange={(e) => set("image", e.target.value)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="bio">{t("bio")}</Label>
        <textarea
          id="bio"
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={t("bioPlaceholder")}
          className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="locale">{t("locale")}</Label>
        <select
          id="locale"
          value={form.preferredLocale}
          onChange={(e) =>
            set("preferredLocale", e.target.value as "de" | "en")
          }
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.marketingOptIn}
          onCheckedChange={(v) => set("marketingOptIn", Boolean(v))}
        />
        <span>{t("marketing")}</span>
      </label>

      {form.isTeacher && (
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            id="weeklyDigest"
            checked={!form.weeklyDigestOptOut}
            onCheckedChange={(v) =>
              set("weeklyDigestOptOut", !Boolean(v))
            }
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">{t("weeklyDigest")}</span>
            <span className="block text-xs text-muted-foreground">
              {t("weeklyDigestHint")}
            </span>
          </span>
        </label>
      )}

      {!form.isStudentCode && (
        <div className="grid gap-2 rounded-xl border bg-muted/30 p-4">
          <div>
            <Label htmlFor="parentEmail" className="text-sm font-semibold">
              {t("parentEmail")}
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("parentEmailHint")}
            </p>
          </div>
          <Input
            id="parentEmail"
            type="email"
            placeholder="mama@example.com"
            value={form.parentEmail}
            onChange={(e) => set("parentEmail", e.target.value)}
            maxLength={200}
          />
          {form.parentEmail && (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                id="monthlyParentDigest"
                checked={!form.monthlyParentDigestOptOut}
                onCheckedChange={(v) =>
                  set("monthlyParentDigestOptOut", !Boolean(v))
                }
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">{t("parentMonthly")}</span>
                <span className="block text-xs text-muted-foreground">
                  {t("parentMonthlyHint")}
                </span>
              </span>
            </label>
          )}
        </div>
      )}

      <div>
        <Button type="submit" disabled={isPending}>
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
