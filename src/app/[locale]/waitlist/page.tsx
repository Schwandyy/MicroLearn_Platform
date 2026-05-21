import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { Zap, BookOpen, Bot } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "waitlist" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: true, follow: true },
  };
}

export default async function WaitlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("waitlist");
  const l = locale as "de" | "en";

  const confirmedParam = sp["confirmed"];
  const confirmedStatus =
    confirmedParam === "ok"
      ? "ok"
      : confirmedParam === "expired"
        ? "expired"
        : confirmedParam === "invalid"
          ? "invalid"
          : null;

  const features = [
    { icon: BookOpen, label: t("feature1") },
    { icon: Bot, label: t("feature2") },
    { icon: Zap, label: t("feature3") },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-xl">
        {/* Badge */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
            {t("badge")}
          </span>
        </div>

        {/* Headline */}
        <h1 className="mb-4 text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t("headline")}
        </h1>
        <p className="mb-8 text-center text-lg text-muted-foreground">
          {t("subheadline")}
        </p>

        {/* Form */}
        <WaitlistForm locale={l} confirmedStatus={confirmedStatus} />

        {/* Social proof */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t("noSpam")}
        </p>

        {/* Feature highlights */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center"
            >
              <Icon className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
