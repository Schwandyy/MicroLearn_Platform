"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";

export function CreateClassroomForm() {
  const t = useTranslations("classroom");
  const [name, setName] = useState("");
  const [curriculumTag, setCurriculumTag] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          curriculumTag: curriculumTag.trim() || null,
        }),
      });
      if (!res.ok) {
        toast({ title: "Fehler", variant: "destructive" });
        return;
      }
      setName("");
      setCurriculumTag("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("namePlaceholder")}
        required
      />
      <Input
        value={curriculumTag}
        onChange={(e) => setCurriculumTag(e.target.value)}
        placeholder={t("curriculumPlaceholder")}
      />
      <Button type="submit" disabled={isPending || !name.trim()}>
        {t("create")}
      </Button>
    </form>
  );
}
