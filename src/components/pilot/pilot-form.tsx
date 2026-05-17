"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

const DE_STATES = [
  "BW",
  "BY",
  "BE",
  "BB",
  "HB",
  "HH",
  "HE",
  "MV",
  "NI",
  "NRW",
  "RP",
  "SL",
  "SN",
  "ST",
  "SH",
  "TH",
] as const;
const AT_CH = ["AT", "CH", "LI", "OTHER"] as const;

export function PilotForm() {
  const t = useTranslations("Pilot");
  const tc = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState<{
    until: string;
    school: string;
  } | null>(null);

  const [form, setForm] = useState({
    schoolName: "",
    state: "BW" as (typeof DE_STATES)[number] | (typeof AT_CH)[number],
    country: "DE",
    contactEmail: "",
    estimatedStudentCount: "" as string,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/institution/start-pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: form.schoolName.trim(),
          state: form.state,
          country: form.country,
          contactEmail: form.contactEmail.trim(),
          estimatedStudentCount: form.estimatedStudentCount
            ? Number(form.estimatedStudentCount)
            : undefined,
        }),
      });
      if (!res.ok) {
        toast({
          title: tc("error"),
          description: (await res.text().catch(() => undefined)) ?? undefined,
          variant: "destructive",
        });
        return;
      }
      const data = (await res.json()) as {
        trialEndsAt?: string;
      };
      setSubmitted({
        school: form.schoolName,
        until: data.trialEndsAt
          ? new Date(data.trialEndsAt).toLocaleDateString()
          : "",
      });
      toast({ title: t("toastSuccess") });
      router.refresh();
    });
  };

  if (submitted) {
    return (
      <div className="space-y-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm dark:bg-emerald-950/30">
        <div className="flex items-center gap-2 font-medium text-emerald-900 dark:text-emerald-100">
          <CheckCircle2 className="h-5 w-5" />
          {t("successTitle", { school: submitted.school })}
        </div>
        <p className="text-emerald-900/80 dark:text-emerald-100/80">
          {t("successBody", { until: submitted.until })}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push("/classroom")}>{t("ctaClassroom")}</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            {t("ctaDashboard")}
          </Button>
        </div>
      </div>
    );
  }

  const states = form.country === "DE" ? DE_STATES : AT_CH;

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-2">
        <Label htmlFor="schoolName">{t("fieldSchool")}</Label>
        <Input
          id="schoolName"
          required
          minLength={2}
          value={form.schoolName}
          onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
          placeholder={t("placeholderSchool")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="country">{t("fieldCountry")}</Label>
          <select
            id="country"
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={form.country}
            onChange={(e) => {
              const c = e.target.value;
              setForm({
                ...form,
                country: c,
                state: c === "DE" ? "BW" : "AT",
              });
            }}
          >
            <option value="DE">Deutschland</option>
            <option value="AT">Österreich</option>
            <option value="CH">Schweiz</option>
            <option value="LI">Liechtenstein</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="state">{t("fieldState")}</Label>
          <select
            id="state"
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={form.state}
            onChange={(e) =>
              setForm({
                ...form,
                state: e.target.value as typeof form.state,
              })
            }
          >
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="contactEmail">{t("fieldEmail")}</Label>
        <Input
          id="contactEmail"
          type="email"
          required
          value={form.contactEmail}
          onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          placeholder={t("placeholderEmail")}
        />
        <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="estimatedStudentCount">{t("fieldStudents")}</Label>
        <Input
          id="estimatedStudentCount"
          type="number"
          min={1}
          max={50000}
          value={form.estimatedStudentCount}
          onChange={(e) =>
            setForm({ ...form, estimatedStudentCount: e.target.value })
          }
          placeholder={t("placeholderStudents")}
        />
        <p className="text-xs text-muted-foreground">{t("studentsHint")}</p>
      </div>

      <Button type="submit" disabled={isPending} size="lg">
        {isPending ? t("submitPending") : t("submit")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t("submitFooter")}</p>
    </form>
  );
}
