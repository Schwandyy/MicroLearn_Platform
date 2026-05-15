"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "./image-upload";

export function NewProjectForm() {
  const t = useTranslations("projects");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPublic, setIsPublic] = useState(true);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title") ?? ""),
      body: String(fd.get("body") ?? ""),
      coverImage: String(fd.get("coverImage") ?? ""),
      isPublic,
    };
    startTransition(async () => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: t("createTitle"),
          description: json?.error ?? "Error",
          variant: "destructive",
        });
        return;
      }
      router.push(`/projects/${json.slug}`);
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="title">{t("fieldTitle")}</Label>
        <Input
          id="title"
          name="title"
          required
          minLength={3}
          maxLength={120}
          placeholder={t("fieldTitlePlaceholder")}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="body">{t("fieldBody")}</Label>
        <textarea
          id="body"
          name="body"
          required
          minLength={10}
          maxLength={8000}
          rows={8}
          placeholder={t("fieldBodyPlaceholder")}
          className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="grid gap-1.5">
        <Label>{t("uploadOrUrl")}</Label>
        <ImageUpload name="coverImage" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={isPublic}
          onCheckedChange={(v) => setIsPublic(Boolean(v))}
        />
        <span>{t("fieldPublic")}</span>
      </label>
      <p className="text-xs text-muted-foreground">
        {isPublic ? t("publicHint") : t("private")}
      </p>
      <Button type="submit" disabled={isPending} size="lg">
        {t("submit")}
      </Button>
    </form>
  );
}
