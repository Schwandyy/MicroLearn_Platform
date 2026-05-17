import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireAdmin } from "@/server/lib/admin";
import { prisma } from "@/server/db/prisma";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/lib/utils";
import { HardwareVerificationCockpit } from "@/components/admin/hardware-verification-cockpit";

export default async function HardwareVerificationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();
  const t = await getTranslations({ locale, namespace: "AdminHardwareVerification" });

  const lessons = await prisma.lesson.findMany({
    where: { isPublished: true },
    orderBy: [{ courseId: "asc" }, { sortOrder: "asc" }],
    include: {
      course: { select: { id: true, slug: true, title_de: true, title_en: true } },
      bom: { select: { id: true } },
      steps: { select: { id: true } },
      verifications: {
        orderBy: { verifiedAt: "desc" },
        take: 1,
        select: { verifiedAt: true, verifiedBy: true, passed: true },
      },
    },
  });

  const l = locale as Locale;
  const items = lessons.map((lesson) => ({
    id: lesson.id,
    slug: lesson.slug,
    title: pickLocalized(lesson, "title", l),
    courseTitle: lesson.course ? pickLocalized(lesson.course, "title", l) : "",
    courseSlug: lesson.course?.slug ?? "",
    bomCount: lesson.bom.length,
    stepCount: lesson.steps.length,
    estimatedMinutes: lesson.estimatedMinutes ?? null,
    verifiedAt: lesson.verifiedOnHardwareAt?.toISOString() ?? null,
    lastAttemptAt: lesson.verifications[0]?.verifiedAt?.toISOString() ?? null,
    lastAttemptPassed: lesson.verifications[0]?.passed ?? null,
    checklist: (lesson.verificationChecklist as Record<string, boolean | string | null> | null) ?? null,
  }));

  const total = items.length;
  const verified = items.filter((i) => i.verifiedAt).length;
  const pending = items.filter((i) => !i.verifiedAt && i.lastAttemptAt).length;
  const untouched = total - verified - pending;
  const progressPct = total === 0 ? 0 : Math.round((verified / total) * 100);

  return (
    <div className="container max-w-6xl py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("statsTotal")} value={total} tone="default" />
        <StatCard label={t("statsVerified")} value={verified} tone="success" />
        <StatCard label={t("statsPending")} value={pending} tone="warn" />
        <StatCard label={t("statsUntouched")} value={untouched} tone="danger" />
      </div>

      <div className="mb-6 rounded-xl border bg-card p-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium">{t("progressLabel")}</span>
          <span className="tabular-nums text-muted-foreground">
            {verified} / {total} ({progressPct}%)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <HardwareVerificationCockpit items={items} locale={l} />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "success" | "warn" | "danger";
}) {
  const ring =
    tone === "success"
      ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
      : tone === "warn"
      ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
      : tone === "danger"
      ? "border-rose-300 bg-rose-50 dark:bg-rose-950/30"
      : "bg-card";
  return (
    <div className={`rounded-xl border p-4 ${ring}`}>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
