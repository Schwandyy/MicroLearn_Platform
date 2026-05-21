"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  locale: "de" | "en";
  confirmedStatus?: "ok" | "invalid" | "expired" | null;
}

export function WaitlistForm({ locale, confirmedStatus }: Props) {
  const t = useTranslations("waitlist");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // UTM params captured from URL on mount (client-side only)
  const [utm, setUtm] = useState<{
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }>({});

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setUtm({
      utmSource: sp.get("utm_source") ?? undefined,
      utmMedium: sp.get("utm_medium") ?? undefined,
      utmCampaign: sp.get("utm_campaign") ?? undefined,
    });
  }, []);

  // If the user arrives after clicking the confirmation link
  if (confirmedStatus === "ok") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-6 text-center">
        <div className="text-2xl mb-2">🎉</div>
        <p className="font-semibold text-green-900 dark:text-green-100">
          {t("confirmedTitle")}
        </p>
        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
          {t("confirmedBody")}
        </p>
      </div>
    );
  }

  if (confirmedStatus === "invalid" || confirmedStatus === "expired") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="font-semibold text-destructive">{t("invalidTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {confirmedStatus === "expired"
            ? t("expiredBody")
            : t("invalidBody")}
        </p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
        <div className="text-2xl mb-2">✉️</div>
        <p className="font-semibold">{t("pendingTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("pendingBody")}</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "submitting") return;
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, ...utm }),
      });

      if (res.ok || res.status === 200) {
        setStatus("done");
      } else if (res.status === 429) {
        setErrorMsg(t("errorTooMany"));
        setStatus("error");
      } else {
        setErrorMsg(t("errorGeneric"));
        setStatus("error");
      }
    } catch {
      setErrorMsg(t("errorGeneric"));
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        required
        className="flex-1"
        disabled={status === "submitting"}
        aria-label={t("emailPlaceholder")}
      />
      <Button
        type="submit"
        disabled={status === "submitting" || !email}
        className="shrink-0"
      >
        {status === "submitting" ? t("submitting") : t("cta")}
      </Button>
      {status === "error" && (
        <p className="col-span-full text-sm text-destructive">{errorMsg}</p>
      )}
    </form>
  );
}
