"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";

const STATE_OPTIONS = [
  "BW",
  "BY",
  "NRW",
  "HE",
  "SN",
  "NI",
  "RP",
  "SH",
  "BE",
  "HH",
  "BB",
  "ST",
  "MV",
  "TH",
  "SL",
  "HB",
] as const;

export function CreateClassroomForm() {
  const t = useTranslations("classroom");
  const tcurr = useTranslations("curriculum");
  const tc = useTranslations("common");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [grade, setGrade] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const gradeNum = grade ? Number.parseInt(grade, 10) : null;
    startTransition(async () => {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          state: state.trim() || null,
          grade: gradeNum && Number.isFinite(gradeNum) ? gradeNum : null,
        }),
      });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      setName("");
      setState("");
      setGrade("");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 sm:grid-cols-2 md:grid-cols-4"
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("namePlaceholder")}
        required
        className="md:col-span-2"
      />
      <select
        value={state}
        onChange={(e) => setState(e.target.value)}
        className="h-10 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">{tcurr("classroomStatePlaceholder")}</option>
        {STATE_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <Input
        type="number"
        min={1}
        max={13}
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
        placeholder={tcurr("classroomGradePlaceholder")}
      />
      <Button
        type="submit"
        disabled={isPending || !name.trim()}
        className="md:col-span-4"
      >
        {t("create")}
      </Button>
    </form>
  );
}
